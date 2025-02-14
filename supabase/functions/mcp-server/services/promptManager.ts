
import { PromptParams } from "../prompts/templates.ts";
import { ConversationContext, KnowledgeBaseContext, PromptType } from "../types/prompt.ts";
import { generateSystemPrompt } from "../prompts/templates.ts";
import { logger } from "../utils.ts";

export class PromptManager {
  static generatePrompt(
    message: string,
    conversationContext: ConversationContext | null,
    knowledgeBaseContext: KnowledgeBaseContext | null,
    aiSettings: PromptParams
  ): string {
    logger.info('Generating prompt with contexts:', {
      hasConversationContext: !!conversationContext,
      hasKnowledgeBaseContext: !!knowledgeBaseContext
    });

    // Determine prompt type based on context and message
    const promptType = this.determinePromptType(message, conversationContext);

    // Get base prompt with system instructions
    const systemPrompt = generateSystemPrompt({
      ...aiSettings,
      platform: conversationContext?.platform,
      language: conversationContext?.language,
      knowledgeBase: this.formatKnowledgeBaseContext(knowledgeBaseContext)
    }, promptType);

    // Add conversation history if available
    const conversationHistory = this.formatConversationHistory(conversationContext);

    return `${systemPrompt}

${conversationHistory}

Current user message: ${message}`;
  }

  private static determinePromptType(message: string, context: ConversationContext | null): PromptType {
    // Check for ongoing order
    if (context?.orderState && !['COMPLETED', undefined].includes(context.orderState.state)) {
      return 'ORDER';
    }

    // Check message for order indicators
    const orderKeywords = ['buy', 'order', 'purchase', 'get', 'want'];
    if (orderKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return 'ORDER';
    }

    // Check for support indicators
    const supportKeywords = ['help', 'issue', 'problem', 'error', 'not working', 'broken'];
    if (supportKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return 'SUPPORT';
    }

    return 'GENERAL';
  }

  private static formatConversationHistory(context: ConversationContext | null): string {
    if (!context?.previousMessages?.length) return 'No previous conversation history.';

    return `Previous conversation:
${context.previousMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
  }

  private static formatKnowledgeBaseContext(context: KnowledgeBaseContext | null): string {
    if (!context?.relevantArticles?.length) return '';

    return context.relevantArticles
      .map(article => article.content)
      .join('\n\n');
  }
}
