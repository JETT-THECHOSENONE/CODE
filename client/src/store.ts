import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents, RoomSnapshot, Locale, CreateRoomPayload } from '@same-word/shared';

type GameSocket=Socket<ServerToClientEvents,ClientToServerEvents>;
interface Identity{code:string;playerId:string;sessionToken:string}
interface State{
  socket:GameSocket|null; snapshot:RoomSnapshot|null; identity:Identity|null; connected:boolean;
  locale:Locale; error:string|null; notice:string|null;
  connect:()=>void; setLocale:(x:Locale)=>void; clearError:()=>void;
  createRoom:(p:CreateRoomPayload)=>Promise<boolean>; joinRoom:(code:string,nickname:string)=>Promise<boolean>;
  submit:(answer:string)=>Promise<boolean>; start:()=>Promise<boolean>; restart:()=>Promise<boolean>; leave:()=>Promise<void>;
}
const KEY='same-word-identity-v1';
const getIdentity=():Identity|null=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{return null}};
const serverUrl=import.meta.env.VITE_SERVER_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

export const useGame=create<State>((set,get)=>({
  socket:null,snapshot:null,identity:getIdentity(),connected:false,locale:(localStorage.getItem('same-word-locale') as Locale)||'zh',error:null,notice:null,
  connect:()=>{
    if(get().socket)return;
    const socket:GameSocket=io(serverUrl,{transports:['websocket','polling']}); set({socket});
    socket.on('connect',()=>{set({connected:true,error:null});const id=get().identity;if(id)socket.emit('room:resume',id,r=>{if(!r.ok){sessionStorage.removeItem(KEY);set({identity:null,snapshot:null,error:r.error});}});});
    socket.on('disconnect',()=>set({connected:false,notice:get().locale==='zh'?'网络重连中…':'Reconnecting…'}));
    socket.on('room:snapshot',snapshot=>set({snapshot,notice:null,error:null}));
    socket.on('room:joined',identity=>{sessionStorage.setItem(KEY,JSON.stringify(identity));set({identity});history.replaceState(null,'',`/?room=${identity.code}`)});
    socket.on('room:error',e=>set({error:e.message})); socket.on('game:notice',e=>set({notice:e.message}));
  },
  setLocale:locale=>{localStorage.setItem('same-word-locale',locale);set({locale})},clearError:()=>set({error:null}),
  createRoom:async p=>new Promise(resolve=>{const s=get().socket;if(!s)return resolve(false);s.emit('room:create',p,r=>{if(!r.ok)set({error:r.error});resolve(r.ok)})}),
  joinRoom:async(code,nickname)=>new Promise(resolve=>{const s=get().socket;if(!s)return resolve(false);s.emit('room:join',{code:code.toUpperCase(),nickname,locale:get().locale},r=>{if(!r.ok)set({error:r.error});resolve(r.ok)})}),
  submit:async answer=>new Promise(resolve=>{const {socket,identity,snapshot}=get();if(!socket||!identity||!snapshot)return resolve(false);socket.emit('answer:submit',{...identity,roundId:snapshot.roundId,answer},r=>{if(!r.ok)set({error:r.error});resolve(r.ok)})}),
  start:async()=>new Promise(resolve=>{const {socket,identity}=get();if(!socket||!identity)return resolve(false);socket.emit('game:start',identity,r=>{if(!r.ok)set({error:r.error});resolve(r.ok)})}),
  restart:async()=>new Promise(resolve=>{const {socket,identity}=get();if(!socket||!identity)return resolve(false);socket.emit('game:restart',identity,r=>{if(!r.ok)set({error:r.error});resolve(r.ok)})}),
  leave:async()=>new Promise(resolve=>{const {socket,identity}=get();if(!socket||!identity){resolve();return}socket.emit('room:leave',identity,()=>{sessionStorage.removeItem(KEY);set({identity:null,snapshot:null});history.replaceState(null,'','/');resolve()})})
}));
