
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sendWhatsAppMessage } from './whatsapp.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, type, useAI = false, phoneId, accessToken } = await req.json();

    if (!to || !message || !phoneId || !accessToken) {
      throw new Error('Missing required parameters');
    }

    console.log('Received request:', { to, message, type, useAI });

    // Send message to WhatsApp
    const whatsappData = await sendWhatsAppMessage(to, message, accessToken, phoneId);
    console.log('WhatsApp API response:', whatsappData);

    return new Response(
      JSON.stringify({ success: true, data: whatsappData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-whatsapp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
