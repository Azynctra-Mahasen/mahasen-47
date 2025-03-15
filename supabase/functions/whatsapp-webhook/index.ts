
// Follow this setup guide to integrate the Deno standard library
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateWebhook } from "./auth-handler.ts";
import { processMessage } from "./message-processor.ts";

// Define CORS headers for responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the URL object from the request URL
  const url = new URL(req.url);
  
  // Handle verification requests (GET)
  if (req.method === 'GET') {
    // Extract query parameters
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const phoneNumberId = url.searchParams.get('phoneNumberId');
    
    console.log('Received verification request:', { mode, token, phoneNumberId });
    
    // Basic validation
    if (!mode || !token || !challenge) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verify token
    const expectedToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expectedToken) {
      console.log('Verification successful');
      return new Response(challenge, { 
        status: 200,
        headers: corsHeaders
      });
    } else {
      console.error('Verification failed - Invalid token');
      return new Response(
        JSON.stringify({ error: 'Invalid verification token' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // Handle webhook notifications (POST)
  if (req.method === 'POST') {
    try {
      // Parse the request body
      const body = await req.json();
      console.log('Webhook received:', JSON.stringify(body, null, 2));
      
      // Validate the webhook payload
      if (!body || !body.entry || !body.entry.length) {
        console.error('Invalid webhook payload format');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook payload format' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Extract metadata from the payload
      const metadata = body?.entry?.[0]?.changes?.[0]?.value?.metadata;
      if (!metadata || !metadata.phone_number_id) {
        console.error('Missing metadata or phone_number_id');
        return new Response(
          JSON.stringify({ error: 'Missing metadata' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Extract WhatsApp business account ID and phone number ID
      const phoneNumberId = metadata.phone_number_id;
      console.log('Processing webhook for phone ID:', phoneNumberId);
      
      // Authenticate the webhook and get user context
      const userContext = await authenticateWebhook(phoneNumberId);
      if (!userContext) {
        console.error('Authentication failed for phone number ID:', phoneNumberId);
        return new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Process incoming messages if present
      const value = body?.entry?.[0]?.changes?.[0]?.value;
      if (value?.messages && value.messages.length > 0) {
        await processMessage(value, userContext);
      } else {
        console.log('No messages to process in this webhook');
      }
      
      // Return a success response
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error processing webhook:', error);
      
      // Store the error for debugging
      try {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = error instanceof Error && error.stack ? error.stack : 'No stack trace';
        
        console.error('Error details:', errorMessage, errorDetails);
        
        // You could store this error in your database for debugging
        // await storeWebhookError(errorMessage, errorDetails);
      } catch (loggingError) {
        console.error('Error logging webhook error:', loggingError);
      }
      
      // Return an error response
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // Handle unsupported methods
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
});
