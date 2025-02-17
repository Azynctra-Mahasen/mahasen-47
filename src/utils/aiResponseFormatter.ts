/**
 * Formats the AI response by removing thinking tags and extracting JSON
 * @param response The raw response from the AI model
 * @returns Parsed JSON object or null if parsing fails
 */
export const formatAIResponse = (response: string) => {
  try {
    // Remove content between <think> tags including the tags themselves
    const cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Remove any "json" prefix if it exists
    const jsonString = cleanedResponse.replace(/^json\s*/, '').trim();
    
    // Parse the remaining content as JSON
    const parsedResponse = JSON.parse(jsonString);
    
    console.log('Parsed AI response:', parsedResponse);
    return parsedResponse;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Raw response:', response);
    return null;
  }
};

/**
 * Type guard to check if the parsed response has the expected structure
 */
export const isValidAIResponse = (response: any): boolean => {
  return (
    response &&
    typeof response === 'object' &&
    typeof response.intent === 'string' &&
    typeof response.confidence === 'number' &&
    typeof response.requires_escalation === 'boolean' &&
    typeof response.response === 'string' &&
    typeof response.detected_entities === 'object' &&
    typeof response.detected_entities.urgency_level === 'string'
  );
};