import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

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
    username: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
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
        result = await signUp(formData.email, formData.password, formData.username, formData.code);
      } else {
        result = await signIn(formData.email, formData.password, formData.code);
      }

      if (!result.error) {
        onSuccess();
        onClose();
        setFormData({ email: '', password: '', username: '', code: '' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl mx-4 max-w-[90vw]">
        <DialogHeader>
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-semibold text-white">
               {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
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
            Login
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
          {activeTab === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-white">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/50"
                placeholder="Choose a username"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/50"
              placeholder="Enter your email"
              required
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium text-white">
              4-Digit Security Code
            </Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/50 text-center text-lg tracking-widest"
              placeholder="••••"
              required
              maxLength={4}
              pattern="[0-9]{4}"
            />
            <p className="text-xs text-white/60">
              {activeTab === 'signup' ? 'Create a 4-digit code for secure access' : 'Enter your 4-digit security code'}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 backdrop-blur-sm border border-white/10"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              activeTab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-white/70 mt-4">
          {activeTab === 'signup' ? 
            'Check your email for a confirmation link after signing up' :
            'Military grade encryption ensures your data stays secure'
          }
        </div>
      </DialogContent>
    </Dialog>
  );
};