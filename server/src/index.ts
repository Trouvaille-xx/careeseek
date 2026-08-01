import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type Database from 'better-sqlite3';
import { openDb } from './db.js';
import { attachAuthRoutes } from './auth.js';
import { attachChatRoutes } from './routes/chat.js';
import { attachEventsRoutes } from './routes/events.js';
import { attachPaymentsRoutes } from './routes/payments.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
  }
}

const app: FastifyInstance = Fastify({ logger: true });
app.decorate('db', openDb());

// CORS（托管版前端同域部署时不需要；开发期允许 vite 端口）
await app.register(async (instance) => {
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  instance.addHook('onRequest', (req, reply, done) => {
    const origin = req.headers.origin;
    if (origin && corsOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      reply.header('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') return reply.status(204).send();
    done();
  });
});

// 路由
attachAuthRoutes(app);
attachChatRoutes(app);
attachEventsRoutes(app);
attachPaymentsRoutes(app);

app.get('/health', async () => ({ ok: true, ts: Date.now() }));

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
