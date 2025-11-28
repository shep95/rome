import { useMemo } from 'react';
import { LinkPreview } from './LinkPreview';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface EnhancedMessageContentProps {
  content: string;
  className?: string;
  isSender?: boolean;
}

export const EnhancedMessageContent = ({ content, className, isSender = false }: EnhancedMessageContentProps) => {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set());

  const copyCode = async (code: string, blockIndex: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedBlocks(prev => new Set(prev).add(blockIndex));
      toast.success('Code copied!');
      setTimeout(() => {
        setCopiedBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(blockIndex);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const parsed = useMemo(() => {
    const elements: Array<{ type: 'text' | 'code' | 'inline-code' | 'link'; content: string; language?: string; index?: number }> = [];
    let currentIndex = 0;
    let blockIndex = 0;

    // First, extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        parseInlineElements(textBefore, elements, blockIndex);
      }

      // Add code block
      elements.push({
        type: 'code',
        content: match[2].trim(),
        language: match[1] || 'text',
        index: blockIndex++
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parseInlineElements(content.substring(lastIndex), elements, blockIndex);
    }

    return elements;
  }, [content]);

  // Helper to parse inline code and links
  function parseInlineElements(text: string, elements: Array<{ type: 'text' | 'code' | 'inline-code' | 'link'; content: string; language?: string; index?: number }>, startIndex: number) {
    // Match URLs and inline code
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    let lastIdx = 0;
    const matches: Array<{ index: number; length: number; type: 'url' | 'inline-code'; content: string }> = [];

    // Find all URLs
    let urlMatch;
    while ((urlMatch = urlRegex.exec(text)) !== null) {
      matches.push({
        index: urlMatch.index,
        length: urlMatch[0].length,
        type: 'url',
        content: urlMatch[0]
      });
    }

    // Find all inline code
    let codeMatch;
    while ((codeMatch = inlineCodeRegex.exec(text)) !== null) {
      matches.push({
        index: codeMatch.index,
        length: codeMatch[0].length,
        type: 'inline-code',
        content: codeMatch[1]
      });
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Process matches
    matches.forEach(match => {
      // Add text before match
      if (match.index > lastIdx) {
        const textContent = text.substring(lastIdx, match.index);
        if (textContent) {
          elements.push({ type: 'text', content: textContent });
        }
      }

      // Add the match
      if (match.type === 'url') {
        elements.push({ type: 'link', content: match.content });
      } else {
        elements.push({ type: 'inline-code', content: match.content });
      }

      lastIdx = match.index + match.length;
    });

    // Add remaining text
    if (lastIdx < text.length) {
      const textContent = text.substring(lastIdx);
      if (textContent) {
        elements.push({ type: 'text', content: textContent });
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {parsed.map((element, idx) => {
        if (element.type === 'code') {
          return (
            <div key={idx} className="relative group">
              <div className="flex items-center justify-between px-3 py-1 bg-black/40 rounded-t-lg border-b border-white/10">
                <span className="text-xs text-white/60 font-mono">{element.language}</span>
                <button
                  onClick={() => copyCode(element.content, element.index!)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                  title="Copy code"
                >
                  {copiedBlocks.has(element.index!) ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-white/60" />
                  )}
                </button>
              </div>
              <pre className={cn(
                "p-3 rounded-b-lg overflow-x-auto text-xs font-mono leading-relaxed",
                isSender ? "bg-black/40 text-white/90" : "bg-muted/80 text-foreground"
              )}>
                <code>{element.content}</code>
              </pre>
            </div>
          );
        } else if (element.type === 'inline-code') {
          return (
            <code
              key={idx}
              className={cn(
                "px-1.5 py-0.5 rounded text-xs font-mono",
                isSender 
                  ? "bg-black/40 text-white/90" 
                  : "bg-muted/80 text-foreground"
              )}
            >
              {element.content}
            </code>
          );
        } else if (element.type === 'link') {
          return (
            <div key={idx} className="my-2">
              <LinkPreview url={element.content} compact={false} />
            </div>
          );
        } else {
          return (
            <span key={idx} className="whitespace-pre-wrap break-words">
              {element.content}
            </span>
          );
        }
      })}
    </div>
  );
};
