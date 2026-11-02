import { randomBytes, randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents, ServerToClientEvents, RoomSnapshot, GameMode, Locale,
  QuizCategory, WordRound, QuizReveal, QuizQuestion, CreateRoomPayload
} from '@same-word/shared';
import { pickQuestions } from './questions.js';

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface Player {
  id: string; nickname: string; locale: Locale; sessionToken: string;
  socketId: string | null; connected: boolean; submitted: boolean;
}

interface Room {
  code: string; mode: GameMode; phase: RoomSnapshot['phase']; maxPlayers: 2|3|4;
  roundSeconds: number; hostId: string; players: Player[]; round: number; roundId: string;
  deadline: number | null; submissions: Map<string,string>; wordHistory: WordRound[];
  currentReveal: WordRound | null; finalWord: string | null;
  quizCategory: QuizCategory; quizTotal: 5|10|15; quizIndex: number;
  quizQuestions: QuizQuestion[]; quizHistory: QuizReveal[]; compatibility: number | null;
  timer: NodeJS.Timeout | null; transitionTimer: NodeJS.Timeout | null; updatedAt: number;
}

const normalizeWord = (value: string) => value.normalize('NFC').trim();
const safeNickname = (value: string) => value.normalize('NFC').trim().slice(0, 16);

export class RoomManager {
  private rooms = new Map<string,Room>();
  private countdownMs = Number(process.env.COUNTDOWN_MS || 1400);
  private revealMs = Number(process.env.REVEAL_MS || 2600);
  constructor(private io: IOServer, private ttlMinutes = 120) {
    setInterval(() => this.cleanup(), 60_000).unref();
  }

