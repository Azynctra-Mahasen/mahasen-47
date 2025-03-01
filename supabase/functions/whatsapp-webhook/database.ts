
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { AISettings, Conversation } from "./types/ai-settings.ts";

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") as string,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
);

/**
 * Saves an incoming WhatsApp message to the database
 */
export async function saveMessageToDatabase(
  userId: string,
  message: any,
  contact: any,
  phoneNumberId: string
) {
  try {
    // Step 1: Get or create conversation
    const contactNumber = message.from;
    const contactName = contact.profile.name;
    
    const { data: existingConversation, error: queryError } = await supabaseClient
      .from("conversations")
      .select("id")
      .eq("contact_number", contactNumber)
      .eq("user_id", userId)
      .single();

    let conversationId;

    if (queryError || !existingConversation) {
      // Create new conversation
      const { data: newConversation, error: insertError } = await supabaseClient
        .from("conversations")
        .insert({
          contact_number: contactNumber,
          contact_name: contactName,
          platform: "whatsapp",
          ai_enabled: true,
          user_id: userId
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(`Failed to create conversation: ${insertError.message}`);
      }

      conversationId = newConversation.id;
      console.log(`Created new conversation with ID: ${conversationId}`);
    } else {
      conversationId = existingConversation.id;
      console.log(`Using existing conversation with ID: ${conversationId}`);
    }

    // Step 2: Save the message
    let messageContent = "";
    const messageType = message.type;
    const whatsappMessageId = message.id;

    if (messageType === "text" && message.text) {
      messageContent = message.text.body;
    } else if (messageType === "interactive" && message.interactive) {
      if (message.interactive.type === "button_reply") {
        messageContent = message.interactive.button_reply.title;
      } else if (message.interactive.type === "list_reply") {
        messageContent = message.interactive.list_reply.title;
      }
    } else {
      messageContent = `[Unsupported message type: ${messageType}]`;
    }

    // Save message to database
    const { data: savedMessage, error: messageError } = await supabaseClient
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content: messageContent,
        status: "received",
        sender_name: contactName,
        sender_number: contactNumber,
        whatsapp_message_id: whatsappMessageId,
        metadata: {
          msg_type: messageType,
          raw_data: message,
          phone_number_id: phoneNumberId
        },
        user_id: userId
      })
      .select("id")
      .single();

    if (messageError) {
      throw new Error(`Failed to save message: ${messageError.message}`);
    }

    console.log(`Saved message with ID: ${savedMessage.id}`);

    return { conversationId, messageId: savedMessage.id };
  } catch (error) {
    console.error("Error saving message to database:", error);
    throw error;
  }
}

/**
 * Save a message to the database (for both user and system messages)
 */
export async function saveMessage(
  conversationId: string,
  content: string,
  status: "sent" | "received",
  senderName: string,
  senderNumber: string,
  metadata: any = {},
  userId: string
) {
  try {
    const { data, error } = await supabaseClient
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content: content,
        status: status,
        sender_name: senderName,
        sender_number: senderNumber,
        metadata: metadata,
        user_id: userId
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to save message: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
}

/**
 * Get the conversation history for a given conversation ID
 */
export async function getConversationHistory(conversationId: string, userId: string, limit = 10) {
  try {
    const { data, error } = await supabaseClient
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get conversation history: ${error.message}`);
    }

    return data.reverse();
  } catch (error) {
    console.error("Error getting conversation history:", error);
    throw error;
  }
}

/**
 * Get AI settings for a specific user
 */
export async function getAISettingsForUser(userId: string): Promise<AISettings> {
  try {
    const { data, error } = await supabaseClient
      .from("ai_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn(`No AI settings found for user ${userId}, using defaults:`, error);
      // Return default settings
      return {
        id: 0,
        tone: "Professional",
        behaviour: "",
        context_memory_length: 2,
        conversation_timeout_hours: 1,
        model_name: "deepseek-r1-distill-llama-70b",
        user_id: userId
      };
    }

    return data;
  } catch (error) {
    console.error("Error getting AI settings:", error);
    throw error;
  }
}

/**
 * Get the WhatsApp platform secrets for a specific user
 */
export async function getWhatsAppSecrets(userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from("platform_secrets")
      .select("whatsapp_phone_id, whatsapp_access_token")
      .eq("user_id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to get WhatsApp secrets: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error getting WhatsApp secrets:", error);
    throw error;
  }
}

/**
 * Create a new ticket in the database
 */
export async function createTicket(
  ticketData: {
    title: string;
    body: string;
    customerName: string;
    platform: string;
    type: string;
    status: string;
    conversationId?: string;
    intentType?: string;
    escalationReason?: string;
    priority?: string;
    context?: string;
    confidenceScore?: number;
    productInfo?: any;
  },
  userId: string
) {
  try {
    const { data, error } = await supabaseClient
      .from("tickets")
      .insert({
        title: ticketData.title,
        body: ticketData.body,
        customer_name: ticketData.customerName,
        platform: ticketData.platform,
        type: ticketData.type,
        status: ticketData.status,
        conversation_id: ticketData.conversationId,
        intent_type: ticketData.intentType,
        escalation_reason: ticketData.escalationReason,
        priority: ticketData.priority || "LOW",
        context: ticketData.context,
        confidence_score: ticketData.confidenceScore,
        product_info: ticketData.productInfo,
        user_id: userId
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
}

/**
 * Links a message to a ticket
 */
export async function linkMessageToTicket(ticketId: number, messageId: string) {
  try {
    const { error } = await supabaseClient
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        message_id: messageId
      });

    if (error) {
      throw new Error(`Failed to link message to ticket: ${error.message}`);
    }
  } catch (error) {
    console.error("Error linking message to ticket:", error);
    throw error;
  }
}

/**
 * Update a ticket in the database
 */
export async function updateTicket(ticketId: number, updateData: any, userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from("tickets")
      .update({
        ...updateData,
        last_updated_at: new Date().toISOString()
      })
      .eq("id", ticketId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error updating ticket:", error);
    throw error;
  }
}

/**
 * Log a ticket status change in the history table
 */
export async function logTicketHistory(ticketId: number, action: string, changes: any) {
  try {
    const { error } = await supabaseClient
      .from("ticket_history")
      .insert({
        ticket_id: ticketId,
        action: action,
        previous_status: changes.previousStatus,
        new_status: changes.newStatus,
        previous_assigned_to: changes.previousAssignedTo,
        new_assigned_to: changes.newAssignedTo,
        changed_by: "system"
      });

    if (error) {
      throw new Error(`Failed to log ticket history: ${error.message}`);
    }
  } catch (error) {
    console.error("Error logging ticket history:", error);
    throw error;
  }
}

/**
 * Search knowledge base using the knowledge_base_and_products function
 */
export async function searchKnowledgeBase(embedding: string, userId: string, matchCount = 5) {
  try {
    const { data, error } = await supabaseClient.rpc(
      'match_knowledge_base_and_products',
      {
        query_embedding: embedding,
        user_id: userId,
        match_count: matchCount
      }
    );

    if (error) {
      throw new Error(`Knowledge base search failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return [];
  }
}
