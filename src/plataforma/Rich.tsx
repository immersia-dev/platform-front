import type { ReactNode } from 'react';

// Texto das etapas em markdown simples, montado como elementos React (nunca HTML do conteúdo):
// # título, ## subtítulo, ### seção, parágrafos, listas (- ou 1.), > destaque, --- divisória,
// **negrito**, _itálico_, `código` e [link](https://...).

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyBase}-${i++}`;
    if (token.startsWith('**'))
      out.push(
        <strong key={key} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    else if (token.startsWith('`'))
      out.push(
        <code
          key={key}
          className="rounded bg-white/10 px-1 py-0.5 text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    else if (token.startsWith('[')) {
      const label = token.slice(1, token.indexOf(']'));
      out.push(
        <a
          key={key}
          href={match[2]}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-200 underline underline-offset-2 hover:text-white"
        >
          {label}
        </a>
      );
    } else out.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Rich({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const cls =
        level === 1
          ? 'mt-2 text-2xl font-semibold text-white'
          : level === 2
            ? 'mt-6 text-lg font-semibold text-white'
            : 'mt-5 text-base font-semibold text-white';
      const Tag = (level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4') as
        'h2' | 'h3' | 'h4';
      blocks.push(
        <Tag key={key} className={cls}>
          {inline(heading[2], key)}
        </Tag>
      );
      i++;
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) {
      blocks.push(<hr key={key} className="my-6 border-white/10" />);
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i]))
        quote.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(
        <blockquote
          key={key}
          className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.07] px-4 py-3 text-amber-50/90"
        >
          {inline(quote.join(' '), key)}
        </blockquote>
      );
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i]))
        items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List
          key={key}
          className={`space-y-1.5 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-cyan-300/70`}
        >
          {items.map((item, n) => (
            <li key={n}>{inline(item, `${key}-${n}`)}</li>
          ))}
        </List>
      );
      continue;
    }
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|>|-{3,}\s*$|\s*([-*]|\d+\.)\s+)/.test(lines[i])
    )
      paragraph.push(lines[i++]);
    blocks.push(<p key={key}>{inline(paragraph.join(' '), key)}</p>);
  }
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-white/80">
      {blocks}
    </div>
  );
}
