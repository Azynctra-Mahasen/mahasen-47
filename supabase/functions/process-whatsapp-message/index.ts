
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
    const { message, conversation_id, sender_number, sender_name } = await req.json();

    // Save the message to the database
    const messageRecord = {
      content: message,
      conversation_id: conversation_id,
      sender_number: sender_number,
      sender_name: sender_name,
      status: "received",
    };

    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert(messageRecord)
      .select()
      .single();

    if (saveError) {
      console.error("Error saving message:", saveError);
      throw saveError;
    }

    console.log(`Message saved with ID: ${savedMessage.id}`);

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
      .select('whatsapp_phone_id')
      .eq('user_id', userId)
      .single();

    if (secretsError) {
      console.error("Error fetching user secrets:", secretsError);
      throw secretsError;
    }

    const phoneNumberId = userSecrets.whatsapp_phone_id;
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

    // Now, instead of calling the generate-ai-response function, we'll handle the response here
    // This is a simple response for now - in a real implementation, you might want to 
    // incorporate AI processing with the relevant matches
    const reply = relevantMatches.length > 0 
      ? `I found some information that might help: ${relevantMatches.map(m => m.content.substring(0, 100) + '...').join('\n\n')}`
      : "Thank you for your message. Our team will get back to you soon.";

    // Send response back to WhatsApp
    try {
      const messageResponse = await supabase.functions.invoke('send-whatsapp', {
        body: {
          to: sender_number,
          message: reply,
          type: 'text',
          phoneId: phoneNumberId,
        }
      });

      if (messageResponse.error) {
        throw messageResponse.error;
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
      console.error("Error generating AI response:", error);
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
