
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { storeConversation } from "./database.ts";
import { generateAIResponse } from "./ollama.ts";
import { MessageBatcherService } from "./services/message-batcher.ts";
import { getAISettings } from "./ai-settings.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processMessageBatch(
  whatsappMessageId: string,
  batchedMessage: string,
  userId: string,
  userName: string
): Promise<void> {
  try {
    const conversationId = await storeConversation(
      supabase,
      userId,
      userName,
      batchedMessage,
      'whatsapp'
    );

    const { data: conversation } = await supabase
      .from('conversations')
      .select('ai_enabled')
      .eq('id', conversationId)
      .single();

    if (conversation?.ai_enabled) {
      const aiSettings = await getAISettings();
      console.log('Using AI settings:', aiSettings);

      const aiResponse = await generateAIResponse(batchedMessage, {
        messageId: whatsappMessageId,
        conversationId: conversationId,
        userName: userName,
        knowledgeBase: ''
      }, aiSettings);

      // Store AI response in database
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        content: aiResponse,
        sender_name: 'AI Assistant',
        sender_number: 'system',
        status: 'sent',
      });
    }
  } catch (error) {
    console.error('Error processing batched message:', error);
    throw error;
  }
}

export async function processWhatsAppMessage(
  whatsappMessageId: string,
  userMessage: string,
  userId: string,
  userName: string
): Promise<void> {
  console.log('Processing WhatsApp message:', { whatsappMessageId, userMessage, userId, userName });

  try {
    await MessageBatcherService.processBatchedMessage(
      userId,
      userMessage,
      async (batchedMessage) => {
        await processMessageBatch(whatsappMessageId, batchedMessage, userId, userName);
      }
    );

    const batchSize = MessageBatcherService.getCurrentBatchSize(userId);
    console.log(`Current batch size for user ${userId}: ${batchSize}`);
  } catch (error) {
    console.error('Error in message processing:', error);
    throw error;
  }
}
