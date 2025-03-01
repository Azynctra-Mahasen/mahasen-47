
export interface AISettings {
  id: number;
  tone: string;
  behaviour?: string;
  context_memory_length?: number;
  conversation_timeout_hours?: number;
  model_name: string;
  user_id: string;
}

export interface Conversation {
  id: string;
  contact_name: string;
  contact_number: string;
  platform: string;
  ai_enabled: boolean;
  created_at?: string;
  updated_at?: string;
  user_id: string;
}
