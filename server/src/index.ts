import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { attachAuthRoutes, promoteAdmins } from './auth.js';
import { attachChatRoutes } from './routes/chat.js';
import { attachEventsRoutes } from './routes/events.js';
import { attachPaymentsRoutes } from './routes/payments.js';
import { attachPromptsRoutes } from './routes/prompts.js';
import { attachAdminRoutes } from './routes/admin.js';
import { attachEvaRoutes } from './routes/eva.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = process.env.DIST_DIR ?? path.join(__dirname, '..', '..', 'dist');

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
  }
}

const app: FastifyInstance = Fastify({ logger: true });
app.decorate('db', openDb());
promoteAdmins(app.db);

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
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Api-Key, X-User-Base-Url, X-User-Model');
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
attachPromptsRoutes(app);
attachAdminRoutes(app);
attachEvaRoutes(app);

app.get('/health', async () => ({ ok: true, ts: Date.now() }));

// 静态文件服务（生产同域部署；dist 存在时启用）
if (fs.existsSync(DIST_DIR)) {
  const assetsDir = path.join(DIST_DIR, 'assets');
  const adminHtml = path.join(DIST_DIR, 'admin.html');
  app.get<{ Params: { '*': string } }>('/assets/*', async (req, reply) => {
    const rest = (req.params as { '*': string })['*'];
    const file = path.join(assetsDir, rest ?? '');
    if (!file.startsWith(assetsDir) || !fs.existsSync(file)) {
      return reply.status(404).send('Not Found');
    }
    const ext = path.extname(file);
    const mime = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : null;
    if (mime) reply.type(mime);
    return reply.send(fs.readFileSync(file));
  });

  // 管理后台（独立 bundle，/admin 前缀）
  if (fs.existsSync(adminHtml)) {
    app.get<{ Params: { '*': string } }>('/admin/*', async (_req, reply) => {
      reply.type('text/html').send(fs.readFileSync(adminHtml));
    });
    app.get('/admin', async (_req, reply) => {
      reply.type('text/html').send(fs.readFileSync(adminHtml));
    });
  }

  app.get('/*', async (_req, reply) => {
    reply.type('text/html').send(fs.readFileSync(path.join(DIST_DIR, 'index.html')));
  });
}

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
