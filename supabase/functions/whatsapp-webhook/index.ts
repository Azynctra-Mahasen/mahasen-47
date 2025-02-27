
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { processWhatsAppMessage } from './message-processor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Received webhook request:', req.method);
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle webhook verification
    if (req.method === 'GET') {
      console.log('Processing webhook verification request');
      try {
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        
        console.log('Webhook verification params:', { mode, token });

        const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
        console.log('Comparing tokens:', { 
          provided: token, 
          expected: 'Token check'
        });

        if (mode === 'subscribe' && token === verifyToken) {
          console.log('Webhook verified successfully');
          return new Response(challenge, { 
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
          });
        }

        console.log('Verification failed');
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
      console.log('Processing incoming webhook message');
      try {
        const message = await req.json();
        console.log('Received webhook payload:', JSON.stringify(message, null, 2));

        // Basic validation of the webhook payload
        if (!message.entry || !message.entry[0]?.changes || !message.entry[0]?.changes[0]?.value) {
          console.error('Invalid webhook payload structure');
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid payload structure' 
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const changes = message.entry[0].changes[0].value;
        
        if (!changes.messages || changes.messages.length === 0) {
          console.log('No messages in payload');
          return new Response(JSON.stringify({ success: true, status: 'no_messages' }), { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }

        const messageId = changes.messages[0].id;
        const userMessage = changes.messages[0].text?.body;
        const userId = changes.contacts?.[0]?.wa_id;
        const userName = changes.contacts?.[0]?.profile?.name;

        if (!messageId || !userMessage || !userId || !userName) {
          console.error('Missing required message fields:', { 
            messageId, 
            hasMessage: !!userMessage, 
            userId, 
            userName 
          });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing required message fields' 
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Processing message:', {
          messageId,
          userId,
          userName,
          messagePreview: userMessage.substring(0, 50)
        });

        // Get user's WhatsApp secrets
        const { data: secrets, error: secretsError } = await supabase
          .from('decrypted_user_secrets')
          .select('secret_type, secret_value')
          .in('secret_type', ['whatsapp_phone_id', 'whatsapp_access_token']);

        if (secretsError) {
          console.error('Error fetching WhatsApp secrets:', secretsError);
          throw secretsError;
        }

        if (!secrets || secrets.length === 0) {
          console.error('No WhatsApp secrets found');
          throw new Error('WhatsApp configuration not found');
        }

        const secretsMap = secrets.reduce((acc, curr) => {
          acc[curr.secret_type] = curr.secret_value;
          return acc;
        }, {} as Record<string, string>);

        if (!secretsMap.whatsapp_phone_id || !secretsMap.whatsapp_access_token) {
          console.error('Missing required WhatsApp secrets');
          throw new Error('Incomplete WhatsApp configuration');
        }

        // Process the message
        await processWhatsAppMessage(
          messageId,
          userMessage,
          userId,
          userName,
          secretsMap.whatsapp_phone_id,
          secretsMap.whatsapp_access_token
        );

        console.log('Message processed successfully');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log('Invalid request method:', req.method);
    return new Response('Method not allowed', { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Unhandled error in webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
