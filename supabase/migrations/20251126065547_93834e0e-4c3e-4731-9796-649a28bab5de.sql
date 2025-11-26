-- Add Tailscale IP configuration columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tailscale_ipv4 TEXT DEFAULT '100.76.16.100',
ADD COLUMN IF NOT EXISTS tailscale_ipv6 TEXT DEFAULT 'fd7a:115c:a1e0::2101:1068',
ADD COLUMN IF NOT EXISTS tailscale_magicdns TEXT DEFAULT 'google-pixel-9.tail976831.ts.net';

-- Update existing users to have the default IPs
UPDATE public.profiles
SET 
  tailscale_ipv4 = COALESCE(tailscale_ipv4, '100.76.16.100'),
  tailscale_ipv6 = COALESCE(tailscale_ipv6, 'fd7a:115c:a1e0::2101:1068'),
  tailscale_magicdns = COALESCE(tailscale_magicdns, 'google-pixel-9.tail976831.ts.net')
WHERE 
  tailscale_ipv4 IS NULL 
  OR tailscale_ipv6 IS NULL 
  OR tailscale_magicdns IS NULL;