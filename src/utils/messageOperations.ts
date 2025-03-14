
import { supabase } from "@/integrations/supabase/client";
import type { WhatsAppMessage } from "@/types/chat";

export async function saveMessageToDatabase(
  conversationId: string,
  content: string
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session");
  }

  return await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      content: content,
      status: "sent",
      sender_name: "Agent",
      sender_number: "system",
      metadata: {
        is_agent_message: true,
        skip_intent_analysis: true
      },
      user_id: session.user.id
    })
    .select()
    .single();
}

export async function sendWhatsAppMessage(
  messagePayload: WhatsAppMessage
) {
  // Clean up the phone ID by removing any whitespace
  if (messagePayload.phoneId) {
    messagePayload.phoneId = messagePayload.phoneId.trim();
  }
  
  console.log(`Sending WhatsApp message to ${messagePayload.to} using phone ID: ${messagePayload.phoneId}`);
  
  return await supabase.functions.invoke(
    'send-whatsapp',
    {
      body: messagePayload,
    }
  );
}

export async function getWhatsAppSecrets() {
  const { data: { session } } = await supabase.auth.getSession();
      
  if (!session) {
    throw new Error("No active session");
  }

  const { data: secretsData, error: secretsError } = await supabase
    .from('decrypted_user_secrets')
    .select('secret_type, secret_value')
    .eq('user_id', session.user.id);

  if (secretsError) {
    throw new Error("Error fetching WhatsApp configuration: " + secretsError.message);
  }

  if (!secretsData || secretsData.length === 0) {
    throw new Error("WhatsApp configuration not found. Please configure your WhatsApp settings first.");
  }

  const secrets = secretsData.reduce((acc, curr) => {
    // Trim any whitespace from secret values
    acc[curr.secret_type] = curr.secret_value.trim();
    return acc;
  }, {} as Record<string, string>);

  // Validate that all required secrets are present
  if (!secrets.whatsapp_phone_id || !secrets.whatsapp_access_token) {
    throw new Error("Missing required WhatsApp configuration. Please check your WhatsApp settings.");
  }

  console.log(`Retrieved WhatsApp phoneId: ${secrets.whatsapp_phone_id}`);
  return secrets;
}
