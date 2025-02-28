
import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { processMessage } from './message-processor.ts';
import { authenticateWebhookUser, UserContext } from './auth-handler.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main webhook handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Handle GET requests (verification)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      console.log(`Verification request: mode=${mode}, token=${token}, challenge=${challenge}`);
      
      // Get phone ID from the verification URL
      const phoneNumberId = url.searchParams.get('phone_number_id');
      
      if (!phoneNumberId) {
        console.error('No phone_number_id provided in verification request');
        return new Response('Missing phone_number_id parameter', { status: 400 });
      }
      
      // Get user by phone ID
      const userContext = await getUserByPhoneId(phoneNumberId);
      
      if (!userContext) {
        console.error(`No user found with phone ID: ${phoneNumberId}`);
        return new Response('Invalid phone_number_id', { status: 404 });
      }
      
      // Verify with the user's verify token
      if (mode === 'subscribe' && token === userContext.whatsappVerifyToken) {
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
      
      return new Response('Verification failed', { status: 403 });
    }

    // Handle POST requests (webhook events)
    if (req.method === 'POST') {
      const payload = await req.json();
      console.log('WhatsApp API payload:', JSON.stringify(payload));
      
      // Authenticate the user from the webhook payload
      const userContext = await authenticateWebhookUser(payload);
      
      if (!userContext) {
        console.error('Failed to authenticate webhook user');
        return new Response('Unauthorized', { status: 401 });
      }
      
      // Process the message with the user context
      await processMessage(payload, userContext);
      
      return new Response('Message processed', {
        status: 200,
        headers: { ...corsHeaders }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Log error to database for monitoring
    try {
      await supabase.from('webhook_errors').insert({
        error_type: 'whatsapp_processing_error',
        message: error.message || 'Unknown error',
        details: { stack: error.stack }
      });
    } catch (logError) {
      console.error('Error logging to database:', logError);
    }
    
    return new Response('Internal Server Error', {
      status: 500,
      headers: { ...corsHeaders }
    });
  }
});

// Helper function to get user by phone ID (used for verification)
async function getUserByPhoneId(phoneNumberId: string): Promise<UserContext | null> {
  const { data, error } = await supabase
    .from('platform_secrets')
    .select('user_id, whatsapp_phone_id, whatsapp_access_token, whatsapp_verify_token')
    .eq('whatsapp_phone_id', phoneNumberId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching user by phone ID:', error);
    return null;
  }
  
  return {
    userId: data.user_id,
    whatsappPhoneId: data.whatsapp_phone_id,
    whatsappAccessToken: data.whatsapp_access_token || '',
    whatsappVerifyToken: data.whatsapp_verify_token || '',
  };
}
