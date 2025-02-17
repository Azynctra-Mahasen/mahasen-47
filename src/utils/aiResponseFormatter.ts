
/**
 * Formats the AI response by removing thinking tags and extracting JSON
 * @param response The raw response from the AI model
 * @returns Parsed JSON object or null if parsing fails
 */
export const formatAIResponse = (response: string) => {
  try {
    // First remove the thinking part
    const withoutThinking = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Find the first occurrence of '{'
    const jsonStartIndex = withoutThinking.indexOf('{');
    if (jsonStartIndex === -1) {
      console.error('No JSON object found in response');
      return null;
    }

    // Extract everything from the first '{' to the end
    const jsonString = withoutThinking.substring(jsonStartIndex);
    
    // Remove any markdown code block markers
    const cleanJsonString = jsonString.replace(/```json|```/g, '').trim();
    
    // Parse the JSON
    const parsedResponse = JSON.parse(cleanJsonString);
    
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
