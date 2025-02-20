
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { storeConversation, storeAIResponse } from './database.ts';
import { processIntent } from './services/intent-processor.ts';
import { generateAIResponse } from './ai-settings.ts';
import { logMessageOperations } from './utils/logger.ts';

export async function processMessageBatch(
  supabase: any,
  messages: { 
    userId: string; 
    userName: string; 
    userMessage: string; 
    platform: 'whatsapp' | 'facebook' | 'instagram' 
  }[]
) {
  try {
    for (const message of messages) {
      console.log('Processing message:', message);

      // Store conversation and get conversation ID
      const conversationId = await storeConversation(
        supabase,
        message.userId,
        message.userName,
        message.userMessage,
        message.platform
      );

      // Get conversation settings with strict error handling
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('ai_enabled')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error fetching conversation:', convError);
        throw new Error(`Failed to fetch conversation settings: ${convError.message}`);
      }

      if (conversation === null) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // Store the user message regardless of AI state
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: message.userMessage,
          status: 'received',
          sender_name: message.userName,
          sender_number: message.userId,
          read: false
        });

      if (msgError) {
        console.error('Error storing user message:', msgError);
        throw msgError;
      }

      // Explicit boolean check for ai_enabled
      const isAIEnabled = Boolean(conversation.ai_enabled);
      console.log('Conversation AI enabled state:', isAIEnabled);

      if (isAIEnabled === true) {
        console.log('AI is enabled for this conversation, generating response...');
        try {
          const intent = await processIntent(message.userMessage);
          const aiResponse = await generateAIResponse(
            message.userMessage,
            message.userName,
            intent
          );

          if (aiResponse) {
            await storeAIResponse(supabase, conversationId, aiResponse);
            console.log('AI response stored successfully');
          }
        } catch (aiError) {
          console.error('Error generating AI response:', aiError);
          throw new Error(`AI processing failed: ${aiError.message}`);
        }
      } else {
        console.log('AI is disabled for this conversation, skipping AI processing');
      }

      await logMessageOperations(supabase, {
        conversationId,
        messageContent: message.userMessage,
        senderName: message.userName,
        aiEnabled: isAIEnabled
      });
    }
  } catch (error) {
    console.error('Error in processMessageBatch:', error);
    throw error;
  }
}
