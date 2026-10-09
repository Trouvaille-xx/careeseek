import fs from 'node:fs';

// 探测上游接受的最大输出上限：用极小 prompt，模型会提前 stop，
// 只要没被拒绝就说明该 max_tokens 值被受理。
const KEY = (() => {
  const raw = fs.readFileSync('C:/Users/Trouvaille/.dsh/.credentials.yaml', 'utf8');
  return raw.match(/^\s*OPENCODE_GO_API_KEY:\s*['"]?([^\s'"]+)/m)[1];
})();
const URL = 'https://opencode.ai/zen/go/v1/chat/completions';
const SESSION = 'careeseek-limit-probe';
const MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'];
const LIMITS = [8192, 16384, 32768, 65536, 131072, 999999];

async function probe(model, maxTokens) {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KEY}`,
        'x-opencode-session': SESSION,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return `${String(maxTokens).padStart(7)} → ❌ ${res.status} ${(data.error?.message ?? JSON.stringify(data)).slice(0, 90)}`;
    }
    return `${String(maxTokens).padStart(7)} → ✅ 受理 (finish=${data.choices?.[0]?.finish_reason}, 实际生成 ${data.usage?.completion_tokens} token)`;
  } catch (e) {
    return `${String(maxTokens).padStart(7)} → ⚠️ ${e.message.slice(0, 60)}`;
  }
}

for (const model of MODELS) {
  console.log(`\n=== ${model} ===`);
  for (const lim of LIMITS) console.log(await probe(model, lim));
}
