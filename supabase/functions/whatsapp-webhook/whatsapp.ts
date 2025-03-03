
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../_shared/database.types.ts";

export interface MessagingParams {
  phoneNumberId: string;
  accessToken: string;
  recipientNumber: string;
}

export async function getMessagingParams(
  supabase: SupabaseClient<Database>,
  phoneNumberId: string,
  userId: string
): Promise<MessagingParams | null> {
  try {
    console.log(`Getting messaging params for phone ID: ${phoneNumberId} and user ID: ${userId}`);
    
    // Get the platform secrets for this user and phone ID
    const { data: platformSecret, error } = await supabase
      .from("platform_secrets")
      .select("whatsapp_access_token")
      .eq("whatsapp_phone_id", phoneNumberId)
      .eq("user_id", userId) // Filter by user_id to ensure proper access
      .maybeSingle();

    if (error || !platformSecret) {
      console.error("Error getting platform secrets:", error);
      return null;
    }

    return {
      phoneNumberId,
      accessToken: platformSecret.whatsapp_access_token || "",
      recipientNumber: "", // This will be set later when sending a message
    };
  } catch (error) {
    console.error("Error in getMessagingParams:", error);
    return null;
  }
}

export async function sendWhatsAppMessage(
  params: MessagingParams,
  recipientNumber: string,
  messageContent: string
): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/v18.0/${params.phoneNumberId}/messages`;
    console.log(`Sending WhatsApp message to ${recipientNumber}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientNumber,
        type: "text",
        text: {
          preview_url: true,
          body: messageContent,
        },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Error sending WhatsApp message:", responseData);
      return false;
    }

    console.log("WhatsApp message sent successfully");
    return true;
  } catch (error) {
    console.error("Exception sending WhatsApp message:", error);
    return false;
  }
}
