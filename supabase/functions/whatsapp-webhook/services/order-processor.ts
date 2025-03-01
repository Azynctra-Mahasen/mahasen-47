
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../../_shared/database.types.ts";
import { MessagingParams, sendWhatsAppMessage } from "../whatsapp.ts";
import { createNewTicket } from "../automatedTicketService.ts";

export async function processOrderIntent(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  messageId: string,
  messageContent: string,
  senderNumber: string,
  senderName: string,
  messagingParams: MessagingParams,
  userId: string // Added userId parameter
) {
  try {
    // Parse the order details from the message
    const { productName, quantity } = extractOrderDetails(messageContent);

    if (!productName || !quantity) {
      // If we couldn't extract both product and quantity, ask for more information
      await sendWhatsAppMessage(
        messagingParams,
        senderNumber,
        "I'd like to help you place an order. Could you please specify the product name and quantity you want to order?"
      );
      
      // Store this response in the database
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        content: "I'd like to help you place an order. Could you please specify the product name and quantity you want to order?",
        status: "sent",
        sender_number: messagingParams.phoneNumberId,
        sender_name: "AI Assistant",
        user_id: userId, // Set the user_id for the response message
      });
      
      return;
    }

    // Create an order confirmation message
    const confirmationMessage = `Would you like to place an order for ${quantity} ${productName}? Please reply with "Yes", "Ow", or "ඔව්" to confirm your order.`;
    
    // Send the confirmation message
    await sendWhatsAppMessage(messagingParams, senderNumber, confirmationMessage);
    
    // Store the confirmation message and order details in the database
    const { data: confirmationData, error: confirmationError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content: confirmationMessage,
        status: "sent",
        sender_number: messagingParams.phoneNumberId,
        sender_name: "AI Assistant",
        order_info: { productName, quantity, status: "awaiting_confirmation" },
        user_id: userId, // Set the user_id
      })
      .select("id")
      .single();
      
    if (confirmationError) {
      console.error("Error storing confirmation message:", confirmationError);
      throw confirmationError;
    }
    
    // Create a pending order ticket
    await createNewTicket(
      supabase,
      {
        platform: "whatsapp",
        type: "Order",
        title: `Order for ${productName}`,
        body: `Customer wants to order ${quantity} ${productName}.`,
        customer_name: senderName,
        status: "New",
        priority: "HIGH",
        product_info: { productName, quantity },
        confirmation_message_id: confirmationData.id,
        whatsapp_message_id: messageId,
        conversation_id: conversationId,
      },
      userId // Pass userId to ensure the ticket is created for the correct user
    );
    
  } catch (error) {
    console.error("Error processing order intent:", error);
    // Log the error
    await supabase.from("system_logs").insert({
      component: "order-processor",
      log_level: "ERROR",
      message: `Error processing order: ${error.message}`,
      metadata: { error: error.toString() },
    });
    
    // Send an error message
    await sendWhatsAppMessage(
      messagingParams,
      senderNumber,
      "I'm sorry, but I encountered an error processing your order. Please try again later."
    );
  }
}

// Helper function to extract order details
function extractOrderDetails(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Very basic extraction logic (this can be improved with NLP)
  let productName = null;
  let quantity = null;
  
  // Look for product names (this is a simplistic approach)
  const productWords = ["t-shirt", "shirt", "hat", "cap", "book", "mug", "pen"];
  for (const product of productWords) {
    if (lowerMessage.includes(product)) {
      productName = product;
      break;
    }
  }
  
  // Look for quantity
  const quantityMatch = lowerMessage.match(/(\d+)/);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1]);
  }
  
  return { productName, quantity };
}
