
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const { 
      message, 
      conversation_id, 
      sender_number, 
      sender_name,
      message_id 
    } = await req.json();
    
    // Validate the required fields
    if (!message || !conversation_id || !sender_number) {
      throw new Error("Missing required fields");
    }

    // Find the conversation to get the user ID
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversation_id)
      .single();

    if (conversationError) {
      console.error("Error fetching conversation:", conversationError);
      throw conversationError;
    }

    const userId = conversationData.user_id;

    // Use user_id to get user's WhatsApp phone ID from platform_secrets
    const { data: userSecrets, error: secretsError } = await supabase
      .from('platform_secrets')
      .select('whatsapp_phone_id, whatsapp_access_token')
      .eq('user_id', userId)
      .single();

    if (secretsError) {
      console.error("Error fetching user secrets:", secretsError);
      throw secretsError;
    }

    const phoneNumberId = userSecrets.whatsapp_phone_id;
    const accessToken = userSecrets.whatsapp_access_token;
    
    if (!phoneNumberId || !accessToken) {
      throw new Error("Missing WhatsApp configuration");
    }
    
    console.log(`Processing message for user: ${userId} with phone ID: ${phoneNumberId}`);

    // Try to fetch knowledge base data with proper query embedding
    let relevantMatches = [];
    try {
      // Generate embedding for the incoming message
      const embeddingResponse = await fetch(`${supabaseUrl}/functions/v1/generate-file-embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ text: message }),
      });
      
      if (!embeddingResponse.ok) {
        throw new Error(`Failed to generate embedding: ${embeddingResponse.status}`);
      }
      
      const embeddingData = await embeddingResponse.json();
      
      // Make sure we have a valid embedding array
      if (embeddingData && embeddingData.embedding && Array.isArray(embeddingData.embedding)) {
        // Query for knowledge base matches using the embedding
        const { data: matchesData, error: matchesError } = await supabase.rpc(
          'match_knowledge_base_and_products',
          {
            query_text: message,
            query_embedding: embeddingData.embedding,
            user_id: userId,
            match_count: 5
          }
        );

        if (matchesError) {
          console.error("Error fetching knowledge base:", matchesError);
          throw matchesError;
        }

        relevantMatches = matchesData || [];
      } else {
        console.log("Invalid embedding format received:", embeddingData);
        relevantMatches = [];
      }
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      relevantMatches = [];
    }

    console.log("Found relevant matches:", relevantMatches);

    // Handle order creation if intent detected
    let orderIntent = false;
    let productName = "";
    let quantity = 0;
    
    // Simple intent detection (in a real scenario, use a more sophisticated approach)
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes("order") || 
      lowerMessage.includes("buy") || 
      lowerMessage.includes("purchase") ||
      lowerMessage.includes("get me")
    ) {
      orderIntent = true;
      
      // Extract product name (simplified)
      const products = await supabase.from('products').select('title').eq('user_id', userId);
      if (!products.error && products.data) {
        for (const product of products.data) {
          if (lowerMessage.includes(product.title.toLowerCase())) {
            productName = product.title;
            break;
          }
        }
      }
      
      // Extract quantity (simplified)
      const quantityMatch = lowerMessage.match(/(\d+)/);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
      }
    }
    
    // Generate reply based on intent and matches
    let reply = "";
    
    if (orderIntent && productName && quantity > 0) {
      reply = `Your Order for ${productName} for ${quantity} is placed successfully. Order Number is ORD-${Date.now().toString().substring(7)}.`;
      
      // Create ticket for the order
      try {
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            title: `Order: ${productName}`,
            body: `Customer ordered ${quantity} of ${productName}`,
            type: "Order",
            status: "New",
            priority: "HIGH",
            platform: "whatsapp",
            customer_name: sender_name,
            conversation_id: conversation_id,
            user_id: userId,
            product_info: { product: productName, quantity: quantity }
          })
          .select()
          .single();
          
        if (ticketError) {
          console.error("Error creating ticket:", ticketError);
        } else {
          console.log(`Created ticket ID: ${ticketData.id}`);
        }
      } catch (ticketError) {
        console.error("Failed to create ticket:", ticketError);
      }
    } else if (orderIntent) {
      reply = "I'd like to help you place an order. Could you please specify the product name and quantity?";
    } else if (relevantMatches.length > 0) {
      // Use knowledge base for response
      reply = `I found some information that might help: ${relevantMatches.map(m => m.content.substring(0, 100) + '...').join('\n\n')}`;
    } else {
      // Default response
      reply = "Thank you for your message. Our team will get back to you soon.";
    }

    // Send response back to WhatsApp
    try {
      const messageResponse = await supabase.functions.invoke('send-whatsapp', {
        body: {
          to: sender_number,
          message: reply,
          type: 'text',
          phoneId: phoneNumberId,
          accessToken: accessToken
        }
      });

      if (messageResponse.error) {
        throw messageResponse.error;
      }
      
      // Save the reply message to the database
      const { error: replyError } = await supabase
        .from('messages')
        .insert({
          content: reply,
          conversation_id: conversation_id,
          sender_number: phoneNumberId,
          sender_name: "System",
          status: "sent",
          user_id: userId
        });
        
      if (replyError) {
        console.error("Error saving reply message:", replyError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Message processed successfully",
          reply: reply
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (error) {
      console.error("Error sending WhatsApp response:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error processing message:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
