import { useEffect } from 'react';

export const useScreenshotProtection = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    // Disable screenshots and screen recordings
    const preventScreenshot = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable right-click context menu
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable key combinations that can take screenshots
    const preventKeys = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac screenshot shortcuts
        (e.metaKey && e.key === 's') // Mac save
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable drag and drop
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable text selection
    const preventSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Add CSS to prevent selection and screenshots
    const style = document.createElement('style');
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
      }
      
      /* Hide content when screenshot is detected */
      @media print {
        body { display: none !important; }
      }
      
      /* Blur on screenshot attempt (iOS) */
      @supports (-webkit-backdrop-filter: blur(10px)) {
        body::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backdrop-filter: blur(50px);
          pointer-events: none;
          z-index: -1;
        }
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeys);
    document.addEventListener('dragstart', preventDragDrop);
    document.addEventListener('drop', preventDragDrop);
    document.addEventListener('selectstart', preventSelection);
    
    // Prevent screenshots on mobile
    document.addEventListener('touchstart', preventScreenshot);
    document.addEventListener('touchend', preventScreenshot);
    
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
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeys);
      document.removeEventListener('dragstart', preventDragDrop);
      document.removeEventListener('drop', preventDragDrop);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('touchstart', preventScreenshot);
      document.removeEventListener('touchend', preventScreenshot);
      document.head.removeChild(style);
    };
  }, [enabled]);
};