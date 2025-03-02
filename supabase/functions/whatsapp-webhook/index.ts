
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      // Handle webhook verification
      const mode = url.searchParams.get('hub.mode');
      const verifyToken = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && challenge) {
        console.log('Webhook verification request received');
        
        // Get the verify token from query params
        if (!verifyToken) {
          throw new Error('Verify token is missing');
        }

        // Find the user who has this verification token
        const { data: userSecrets, error: secretsError } = await supabase
          .from('platform_secrets')
          .select('user_id')
          .eq('whatsapp_verify_token', verifyToken)
          .maybeSingle();

        if (secretsError || !userSecrets) {
          console.error('Error finding user with verify token:', secretsError);
          throw new Error('Invalid verify token');
        }

        console.log(`Verification successful for user: ${userSecrets.user_id}`);
        return new Response(challenge, { headers: corsHeaders });
      }
      
      return new Response('Invalid verification request', { status: 400, headers: corsHeaders });
    } 
    
    else if (req.method === 'POST') {
      // Handle incoming messages
      const payload = await req.json();
      console.log('WhatsApp API payload:', JSON.stringify(payload));

      // Extract phone_number_id from the payload
      const phoneNumberId = extractPhoneNumberId(payload);
      
      if (!phoneNumberId) {
        throw new Error('Phone number ID not found in payload');
      }
      
      console.log(`Processing message for phone ID: ${phoneNumberId}`);

      // Find the user who owns this phone number ID
      const { data: userInfo, error: userError } = await supabase
        .from('platform_secrets')
        .select('user_id')
        .eq('whatsapp_phone_id', phoneNumberId)
        .maybeSingle();

      if (userError || !userInfo) {
        console.error('Error finding user with phone ID:', userError);
        throw new Error(`No user found for phone ID: ${phoneNumberId}`);
      }

      const userId = userInfo.user_id;
      console.log(`Found user ID: ${userId} for phone ID: ${phoneNumberId}`);

      // Process the message using AI function with the correct user context
      const { error: processingError } = await supabase.functions.invoke(
        'process-whatsapp-message',
        {
          body: { 
            payload,
            userId,
            phoneNumberId
          }
        }
      );

      if (processingError) {
        console.error('Error processing message:', processingError);
        throw processingError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error('Error in whatsapp-webhook:', err);
    
    // Log detailed error information
    await supabase
      .from('webhook_errors')
      .insert({
        error_type: 'WhatsApp Webhook Error',
        message: err.message,
        details: {
          stack: err.stack,
          url: req.url,
          method: req.method
        }
      });
    
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to extract phone_number_id from WhatsApp payload
function extractPhoneNumberId(payload: any): string | null {
  try {
    // Navigate through the payload structure to find phone_number_id
    if (payload.object === 'whatsapp_business_account' && 
        payload.entry && 
        payload.entry.length > 0 && 
        payload.entry[0].changes && 
        payload.entry[0].changes.length > 0 && 
        payload.entry[0].changes[0].value && 
        payload.entry[0].changes[0].value.metadata && 
        payload.entry[0].changes[0].value.metadata.phone_number_id) {
      
      return payload.entry[0].changes[0].value.metadata.phone_number_id;
    }
    return null;
  } catch (error) {
    console.error('Error extracting phone_number_id:', error);
    return null;
  }
}
