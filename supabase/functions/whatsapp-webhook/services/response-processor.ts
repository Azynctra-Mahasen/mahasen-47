
import { IntentProcessor } from './intent-processor.ts';
import { searchKnowledgeBase, formatSearchResults, SearchResult } from './knowledge-base.ts';

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
      if (parsedResponse.intent === 'ORDER_PLACEMENT' && userMessage) {
        const searchResults = await searchKnowledgeBase(userMessage);
        parsedResponse.detected_entities.order_info = 
          await this.processOrderInfo(
            parsedResponse.detected_entities.order_info,
            searchResults
          );
        
        // Add formatted product information to the response
        if (searchResults.length > 0) {
          parsedResponse.response += '\n\n' + formatSearchResults(searchResults);
        }
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error processing AI response:', error);
      return this.getDefaultResponse();
    }
  }

  private static async processOrderInfo(orderInfo: any, searchResults: SearchResult[]): Promise<any> {
    if (!orderInfo) return null;
    
    const productResults = searchResults.filter(r => r.source === 'product');
    
    return {
      ...orderInfo,
      state: orderInfo.state || 'COLLECTING_INFO',
      available_products: productResults.map(p => ({
        title: p.metadata?.title,
        price: p.metadata?.price,
        discount: p.metadata?.discounts
      }))
    };
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
