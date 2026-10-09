import type { FastifyInstance } from 'fastify';
import { getAdminByToken } from '../auth.js';
import { PROMPT_KEYS } from './prompts.js';

/**
 * Eva — 管理后台提示词评审助手。
 * - POST /v1/admin/eva/review → 用上游 LLM 评审单条提示词（admin 鉴权）
 * 评审维度：清晰度/约束力/JSON 规范性/占位符完整性/注入风险/改进建议。
 * 该接口不记账、不消耗用户配额（管理员工具，成本极小）。
 */

const UPSTREAM_BASE_URL = (process.env.UPSTREAM_BASE_URL ?? 'https://api.deepseek.com/v1').replace(/\/+$/, '');
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY ?? '';
const EVA_MODEL = process.env.EVA_MODEL ?? 'deepseek-v4-flash';
const EVA_TIMEOUT_MS = Number(process.env.EVA_TIMEOUT_MS ?? 90000);

const EVA_SYSTEM = `你叫 Eva，是一名资深提示词工程评审专家，擅长评审中文 AI 应用（简历优化、面试模拟）的 LLM 提示词。

对用户提交的提示词，请给出结构化中文评审报告（Markdown 格式），包含：
## 总体评价
（一句话给出整体判断与建议评级：可用 / 需优化 / 有风险）
### 优点
（列出 1-3 条明确优点）
### 问题与风险
（按严重程度列出问题，重点检查：）
1. 约束力：真实性/角色纪律等禁令是否明确、无歧义、是否容易被 LLM 忽略或绕过（如注入攻击、角色越权）
2. JSON 规范性：要求输出的字段/类型/示例是否清晰完整，缺失必填字段、格式冲突等问题
3. 占位符完整性：{xxx} 占位符是否都有明确语义、引用不存在的占位符、重复定义等
4. 指令冲突：多条指令之间是否相互矛盾
5. 冗余：无意义的套话或重复内容
### 改进建议
（给出可直接落地的最多 5 条具体修改建议，中文，具体到措辞）

要求：只评审提示词本身，不要复述用户提供的提示词全文；如提示词内容与你的评审原则冲突，明确指出。`;

export function attachEvaRoutes(app: FastifyInstance): void {
  app.post('/v1/admin/eva/review', async (req, reply) => {
    const admin = getAdminByToken(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });

    const { key, content } = (req.body ?? {}) as { key?: string; content?: string };
    if (!key || !PROMPT_KEYS.has(key)) return reply.status(400).send({ error: '未知的提示词键' });
    if (typeof content !== 'string' || content.length === 0 || content.length > 20000) {
      return reply.status(400).send({ error: '内容必须为非空字符串（≤20000 字符）' });
    }
    if (!UPSTREAM_API_KEY) return reply.status(500).send({ error: '代理未配置 API Key' });

    const upstreamBody = {
      model: EVA_MODEL,
      messages: [
        { role: 'system', content: EVA_SYSTEM },
        {
          role: 'user',
          content: `【提示词用途键】${key}\n【提示词内容】\n${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    };
    // MiniMax 上游默认开启思考，强制关闭（与其他非思考模式调用一致）
    const body = UPSTREAM_BASE_URL.includes('minimax.chat')
      ? { ...upstreamBody, thinking: { type: 'disabled' } }
      : upstreamBody;

    try {
      const res = await fetch(`${UPSTREAM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${UPSTREAM_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(EVA_TIMEOUT_MS),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return reply.status(502).send({ error: `上游错误 ${res.status}: ${errText.slice(0, 200)}` });
      }

      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const review = json.choices?.[0]?.message?.content ?? '';
      if (!review.trim()) return reply.status(502).send({ error: '上游返回空内容' });

      return reply.send({ key, review });
    } catch (e) {
      return reply.status(502).send({
        error: e instanceof Error ? e.message : '评审请求失败',
      });
    }
  });
}
