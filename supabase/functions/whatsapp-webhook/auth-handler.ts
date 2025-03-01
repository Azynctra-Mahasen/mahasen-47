
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuthInfo {
  userId: string;
  accessToken: string;
  verifyToken: string;
  phoneId: string;
}

export async function getWhatsAppAuth(phoneNumberId: string): Promise<AuthInfo | null> {
  try {
    console.log(`Looking up auth for phone_number_id: ${phoneNumberId}`);
    
    // Clean up the phone number ID by removing any whitespace
    const cleanPhoneNumberId = phoneNumberId.trim();
    
    // Query platform_secrets table to find the matching user
    const { data: secrets, error } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_access_token, whatsapp_verify_token, whatsapp_phone_id');
    
    if (error) {
      console.error('Error fetching platform secrets:', error);
      return null;
    }
    
    console.log(`Available platform_secrets: ${JSON.stringify(secrets)}`);
    
    // Find the user with the matching phone ID
    const matchedSecret = secrets.find(secret => {
      // Clean up stored phone ID by trimming whitespace
      const storedPhoneId = secret.whatsapp_phone_id.trim();
      
      // Check for exact match
      return storedPhoneId === cleanPhoneNumberId;
    });
    
    if (matchedSecret) {
      console.log(`Found matching user: ${matchedSecret.user_id} for phone ID: ${cleanPhoneNumberId}`);
      return {
        userId: matchedSecret.user_id,
        accessToken: matchedSecret.whatsapp_access_token,
        verifyToken: matchedSecret.whatsapp_verify_token,
        phoneId: matchedSecret.whatsapp_phone_id.trim(),
      };
    }
    
    console.log(`No exact match found for phone ID: ${cleanPhoneNumberId}`);
    return null;
  } catch (error) {
    console.error('Error in getWhatsAppAuth:', error);
    return null;
  }
}
