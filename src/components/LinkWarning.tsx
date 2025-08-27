import React, { useState } from 'react';
import { AlertTriangle, Shield, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LinkSecurityScanner, LinkSecurityResult } from '@/lib/link-security-scanner';
import { cn } from '@/lib/utils';

interface LinkWarningProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const LinkWarning: React.FC<LinkWarningProps> = ({
  message,
  onDismiss,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const scanResult = LinkSecurityScanner.scanMessage(message);

  if (!scanResult.hasLinks || !scanResult.hasSuspiciousLinks || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
      default:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  const getRiskIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    return riskLevel === 'high' ? (
      <AlertTriangle className="h-4 w-4" />
    ) : (
      <Shield className="h-4 w-4" />
    );
  };

  const suspiciousLinks = scanResult.linkAnalysis.filter(link => !link.isSafe);

  return (
    <Card className={cn(
      "border-l-4 mb-3",
      getRiskColor(scanResult.overallRisk),
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-1">
              {getRiskIcon(scanResult.overallRisk)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium">
                {scanResult.overallRisk === 'high' ? 'Dangerous Link Detected' : 'Suspicious Link Warning'}
              </CardTitle>
              <p className="text-xs mt-1 opacity-90">
                {suspiciousLinks.length === 1 
                  ? 'This message contains a potentially unsafe link.'
                  : `This message contains ${suspiciousLinks.length} potentially unsafe links.`
                } Click to review details.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {suspiciousLinks.map((link, index) => (
              <div key={index} className="space-y-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                        {link.url.length > 50 ? `${link.url.substring(0, 50)}...` : link.url}
                      </code>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          link.riskLevel === 'high' && "border-red-500 text-red-600 dark:text-red-400",
                          link.riskLevel === 'medium' && "border-amber-500 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {link.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                    
                    {link.warnings.length > 0 && (
                      <div className="space-y-1">
                        <h5 className="text-xs font-medium opacity-90">Security Concerns:</h5>
                        <ul className="text-xs space-y-1 opacity-80">
                          {link.warnings.map((warning, wIndex) => (
                            <li key={wIndex} className="flex items-start gap-1">
                              <span className="w-1 h-1 rounded-full bg-current mt-2 flex-shrink-0"></span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {link.recommendations.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <h5 className="text-xs font-medium opacity-90">Recommendations:</h5>
                        <ul className="text-xs space-y-1 opacity-80">
                          {link.recommendations.map((rec, rIndex) => (
                            <li key={rIndex} className="flex items-start gap-1">
                              <span className="w-1 h-1 rounded-full bg-current mt-2 flex-shrink-0"></span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-2 border-t border-border/20">
              <Shield className="h-3 w-3 opacity-60" />
              <span className="text-xs opacity-80">
                Security scan performed locally - no data sent to external servers
              </span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};