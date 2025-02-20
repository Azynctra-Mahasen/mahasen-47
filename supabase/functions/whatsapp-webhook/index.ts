import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { processMessageBatch } from './message-processor.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Set to store processed message IDs
const processedMessages = new Set();

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!;

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return new Response(challenge, { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    return new Response('Verification failed', { 
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('WhatsApp webhook payload:', JSON.stringify(body));

      const changes = body.entry[0].changes[0].value;
      
      if (!changes.messages || changes.messages.length === 0) {
        return new Response('No messages in webhook', { 
          status: 200,
          headers: corsHeaders 
        });
      }

      const messageId = changes.messages[0].id;
      
      // Check if we've already processed this message
      if (processedMessages.has(messageId)) {
        console.log(`Message ${messageId} already processed, skipping`);
        return new Response(JSON.stringify({ success: true, status: 'already_processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Add message to processed set
      processedMessages.add(messageId);
      
      // Clean up old message IDs (keep last 1000)
      if (processedMessages.size > 1000) {
        const idsToRemove = Array.from(processedMessages).slice(0, processedMessages.size - 1000);
        idsToRemove.forEach(id => processedMessages.delete(id));
      }

      const userMessage = changes.messages[0].text.body;
      const userId = changes.contacts[0].wa_id;
      const userName = changes.contacts[0].profile.name;

      console.log(`Processing message from ${userName} (${userId}): ${userMessage}`);

      // Process the message batch
      await processMessageBatch(supabase, [{
        userId,
        userName,
        userMessage,
        platform: 'whatsapp'
      }]);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders 
  });
});
