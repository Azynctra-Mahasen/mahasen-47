
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processMessageBatch } from './message-processor.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const message = await req.json();
    console.log('WhatsApp webhook received:', JSON.stringify(message));

    const changes = message.entry[0].changes[0].value;
    
    if (!changes.messages || changes.messages.length === 0) {
      return new Response('No messages in webhook', { 
        status: 200,
        headers: corsHeaders 
      });
    }

    const userMessage = changes.messages[0].text.body;
    const userId = changes.contacts[0].wa_id;
    const userName = changes.contacts[0].profile.name;

    console.log(`Processing message from ${userName} (${userId}): ${userMessage}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process the message
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
});
