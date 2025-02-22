import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { processWhatsAppMessage, findReceiverProfile } from './message-processor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Set to store processed message IDs
const processedMessages = new Set();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      const payload = await req.json();
      console.log('WhatsApp API payload:', JSON.stringify(payload, null, 2));

      if (!payload.entry?.[0]?.changes?.[0]?.value) {
        return new Response('Invalid webhook payload', { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const value = payload.entry[0].changes[0].value;
      const displayPhoneNumber = value.metadata?.display_phone_number;
      
      if (!displayPhoneNumber) {
        console.error('No display phone number in webhook payload');
        return new Response(JSON.stringify({ error: 'No display phone number found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find the receiver's profile (AI account)
      let receiverProfile;
      try {
        receiverProfile = await findReceiverProfile(supabase, displayPhoneNumber);
        console.log('Found receiver profile:', receiverProfile);
      } catch (error) {
        console.error('Error finding receiver:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!value.messages || value.messages.length === 0) {
        return new Response('No messages in webhook', { 
          status: 200,
          headers: corsHeaders 
        });
      }

      const message = value.messages[0];
      const contact = value.contacts?.[0];

      // Process the message
      const messageId = message.id;
      const userMessage = message.text.body;
      const userId = contact.wa_id;
      const userName = contact.profile.name;

      // Check if we've already processed this message
      if (processedMessages.has(messageId)) {
        console.log(`Message ${messageId} already processed, skipping`);
        return new Response(JSON.stringify({ success: true, status: 'already_processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Add message to processed set
      processedMessages.add(messageId);
      
      // Clean up old message IDs (keep last 1000)
      if (processedMessages.size > 1000) {
        const idsToRemove = Array.from(processedMessages).slice(0, processedMessages.size - 1000);
        idsToRemove.forEach(id => processedMessages.delete(id));
      }

      console.log(`Processing message from ${userName} (${userId}) to ${displayPhoneNumber}`);

      // Get receiver's WhatsApp secrets
      const { data: receiverSecrets, error: secretsError } = await supabase
        .from('decrypted_user_secrets')
        .select('secret_type, secret_value')
        .eq('user_id', receiverProfile.id);

      if (secretsError) {
        console.error('Error fetching WhatsApp secrets:', secretsError);
        throw secretsError;
      }

      // Process the message with receiver's credentials
      await processWhatsAppMessage(
        messageId,
        userMessage,
        userId,
        userName,
        receiverProfile.id,
        displayPhoneNumber
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    }

    // Handle GET request for webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token) {
        // Get all users' WhatsApp verify tokens
        const { data: secretsData, error: secretsError } = await supabase
          .from('decrypted_user_secrets')
          .select('secret_value')
          .eq('secret_type', 'whatsapp_verify_token');

        if (secretsError) throw secretsError;

        // Check if the token matches any user's verify token
        const isValidToken = secretsData?.some(secret => secret.secret_value === token);

        if (isValidToken) {
          return new Response(challenge, {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }
      }

      return new Response('Verification failed', {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in webhook handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
