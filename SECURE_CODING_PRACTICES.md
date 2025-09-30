# Secure Coding Practices

## Overview
This document outlines security best practices for developers working on this project. Following these guidelines helps maintain the security integrity of our application.

## TypeScript Configuration

### Strict Mode Requirements
All TypeScript code must be written with strict mode enabled. This catches type-related vulnerabilities at compile time.

**Required Settings:**
- `strict: true` - Enables all strict type checking options
- `noImplicitAny: true` - Disallows implicit any types
- `strictNullChecks: true` - Ensures proper null/undefined handling
- `noUnusedLocals: true` - Flags unused local variables
- `noUnusedParameters: true` - Flags unused function parameters
- `noFallthroughCasesInSwitch: true` - Prevents switch statement fallthrough bugs

**Note:** These settings are configured in `tsconfig.app.json` and `tsconfig.node.json`

## Environment Variables & Secrets

### Critical Rules
1. **NEVER commit `.env` files** - These files contain sensitive credentials
2. **Always use Supabase Secrets** - Store API keys and sensitive data in Supabase secrets management
3. **Use placeholders in examples** - Documentation should use `YOUR_KEY_HERE` instead of real values
4. **Rotate credentials regularly** - Change API keys and secrets quarterly

### Development vs Production
- Development uses placeholder configurations for security
- Production requires proper environment variable configuration
- All secrets must be configured through Supabase dashboard

### Required Environment Variables
```bash
VITE_SUPABASE_PROJECT_ID=your-project-id-here
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## Dependency Management

### Regular Updates
Run these commands regularly to maintain security:

```bash
# Check for vulnerabilities
npm audit

# Attempt automatic fixes
npm audit fix

# For breaking changes requiring manual intervention
npm audit fix --force
```

### Security Audit Schedule
- **Weekly**: Run `npm audit` during development
- **Monthly**: Review and update dependencies
- **Quarterly**: Comprehensive security audit with tools like Snyk or Dependabot

### Adding New Dependencies
Before adding any dependency:
1. Check its security track record on npm
2. Verify it's actively maintained (recent commits)
3. Review the package's permissions and access
4. Run `npm audit` after installation

## Encryption & Cryptography

### Best Practices
1. **Never store private keys in code** - Use Supabase secrets or secure vaults
2. **Always use strong encryption** - AES-256-GCM for data at rest
3. **Implement proper key rotation** - Rotate encryption keys every 90 days
4. **Use secure random number generation** - Crypto-secure RNG for keys and IVs
5. **Validate encrypted data integrity** - Always use HMAC or authenticated encryption

### Testing Security Functions
All cryptographic functions must have end-to-end tests:

```typescript
describe('Encryption', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const plaintext = 'sensitive data';
    const encrypted = await encrypt(plaintext);
    const decrypted = await decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for same plaintext', async () => {
    const plaintext = 'test';
    const encrypted1 = await encrypt(plaintext);
    const encrypted2 = await encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2); // IVs should differ
  });
});
```

## Code Review Checklist

### Security Review Points
- [ ] No hardcoded credentials or API keys
- [ ] All user inputs are validated and sanitized
- [ ] Proper error handling (no sensitive data in error messages)
- [ ] Authentication and authorization checks in place
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (proper input/output encoding)
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented for sensitive operations
- [ ] Secure session management
- [ ] Proper logging (no sensitive data logged)

## Database Security

### Row Level Security (RLS)
1. **Always enable RLS** on user-facing tables
2. **Test RLS policies** - Verify users can't access others' data
3. **Use security definer functions** - For operations requiring elevated privileges
4. **Audit RLS changes** - Review all policy modifications

### SQL Best Practices
```sql
-- Good: Parameterized query
SELECT * FROM users WHERE id = $1;

-- Bad: String concatenation (SQL injection risk)
SELECT * FROM users WHERE id = '" + userId + "';
```

## Authentication & Authorization

### Security Requirements
1. **Enforce strong passwords** - Minimum 12 characters with complexity
2. **Implement rate limiting** - Prevent brute force attacks
3. **Use device fingerprinting** - Detect suspicious login patterns
4. **Log security events** - Track authentication attempts
5. **Enable 2FA** - For sensitive operations

### Session Management
- Sessions expire after 24 hours of inactivity
- Invalidate all sessions on password change
- Use secure, httpOnly cookies
- Implement CSRF tokens

## Input Validation

### Always Validate
1. **Client-side validation** - For UX (not security)
2. **Server-side validation** - For security (critical)
3. **Type checking** - Use TypeScript types and runtime validation
4. **Length limits** - Prevent DoS attacks
5. **Format validation** - Regex for emails, phones, etc.

### Sanitization
```typescript
import { z } from 'zod';

const userInputSchema = z.object({
  email: z.string().email().max(255),
  message: z.string().trim().max(1000),
  username: z.string().regex(/^[a-zA-Z0-9_]+$/).max(50)
});

// Always validate before use
const validated = userInputSchema.parse(userInput);
```

## Error Handling

### Secure Error Messages
```typescript
// Good: Generic error message
throw new Error('Authentication failed');

// Bad: Reveals system details
throw new Error('User john@example.com not found in database table auth_users');
```

### Logging
- Log security events (login attempts, failed auth, etc.)
- Never log passwords, tokens, or sensitive data
- Use structured logging with severity levels
- Implement log rotation and retention policies

## API Security

### Edge Functions
1. **Validate all inputs** - Never trust client data
2. **Use CORS properly** - Restrict origins in production
3. **Implement rate limiting** - Prevent abuse
4. **Authenticate requests** - Verify user identity
5. **Authorize actions** - Check user permissions

### Example Secure Edge Function
```typescript
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // CORS check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Rate limiting
  if (!await checkRateLimit(userId)) {
    return new Response('Too many requests', { status: 429 });
  }

  // Input validation
  const body = await req.json();
  const validated = inputSchema.parse(body);

  // Business logic
  // ...
});
```

## Security Testing

### Required Tests
1. **Unit tests** - For security functions (encryption, validation)
2. **Integration tests** - For authentication flows
3. **E2E tests** - For critical security paths
4. **Penetration testing** - Quarterly by security professionals

### Test Coverage Requirements
- Cryptographic functions: 100%
- Authentication/Authorization: 100%
- Input validation: 100%
- Business logic: 80%+

## Incident Response

### Security Breach Protocol
1. **Isolate affected systems** immediately
2. **Notify security team** within 1 hour
3. **Document the incident** - What, when, how
4. **Contain the breach** - Prevent further damage
5. **Investigate root cause** - Fix the vulnerability
6. **Notify affected users** - Within 72 hours if data exposed
7. **Post-mortem review** - Learn and improve

## Resources

### Tools
- **npm audit** - Dependency vulnerability scanning
- **Snyk** - Continuous security monitoring
- **Dependabot** - Automated dependency updates
- **ESLint Security Plugin** - Code security linting
- **OWASP ZAP** - Web application security testing

### Further Reading
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [TypeScript Security](https://www.typescriptlang.org/docs/handbook/security.html)

## Compliance

This project maintains security standards in accordance with:
- OWASP Top 10 Security Risks
- NIST Cybersecurity Framework
- General Data Protection Regulation (GDPR) principles
- Industry best practices for secure software development

---

**Last Updated:** 2025-09-30  
**Review Schedule:** Quarterly  
**Next Review:** 2025-12-30
