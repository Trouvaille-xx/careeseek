import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

/**
 * LLM 输出内容渲染器（用于模拟面试/对话气泡）。
 * - 支持 GFM（表格、删除线、任务列表、自动链接）
 * - rehype-sanitize 过滤掉 XSS 风险 HTML 标签（保留语义结构）
 * - 主题：跟随父级 text 类名，链接蓝色下划线，代码块灰色背景
 */
export function MarkdownText({ content, className = '' }: { content: string; className?: string }) {
  if (!content) return null;
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, defaultSchema]]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" />
          ),
          p: ({ node, ...props }) => <p {...props} className={(props.className ?? '') + ' leading-relaxed'} />,
          ul: ({ node, ...props }) => <ul {...props} className={(props.className ?? '') + ' list-disc pl-5 my-1.5 space-y-0.5'} />,
          ol: ({ node, ...props }) => <ol {...props} className={(props.className ?? '') + ' list-decimal pl-5 my-1.5 space-y-0.5'} />,
          li: ({ node, ...props }) => <li {...props} className={(props.className ?? '') + ' leading-relaxed'} />,
          code: ({ node, className: cls, children, ...props }) => {
            const isBlock = cls?.includes('language-');
            if (isBlock) {
              return (
                <code {...props} className="block bg-slate-900/10 dark:bg-slate-900/40 rounded-md px-3 py-2 my-1.5 text-[12px] font-mono whitespace-pre overflow-x-auto">
                  {children}
                </code>
              );
            }
            return (
              <code {...props} className="bg-slate-200/60 dark:bg-neutral-900/60 rounded px-1 py-0.5 text-[12px] font-mono">
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => <pre {...props} className={(props.className ?? '') + ' my-1.5'} />,
          blockquote: ({ node, ...props }) => (
            <blockquote {...props} className="border-l-2 border-current/30 pl-3 my-1.5 opacity-80" />
          ),
          h1: ({ node, ...props }) => <h1 {...props} className={(props.className ?? '') + ' text-base font-semibold mt-2 mb-1'} />,
          h2: ({ node, ...props }) => <h2 {...props} className={(props.className ?? '') + ' text-[15px] font-semibold mt-2 mb-1'} />,
          h3: ({ node, ...props }) => <h3 {...props} className={(props.className ?? '') + ' text-sm font-semibold mt-1.5 mb-0.5'} />,
          strong: ({ node, ...props }) => <strong {...props} className={(props.className ?? '') + ' font-semibold'} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
