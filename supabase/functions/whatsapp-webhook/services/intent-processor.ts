
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../../_shared/database.types.ts";

interface MessagingParams {
  phoneId: string;
  accessToken: string;
}

export async function handleIntent(
  supabase: ReturnType<typeof createClient<Database>>,
  conversationId: string,
  messageId: string,
  messageContent: string,
  fromNumber: string,
  contactName: string,
  messagingParams: MessagingParams,
  userId: string
) {
  try {
    console.log(`Processing intent for message: ${messageContent}`);

    // Check for order intent
    const orderIntent = detectOrderIntent(messageContent);
    if (orderIntent) {
      console.log("Order intent detected");
      await handleOrderIntent(
        supabase,
        conversationId,
        messageId,
        fromNumber,
        contactName,
        messageContent,
        messagingParams,
        userId
      );
      return;
    }

    // Default handling - for now, just log the message
    console.log("No specific intent detected");

  } catch (error) {
    console.error("Error processing intent:", error);
  }
}

function detectOrderIntent(message: string): boolean {
  const orderKeywords = [
    "order",
    "buy",
    "purchase",
    "get",
    "ගන්න",
    "ඔන්ඩර්",
    "ඔර්ඩර්",
    "මිලදී"
  ];
  
  const lowerMessage = message.toLowerCase();
  return orderKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
}

async function handleOrderIntent(
  supabase: ReturnType<typeof createClient<Database>>,
  conversationId: string,
  messageId: string,
  fromNumber: string,
  contactName: string,
  messageContent: string,
  messagingParams: MessagingParams,
  userId: string
) {
  try {
    // Extract product and quantity information (simple implementation)
    const { productName, quantity } = extractProductInfo(messageContent);
    
    // Create a ticket for the order
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        title: `Order: ${productName || "Unknown product"}`,
        customer_name: contactName,
        body: `Order from WhatsApp: ${messageContent}`,
        platform: "whatsapp",
        type: "Order",
        status: "New",
        priority: "HIGH",
        conversation_id: conversationId,
        intent_type: "order",
        product_info: {
          product: productName || "Unknown product",
          quantity: quantity || "Not specified"
        },
        user_id: userId
      })
      .select("id")
      .single();

    if (ticketError) {
      console.error("Error creating order ticket:", ticketError);
      return;
    }

    console.log(`Created order ticket: ${ticket.id}`);

    // Link the message to the ticket
    await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        message_id: messageId
      });

    // If product or quantity is missing, ask for it
    if (!productName || !quantity) {
      const responseMessage = !productName
        ? "What product would you like to order?"
        : "How many units would you like to order?";
      
      // Send response via WhatsApp
      await sendResponse(
        messagingParams.phoneId,
        messagingParams.accessToken,
        fromNumber,
        responseMessage
      );
    } else {
      // Send order confirmation
      const confirmationMessage = 
        `Thank you for your order!\n\nProduct: ${productName}\nQuantity: ${quantity}\n\nPlease type "Yes" or "ඔව්" to confirm your order.`;
      
      await sendResponse(
        messagingParams.phoneId,
        messagingParams.accessToken,
        fromNumber,
        confirmationMessage
      );
    }
  } catch (error) {
    console.error("Error handling order intent:", error);
  }
}

function extractProductInfo(message: string): { productName: string | null; quantity: string | null } {
  // A very simple implementation - in real scenarios, you would use NLP or a more robust parser
  
  // Extract product name - look for common patterns
  let productName: string | null = null;
  const productMatches = message.match(/(?:order|buy|get|ගන්න|ඕන|ඔනි|need).*?(\w+(?:\s+\w+){0,3})/i);
  if (productMatches && productMatches[1]) {
    productName = productMatches[1].trim();
  }
  
  // Extract quantity - look for numbers
  let quantity: string | null = null;
  const quantityMatches = message.match(/(\d+)\s*(?:units|pieces|items|pcs|ක්|ගානක්|ගාණක්)/i);
  if (quantityMatches && quantityMatches[1]) {
    quantity = quantityMatches[1];
  }
  
  return { productName, quantity };
}

async function sendResponse(
  phoneId: string,
  accessToken: string,
  to: string,
  message: string
) {
  try {
    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return { 
        success: false, 
        error: `WhatsApp API error: ${data.error?.message || JSON.stringify(data)}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { 
      success: false, 
      error: `Error sending WhatsApp message: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
