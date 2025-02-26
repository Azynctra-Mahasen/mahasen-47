import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { processWhatsAppMessage } from './message-processor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Set to store processed message IDs
const processedMessages = new Set();

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle webhook verification
    if (req.method === 'GET') {
      try {
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        
        console.log('Webhook verification attempt:', { mode, token });

        // Get user's WhatsApp verify token from their secrets
        const { data: secretsData, error: secretsError } = await supabase
          .from('decrypted_user_secrets')
          .select('secret_value')
          .eq('secret_type', 'whatsapp_verify_token')
          .single();

        if (secretsError) {
          console.error('Error fetching verify token:', secretsError);
          throw secretsError;
        }

        const userVerifyToken = secretsData?.secret_value;

        if (mode === 'subscribe' && token === userVerifyToken) {
          console.log('Webhook verified successfully');
          return new Response(challenge, { 
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
          });
        }

        return new Response('Verification failed', { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
        });
      } catch (error) {
        console.error('Error in webhook verification:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    if (req.method === 'POST') {
      try {
        const message = await req.json();
        console.log('WhatsApp API payload:', JSON.stringify(message, null, 2));

        const changes = message.entry[0].changes[0].value;
        
        if (!changes.messages || changes.messages.length === 0) {
          return new Response(JSON.stringify({ success: true, status: 'no_messages' }), { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }

        const messageId = changes.messages[0].id;
        const userMessage = changes.messages[0].text.body;
        const userId = changes.contacts[0].wa_id;
        const userName = changes.contacts[0].profile.name;
        
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

        console.log(`Processing message from ${userName} (${userId}): ${userMessage}`);

        // Get user's WhatsApp secrets
        const { data: secrets, error: secretsError } = await supabase
          .from('decrypted_user_secrets')
          .select('secret_type, secret_value')
          .in('secret_type', ['whatsapp_phone_id', 'whatsapp_access_token']);

        if (secretsError) {
          console.error('Error fetching WhatsApp secrets:', secretsError);
          throw secretsError;
        }

        const secretsMap = secrets.reduce((acc, curr) => {
          acc[curr.secret_type] = curr.secret_value;
          return acc;
        }, {} as Record<string, string>);

        // Process the message with user-specific secrets
        await processWhatsAppMessage(
          messageId,
          userMessage,
          userId,
          userName,
          secretsMap.whatsapp_phone_id,
          secretsMap.whatsapp_access_token
        );

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error processing webhook:', error);
        // Return a 200 status even on error to acknowledge receipt
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Unhandled error in webhook:', error);
    // Return a 200 status even on error to acknowledge receipt
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
