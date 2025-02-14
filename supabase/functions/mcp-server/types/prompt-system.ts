
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export type PlatformType = 'whatsapp' | 'facebook' | 'instagram';
export type IntentType = 'ORDER' | 'SUPPORT' | 'GENERAL';
export type FormatType = 'text' | 'button' | 'quickReply' | 'list' | 'media';

export interface ContextTrackingData {
  conversationId: string;
  contextType: string;
  sentiment?: number;
  effectivenessScore?: number;
  interactionCount: number;
  lastInteraction: Date;
}

export interface PromptTemplate {
  id: string;
  name: string;
  platform: PlatformType;
  intentType: IntentType;
  template: string;
  language: string;
  isActive: boolean;
  effectivenessScore: number;
  usageCount: number;
}

export interface PlatformResponseFormat {
  id: string;
  platform: PlatformType;
  formatType: FormatType;
  template: Record<string, any>;
}

export const PromptEvaluationSchema = z.object({
  success: z.boolean(),
  relevance: z.number().min(0).max(1),
  sentiment: z.number().min(-1).max(1),
  requiresFollowUp: z.boolean(),
  followUpType: z.enum(['clarification', 'confirmation', 'additional_info']).optional()
});

export type PromptEvaluation = z.infer<typeof PromptEvaluationSchema>;
