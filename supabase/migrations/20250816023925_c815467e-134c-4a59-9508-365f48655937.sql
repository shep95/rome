-- Enable realtime for typing_indicators table
ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Enable realtime for message_reads table  
ALTER TABLE public.message_reads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;