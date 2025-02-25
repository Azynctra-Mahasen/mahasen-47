
import { supabase } from "@/integrations/supabase/client";
import type { WhatsAppMessage } from "@/types/chat";

export async function saveMessageToDatabase(
  conversationId: string,
  content: string
) {
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
      }
    })
    .select()
    .single();
}

export async function sendWhatsAppMessage(
  messagePayload: WhatsAppMessage
) {
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

  if (secretsError) throw secretsError;

  if (!secretsData || secretsData.length === 0) {
    throw new Error("WhatsApp configuration not found. Please configure your WhatsApp settings first.");
  }

  return secretsData.reduce((acc, curr) => {
    acc[curr.secret_type] = curr.secret_value;
    return acc;
  }, {} as Record<string, string>);
}
