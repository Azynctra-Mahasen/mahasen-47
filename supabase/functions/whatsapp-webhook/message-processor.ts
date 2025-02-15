
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';
import { getAISettings } from './ai-settings.ts';
import { extractResponseText } from './utils/aiResponseFormatter.ts';
import { OrderProcessor } from './services/order-processor.ts';
import { ConversationService } from './services/conversation-service.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function processWhatsAppMessage(
  whatsappMessageId: string,
  userMessage: string,
  userId: string,
  userName: string
): Promise<void> {
  console.log('Processing message:', { whatsappMessageId, userMessage, userId, userName });

  try {
    // Check for pending order confirmation first
    const orderHandled = await OrderProcessor.handlePendingOrderConfirmation({
      messageId: whatsappMessageId,
      userId,
      userName,
      whatsappMessageId,
      userMessage
    });

    if (orderHandled) {
      console.log('Order confirmation handled successfully');
      return;
    }

    // Continue with normal message processing
    const conversationId = await ConversationService.getOrCreateConversation(userId, userName);
    const messageData = await ConversationService.storeMessage(
      conversationId,
      userMessage,
      userName,
      userId,
      whatsappMessageId
    );

    const aiSettings = await getAISettings();
    const conversationHistory = await ConversationService.getRecentConversationHistory(
      userId,
      aiSettings.context_memory_length
    );

    const aiResponse = await generateAIResponse(userMessage, {
      userName,
      messageId: messageData.id,
      conversationId,
      knowledgeBase: conversationHistory,
      userMessage,
      platform: 'whatsapp' as const
    }, aiSettings);

    const responseText = extractResponseText(aiResponse);

    // Store pending order if this is an order summary
    if (isOrderSummary(aiResponse)) {
      console.log('Detected order summary, storing pending order:', 
        aiResponse.detected_entities.order_info
      );
      await OrderProcessor.storePendingOrder(
        userId,
        aiResponse.detected_entities.order_info
      );
    }

    // Send response
    await sendWhatsAppMessage(
      userId,
      responseText,
      Deno.env.get('WHATSAPP_ACCESS_TOKEN')!,
      Deno.env.get('WHATSAPP_PHONE_ID')!
    );

    // Store conversation
    await storeConversation(supabase, userId, userName, userMessage, responseText);

  } catch (error) {
    console.error('Error processing message:', error);
    await supabase.from('webhook_errors').insert({
      error_type: 'WHATSAPP_WEBHOOK_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: {
        whatsappMessageId,
        userId,
        userName,
        timestamp: new Date().toISOString()
      }
    });
    throw error;
  }
}

function isOrderSummary(aiResponse: any): boolean {
  return (
    aiResponse.intent === 'ORDER_PLACEMENT' &&
    aiResponse.detected_entities?.order_info?.state === 'CONFIRMING' &&
    !aiResponse.detected_entities?.order_info?.confirmed
  );
}
