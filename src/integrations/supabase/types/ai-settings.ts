
import { DatabaseEnums } from './common';

export type AiSettingsTables = {
  ai_settings: {
    Row: {
      behaviour: string | null
      context_memory_length: number
      conversation_timeout_hours: number
      created_at: string
      id: number
      model_name: DatabaseEnums["ai_model"]
      tone: DatabaseEnums["ai_tone"]
      updated_at: string
    }
    Insert: {
      behaviour?: string | null
      context_memory_length?: number
      conversation_timeout_hours?: number
      created_at?: string
      id?: number
      model_name?: DatabaseEnums["ai_model"]
      tone?: DatabaseEnums["ai_tone"]
      updated_at?: string
    }
    Update: {
      behaviour?: string | null
      context_memory_length?: number
      conversation_timeout_hours?: number
      created_at?: string
      id?: number
      model_name?: DatabaseEnums["ai_model"]
      tone?: DatabaseEnums["ai_tone"]
      updated_at?: string
    }
    Relationships: []
  }
}
