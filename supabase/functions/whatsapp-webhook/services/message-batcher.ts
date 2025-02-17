
type MessageBatch = {
  messages: string[];
  timer: number | null;
};

class MessageBatcherService {
  private static batchTimeout = 1600; // ms
  private static batches = new Map<string, MessageBatch>();

  static async processBatchedMessage(
    userId: string, 
    message: string,
    callback: (batchedMessage: string) => Promise<void>
  ): Promise<void> {
    console.log(`Processing message for user ${userId}: ${message}`);
    
    // Get or create batch for this user
    const batch = this.batches.get(userId) || { messages: [], timer: null };
    
    // Clear existing timer if there is one
    if (batch.timer) {
      clearTimeout(batch.timer);
    }

    // Add new message to batch
    batch.messages.push(message);

    // Create new timer
    batch.timer = setTimeout(async () => {
      console.log(`Timer expired for user ${userId}, processing batch of ${batch.messages.length} messages`);
      const batchedMessage = batch.messages.join(' ');
      this.batches.delete(userId); // Clear the batch
      await callback(batchedMessage);
    }, this.batchTimeout);

    // Update batch in map
    this.batches.set(userId, batch);

    console.log(`Current batch for user ${userId}:`, batch.messages);
  }

  // Helper to check if user has pending messages
  static hasPendingMessages(userId: string): boolean {
    return this.batches.has(userId);
  }

  // Helper to get current batch size
  static getCurrentBatchSize(userId: string): number {
    const batch = this.batches.get(userId);
    return batch ? batch.messages.length : 0;
  }
}

export { MessageBatcherService };
