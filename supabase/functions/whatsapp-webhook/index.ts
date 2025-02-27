import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { processWhatsAppMessage } from './message-processor.ts';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set to store processed message IDs to prevent duplicates
const processedMessages = new Set<string>();

// Main handler function
serve(async (req) => {
  console.log(`WhatsApp webhook received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle webhook verification (GET request)
    if (req.method === 'GET') {
      return handleVerification(req, supabase);
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      return handleIncomingMessage(req, supabase);
    }

    // Handle unsupported methods
    console.log(`Unsupported method: ${req.method}`);
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  } catch (error) {
    console.error('Unhandled webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Handle webhook verification (GET requests)
async function handleVerification(req: Request, supabase: any) {
  console.log('Processing webhook verification');
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    console.log('Verification parameters:', { mode, token });

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
    console.log('Comparing tokens (masked):', { 
      provided: token ? '****' : 'null', 
      expected: userVerifyToken ? '****' : 'null'
    });

    if (mode === 'subscribe' && token === userVerifyToken) {
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

// Handle incoming WhatsApp messages (POST requests)
async function handleIncomingMessage(req: Request, supabase: any) {
  try {
    const message = await req.json();
    console.log('Received webhook payload:', JSON.stringify(message, null, 2));

    const changes = message.entry?.[0]?.changes?.[0]?.value;
    
    if (!changes?.messages || changes.messages.length === 0) {
      console.log('No messages in webhook payload');
      return new Response(JSON.stringify({ success: true, status: 'no_messages' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const messageId = changes.messages[0].id;
    const userMessage = changes.messages[0].text?.body;
    const userId = changes.contacts?.[0]?.wa_id;
    const userName = changes.contacts?.[0]?.profile?.name;
    
    // Validate required fields
    if (!messageId || !userMessage || !userId) {
      console.error('Missing required message fields');
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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

    console.log(`Processing message from ${userName || 'Unknown'} (${userId}): ${userMessage.substring(0, 50)}...`);

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
      userName || userId,
      secretsMap.whatsapp_phone_id,
      secretsMap.whatsapp_access_token
    );

    console.log('Message processed successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
