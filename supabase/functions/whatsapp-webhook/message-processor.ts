
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

      // Get conversation settings including AI state
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('ai_enabled')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error fetching conversation:', convError);
        throw convError;
      }

      console.log('Conversation AI enabled state:', conversation.ai_enabled);

      // Only process AI response if ai_enabled is true
      if (conversation.ai_enabled === true) {
        console.log('AI is enabled for this conversation, generating response...');
        
        // Process intent
        const intent = await processIntent(message.userMessage);
        
        // Generate AI response
        const aiResponse = await generateAIResponse(
          message.userMessage,
          message.userName,
          intent
        );

        // Store AI response
        if (aiResponse) {
          await storeAIResponse(supabase, conversationId, aiResponse);
          console.log('AI response stored successfully');
        }
      } else {
        console.log('AI is disabled for this conversation, skipping AI processing');
      }

      // Log message operation
      await logMessageOperations(supabase, {
        conversationId,
        messageContent: message.userMessage,
        senderName: message.userName,
        aiEnabled: conversation.ai_enabled
      });
    }
  } catch (error) {
    console.error('Error in processMessageBatch:', error);
    throw error;
  }
}
