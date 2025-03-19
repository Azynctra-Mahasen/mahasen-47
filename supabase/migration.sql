
-- This is a placeholder file and won't be executed directly.
-- The SQL below is for reference for you to execute in the Supabase SQL editor.

-- Create message_metadata table to store metadata for messages
CREATE TABLE IF NOT EXISTS public.message_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS message_metadata_message_id_idx ON public.message_metadata(message_id);

-- Add RLS policies for tickets table to ensure proper user isolation
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own tickets
CREATE POLICY "Users can view their own tickets" 
ON tickets FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to create their own tickets
CREATE POLICY "Users can create their own tickets" 
ON tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tickets
CREATE POLICY "Users can update their own tickets" 
ON tickets FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own tickets
CREATE POLICY "Users can delete their own tickets" 
ON tickets FOR DELETE 
USING (auth.uid() = user_id);

-- Ensure user_id is not nullable
ALTER TABLE tickets 
ALTER COLUMN user_id SET NOT NULL;

-- Add index on user_id for better query performance
CREATE INDEX IF NOT EXISTS tickets_user_id_idx ON tickets(user_id);

-- Add trigger to update updated_at field automatically
CREATE OR REPLACE FUNCTION update_message_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_metadata_updated_at
BEFORE UPDATE ON message_metadata
FOR EACH ROW
EXECUTE FUNCTION update_message_metadata_updated_at();
