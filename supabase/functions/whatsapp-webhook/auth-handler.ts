
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

export interface UserContext {
  userId: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
  whatsappVerifyToken: string | null;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get user context based on phone_number_id from the WhatsApp API payload
 * @param phoneNumberId The phone_number_id value from the WhatsApp API payload
 */
export async function getUserContext(phoneNumberId: string): Promise<UserContext | null> {
  try {
    console.log(`Fetching user context for phone_number_id: ${phoneNumberId}`);
    
    // Fetch platform secrets for the specific whatsapp_phone_id
    const { data: platformSecret, error } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id, whatsapp_access_token, whatsapp_verify_token')
      .eq('whatsapp_phone_id', phoneNumberId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching platform secrets:', error);
      return null;
    }
    
    if (!platformSecret) {
      console.error(`No platform secrets found for phone_number_id: ${phoneNumberId}`);
      return null;
    }
    
    console.log(`Found user context for phone_number_id: ${phoneNumberId}, user_id: ${platformSecret.user_id}`);
    
    return {
      userId: platformSecret.user_id,
      whatsappPhoneId: platformSecret.whatsapp_phone_id,
      whatsappAccessToken: platformSecret.whatsapp_access_token,
      whatsappVerifyToken: platformSecret.whatsapp_verify_token
    };
  } catch (error) {
    console.error('Error in getUserContext:', error);
    return null;
  }
}
