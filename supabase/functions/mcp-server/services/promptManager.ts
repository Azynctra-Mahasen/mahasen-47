
import { PromptParams } from "../prompts/templates.ts";
import { ConversationContext, KnowledgeBaseContext, PromptType } from "../types/prompt.ts";
import { generateSystemPrompt } from "../prompts/templates.ts";
import { logger } from "../utils.ts";
import { z } from "zod";

// Define response schema for validation
const PromptResponseSchema = z.object({
  intent: z.enum(['HUMAN_AGENT_REQUEST', 'SUPPORT_REQUEST', 'ORDER_PLACEMENT', 'GENERAL_QUERY']),
  confidence: z.number().min(0).max(1),
  requires_escalation: z.boolean(),
  escalation_reason: z.string().nullable(),
  detected_entities: z.object({
    product_mentions: z.array(z.string()),
    issue_type: z.string().nullable(),
    urgency_level: z.enum(['low', 'medium', 'high']),
    order_info: z.object({
      product: z.string().nullable(),
      quantity: z.number().optional(),
      state: z.enum(['COLLECTING_INFO', 'CONFIRMING', 'PROCESSING', 'COMPLETED']),
      confirmed: z.boolean()
    })
  }),
  response: z.string()
});

export class PromptManager {
  private static readonly CONVERSATION_TIMEOUT_HOURS = 24;

  static async generatePrompt(
    message: string,
    conversationContext: ConversationContext | null,
    knowledgeBaseContext: KnowledgeBaseContext | null,
    aiSettings: PromptParams
  ): Promise<string> {
    logger.info('Generating prompt with contexts:', {
      hasConversationContext: !!conversationContext,
      hasKnowledgeBaseContext: !!knowledgeBaseContext
    });

    // Check for conversation timeout
    if (conversationContext?.lastContextUpdate) {
      const timeoutHours = aiSettings.conversation_timeout_hours || this.CONVERSATION_TIMEOUT_HOURS;
      const lastUpdate = new Date(conversationContext.lastContextUpdate);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > timeoutHours) {
        logger.info('Conversation timeout detected, treating as new conversation');
        conversationContext.previousMessages = [];
      }
    }

    // Determine prompt type based on context and message
    const promptType = this.determinePromptType(message, conversationContext);

    // Get base prompt with system instructions
    const systemPrompt = generateSystemPrompt({
      ...aiSettings,
      platform: conversationContext?.platform,
      knowledgeBase: this.formatKnowledgeBaseContext(knowledgeBaseContext)
    }, promptType);

    // Add conversation history if available
    const conversationHistory = this.formatConversationHistory(conversationContext);

    return `${systemPrompt}

${conversationHistory}

Current user message: ${message}`;
  }

  static validateResponse(response: unknown): boolean {
    try {
      PromptResponseSchema.parse(response);
      return true;
    } catch (error) {
      logger.error('Invalid prompt response:', error);
      return false;
    }
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

    const messageLimit = 10; // Limit conversation history to last 10 messages
    const recentMessages = context.previousMessages.slice(-messageLimit);

    return `Previous conversation:
${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
  }

  private static formatKnowledgeBaseContext(context: KnowledgeBaseContext | null): string {
    if (!context?.relevantArticles?.length) return '';

    return context.relevantArticles
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
      .slice(0, 3) // Take top 3 most relevant articles
      .map(article => article.content)
      .join('\n\n');
  }

  static getSystemMessage(key: string, language = 'en'): string {
    const messages: Record<string, Record<string, string>> = {
      orderConfirmation: {
        en: "Your order has been confirmed. Order ID: {orderId}",
        si: "ඔබගේ ඇණවුම තහවුරු කර ඇත. ඇණවුම් අංකය: {orderId}"
      },
      orderCancelled: {
        en: "Your order has been cancelled.",
        si: "ඔබගේ ඇණවුම අවලංගු කර ඇත."
      },
      timeout: {
        en: "The conversation has timed out. Starting a new conversation.",
        si: "සංවාදය කල් ඉකුත් වී ඇත. නව සංවාදයක් ආරම්භ කරමින්."
      }
    };

    return messages[key]?.[language] || messages[key]?.['en'] || key;
  }
}
