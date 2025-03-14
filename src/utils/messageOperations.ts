
import { supabase } from "@/integrations/supabase/client";
import type { WhatsAppMessage } from "@/types/chat";
import { logSystemEvent } from "./loggingUtils";

export async function saveMessageToDatabase(
  conversationId: string,
  content: string
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session");
  }

  try {
    const result = await supabase
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
    
    // Log the event in a non-blocking way
    logSystemEvent(
      'messages',
      'INFO',
      'Message saved to database',
      { conversation_id: conversationId, message_id: result.data?.id }
    );
    
    return result;
  } catch (error) {
    console.error("Error saving message to database:", error);
    throw error;
  }
}

export async function sendWhatsAppMessage(
  messagePayload: WhatsAppMessage
) {
  try {
    // Clean up the phone ID by removing any whitespace
    if (messagePayload.phoneId) {
      messagePayload.phoneId = messagePayload.phoneId.trim();
    }
    
    console.log(`Sending WhatsApp message to ${messagePayload.to} using phone ID: ${messagePayload.phoneId}`);
    
    // Send the message but don't let logging errors prevent message sending
    const result = await supabase.functions.invoke(
      'send-whatsapp',
      {
        body: messagePayload,
      }
    );
    
    // Log the success event in a non-blocking way
    if (result.data?.success) {
      logSystemEvent(
        'whatsapp',
        'INFO',
        'WhatsApp message sent successfully',
        { to: messagePayload.to, phone_id: messagePayload.phoneId }
      );
    }
    
    return result;
  } catch (error) {
    console.error("Error invoking send-whatsapp function:", error);
    
    // Log the error event in a non-blocking way
    logSystemEvent(
      'whatsapp',
      'ERROR',
      'Error sending WhatsApp message',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
    
    throw error;
  }
}

export async function getWhatsAppSecrets() {
  const { data: { session } } = await supabase.auth.getSession();
      
  if (!session) {
    throw new Error("No active session");
  }

  try {
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
  } catch (error) {
    console.error("Error fetching WhatsApp secrets:", error);
    throw error;
  }
}
