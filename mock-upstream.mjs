// OpenAI 兼容 mock 上游，供 start-mock.bat 联调用（无真实 API Key 时）。
// 用法：node mock-upstream.mjs  （监听 http://localhost:3999/v1/chat/completions）
import http from 'node:http';

const PORT = 3999;

function buildUsage() {
  return {
    prompt_tokens: 64,
    completion_tokens: 24,
    prompt_cache_hit_tokens: 0,
    prompt_cache_miss_tokens: 64,
    total_tokens: 88,
  };
}

function buildContent(body) {
  const model = body?.model ?? 'mock-model';
  const msgs = Array.isArray(body?.messages) ? body.messages.length : 0;
  const last = Array.isArray(body?.messages) && body.messages.length ? body.messages[body.messages.length - 1] : null;
  const userText = typeof last?.content === 'string' ? last.content.slice(0, 60) : '';
  return [
    `【mock 上游响应】模型: ${model}（模拟回复，仅供联调）`,
    userText ? `收到你的输入片段: ${userText}` : '',
    `本次请求共 ${msgs} 条消息。`,
  ].filter(Boolean).join('\n');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method !== 'POST' || url.pathname !== '/v1/chat/completions') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }

  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    let body = {};
    try { body = JSON.parse(raw || '{}'); } catch { /* 保持空对象 */ }

    const model = body.model ?? 'mock-model';
    const created = Math.floor(Date.now() / 1000);
    const id = `chatcmpl-mock-${Date.now()}`;
    const content = buildContent(body);

    if (body.stream) {
      // SSE 流式：逐块 delta，最后一帧带 usage（与 DeepSeek 兼容），然后 [DONE]
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const chunkLen = Math.max(1, Math.ceil(content.length / 5));
      const parts = [];
      for (let i = 0; i < content.length; i += chunkLen) parts.push(content.slice(i, i + chunkLen));
      let i = 0;
      const timer = setInterval(() => {
        if (i < parts.length) {
          res.write(
            `data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created, model, choices: [{ index: 0, delta: { role: 'assistant', content: parts[i] }, finish_reason: null }] })}\n\n`
          );
          i++;
        } else {
          res.write(
            `data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created, model, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: buildUsage() })}\n\n`
          );
          res.write('data: [DONE]\n\n');
          clearInterval(timer);
          res.end();
        }
      }, 40);
      return;
    }

    // 非流式
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id,
      object: 'chat.completion',
      created,
      model,
      choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
      usage: buildUsage(),
    }));
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-upstream] listening on http://localhost:${PORT}/v1/chat/completions`);
});