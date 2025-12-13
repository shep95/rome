import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { escapeHtml, sanitizeUrl, detectXSS, sanitizeHtml } from '@/lib/xss-protection';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const rendered = useMemo(() => {
    // XSS Detection - if attack detected, escape everything
    const xssCheck = detectXSS(content);
    if (xssCheck.isXSS) {
      console.warn('[MarkdownRenderer] XSS attack blocked:', xssCheck.patterns);
      return escapeHtml(content);
    }

    // First, escape the entire content to prevent XSS
    let html = escapeHtml(content);

    // Code blocks (```) - already escaped, just wrap
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const safeLang = lang ? escapeHtml(lang) : 'text';
      return `<pre class="code-block" data-lang="${safeLang}"><code>${code.trim()}</code></pre>`;
    });

    // Inline code (`) - already escaped
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold (**text**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic (*text*)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links [text](url) - sanitize URLs
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safeUrl = sanitizeUrl(url);
      const safeText = text; // Already escaped above
      if (safeUrl === '#blocked') {
        return `<span class="blocked-link text-destructive" title="Blocked for security">${safeText}</span>`;
      }
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer nofollow" class="markdown-link">${safeText}</a>`;
    });

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="markdown-h2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="markdown-h1">$1</h1>');

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li class="markdown-li">$1</li>');
    html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="markdown-ul">$&</ul>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="markdown-quote">$1</blockquote>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    // Final sanitization pass
    return sanitizeHtml(html);
  }, [content]);

  return (
    <div
      className={cn("markdown-content", className)}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
};
