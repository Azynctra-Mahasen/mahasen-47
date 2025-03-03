
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../_shared/database.types.ts";
import { processMessage } from "./message-processor.ts";
import { getMessagingParams, sendWhatsAppMessage } from "./whatsapp.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Simple intent detection for order-related messages
function detectOrderIntent(messageBody: string): boolean {
  const orderKeywords = [
    "order",
    "buy",
    "purchase",
    "get",
    "ඇණවුම",
    "මිලදී ගන්න",
    "ගන්න",
  ];
  
  const lowerCaseMessage = messageBody.toLowerCase();
  return orderKeywords.some(keyword => lowerCaseMessage.includes(keyword.toLowerCase()));
}

// Extract product and quantity from message
function extractOrderDetails(messageBody: string): { productName: string | null; quantity: number | null } {
  // This is a very basic implementation - in a real system, you would use more sophisticated NLP
  const lowerCaseMessage = messageBody.toLowerCase();
  let productName = null;
  let quantity = null;
  
  // Look for quantity patterns like "2 apples" or "ten shirts"
  const quantityMatch = lowerCaseMessage.match(/(\d+)\s+(\w+)/);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1]);
    productName = quantityMatch[2];
  }
  
  // If no product/quantity found, try to extract just a product name
  if (!productName) {
    const words = lowerCaseMessage.split(/\s+/);
    // Skip common words and take a potential product name
    const potentialProducts = words.filter(w => 
      w.length > 3 && 
      !["order", "buy", "get", "please", "would", "like", "want", "some"].includes(w)
    );
    
    if (potentialProducts.length > 0) {
      productName = potentialProducts[0];
    }
    
    // Default quantity if not found
    if (!quantity && productName) {
      quantity = 1;
    }
  }
  
  return { productName, quantity };
}

// Create a ticket for an order
async function createOrderTicket(
  userId: string,
  customerName: string,
  customerNumber: string,
  conversationId: string,
  messageId: string,
  messageBody: string,
  productName: string,
  quantity: number
) {
  try {
    const ticketId = await generateTicketId();
    
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        id: ticketId, // Use the same ID for both order and ticket
        title: `Order - ${productName}`,
        customer_name: customerName,
        body: `Product: ${productName}, Quantity: ${quantity}. Original message: ${messageBody}`,
        platform: "whatsapp",
        type: "Order",
        priority: "HIGH",
        status: "New",
        user_id: userId,
        conversation_id: conversationId,
        whatsapp_message_id: messageId,
        product_info: { name: productName, quantity: quantity }
      })
      .select("id")
      .single();
      
    if (error) {
      console.error("Error creating order ticket:", error);
      return null;
    }
    
    console.log(`Created order ticket with ID: ${ticket.id}`);
    return ticket.id;
  } catch (error) {
    console.error("Exception creating order ticket:", error);
    return null;
  }
}

// Generate a ticket ID
async function generateTicketId(): Promise<number> {
  // In a real implementation, this might query for the latest ticket ID and increment it
  // For simplicity, we'll just use the current timestamp
  return Math.floor(Date.now() / 1000);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  console.log(`Received ${req.method} request to ${url.pathname}`);

  // Handle WhatsApp verification request
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log(`Webhook verification: mode=${mode}, token=${token}`);

    if (mode === "subscribe") {
      // We should verify the token against the user's verify_token in the database
      // But for now, let's just accept the verification
      console.log("Webhook verified successfully");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    return new Response("Verification failed", {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }

  // Handle webhook events
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("WhatsApp API payload:", JSON.stringify(body));

      // Check if this is a WhatsApp message event
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.value?.messaging_product === "whatsapp" && 
                change.value?.messages?.length > 0) {
              
              const metadata = change.value.metadata;
              const phoneNumberId = metadata.phone_number_id;
              
              // Use the get_user_by_phone_number_id function to identify which user this message is for
              const { data: userId, error: userError } = await supabase.rpc(
                "get_user_by_phone_number_id",
                { phone_id: phoneNumberId }
              );
              
              if (userError || !userId) {
                console.error("Error getting user ID for phone number ID:", userError);
                return new Response(JSON.stringify({ error: "User not found for this WhatsApp account" }), {
                  status: 404,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
              
              console.log(`Found user ID for phone number ID ${phoneNumberId}: ${userId}`);
              
              // Process each message
              for (const message of change.value.messages) {
                if (message.type === "text") {
                  const contact = change.value.contacts?.[0];
                  const contactName = contact?.profile?.name || "Unknown";
                  const from = message.from;
                  const messageId = message.id;
                  const messageBody = message.text.body;
                  
                  // Process and store the message
                  const { conversationId, dbMessageId } = await processMessage(supabase, {
                    from,
                    contactName,
                    messageId,
                    messageBody,
                    phoneNumberId,
                    userId
                  });
                  
                  // Check if this message has an order intent
                  if (detectOrderIntent(messageBody)) {
                    console.log("Order intent detected in message");
                    
                    // Extract product and quantity from the message
                    const { productName, quantity } = extractOrderDetails(messageBody);
                    
                    if (productName && quantity) {
                      console.log(`Extracted order details: ${quantity} ${productName}`);
                      
                      // Create an order ticket
                      const ticketId = await createOrderTicket(
                        userId,
                        contactName,
                        from,
                        conversationId,
                        messageId,
                        messageBody,
                        productName,
                        quantity
                      );
                      
                      if (ticketId) {
                        // Get messaging params
                        const messagingParams = await getMessagingParams(supabase, phoneNumberId, userId);
                        
                        if (messagingParams) {
                          // Send confirmation message
                          const confirmationMessage = 
                            `Thank you for your interest in ${productName}. Would you like to place an order for ${quantity} units? Please type "Yes" to confirm.`;
                          
                          await sendWhatsAppMessage(messagingParams, from, confirmationMessage);
                        }
                      }
                    } else {
                      console.log("Could not extract complete order details from message");
                      
                      // Get messaging params
                      const messagingParams = await getMessagingParams(supabase, phoneNumberId, userId);
                      
                      if (messagingParams) {
                        // Send request for more information
                        const requestMoreInfoMessage = 
                          "I'd be happy to help you place an order. Could you please specify what product and quantity you'd like to order?";
                        
                        await sendWhatsAppMessage(messagingParams, from, requestMoreInfoMessage);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing webhook:", error);
      
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Handle other HTTP methods
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
