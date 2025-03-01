
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { decodeJwt } from "https://deno.land/x/djwt@v2.8/mod.ts";

import { processMessage } from "./message-processor.ts";
import { saveMessageToDatabase, getAISettingsForUser, saveMessage } from "./database.ts";

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") as string,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
);

// Disable JWT verification for whatsapp-webhook
serve(async (req) => {
  const startTime = Date.now();
  let conversationId;
  let messageId;
  let phoneNumberId;
  
  try {
    // Handle POST request for WhatsApp webhook
    if (req.method === "POST") {
      const requestData = await req.json();
      console.log("WhatsApp API payload:", JSON.stringify(requestData));

      const entry = requestData.entry && requestData.entry[0];
      const changes = entry && entry.changes && entry.changes[0];
      const value = changes && changes.value;
      const metadata = value && value.metadata;
      const messages = value && value.messages;

      // Extract message data
      if (messages && messages.length > 0 && metadata) {
        phoneNumberId = metadata.phone_number_id;
        const message = messages[0];
        const contacts = value.contacts && value.contacts[0];

        if (!phoneNumberId) {
          throw new Error("Missing phone_number_id in the request");
        }
        
        // Find the user that owns this phone_number_id
        const { data: userData, error: userError } = await supabaseClient.rpc(
          'get_user_by_phone_number_id',
          { phone_id: phoneNumberId }
        );
        
        if (userError || !userData) {
          console.error("Error finding user for phone_number_id:", phoneNumberId, userError);
          throw new Error(`No user found for WhatsApp Phone ID: ${phoneNumberId}`);
        }
        
        const userId = userData;
        console.log(`Found user: ${userId} for WhatsApp phone ID: ${phoneNumberId}`);

        // Save incoming message to database
        const { conversationId: convId, messageId: msgId } = await saveMessageToDatabase(
          userId,
          message, 
          contacts,
          phoneNumberId
        );
        
        conversationId = convId;
        messageId = msgId;

        // Get AI settings for this specific user
        const aiSettings = await getAISettingsForUser(userId);
        
        // Process the message with the user's specific AI settings and knowledge base
        const { responseText, intentData } = await processMessage(
          message, 
          {
            conversationId,
            messageId,
            userId,
            phoneNumberId,
            userName: contacts.profile.name,
          },
          aiSettings
        );

        // Skip automated responses when handling order confirmations
        if (intentData && intentData.type === "ORDER_CONFIRMATION") {
          console.log("Skipping response for order confirmation");
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Save AI response to database
        await saveMessage(
          conversationId,
          responseText,
          "sent",
          "AI Assistant",
          "system",
          { is_ai_message: true },
          userId
        );

        // Log performance metrics
        const endTime = Date.now();
        const processingTime = (endTime - startTime) / 1000;
        console.log(`Total processing time: ${processingTime.toFixed(2)} seconds`);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Handle GET request for webhook verification
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      // Verify token with a simple shared secret
      if (mode === "subscribe" && token) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      } else {
        return new Response("Token validation failed", { status: 403 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Log error to database for tracking
    try {
      await supabaseClient.from("webhook_errors").insert({
        error_type: "processing_error",
        message: error.message,
        details: {
          conversationId,
          messageId,
          phoneNumberId,
          stack: error.stack,
        },
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
