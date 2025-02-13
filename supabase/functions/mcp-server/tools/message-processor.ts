
import { IntentAnalysis, TicketCreationInfo } from "../types/intent.ts";
import { IntentDetectionService } from "../services/intentDetectionService.ts";
import { initSupabase, logger } from "../utils.ts";

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
}> {
  logger.info('Processing message:', params);

  const analysis = IntentDetectionService.analyzeIntent(
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

  return { analysis, ticketInfo };
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
