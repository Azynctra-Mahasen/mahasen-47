
export class ResponseProcessor {
  static async processAIResponse(rawResponse: string, userMessage?: string): Promise<any> {
    try {
      console.log('Raw AI response:', rawResponse);
      
      // If response is empty or undefined
      if (!rawResponse) {
        console.error('Empty or undefined AI response');
        return this.getDefaultResponse('Empty or undefined response received');
      }

      // Clean the response more thoroughly
      let cleanedResponse = rawResponse
        .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove think tags and content
        .replace(/```json\s*/g, '') // Remove json code block markers
        .replace(/```\s*/g, '') // Remove remaining code block markers
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/\\n/g, ' ') // Replace escaped newlines
        .replace(/\n/g, ' ') // Replace actual newlines
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space

      console.log('Cleaned response:', cleanedResponse);

      // Try to find valid JSON within the response
      let jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
        console.log('Extracted JSON:', cleanedResponse);
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Failed to parse response:', cleanedResponse);
        return this.getDefaultResponse('Invalid JSON format');
      }

      console.log('Parsed AI response:', parsedResponse);

      // Validate the structure
      if (!this.validateResponseStructure(parsedResponse)) {
        console.error('Invalid response structure:', parsedResponse);
        return this.getDefaultResponse('Invalid response structure');
      }

      // Process order info if present
      if (parsedResponse.intent === 'ORDER_PLACEMENT') {
        console.log('Processing order placement:', {
          originalOrderInfo: parsedResponse.detected_entities.order_info,
          userMessage
        });

        const processedOrderInfo = IntentProcessor.processOrderInfo(
          parsedResponse.detected_entities.order_info,
          userMessage
        );

        console.log('Processed order info:', processedOrderInfo);
        parsedResponse.detected_entities.order_info = processedOrderInfo;
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error in processAIResponse:', error);
      return this.getDefaultResponse(`Error processing response: ${error.message}`);
    }
  }

  private static validateResponseStructure(response: any): boolean {
    const requiredFields = [
      'response',
      'intent',
      'confidence',
      'requires_escalation',
      'detected_entities'
    ];

    const hasAllFields = requiredFields.every(field => {
      const hasField = field in response;
      if (!hasField) {
        console.error(`Missing required field: ${field}`);
      }
      return hasField;
    });

    if (!hasAllFields) return false;

    // Validate detected_entities structure
    const requiredEntityFields = [
      'product_mentions',
      'issue_type',
      'urgency_level'
    ];

    const hasAllEntityFields = requiredEntityFields.every(field => {
      const hasField = field in response.detected_entities;
      if (!hasField) {
        console.error(`Missing required entity field: ${field}`);
      }
      return hasField;
    });

    if (!hasAllEntityFields) return false;

    // Validate field types
    const isValid = (
      typeof response.response === 'string' &&
      typeof response.intent === 'string' &&
      typeof response.confidence === 'number' &&
      typeof response.requires_escalation === 'boolean' &&
      Array.isArray(response.detected_entities.product_mentions) &&
      (response.detected_entities.issue_type === null || typeof response.detected_entities.issue_type === 'string') &&
      ['low', 'medium', 'high'].includes(response.detected_entities.urgency_level)
    );

    if (!isValid) {
      console.error('Invalid field types in response');
    }

    return isValid;
  }

  private static getDefaultResponse(reason: string = 'Unknown error') {
    console.log('Returning default response due to:', reason);
    return {
      response: `I apologize, but I encountered an error: ${reason}. Please try again.`,
      intent: 'GENERAL_QUERY',
      confidence: 0.5,
      requires_escalation: false,
      escalation_reason: null,
      detected_entities: {
        product_mentions: [],
        issue_type: null,
        urgency_level: 'low',
        order_info: null
      }
    };
  }
}