  bind(socket: GameSocket) {
    socket.on('room:create', (payload, ack) => {
      try {
        const nickname = safeNickname(payload.nickname);
        if (!nickname) return ack({ok:false,error:'请输入昵称'});
        const room = this.createRoom({...payload,nickname});
        const player = this.addPlayer(room, nickname, payload.locale, socket);
        ack({ok:true});
        socket.emit('room:joined',{code:room.code,playerId:player.id,sessionToken:player.sessionToken});
        this.emit(room);
      } catch (error) { ack({ok:false,error:(error as Error).message}); }
    });

    socket.on('room:join', (payload, ack) => {
      const room = this.rooms.get(payload.code.trim().toUpperCase());
      if (!room) return ack({ok:false,error:'房间不存在或已过期'});
      if (room.players.length >= room.maxPlayers) return ack({ok:false,error:'房间已满'});
      if (room.phase !== 'LOBBY') return ack({ok:false,error:'游戏已经开始'});
      const nickname = safeNickname(payload.nickname);
      if (!nickname) return ack({ok:false,error:'请输入昵称'});
      if (room.players.some(p => p.nickname === nickname)) return ack({ok:false,error:'房间内已有同名玩家'});
      const player = this.addPlayer(room,nickname,payload.locale,socket);
      ack({ok:true});
      socket.emit('room:joined',{code:room.code,playerId:player.id,sessionToken:player.sessionToken});
      this.emit(room);
    });

    socket.on('room:resume', (payload, ack) => {
      const room = this.rooms.get(payload.code.toUpperCase());
      const player = room?.players.find(p => p.id === payload.playerId && p.sessionToken === payload.sessionToken);
      if (!room || !player) return ack({ok:false,error:'无法恢复身份，请重新加入'});
      player.socketId = socket.id; player.connected = true; room.updatedAt = Date.now();
      socket.join(room.code); ack({ok:true}); this.emit(room);
      socket.emit('game:notice',{type:'reconnected',message:'已恢复游戏'});
    });

    socket.on('answer:submit', (payload, ack) => {
      const auth = this.auth(payload.code,payload.playerId,payload.sessionToken);
      if (!auth) return ack({ok:false,error:'身份验证失败'});
      const {room,player} = auth;
      if (room.phase !== 'ROUND_INPUT' || payload.roundId !== room.roundId)
        return ack({ok:false,error:'本轮已结束，请等待同步'});
      if (player.submitted) return ack({ok:true});
      const answer = room.mode === 'word' ? normalizeWord(payload.answer).slice(0,32) : payload.answer;
      if (!answer) return ack({ok:false,error:'请先填写答案'});
      if (room.mode === 'quiz' && !['A','B','C'].includes(answer)) return ack({ok:false,error:'无效选项'});
      room.submissions.set(player.id,answer); player.submitted = true; room.updatedAt = Date.now();
      ack({ok:true}); this.emit(room);
      if (room.players.every(p => p.submitted)) this.finishRound(room,room.roundId);
    });

    socket.on('game:restart', (payload, ack) => {
      const auth = this.auth(payload.code,payload.playerId,payload.sessionToken);
      if (!auth) return ack({ok:false,error:'身份验证失败'});
      const {room,player} = auth;
      if (player.id !== room.hostId) return ack({ok:false,error:'仅房主可以再来一局'});
      this.resetRoom(room); ack({ok:true});
    });

    socket.on('game:start', (payload, ack) => {
      const auth = this.auth(payload.code,payload.playerId,payload.sessionToken);
      if (!auth) return ack({ok:false,error:'身份验证失败'});
      const {room,player} = auth;
      if (player.id !== room.hostId) return ack({ok:false,error:'仅房主可以开始游戏'});
      if (room.phase !== 'LOBBY') return ack({ok:false,error:'游戏已经开始'});
      if (room.players.length !== room.maxPlayers) return ack({ok:false,error:'请等待所有玩家加入'});
      this.startIfReady(room); ack({ok:true});
    });

    socket.on('room:leave', (payload, ack) => {
      const auth = this.auth(payload.code,payload.playerId,payload.sessionToken);
      if (!auth) return ack({ok:false,error:'身份验证失败'});
      this.removePlayer(auth.room,auth.player.id); ack({ok:true});
    });

    socket.on('disconnect', () => {
      for (const room of this.rooms.values()) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) { player.connected = false; player.socketId = null; room.updatedAt = Date.now(); this.emit(room); }
      }
    });
  }

  private createRoom(payload: CreateRoomPayload): Room {
    let code = ''; do { code = String(Math.floor(100000 + Math.random()*900000)); } while(this.rooms.has(code));
    const quizCategory = payload.quizCategory ?? 'life';
    const quizTotal = payload.quizTotal ?? 5;
    const room: Room = {code,mode:payload.mode,phase:'LOBBY',maxPlayers:payload.maxPlayers,
      roundSeconds:Math.max(10,Math.min(180,payload.roundSeconds)),hostId:'',players:[],round:0,
      roundId:randomUUID(),deadline:null,submissions:new Map(),wordHistory:[],currentReveal:null,
      finalWord:null,quizCategory,quizTotal,quizIndex:0,quizQuestions:pickQuestions(quizCategory,quizTotal),
      quizHistory:[],compatibility:null,timer:null,transitionTimer:null,updatedAt:Date.now()};
    this.rooms.set(code,room); return room;
  }

  private addPlayer(room:Room,nickname:string,locale:Locale,socket:GameSocket):Player {
    const player: Player = {id:randomUUID(),nickname,locale,sessionToken:randomBytes(24).toString('hex'),
      socketId:socket.id,connected:true,submitted:false};
    room.players.push(player); if (!room.hostId) room.hostId = player.id;
    room.updatedAt=Date.now(); socket.join(room.code); return player;
  }

  private startIfReady(room:Room) {
    if (room.phase !== 'LOBBY' || room.players.length !== room.maxPlayers) return;
    room.phase='COUNTDOWN'; this.emit(room);
    room.transitionTimer=setTimeout(()=>this.beginRound(room),this.countdownMs);
  }

  private beginRound(room:Room) {
    if (!this.rooms.has(room.code)) return;
    room.phase='ROUND_INPUT'; room.round += 1; room.roundId=randomUUID(); room.currentReveal=null;
    room.submissions.clear(); room.players.forEach(p=>p.submitted=false);
    room.deadline=Date.now()+room.roundSeconds*1000; room.updatedAt=Date.now(); this.emit(room);
    const roundId=room.roundId;
    room.timer=setTimeout(()=>this.finishRound(room,roundId),room.roundSeconds*1000);
  }

  private finishRound(room:Room,roundId:string) {
    if (room.phase !== 'ROUND_INPUT' || room.roundId !== roundId) return;
    if (room.timer) clearTimeout(room.timer); room.timer=null; room.phase='ROUND_REVEAL'; room.deadline=null;
    if (room.mode === 'word') {
      const results=room.players.map(p=>({playerId:p.id,nickname:p.nickname,answer:room.submissions.get(p.id) ?? null}));
      const values=results.map(r=>r.answer).filter((x):x is string=>Boolean(x));
      const matched=values.length===room.players.length && new Set(values).size===1;
      const reveal:WordRound={round:room.round,results,matched}; room.currentReveal=reveal; room.wordHistory.push(reveal);
      if (matched) room.finalWord=values[0];
      this.emit(room);
      room.transitionTimer=setTimeout(()=> matched ? this.finishGame(room) : this.beginRound(room),this.revealMs);
    } else {
      const question=room.quizQuestions[room.quizIndex];
      const answers=room.players.map(p=>({playerId:p.id,nickname:p.nickname,optionId:room.submissions.get(p.id) ?? null}));
      const values=answers.map(a=>a.optionId).filter(Boolean);
      const matched=values.length===room.players.length && new Set(values).size===1;
      const reveal:QuizReveal={questionId:question.id,question,answers,matched}; room.quizHistory.push(reveal);
      this.emit(room);
      room.transitionTimer=setTimeout(()=>{
        room.quizIndex += 1;
        if (room.quizIndex >= room.quizQuestions.length) this.finishGame(room); else this.beginRound(room);
      },this.revealMs);
    }
  }

  private finishGame(room:Room) {
    room.phase='GAME_FINISHED'; room.deadline=null;
    if (room.mode==='quiz') room.compatibility=Math.round(room.quizHistory.filter(x=>x.matched).length/room.quizHistory.length*100);
    this.emit(room);
  }

  private resetRoom(room:Room) {
    if(room.timer) clearTimeout(room.timer); if(room.transitionTimer) clearTimeout(room.transitionTimer);
    room.phase='LOBBY'; room.round=0; room.roundId=randomUUID(); room.deadline=null; room.submissions.clear();
    room.wordHistory=[]; room.currentReveal=null; room.finalWord=null; room.quizIndex=0;
    room.quizHistory=[]; room.compatibility=null; room.quizQuestions=pickQuestions(room.quizCategory,room.quizTotal);
    room.players.forEach(p=>p.submitted=false); room.updatedAt=Date.now(); this.emit(room);
  }

  private auth(code:string,playerId:string,token:string) {
    const room=this.rooms.get(code.toUpperCase()); const player=room?.players.find(p=>p.id===playerId&&p.sessionToken===token);
    return room&&player ? {room,player} : null;
  }

  private removePlayer(room:Room,playerId:string) {
    room.players=room.players.filter(p=>p.id!==playerId); room.submissions.delete(playerId);
    if (!room.players.length) { this.dispose(room); return; }
    if(room.hostId===playerId) room.hostId=room.players[0].id;
    room.updatedAt=Date.now(); this.emit(room);
  }

  private snapshot(room:Room):RoomSnapshot {
    return {code:room.code,mode:room.mode,phase:room.phase,maxPlayers:room.maxPlayers,
      roundSeconds:room.roundSeconds,hostId:room.hostId,players:room.players.map(p=>({id:p.id,nickname:p.nickname,
      connected:p.connected,isHost:p.id===room.hostId,submitted:p.submitted,locale:p.locale})),round:room.round,
      roundId:room.roundId,deadline:room.deadline,wordHistory:room.wordHistory,currentReveal:room.currentReveal,
      finalWord:room.finalWord,quizCategory:room.quizCategory,quizTotal:room.quizTotal,quizIndex:room.quizIndex,
      currentQuestion:room.mode==='quiz'&&room.phase!=='LOBBY' ? room.quizQuestions[room.quizIndex]??null:null,
      quizHistory:room.quizHistory,compatibility:room.compatibility};
  }

  private emit(room:Room){ this.io.to(room.code).emit('room:snapshot',this.snapshot(room)); }
  private dispose(room:Room){ if(room.timer)clearTimeout(room.timer);if(room.transitionTimer)clearTimeout(room.transitionTimer);this.rooms.delete(room.code); }
  private cleanup(){const cutoff=Date.now()-this.ttlMinutes*60_000;for(const room of this.rooms.values())if(room.updatedAt<cutoff)this.dispose(room);}
}
