
import { createTicket, linkMessageToTicket } from "../database.ts";

interface TicketContext {
  messageId: string;
  conversationId: string;
  userName: string;
  platform: string;
  messageContent: string;
  knowledgeBase?: string;
  userId: string;
}

interface AIResponse {
  response: string;
  intent?: string;
  confidence?: number;
  needs_human?: boolean;
  escalation_reason?: string;
  entities?: Record<string, any>;
  sentiment?: string;
  emotion?: string;
  priority?: string;
  product_info?: Record<string, any>;
}

export class TicketHandler {
  static async handleTicketCreation(
    aiResponse: AIResponse,
    context: TicketContext
  ): Promise<string | null> {
    // If the AI doesn't indicate it needs human help, continue with automated response
    if (!aiResponse.needs_human) {
      return null;
    }

    try {
      console.log("Creating ticket based on AI response:", JSON.stringify(aiResponse));

      const ticketType = aiResponse.intent || "SUPPORT";
      const priority = aiResponse.priority || "LOW";
      const confidenceScore = aiResponse.confidence || 0.5;

      // Create a ticket
      const ticket = await createTicket(
        {
          title: `${ticketType} Request from ${context.userName}`,
          body: context.messageContent,
          customerName: context.userName,
          platform: context.platform,
          type: ticketType,
          status: "New",
          conversationId: context.conversationId,
          intentType: ticketType,
          escalationReason: aiResponse.escalation_reason || "AI requested human assistance",
          priority: priority,
          context: context.knowledgeBase || "",
          confidenceScore: confidenceScore,
          productInfo: aiResponse.product_info
        },
        context.userId // Pass user_id to ticket creation
      );

      // Link the message to the ticket
      await linkMessageToTicket(ticket.id, context.messageId);

      console.log(`Ticket created with ID: ${ticket.id}`);

      // Return a response to send back to the user
      return `I've created a support ticket (#${ticket.id}) for you. One of our human agents will get back to you as soon as possible.`;
    } catch (error) {
      console.error("Error handling ticket creation:", error);
      return "I tried to create a ticket for you, but there was an error. Please try again later or contact our support team directly.";
    }
  }
}
