
export class ResponseProcessor {
  static async processAIResponse(rawResponse: string, userMessage?: string): Promise<any> {
    try {
      console.log('Processing AI response:', rawResponse);
      
      let cleanedResponse = rawResponse
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/```json\n/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedResponse = JSON.parse(cleanedResponse);
      console.log('Parsed AI response:', parsedResponse);

      if (!IntentProcessor.validateIntentStructure(parsedResponse)) {
        console.error('Invalid response structure:', parsedResponse);
        return this.getDefaultResponse();
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

        // Update the response with processed order info
        parsedResponse.detected_entities.order_info = processedOrderInfo;
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error processing AI response:', error);
      return this.getDefaultResponse();
    }
  }

  private static getDefaultResponse() {
    return {
      response: "I apologize, but I received an invalid response format. Please try again.",
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
