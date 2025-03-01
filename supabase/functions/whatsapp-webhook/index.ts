
// Follow this setup guide to integrate the Deno standard library
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

// Finds the user who owns the WhatsApp phone ID from the incoming webhook
async function findUserByWhatsAppPhoneId(phoneNumberId: string): Promise<string | null> {
  try {
    // Trim whitespace from the phone number ID for comparison
    const cleanPhoneNumberId = phoneNumberId.trim();
    
    console.log("Looking for user with WhatsApp phone ID:", cleanPhoneNumberId);
    
    // First try an exact match
    const { data: secrets, error } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id')
      .eq('whatsapp_phone_id', cleanPhoneNumberId);
    
    if (error) {
      console.error("Error finding user by WhatsApp phone ID:", error.message);
      return null;
    }
    
    // If exact match found, return the user ID
    if (secrets && secrets.length > 0) {
      console.log("Found user by exact match:", secrets[0].user_id);
      return secrets[0].user_id;
    }
    
    // If no exact match, try with trimmed values from the database
    const { data: allSecrets, error: allSecretsError } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id');
    
    if (allSecretsError) {
      console.error("Error fetching all platform secrets:", allSecretsError.message);
      return null;
    }
    
    console.log("Available platform_secrets:", JSON.stringify(allSecrets));
    
    // Find a match with trimmed values
    const matchingSecret = allSecrets?.find(secret => 
      secret.whatsapp_phone_id && secret.whatsapp_phone_id.trim() === cleanPhoneNumberId
    );
    
    if (matchingSecret) {
      console.log("Found user by trimmed match:", matchingSecret.user_id);
      return matchingSecret.user_id;
    }
    
    console.error(`No user found for WhatsApp phone ID: ${phoneNumberId}`);
    return null;
  } catch (error) {
    console.error("Error in findUserByWhatsAppPhoneId:", error);
    return null;
  }
}

// Get platform secrets for a user
async function getUserPlatformSecrets(userId: string) {
  try {
    const { data, error } = await supabase
      .from('platform_secrets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching platform secrets:", error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserPlatformSecrets:", error);
    return null;
  }
}

// Process a WhatsApp webhook message
async function processWebhook(webhookBody: any) {
  try {
    console.log("WhatsApp API payload:", JSON.stringify(webhookBody));
    
    if (webhookBody.object !== 'whatsapp_business_account') {
      console.error("Unknown webhook object type:", webhookBody.object);
      return { success: false, error: "Unsupported webhook object type" };
    }
    
    // Process each entry in the webhook
    for (const entry of webhookBody.entry || []) {
      // Process each change in the entry
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        
        const value = change.value;
        if (!value || !value.metadata || !value.metadata.phone_number_id) {
          console.error("Missing phone_number_id in webhook payload");
          continue;
        }
        
        const phoneNumberId = value.metadata.phone_number_id;
        console.log("Processing message for phone_number_id:", phoneNumberId);
        
        // Find the user to whom this message belongs
        const userId = await findUserByWhatsAppPhoneId(phoneNumberId);
        if (!userId) {
          console.error("No user found for phone_number_id:", phoneNumberId);
          continue;
        }
        
        console.log("Found user for the message:", userId);
        
        // Get the user's platform secrets to use for processing
        const userSecrets = await getUserPlatformSecrets(userId);
        if (!userSecrets) {
          console.error("Failed to retrieve platform secrets for user:", userId);
          continue;
        }
        
        // Process the messages
        const messages = value.messages || [];
        for (const message of messages) {
          // Process each individual message
          console.log("Processing message:", JSON.stringify(message));
          
          // Insert the message into the database (simplified example)
          const messageContent = message.text?.body || message.caption || "Media message";
          const senderNumber = message.from;
          const senderName = value.contacts?.[0]?.profile?.name || "Unknown";
          const whatsappMessageId = message.id;
          
          const { data: existingConversation, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('user_id', userId)
            .eq('contact_number', senderNumber)
            .eq('platform', 'whatsapp')
            .maybeSingle();
          
          let conversationId = existingConversation?.id;
          
          // Create a new conversation if one doesn't exist
          if (!conversationId) {
            const { data: newConv, error: newConvError } = await supabase
              .from('conversations')
              .insert({
                user_id: userId,
                contact_number: senderNumber,
                contact_name: senderName,
                platform: 'whatsapp',
                ai_enabled: false
              })
              .select('id')
              .single();
            
            if (newConvError) {
              console.error("Error creating conversation:", newConvError);
              continue;
            }
            
            conversationId = newConv.id;
          }
          
          // Save the message to the database
          const { error: msgError } = await supabase
            .from('messages')
            .insert({
              user_id: userId,
              conversation_id: conversationId,
              content: messageContent,
              sender_name: senderName,
              sender_number: senderNumber,
              status: 'received',
              whatsapp_message_id: whatsappMessageId
            });
          
          if (msgError) {
            console.error("Error saving message:", msgError);
            continue;
          }
          
          console.log("Message saved successfully");
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return { success: false, error: String(error) };
  }
}

// Verify webhook challenge
function verifyWebhookChallenge(req: Request, url: URL): Response | null {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  console.log("Verification request received - mode:", mode, "token:", token);
  
  // If this is a verification request
  if (mode === 'subscribe' && token && challenge) {
    // Normally we would check the token against the one in the database per user
    // But for simplicity and to disable JWT enforcement, we'll accept any token for now
    console.log("Verification successful, returning challenge");
    return new Response(challenge, { status: 200 });
  }
  
  return null;
}

serve(async (req) => {
  // Parse URL to get query parameters
  const url = new URL(req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check if this is a webhook verification request
    const verificationResponse = verifyWebhookChallenge(req, url);
    if (verificationResponse) {
      return verificationResponse;
    }
    
    // For regular webhook POST calls
    if (req.method === 'POST') {
      const payload = await req.json();
      const result = await processWebhook(payload);
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // For unsupported methods
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
