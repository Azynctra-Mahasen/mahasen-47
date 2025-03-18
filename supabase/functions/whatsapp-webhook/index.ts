
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticateUser } from './auth-handler.ts';
import { processMessage } from './message-processor.ts';

// Define CORS headers for responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Serve the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract URL components
    const url = new URL(req.url);
    const { searchParams } = url;

    // Handle GET request (webhook verification)
    if (req.method === 'GET') {
      const mode = searchParams.get('hub.mode');
      const token = searchParams.get('hub.verify_token');
      const challenge = searchParams.get('hub.challenge');

      // Validate verification parameters
      if (!mode || !token || !challenge) {
        return new Response('Missing parameters', { status: 400, headers: corsHeaders });
      }

      // Verify webhook
      if (mode === 'subscribe' && token === Deno.env.get('WHATSAPP_VERIFY_TOKEN')) {
        return new Response(challenge, { headers: corsHeaders });
      }

      return new Response('Verification failed', { status: 403, headers: corsHeaders });
    }

    // Handle POST request (webhook event)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('WhatsApp API payload:', JSON.stringify(body, null, 2));

      // Validate webhook payload
      if (!body || body.object !== 'whatsapp_business_account' || !body.entry || body.entry.length === 0) {
        return new Response('Invalid payload', { status: 400, headers: corsHeaders });
      }

      // Process each entry in the payload
      for (const entry of body.entry) {
        // Process changes
        if (!entry.changes || entry.changes.length === 0) continue;

        for (const change of entry.changes) {
          if (change.field !== 'messages' || !change.value) continue;

          // Extract phone_number_id from metadata for authentication
          const phoneNumberId = change.value.metadata?.phone_number_id;
          
          if (!phoneNumberId) {
            console.error('Missing phone_number_id in webhook payload');
            continue;
          }
          
          console.log(`Processing message for phone_number_id: ${phoneNumberId}`);
          
          // Get user context based on phone_number_id
          const userContext = await authenticateUser(phoneNumberId);
          
          if (!userContext) {
            console.error(`No user context found for phone_number_id: ${phoneNumberId}`);
            continue;
          }
          
          // Process the message with the authenticated user context
          await processMessage(change.value, userContext);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle unsupported methods
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
