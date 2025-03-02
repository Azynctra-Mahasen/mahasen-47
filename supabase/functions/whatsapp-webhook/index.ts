
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processMessage } from "./message-processor.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getMessagingParams, sendWhatsAppMessage } from "./whatsapp.ts";
import { handleIntent } from "./services/intent-processor.ts";
import { Database } from "../_shared/database.types.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // We switched from verification to simply returning the challenge
    // Get the URL params
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const challenge = url.searchParams.get("hub.challenge");

    // This is the webhook verification - just return the challenge
    if (req.method === "GET" && mode === "subscribe") {
      console.log("Webhook verified with challenge:", challenge);
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Handle the incoming webhook
    if (req.method === "POST") {
      // Parse the request body
      const payload = await req.json();
      console.log("WhatsApp API payload:", JSON.stringify(payload));

      // Find the message in the payload
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const metadata = value?.metadata;
      const phone_number_id = metadata?.phone_number_id;
      const messages = value?.messages;

      // Store webhook event for logging purposes
      await supabase.from("system_logs").insert({
        component: "whatsapp-webhook",
        log_level: "INFO",
        message: "WhatsApp API payload: " + JSON.stringify(payload),
      });

      // If there are no messages, return OK
      if (!messages || messages.length === 0) {
        console.log("No messages in webhook");
        return new Response("OK", {
          status: 200,
          headers: corsHeaders,
        });
      }

      // IMPORTANT CHANGE: Find the user_id based on the phone_number_id
      const { data: userIdData, error: userIdError } = await supabase
        .rpc('get_user_by_phone_number_id', { phone_id: phone_number_id })
        .single();

      if (userIdError || !userIdData) {
        console.error("Error finding user for phone_number_id:", phone_number_id, userIdError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "User not found for this WhatsApp account",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const userId = userIdData;
      console.log(`Processing message for user_id: ${userId}`);

      // Process each message in the webhook
      for (const message of messages) {
        if (message.type !== "text") {
          console.log(`Skipping non-text message of type: ${message.type}`);
          continue;
        }

        try {
          // Get messaging parameters
          const messagingParams = await getMessagingParams(
            supabase,
            phone_number_id,
            userId
          );

          if (!messagingParams) {
            console.error("Could not get messaging parameters");
            continue;
          }

          // Extract message data
          const from = message.from;
          const messageId = message.id;
          const messageBody = message.text.body;
          const contactName = value.contacts?.[0]?.profile?.name || "Unknown";

          // Process the message - now includes userId parameter
          const { conversationId, dbMessageId } = await processMessage(
            supabase,
            {
              from,
              contactName,
              messageId,
              messageBody,
              phoneNumberId: phone_number_id,
              userId
            }
          );

          // Handle intent - pass userId for proper context and security
          await handleIntent(
            supabase,
            conversationId,
            dbMessageId,
            messageBody,
            from,
            contactName,
            messagingParams,
            userId
          );
        } catch (error) {
          console.error("Error processing message:", error);
          await supabase.from("webhook_errors").insert({
            error_type: "message_processing",
            message: `Error processing message: ${error.message}`,
            details: { error: error.toString() },
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return 405 for unsupported methods
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Webhook error:", error);

    // Log the error in the database
    try {
      await supabase.from("webhook_errors").insert({
        error_type: "webhook_processing",
        message: `Webhook error: ${error.message}`,
        details: { error: error.toString() },
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
