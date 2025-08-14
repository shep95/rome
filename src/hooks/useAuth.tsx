import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecurityUtils, CryptoUtils } from '@/lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string, code?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, code?: string) => Promise<{ error: any }>;
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
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Load and persist user profile data
        if (session?.user) {
          // Store user security code when user signs in
          if (session.user.user_metadata?.security_code) {
            localStorage.setItem('userSecurityCode', session.user.user_metadata.security_code);
          }
          
          // Load user profile from database
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (profile) {
                // Restore profile image if it exists
                if (profile.avatar_url) {
                  localStorage.setItem('rome-profile-image', profile.avatar_url);
                }
                // Store username for quick access
                if (profile.username) {
                  localStorage.setItem('rome-username', profile.username);
                }
                if (profile.display_name) {
                  localStorage.setItem('rome-display-name', profile.display_name);
                }
              }
            } catch (error) {
              console.error('Error loading user profile:', error);
            }
          }, 0);
        } else {
          // Clear stored data when user logs out
          localStorage.removeItem('userSecurityCode');
          localStorage.removeItem('rome-profile-image');
          localStorage.removeItem('rome-username');
          localStorage.removeItem('rome-display-name');
        }
      }
    );

    // Check for existing session and load profile data
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Load profile data if user is already logged in
      if (session?.user) {
        if (session.user.user_metadata?.security_code) {
          localStorage.setItem('userSecurityCode', session.user.user_metadata.security_code);
        }
        
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profile) {
            if (profile.avatar_url) {
              localStorage.setItem('rome-profile-image', profile.avatar_url);
            }
            if (profile.username) {
              localStorage.setItem('rome-username', profile.username);
            }
            if (profile.display_name) {
              localStorage.setItem('rome-display-name', profile.display_name);
            }
          }
        } catch (error) {
          console.error('Error loading initial profile:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string, code?: string) => {
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

      // Validate 4-digit code
      if (!code || code.length !== 4 || !/^\d{4}$/.test(code)) {
        toast({
          variant: "destructive",
          title: "Invalid security code",
          description: "Please enter a 4-digit numeric security code."
        });
        return { error: { message: "Invalid code" } };
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
            device_fingerprint: deviceInfo.fingerprint,
            security_code: code
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

  const signIn = async (email: string, password: string, code?: string) => {
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

      // Validate 4-digit code
      if (!code || code.length !== 4 || !/^\d{4}$/.test(code)) {
        toast({
          variant: "destructive",
          title: "Invalid security code",
          description: "Please enter your 4-digit security code."
        });
        return { error: { message: "Invalid code" } };
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
      // Clear all local storage data first
      localStorage.removeItem('securityCode');
      localStorage.removeItem('userSecurityCode');
      localStorage.removeItem('rome-profile-image');
      
      // Clear secure storage
      await SecurityUtils.clearSecureStorage();
      
      // Force clear the session state immediately
      setSession(null);
      setUser(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Sign out error:', error);
        // Even if there's an error, we've cleared local state
      }
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Clear local state even if signOut fails
      setSession(null);
      setUser(null);
      localStorage.clear();
      
      toast({
        title: "Signed out",
        description: "You have been signed out locally."
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