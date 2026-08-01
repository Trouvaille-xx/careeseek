/** 去除 LLM 输出中的思维链标签（```think ... ``` / <think>...</think>） */
export function stripThinkTags(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/```think[\s\S]*?(?:```|$)/gi, '')
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
