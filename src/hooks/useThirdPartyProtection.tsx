import { useEffect, useState } from 'react';
import { thirdPartyProtection, ThreatDetection } from '@/lib/third-party-protection';
import { toast } from 'sonner';

export const useThirdPartyProtection = () => {
  const [isProtected, setIsProtected] = useState(false);
  const [threats, setThreats] = useState<ThreatDetection[]>([]);

  useEffect(() => {
    // Protection is automatically initialized
    setIsProtected(true);

    // Show initial protection status
    toast.success('🛡️ Third-party protection enabled', {
      description: 'Your app is protected from unauthorized access',
      duration: 2000,
    });

    return () => {
      setIsProtected(false);
    };
  }, []);

  const validateFile = async (file: File) => {
    try {
      const result = await thirdPartyProtection.validateFileUpload(file);
      
      if (!result.safe && result.threat) {
        setThreats(prev => [...prev, result.threat!]);
        
        toast.error('🚫 File blocked', {
          description: result.threat.details,
          duration: 4000,
        });
        
        return false;
      }
      
      return true;
    } catch (error) {
      toast.error('File validation failed', {
        description: 'Unable to verify file safety',
      });
      return false;
    }
  };

  const blockOrigin = (origin: string) => {
    thirdPartyProtection.blockOrigin(origin);
    toast.info('🔒 Origin blocked', {
      description: `Blocked access from: ${origin}`,
    });
  };

  const allowOrigin = (origin: string) => {
    thirdPartyProtection.allowOrigin(origin);
    toast.info('✅ Origin allowed', {
      description: `Allowed access from: ${origin}`,
    });
  };

  return {
    isProtected,
    threats,
    validateFile,
    blockOrigin,
    allowOrigin,
    getBlockedOrigins: () => thirdPartyProtection.getBlockedOrigins(),
  };
};