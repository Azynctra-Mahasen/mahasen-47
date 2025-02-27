
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

interface UserContext {
  userId: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
  whatsappVerifyToken: string;
}

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

/**
 * Get user by their WhatsApp phone ID - handles multiple matching records
 */
async function getUserByPhoneId(phoneNumberId: string): Promise<UserContext | null> {
  try {
    console.log(`Looking up user for WhatsApp phone ID: ${phoneNumberId}`);
    
    // Instead of using .single(), get all matching records and sort by updated_at
    const { data, error } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id, whatsapp_access_token, whatsapp_verify_token, updated_at')
      .eq('whatsapp_phone_id', phoneNumberId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching platform secrets:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.error('No user found with the given WhatsApp phone ID');
      return null;
    }
    
    // Take the most recently updated record
    const mostRecentRecord = data[0];
    console.log(`Found ${data.length} matching records, using most recent: ${mostRecentRecord.user_id}`);
    
    const userContext: UserContext = {
      userId: mostRecentRecord.user_id,
      whatsappPhoneId: mostRecentRecord.whatsapp_phone_id || '',
      whatsappAccessToken: mostRecentRecord.whatsapp_access_token || '',
      whatsappVerifyToken: mostRecentRecord.whatsapp_verify_token || '',
    };
    
    return userContext;
  } catch (error) {
    console.error('Error in getUserByPhoneId:', error);
    return null;
  }
}

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
 * Authenticate the user based on WhatsApp webhook payload
 */
async function authenticateWebhookUser(payload: any): Promise<UserContext | null> {
  const phoneNumberId = extractPhoneNumberId(payload);
  
  if (!phoneNumberId) {
    console.error('Could not extract phone number ID from payload');
    return null;
  }
  
  return await getUserByPhoneId(phoneNumberId);
}

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
      const payload = await req.json();
      console.log('WhatsApp API payload:', JSON.stringify(payload));
      
      // Authenticate the user based on the message payload
      const userContext = await authenticateWebhookUser(payload);
      
      if (!userContext) {
        console.error('Failed to authenticate webhook user');
        return errorResponse('Unauthorized', 401);
      }
      
      console.log(`Processing webhook for user: ${userContext.userId}`);
      
      // Here you would process the message and send a response
      // For now, just return success
      return new Response(
        JSON.stringify({ success: true, userId: userContext.userId }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return method not allowed for other HTTP methods
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return errorResponse(`Internal Server Error: ${error.message}`, 500);
  }
});
