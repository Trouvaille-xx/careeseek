import type { FastifyInstance } from 'fastify';
import { getPromptAdmin, getUserByToken } from '../auth.js';

/**
 * 提示词管理。
 * - GET /v1/prompts                  → 所有前端可覆盖的提示词（登录用户可读，前端运行时拉取）
 * - GET /v1/admin/prompts            → 列表 + 版本号（仅管理员）
 * - PUT /v1/admin/prompts/:key       → 保存新版本并发布（仅管理员）
 * - GET /v1/admin/prompts/:key/versions → 历史版本（仅管理员）
 * - POST /v1/admin/prompts/:key/rollback → 回滚到指定版本（仅管理员）
 *
 * 键名必须与前端 src/services/prompts.ts 模板键一致。
 */
export const PROMPT_KEYS = new Set([
  'role',
  'json_req',
  'jd_parse_system',
  'jd_prompt',
  'diagnosis_system',
  'diagnosis_prompt',
  'matching_system',
  'matching_prompt',
  'questions_system',
  'questions_prompt',
  'followup_prompt',
  'bullet_system',
  'bullet_prompt',
  'optimize_system',
  'optimize_prompt',
  'final_resume_system',
  'final_resume_prompt',
  'interview_prep_system',
  'interview_prep_prompt',
  'interview_system',
  'interview_followup_prompt',
  'cover_letter_system',
  'cover_letter_prompt',
  'bilingual_system',
  'bilingual_prompt',
  'review_system',
  'review_prompt',
]);

interface PromptRow {
  key: string;
  content: string;
  version: number;
  updated_by: string | null;
  updated_at: number;
}

export function attachPromptsRoutes(app: FastifyInstance): void {
  // 前端运行时拉取全部提示词覆盖（登录才允许；未登录用内置默认值）
  app.get('/v1/prompts', async (req, reply) => {
    const user = getUserByToken(app.db, req);
    if (!user) return reply.status(401).send({ error: '未登录' });
    const rows = app.db
      .prepare('SELECT key, content, version, updated_at FROM prompts')
      .all() as PromptRow[];
    return reply.send({ prompts: rows });
  });

  app.get('/v1/admin/prompts', async (req, reply) => {
    const admin = getPromptAdmin(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });
    const rows = app.db
      .prepare('SELECT key, content, version, updated_by, updated_at FROM prompts')
      .all() as PromptRow[];
    return reply.send({ prompts: rows, allowedKeys: [...PROMPT_KEYS] });
  });

  app.put('/v1/admin/prompts/:key', async (req, reply) => {
    const admin = getPromptAdmin(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });

    const key = (req.params as { key: string }).key;
    if (!PROMPT_KEYS.has(key)) return reply.status(400).send({ error: '未知的提示词键' });
    const { content } = (req.body ?? {}) as { content?: string };
    if (typeof content !== 'string' || content.length === 0 || content.length > 20000) {
      return reply.status(400).send({ error: '内容必须为非空字符串（≤20000 字符）' });
    }

    const db = app.db;
    const now = Date.now();
    const existing = db.prepare('SELECT version FROM prompts WHERE key = ?').get(key) as
      | { version: number }
      | undefined;
    const nextVersion = existing ? existing.version + 1 : 1;

    const tx = db.transaction(() => {
      db.prepare(
        'INSERT OR REPLACE INTO prompts (key, content, version, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run(key, content, nextVersion, admin.id, now);
      db.prepare(
        'INSERT INTO prompt_versions (key, content, version, action, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(key, content, nextVersion, existing ? 'update' : 'create', admin.id, now);
    });
    tx();

    return reply.send({ key, version: nextVersion, updated_at: now });
  });

  app.get('/v1/admin/prompts/:key/versions', async (req, reply) => {
    const admin = getPromptAdmin(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });
    const key = (req.params as { key: string }).key;
    if (!PROMPT_KEYS.has(key)) return reply.status(400).send({ error: '未知的提示词键' });
    const rows = app.db
      .prepare(
        'SELECT version, content, action, created_by, created_at FROM prompt_versions WHERE key = ? ORDER BY version DESC LIMIT 50'
      )
      .all(key) as { version: number; content: string; action: string; created_by: string | null; created_at: number }[];
    return reply.send({ versions: rows });
  });

  app.post('/v1/admin/prompts/:key/rollback', async (req, reply) => {
    const admin = getPromptAdmin(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });

    const key = (req.params as { key: string }).key;
    if (!PROMPT_KEYS.has(key)) return reply.status(400).send({ error: '未知的提示词键' });
    const { version } = (req.body ?? {}) as { version?: number };
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
      return reply.status(400).send({ error: 'version 必须为正整数' });
    }

    const db = app.db;
    const target = db
      .prepare('SELECT content, version FROM prompt_versions WHERE key = ? AND version = ?')
      .get(key, version) as { content: string; version: number } | undefined;
    if (!target) return reply.status(404).send({ error: '目标版本不存在' });

    const now = Date.now();
    const existing = db.prepare('SELECT version FROM prompts WHERE key = ?').get(key) as
      | { version: number }
      | undefined;
    const nextVersion = existing ? existing.version + 1 : 1;

    const tx = db.transaction(() => {
      db.prepare(
        'INSERT OR REPLACE INTO prompts (key, content, version, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run(key, target.content, nextVersion, admin.id, now);
      db.prepare(
        'INSERT INTO prompt_versions (key, content, version, action, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(key, target.content, nextVersion, 'rollback', admin.id, now);
    });
    tx();

    return reply.send({ key, version: nextVersion, updated_at: now });
  });
}
