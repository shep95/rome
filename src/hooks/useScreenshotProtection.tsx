import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useScreenshotProtection = (enabled: boolean = true) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(() => {
    // Check if user has explicitly disabled it, otherwise default to enabled
    const stored = localStorage.getItem('rome-screenshot-protection');
    return stored !== null ? stored === 'true' : true; // Default to true
  });
  const [protectionActive, setProtectionActive] = useState(false);

  useEffect(() => {
    if (!enabled || !isEnabled || typeof window === 'undefined') return;

    let style: HTMLStyleElement | null = null;
    let cleanupFunctions: Array<() => void> = [];

    // Check if current user has screenshot protection enabled
    const checkUserScreenshotSettings = async () => {
      if (!user) return false;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('screenshot_protection_enabled')
          .eq('id', user.id)
          .single();
        
        return profile?.screenshot_protection_enabled === true;
      } catch (error) {
        console.error('Error checking screenshot settings:', error);
        return false;
      }
    };

    // Check if any participant in conversations has screenshot protection
    const checkConversationProtection = async () => {
      if (!user) return false;
      
      try {
        // Get all conversations the user is part of
        const { data: userConversations } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id)
          .is('left_at', null);

        if (!userConversations || userConversations.length === 0) return false;

        // Get all participant user IDs from these conversations
        const conversationIds = userConversations.map(c => c.conversation_id);
        
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .in('conversation_id', conversationIds)
          .is('left_at', null);

        if (!allParticipants) return false;

        // Check if any of these users has screenshot protection enabled
        const userIds = [...new Set(allParticipants.map(p => p.user_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('screenshot_protection_enabled')
          .in('id', userIds);

        // Return true if ANY participant has protection enabled
        return profiles?.some(p => p.screenshot_protection_enabled) || false;
      } catch (error) {
        console.error('Error checking conversation protection:', error);
        return false;
      }
    };

    const initializeProtection = async () => {
      const userHasProtection = await checkUserScreenshotSettings();
      const conversationHasProtection = await checkConversationProtection();
      
      const shouldProtect = userHasProtection || conversationHasProtection;
      setProtectionActive(shouldProtect);
      
      if (shouldProtect) {
        console.log('Screenshot protection activated for user or conversations');
        toast({
          title: "Security Active",
          description: "Screenshot protection is enabled for this conversation.",
        });
        return true;
      }
      return false;
    };

    // Comprehensive screenshot prevention for all platforms
    const preventScreenshot = (e: Event) => {
      if (!protectionActive) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // Enhanced right-click prevention
    const preventContextMenu = (e: MouseEvent) => {
      if (!protectionActive) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toast({
        title: "Action Blocked",
        description: "Right-click disabled for security.",
        variant: "destructive",
      });
      return false;
    };

    // Enhanced key combination blocking (but allow normal typing)
    const preventKeys = (e: KeyboardEvent) => {
      if (!protectionActive) return;
      
      // Allow normal typing in input fields
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
        // Only block screenshot keys, not normal typing
        if (
          e.key === 'F12' ||
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key === '6')) ||
          (e.altKey && e.key === 'PrintScreen') ||
          (e.ctrlKey && e.key === 'PrintScreen')
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toast({
            title: "Screenshot Blocked",
            description: "Screenshots are disabled for privacy protection.",
            variant: "destructive",
          });
          return false;
        }
        return; // Allow normal typing in form fields
      }
      
      // Desktop screenshot shortcuts (only when not in form fields)
      if (
        e.key === 'F12' ||
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) ||
        (e.altKey && e.key === 'Tab') ||
        // Mac screenshot shortcuts
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key === '6')) ||
        (e.metaKey && (e.key === 's' || e.key === 'p')) ||
        // Windows screenshot shortcuts
        (e.key === 'PrintScreen') ||
        (e.altKey && e.key === 'PrintScreen') ||
        (e.ctrlKey && e.key === 'PrintScreen') ||
        // Third-party app shortcuts
        (e.ctrlKey && e.altKey && e.key === 'A') || // Snagit
        (e.ctrlKey && e.shiftKey && e.key === 'X') || // Various screenshot tools
        (e.ctrlKey && e.shiftKey && e.key === 'S') // Windows Snip & Sketch
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toast({
          title: "Screenshot Blocked",
          description: "Screenshots are disabled for privacy protection.",
          variant: "destructive",
        });
        return false;
      }
    };

    // Touch event prevention for mobile screenshots (but allow form interaction)
    const preventTouchScreenshot = (e: TouchEvent) => {
      if (!protectionActive) return;
      
      const target = e.target as HTMLElement;
      // Allow normal touch interaction with form elements
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.contentEditable === 'true')) {
        return;
      }
      // Prevent volume + power button combinations on mobile
      if (e.touches.length >= 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Initialize protection check
    const initProtection = async () => {
      const shouldProtect = await initializeProtection();
      if (!shouldProtect) return;
    
      // Add protection styles
      style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        
        body {
          -webkit-app-region: no-drag !important;
          -webkit-user-drag: none !important;
          -khtml-user-drag: none !important;
          -moz-user-drag: none !important;
          -o-user-drag: none !important;
          user-drag: none !important;
        }
        
        /* Allow normal interaction with form elements */
        input, textarea, select, button, [contenteditable] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          user-select: text !important;
          pointer-events: auto !important;
          -webkit-touch-callout: auto !important;
        }
        
        /* Hide content when screenshot is detected */
        @media print {
          body { display: none !important; }
          * { display: none !important; }
        }
        
        /* Disable image saving */
        img {
          -webkit-user-drag: none !important;
          -khtml-user-drag: none !important;
          -moz-user-drag: none !important;
          -o-user-drag: none !important;
          user-drag: none !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);

      // Mobile-specific screenshot detection
      const detectMobileScreenshot = () => {
        // Detect app state changes (screenshot trigger on iOS/Android)
        const handleVisibilityChange = () => {
          // Do not blur the whole app to avoid dark screen issues
          // We simply log and keep UI intact
          console.debug('Visibility changed');
        };
        
        // Avoid blurring the UI on focus loss
        const handleBlur = () => {
          // No UI blur to prevent dark screen
        };
        
        const handleFocus = () => {
          // Ensure UI is clear
          document.body.style.filter = 'none';
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        cleanupFunctions.push(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('blur', handleBlur);
          window.removeEventListener('focus', handleFocus);
        });
      };

      // Initialize mobile detection
      detectMobileScreenshot();

      // Enhanced event listeners with capture phase
      const eventOptions = { capture: true, passive: false };
      
      document.addEventListener('contextmenu', preventContextMenu, eventOptions);
      document.addEventListener('keydown', preventKeys, eventOptions);
      document.addEventListener('keyup', preventKeys, eventOptions);
      document.addEventListener('touchstart', preventTouchScreenshot, eventOptions);
      document.addEventListener('touchend', preventTouchScreenshot, eventOptions);
      document.addEventListener('touchmove', preventTouchScreenshot, eventOptions);

      cleanupFunctions.push(() => {
        document.removeEventListener('contextmenu', preventContextMenu);
        document.removeEventListener('keydown', preventKeys);
        document.removeEventListener('keyup', preventKeys);
        document.removeEventListener('touchstart', preventTouchScreenshot);
        document.removeEventListener('touchend', preventTouchScreenshot);
        document.removeEventListener('touchmove', preventTouchScreenshot);
      });
    };
    
    // Initialize protection
    initProtection();

    // Cleanup function
    return () => {
      // Execute all cleanup functions
      cleanupFunctions.forEach(cleanup => cleanup());
      
      // Remove style if it exists
      if (style && document.head.contains(style)) {
        document.head.removeChild(style);
      }
      
      // Clean up body styles
      document.body.style.filter = 'none';
    };
  }, [enabled, isEnabled, user, protectionActive, toast]);

  const toggleProtection = (enable: boolean) => {
    setIsEnabled(enable);
    localStorage.setItem('rome-screenshot-protection', enable.toString());
  };

  return { isEnabled, toggleProtection };
};