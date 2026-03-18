import { useMemo, useState, useEffect } from 'react';

interface LatexTextProps {
  children: string;
  className?: string;
}

// Lazy-loaded KaTeX module — only fetched when text contains $
let katexModule: typeof import('katex') | null = null;
let katexLoading = false;
const katexLoadCallbacks: (() => void)[] = [];

function loadKatex(): Promise<void> {
  if (katexModule) return Promise.resolve();
  if (katexLoading) {
    return new Promise((resolve) => katexLoadCallbacks.push(resolve));
  }
  katexLoading = true;
  return Promise.all([
    import('katex'),
    // @ts-ignore CSS import
    import('katex/dist/katex.min.css'),
  ]).then(([mod]) => {
    katexModule = mod;
    katexLoadCallbacks.forEach((cb) => cb());
    katexLoadCallbacks.length = 0;
  });
}

/**
 * Renders text with inline ($...$) and block ($$...$$) LaTeX.
 * Plain text without $ is rendered directly — no KaTeX overhead.
 */
export default function LatexText({ children, className }: LatexTextProps) {
  const hasLatex = children?.includes('$');
  const [ready, setReady] = useState(!hasLatex || !!katexModule);

  useEffect(() => {
    if (hasLatex && !katexModule) {
      loadKatex().then(() => setReady(true));
    }
  }, [hasLatex]);

  const html = useMemo(() => {
    if (!children) return '';
    if (!hasLatex) return escapeHtml(children);
    if (!katexModule) return escapeHtml(children);
    return renderLatex(children, katexModule.default);
  }, [children, hasLatex, ready]);

  if (!hasLatex) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderLatex(text: string, katex: typeof import('katex')['default']): string {
  const parts: string[] = [];
  let lastIndex = 0;

  const regex = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)));
    }

    const blockContent = match[1];
    const inlineContent = match[2];

    if (blockContent !== undefined) {
      try {
        parts.push(katex.renderToString(blockContent.trim(), {
          displayMode: true,
          throwOnError: false,
          output: 'html',
        }));
      } catch {
        parts.push(escapeHtml(`$$${blockContent}$$`));
      }
    } else if (inlineContent !== undefined) {
      try {
        parts.push(katex.renderToString(inlineContent.trim(), {
          displayMode: false,
          throwOnError: false,
          output: 'html',
        }));
      } catch {
        parts.push(escapeHtml(`$${inlineContent}$`));
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)));
  }

  return parts.join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
