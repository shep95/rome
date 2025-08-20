-- Remove the unique constraint that prevents multiple message requests
ALTER TABLE public.message_requests 
DROP CONSTRAINT IF EXISTS message_requests_from_user_id_to_user_id_key;

-- Allow users to send multiple message requests to the same person
-- No unique constraint needed for unlimited requests