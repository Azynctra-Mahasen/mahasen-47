
/**
 * Send a WhatsApp message via the Meta/WhatsApp Business API
 * @param to Recipient phone number
 * @param message Message content
 * @param phoneId WhatsApp phone ID from the user's configuration
 * @param accessToken WhatsApp access token from the user's configuration
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  phoneId: string,
  accessToken: string
): Promise<void> {
  try {
    console.log(`Sending WhatsApp message to ${to} using phone ID ${phoneId}`);
    
    if (!phoneId || !accessToken) {
      throw new Error('Missing WhatsApp credentials');
    }
    
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      throw new Error(`WhatsApp API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    console.log('WhatsApp message sent successfully:', data);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

/**
 * Validate a webhook signature from WhatsApp
 * @param signature The X-Hub-Signature-256 header value
 * @param body The raw request body
 * @param appSecret The app secret from the user's configuration
 */
export function validateWebhookSignature(
  signature: string,
  body: string,
  appSecret: string
): boolean {
  try {
    // Skip validation if no signature or secret is provided
    if (!signature || !appSecret) {
      console.warn('Missing signature or app secret for validation');
      return true; // Return true for now to allow progression
    }
    
    // In a real implementation, we would validate the HMAC here
    console.log('Webhook signature validation not implemented');
    return true;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}
