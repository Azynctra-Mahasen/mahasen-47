
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getExactProduct } from "./knowledge-base.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class TicketHandler {
  static async handleTicketCreation(parsedResponse: any, context: any): Promise<string | null> {
    try {
      if (!parsedResponse || !parsedResponse.intent) return null;

      // Validate user ID
      if (!context.userId) {
        console.error("No userId provided in context for ticket creation");
        return "I'm having trouble processing your request. Please try again later.";
      }

      // Check if this is an order intent
      if (parsedResponse.intent === 'ORDER_PLACEMENT') {
        return await this.handleOrderIntent(parsedResponse, context);
      }

      // Check if this needs escalation
      if (parsedResponse.requires_escalation) {
        return await this.createEscalationTicket(parsedResponse, context);
      }

      return null;
    } catch (error) {
      console.error("Error handling ticket creation:", error);
      return null;
    }
  }

  private static async handleOrderIntent(parsedResponse: any, context: any): Promise<string | null> {
    try {
      const orderInfo = parsedResponse.detected_entities?.order_info;
      if (!orderInfo) return null;

      // Check the order state
      if (orderInfo.state === 'COLLECTING_INFO') {
        // Missing product name, quantity or awaiting confirmation
        if (!orderInfo.product_name) {
          return "What product would you like to order?";
        }
        
        if (!orderInfo.quantity) {
          return `How many of the ${orderInfo.product_name} would you like to order?`;
        }

        // Verify product exists
        const product = await getExactProduct(orderInfo.product_name, context.userId);
        if (!product) {
          return `I'm sorry, I couldn't find the product "${orderInfo.product_name}" in our catalog. Please check the product name and try again.`;
        }
        
        // Ask for confirmation
        return `You're about to order ${orderInfo.quantity} of ${orderInfo.product_name}. Please type "Yes", "Ow" or "ඔව්" to confirm your order.`;
      } 
      
      if (orderInfo.state === 'CONFIRMED') {
        // Get the exact product information
        const product = await getExactProduct(orderInfo.product_name, context.userId);
        if (!product) {
          return `I'm sorry, I couldn't find the product "${orderInfo.product_name}" in our catalog. Please check the product name and try again.`;
        }

        // Create ticket
        const ticketData = {
          user_id: context.userId, // Make sure to use the user ID
          title: `Order for ${orderInfo.product_name}`,
          customer_name: context.userName,
          platform: context.platform,
          type: 'Order',
          status: 'New',
          priority: 'HIGH',
          body: `Product Name: ${orderInfo.product_name}\nQuantity: ${orderInfo.quantity}`,
          conversation_id: context.conversationId,
          whatsapp_message_id: context.messageId,
          product_info: {
            product_id: product.metadata.product_id,
            product_name: orderInfo.product_name,
            quantity: orderInfo.quantity
          }
        };

        const { data: ticket, error } = await supabase
          .from('tickets')
          .insert(ticketData)
          .select()
          .single();

        if (error) {
          console.error("Error creating order ticket:", error);
          return "Order failed. Please retry with correct Product & Quantity in a bit.";
        }

        return `Your Order for ${orderInfo.product_name} for ${orderInfo.quantity} is placed successfully. Order Number is ${ticket.id}.`;
      }

      return null;
    } catch (error) {
      console.error("Error handling order intent:", error);
      return "Order failed. Please retry with correct Product & Quantity in a bit.";
    }
  }

  private static async createEscalationTicket(parsedResponse: any, context: any): Promise<string | null> {
    try {
      const ticketData = {
        user_id: context.userId, // Make sure to use the user ID
        title: `Support Request: ${context.messageContent.substring(0, 50)}...`,
        customer_name: context.userName,
        platform: context.platform,
        type: 'Support',
        status: 'New',
        priority: this.getPriorityFromResponse(parsedResponse),
        body: context.messageContent,
        conversation_id: context.conversationId,
        whatsapp_message_id: context.messageId,
        escalation_reason: parsedResponse.escalation_reason || 'Requires human assistance',
        intent_type: parsedResponse.intent
      };

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        console.error("Error creating escalation ticket:", error);
        return null;
      }

      return `I've created a support ticket for you. A customer service representative will get back to you soon. Your ticket number is ${ticket.id}.`;
    } catch (error) {
      console.error("Error creating escalation ticket:", error);
      return null;
    }
  }

  private static getPriorityFromResponse(parsedResponse: any): string {
    const urgency = parsedResponse.detected_entities?.urgency_level?.toUpperCase();
    if (urgency === 'HIGH' || urgency === 'URGENT') return 'HIGH';
    if (urgency === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }
}
