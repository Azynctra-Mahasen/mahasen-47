
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { UserContext } from './auth-handler.ts';
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { OrderProcessor } from './services/order-processor.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Process WhatsApp webhook messages
 * @param payload The webhook payload from WhatsApp
 * @param userContext The authenticated user context
 */
export async function processMessage(payload: any, userContext: UserContext) {
  try {
    // Validate payload
    if (!payload || payload.messaging_product !== 'whatsapp') {
      console.log('Not a WhatsApp message or invalid payload');
      return;
    }
    
    const messages = payload.messages || [];
    
    if (messages.length === 0) {
      console.log('No messages in the payload');
      return;
    }
    
    // Ensure we have a valid user ID from context
    if (!userContext.userId) {
      console.error('No userId provided in userContext, cannot process message');
      return;
    }

    console.log(`Processing messages for user ${userContext.userId} with whatsapp phone id ${userContext.whatsappPhoneId}`);
    
    // Process each message in the payload
    for (const message of messages) {
      await handleMessage(message, payload, userContext);
    }
  } catch (error) {
    console.error('Error processing webhook message:', error);
    throw error;
  }
}

/**
 * Handle a single WhatsApp message
 * @param message The message object
 * @param value The value object from the webhook payload
 * @param userContext The authenticated user context
 */
async function handleMessage(message: any, value: any, userContext: UserContext) {
  try {
    // Basic message validation
    if (!message.from || !message.id || !message.type) {
      console.error('Invalid message format:', message);
      return;
    }
    
    // Check for duplicates to avoid processing the same message twice
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('whatsapp_message_id', message.id)
      .eq('user_id', userContext.userId)
      .single();
    
    if (existingMessage) {
      console.log(`Message ${message.id} already processed, skipping`);
      return;
    }
    
    // Get contact information
    const contact = value.contacts?.[0] || {};
    const contactName = contact.profile?.name || 'Unknown';
    const contactNumber = message.from;
    
    // Get or create conversation
    let conversationId = await getOrCreateConversation(
      userContext.userId,
      contactName,
      contactNumber
    );
    
    // Save the incoming message to the database
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        user_id: userContext.userId,
        conversation_id: conversationId,
        sender_name: contactName,
        sender_number: contactNumber,
        content: extractMessageContent(message),
        status: 'received',
        whatsapp_message_id: message.id
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Error saving message to database:', saveError);
      return;
    }
    
    console.log(`Saved incoming message: ${savedMessage.id} for user: ${userContext.userId}`);

    // Check if this is an order confirmation message
    const isOrderConfirmation = await OrderProcessor.handlePendingOrderConfirmation({
      messageId: savedMessage.id,
      userId: userContext.userId,
      userName: contactName,
      whatsappMessageId: message.id,
      userMessage: extractMessageContent(message)
    });

    // If the message was handled as an order confirmation, don't process it further
    if (isOrderConfirmation) {
      console.log('Message handled as order confirmation, skipping AI processing');
      return;
    }
    
    // Get AI settings for the user
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();
    
    // Check if the conversation has AI enabled
    const { data: conversation } = await supabase
      .from('conversations')
      .select('ai_enabled')
      .eq('id', conversationId)
      .single();
    
    // Generate and send AI response if enabled
    if (conversation?.ai_enabled) {
      try {
        // Get context for AI generation
        const messageHistory = await getConversationHistory(conversationId);
        
        const context = {
          userId: userContext.userId,
          messageId: savedMessage.id,
          conversationId: conversationId,
          userName: contactName,
          messageHistory: messageHistory,
          whatsappPhoneId: userContext.whatsappPhoneId
        };
        
        console.log(`Generating AI response with context for user: ${userContext.userId}`);
        
        // Generate AI response
        const aiResponse = await generateAIResponse(
          extractMessageContent(message),
          context,
          aiSettings
        );
        
        if (aiResponse) {
          // Send the AI response back to the user
          await sendResponse(
            contactNumber,
            aiResponse,
            conversationId,
            contactName,
            userContext
          );
        }
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
    throw error;
  }
}

/**
 * Extract content from different message types
 * @param message The message object
 */
function extractMessageContent(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text?.body || '';
    case 'image':
      return '[Image message]';
    case 'audio':
      return '[Audio message]';
    case 'video':
      return '[Video message]';
    case 'document':
      return '[Document message]';
    case 'location':
      return '[Location message]';
    case 'contacts':
      return '[Contacts message]';
    case 'button':
      return message.button?.text || '[Button message]';
    case 'interactive':
      return message.interactive?.button_reply?.title || '[Interactive message]';
    default:
      return '[Unsupported message type]';
  }
}

/**
 * Get or create a conversation for a contact
 * @param userId The user ID
 * @param contactName The contact name
 * @param contactNumber The contact number
 */
async function getOrCreateConversation(
  userId: string,
  contactName: string,
  contactNumber: string
): Promise<string> {
  try {
    console.log(`Getting or creating conversation for user ${userId} and contact ${contactNumber}`);
    
    // Check if conversation exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_number', contactNumber)
      .single();
    
    if (existingConversation) {
      console.log(`Found existing conversation: ${existingConversation.id}`);
      return existingConversation.id;
    }
    
    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        contact_name: contactName,
        contact_number: contactNumber,
        platform: 'whatsapp',
        ai_enabled: true, // Default to AI enabled
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
    
    console.log(`Created new conversation: ${newConversation.id}`);
    return newConversation.id;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    throw error;
  }
}

/**
 * Get conversation history for context
 * @param conversationId The conversation ID
 */
async function getConversationHistory(conversationId: string): Promise<any[]> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('content, sender_name, sender_number, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
  
  return messages.reverse();
}

/**
 * Send response back to the user
 * @param to Recipient phone number
 * @param content Message content
 * @param conversationId Conversation ID
 * @param recipientName Recipient name
 * @param userContext User context with credentials
 */
async function sendResponse(
  to: string,
  content: string,
  conversationId: string,
  recipientName: string,
  userContext: UserContext
) {
  try {
    // Save outgoing message to database
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        user_id: userContext.userId,
        conversation_id: conversationId,
        sender_name: 'AI Assistant',
        sender_number: userContext.whatsappPhoneId,
        content: content,
        status: 'sent',
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Error saving outgoing message:', saveError);
      return;
    }
    
    // Send message via WhatsApp API
    await sendWhatsAppMessage(
      to,
      content,
      userContext.whatsappPhoneId,
      userContext.whatsappAccessToken
    );
    
    // Update message status
    await supabase
      .from('messages')
      .update({ status: 'delivered' })
      .eq('id', savedMessage.id);
    
    console.log(`Sent response to ${to}`);
  } catch (error) {
    console.error('Error sending response:', error);
    throw error;
  }
}
