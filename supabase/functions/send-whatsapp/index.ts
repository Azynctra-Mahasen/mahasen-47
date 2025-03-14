
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

/**
 * Non-blocking system logging utility for edge function
 */
function logSystemEventAsync(
  component: string, 
  level: string, 
  message: string, 
  metadata: Record<string, any> = {}
) {
  // Use waitUntil for background processing
  try {
    // @ts-ignore - EdgeRuntime is available in Deno edge functions
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          await supabase.from('system_logs').insert({
            component,
            log_level: level,
            message,
            metadata
          });
        } catch (logError) {
          // Just console log errors in the logging system
          console.error('Failed to write system log:', logError);
        }
      })()
    );
  } catch (error) {
    // Fallback if waitUntil isn't available
    console.error('Error in logging system:', error);
  }
}

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
    
    // Log successful message send in a non-blocking way
    logSystemEventAsync(
      'whatsapp',
      'INFO',
      'WhatsApp message sent successfully',
      {
        to: to,
        phone_id: cleanPhoneId,
        type: type,
        success: true,
        message_id: result?.messages?.[0]?.id || null
      }
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
    
    // Log error in a non-blocking way
    logSystemEventAsync(
      'whatsapp',
      'ERROR',
      'Error sending WhatsApp message',
      {
        error_message: error.message || "Unknown error",
        stack_trace: error.stack || null,
      }
    );
    
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
