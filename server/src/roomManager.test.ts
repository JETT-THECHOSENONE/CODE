import { afterEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from './app.js';
import type { RoomSnapshot } from '@same-word/shared';

const openSockets: ClientSocket[]=[];
process.env.COUNTDOWN_MS='30';process.env.REVEAL_MS='30';
afterEach(()=>openSockets.splice(0).forEach(s=>s.close()));

function once<T>(socket:ClientSocket,event:string,timeout=5000):Promise<T>{
  return new Promise((resolve,reject)=>{const id=setTimeout(()=>reject(new Error(`timeout: ${event}`)),timeout);socket.once(event,(data:T)=>{clearTimeout(id);resolve(data)})});
}
function snapshot(socket:ClientSocket,predicate:(s:RoomSnapshot)=>boolean,timeout=7000):Promise<RoomSnapshot>{
  return new Promise((resolve,reject)=>{const id=setTimeout(()=>{socket.off('room:snapshot',handler);reject(new Error('snapshot timeout'))},timeout);const handler=(s:RoomSnapshot)=>{if(predicate(s)){clearTimeout(id);socket.off('room:snapshot',handler);resolve(s)}};socket.on('room:snapshot',handler)});
}
function emitAck(socket:ClientSocket,event:string,payload:unknown):Promise<{ok:boolean;error?:string}>{return new Promise(resolve=>socket.emit(event,payload,resolve))}

describe('real-time room lifecycle',()=>{
  it('keeps answers secret, reveals together, and finishes a two-player match',async()=>{
    const {httpServer}=createApp();await new Promise<void>(resolve=>httpServer.listen(0,resolve));
    const address=httpServer.address();if(!address||typeof address==='string')throw new Error('no port');const url=`http://127.0.0.1:${address.port}`;
    const a=connect(url,{transports:['websocket']});const b=connect(url,{transports:['websocket']});openSockets.push(a,b);
    await Promise.all([once(a,'connect'),once(b,'connect')]);
    const aJoined=once<{code:string;playerId:string;sessionToken:string}>(a,'room:joined');
    expect((await emitAck(a,'room:create',{nickname:'小岚',mode:'word',maxPlayers:2,roundSeconds:30,locale:'zh'})).ok).toBe(true);
    const aid=await aJoined;
    const bJoined=once<{code:string;playerId:string;sessionToken:string}>(b,'room:joined');
    expect((await emitAck(b,'room:join',{code:aid.code,nickname:'阿海',locale:'zh'})).ok).toBe(true);
    const bid=await bJoined;
    expect((await emitAck(a,'game:start',aid)).ok).toBe(true);
    const input=await snapshot(a,s=>s.phase==='ROUND_INPUT');
    expect(input.wordHistory).toEqual([]);
    expect(Object.keys(input).some(k=>k.toLowerCase().includes('submission'))).toBe(false);
    await emitAck(a,'answer:submit',{...aid,roundId:input.roundId,answer:'苹果'});
    const afterOne=await snapshot(b,s=>s.phase==='ROUND_INPUT'&&s.players.some(p=>p.id===aid.playerId&&p.submitted));
    expect(afterOne.currentReveal).toBeNull();
    const revealPromise=snapshot(a,s=>s.phase==='ROUND_REVEAL');
    await emitAck(b,'answer:submit',{...bid,roundId:input.roundId,answer:'苹果'});
    const reveal=await revealPromise;
    expect(reveal.currentReveal?.matched).toBe(true);
    expect(reveal.currentReveal?.results.map(r=>r.answer)).toEqual(['苹果','苹果']);
    const finished=await snapshot(a,s=>s.phase==='GAME_FINISHED');
    expect(finished.finalWord).toBe('苹果');expect(finished.round).toBe(1);
    a.close();b.close();
    await new Promise<void>(resolve=>httpServer.close(()=>resolve()));
  },20000);

  it('enforces a four-player room limit and requires every answer to match',async()=>{
    const {httpServer}=createApp();await new Promise<void>(resolve=>httpServer.listen(0,resolve));
    const address=httpServer.address();if(!address||typeof address==='string')throw new Error('no port');const url=`http://127.0.0.1:${address.port}`;
    const clients=Array.from({length:5},()=>connect(url,{transports:['websocket']}));openSockets.push(...clients);
    await Promise.all(clients.map(s=>once(s,'connect')));
    const hostJoined=once<{code:string;playerId:string;sessionToken:string}>(clients[0],'room:joined');
    await emitAck(clients[0],'room:create',{nickname:'P1',mode:'word',maxPlayers:4,roundSeconds:30,locale:'zh'});const host=await hostJoined;
    const ids=[host];
    for(let i=1;i<4;i++){const joined=once<{code:string;playerId:string;sessionToken:string}>(clients[i],'room:joined');expect((await emitAck(clients[i],'room:join',{code:host.code,nickname:`P${i+1}`,locale:'zh'})).ok).toBe(true);ids.push(await joined)}
    expect((await emitAck(clients[4],'room:join',{code:host.code,nickname:'P5',locale:'zh'})).error).toBe('房间已满');
    expect((await emitAck(clients[0],'game:start',host)).ok).toBe(true);
    const input=await snapshot(clients[0],s=>s.phase==='ROUND_INPUT');const revealPromise=snapshot(clients[0],s=>s.phase==='ROUND_REVEAL');
    for(let i=0;i<4;i++)await emitAck(clients[i],'answer:submit',{...ids[i],roundId:input.roundId,answer:i===3?'梨':'苹果'});
    expect((await revealPromise).currentReveal?.matched).toBe(false);
    clients.forEach(s=>s.close());await new Promise<void>(resolve=>httpServer.close(()=>resolve()));
  },20000);

  it('runs a five-question bilingual quiz and scores option IDs consistently',async()=>{
    const {httpServer}=createApp();await new Promise<void>(resolve=>httpServer.listen(0,resolve));
    const address=httpServer.address();if(!address||typeof address==='string')throw new Error('no port');const url=`http://127.0.0.1:${address.port}`;
    const a=connect(url,{transports:['websocket']});const b=connect(url,{transports:['websocket']});openSockets.push(a,b);await Promise.all([once(a,'connect'),once(b,'connect')]);
    const aj=once<{code:string;playerId:string;sessionToken:string}>(a,'room:joined');await emitAck(a,'room:create',{nickname:'中文玩家',mode:'quiz',maxPlayers:2,roundSeconds:30,locale:'zh',quizCategory:'life',quizTotal:5});const aid=await aj;
    const bj=once<{code:string;playerId:string;sessionToken:string}>(b,'room:joined');await emitAck(b,'room:join',{code:aid.code,nickname:'English',locale:'en'});const bid=await bj;
    expect((await emitAck(a,'game:start',aid)).ok).toBe(true);
    let input=await snapshot(a,s=>s.phase==='ROUND_INPUT');
    for(let i=0;i<5;i++){
      expect(input.currentQuestion?.options.map(o=>o.id)).toEqual(['A','B','C']);
      const reveal=snapshot(a,s=>s.phase==='ROUND_REVEAL'&&s.quizHistory.length===i+1);
      await emitAck(a,'answer:submit',{...aid,roundId:input.roundId,answer:'A'});await emitAck(b,'answer:submit',{...bid,roundId:input.roundId,answer:'A'});await reveal;
      if(i<4)input=await snapshot(a,s=>s.phase==='ROUND_INPUT'&&s.quizIndex===i+1);
    }
    const finished=await snapshot(a,s=>s.phase==='GAME_FINISHED');expect(finished.compatibility).toBe(100);expect(finished.quizHistory).toHaveLength(5);expect(new Set(finished.quizHistory.map(x=>x.questionId)).size).toBe(5);
    a.close();b.close();await new Promise<void>(resolve=>httpServer.close(()=>resolve()));
  },20000);
});
