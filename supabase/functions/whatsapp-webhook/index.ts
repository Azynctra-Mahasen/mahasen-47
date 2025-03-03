
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { Database } from "../_shared/database.types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { processMessage } from "./message-processor.ts";

const VERIFY_TOKEN = "MAHASEN_VERIFY_TOKEN";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Handle verification request from WhatsApp
    if (url.searchParams.has("hub.mode") && url.searchParams.has("hub.verify_token")) {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WhatsApp webhook verified");
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      } else {
        return new Response("Verification failed", {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }
    }

    // Process incoming message
    if (req.method === "POST") {
      const body = await req.json();
      console.log("WhatsApp API payload:", JSON.stringify(body));

      // Extract phone_number_id from the payload
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const phoneNumberId = value?.metadata?.phone_number_id;

      if (!phoneNumberId) {
        console.error("Missing phone_number_id in payload");
        return new Response(JSON.stringify({ success: false, error: "Missing phone_number_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Get the user ID based on the phone_number_id
      const { data: platformSecret, error: secretError } = await supabase
        .from("platform_secrets")
        .select("user_id")
        .eq("whatsapp_phone_id", phoneNumberId)
        .single();
      
      if (secretError || !platformSecret?.user_id) {
        console.error("Error finding user for phone_number_id:", phoneNumberId, secretError);
        return new Response(JSON.stringify({ success: false, error: "User not found for phone_number_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const userId = platformSecret.user_id;
      console.log(`Processing message for user ${userId} (phone_number_id: ${phoneNumberId})`);

      // Process the incoming message with the identified user
      await processMessage(body, userId, phoneNumberId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
