
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
    
    // Debug: List all platform_secrets for troubleshooting
    const { data: allSecrets, error: listError } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id, whatsapp_access_token, whatsapp_verify_token');
    
    if (listError) {
      console.error('Error listing platform secrets:', listError);
    } else {
      console.log('Available platform_secrets:', JSON.stringify(allSecrets));
    }
    
    // First try the standard query with exact match
    const { data: secretsData, error: secretsError } = await supabase
      .from('platform_secrets')
      .select('user_id, whatsapp_phone_id, whatsapp_access_token, whatsapp_verify_token')
      .eq('whatsapp_phone_id', phoneNumberId)
      .maybeSingle();
    
    if (!secretsError && secretsData) {
      console.log(`Found user: ${secretsData.user_id} for WhatsApp phone ID: ${phoneNumberId}`);
      
      return {
        userId: secretsData.user_id,
        whatsappPhoneId: secretsData.whatsapp_phone_id,
        whatsappAccessToken: secretsData.whatsapp_access_token || '',
        whatsappVerifyToken: secretsData.whatsapp_verify_token || '',
      };
    }
    
    // If no exact match found, try a more flexible approach
    console.log('No exact match found, trying flexible matching...');
    
    if (allSecrets && allSecrets.length > 0) {
      // Try different matching strategies
      let matchedRecord = null;
      
      // Try trimming whitespace
      matchedRecord = allSecrets.find(record => 
        record.whatsapp_phone_id && 
        phoneNumberId && 
        record.whatsapp_phone_id.trim() === phoneNumberId.trim()
      );
      
      // Try contains relationship
      if (!matchedRecord) {
        matchedRecord = allSecrets.find(record => 
          record.whatsapp_phone_id && 
          phoneNumberId && 
          (record.whatsapp_phone_id.includes(phoneNumberId) || 
           phoneNumberId.includes(record.whatsapp_phone_id))
        );
      }
      
      if (matchedRecord) {
        console.log(`Found user through flexible matching: ${matchedRecord.user_id}`);
        
        return {
          userId: matchedRecord.user_id,
          whatsappPhoneId: matchedRecord.whatsapp_phone_id,
          whatsappAccessToken: matchedRecord.whatsapp_access_token || '',
          whatsappVerifyToken: matchedRecord.whatsapp_verify_token || '',
        };
      }
    }
    
    console.error('No user found with the given WhatsApp phone ID after flexible search');
    return null;
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
