// 诊断脚本：验证第 6 步 JSON 解析失败是否为「输出被 max_tokens 截断」
// 走应用真实路径：前端同款请求 → 后端代理 → OpenCode Go 上游
import fs from 'node:fs';

const PROXY = 'http://localhost:3001';
const MODEL = 'deepseek-v4-flash';           // 应用积分模式下发的模型名（apiService resolveEndpoint）
const ROOT = 'D:/Projects/VibeCoding Project/006-CareeSeek';

// ---------- 1. 登录拿 token ----------
const email = `diag-${Date.now().toString(36)}@test.dev`;
const cred = { email, password: 'diag1234', name: 'diag' };
await fetch(`${PROXY}/v1/auth/register`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cred),
});
const loginRes = await fetch(`${PROXY}/v1/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cred),
});
const login = await loginRes.json();
if (!login.token) { console.error('登录失败', login); process.exit(1); }
console.log('登录 OK');

// ---------- 2. 取模板（与 prompts.ts 一致） ----------
const promptsSrc = fs.readFileSync(`${ROOT}/src/services/prompts.ts`, 'utf8');
const T = {};
const re = /^  (\w+): '((?:[^'\\]|\\.)*)'/gm;
let m;
while ((m = re.exec(promptsSrc)) !== null) {
  T[m[1]] = m[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}
function render(key, vars) {
  let out = T[key] ?? '';
  for (let i = 0; i < 5; i++) {
    const next = out.replace(/\{(\w+)\}/g, (mm, name) => {
      if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name];
      if (name === key) return mm;
      return T[name] !== undefined ? T[name] : mm;
    });
    if (next === out) break;
    out = next;
  }
  return out;
}

// ---------- 3. 组装第 6 步 prompt（数据：A 组 + 已有分析结果） ----------
const JD = fs.readFileSync(`${ROOT}/demo-data/可直接粘贴/JD-01-AI产品经理.txt`, 'utf8');
const RESUME = fs.readFileSync(`${ROOT}/demo-data/可直接粘贴/简历-01-林晓（AI产品经理）.txt`, 'utf8');
const out = JSON.parse(fs.readFileSync(`${ROOT}/demo-data/test-output.json`, 'utf8'));

const system = render('optimize_system', {});
const user = render('optimize_prompt', {
  jd: JD,
  resume: RESUME,
  analysis: JSON.stringify(out.jd),
  diagnosis: JSON.stringify(out.diagnosis),
  matching: JSON.stringify(out.matching),
  questions: JSON.stringify(out.questions),
  style: '在保持真实的前提下，提升专业度和匹配度。',
});
console.log(`prompt 长度: system=${system.length} user=${user.length}`);

// ---------- 4. 对比不同 max_tokens ----------
async function tryCall(maxTokens) {
  const t0 = Date.now();
  const res = await fetch(`${PROXY}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(180000),
  });
  const data = await res.json().catch(() => ({}));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (!res.ok) return { maxTokens, http: res.status, err: JSON.stringify(data).slice(0, 200), secs };
  const choice = data.choices?.[0];
  const content = choice?.message?.content ?? '';
  let parsed = null, err = null;
  try { parsed = JSON.parse(content); } catch (e) { err = e.message; }
  return {
    maxTokens,
    http: res.status,
    secs,
    finish_reason: choice?.finish_reason,
    contentLen: content.length,
    items: Array.isArray(parsed) ? parsed.length : (parsed ? '非数组' : null),
    parseOk: parsed !== null,
    parseErr: err,
    usage: data.usage ? { prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens, reasoning: data.usage.completion_tokens_details?.reasoning_tokens } : null,
    tail: content.slice(-80),
  };
}

for (const mt of [16384, 32768]) {
  const r = await tryCall(mt);
  console.log('\n=== max_tokens=' + mt + ' ===');
  console.log(JSON.stringify(r, null, 2));
}


