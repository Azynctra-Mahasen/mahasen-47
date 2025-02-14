
import { Platform, PromptType } from "../types/prompt.ts";

export interface PromptParams {
  knowledgeBase?: string;
  tone?: string;
  behaviour?: string;
  platform?: Platform;
  language?: string;
}

export function generateSystemPrompt(params: PromptParams, promptType: PromptType): string {
  const basePrompt = getBasePrompt(params.platform || 'general', params.language || 'en');
  const intentPrompt = getIntentSpecificPrompt(promptType);
  const contextPrompt = params.knowledgeBase ? `\nKnowledge Base Context:\n${params.knowledgeBase}` : '';
  
  return `
${basePrompt}

${intentPrompt}

${getLanguageInstructions(params.language || 'en')}

Admin Settings:
Tone: ${params.tone || 'professional'}
${params.behaviour || ''}

${contextPrompt}

You MUST respond in the following JSON format:
{
  "intent": "HUMAN_AGENT_REQUEST" | "SUPPORT_REQUEST" | "ORDER_PLACEMENT" | "GENERAL_QUERY",
  "confidence": 0.0-1.0,
  "requires_escalation": boolean,
  "escalation_reason": string | null,
  "detected_entities": {
    "product_mentions": string[],
    "issue_type": string | null,
    "urgency_level": "medium",
    "order_info": {
      "product": string | null,
      "quantity": number,
      "state": "COLLECTING_INFO" | "CONFIRMING" | "PROCESSING" | "COMPLETED",
      "confirmed": boolean
    }
  },
  "response": string
}`;
}

function getBasePrompt(platform: Platform, language: string): string {
  return `
You are an AI assistant responsible for analyzing user intents and handling both support requests and orders.

Intent Detection Guidelines:
1. Identify explicit requests for human agents
2. Detect order requests and collect order information
3. Detect support requests vs general queries
4. Consider user frustration signals
5. Use provided knowledge base context for informed decisions

Order Processing Guidelines:
1. For order requests:
   - Extract product name
   - Default quantity to 1 unless explicitly specified by the user
   - Only ask for product name if missing
   - Once product name is available, show order summary with quantity (default 1 or specified) and ask for confirmation
   - Accept confirmation only with "Yes", "Ow", or "ඔව්"
   - After confirmation, create ticket with HIGH priority
2. Order States:
   - COLLECTING_INFO: when product missing
   - CONFIRMING: showing order summary
   - PROCESSING: confirmed, creating ticket
   - COMPLETED: ticket created

Platform-Specific Instructions:
${getPlatformSpecificInstructions(platform)}`;
}

function getIntentSpecificPrompt(type: PromptType): string {
  const prompts: Record<PromptType, string> = {
    ORDER: `
Order Processing Steps:
1. Extract product name and quantity from user message
2. If either is missing, ask for the missing information
3. Once complete, show order summary and ask for confirmation
4. Process order only after explicit confirmation
5. Provide order ID after successful creation`,
    SUPPORT: `
Support Request Guidelines:
1. Analyze issue complexity and urgency
2. Use knowledge base for relevant solutions
3. Escalate to human agent if:
   - Issue is complex
   - Customer is frustrated
   - Multiple attempts failed
4. Provide clear, step-by-step solutions`,
    GENERAL: `
General Query Guidelines:
1. Provide concise, accurate responses
2. Use knowledge base when relevant
3. Maintain conversation context
4. Escalate if unable to provide satisfactory answer`,
  };

  return prompts[type] || prompts.GENERAL;
}

function getPlatformSpecificInstructions(platform: Platform): string {
  const instructions: Record<Platform, string> = {
    whatsapp: `
- Support rich text formatting
- Handle media messages
- Use WhatsApp-specific features when available
- Consider message length limitations`,
    messenger: `
- Support Facebook Messenger features
- Handle quick replies and buttons
- Consider platform-specific UI elements
- Support emoji and reactions`,
    general: `
- Provide platform-agnostic responses
- Focus on text-based interactions
- Maintain consistent formatting`,
  };

  return instructions[platform] || instructions.general;
}

function getLanguageInstructions(language: string): string {
  const instructions: Record<string, string> = {
    en: 'Respond in English using clear, professional language.',
    si: 'Respond in Sinhala (සිංහල) with appropriate formality and respect.',
  };

  return `Language Instructions:\n${instructions[language] || instructions.en}`;
}
