
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // For GET requests (WhatsApp API verification)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      // Log verification attempt
      console.log(`Verification attempt - Mode: ${mode}, Token: ${token}`);

      // No need to check for specific tokens since verify_jwt is false
      if (mode === 'subscribe' && challenge) {
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      return new Response('Verification failed', { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // For POST requests (actual WhatsApp messages)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log(`WhatsApp API payload: ${JSON.stringify(body)}`);

      // Extract the message content
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value || !value.messages || value.messages.length === 0) {
        console.log('No messages in the payload');
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const phoneNumberId = value.metadata?.phone_number_id;
      
      if (!phoneNumberId) {
        console.error('No phone number ID found in the payload');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No phone number ID found' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find the user by phone ID
      const { data: userId, error: userError } = await supabase.rpc(
        'get_user_by_phone_number_id',
        { phone_id: phoneNumberId }
      );

      if (userError || !userId) {
        console.error('Error finding user:', userError || 'No user found');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Error finding user' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Found user ID: ${userId} for phone ID: ${phoneNumberId}`);

      // Extract message details
      const message = value.messages[0];
      const messageId = message.id;
      const sender = value.contacts?.[0];
      const senderNumber = message.from;
      const senderName = sender?.profile?.name || 'Unknown';
      
      // Get message content based on type
      let messageContent = '';
      
      if (message.type === 'text' && message.text) {
        messageContent = message.text.body || '';
      } else if (message.type === 'image' && message.image) {
        messageContent = 'Image: ' + (message.image.caption || '[No caption]');
      } else if (message.type === 'audio') {
        messageContent = 'Audio message';
      } else if (message.type === 'video') {
        messageContent = 'Video: ' + (message.video?.caption || '[No caption]');
      } else if (message.type === 'document') {
        messageContent = 'Document: ' + (message.document?.filename || '[Unnamed]');
      } else if (message.type === 'location') {
        messageContent = `Location: Lat ${message.location?.latitude}, Long ${message.location?.longitude}`;
      } else if (message.type === 'contacts') {
        messageContent = 'Contact shared';
      } else if (message.type === 'button') {
        messageContent = 'Button: ' + (message.button?.text || '[No text]');
      } else if (message.type === 'interactive' && message.interactive) {
        if (message.interactive.type === 'button_reply') {
          messageContent = 'Button reply: ' + (message.interactive.button_reply?.title || '');
        } else if (message.interactive.type === 'list_reply') {
          messageContent = 'List reply: ' + (message.interactive.list_reply?.title || '');
        } else {
          messageContent = 'Interactive message';
        }
      } else {
        messageContent = `Unsupported message type: ${message.type}`;
      }

      if (!messageContent) {
        messageContent = `[Empty message of type: ${message.type}]`;
      }

      console.log(`Processing message for phone ID: ${phoneNumberId}`);

      // Find or create conversation
      const { data: existingConversations, error: convSearchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_number', senderNumber)
        .eq('user_id', userId)
        .limit(1);

      if (convSearchError) {
        console.error('Error searching for conversation:', convSearchError);
        throw convSearchError;
      }

      let conversationId;
      
      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createConvError } = await supabase
          .from('conversations')
          .insert({
            contact_number: senderNumber,
            contact_name: senderName,
            platform: 'whatsapp',
            user_id: userId,
            ai_enabled: true
          })
          .select()
          .single();

        if (createConvError) {
          console.error('Error creating conversation:', createConvError);
          throw createConvError;
        }

        conversationId = newConversation.id;
      }

      // Save message to database
      const { data: savedMessage, error: saveError } = await supabase
        .from('messages')
        .insert({
          content: messageContent,
          conversation_id: conversationId,
          sender_number: senderNumber,
          sender_name: senderName,
          status: 'received',
          whatsapp_message_id: messageId,
          user_id: userId
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving message:', saveError);
        throw saveError;
      }

      console.log(`Message saved with ID: ${savedMessage.id}`);

      // Process the message with the process-whatsapp-message function
      try {
        await supabase.functions.invoke('process-whatsapp-message', {
          body: {
            message: messageContent,
            conversation_id: conversationId,
            sender_number: senderNumber,
            sender_name: senderName,
            message_id: savedMessage.id
          }
        });
      } catch (error) {
        console.error('Error processing message:', error);
        // We don't want to fail the webhook even if processing fails
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For unsupported methods
    return new Response('Method not allowed', { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
