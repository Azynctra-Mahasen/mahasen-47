
export function formatAIResponse(responseText: string): any {
  try {
    // First remove the thinking part
    const withoutThinking = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Find the first occurrence of '{'
    const jsonStartIndex = withoutThinking.indexOf('{');
    if (jsonStartIndex === -1) {
      console.error('No JSON object found in response');
      throw new Error('Invalid response format: No JSON object found');
    }

    // Extract everything from the first '{' to the end
    const jsonString = withoutThinking.substring(jsonStartIndex);
    
    // Remove any markdown code block markers
    const cleanJsonString = jsonString.replace(/```json|```/g, '').trim();
    
    // Parse the JSON
    const parsedResponse = JSON.parse(cleanJsonString);
    
    console.log('Parsed AI response:', parsedResponse);
    
    if (isValidResponse(parsedResponse)) {
      return parsedResponse;
    }
    
    throw new Error('Invalid response structure');
  } catch (error) {
    console.error('Error formatting AI response:', error);
    console.log('Raw response:', responseText);
    
    // Return a default response structure if parsing fails
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

function isValidResponse(response: any): boolean {
  return (
    response &&
    typeof response.intent === 'string' &&
    typeof response.confidence === 'number' &&
    typeof response.requires_escalation === 'boolean' &&
    (response.escalation_reason === null || typeof response.escalation_reason === 'string') &&
    response.detected_entities &&
    typeof response.response === 'string' &&
    Array.isArray(response.detected_entities.product_mentions) &&
    (response.detected_entities.issue_type === null || typeof response.detected_entities.issue_type === 'string') &&
    ['low', 'medium', 'high'].includes(response.detected_entities.urgency_level)
  );
}

// Helper function to extract just the response text
export function extractResponseText(parsedResponse: any): string {
  if (typeof parsedResponse === 'string') {
    return parsedResponse;
  }
  
  if (parsedResponse && parsedResponse.response) {
    return parsedResponse.response;
  }
  
  return 'I apologize, but I encountered an error processing your request.';
}
