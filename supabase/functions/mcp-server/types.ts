import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Core resource types
export const KnowledgeBaseResourceSchema = z.object({
  id: z.string(),
  content: z.string(),
  category: z.string(),
  metadata: z.object({
    lastUpdated: z.string(),
    relevanceScore: z.number().optional()
  })
});

export const ConversationResourceSchema = z.object({
  id: z.string(),
  platform: z.enum(['whatsapp', 'facebook', 'instagram']),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string()
  }))
});

// Core context types
export const PlatformContextSchema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  userName: z.string(),
  platform: z.enum(['whatsapp', 'facebook', 'instagram']),
  knowledgeBase: z.string().optional(),
  previousMessages: z.array(z.string()).optional()
});

export type KnowledgeBaseResource = z.infer<typeof KnowledgeBaseResourceSchema>;
export type ConversationResource = z.infer<typeof ConversationResourceSchema>;
export type PlatformContext = z.infer<typeof PlatformContextSchema>;
