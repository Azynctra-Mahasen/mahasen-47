
import { IntentProcessor } from './intent-processor.ts';

export class ResponseProcessor {
  static async processAIResponse(rawResponse: string, userMessage?: string): Promise<any> {
    try {
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
        parsedResponse.detected_entities.order_info = 
          IntentProcessor.processOrderInfo(
            parsedResponse.detected_entities.order_info,
            userMessage
          );
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
