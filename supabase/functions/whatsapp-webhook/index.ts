
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateWhatsAppUser } from "./auth-handler.ts";
import { processMessage } from "./message-processor.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify webhook
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log("Webhook verification request received:", { mode, token, challenge });

    const verifyToken = Deno.env.get('VERIFY_TOKEN') || '';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log("Webhook verified");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    console.log("Webhook verification failed");
    return new Response('Verification failed', { status: 403, headers: corsHeaders });
  }

  // Handle incoming webhook events
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log("Received webhook event:", JSON.stringify(body, null, 2));

      // Extract the event data
      const entry = body.entry[0];
      if (!entry || !entry.changes || !entry.changes[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid webhook data structure' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const change = entry.changes[0];
      const value = change.value;
      
      if (!value || !value.metadata || !value.metadata.phone_number_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing phone_number_id in metadata' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const phoneNumberId = value.metadata.phone_number_id;
      console.log("Processing message for phone_number_id:", phoneNumberId);
      
      // Authenticate the WhatsApp user
      const userContext = await authenticateWhatsAppUser(phoneNumberId);
      if (!userContext) {
        console.error(`Failed to authenticate user for phone_number_id: ${phoneNumberId}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Authenticated user ${userContext.userId} for phone_number_id ${phoneNumberId}`);

      // Process the message
      await processMessage(value, userContext);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Method not allowed
  return new Response(
    JSON.stringify({ success: false, error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
