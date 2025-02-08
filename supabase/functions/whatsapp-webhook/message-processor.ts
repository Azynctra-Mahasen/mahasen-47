
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';
import { getAISettings } from './ai-settings.ts';
import { extractResponseText } from './utils/aiResponseFormatter.ts';

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
    // Get conversation ID first
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_number", userId)
      .single();

    if (convError && convError.code !== 'PGRST116') {
      console.error('Error fetching conversation:', convError);
      throw convError;
    }

    let conversationId;
    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({
          contact_number: userId,
          contact_name: userName,
          platform: 'whatsapp'
        })
        .select()
        .single();

      if (createError) throw createError;
      conversationId = newConv.id;
    } else {
      conversationId = conversation.id;
    }

    console.log('Found/created conversation:', conversationId);

    // Check if message with this WhatsApp ID already exists
    const { data: existingMessage } = await supabase
      .from("messages")
      .select("id")
      .eq("whatsapp_message_id", whatsappMessageId)
      .single();

    if (existingMessage) {
      console.log('Message already exists, skipping processing:', whatsappMessageId);
      return;
    }

    // Create a message record for the user's message
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content: userMessage,
        sender_name: userName,
        sender_number: userId,
        status: 'received',
        whatsapp_message_id: whatsappMessageId
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      throw messageError;
    }

    // Fetch AI settings and conversation history
    const aiSettings = await getAISettings();
    const conversationHistory = await getRecentConversationHistory(userId, aiSettings);

    // Create context object with all required fields
    const context = {
      userName,
      messageId: messageData.id,
      conversationId,
      knowledgeBase: conversationHistory,
      userMessage,
      platform: 'whatsapp' as const
    };

    console.log('Prepared context for AI response:', context);

    // Generate AI response
    const aiResponse = await generateAIResponse(userMessage, context, aiSettings);
    console.log('Generated AI response:', aiResponse);

    // Extract only the response text from the AI response
    const responseText = extractResponseText(aiResponse);
    console.log('Extracted response text:', responseText);

    // Send WhatsApp response
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')!;
    await sendWhatsAppMessage(userId, responseText, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID);

    // Store only the AI response
    await storeConversation(supabase, userId, userName, userMessage, responseText);

  } catch (error) {
    console.error('Error in message processing:', error);
    
    // Log error to webhook_errors table
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

async function getRecentConversationHistory(userId: string, aiSettings: any): Promise<string> {
  try {
    console.log('Fetching conversation history for user:', userId);
    
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_number", userId)
      .single();

    if (!conversation) {
      console.log('No existing conversation found for user');
      return '';
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("content, sender_name, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(aiSettings.context_memory_length || 2);

    if (error) {
      console.error('Error fetching conversation history:', error);
      return '';
    }

    if (!messages || messages.length === 0) {
      console.log('No message history found');
      return '';
    }

    const formattedHistory = messages
      .reverse()
      .map(msg => `${msg.sender_name}: ${msg.content}`)
      .join('\n');

    console.log('Retrieved conversation history:', formattedHistory);
    return formattedHistory;
  } catch (error) {
    console.error('Error in getRecentConversationHistory:', error);
    return '';
  }
}
