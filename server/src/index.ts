import 'dotenv/config';
import { createApp } from './app.js';

const port=Number(process.env.PORT||3001); const {httpServer}=createApp();
httpServer.listen(port,()=>console.log(`Same Word server listening on http://localhost:${port}`));
