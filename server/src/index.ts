import { createServer } from 'node:http';
import { env } from '@/config/env';
import { createApp } from '@/app';
import { registerSocketServer } from '@/sockets';

const app = createApp();
const httpServer = createServer(app);

registerSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
