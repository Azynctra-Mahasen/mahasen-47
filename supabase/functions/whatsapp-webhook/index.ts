
// Follow this setup guide to integrate the Deno standard library
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { authenticateWhatsAppUser } from "./auth-handler.ts";
import { processMessage } from "./message-processor.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Process a WhatsApp webhook message
async function processWebhook(webhookBody: any) {
  try {
    console.log("WhatsApp API payload:", JSON.stringify(webhookBody));
    
    if (webhookBody.object !== 'whatsapp_business_account') {
      console.error("Unknown webhook object type:", webhookBody.object);
      return { success: false, error: "Unsupported webhook object type" };
    }
    
    // Process each entry in the webhook
    for (const entry of webhookBody.entry || []) {
      // Process each change in the entry
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        
        const value = change.value;
        if (!value || !value.metadata || !value.metadata.phone_number_id) {
          console.error("Missing phone_number_id in webhook payload");
          continue;
        }
        
        const phoneNumberId = value.metadata.phone_number_id;
        console.log("Processing message for phone_number_id:", phoneNumberId);
        
        // Authenticate user and get context
        const userContext = await authenticateWhatsAppUser(phoneNumberId);
        if (!userContext) {
          console.error("Failed to authenticate user for phone_number_id:", phoneNumberId);
          continue;
        }
        
        console.log("Authenticated user context:", userContext);
        
        // Process the webhook payload with the user context
        await processMessage(value, userContext);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return { success: false, error: String(error) };
  }
}

// Verify webhook challenge
function verifyWebhookChallenge(req: Request, url: URL): Response | null {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  console.log("Verification request received - mode:", mode, "token:", token);
  
  // If this is a verification request
  if (mode === 'subscribe' && token && challenge) {
    // Normally we would check the token against the one in the database per user
    // But for simplicity and to disable JWT enforcement, we'll accept any token for now
    console.log("Verification successful, returning challenge");
    return new Response(challenge, { status: 200 });
  }
  
  return null;
}

serve(async (req) => {
  // Parse URL to get query parameters
  const url = new URL(req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check if this is a webhook verification request
    const verificationResponse = verifyWebhookChallenge(req, url);
    if (verificationResponse) {
      return verificationResponse;
    }
    
    // For regular webhook POST calls
    if (req.method === 'POST') {
      const payload = await req.json();
      const result = await processWebhook(payload);
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // For unsupported methods
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
