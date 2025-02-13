import { IntentAnalysis, UrgencyLevel, TicketCreationInfo } from "../types/intent.ts";
import { initSupabase, logger } from "../utils.ts";
import { IntentDetectionService } from "../services/intentDetectionService.ts";
import { createTicket, updateTicketProduct } from "./ticket-processor.ts";

export async function analyzeIntent(params: {
  message: string;
  context?: string;
  previousMessages?: string[];
}): Promise<IntentAnalysis> {
  const supabase = initSupabase();
  logger.info('Analyzing intent:', params);

  try {
    // First, try to match with knowledge base
    const { data: kbMatches, error: kbError } = await supabase.rpc('match_knowledge_base', {
      query_text: params.message,
      match_count: 3,
      match_threshold: 0.7
    });

    if (kbError) throw kbError;

    // Enhance context with knowledge base matches
    const enhancedContext = kbMatches?.length > 0 
      ? `${params.context || ''}\nRelevant knowledge base entries:\n${
          kbMatches.map((m: any) => m.content).join('\n')
        }`
      : params.context;

    // Perform intent analysis with enhanced context
    const intent = await detectIntent({
      message: params.message,
      context: enhancedContext,
      previousMessages: params.previousMessages
    });

    return intent;
  } catch (error) {
    logger.error('Error analyzing intent:', error);
    throw error;
  }
}

export async function detectIntent(params: {
  message: string;
  context?: string;
  previousMessages?: string[];
}): Promise<IntentAnalysis> {
  // Implement intent detection logic using imported service
  const analysis = await IntentDetectionService.analyzeIntent(
    params.message,
    params.context,
    params.previousMessages
  );

  return analysis;
}

export async function evaluateEscalation(params: {
  intent: IntentAnalysis;
  urgencyLevel: UrgencyLevel;
  messageCount: number;
}): Promise<{ 
  requiresEscalation: boolean; 
  reason: string | null;
}> {
  logger.info('Evaluating escalation:', params);

  // Automatic escalation conditions
  if (params.intent.intent === 'HUMAN_AGENT_REQUEST') {
    return {
      requiresEscalation: true,
      reason: 'Customer explicitly requested human agent'
    };
  }

  if (params.urgencyLevel === 'high') {
    return {
      requiresEscalation: true,
      reason: 'High urgency request requires immediate attention'
    };
  }

  if (params.messageCount > 5 && params.intent.confidence < 0.7) {
    return {
      requiresEscalation: true,
      reason: 'Multiple messages with low confidence responses'
    };
  }

  return {
    requiresEscalation: false,
    reason: null
  };
}

export async function processOrder(params: {
  message: string;
  customerName: string;
  platform: string;
  messageId: string;
  conversationId: string;
}): Promise<{
  orderCreated: boolean;
  orderId?: number;
  errorMessage?: string;
}> {
  logger.info('Processing order:', params);

  try {
    // Extract order details from message
    const orderInfo = extractOrderInfo(params.message);
    
    if (!orderInfo.isValid) {
      return {
        orderCreated: false,
        errorMessage: 'Missing required order information'
      };
    }

    // Create ticket for the order using the new createTicket function
    const ticketResult = await createTicket({
      title: `Order: ${orderInfo.productName}`,
      customerName: params.customerName,
      platform: params.platform,
      type: 'ORDER',
      priority: 'HIGH',
      body: `Product: ${orderInfo.productName}\nQuantity: ${orderInfo.quantity}`,
      messageId: params.messageId,
      conversationId: params.conversationId,
      intentType: 'ORDER_PLACEMENT',
      productInfo: {
        name: orderInfo.productName,
        quantity: orderInfo.quantity
      }
    });

    if (!ticketResult.success) {
      throw new Error(ticketResult.error);
    }

    return {
      orderCreated: true,
      orderId: ticketResult.ticketId
    };
  } catch (error) {
    logger.error('Error processing order:', error);
    return {
      orderCreated: false,
      errorMessage: 'Failed to create order'
    };
  }
}

function extractOrderInfo(message: string): {
  isValid: boolean;
  productName?: string;
  quantity?: number;
} {
  // Implement logic to extract product name and quantity from message
  // This is a placeholder implementation
  const productMatch = message.match(/(?:order|buy|get|want)\s+(\d+)\s+(.+?)(?:\s|$)/i);
  
  if (!productMatch) return { isValid: false };

  return {
    isValid: true,
    quantity: parseInt(productMatch[1]),
    productName: productMatch[2].trim()
  };
}
