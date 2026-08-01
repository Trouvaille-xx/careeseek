import { useAppStore } from '@/stores/useAppStore';

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const { apiSettings } = useAppStore.getState();

  if (!apiSettings.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  // Log the full prompt for debugging
  console.log('=== PROMPT START ===');
  console.log('[SYSTEM]', systemPrompt.slice(0, 500) + `... (${systemPrompt.length} chars)`);
  console.log('[USER]', userPrompt.slice(0, 2000) + `... (${userPrompt.length} chars)`);
  console.log('=== PROMPT END ===');

  const url = `${apiSettings.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiSettings.apiKey}`,
    },
    body: JSON.stringify({
      model: apiSettings.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API 错误 (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  console.log(`[RESPONSE]`, content.slice(0, 500));
  return content;
}

export async function callLLMWithJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const text = await callLLM(
    `${systemPrompt}\n\n你必须以纯 JSON 格式输出，不要包含 markdown 代码块标记或额外说明。直接输出 JSON 对象。`,
    userPrompt
  );

  // Strip markdown code blocks if present
  const cleaned = text.replace(/```(?:json)?\s*/g, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON from the response
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`无法解析 LLM 响应为 JSON: ${cleaned.slice(0, 200)}`);
  }
}

export async function callLLMForInterview(
  systemPrompt: string,
  messageHistory: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const { apiSettings } = useAppStore.getState();

  if (!apiSettings.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const url = `${apiSettings.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...messageHistory,
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiSettings.apiKey}`,
    },
    body: JSON.stringify({
      model: apiSettings.model || 'gpt-4o',
      messages,
      temperature: 0.5,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API 错误 (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
