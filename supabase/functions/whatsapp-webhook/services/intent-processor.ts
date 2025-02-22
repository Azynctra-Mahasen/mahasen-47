
export async function processIntent(
  message: string,
  conversationId: string
) {
  // Basic intent detection - expand this based on your needs
  const message_lower = message.toLowerCase();
  
  // Check for different intents
  if (message_lower.includes('help') || message_lower.includes('support')) {
    return {
      shouldCreateTicket: true,
      intentType: 'SUPPORT_REQUEST',
      context: 'Customer requested help/support'
    };
  }
  
  if (message_lower.includes('speak') && message_lower.includes('human')) {
    return {
      shouldCreateTicket: true,
      intentType: 'HUMAN_AGENT_REQUEST',
      context: 'Customer explicitly requested human agent'
    };
  }
  
  if (message_lower.includes('complaint') || message_lower.includes('issue')) {
    return {
      shouldCreateTicket: true,
      intentType: 'COMPLAINT',
      context: 'Customer raised a complaint/issue'
    };
  }

  // Default response - no ticket needed
  return {
    shouldCreateTicket: false,
    intentType: 'GENERAL_QUERY',
    context: 'General conversation'
  };
}
