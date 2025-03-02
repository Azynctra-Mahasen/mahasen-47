
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../../_shared/database.types.ts";

interface Message {
  role: string;
  content: string;
}

export async function getConversationContext(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  contextLength: number = 2,
  userId: string // Added userId parameter
): Promise<Message[]> {
  try {
    // First verify that this conversation belongs to the user
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId) // Check user_id
      .maybeSingle();

    if (conversationError || !conversation) {
      console.error("Error or unauthorized access to conversation:", conversationError);
      return [];
    }

    // Get recent messages from this conversation
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId) // Filter by user_id
      .order("created_at", { ascending: false })
      .limit(contextLength * 2); // Get more messages than needed so we can have pairs

    if (messagesError) {
      console.error("Error fetching conversation messages:", messagesError);
      return [];
    }

    // Format the messages in the context format needed by AI models
    const context: Message[] = [];
    if (messages) {
      // Reverse to get chronological order
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );

      for (const message of sortedMessages) {
        // Determine if this is a user message or assistant message
        const role = message.sender_number !== message.conversation_id ? "user" : "assistant";
        context.push({
          role,
          content: message.content,
        });
      }
    }

    return context;
  } catch (error) {
    console.error("Error getting conversation context:", error);
    return [];
  }
}
