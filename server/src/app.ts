import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@same-word/shared';
import { RoomManager } from './roomManager.js';

export function createApp() {
  const app=express(); const origin=process.env.CLIENT_ORIGIN?.split(',') ?? (process.env.NODE_ENV==='production' ? true : ['http://localhost:5173']);
  app.use(cors({origin,credentials:true})); app.use(express.json());
  app.get('/health',(_req,res)=>res.json({ok:true,service:'same-word-server'}));
  const staticCandidates=[process.env.CLIENT_DIST,path.resolve(process.cwd(),'client/dist'),path.resolve(process.cwd(),'../client/dist')].filter(Boolean) as string[];
  const staticDir=staticCandidates.find(existsSync);
  if(staticDir){app.use(express.static(staticDir));app.get('/{*splat}',(_req,res)=>res.sendFile(path.join(staticDir,'index.html')))}
  const httpServer=createServer(app);
  const io=new Server<ClientToServerEvents,ServerToClientEvents>(httpServer,{cors:{origin,credentials:true}});
  const rooms=new RoomManager(io,Number(process.env.ROOM_TTL_MINUTES||120));
  io.on('connection',socket=>rooms.bind(socket));
  return {app,httpServer,io};
}
