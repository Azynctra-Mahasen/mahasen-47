
export async function logMessageOperations(
  supabase: any,
  data: {
    conversationId: string;
    messageContent: string;
    senderName: string;
    aiEnabled: boolean;
  }
) {
  try {
    await supabase
      .from('system_logs')
      .insert({
        component: 'message_processor',
        log_level: 'INFO',
        message: 'Message processed',
        metadata: {
          conversation_id: data.conversationId,
          sender_name: data.senderName,
          ai_enabled: data.aiEnabled,
          message_length: data.messageContent.length
        }
      });
  } catch (error) {
    console.error('Error logging message operation:', error);
    // Don't throw the error as logging failure shouldn't break the main flow
  }
}
