/**
 * IP Address Utilities - Tailscale Integration
 * Handles Tailscale IP configuration for privacy-focused logging
 */

export interface TailscaleConfig {
  ipv4?: string;
  ipv6?: string;
  magicdns?: string;
}

/**
 * Get all configured Tailscale IPs
 */
export function getTailscaleConfig(): TailscaleConfig {
  try {
    return {
      ipv4: localStorage.getItem('rome-tailscale-ipv4') || undefined,
      ipv6: localStorage.getItem('rome-tailscale-ipv6') || undefined,
      magicdns: localStorage.getItem('rome-tailscale-magicdns') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Get the primary Tailscale IP (IPv4 preferred) or return undefined
 */
export function getTailscaleIP(): string | undefined {
  const config = getTailscaleConfig();
  return config.ipv4 || config.ipv6 || config.magicdns;
}

/**
 * Get the IP address to use for logging
 * Returns a privacy-preserving placeholder IP instead of real user IP
 * We don't collect real user IP addresses for privacy protection
 */
export function getLoggingIP(): string {
  // Return privacy placeholder - we don't collect real user IPs
  return '100.76.16.100';
}

/**
 * Get all privacy placeholder IPs as JSON (for detailed logging)
 * We don't collect real user IP addresses for privacy protection
 */
export function getLoggingIPDetails(): string {
  return JSON.stringify({
    ipv4: '100.76.16.100',
    ipv6: 'fd7a:115c:a1e0::2101:1068',
    magicdns: 'google-pixel-9.tail976831.ts.net',
    source: 'privacy-placeholder'
  });
}

/**
 * Check if all Tailscale IPs are configured
 */
export function isTailscaleFullyConfigured(): boolean {
  const config = getTailscaleConfig();
  return !!(config.ipv4 && config.ipv6 && config.magicdns);
}

/**
 * Check if any Tailscale IP is configured
 */
export function isTailscaleConfigured(): boolean {
  return !!getTailscaleIP();
}
