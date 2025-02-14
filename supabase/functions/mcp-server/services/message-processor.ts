import { logWebhookError, handleWebhookError } from "../utils/error-handler.ts";
import { initSupabase } from "../utils.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { MonitoringService, LogLevel, trackPerformance } from "../utils/monitoring.ts";

const MessageSchema = z.object({
  platform: z.enum(['whatsapp', 'facebook', 'instagram']),
  sender: z.object({
    name: z.string(),
    number: z.string()
  }),
  content: z.string(),
  messageId: z.string().optional(),
  orderInfo: z.object({
    product: z.string(),
    quantity: z.number(),
    state: z.enum(['COLLECTING_INFO', 'CONFIRMING', 'PROCESSING']),
    confirmed: z.boolean()
  }).optional()
});

export class MessageProcessor {
  @trackPerformance('processMessage')
  static async processMessage(data: unknown) {
    const startTime = performance.now();
    
    try {
      // Validate incoming message
      const validatedData = MessageSchema.parse(data);
      const supabase = initSupabase();

      await MonitoringService.trackUsage('message_processing', 'process', undefined, {
        platform: validatedData.platform,
        hasOrderInfo: !!validatedData.orderInfo
      });

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

      // Store message with order info if present
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: validatedData.content,
          sender_name: validatedData.sender.name,
          sender_number: validatedData.sender.number,
          status: 'received',
          whatsapp_message_id: validatedData.messageId,
          order_info: validatedData.orderInfo || null
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

      // If this is a confirmed order, create a ticket
      if (validatedData.orderInfo?.confirmed && validatedData.orderInfo?.state === 'PROCESSING') {
        try {
          const { error: ticketError } = await supabase
            .from('tickets')
            .insert({
              title: `Order: ${validatedData.orderInfo.product}`,
              customer_name: validatedData.sender.name,
              platform: validatedData.platform,
              type: 'Order',
              status: 'New',
              priority: 'HIGH',
              body: `Product: ${validatedData.orderInfo.product}\nQuantity: ${validatedData.orderInfo.quantity}`,
              conversation_id: conversationId,
              product_info: {
                product: validatedData.orderInfo.product,
                quantity: validatedData.orderInfo.quantity
              }
            });

          if (ticketError) {
            throw new Error(`Failed to create order ticket: ${ticketError.message}`);
          }
        } catch (error) {
          await logWebhookError({
            type: 'PROCESSING',
            message: 'Failed to create order ticket',
            details: { error, orderInfo: validatedData.orderInfo }
          });
          throw error;
        }
      }

      // Log successful message processing
      await MonitoringService.log(
        LogLevel.INFO,
        'message-processor',
        'Message processed successfully',
        undefined,
        undefined,
        {
          messageId: validatedData.messageId,
          platform: validatedData.platform,
          conversationId
        }
      );

      return { success: true, conversationId };
    } catch (error) {
      const webhookError = handleWebhookError(error);
      await logWebhookError(webhookError);

      // Track failed processing in monitoring
      await MonitoringService.log(
        LogLevel.ERROR,
        'message-processor',
        'Failed to process message',
        'MESSAGE_PROCESSING_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );

      return { success: false, error: webhookError };
    }
  }
}

// Export the processMessage method directly for backward compatibility
export const processMessage = MessageProcessor.processMessage;
