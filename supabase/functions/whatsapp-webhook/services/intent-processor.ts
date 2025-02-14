
export class IntentProcessor {
  private static readonly DEFAULT_CONFIG = {
    confidence_threshold: 0.7,
    urgency_levels: ['high', 'medium', 'low'],
    intent_types: ['SUPPORT_REQUEST', 'ORDER_PLACEMENT', 'GENERAL_QUERY']
  };

  private static readonly CONFIRMATION_WORDS = ['yes', 'ow', 'ඔව්'];
  
  private static readonly STATE_TRANSITIONS = {
    COLLECTING_INFO: 'CONFIRMING',
    CONFIRMING: 'PROCESSING',
    PROCESSING: 'COMPLETED'
  };

  static validateIntentStructure(response: any): boolean {
    console.log('Validating intent structure:', response);
    
    if (!response || typeof response !== 'object') return false;

    const requiredFields = [
      'intent',
      'confidence',
      'requires_escalation',
      'detected_entities',
      'response'
    ];

    const isValid = requiredFields.every(field => field in response) &&
           typeof response.confidence === 'number' &&
           typeof response.requires_escalation === 'boolean' &&
           this.DEFAULT_CONFIG.intent_types.includes(response.intent) &&
           this.validateDetectedEntities(response.detected_entities);
    
    console.log('Intent structure validation result:', isValid);
    return isValid;
  }

  private static validateDetectedEntities(entities: any): boolean {
    if (!entities || typeof entities !== 'object') return false;

    const requiredFields = [
      'product_mentions',
      'issue_type',
      'urgency_level'
    ];

    return requiredFields.every(field => field in entities) &&
           Array.isArray(entities.product_mentions) &&
           (entities.issue_type === null || typeof entities.issue_type === 'string') &&
           this.DEFAULT_CONFIG.urgency_levels.includes(entities.urgency_level);
  }

  static evaluateEscalationNeeds(analysis: any): boolean {
    return analysis.requires_escalation ||
           analysis.intent === 'HUMAN_AGENT_REQUEST' ||
           (analysis.intent === 'SUPPORT_REQUEST' && 
            analysis.detected_entities.urgency_level === 'high');
  }

  static isConfirmationMessage(message: string): boolean {
    const normalizedMessage = message.toLowerCase().trim();
    console.log('Checking confirmation message:', normalizedMessage);
    return this.CONFIRMATION_WORDS.includes(normalizedMessage);
  }

  static processOrderInfo(orderInfo: any, message?: string): any {
    console.log('Processing order info:', { orderInfo, message });

    // If there's no existing order info, create initial state
    if (!orderInfo) {
      console.log('Creating new order info');
      return {
        product: null,
        quantity: 1,
        state: 'COLLECTING_INFO',
        confirmed: false
      };
    }

    // Preserve product name if it exists
    const currentProduct = orderInfo.product;
    console.log('Current product:', currentProduct);

    // Handle confirmation messages
    if (message && this.isConfirmationMessage(message)) {
      console.log('Confirmation message received, current state:', orderInfo.state);
      
      if (orderInfo.state === 'CONFIRMING' && currentProduct) {
        console.log('Moving to PROCESSING state');
        return {
          ...orderInfo,
          product: currentProduct, // Explicitly preserve product name
          state: 'PROCESSING',
          confirmed: true
        };
      }
    }

    // If we have a product but haven't asked for confirmation yet
    if (currentProduct && orderInfo.state === 'COLLECTING_INFO') {
      console.log('Moving to CONFIRMING state');
      return {
        ...orderInfo,
        product: currentProduct, // Explicitly preserve product name
        state: 'CONFIRMING',
        confirmed: false
      };
    }

    // Preserve existing state but ensure product name is maintained
    return {
      ...orderInfo,
      product: currentProduct || orderInfo.product, // Ensure product name is preserved
      quantity: orderInfo.quantity || 1
    };
  }
}
