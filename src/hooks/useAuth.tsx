import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecurityUtils, CryptoUtils } from '@/lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      // Check rate limiting
      const clientIP = SecurityUtils.getClientIP();
      const rateCheck = await SecurityUtils.checkRateLimit(clientIP, 'signup');
      
      if (!rateCheck.allowed) {
        toast({
          variant: "destructive",
          title: "Too many attempts",
          description: "Please wait before trying again."
        });
        return { error: { message: "Rate limited" } };
      }

      // Validate password strength
      const passwordValidation = await SecurityUtils.validatePassword(password);
      if (!passwordValidation.valid) {
        toast({
          variant: "destructive",
          title: "Password too weak",
          description: "Please choose a stronger password with at least 12 characters, including uppercase, lowercase, numbers, and special characters."
        });
        return { error: { message: "Password too weak" } };
      }

      // Check password against breach database
      const breachCheck = await SecurityUtils.checkPasswordBreach(password);
      if (breachCheck.breached) {
        toast({
          variant: "destructive",
          title: "Password compromised",
          description: "This password has been found in data breaches. Please choose a different password."
        });
        return { error: { message: "Password compromised" } };
      }

      // Generate device fingerprint
      const deviceInfo = await SecurityUtils.generateDeviceFingerprint();
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username || email.split('@')[0],
            display_name: username || email.split('@')[0],
            device_fingerprint: deviceInfo.fingerprint
          }
        }
      });

      // Increment rate limit counter
      await SecurityUtils.incrementRateLimit(clientIP, 'signup');

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            variant: "destructive",
            title: "Account already exists",
            description: "Please sign in instead or use a different email."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message
          });
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration."
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check rate limiting
      const clientIP = SecurityUtils.getClientIP();
      const rateCheck = await SecurityUtils.checkRateLimit(clientIP, 'login');
      
      if (!rateCheck.allowed) {
        toast({
          variant: "destructive",
          title: "Too many attempts",
          description: `Account temporarily locked. ${rateCheck.remainingAttempts} attempts remaining.`
        });
        return { error: { message: "Rate limited" } };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Increment rate limit counter on failed attempt
      if (error) {
        await SecurityUtils.incrementRateLimit(clientIP, 'login');
        
        if (error.message.includes('Invalid login credentials')) {
          toast({
            variant: "destructive",
            title: "Invalid credentials",
            description: "Please check your email and password."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message
          });
        }
      } else {
        // On successful login, initialize crypto keys if they don't exist
        setTimeout(async () => {
          try {
            await CryptoUtils.generateIdentityKeys();
            await CryptoUtils.generatePrekeys(100);
          } catch (err) {
            // Keys might already exist, which is fine
            console.log('Crypto keys already exist or initialization failed:', err);
          }
        }, 1000);
      }

      return { error };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear secure storage
      await SecurityUtils.clearSecureStorage();
      
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};