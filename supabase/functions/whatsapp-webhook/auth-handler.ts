
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the UserContext interface
export interface UserContext {
  userId: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
}

/**
 * Find the user associated with a WhatsApp phone ID
 * @param phoneNumberId The WhatsApp phone number ID from the webhook payload
 * @returns The user ID or null if not found
 */
export async function findUserByWhatsAppPhoneId(phoneNumberId: string): Promise<string | null> {
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

/**
 * Get platform secrets for a user
 * @param userId The user ID
 * @returns The platform secrets or null if not found
 */
export async function getUserPlatformSecrets(userId: string) {
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

/**
 * Authenticate and create a user context
 * @param phoneNumberId The WhatsApp phone number ID from the webhook payload
 * @returns The user context or null if authentication fails
 */
export async function authenticateWhatsAppUser(phoneNumberId: string): Promise<UserContext | null> {
  try {
    // Find the user ID by phone number ID
    const userId = await findUserByWhatsAppPhoneId(phoneNumberId);
    if (!userId) {
      console.error("No user found for WhatsApp phone ID:", phoneNumberId);
      return null;
    }
    
    // Get the user's platform secrets
    const secrets = await getUserPlatformSecrets(userId);
    if (!secrets) {
      console.error("No platform secrets found for user:", userId);
      return null;
    }
    
    // Create and return the user context
    const userContext: UserContext = {
      userId,
      whatsappPhoneId: secrets.whatsapp_phone_id || '',
      whatsappAccessToken: secrets.whatsapp_access_token || ''
    };
    
    return userContext;
  } catch (error) {
    console.error("Error authenticating WhatsApp user:", error);
    return null;
  }
}
