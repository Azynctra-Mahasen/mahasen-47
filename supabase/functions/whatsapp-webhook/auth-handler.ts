
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface UserContext {
  userId: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
  whatsappVerifyToken: string;
}

/**
 * Get user by their WhatsApp phone ID
 * @param phoneNumberId The WhatsApp phone number ID from the webhook payload
 */
export async function getUserByPhoneId(phoneNumberId: string): Promise<UserContext | null> {
  try {
    console.log(`Looking up user for WhatsApp phone ID: ${phoneNumberId}`);
    
    // Get all secrets that match this phone ID
    const { data: secretsData, error: secretsError } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id, whatsapp_access_token, whatsapp_verify_token')
      .eq('whatsapp_phone_id', phoneNumberId);
    
    if (secretsError) {
      console.error('Error fetching platform secrets:', secretsError);
      return null;
    }
    
    if (!secretsData || secretsData.length === 0) {
      console.error('No user found with the given WhatsApp phone ID');
      return null;
    }
    
    // Take the most recently updated user if there are multiple matches
    // Sort the records by updated_at in descending order (most recent first)
    const { data: sortedData, error: sortError } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id, whatsapp_access_token, whatsapp_verify_token, updated_at')
      .eq('whatsapp_phone_id', phoneNumberId)
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (sortError || !sortedData || sortedData.length === 0) {
      console.error('Error getting the most recent platform secret:', sortError);
      return null;
    }
    
    const mostRecentRecord = sortedData[0];
    
    // Create user context from the most recent record
    const userContext: UserContext = {
      userId: mostRecentRecord.user_id,
      whatsappPhoneId: mostRecentRecord.whatsapp_phone_id || '',
      whatsappAccessToken: mostRecentRecord.whatsapp_access_token || '',
      whatsappVerifyToken: mostRecentRecord.whatsapp_verify_token || '',
    };
    
    console.log(`Found user: ${userContext.userId} for WhatsApp phone ID: ${phoneNumberId}`);
    return userContext;
  } catch (error) {
    console.error('Error in getUserByPhoneId:', error);
    return null;
  }
}

/**
 * Extract the WhatsApp phone number ID from the webhook payload
 * @param payload The webhook payload
 */
export function extractPhoneNumberId(payload: any): string | null {
  try {
    // Extract phone_number_id from WhatsApp webhook payload
    const phoneNumberId = payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    
    if (!phoneNumberId) {
      console.error('Could not extract phone_number_id from payload:', JSON.stringify(payload));
      return null;
    }
    
    return phoneNumberId;
  } catch (error) {
    console.error('Error extracting phone_number_id:', error);
    return null;
  }
}

/**
 * Authenticate the user based on WhatsApp webhook payload
 * @param payload The webhook payload
 */
export async function authenticateWebhookUser(payload: any): Promise<UserContext | null> {
  // Extract phone number ID from payload
  const phoneNumberId = extractPhoneNumberId(payload);
  
  if (!phoneNumberId) {
    return null;
  }
  
  // Look up user by phone ID
  return await getUserByPhoneId(phoneNumberId);
}
