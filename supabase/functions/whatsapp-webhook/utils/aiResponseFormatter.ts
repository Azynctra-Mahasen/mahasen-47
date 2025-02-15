export function formatAIResponse(responseText: string): any {
  try {
    // Remove <think> tags and their content
    let cleanedResponse = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Remove ```json and ``` markers if they exist
    cleanedResponse = cleanedResponse.replace(/```json\n/g, '').replace(/```/g, '').trim();
    
    // Parse the JSON
    const parsedResponse = JSON.parse(cleanedResponse);
    
    console.log('Parsed AI response:', parsedResponse);
    
    // If we just want to return the response text
    if (parsedResponse.response) {
      return parsedResponse;
    }
    
    // Fallback to returning the full parsed response
    return parsedResponse;
  } catch (error) {
    console.error('Error formatting AI response:', error);
    console.log('Raw response:', responseText);
    
    // Return a default response structure if parsing fails
    return {
      response: responseText,
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

export function isValidAIResponse(response: any): boolean {
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