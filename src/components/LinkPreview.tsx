import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle, Shield, X, Ban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LinkSecurityScanner } from '@/lib/link-security-scanner';
import { sanitizeUrl, detectXSS, isTrustedDomain, logSecurityEvent } from '@/lib/xss-protection';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [securityStatus, setSecurityStatus] = useState<'safe' | 'warning' | 'danger' | 'blocked' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [safeUrl, setSafeUrl] = useState<string>('#blocked');
  const [blockReason, setBlockReason] = useState<string>('');

  useEffect(() => {
    const analyzeAndFetchPreview = async () => {
      try {
        // Step 1: XSS Detection in URL
        const xssCheck = detectXSS(url);
        if (xssCheck.isXSS) {
          logSecurityEvent('XSS_BLOCKED_IN_LINK', { url, patterns: xssCheck.patterns });
          setSecurityStatus('blocked');
          setBlockReason('XSS attack detected');
          setSafeUrl('#blocked');
          setIsLoading(false);
          return;
        }

        // Step 2: Sanitize URL
        const sanitized = sanitizeUrl(url);
        if (sanitized === '#blocked') {
          logSecurityEvent('DANGEROUS_SCHEME_BLOCKED', { url });
          setSecurityStatus('blocked');
          setBlockReason('Dangerous URL scheme');
          setSafeUrl('#blocked');
          setIsLoading(false);
          return;
        }

        setSafeUrl(sanitized);

        // Step 3: Check if trusted domain
        const trusted = isTrustedDomain(url);
        
        // Step 4: Deep security analysis
        const security = LinkSecurityScanner.analyzeUrl(url);
        
        if (!security.isSafe && security.riskLevel === 'high') {
          logSecurityEvent('HIGH_RISK_LINK_DETECTED', { url, warnings: security.warnings });
          setSecurityStatus('danger');
          setBlockReason(security.warnings[0] || 'High risk link');
        } else if (!security.isSafe) {
          setSecurityStatus('warning');
          setBlockReason(security.warnings[0] || 'Unverified link');
        } else if (trusted) {
          setSecurityStatus('safe');
        } else {
          setSecurityStatus('warning');
          setBlockReason('External link - exercise caution');
        }

        // Step 5: Generate preview
        const urlObj = new URL(sanitized);
        setPreview({
          title: urlObj.hostname,
          description: sanitized.length > 60 ? sanitized.substring(0, 60) + '...' : sanitized,
          favicon: trusted ? `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32` : undefined
        });
      } catch (error) {
        console.error('Error analyzing link:', error);
        setSecurityStatus('blocked');
        setBlockReason('Invalid URL');
        setSafeUrl('#blocked');
      } finally {
        setIsLoading(false);
      }
    };

    analyzeAndFetchPreview();
  }, [url]);

  const handleLinkClick = (e: React.MouseEvent) => {
    if (securityStatus === 'blocked') {
      e.preventDefault();
      toast.error('This link has been blocked for security reasons');
      logSecurityEvent('BLOCKED_LINK_CLICK_ATTEMPT', { url, reason: blockReason });
      return;
    }

    if (securityStatus === 'danger') {
      e.preventDefault();
      const confirmed = window.confirm(
        `⚠️ Security Warning\n\n${blockReason}\n\nThis link may be dangerous. Are you sure you want to continue?`
      );
      if (confirmed) {
        logSecurityEvent('DANGEROUS_LINK_OPENED', { url, reason: blockReason });
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </Card>
    );
  }

  const securityConfig = {
    safe: { icon: Shield, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Trusted link' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Unverified' },
    danger: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Potentially unsafe' },
    blocked: { icon: Ban, color: 'text-red-600', bgColor: 'bg-red-600/20', label: 'Blocked' },
    unknown: { icon: Shield, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Unknown' }
  };

  const config = securityConfig[securityStatus];
  const SecurityIcon = config.icon;

  if (securityStatus === 'blocked') {
    return (
      <Card className={cn("p-4 border-red-600/50", config.bgColor)}>
        <div className="flex items-center gap-3">
          <Ban className="h-6 w-6 text-red-600" />
          <div className="flex-1">
            <h4 className="font-medium text-sm text-red-600">Link Blocked</h4>
            <p className="text-xs text-red-500/80">{blockReason}</p>
          </div>
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={handleLinkClick}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-secondary/50 transition-colors",
          config.bgColor
        )}
      >
        <SecurityIcon className={cn("h-4 w-4", config.color)} />
        {preview?.favicon && (
          <img src={preview.favicon} alt="" className="h-4 w-4" loading="lazy" referrerPolicy="no-referrer" />
        )}
        <span className="text-sm truncate max-w-[200px]">{preview?.title || 'External Link'}</span>
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </a>
    );
  }

  return (
    <Card className={cn("p-4", config.bgColor)}>
      <div className="flex items-start gap-3">
        {preview?.favicon && (
          <img src={preview.favicon} alt="" className="h-8 w-8 rounded" loading="lazy" referrerPolicy="no-referrer" />
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
              {config.label}
              {blockReason && securityStatus !== 'safe' && ` - ${blockReason}`}
            </span>
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={handleLinkClick}
              className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
            >
              {securityStatus === 'danger' ? 'Open anyway' : 'Open link'}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};
