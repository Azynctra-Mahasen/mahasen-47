
import { IntentAnalysis, TicketCreationInfo } from "../types/intent.ts";
import { IntentDetectionService } from "../services/intentDetectionService.ts";
import { initSupabase, logger } from "../utils.ts";
import { createTicket } from "./ticket-processor.ts";

export async function processMessage(params: {
  message: string;
  platform: string;
  messageId: string;
  conversationId: string;
  customerName: string;
  knowledgeBaseContext?: string;
  previousMessages?: string[];
}): Promise<{
  analysis: IntentAnalysis;
  ticketInfo: TicketCreationInfo | null;
  ticketId?: number;
}> {
  logger.info('Processing message:', params);

  const analysis = await IntentDetectionService.analyzeIntent(
    params.message,
    params.knowledgeBaseContext,
    params.previousMessages
  );

  const ticketInfo = analysis.requires_escalation ? 
    IntentDetectionService.generateTicketInfo(
      analysis,
      params.messageId,
      params.conversationId
    ) : null;

  // Create ticket if needed
  let ticketId: number | undefined;
  if (ticketInfo?.create_ticket) {
    const ticketResult = await createTicket({
      title: `Support Request: ${analysis.detected_entities.issue_type || 'General'}`,
      customerName: params.customerName,
      platform: params.platform,
      type: ticketInfo.ticket_type,
      priority: ticketInfo.priority,
      body: params.message,
      messageId: params.messageId,
      conversationId: params.conversationId,
      intentType: analysis.intent,
      context: ticketInfo.context,
      confidenceScore: analysis.confidence,
      escalationReason: analysis.escalation_reason
    });

    if (ticketResult.success) {
      ticketId = ticketResult.ticketId;
    }
  }

  return { analysis, ticketInfo, ticketId };
}

export async function sendResponse(params: {
  platform: string;
  message: string;
  recipientId: string;
  messageType?: string;
}): Promise<boolean> {
  const supabase = initSupabase();
  logger.info('Sending response:', params);

  try {
    const { error } = await supabase.functions.invoke(`send-${params.platform}`, {
      body: {
        message: params.message,
        recipientId: params.recipientId,
        type: params.messageType || 'text'
      }
    });

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error sending response:', error);
    return false;
  }
}
