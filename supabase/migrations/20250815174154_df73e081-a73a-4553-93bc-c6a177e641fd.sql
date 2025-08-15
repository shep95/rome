-- Reset accepted message requests to pending
UPDATE message_requests SET status = 'pending' WHERE status = 'accepted';

-- Add screenshot protection field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS screenshot_protection_enabled BOOLEAN DEFAULT true;

-- Update existing profiles to have screenshot protection enabled by default
UPDATE profiles SET screenshot_protection_enabled = true WHERE screenshot_protection_enabled IS NULL;