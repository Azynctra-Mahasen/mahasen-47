
// @ts-ignore // Needed for Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Initializing WhatsApp webhook function...'); // Initial boot log

serve(async (req) => {
  // Immediate logging to verify function is receiving requests
  console.log(`[${new Date().toISOString()}] Received ${req.method} request`);

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // For GET requests (webhook verification)
    if (req.method === 'GET') {
      console.log('Processing verification request');
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Verification parameters:', { mode, token });

      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
      if (!verifyToken) {
        console.error('WHATSAPP_VERIFY_TOKEN not set');
        throw new Error('Webhook verification token not configured');
      }

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully');
        return new Response(challenge, {
          headers: { ...corsHeaders }
        });
      }

      console.log('Verification failed');
      return new Response('Verification failed', {
        status: 403,
        headers: corsHeaders
      });
    }

    // For POST requests (incoming messages)
    if (req.method === 'POST') {
      console.log('Processing incoming message');
      
      const body = await req.json();
      console.log('Received payload:', JSON.stringify(body, null, 2));

      // Validate payload structure
      if (!body.entry?.[0]?.changes?.[0]?.value) {
        console.error('Invalid payload structure');
        return new Response(
          JSON.stringify({ error: 'Invalid payload structure' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const message = body.entry[0].changes[0].value;
      console.log('Processing message:', message);

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        throw new Error('Database configuration missing');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Log to database for debugging
      await supabase
        .from('system_logs')
        .insert({
          component: 'whatsapp-webhook',
          log_level: 'INFO',
          message: 'Webhook received message',
          metadata: { payload: message }
        });

      return new Response(
        JSON.stringify({ success: true }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle unsupported methods
    console.log(`Unsupported method: ${req.method}`);
    return new Response(
      'Method not allowed', 
      { status: 405, headers: corsHeaders }
    );

  } catch (error) {
    // Log any errors
    console.error('Error in webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Log successful initialization
console.log('WhatsApp webhook function initialized successfully');
