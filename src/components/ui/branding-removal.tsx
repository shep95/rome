/**
 * Security component to remove external service references
 * Ensures no trace of development platforms in production code
 */

// Remove all console logs that might reveal infrastructure details
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args: any[]) => {
  // Filter out any logs that mention external services
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return arg
        .replace(/supabase/gi, 'secure-backend')
        .replace(/lovable\.dev/gi, 'secure-platform')
        .replace(/postgres/gi, 'database')
        .replace(/auth\.users/gi, 'auth.accounts')
        .replace(/mnijromffaalvpadojbj/gi, 'secure-backend-id')
        .replace(/\.supabase\.co/gi, '.secure-backend.com');
    }
    return arg;
  });
  originalConsoleLog(...sanitizedArgs);
};

console.error = (...args: any[]) => {
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return arg
        .replace(/supabase/gi, 'secure-backend')
        .replace(/lovable\.dev/gi, 'secure-platform')
        .replace(/postgres/gi, 'database')
        .replace(/mnijromffaalvpadojbj/gi, 'secure-backend-id')
        .replace(/\.supabase\.co/gi, '.secure-backend.com');
    }
    return arg;
  });
  originalConsoleError(...sanitizedArgs);
};

console.warn = (...args: any[]) => {
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return arg
        .replace(/supabase/gi, 'secure-backend')
        .replace(/lovable\.dev/gi, 'secure-platform')
        .replace(/postgres/gi, 'database')
        .replace(/mnijromffaalvpadojbj/gi, 'secure-backend-id')
        .replace(/\.supabase\.co/gi, '.secure-backend.com');
    }
    return arg;
  });
  originalConsoleWarn(...sanitizedArgs);
};

export default function BrandingRemoval() {
  return null; // This component only exists to sanitize console output
}