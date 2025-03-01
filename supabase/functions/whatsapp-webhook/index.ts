
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processMessage } from "./message-processor.ts";
import * as database from "./database.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  // Add CORS headers to all responses
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  
  try {
    // Handle GET request (webhook verification)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      // For verification from WhatsApp
      if (mode === 'subscribe' && challenge) {
        console.log('Webhook verification request received');
        // Note: We're not enforcing token verification here to allow external webhook calls
        return new Response(challenge, { 
          status: 200, 
          headers 
        });
      }
      
      return new Response(JSON.stringify({ message: 'Invalid verification request' }), { 
        status: 400, 
        headers 
      });
    }
    
    // Handle POST request (incoming messages)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Received WhatsApp webhook:', JSON.stringify(body));
      
      // Extract phone_number_id from the WhatsApp payload
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const metadata = value?.metadata;
      const phoneNumberId = metadata?.phone_number_id;
      
      if (!phoneNumberId) {
        console.error('No phone_number_id found in the webhook payload');
        return new Response(JSON.stringify({ success: false, error: 'Missing phone_number_id' }), { 
          status: 400, 
          headers 
        });
      }
      
      // Process the incoming message
      const result = await processMessage(body, phoneNumberId);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers
      });
    }
    
    // Handle unsupported methods
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Log the error to the webhook_errors table
    try {
      await database.logWebhookError('processing_error', error.message, {
        error_stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    }), { 
      status: 500, 
      headers 
    });
  }
});
