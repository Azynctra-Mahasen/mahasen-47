
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
  })),
  context: z.array(z.object({
    type: z.string(),
    data: z.record(z.unknown())
  })).optional()
});

export const TicketResourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['SUPPORT', 'REQUEST', 'ORDER']),
  status: z.enum(['New', 'In Progress', 'Escalated', 'Completed']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  customerName: z.string(),
  platform: z.enum(['whatsapp', 'facebook', 'instagram']),
  body: z.string(),
  messageId: z.string().optional(),
  conversationId: z.string().optional(),
  intentType: z.string().optional(),
  context: z.string().optional(),
  confidenceScore: z.number().optional(),
  escalationReason: z.string().optional(),
  assignedTo: z.string().optional(),
  createdAt: z.string(),
  lastUpdatedAt: z.string().optional()
});

export const AISettingsResourceSchema = z.object({
  model: z.enum(['groq-llama-3.3-70b-versatile', 'gemini-2.0-flash-exp']),
  tone: z.enum(['Professional', 'Friendly', 'Empathetic', 'Playful']),
  contextMemoryLength: z.number(),
  conversationTimeout: z.number(),
  behaviour: z.string().optional()
});

// Platform context type
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
export type TicketResource = z.infer<typeof TicketResourceSchema>;
export type AISettingsResource = z.infer<typeof AISettingsResourceSchema>;
export type PlatformContext = z.infer<typeof PlatformContextSchema>;
