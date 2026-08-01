import type { FastifyInstance, FastifyRequest } from 'fastify';
import type Database from 'better-sqlite3';
import crypto from 'node:crypto';

interface AuthRow { id: string; password_hash: string; plan: string; }

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/** 简单密码哈希（无 argon2 依赖时用 scrypt 替代；本项目 Spec 2 定为 argon2，先以 scrypt 起步避免原生依赖问题） */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const derived = crypto.scryptSync(password, Buffer.from(parts[1], 'hex'), 64);
  return crypto.timingSafeEqual(derived, Buffer.from(parts[2], 'hex'));
}

export function genId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function newSessionToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: sha256(token) };
}

export function attachAuthRoutes(app: FastifyInstance): void {
  app.post('/v1/auth/register', async (req, reply) => {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.status(400).send({ error: '邮箱格式不正确' });
    }
    if (!password || password.length < 8) {
      return reply.status(400).send({ error: '密码至少 8 位' });
    }
    const db = app.db;
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return reply.status(409).send({ error: '该邮箱已注册' });

    const id = genId();
    db.prepare('INSERT INTO users (id, email, password_hash, plan, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, email, hashPassword(password), 'free', Date.now());

    const { token, hash } = newSessionToken();
    const now = Date.now();
    db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .run(hash, id, now, now + 30 * 24 * 3600_000);

    return reply.status(201).send({ token, user: { id, email, plan: 'free' } });
  });

  app.post('/v1/auth/login', async (req, reply) => {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    const db = app.db;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as AuthRow | undefined;
    if (!user || !verifyPassword(password ?? '', user.password_hash)) {
      return reply.status(401).send({ error: '邮箱或密码错误' });
    }
    const { token, hash } = newSessionToken();
    const now = Date.now();
    db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .run(hash, user.id, now, now + 30 * 24 * 3600_000);
    return reply.send({ token, user: { id: user.id, email, plan: user.plan } });
  });

  app.post('/v1/auth/logout', async (req, reply) => {
    const auth = getAuth(req);
    if (auth) {
      app.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(auth.tokenHash);
    }
    return reply.status(204).send();
  });
}

/** 从 Bearer token 解析用户（返回 null 未登录） */
export function getAuth(req: FastifyRequest): { userId: string; tokenHash: string } | null {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  const token = h.slice(7).trim();
  if (!token) return null;
  const tokenHash = sha256(token);
  const db = (req.server as FastifyInstance & { db: Database.Database }).db;
  const row = db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
    .get(tokenHash) as { user_id: string; expires_at: number } | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }
  return { userId: row.user_id, tokenHash };
}

/** 从 token 取用户信息（含套餐） */
export function getUserByToken(db: Database.Database, req: FastifyRequest): { id: string; email: string; plan: string } | null {
  const auth = getAuth(req);
  if (!auth) return null;
  const user = db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(auth.userId) as
    | { id: string; email: string; plan: string }
    | undefined;
  return user ?? null;
}
