
-- This is a reference SQL script to create the conversation_contexts table if it doesn't exist
-- Execute this in the Supabase SQL editor if needed

-- Create conversation_contexts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conversation_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id),
  context_type TEXT NOT NULL,
  context TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.conversation_contexts ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own conversation contexts
CREATE POLICY "Users can view their own conversation contexts" 
ON public.conversation_contexts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE public.conversations.id = conversation_id 
    AND public.conversations.user_id = auth.uid()
  )
);

-- Allow users to insert their own conversation contexts
CREATE POLICY "Users can insert their own conversation contexts" 
ON public.conversation_contexts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE public.conversations.id = conversation_id 
    AND public.conversations.user_id = auth.uid()
  )
);

-- Allow users to update their own conversation contexts
CREATE POLICY "Users can update their own conversation contexts" 
ON public.conversation_contexts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE public.conversations.id = conversation_id 
    AND public.conversations.user_id = auth.uid()
  )
);

-- Allow users to delete their own conversation contexts
CREATE POLICY "Users can delete their own conversation contexts" 
ON public.conversation_contexts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE public.conversations.id = conversation_id 
    AND public.conversations.user_id = auth.uid()
  )
);

-- Add a trigger to update the updated_at column
CREATE TRIGGER update_conversation_context_timestamp
AFTER INSERT OR UPDATE ON public.conversation_contexts
FOR EACH ROW
EXECUTE FUNCTION update_context_timestamp();
