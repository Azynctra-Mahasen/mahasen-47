
-- Set REPLICA IDENTITY to FULL for the messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add the messages table to the realtime publication if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
