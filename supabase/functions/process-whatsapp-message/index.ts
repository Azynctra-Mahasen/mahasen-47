
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { payload, userId, phoneNumberId } = await req.json();
    
    if (!payload || !userId || !phoneNumberId) {
      throw new Error('Missing required parameters: payload, userId, or phoneNumberId');
    }

    console.log(`Processing message for user: ${userId} with phone ID: ${phoneNumberId}`);

    // Extract user secrets for this specific user
    const { data: userSecrets, error: secretsError } = await supabase
      .from('platform_secrets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (secretsError || !userSecrets) {
      throw new Error(`Failed to retrieve user secrets: ${secretsError?.message || 'User secrets not found'}`);
    }

    // Extract AI settings for this specific user
    const { data: aiSettings, error: aiError } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (aiError) {
      console.warn(`Warning: Could not get AI settings: ${aiError.message}. Using defaults.`);
    }

    // Process the incoming message
    if (isWhatsAppMessage(payload)) {
      const messages = extractMessages(payload);
      
      for (const message of messages) {
        await processMessage(message, userId, userSecrets, aiSettings, supabase);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in process-whatsapp-message:', err);
    
    // Log detailed error information
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const errorLoggingClient = createClient(supabaseUrl, supabaseKey);
    
    await errorLoggingClient
      .from('webhook_errors')
      .insert({
        error_type: 'Process WhatsApp Message Error',
        message: err.message,
        details: {
          stack: err.stack
        }
      });
    
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to check if payload is a WhatsApp message
function isWhatsAppMessage(payload: any): boolean {
  return (
    payload.object === 'whatsapp_business_account' &&
    payload.entry &&
    Array.isArray(payload.entry) &&
    payload.entry.length > 0 &&
    payload.entry[0].changes &&
    Array.isArray(payload.entry[0].changes) &&
    payload.entry[0].changes.length > 0 &&
    payload.entry[0].changes[0].value &&
    payload.entry[0].changes[0].value.messages
  );
}

// Extract messages from WhatsApp payload
function extractMessages(payload: any): any[] {
  return payload.entry[0].changes[0].value.messages || [];
}

// Process each message
async function processMessage(
  message: any,
  userId: string,
  userSecrets: any,
  aiSettings: any,
  supabase: any
) {
  const messageType = message.type;
  const contactInfo = extractContactInfo(message, userId);
  
  if (!contactInfo) {
    throw new Error('Failed to extract contact information');
  }

  // Store message in database
  const { data: savedMessage, error: messageError } = await saveMessage(
    message,
    contactInfo,
    userId,
    supabase
  );

  if (messageError) {
    throw new Error(`Failed to save message: ${messageError.message}`);
  }

  console.log(`Message saved with ID: ${savedMessage.id}`);

  // Process message with AI and generate response
  await generateAIResponse(
    savedMessage,
    contactInfo,
    userId,
    userSecrets,
    aiSettings,
    supabase
  );
}

// Extract contact information from the WhatsApp message
function extractContactInfo(message: any, userId: string): any {
  try {
    // This assumes the contact info is available in the message payload
    // Modify according to actual WhatsApp payload structure
    const metadata = message.metadata || {};
    const contact = message.from;
    const contactName = message.contact_name || 'Unknown';
    
    return {
      contact_number: contact,
      contact_name: contactName,
      user_id: userId
    };
  } catch (error) {
    console.error('Error extracting contact info:', error);
    return null;
  }
}

// Save the incoming message to the database
async function saveMessage(
  message: any,
  contactInfo: any,
  userId: string,
  supabase: any
) {
  // Check if a conversation already exists
  const { data: existingConvo, error: convoError } = await supabase
    .from('conversations')
    .select('id')
    .eq('contact_number', contactInfo.contact_number)
    .eq('user_id', userId)
    .maybeSingle();

  if (convoError) {
    throw new Error(`Error checking for existing conversation: ${convoError.message}`);
  }

  let conversationId;

  if (existingConvo) {
    // Use existing conversation
    conversationId = existingConvo.id;
  } else {
    // Create a new conversation
    const { data: newConvo, error: createError } = await supabase
      .from('conversations')
      .insert({
        contact_number: contactInfo.contact_number,
        contact_name: contactInfo.contact_name,
        platform: 'whatsapp',
        user_id: userId
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error creating conversation: ${createError.message}`);
    }

    conversationId = newConvo.id;
  }

  // Save the message
  return await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_number: contactInfo.contact_number,
      sender_name: contactInfo.contact_name,
      content: message.text?.body || '',
      status: 'received',
      whatsapp_message_id: message.id,
      metadata: {
        message_type: message.type,
        wa_message_data: message
      },
      user_id: userId
    })
    .select()
    .single();
}

// Generate AI response
async function generateAIResponse(
  savedMessage: any,
  contactInfo: any,
  userId: string,
  userSecrets: any,
  aiSettings: any,
  supabase: any
) {
  // Get AI settings or use defaults
  const modelName = aiSettings?.model_name || 'deepseek-r1-distill-llama-70b';
  const contextMemoryLength = aiSettings?.context_memory_length || 2;
  const tone = aiSettings?.tone || 'Professional';
  const behaviour = aiSettings?.behaviour || '';

  // Now this will get the correct user's products and knowledge base
  const { data: prevMessages, error: historyError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', savedMessage.conversation_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(contextMemoryLength * 2);  // Get more messages to account for back-and-forth

  if (historyError) {
    console.error('Error fetching message history:', historyError);
  }

  // Get relevant knowledge base matches for this user
  const { data: relevantKnowledge, error: kbError } = await supabase.rpc(
    'match_knowledge_base_and_products',
    {
      query_text: savedMessage.content,
      query_embedding: '{}',  // This is a placeholder, embedding is generated in the function
      user_id: userId,
      match_count: 5
    }
  );

  if (kbError) {
    console.error('Error fetching knowledge base:', kbError);
  }

  console.log(`Found relevant matches: ${JSON.stringify(relevantKnowledge || [], null, 2)}`);

  // Check for product order intent
  const productOrderRegex = /order|buy|purchase|get/i;
  const isProductOrder = productOrderRegex.test(savedMessage.content.toLowerCase());

  if (isProductOrder && relevantKnowledge?.some(item => item.source === 'product')) {
    // This is likely a product order
    await handleProductOrder(
      savedMessage,
      relevantKnowledge.filter(item => item.source === 'product'),
      contactInfo,
      userId,
      userSecrets,
      supabase
    );
  } else {
    // Regular message handling
    await handleRegularMessage(
      savedMessage,
      prevMessages || [],
      relevantKnowledge || [],
      contactInfo,
      userId,
      userSecrets,
      modelName,
      tone,
      behaviour,
      supabase
    );
  }
}

// Handle product order intent
async function handleProductOrder(
  message: any,
  productMatches: any[],
  contactInfo: any,
  userId: string,
  userSecrets: any,
  supabase: any
) {
  // Extract the most relevant product
  const topProduct = productMatches[0];
  
  if (!topProduct) {
    // No product found, send a response asking for clarification
    await sendWhatsAppReply(
      "I couldn't find the product you're looking for. Could you please specify which product you'd like to order?",
      contactInfo.contact_number,
      userSecrets,
      supabase
    );
    return;
  }

  // Check if we need quantity information
  const quantityRegex = /(\d+)\s*(item|piece|pc|pcs|product)/i;
  const quantityMatch = message.content.match(quantityRegex);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;

  if (!quantity) {
    // Ask for quantity
    await sendWhatsAppReply(
      `I found ${topProduct.metadata.title}. How many would you like to order?`,
      contactInfo.contact_number,
      userSecrets,
      supabase
    );
    return;
  }

  // Create order confirmation message
  const orderDetails = `Your Order for ${topProduct.metadata.title} for ${quantity} is:
- Product: ${topProduct.metadata.title}
- Price: $${topProduct.metadata.price} each
- Quantity: ${quantity}
- Total: $${(topProduct.metadata.price * quantity).toFixed(2)}
  
Type "Yes" or "Ow" or "ඔව්" to place the order.`;

  // Send confirmation request
  const { data: sentMessage, error: sendError } = await sendWhatsAppReply(
    orderDetails,
    contactInfo.contact_number,
    userSecrets,
    supabase
  );

  if (sendError) {
    console.error('Error sending order confirmation:', sendError);
    return;
  }

  // Store pending order information
  await supabase
    .from('messages')
    .update({
      order_info: {
        product_id: topProduct.id,
        product_title: topProduct.metadata.title,
        quantity: quantity,
        price: topProduct.metadata.price,
        total: topProduct.metadata.price * quantity,
        status: 'pending_confirmation',
        confirmation_message_id: sentMessage?.id
      }
    })
    .eq('id', message.id);
}

// Handle regular (non-order) messages
async function handleRegularMessage(
  message: any,
  prevMessages: any[],
  knowledgeMatches: any[],
  contactInfo: any,
  userId: string,
  userSecrets: any,
  modelName: string,
  tone: string,
  behaviour: string,
  supabase: any
) {
  // Check for confirmation message for pending orders
  const confirmationRegex = /^(yes|ow|ඔව්)$/i;
  
  if (confirmationRegex.test(message.content)) {
    // Check if there's a pending order
    const { data: pendingOrder, error: orderError } = await supabase
      .from('messages')
      .select('*, order_info')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', userId)
      .is('order_info', 'not.null')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!orderError && pendingOrder && pendingOrder.length > 0) {
      const latestPendingOrder = pendingOrder[0];
      
      if (latestPendingOrder.order_info?.status === 'pending_confirmation') {
        // Create a ticket for the order
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            title: `Order for ${latestPendingOrder.order_info.product_title}`,
            customer_name: contactInfo.contact_name,
            platform: 'whatsapp',
            type: 'ORDER',
            status: 'New',
            body: `Product Name: ${latestPendingOrder.order_info.product_title}\nQuantity: ${latestPendingOrder.order_info.quantity}`,
            priority: 'HIGH',
            conversation_id: message.conversation_id,
            product_info: latestPendingOrder.order_info,
            user_id: userId
          })
          .select()
          .single();

        if (ticketError) {
          console.error('Error creating order ticket:', ticketError);
          await sendWhatsAppReply(
            "Order failed. Please retry with correct Product & Quantity in a bit.",
            contactInfo.contact_number,
            userSecrets,
            supabase
          );
          return;
        }

        // Update the order status
        await supabase
          .from('messages')
          .update({
            order_info: {
              ...latestPendingOrder.order_info,
              status: 'confirmed',
              ticket_id: ticket.id
            }
          })
          .eq('id', latestPendingOrder.id);

        // Send confirmation
        await sendWhatsAppReply(
          `Your Order for ${latestPendingOrder.order_info.product_title} for ${latestPendingOrder.order_info.quantity} is placed successfully. Order Number is ${ticket.id}.`,
          contactInfo.contact_number,
          userSecrets,
          supabase
        );
        return;
      }
    }
  }
  
  // If not handling an order confirmation, generate AI response
  const contextForAI = {
    message: message.content,
    conversation_id: message.conversation_id,
    user_id: userId,
    knowledgeMatches: knowledgeMatches,
    prevMessages: prevMessages.map(msg => ({
      role: msg.status === 'sent' ? 'assistant' : 'user',
      content: msg.content
    })),
    aiSettings: {
      tone,
      behaviour,
      model: modelName
    }
  };

  // Call the AI generation function
  const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
    'generate-ai-response',
    {
      body: contextForAI
    }
  );

  if (aiError) {
    console.error('Error generating AI response:', aiError);
    await sendWhatsAppReply(
      "I'm sorry, I'm having trouble processing your message right now. Please try again later.",
      contactInfo.contact_number,
      userSecrets,
      supabase
    );
    return;
  }

  // Send the AI-generated response
  await sendWhatsAppReply(
    aiResponse.response,
    contactInfo.contact_number,
    userSecrets,
    supabase
  );
}

// Send WhatsApp reply using the whatsapp-send function
async function sendWhatsAppReply(
  message: string,
  to: string,
  userSecrets: any,
  supabase: any
) {
  return await supabase.functions.invoke(
    'send-whatsapp',
    {
      body: {
        to: to,
        message: message,
        type: "text",
        phoneId: userSecrets.whatsapp_phone_id,
        accessToken: userSecrets.whatsapp_access_token
      }
    }
  );
}
