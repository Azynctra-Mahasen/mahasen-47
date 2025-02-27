
// Follow this setup guide to integrate the Deno standard library
// https://deno.land/manual/examples/module_metadata#module-metadata
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateWebhookUser } from "./auth-handler.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Turn off JWT enforcement
export const corsResponse = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
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
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
        
        // Query the database to find the user with this phone ID
        const { data, error } = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/platform_secrets?whatsapp_phone_id=eq.${phoneIdParam}&order=updated_at.desc&limit=1`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        }).then(res => res.json());
        
        if (error || !data || data.length === 0) {
          console.error('Error fetching verify token:', error);
          return errorResponse('Invalid verification request', 403);
        }
        
        const verifyToken = data[0].whatsapp_verify_token;
        
        // Validate the verification token
        if (token === verifyToken) {
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
      const payload = await req.json();
      console.log('WhatsApp API payload:', JSON.stringify(payload));
      
      // Authenticate the user based on the message payload
      const userContext = await authenticateWebhookUser(payload);
      
      if (!userContext) {
        console.error('Failed to authenticate webhook user');
        return errorResponse('Unauthorized', 401);
      }
      
      console.log(`Processing webhook for user: ${userContext.userId}`);
      
      // Here you would normally process the message
      // For now, we'll just return success
      return new Response(
        JSON.stringify({ success: true }),
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
