
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

  static async createOrderTicket(
    userId: string,
    customerName: string,
    productName: string,
    quantity: number,
    whatsappMessageId: string
  ): Promise<{ success: boolean; ticketId?: number; error?: string }> {
    try {
      console.log(`Creating order ticket for user: ${userId}, product: ${productName}, quantity: ${quantity}`);
      
      // Create ticket data object
      const ticketData = {
        user_id: userId,
        title: `Order for ${productName}`,
        customer_name: customerName,
        platform: 'whatsapp',
        type: 'Order',
        status: 'New',
        priority: 'HIGH',
        body: `Product Name: ${productName}\nQuantity: ${quantity}`,
        whatsapp_message_id: whatsappMessageId,
        product_info: {
          product_name: productName,
          quantity: quantity
        }
      };

      console.log("Inserting ticket with data:", JSON.stringify(ticketData, null, 2));

      // Insert ticket into database
      const { data: newTicket, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        console.error("Error creating order ticket:", error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      console.log("Successfully created ticket:", newTicket);
      return { 
        success: true, 
        ticketId: newTicket.id 
      };
    } catch (error) {
      console.error("Error creating order ticket:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static async handleOrderIntent(parsedResponse: any, context: any): Promise<string | null> {
    try {
      const orderInfo = parsedResponse.detected_entities?.order_info;
      if (!orderInfo) return null;

      // Check the order state
      if (orderInfo.state === 'COLLECTING_INFO') {
        // Missing product name, quantity or awaiting confirmation
        if (!orderInfo.product) {
          return "What product would you like to order?";
        }
        
        if (!orderInfo.quantity) {
          return `How many of the ${orderInfo.product} would you like to order?`;
        }

        // Verify product exists (optional step)
        
        // Ask for confirmation
        return `You're about to order ${orderInfo.quantity} of ${orderInfo.product}. Please type "Yes", "Ow" or "ඔව්" to confirm your order.`;
      } 
      
      return null;
    } catch (error) {
      console.error("Error handling order intent:", error);
      return "Order failed. Please retry with correct Product & Quantity in a bit.";
    }
  }

  private static async createEscalationTicket(parsedResponse: any, context: any): Promise<string | null> {
    try {
      // Get the actual user_id associated with this phone ID for proper isolation
      const { data: platformSecret, error: secretError } = await supabase
        .from('platform_secrets')
        .select('user_id')
        .eq('whatsapp_phone_id', Deno.env.get('WHATSAPP_PHONE_ID'))
        .maybeSingle();

      if (secretError) {
        console.error('Error fetching user_id from platform_secrets:', secretError);
        return null;
      }

      const authenticatedUserId = platformSecret?.user_id;
      console.log('Authenticated user ID for this platform:', authenticatedUserId);

      if (!authenticatedUserId) {
        console.error('No user_id found for this WhatsApp phone ID');
        return null;
      }
      
      const ticketData = {
        user_id: authenticatedUserId, // Use the properly authenticated user_id
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
