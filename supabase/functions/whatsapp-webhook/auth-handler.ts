
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface UserContext {
  userId: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
  whatsappVerifyToken?: string;
}

/**
 * Authenticate the webhook request and return the user context
 * @param phoneNumberId The WhatsApp phone number ID from the webhook payload
 * @returns The user context if authentication was successful, or null if not
 */
export async function authenticateWebhook(phoneNumberId: string): Promise<UserContext | null> {
  try {
    console.log('Authenticating webhook request for phone number ID:', phoneNumberId);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Find the user associated with this WhatsApp phone ID
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
      console.error('No platform secrets found for phone number ID:', phoneNumberId);
      return null;
    }
    
    console.log('User authenticated successfully:', platformSecret.user_id);
    
    // Return the user context
    return {
      userId: platformSecret.user_id,
      whatsappPhoneId: platformSecret.whatsapp_phone_id,
      whatsappAccessToken: platformSecret.whatsapp_access_token,
      whatsappVerifyToken: platformSecret.whatsapp_verify_token
    };
  } catch (error) {
    console.error('Error authenticating webhook:', error);
    return null;
  }
}
