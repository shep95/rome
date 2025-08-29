import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SecurityLock } from '@/components/SecurityLock';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, pinVerified, requiresPinVerification, verifyPin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show PIN verification if required
  if (requiresPinVerification && !pinVerified) {
    return (
      <SecurityLock
        isOpen={true}
        onUnlock={verifyPin}
        title="Welcome Back"
        description="Enter your 4-digit PIN to access your account"
      />
    );
  }

  return <>{children}</>;
};