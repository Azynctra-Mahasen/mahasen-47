
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
  console.log('Starting message processing:', {
    whatsappMessageId,
    userMessage,
    userId,
    userName
  });

  try {
    // Handle pending order confirmation first
    const orderHandled = await OrderProcessor.handlePendingOrderConfirmation({
      messageId: whatsappMessageId,
      userId,
      userName,
      whatsappMessageId,
      userMessage
    });

    if (orderHandled) {
      return;
    }

    // Get or create conversation
    const conversationId = await ConversationService.getOrCreateConversation(userId, userName);

    // Store the user's message
    const messageData = await ConversationService.storeMessage(
      conversationId,
      userMessage,
      userName,
      userId,
      whatsappMessageId
    );

    // Get AI settings and generate response
    const aiSettings = await getAISettings();
    const conversationHistory = await ConversationService.getRecentConversationHistory(
      userId,
      aiSettings.context_memory_length
    );

    const context = {
      userName,
      messageId: messageData.id,
      conversationId,
      knowledgeBase: conversationHistory,
      userMessage,
      platform: 'whatsapp' as const
    };

    const aiResponse = await generateAIResponse(userMessage, context, aiSettings);
    const responseText = extractResponseText(aiResponse);

    // If this is an order placement showing summary, store the context
    if (isOrderSummary(aiResponse)) {
      console.log('Storing pending order:', aiResponse.detected_entities.order_info);
      await OrderProcessor.storePendingOrder(
        userId,
        aiResponse.detected_entities.order_info
      );
    }

    // Send WhatsApp response
    await sendWhatsAppMessage(
      userId,
      responseText,
      Deno.env.get('WHATSAPP_ACCESS_TOKEN')!,
      Deno.env.get('WHATSAPP_PHONE_ID')!
    );

    // Store the conversation
    await storeConversation(supabase, userId, userName, userMessage, responseText);

  } catch (error) {
    console.error('Error in message processing:', error);
    
    try {
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
    } catch (logError) {
      console.error('Error logging to webhook_errors:', logError);
    }
    
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
