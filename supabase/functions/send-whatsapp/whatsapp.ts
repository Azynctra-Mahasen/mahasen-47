
export async function sendWhatsAppMessage(to: string, text: string, accessToken: string, phoneId: string) {
  try {
    console.log('Sending WhatsApp message with:', { to, phoneId, textLength: text.length });
    
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    console.log('WhatsApp API response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
