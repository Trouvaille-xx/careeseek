import type { FastifyInstance } from 'fastify';
import { proxyChat, ProxyError, readByokHeaders } from '../proxy.js';
import { checkQuota, PLANS } from '../plans.js';
import { getUserByToken } from '../auth.js';

export function attachChatRoutes(app: FastifyInstance): void {
  app.post('/v1/chat/completions', async (req, reply) => {
    // 代理模式必须登录（未登录用户用 BYOK 直连自己 key 不经代理）
    const user = getUserByToken(app.db, req);
    if (!user) {
      return reply.status(401).send({ error: '未登录或会话已过期' });
    }

    const byok = readByokHeaders(req);
    // BYOK（用户自备 Key）模式：不消耗积分，仅记账用于统计面板
    const isByok = Boolean(byok.userApiKey?.trim());

    // 配额校验（BYOK 跳过配额检查）
    if (!isByok) {
      const quota = checkQuota(app.db, user.id, user.plan as 'free' | 'pro' | 'power');
      if (!quota.ok) {
        return reply.status(402).send({ error: '本月额度已用完', quota });
      }
    }

    const body = req.body;
    try {
      const result = await proxyChat(app.db, user.id, body, byok);
      reply.type(result.stream ? 'text/event-stream' : 'application/json');
      return reply.status(result.status).send(result.body);
    } catch (e) {
      if (e instanceof ProxyError) {
        return reply.status(e.status).send({ error: e.message });
      }
      throw e;
    }
  });

  app.get('/v1/me', async (req, reply) => {
    const user = getUserByToken(app.db, req);
    if (!user) return reply.status(401).send({ error: '未登录' });
    const quota = checkQuota(app.db, user.id, user.plan as 'free' | 'pro' | 'power');
    return reply.send({
      user: { id: user.id, email: user.email, plan: user.plan, role: user.role },
      quota: { used: quota.used, limit: quota.limit, plan: user.plan },
    });
  });

  app.get('/v1/plans', async () => {
    return {
      plans: Object.values(PLANS).map((p) => ({
        id: p.id, name: p.name, price_cny: p.priceCny, point_limit: p.pointLimit,
      })),
    };
  });
}
