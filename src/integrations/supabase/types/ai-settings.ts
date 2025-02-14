
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
      use_mcp: boolean
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
      use_mcp?: boolean
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
      use_mcp?: boolean
    }
    Relationships: []
  }
}
