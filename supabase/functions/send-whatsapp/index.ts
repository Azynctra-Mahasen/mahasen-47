
// Follow this setup guide to integrate the Deno standard library
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendWhatsAppMessage } from "./whatsapp.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define CORS headers for responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    console.log('Received request:', JSON.stringify(requestData, null, 2));
    
    const {
      to,
      message,
      type = "text",
      mediaUrl,
      phoneId,
      accessToken,
      useAI = false,
      conversationId = null
    } = requestData;
    
    // Validate required parameters
    if (!to || !message || !phoneId || !accessToken) {
      console.error('Missing required parameters:', { to, message, phoneId, accessToken });
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Clean up phone ID to prevent whitespace issues
    const cleanPhoneId = phoneId.trim();
    console.log(`Sending WhatsApp message to ${to} using phone ID ${cleanPhoneId}`);
    
    // Send the WhatsApp message
    const result = await sendWhatsAppMessage(
      to,
      message,
      cleanPhoneId,
      accessToken,
      type,
      mediaUrl
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error in send-whatsapp function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
