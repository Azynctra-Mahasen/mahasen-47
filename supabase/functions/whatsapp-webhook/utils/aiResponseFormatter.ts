
export function extractResponseText(response: string): string {
  // Remove think tags and their content
  const withoutThinkTags = response.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // Try to parse as JSON
  try {
    // Remove any markdown code block syntax
    const cleanJson = withoutThinkTags
      .replace(/```json\n/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    return parsed.response || parsed;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.log('Raw response:', response);
    
    // If JSON parsing fails, try to extract just the text content
    // Remove markdown and other formatting
    return withoutThinkTags
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n\n/g, '\n')
      .trim();
  }
}
