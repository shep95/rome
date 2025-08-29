import { useEffect } from 'react';
import ScreenshotProtection from '@/plugins/ScreenshotProtection';

/**
 * Enables native screenshot/screen recording protection on mobile (Capacitor)
 * and applies best-effort protections on the web.
 *
 * Note: Real screenshot blocking is only guaranteed on iOS/Android via FLAG_SECURE.
 */
export const useScreenshotProtection = (enabled: boolean = true) => {
  useEffect(() => {
    let styleEl: HTMLStyleElement | null = null;

    const enableWebGuards = () => {
      // Best-effort web guards (cannot fully block screenshots)
      styleEl = document.createElement('style');
      styleEl.setAttribute('data-screenshot-guards', 'true');
      styleEl.textContent = `
        /* Reduce easy content capture */
        body {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        img, video { pointer-events: none; }
      `;
      document.head.appendChild(styleEl);

      const preventKeys = (e: KeyboardEvent) => {
        if (
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) ||
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') ||
          e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')
        ) {
          e.preventDefault();
        }
      };
      document.addEventListener('keydown', preventKeys);

      return () => {
        document.removeEventListener('keydown', preventKeys);
        if (styleEl) document.head.removeChild(styleEl);
      };
    };

    const cleanupWeb = enabled ? enableWebGuards() : undefined;

    const applyNative = async () => {
      try {
        if (enabled) {
          await ScreenshotProtection.enableProtection();
        } else {
          await ScreenshotProtection.disableProtection();
        }
      } catch (e) {
        // ignore if on web
      }
    };

    void applyNative();

    return () => {
      if (cleanupWeb) cleanupWeb();
      // On unmount, attempt to disable native if we enabled unconditionally
      if (enabled) {
        void ScreenshotProtection.disableProtection();
      }
    };
  }, [enabled]);
};
