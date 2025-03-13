
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Initialize Supabase client for logging
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Send a WhatsApp message via the Meta/WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  phoneId: string,
  accessToken: string,
  type: string = "text",
  mediaUrl?: string
) {
  try {
    // Clean up phone ID by removing whitespace
    const cleanPhoneId = phoneId.trim();
    
    console.log(`Sending WhatsApp message to ${to} using phone ID ${cleanPhoneId}`);
    
    const url = `https://graph.facebook.com/v17.0/${cleanPhoneId}/messages`;
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    
    let body: any;
    
    if (type === "text") {
      body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      };
    } else if (type === "image" && mediaUrl) {
      body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'image',
        image: {
          link: mediaUrl,
        },
      };
    } else {
      throw new Error(`Unsupported message type: ${type}`);
    }
    
    // Log the request details
    console.log(`WhatsApp API request: ${url}`);
    console.log(`Request headers: ${JSON.stringify(headers, null, 2)}`);
    console.log(`Request body: ${JSON.stringify(body, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp API error:', JSON.stringify(responseData, null, 2));
      
      // Try to log error details, but don't fail if logging fails
      try {
        await supabase.from('system_logs').insert({
          component: 'whatsapp',
          log_level: 'ERROR',
          message: 'WhatsApp API error',
          metadata: {
            status: response.status,
            statusText: response.statusText,
            error: responseData,
            request_url: url,
            phone_id: cleanPhoneId,
            to: to,
            type: type,
          }
        }).throwOnError();
      } catch (logError) {
        console.error('Error logging to system_logs:', logError);
      }
      
      throw new Error(`WhatsApp API error: ${JSON.stringify(responseData, null, 2)}`);
    }
    
    console.log('WhatsApp message sent successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    // Try to log error, but don't fail if logging fails
    try {
      await supabase.from('system_logs').insert({
        component: 'whatsapp',
        log_level: 'ERROR',
        message: 'Error sending WhatsApp message',
        metadata: {
          error_message: error.message,
          phone_id: phoneId,
          to: to,
          type: type,
        }
      }).throwOnError();
    } catch (logError) {
      console.error('Error logging to system_logs:', logError);
    }
    
    throw error;
  }
}
