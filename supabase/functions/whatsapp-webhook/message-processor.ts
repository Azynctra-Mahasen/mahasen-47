
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';
import { getAISettings } from './ai-settings.ts';
import { extractResponseText } from './utils/aiResponseFormatter.ts';
import { TicketHandler } from './services/ticket-handler.ts';

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
    // Check for pending order confirmation first
    const { data: pendingOrder } = await supabase
      .from('conversation_contexts')
      .select('*')
      .eq('conversation_id', userId)
      .eq('context_type', 'pending_order')
      .single();

    // If there's a pending order and user confirms
    if (pendingOrder && isConfirmationMessage(userMessage)) {
      console.log('Processing order confirmation for pending order:', pendingOrder);
      
      const orderInfo = JSON.parse(pendingOrder.context);
      const ticketResponse = await TicketHandler.handleTicketCreation(
        {
          intent: 'ORDER_PLACEMENT',
          confidence: 1,
          requires_escalation: false,
          escalation_reason: null,
          detected_entities: {
            product_mentions: [orderInfo.product],
            issue_type: null,
            urgency_level: 'medium',
            order_info: {
              product: orderInfo.product,
              quantity: orderInfo.quantity,
              state: 'PROCESSING',
              confirmed: true
            }
          }
        },
        {
          messageId: whatsappMessageId,
          conversationId: userId,
          userName,
          platform: 'whatsapp',
          messageContent: userMessage
        }
      );

      // Clear the pending order context
      await supabase
        .from('conversation_contexts')
        .delete()
        .eq('id', pendingOrder.id);

      // Send the ticket response
      if (ticketResponse) {
        await sendWhatsAppMessage(
          userId,
          ticketResponse,
          Deno.env.get('WHATSAPP_ACCESS_TOKEN')!,
          Deno.env.get('WHATSAPP_PHONE_ID')!
        );
        return;
      }
    }

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

    // Store the user's message
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

    // Get AI settings and generate response
    const aiSettings = await getAISettings();
    const conversationHistory = await getRecentConversationHistory(userId, aiSettings);

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
      await supabase
        .from('conversation_contexts')
        .insert({
          conversation_id: userId,
          context_type: 'pending_order',
          context: JSON.stringify(aiResponse.detected_entities.order_info)
        });
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

function isConfirmationMessage(message: string): boolean {
  const confirmationWords = ['yes', 'ow', 'ඔව්'];
  return confirmationWords.includes(message.toLowerCase().trim());
}

function isOrderSummary(aiResponse: any): boolean {
  return (
    aiResponse.intent === 'ORDER_PLACEMENT' &&
    aiResponse.detected_entities?.order_info?.state === 'CONFIRMING' &&
    !aiResponse.detected_entities?.order_info?.confirmed
  );
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
