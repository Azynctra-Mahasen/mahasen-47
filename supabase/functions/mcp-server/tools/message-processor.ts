
import { IntentAnalysis, TicketCreationInfo } from "../types/intent.ts";
import { IntentDetectionService } from "../services/intentDetectionService.ts";
import { initSupabase, logger } from "../utils.ts";
import { ContextManager } from "../services/contextManager.ts";
import { PromptManager } from "../services/promptManager.ts";
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

  // Get conversation context
  const conversationContext = await ContextManager.getConversationContext(params.conversationId);
  
  // Get knowledge base context
  const knowledgeBaseContext = await ContextManager.getKnowledgeBaseContext(params.message);

  // Get AI settings
  const { data: aiSettings } = await initSupabase()
    .from('ai_settings')
    .select('*')
    .single();

  if (!aiSettings) {
    throw new Error('AI settings not found');
  }

  // Generate prompt
  const prompt = PromptManager.generatePrompt(
    params.message,
    conversationContext,
    knowledgeBaseContext,
    {
      tone: aiSettings.tone,
      behaviour: aiSettings.behaviour
    }
  );

  // Analyze intent with enhanced context
  const analysis = await IntentDetectionService.analyzeIntent(
    params.message,
    prompt,
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

  // Update order state if this is an order-related intent
  if (analysis.intent === 'ORDER_PLACEMENT' && analysis.detected_entities.order_info) {
    await ContextManager.updateOrderState(
      params.conversationId,
      analysis.detected_entities.order_info
    );
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
