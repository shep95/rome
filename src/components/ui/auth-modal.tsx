import React, { useState, useEffect } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    loginUsername: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState<string>('');
  const { signIn, signUp } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (activeTab === 'signup') {
        result = await signUp(formData.email, formData.password, formData.loginUsername);
        if (!result.error && result.displayUsername) {
          setGeneratedUsername(result.displayUsername);
        }
      } else {
        result = await signIn(formData.loginUsername, formData.password);
      }

      if (!result.error) {
        onSuccess();
        onClose();
        setFormData({ email: '', password: '', loginUsername: '', username: '' });
        setGeneratedUsername('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl mx-4 max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <div /> {/* Spacer */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-white/5 backdrop-blur-sm p-1 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Enter The Kingdom
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'signup'
                ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="loginUsername" className="text-sm font-medium text-white">
                  Login Username
                </Label>
                <Input
                  id="loginUsername"
                  type="text"
                  value={formData.loginUsername}
                  onChange={(e) => handleInputChange('loginUsername', e.target.value.toLowerCase())}
                  className="bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/50"
                  placeholder="Choose your login username"
                  required
                  pattern="^[a-z0-9_]{6,20}$"
                  minLength={6}
                  maxLength={20}
                />
                <p className="text-xs text-white/60">
                  6-20 characters, lowercase letters, numbers, and underscores only
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">
                  Email (Recovery Only)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/50"
                  placeholder="Enter your email for account recovery"
                  required
                />
                <p className="text-xs text-white/60">
                  Email is only used for account recovery. Your display name will be auto-generated.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="loginUsername" className="text-sm font-medium text-white">
                Login Username
              </Label>
              <Input
                id="loginUsername"
                type="text"
                value={formData.loginUsername}
                onChange={(e) => handleInputChange('loginUsername', e.target.value.toLowerCase())}
                className="bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/50"
                placeholder="Enter your login username"
                required
                pattern="^[a-z0-9_]{6,20}$"
                minLength={6}
                maxLength={20}
              />
              <p className="text-xs text-white/60">
                Use the username you created during signup
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/50"
              placeholder={activeTab === 'signup' ? 'Create a password (min 12 characters)' : 'Enter your password'}
              required
              minLength={12}
            />
          </div>

          {generatedUsername && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
              <p className="text-sm text-green-400 font-medium">
                🎉 Your display name: <span className="font-mono">{generatedUsername}</span>
              </p>
              <p className="text-xs text-green-300 mt-1">
                This is your display name in the app. Use your login username to sign in.
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 backdrop-blur-sm border border-white/10 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              activeTab === 'login' ? 'Enter The Kingdom' : 'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-white/70 mt-4">
          {activeTab === 'signup' ? 
            'Your display name will be auto-generated for maximum security' :
            'Military grade encryption with Argon2 password hashing'
          }
        </div>
      </DialogContent>
    </Dialog>
  );
};