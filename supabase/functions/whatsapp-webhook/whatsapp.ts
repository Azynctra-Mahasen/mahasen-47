
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../_shared/database.types.ts";

interface MessagingParams {
  phoneId: string;
  accessToken: string;
}

export async function getMessagingParams(
  supabase: ReturnType<typeof createClient<Database>>,
  phoneNumberId: string,
  userId: string
): Promise<MessagingParams | null> {
  try {
    // Get credentials from the database
    const { data: secretsData, error: secretsError } = await supabase
      .from("platform_secrets")
      .select("whatsapp_phone_id, whatsapp_access_token")
      .eq("user_id", userId)
      .eq("whatsapp_phone_id", phoneNumberId)
      .single();

    if (secretsError || !secretsData) {
      console.error("Error getting WhatsApp secrets:", secretsError?.message || "No data found");
      return null;
    }

    return {
      phoneId: secretsData.whatsapp_phone_id || "",
      accessToken: secretsData.whatsapp_access_token || "",
    };
  } catch (error) {
    console.error("Error in getMessagingParams:", error);
    return null;
  }
}

export async function sendWhatsAppMessage(
  phoneId: string,
  accessToken: string,
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return { 
        success: false, 
        error: `WhatsApp API error: ${data.error?.message || JSON.stringify(data)}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { 
      success: false, 
      error: `Error sending WhatsApp message: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
