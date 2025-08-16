-- Add replied_to_message_id column to messages table for reply functionality
ALTER TABLE public.messages 
ADD COLUMN replied_to_message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE;