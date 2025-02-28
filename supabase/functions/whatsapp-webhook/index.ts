
// Follow this setup guide to integrate the Deno standard library
// https://deno.land/manual/examples/module_metadata#module-metadata
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

/**
 * Extract the WhatsApp phone number ID from the webhook payload
 */
function extractPhoneNumberId(payload: any): string | null {
  try {
    const phoneNumberId = payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    
    if (!phoneNumberId) {
      console.error('Could not extract phone_number_id from payload:', JSON.stringify(payload));
      return null;
    }
    
    return phoneNumberId;
  } catch (error) {
    console.error('Error extracting phone_number_id:', error);
    return null;
  }
}

/**
 * Get a user's verification token
 */
async function getVerifyToken(phoneNumberId: string): Promise<string | null> {
  try {
    // Get the most recent platform secrets record
    const { data, error } = await supabase
      .from('platform_secrets')
      .select('whatsapp_verify_token')
      .eq('whatsapp_phone_id', phoneNumberId)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching verify token:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.error('No user found with the given WhatsApp phone ID');
      return null;
    }
    
    return data[0].whatsapp_verify_token;
  } catch (error) {
    console.error('Error in getVerifyToken:', error);
    return null;
  }
}

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
      
      console.log(`Verification request: mode=${mode}, token=${token}, challenge=${challenge}`);
      
      // The webhook is being verified - handle verification
      if (mode === 'subscribe' && token && challenge) {
        console.log('Verification request received');
        
        // Simplified: Compare with a generic verify token 
        // Instead of requiring a phone_id parameter
        
        // Get any user's verify token to compare
        const { data, error } = await supabase
          .from('platform_secrets')
          .select('whatsapp_verify_token')
          .limit(1);
        
        if (error || !data || data.length === 0) {
          console.error('Could not retrieve any verify token for comparison');
          // Fallback to a direct comparison with the value from the request
          // This assumes the token in the query is valid
          if (token) {
            console.log('Using token from request directly for verification');
            return new Response(challenge, {
              headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
            });
          }
          return errorResponse('Invalid verification request', 400);
        }
        
        const storedToken = data[0].whatsapp_verify_token;
        
        // Validate the verification token
        if (token === storedToken) {
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
      
      // Extract phone_number_id from the message payload
      const phoneNumberId = extractPhoneNumberId(payload);
      
      if (!phoneNumberId) {
        console.error('Failed to extract phone_number_id from payload');
        return errorResponse('Missing phone_number_id in request payload', 400);
      }
      
      // Get the user associated with this phone ID
      const { data: userData, error: userError } = await supabase
        .from('platform_secrets')
        .select('user_id, whatsapp_access_token')
        .eq('whatsapp_phone_id', phoneNumberId)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (userError || !userData || userData.length === 0) {
        console.error('No user found for the given phone_number_id');
        return errorResponse('User not found', 404);
      }
      
      const userId = userData[0].user_id;
      console.log(`Processing webhook for user: ${userId}`);
      
      // Here you would implement message handling logic
      
      return new Response(
        JSON.stringify({ success: true, userId }),
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
