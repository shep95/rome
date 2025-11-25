/**
 * IP Address Utilities - Tailscale Integration
 * Handles Tailscale IP configuration for privacy-focused logging
 */

/**
 * Get the configured Tailscale IP or return undefined
 */
export function getTailscaleIP(): string | undefined {
  try {
    const tailscaleIP = localStorage.getItem('rome-tailscale-ip');
    return tailscaleIP || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get the IP address to use for logging (Tailscale if configured, otherwise default)
 */
export function getLoggingIP(): string {
  return getTailscaleIP() || 'client-browser';
}

/**
 * Check if Tailscale IP is configured
 */
export function isTailscaleConfigured(): boolean {
  return !!getTailscaleIP();
}
