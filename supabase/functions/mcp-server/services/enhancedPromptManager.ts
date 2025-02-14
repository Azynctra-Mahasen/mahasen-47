
import { initSupabase, logger } from "../utils.ts";
import { 
  ContextTrackingData, 
  PromptTemplate, 
  PlatformResponseFormat,
  PromptEvaluation,
  PlatformType,
  IntentType,
  FormatType
} from "../types/prompt-system.ts";

export class EnhancedPromptManager {
  private static supabase = initSupabase();

  static async trackContext(data: ContextTrackingData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('context_tracking')
        .insert({
          conversation_id: data.conversationId,
          context_type: data.contextType,
          sentiment: data.sentiment,
          effectiveness_score: data.effectivenessScore,
          interaction_count: data.interactionCount,
          last_interaction: data.lastInteraction.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error tracking context:', error);
      throw error;
    }
  }

  static async getPromptTemplate(
    platform: PlatformType,
    intentType: IntentType,
    language: string = 'en'
  ): Promise<PromptTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('prompt_templates')
        .select('*')
        .eq('platform', platform)
        .eq('intent_type', intentType)
        .eq('language', language)
        .eq('is_active', true)
        .order('effectiveness_score', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching prompt template:', error);
      return null;
    }
  }

  static async getResponseFormat(
    platform: PlatformType,
    formatType: FormatType
  ): Promise<PlatformResponseFormat | null> {
    try {
      const { data, error } = await this.supabase
        .from('platform_response_formats')
        .select('*')
        .eq('platform', platform)
        .eq('format_type', formatType)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching response format:', error);
      return null;
    }
  }

  static async updatePromptEffectiveness(
    promptId: string,
    evaluation: PromptEvaluation
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('prompt_templates')
        .update({
          effectiveness_score: evaluation.relevance,
          usage_count: this.supabase.raw('usage_count + 1')
        })
        .eq('id', promptId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating prompt effectiveness:', error);
      throw error;
    }
  }

  static async formatResponse(
    platform: PlatformType,
    content: string,
    formatType: FormatType = 'text'
  ): Promise<string> {
    try {
      const format = await this.getResponseFormat(platform, formatType);
      if (!format) return content;

      // Apply platform-specific formatting
      const template = format.template;
      return this.applyTemplate(content, template);
    } catch (error) {
      logger.error('Error formatting response:', error);
      return content;
    }
  }

  private static applyTemplate(content: string, template: Record<string, any>): string {
    // Apply platform-specific templates and formatting
    // This is a simplified implementation
    if (template.wrapper) {
      return template.wrapper.replace('{{content}}', content);
    }
    return content;
  }
}
