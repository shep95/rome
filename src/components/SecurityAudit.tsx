/**
 * Security Audit Component - Real-time security monitoring
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { securityManager, SecurityAuditResult, SecurityIssue } from '@/lib/enhanced-security';
import { useToast } from '@/hooks/use-toast';

interface SecurityAuditProps {
  onSecurityUpdate?: (result: SecurityAuditResult) => void;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({ onSecurityUpdate }) => {
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Run initial audit
    runSecurityAudit();
    
    // Set up periodic audits every 30 minutes
    const interval = setInterval(runSecurityAudit, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const runSecurityAudit = async () => {
    setIsRunning(true);
    try {
      const result = await securityManager.performSecurityAudit();
      setAuditResult(result);
      setLastAuditTime(new Date());
      onSecurityUpdate?.(result);

      // Show toast for critical issues
      if (result.level === 'critical') {
        toast({
          variant: "destructive",
          title: "Critical Security Issues Detected",
          description: "Immediate attention required for secure communications",
        });
      }
    } catch (error) {
      console.error('Security audit failed:', error);
      toast({
        variant: "destructive",
        title: "Security Audit Failed",
        description: "Unable to perform security check",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const rotateKeys = async () => {
    const password = prompt('Enter your master password to rotate keys:');
    if (!password) return;

    setIsRunning(true);
    try {
      const result = await securityManager.rotateUserKeys(password);
      if (result.success) {
        toast({
          title: "Keys Rotated Successfully",
          description: "Your cryptographic keys have been updated",
        });
        await runSecurityAudit(); // Re-run audit after rotation
      } else {
        throw new Error(result.error || 'Key rotation failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Key Rotation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'secure':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'low':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!auditResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit
          </CardTitle>
          <CardDescription>
            Running comprehensive security analysis...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSecurityIcon(auditResult.level)}
              Security Status
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runSecurityAudit}
              disabled={isRunning}
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Last updated: {lastAuditTime?.toLocaleString() || 'Never'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Security Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Security Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(auditResult.score)}`}>
                  {auditResult.score}/100
                </span>
              </div>
              <Progress value={auditResult.score} className="h-2" />
            </div>

            {/* Security Level Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current Level:</span>
              <Badge variant={auditResult.level === 'secure' ? 'default' : 'destructive'}>
                {auditResult.level.toUpperCase()}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={rotateKeys}
                disabled={isRunning}
              >
                Rotate Keys
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Issues */}
      {auditResult.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Security Issues ({auditResult.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditResult.issues.map((issue, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(issue.severity) as any}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{issue.description}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Impact:</strong> {issue.impact}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Solution:</strong> {issue.solution}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {auditResult.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {auditResult.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityAudit;