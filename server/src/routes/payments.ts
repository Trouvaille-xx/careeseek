import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { PLANS } from '../plans.js';
import { getUserByToken } from '../auth.js';

const PAY_MODE = process.env.PAY_MODE ?? 'mock'; // mock | wechat

const PAYMENT_TTL_MS = 15 * 60 * 1000; // 15 分钟

export function attachPaymentsRoutes(app: FastifyInstance): void {
  // 创建订单
  app.post('/v1/checkout', async (req, reply) => {
    const user = getUserByToken(app.db, req);
    if (!user) return reply.status(401).send({ error: '未登录' });

    const { plan } = (req.body ?? {}) as { plan?: string };
    const planDef = PLANS[plan as keyof typeof PLANS];
    if (!planDef || planDef.id === 'free') {
      return reply.status(400).send({ error: '无效的套餐' });
    }

    const id = `pay-${crypto.randomBytes(8).toString('hex')}`;
    const now = Date.now();
    const expiresAt = now + PAYMENT_TTL_MS;

    let qrCode = '';
    if (PAY_MODE === 'wechat') {
      // TODO: 接入微信 Native 下单（需商户号/证书），返回 code_url
      qrCode = '';
    } else {
      // mock 模式：生成一段可扫码的文本，模拟 code_url（支付轮询接口直接返回 paid）
      qrCode = `careeseek-mock://pay?plan=${planDef.id}&amount=${planDef.priceCny}`;
    }

    app.db.prepare(
      `INSERT INTO payments (id, user_id, plan, amount_cny, status, qr_code, created_at, expires_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`
    ).run(id, user.id, planDef.id, planDef.priceCny, qrCode, now, expiresAt);

    return reply.send({ payment_id: id, qr_url: qrCode, expires_at: expiresAt, pay_mode: PAY_MODE });
  });

  // 轮询订单状态
  app.get('/v1/payments/:id', async (req, reply) => {
    const user = getUserByToken(app.db, req);
    if (!user) return reply.status(401).send({ error: '未登录' });

    const id = (req.params as { id: string }).id;
    const row = app.db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(id, user.id) as
      | { id: string; status: string; plan: string; expires_at: number }
      | undefined;
    if (!row) return reply.status(404).send({ error: '订单不存在' });

    // mock 模式：首次轮询即标记已支付（模拟扫码成功）
    if (PAY_MODE === 'mock' && row.status === 'pending') {
      const now = Date.now();
      if (now > row.expires_at) {
        app.db.prepare("UPDATE payments SET status = 'expired' WHERE id = ?").run(id);
        return reply.send({ status: 'expired' });
      }
      app.db.prepare("UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ?").run(now, id);
      activatePlan(app, row.id, row.plan);
      return reply.send({ status: 'paid' });
    }

    if (row.status === 'pending' && Date.now() > row.expires_at) {
      app.db.prepare("UPDATE payments SET status = 'expired' WHERE id = ?").run(id);
      return reply.send({ status: 'expired' });
    }
    return reply.send({ status: row.status });
  });

  // 微信支付回调（真实模式用；mock 模式不用）
  app.post('/v1/payments/notify', async (req, reply) => {
    if (PAY_MODE !== 'wechat') {
      return reply.status(400).send({ error: '当前为 mock 模式' });
    }
    // TODO: 验签 + 解密 + 幂等更新（真实商户号接入后实现）
    return reply.status(501).send({ error: '微信支付尚未接入' });
  });
}

/** 激活套餐：顺延 30 天（月套餐） */
function activatePlan(db: FastifyInstance['db'], paymentId: string, planId: string): void {
  const row = db.prepare('SELECT user_id FROM payments WHERE id = ?').get(paymentId) as { user_id: string } | undefined;
  if (!row) return;
  const now = Date.now();
  const cur = db.prepare('SELECT plan_expires_at FROM users WHERE id = ?').get(row.user_id) as { plan_expires_at: number | null };
  const base = cur.plan_expires_at && cur.plan_expires_at > now ? cur.plan_expires_at : now;
  db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?')
    .run(planId, base + 30 * 24 * 3600_000, row.user_id);
}
