
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { storeConversation } from "./database.ts";
import { generateAIResponse } from "./ollama.ts";
import { MessageBatcherService } from "./services/message-batcher.ts";
import { getAISettings } from "./ai-settings.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getMessengerSettings() {
  const { data, error } = await supabase
    .from('messenger_settings')
    .select('access_token, page_id')
    .single();

  if (error) {
    console.error('Error fetching messenger settings:', error);
    return null;
  }

  return data;
}

async function processMessageBatch(
  whatsappMessageId: string,
  batchedMessage: string,
  userId: string,
  userName: string
): Promise<void> {
  try {
    // Store conversation and get AI response
    const conversationId = await storeConversation(
      supabase,
      userId,
      userName,
      batchedMessage,
      'facebook'
    );

    // Check if AI is enabled for this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('ai_enabled')
      .eq('id', conversationId)
      .single();

    if (conversation?.ai_enabled) {
      // Fetch AI settings before generating response
      const aiSettings = await getAISettings();
      console.log('Using AI settings:', aiSettings);

      // Get messenger settings
      const messengerSettings = await getMessengerSettings();
      
      if (!messengerSettings) {
        console.error('No messenger settings found');
        // Store error message in database
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: "Sorry, there was an error processing your message. Please try again later.",
          sender_name: 'System',
          sender_number: 'system',
          status: 'sent',
        });
        return;
      }

      const aiResponse = await generateAIResponse(batchedMessage, {
        messageId: whatsappMessageId,
        conversationId: conversationId,
        userName: userName,
        knowledgeBase: ''
      }, aiSettings);

      await sendFacebookMessage(userId, aiResponse, messengerSettings.access_token);
      
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
    // Use the MessageBatcherService to handle message batching
    await MessageBatcherService.processBatchedMessage(
      userId,
      userMessage,
      async (batchedMessage) => {
        await processMessageBatch(whatsappMessageId, batchedMessage, userId, userName);
      }
    );

    // Log batch status
    const batchSize = MessageBatcherService.getCurrentBatchSize(userId);
    console.log(`Current batch size for user ${userId}: ${batchSize}`);
    
  } catch (error) {
    console.error('Error in message processing:', error);
    throw error;
  }
}

async function fetchUserProfile(userId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/${userId}?fields=name&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  return await response.json();
}

async function sendFacebookMessage(recipientId: string, message: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send message: ${JSON.stringify(error)}`);
  }

  return await response.json();
}
