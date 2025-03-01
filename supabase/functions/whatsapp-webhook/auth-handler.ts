
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Database } from '../_shared/database.types.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize the Supabase client with the service role key
export async function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey
  );
}

// Finds the user who owns the WhatsApp phone ID from the incoming webhook
export async function findUserByWhatsAppPhoneId(phoneNumberId: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseClient();
    
    // Trim whitespace from the phone number ID for comparison
    const cleanPhoneNumberId = phoneNumberId.trim();
    
    // First try an exact match
    let { data: secrets, error } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id')
      .eq('whatsapp_phone_id', cleanPhoneNumberId);
    
    if (error) {
      console.error("Error finding user by WhatsApp phone ID:", error.message);
      return null;
    }
    
    // If exact match found, return the user ID
    if (secrets && secrets.length > 0) {
      return secrets[0].user_id;
    }
    
    // If no exact match, try with trimmed values from the database
    // This handles cases where phone IDs might have leading/trailing spaces stored
    const { data: allSecrets, error: allSecretsError } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id');
    
    if (allSecretsError) {
      console.error("Error fetching all platform secrets:", allSecretsError.message);
      return null;
    }
    
    // Find a match with trimmed values
    const matchingSecret = allSecrets?.find(secret => 
      secret.whatsapp_phone_id && secret.whatsapp_phone_id.trim() === cleanPhoneNumberId
    );
    
    if (matchingSecret) {
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
export async function getUserPlatformSecrets(userId: string) {
  try {
    const supabase = await createSupabaseClient();
    
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
