
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../_shared/database.types.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Determines the user ID based on the phone number ID from the WhatsApp API payload
 * 
 * @param phoneNumberId The phone number ID from the WhatsApp API payload
 * @returns The user ID if found, null otherwise
 */
export async function getUserByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
  try {
    console.log(`Searching for user with WhatsApp Phone ID: ${phoneNumberId}`);
    
    const { data, error } = await supabase
      .from("platform_secrets")
      .select("user_id")
      .eq("whatsapp_phone_id", phoneNumberId)
      .single();
    
    if (error) {
      console.error("Error finding user by phone number ID:", error.message);
      return null;
    }
    
    if (!data) {
      console.warn(`No user found with WhatsApp Phone ID: ${phoneNumberId}`);
      return null;
    }
    
    console.log(`Found user ${data.user_id} for WhatsApp Phone ID: ${phoneNumberId}`);
    return data.user_id;
  } catch (error) {
    console.error("Exception in getUserByPhoneNumberId:", error);
    return null;
  }
}
