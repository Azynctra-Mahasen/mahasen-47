
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface UserContext {
  userId: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
}

/**
 * Authenticate user based on WhatsApp phone ID
 * @param phoneNumberId The WhatsApp phone ID from the webhook payload
 */
export async function authenticateUser(phoneNumberId: string): Promise<UserContext | null> {
  try {
    console.log('Authenticating user for WhatsApp phone ID:', phoneNumberId);

    // Look up the platform secrets for this phone ID
    const { data: platformSecret, error } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id, whatsapp_access_token')
      .eq('whatsapp_phone_id', phoneNumberId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching platform secret:', error);
      throw error;
    }

    if (!platformSecret) {
      console.error('No platform secret found for phone ID:', phoneNumberId);
      
      // Fallback to environment variables
      const fallbackUserId = Deno.env.get('FALLBACK_USER_ID') || '';
      const fallbackAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
      
      console.log('Using fallback authentication:', { 
        phoneNumberId,
        fallbackUserId: fallbackUserId ? 'Set' : 'Not set'
      });
      
      if (fallbackUserId) {
        return {
          userId: fallbackUserId,
          whatsappPhoneId: phoneNumberId,
          whatsappAccessToken: fallbackAccessToken
        };
      }
      
      return null;
    }

    console.log('Found user for WhatsApp phone ID:', platformSecret.user_id);

    return {
      userId: platformSecret.user_id,
      whatsappPhoneId: platformSecret.whatsapp_phone_id,
      whatsappAccessToken: platformSecret.whatsapp_access_token
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
