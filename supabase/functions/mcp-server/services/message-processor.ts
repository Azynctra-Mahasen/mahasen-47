
import { logWebhookError, handleWebhookError } from "../utils/error-handler.ts";
import { initSupabase } from "../utils.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const MessageSchema = z.object({
  platform: z.enum(['whatsapp', 'facebook', 'instagram']),
  sender: z.object({
    name: z.string(),
    number: z.string()
  }),
  content: z.string(),
  messageId: z.string().optional()
});

export async function processMessage(data: unknown) {
  try {
    // Validate incoming message
    const validatedData = MessageSchema.parse(data);
    const supabase = initSupabase();

    // Check if conversation exists
    const { data: existingConversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', validatedData.sender.number)
      .eq('platform', validatedData.platform)
      .single();

    if (conversationError && conversationError.code !== 'PGRST116') {
      throw new Error(`Database error: ${conversationError.message}`);
    }

    let conversationId: string;

    if (!existingConversation) {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          contact_name: validatedData.sender.name,
          contact_number: validatedData.sender.number,
          platform: validatedData.platform
        })
        .select('id')
        .single();

      if (createError) {
        throw new Error(`Failed to create conversation: ${createError.message}`);
      }
      
      conversationId = newConversation.id;
    } else {
      conversationId = existingConversation.id;
    }

    // Store message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: validatedData.content,
        sender_name: validatedData.sender.name,
        sender_number: validatedData.sender.number,
        status: 'received',
        whatsapp_message_id: validatedData.messageId
      });

    if (messageError) {
      throw new Error(`Failed to store message: ${messageError.message}`);
    }

    // Update sync status
    const { error: syncError } = await supabase
      .from('sync_status')
      .insert({
        entity_type: 'message',
        entity_id: validatedData.messageId || 'unknown',
        platform: validatedData.platform,
        sync_status: 'completed'
      });

    if (syncError) {
      await logWebhookError({
        type: 'DATABASE',
        message: 'Failed to update sync status',
        details: { error: syncError }
      });
    }

    return { success: true, conversationId };
  } catch (error) {
    const webhookError = handleWebhookError(error);
    await logWebhookError(webhookError);
    return { success: false, error: webhookError };
  }
}
