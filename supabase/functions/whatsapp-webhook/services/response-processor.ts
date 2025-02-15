
import { processIntent } from './intent-processor.ts';

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

      if (!this.validateIntentStructure(parsedResponse)) {
        console.error('Invalid response structure:', parsedResponse);
        return this.getDefaultResponse();
      }

      // Process order info if present
      if (parsedResponse.intent === 'ORDER_PLACEMENT') {
        parsedResponse.detected_entities.order_info = 
          await this.processOrderInfo(
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

  private static validateIntentStructure(response: any): boolean {
    return (
      response &&
      typeof response.intent === 'string' &&
      typeof response.confidence === 'number' &&
      typeof response.requires_escalation === 'boolean' &&
      response.detected_entities &&
      typeof response.response === 'string'
    );
  }

  private static async processOrderInfo(orderInfo: any, userMessage?: string): Promise<any> {
    if (!orderInfo) return null;
    
    try {
      const intent = await processIntent(userMessage || '', '');
      return {
        ...orderInfo,
        product_mentions: intent.detected_entities.product_mentions,
        state: orderInfo.state || 'COLLECTING_INFO'
      };
    } catch (error) {
      console.error('Error processing order info:', error);
      return orderInfo;
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
