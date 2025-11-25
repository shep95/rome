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
 * Get the IP address to use for logging (Tailscale if configured, otherwise default)
 * Returns the primary IP address as a string (for database logging)
 */
export function getLoggingIP(): string {
  const config = getTailscaleConfig();
  
  // Return the primary Tailscale IP (IPv4 preferred)
  if (config.ipv4) return config.ipv4;
  if (config.ipv6) return config.ipv6;
  if (config.magicdns) return config.magicdns;
  
  return 'client-browser';
}

/**
 * Get the full Tailscale config as JSON (for detailed logging)
 */
export function getLoggingIPDetails(): string {
  const config = getTailscaleConfig();
  
  // If all three are configured, return them as a JSON object
  if (config.ipv4 && config.ipv6 && config.magicdns) {
    return JSON.stringify({
      ipv4: config.ipv4,
      ipv6: config.ipv6,
      magicdns: config.magicdns,
      source: 'tailscale'
    });
  }
  
  // If partially configured, return what's available
  if (config.ipv4 || config.ipv6 || config.magicdns) {
    return JSON.stringify({
      ...config,
      source: 'tailscale-partial'
    });
  }
  
  return 'client-browser';
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
