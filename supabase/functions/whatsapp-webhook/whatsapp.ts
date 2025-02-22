
export async function sendWhatsAppMessage(
  to: string,
  text: string,
  accessToken: string,
  phoneId: string
) {
  try {
    // Validate required parameters
    if (!to || !text || !accessToken || !phoneId) {
      throw new Error(`Missing required parameters: ${JSON.stringify({
        hasTo: !!to,
        hasText: !!text,
        hasAccessToken: !!accessToken,
        hasPhoneId: !!phoneId
      })}`);
    }

    console.log('Sending WhatsApp message with:', {
      to,
      phoneId,
      textLength: text.length,
      hasAccessToken: !!accessToken
    });
    
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: text
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp API error response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(`WhatsApp API error: ${data.error?.message || 'Unknown error'}`);
    }

    console.log('WhatsApp API success response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
