/** 迷你 Markdown 渲染器（仅供管理后台 Eva 评审报告展示，勿用于用户内容） */

interface LineNode {
  text: string;
  type: 'h2' | 'h3' | 'h4' | 'li' | 'p' | 'hr' | 'code';
}

function parseLines(src: string): LineNode[] {
  const out: LineNode[] = [];
  const lines = src.split('\n');
  let inCode = false;
  let codeBuf: string[] = [];

  const flushCode = () => {
    if (codeBuf.length > 0) {
      out.push({ type: 'code', text: codeBuf.join('\n') });
      codeBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trimStart().startsWith('```')) {
      if (inCode) {
        inCode = false;
        flushCode();
      } else {
        flushCode();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    const t = line.trim();
    if (t.startsWith('## ')) out.push({ type: 'h2', text: t.slice(3) });
    else if (t.startsWith('### ')) out.push({ type: 'h3', text: t.slice(4) });
    else if (t.startsWith('#### ')) out.push({ type: 'h4', text: t.slice(5) });
    else if (/^[-*•]\s+/.test(t)) out.push({ type: 'li', text: t.replace(/^[-*•]\s+/, '') });
    else if (/^\d+[.、]\s+/.test(t)) out.push({ type: 'li', text: t.replace(/^\d+[.、]\s+/, '') });
    else if (/^[-_=]{3,}$/.test(t)) out.push({ type: 'hr', text: '' });
    else if (t) out.push({ type: 'p', text: t });
  }
  flushCode();
  return out;
}

/** 转义非加粗部分的 HTML 特殊字符，并渲染 **bold** 行内标记 */
function inline(text: string): string {
  let out = '';
  const boldRe = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = boldRe.exec(text)) !== null) {
    out += esc(text.slice(last, m.index));
    out += `<strong>${esc(m[1])}</strong>`;
    last = m.index + m[0].length;
  }
  out += esc(text.slice(last));
  return out;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function MiniMarkdown({ source }: { source: string }) {
  const nodes = parseLines(source);
  return (
    <div className="text-sm leading-relaxed text-slate-700 space-y-2">
      {nodes.map((n, i) => {
        switch (n.type) {
          case 'h2':
            return <h2 key={i} className="text-base font-semibold text-slate-900 pt-1">{inline(n.text)}</h2>;
          case 'h3':
            return <h3 key={i} className="text-sm font-semibold text-slate-800">{inline(n.text)}</h3>;
          case 'h4':
            return <h4 key={i} className="text-sm font-medium text-slate-800">{inline(n.text)}</h4>;
          case 'li':
            return (
              <p key={i} className="pl-4 relative">
                <span className="absolute left-0 text-slate-400">·</span>
                <span dangerouslySetInnerHTML={{ __html: inline(n.text) }} />
              </p>
            );
          case 'hr':
            return <hr key={i} className="border-slate-200" />;
          case 'code':
            return (
              <pre key={i} className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto text-xs leading-relaxed">
                {n.text}
              </pre>
            );
          default:
            return <p key={i} dangerouslySetInnerHTML={{ __html: inline(n.text) }} />;
        }
      })}
    </div>
  );
}
