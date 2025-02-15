
export function formatAIResponse(responseText: string): any {
  try {
    console.log('Formatting AI response. Raw input:', responseText);
    
    // Handle empty or undefined input
    if (!responseText) {
      console.error('Empty or undefined response text');
      return getDefaultFormattedResponse('Empty response');
    }

    // Remove <think> tags and their content
    let cleanedResponse = responseText
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ');
    
    console.log('Cleaned response:', cleanedResponse);
    
    // Try to extract JSON if embedded in text
    let jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
      console.log('Extracted JSON:', cleanedResponse);
    }
    
    // Parse the JSON
    const parsedResponse = JSON.parse(cleanedResponse);
    console.log('Parsed response:', parsedResponse);
    
    if (!isValidAIResponse(parsedResponse)) {
      console.error('Invalid AI response structure:', parsedResponse);
      return getDefaultFormattedResponse('Invalid response structure');
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Error formatting AI response:', error);
    console.error('Raw response that caused error:', responseText);
    return getDefaultFormattedResponse(`Formatting error: ${error.message}`);
  }
}

export function isValidAIResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    console.error('Response is not an object');
    return false;
  }

  const requiredFields = {
    response: 'string',
    intent: 'string',
    confidence: 'number',
    requires_escalation: 'boolean',
    detected_entities: 'object'
  };

  for (const [field, type] of Object.entries(requiredFields)) {
    if (!(field in response)) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
    if (typeof response[field] !== type) {
      console.error(`Invalid type for ${field}. Expected ${type}, got ${typeof response[field]}`);
      return false;
    }
  }

  if (!response.detected_entities.hasOwnProperty('product_mentions')) {
    console.error('Missing product_mentions in detected_entities');
    return false;
  }

  if (!Array.isArray(response.detected_entities.product_mentions)) {
    console.error('product_mentions is not an array');
    return false;
  }

  if (!['low', 'medium', 'high'].includes(response.detected_entities.urgency_level)) {
    console.error('Invalid urgency_level');
    return false;
  }

  return true;
}

function getDefaultFormattedResponse(reason: string = 'Unknown error'): any {
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
