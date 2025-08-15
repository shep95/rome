import { useEffect } from 'react';

export const useScreenshotProtection = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    // Mobile-specific screenshot protection
    const preventMobileScreenshot = () => {
      // Create overlay to block screenshots on mobile
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: transparent !important;
        pointer-events: none !important;
        z-index: 999999 !important;
        -webkit-user-select: none !important;
        -webkit-touch-callout: none !important;
      `;
      overlay.setAttribute('data-screenshot-protection', 'true');
      document.body.appendChild(overlay);
      
      return overlay;
    };

    // Comprehensive screenshot prevention for all platforms
    const preventScreenshot = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // Enhanced right-click prevention
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // Enhanced key combination blocking (but allow normal typing)
    const preventKeys = (e: KeyboardEvent) => {
      // Allow normal typing in input fields
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
        // Only block screenshot keys, not normal typing
        if (
          e.key === 'F12' ||
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key === '6')) ||
          (e.key === 'PrintScreen') ||
          (e.altKey && e.key === 'PrintScreen') ||
          (e.ctrlKey && e.key === 'PrintScreen')
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
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
        return false;
      }
    };

    // Enhanced drag and drop prevention
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // Enhanced text selection prevention (but allow in form fields)
    const preventSelection = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection in input fields and textareas
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // Touch event prevention for mobile screenshots (but allow form interaction)
    const preventTouchScreenshot = (e: TouchEvent) => {
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

    // Prevent copy operations (but allow in form fields)
    const preventCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow copy/paste in input fields and textareas
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // Create mobile overlay for screenshot protection
    const mobileOverlay = preventMobileScreenshot();

    // Enhanced CSS protection for all devices
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
        -webkit-appearance: none !important;
      }
      
      body {
        -webkit-app-region: no-drag !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
      
      /* Enhanced mobile protection - but allow input */
      @media screen and (max-width: 768px) {
        body {
          -webkit-touch-callout: none !important;
          touch-action: manipulation !important;
        }
        
        input, textarea, [contenteditable] {
          -webkit-touch-callout: auto !important;
          -webkit-user-select: text !important;
          touch-action: auto !important;
          pointer-events: auto !important;
        }
        
        *:not(input):not(textarea):not([contenteditable]) {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          pointer-events: auto !important;
        }
      }
      
      /* Hide content when screenshot is detected */
      @media print {
        body { display: none !important; }
        * { display: none !important; }
      }
      
      /* Protection against screenshot apps */
      body::after {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: transparent;
        pointer-events: none;
        z-index: 999998;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        user-select: none !important;
      }
      
      /* Advanced mobile screenshot protection */
      @supports (-webkit-backdrop-filter: blur(10px)) {
        body.screenshot-attempt {
          -webkit-backdrop-filter: blur(50px) !important;
          backdrop-filter: blur(50px) !important;
        }
      }
      
      /* Disable image saving but allow form inputs */
      img {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
      }
      
      /* Allow normal interaction with form elements */
      input, textarea, select, button, [contenteditable] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        user-select: text !important;
        pointer-events: auto !important;
        -webkit-touch-callout: auto !important;
      }
    `;
    document.head.appendChild(style);

    // Mobile-specific screenshot detection
    const detectMobileScreenshot = () => {
      // Detect app state changes (screenshot trigger on iOS/Android)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          document.body.classList.add('screenshot-attempt');
        } else {
          setTimeout(() => {
            document.body.classList.remove('screenshot-attempt');
          }, 1000);
        }
      });
      
      // Detect focus loss (potential screenshot)
      window.addEventListener('blur', () => {
        document.body.style.filter = 'blur(20px)';
      });
      
      window.addEventListener('focus', () => {
        document.body.style.filter = 'none';
      });
    };

    // Initialize mobile detection
    detectMobileScreenshot();

    // Enhanced event listeners with capture phase
    const eventOptions = { capture: true, passive: false };
    
    document.addEventListener('contextmenu', preventContextMenu, eventOptions);
    document.addEventListener('keydown', preventKeys, eventOptions);
    document.addEventListener('keyup', preventKeys, eventOptions);
    document.addEventListener('dragstart', preventDragDrop, eventOptions);
    document.addEventListener('drop', preventDragDrop, eventOptions);
    document.addEventListener('selectstart', preventSelection, eventOptions);
    document.addEventListener('copy', preventCopy, eventOptions);
    document.addEventListener('cut', preventCopy, eventOptions);
    document.addEventListener('paste', preventCopy, eventOptions);
    
    // Enhanced mobile touch protection
    document.addEventListener('touchstart', preventTouchScreenshot, eventOptions);
    document.addEventListener('touchend', preventTouchScreenshot, eventOptions);
    document.addEventListener('touchmove', preventTouchScreenshot, eventOptions);
    
    // Prevent screenshot via gesture/hardware buttons
    document.addEventListener('gesturestart', preventScreenshot, eventOptions);
    document.addEventListener('gesturechange', preventScreenshot, eventOptions);
    document.addEventListener('gestureend', preventScreenshot, eventOptions);
    
    // Detect if developer tools are open
    let devtools = { open: false, orientation: null };
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        if (!devtools.open) {
          devtools.open = true;
          console.clear();
          console.log('%cSecurity Alert!', 'color: red; font-size: 50px; font-weight: bold;');
          console.log('%cScreenshots and recordings are disabled for security.', 'color: red; font-size: 20px;');
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Cleanup function
    return () => {
      // Remove all enhanced event listeners
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeys);
      document.removeEventListener('keyup', preventKeys);
      document.removeEventListener('dragstart', preventDragDrop);
      document.removeEventListener('drop', preventDragDrop);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('touchstart', preventTouchScreenshot);
      document.removeEventListener('touchend', preventTouchScreenshot);
      document.removeEventListener('touchmove', preventTouchScreenshot);
      document.removeEventListener('gesturestart', preventScreenshot);
      document.removeEventListener('gesturechange', preventScreenshot);
      document.removeEventListener('gestureend', preventScreenshot);
      
      // Remove style and overlay
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      if (mobileOverlay && document.body.contains(mobileOverlay)) {
        document.body.removeChild(mobileOverlay);
      }
      
      // Clean up body styles
      document.body.style.filter = 'none';
      document.body.classList.remove('screenshot-attempt');
    };
  }, [enabled]);
};