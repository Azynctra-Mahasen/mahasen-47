
// Follow this setup guide to integrate the Deno standard library
// https://deno.land/manual/examples/module_metadata#module-metadata
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  authenticateWebhookUser, 
  extractPhoneNumberId,
  getUserByPhoneId
} from "./auth-handler.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const errorResponse = (message: string, status = 400) => {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle GET requests for webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      
      // Extract query params
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      // The webhook is being verified - handle verification
      if (mode === 'subscribe' && token && challenge) {
        console.log('Verification request received');
        
        // Extract the WhatsApp phone ID from the querystring
        const phoneIdParam = url.searchParams.get('phone_id');
        if (!phoneIdParam) {
          console.error('No phone_id provided in verification request');
          return errorResponse('Missing phone_id parameter', 400);
        }
        
        // Get the user with this phone ID
        const userContext = await getUserByPhoneId(phoneIdParam);
        
        if (!userContext) {
          console.error('No user found for the given phone_id');
          return errorResponse('Invalid verification request', 403);
        }
        
        // Validate the verification token
        if (token === userContext.whatsappVerifyToken) {
          console.log('Webhook verified successfully');
          return new Response(challenge, {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        } else {
          console.error('Token validation failed');
          return errorResponse('Invalid verification token', 403);
        }
      }
      
      return errorResponse('Invalid verification request', 400);
    }
    
    // Handle POST requests for incoming messages
    if (req.method === 'POST') {
      let payload;
      try {
        payload = await req.json();
        console.log('WhatsApp API payload:', JSON.stringify(payload));
      } catch (error) {
        console.error('Error parsing request body:', error);
        return errorResponse('Invalid request body', 400);
      }
      
      // Authenticate the user based on the message payload
      const userContext = await authenticateWebhookUser(payload);
      
      if (!userContext) {
        console.error('Failed to authenticate webhook user');
        return errorResponse('Failed to authenticate webhook user', 401);
      }
      
      console.log(`Processing webhook for user: ${userContext.userId}`);
      
      // Here is where you would implement the actual message handling logic
      // Return a simple success response for now
      return new Response(
        JSON.stringify({ 
          success: true, 
          userId: userContext.userId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return method not allowed for other HTTP methods
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return errorResponse(`Internal Server Error: ${error.message}`, 500);
  }
});
