
import { createTicket, linkMessageToTicket, saveMessage, updateTicket } from "../database.ts";
import { formatKnowledgeBaseContext, searchKnowledgeBase } from "./knowledge-base.ts";
import { MessageContext } from "../message-processor.ts";

export async function processOrderIntent(
  messageContent: string,
  intentData: any,
  context: MessageContext,
  aiSettings: any
) {
  try {
    console.log("Processing order intent");

    // Check if this is a confirmation message
    const isConfirmation = isOrderConfirmation(messageContent);
    
    if (isConfirmation) {
      console.log("Order confirmation detected");
      
      // Create an order ticket
      const ticket = await createTicket(
        {
          title: `Order from ${context.userName}`,
          body: messageContent,
          customerName: context.userName,
          platform: "whatsapp",
          type: "ORDER",
          status: "New",
          conversationId: context.conversationId,
          intentType: "ORDER",
          priority: "HIGH",
          productInfo: intentData.productInfo || {}
        },
        context.userId // Add user_id to ticket creation
      );

      // Link the message to the ticket
      await linkMessageToTicket(ticket.id, context.messageId);

      // Create a confirmation message
      const confirmationText = `Your Order for ${intentData.productInfo?.product || "product"} for ${intentData.productInfo?.quantity || "1"} is placed successfully. Order Number is ${ticket.id}.`;
      
      // Update the ticket with confirmation message ID
      await updateTicket(
        ticket.id, 
        { 
          order_status: "confirmed",
          product_info: {
            ...intentData.productInfo,
            order_number: ticket.id,
            status: "confirmed"
          }
        },
        context.userId // Add user_id for ticket update
      );

      return {
        responseText: confirmationText,
        intentData: {
          ...intentData,
          type: "ORDER_CONFIRMATION"
        }
      };
    } else {
      // Determine if we need product or quantity information
      const productInfo = intentData.productInfo || {};
      let responseText = "";
      let updatedIntentData = intentData;

      // Initialize Supabase AI Session for embeddings
      const supabaseAISession = new Supabase.ai.Session('gte-small');
      console.log('Generating embedding for order query...');
      
      const embedding = await supabaseAISession.run(messageContent, {
        mean_pool: true,
        normalize: true,
      });

      // Search knowledge base with user_id filter
      const searchResults = await searchKnowledgeBase(embedding, context.userId);
      console.log(`Knowledge base search returned ${searchResults.length} results for user ${context.userId}`);

      // Format knowledge base context
      const knowledgeBaseContext = await formatKnowledgeBaseContext(searchResults);

      if (!productInfo.product) {
        responseText = "Please specify which product you would like to order.";
      } else if (!productInfo.quantity) {
        responseText = `How many ${productInfo.product} would you like to order?`;
      } else {
        // We have both product and quantity, ask for confirmation
        responseText = `Please confirm your order:\n- Product: ${productInfo.product}\n- Quantity: ${productInfo.quantity}\n\nType "Yes" or "Ow" or "ඔව්" to place the order.`;
      }

      return {
        responseText,
        intentData: updatedIntentData
      };
    }
  } catch (error) {
    console.error("Error processing order intent:", error);
    return {
      responseText: "I apologize, but I'm having trouble processing your order right now. Please try again later.",
      intentData: {
        type: "ERROR",
        errorMessage: error.message
      }
    };
  }
}

function isOrderConfirmation(message: string) {
  const confirmationKeywords = ["yes", "ow", "ඔව්", "ok", "confirm"];
  const lowerMessage = message.toLowerCase().trim();
  
  return confirmationKeywords.some(keyword => lowerMessage === keyword);
}
