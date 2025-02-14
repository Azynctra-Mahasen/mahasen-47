
export type Platform = 'whatsapp' | 'messenger' | 'general';
export type PromptType = 'ORDER' | 'SUPPORT' | 'GENERAL';

export interface ConversationContext {
  previousMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  platform: Platform;
  language: string;
  lastIntent?: string;
  orderState?: OrderState;
  lastContextUpdate?: string;
}

export interface OrderState {
  product?: string;
  quantity?: number;
  state: 'COLLECTING_INFO' | 'CONFIRMING' | 'PROCESSING' | 'COMPLETED';
  confirmed: boolean;
}

export interface KnowledgeBaseContext {
  relevantArticles: Array<{
    id: string;
    content: string;
    similarity: number;
  }>;
  lastUpdated: string;
}

export interface SystemMessage {
  key: string;
  params?: Record<string, string | number>;
  language?: string;
}
