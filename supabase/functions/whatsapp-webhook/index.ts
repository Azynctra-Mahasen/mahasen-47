import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { processWhatsAppMessage, findReceiverProfile } from './message-processor.ts';
import { getAIResponse } from './ai-response.ts';
import { handleTicketCreation } from './ticket-handler.ts';
import { processIntent } from './services/intent-processor.ts';

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

    if (req.method === 'GET') {
      // Handle webhook verification
      try {
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        
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
        return new Response('Internal server error', { 
          status: 500,
          headers: corsHeaders 
        });
      }
    }

    if (req.method === 'POST') {
      const payload = await req.json();
      console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

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

      // Find the receiver's profile
      const receiverProfile = await findReceiverProfile(supabase, displayPhoneNumber);
      console.log('Found receiver profile:', receiverProfile);

      if (!value.messages || value.messages.length === 0) {
        return new Response('No messages in webhook', { 
          status: 200,
          headers: corsHeaders 
        });
      }

      const message = value.messages[0];
      const messageId = message.id;
      
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

      const contact = value.contacts?.[0];
      const userMessage = message.text?.body;
      const userId = contact?.wa_id;
      const userName = contact?.profile?.name;

      // Process the message and get conversation ID
      const { conversationId, dbMessage } = await processWhatsAppMessage(
        messageId,
        userMessage,
        userId,
        userName,
        receiverProfile.id,
        displayPhoneNumber,
        supabase
      );

      // Process intent and create ticket if needed
      const intentResult = await processIntent(userMessage, conversationId);
      if (intentResult.shouldCreateTicket) {
        try {
          await handleTicketCreation({
            content: userMessage,
            userName,
            userId,
            intentType: intentResult.intentType,
            context: intentResult.context,
            messageId: dbMessage.id, // Use the database message ID, not the WhatsApp message ID
            conversationId,
            supabase
          });
        } catch (error) {
          console.error('Error in ticket creation:', error);
          // Continue processing even if ticket creation fails
        }
      }

      // Get AI settings and generate response
      const { data: aiSettings } = await supabase
        .from('ai_settings')
        .select('*')
        .single();

      const aiResponse = await getAIResponse(userMessage, conversationId, aiSettings);

      // Send the response back via WhatsApp
      const response = await fetch('https://graph.facebook.com/v17.0/527707247098559/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: userId,
          text: { body: aiResponse }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
      }

      // Store the AI response
      await supabase.from('messages').insert({
        content: aiResponse,
        conversation_id: conversationId,
        sender_name: 'AI Assistant',
        sender_number: displayPhoneNumber,
        status: 'sent'
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
