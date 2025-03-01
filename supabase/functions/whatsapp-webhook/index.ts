
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';
import { corsHeaders } from './auth-handler.ts';
import { processWebhookVerification, processIncomingMessage } from './message-processor.ts';

// SUPABASE_URL and SUPABASE_ANON_KEY are automatically injected
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

console.log("WhatsApp Webhook Edge Function started");

serve(async (req) => {
  // This is a preflight request, send back CORS headers
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log the request method
    console.log(`Received ${req.method} request`);

    // Handle GET request (verification)
    if (req.method === 'GET') {
      console.log('Processing webhook verification request');
      return await processWebhookVerification(req);
    }

    // Handle POST request (message)
    if (req.method === 'POST') {
      console.log('Processing incoming message');
      
      // Create a Supabase client without JWT enforcement for processing webhooks
      // JWT enforcement has been disabled to allow external webhook calls
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-webhook-function',
          },
        },
      });
      
      return await processIncomingMessage(req, supabase);
    }

    // If we get here, the request method is not supported
    console.log(`Unsupported request method: ${req.method}`);
    return new Response(
      JSON.stringify({ error: `Unsupported request method: ${req.method}` }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
