import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle, Shield, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { scanLink } from '@/lib/link-security-scanner';
import { cn } from '@/lib/utils';

interface LinkPreviewProps {
  url: string;
  onRemove?: () => void;
  compact?: boolean;
}

export const LinkPreview = ({ url, onRemove, compact = false }: LinkPreviewProps) => {
  const [preview, setPreview] = useState<{
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
  } | null>(null);
  const [securityStatus, setSecurityStatus] = useState<'safe' | 'warning' | 'danger' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // Check security first
        const security = await scanLink(url);
        setSecurityStatus(security.safe ? 'safe' : security.threats.length > 0 ? 'danger' : 'warning');

        // For now, just use basic URL parsing for preview
        // In production, you'd fetch OpenGraph data via an edge function
        const urlObj = new URL(url);
        setPreview({
          title: urlObj.hostname,
          description: url,
          favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
        });
      } catch (error) {
        console.error('Error fetching link preview:', error);
        setSecurityStatus('warning');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (isLoading) {
    return (
      <Card className="p-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </Card>
    );
  }

  const securityConfig = {
    safe: { icon: Shield, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    danger: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    unknown: { icon: Shield, color: 'text-muted-foreground', bgColor: 'bg-muted' }
  };

  const config = securityConfig[securityStatus];
  const SecurityIcon = config.icon;

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-secondary/50 transition-colors",
          config.bgColor
        )}
      >
        <SecurityIcon className={cn("h-4 w-4", config.color)} />
        {preview?.favicon && (
          <img src={preview.favicon} alt="" className="h-4 w-4" />
        )}
        <span className="text-sm truncate max-w-[200px]">{preview?.title || url}</span>
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </a>
    );
  }

  return (
    <Card className={cn("p-4", config.bgColor)}>
      <div className="flex items-start gap-3">
        {preview?.favicon && (
          <img src={preview.favicon} alt="" className="h-8 w-8 rounded" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{preview?.title}</h4>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground truncate mb-2">
            {preview?.description}
          </p>
          
          <div className="flex items-center gap-2">
            <SecurityIcon className={cn("h-3 w-3", config.color)} />
            <span className={cn("text-xs", config.color)}>
              {securityStatus === 'safe' && 'Secure link'}
              {securityStatus === 'warning' && 'Unverified link'}
              {securityStatus === 'danger' && 'Potentially unsafe'}
              {securityStatus === 'unknown' && 'Security check failed'}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
            >
              Open link
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};
