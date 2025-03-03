
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string
          features: string[]
          id: string
          name: string
          prompt: string
          system_role: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: string[]
          id?: string
          name: string
          prompt: string
          system_role: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: string[]
          id?: string
          name?: string
          prompt?: string
          system_role?: string
          type?: string
          updated_at?: string
        }
      }
      ai_settings: {
        Row: {
          behaviour: string | null
          context_memory_length: number | null
          conversation_timeout_hours: number | null
          created_at: string
          id: number
          model_name: string
          tone: string
          updated_at: string
          use_mcp: boolean | null
          user_id: string | null
        }
        Insert: {
          behaviour?: string | null
          context_memory_length?: number | null
          conversation_timeout_hours?: number | null
          created_at?: string
          id?: number
          model_name?: string
          tone?: string
          updated_at?: string
          use_mcp?: boolean | null
          user_id?: string | null
        }
        Update: {
          behaviour?: string | null
          context_memory_length?: number | null
          conversation_timeout_hours?: number | null
          created_at?: string
          id?: number
          model_name?: string
          tone?: string
          updated_at?: string
          use_mcp?: boolean | null
          user_id?: string | null
        }
      }
      context_tracking: {
        Row: {
          context_type: string
          conversation_id: string | null
          created_at: string | null
          effectiveness_score: number | null
          id: string
          interaction_count: number | null
          last_interaction: string | null
          sentiment: number | null
          updated_at: string | null
        }
        Insert: {
          context_type: string
          conversation_id?: string | null
          created_at?: string | null
          effectiveness_score?: number | null
          id?: string
          interaction_count?: number | null
          last_interaction?: string | null
          sentiment?: number | null
          updated_at?: string | null
        }
        Update: {
          context_type?: string
          conversation_id?: string | null
          created_at?: string | null
          effectiveness_score?: number | null
          id?: string
          interaction_count?: number | null
          last_interaction?: string | null
          sentiment?: number | null
          updated_at?: string | null
        }
      }
      conversation_contexts: {
        Row: {
          context_data: Json
          context_type: string
          conversation_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          context_data: Json
          context_type: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          context_data?: Json
          context_type?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
      }
      conversations: {
        Row: {
          ai_enabled: boolean
          contact_name: string
          contact_number: string
          created_at: string | null
          id: string
          last_context_update: string | null
          metadata: Json | null
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_enabled?: boolean
          contact_name: string
          contact_number: string
          created_at?: string | null
          id?: string
          last_context_update?: string | null
          metadata?: Json | null
          platform: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          ai_enabled?: boolean
          contact_name?: string
          contact_number?: string
          created_at?: string | null
          id?: string
          last_context_update?: string | null
          metadata?: Json | null
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      knowledge_base_files: {
        Row: {
          category: string | null
          content: string | null
          content_type: string
          created_at: string
          embedding: string | null
          embedding_status: string | null
          file_path: string
          filename: string
          fts: unknown | null
          id: string
          metadata: Json | null
          size: number
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          content_type: string
          created_at?: string
          embedding?: string | null
          embedding_status?: string | null
          file_path: string
          filename: string
          fts?: unknown | null
          id?: string
          metadata?: Json | null
          size: number
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          embedding?: string | null
          embedding_status?: string | null
          file_path?: string
          filename?: string
          fts?: unknown | null
          id?: string
          metadata?: Json | null
          size?: number
          user_id?: string
        }
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          order_info: Json | null
          read: boolean | null
          sender_name: string
          sender_number: string
          status: string
          user_id: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_info?: Json | null
          read?: boolean | null
          sender_name: string
          sender_number: string
          status: string
          user_id?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_info?: Json | null
          read?: boolean | null
          sender_name?: string
          sender_number?: string
          status?: string
          user_id?: string
          whatsapp_message_id?: string | null
        }
      }
      messenger_settings: {
        Row: {
          access_token: string
          created_at: string
          id: number
          page_id: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: number
          page_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: number
          page_id?: string
          updated_at?: string
        }
      }
      performance_metrics: {
        Row: {
          details: Json | null
          endpoint_name: string
          id: string
          response_time: number
          success: boolean
          timestamp: string | null
        }
        Insert: {
          details?: Json | null
          endpoint_name: string
          id?: string
          response_time: number
          success: boolean
          timestamp?: string | null
        }
        Update: {
          details?: Json | null
          endpoint_name?: string
          id?: string
          response_time?: number
          success?: boolean
          timestamp?: string | null
        }
      }
      platform_response_formats: {
        Row: {
          created_at: string | null
          format_type: string
          id: string
          platform: string
          template: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          format_type: string
          id?: string
          platform: string
          template: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          format_type?: string
          id?: string
          platform?: string
          template?: Json
          updated_at?: string | null
        }
      }
      platform_secrets: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          whatsapp_access_token: string | null
          whatsapp_phone_id: string | null
          whatsapp_verify_token: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          whatsapp_access_token?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_verify_token?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          whatsapp_access_token?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_verify_token?: string | null
        }
      }
      products: {
        Row: {
          created_at: string | null
          description: string
          discounts: number | null
          embedding: string | null
          embedding_status: string | null
          id: string
          price: number
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          discounts?: number | null
          embedding?: string | null
          embedding_status?: string | null
          id?: string
          price: number
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          discounts?: number | null
          embedding?: string | null
          embedding_status?: string | null
          id?: string
          price?: number
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          profile_url: string | null
          updated_at: string
          username: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          id: string
          profile_url?: string | null
          updated_at?: string
          username?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_url?: string | null
          updated_at?: string
          username?: string | null
          whatsapp_number?: string | null
        }
      }
      prompt_templates: {
        Row: {
          created_at: string | null
          effectiveness_score: number | null
          id: string
          intent_type: string
          is_active: boolean | null
          language: string | null
          name: string
          platform: string
          template: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          effectiveness_score?: number | null
          id?: string
          intent_type: string
          is_active?: boolean | null
          language?: string | null
          name: string
          platform: string
          template: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          effectiveness_score?: number | null
          id?: string
          intent_type?: string
          is_active?: boolean | null
          language?: string | null
          name?: string
          platform?: string
          template?: string
          updated_at?: string | null
          usage_count?: number | null
        }
      }
      sync_status: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          platform: string
          retry_count: number | null
          sync_status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          platform: string
          retry_count?: number | null
          sync_status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          platform?: string
          retry_count?: number | null
          sync_status?: string
          updated_at?: string | null
        }
      }
      system_logs: {
        Row: {
          component: string
          error_code: string | null
          id: string
          log_level: string
          message: string
          metadata: Json | null
          stack_trace: string | null
          timestamp: string | null
        }
        Insert: {
          component: string
          error_code?: string | null
          id?: string
          log_level: string
          message: string
          metadata?: Json | null
          stack_trace?: string | null
          timestamp?: string | null
        }
        Update: {
          component?: string
          error_code?: string | null
          id?: string
          log_level?: string
          message?: string
          metadata?: Json | null
          stack_trace?: string | null
          timestamp?: string | null
        }
      }
      ticket_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          id: number
          new_assigned_to: string | null
          new_status: string | null
          previous_assigned_to: string | null
          previous_status: string | null
          ticket_id: number | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          id?: number
          new_assigned_to?: string | null
          new_status?: string | null
          previous_assigned_to?: string | null
          previous_status?: string | null
          ticket_id?: number | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          id?: number
          new_assigned_to?: string | null
          new_status?: string | null
          previous_assigned_to?: string | null
          previous_status?: string | null
          ticket_id?: number | null
        }
      }
      ticket_messages: {
        Row: {
          created_at: string | null
          id: number
          message_id: string
          ticket_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          message_id: string
          ticket_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          message_id?: string
          ticket_id?: number
        }
      }
      tickets: {
        Row: {
          assigned_to: string | null
          body: string
          confidence_score: number | null
          confirmation_message_id: string | null
          context: string | null
          conversation_id: string | null
          created_at: string
          customer_name: string
          escalation_reason: string | null
          id: number
          intent_type: string | null
          last_updated_at: string | null
          order_status: string | null
          platform: string
          priority: string | null
          product_info: Json | null
          status: string
          title: string
          type: string
          user_id: string
          whatsapp_message_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          body: string
          confidence_score?: number | null
          confirmation_message_id?: string | null
          context?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_name: string
          escalation_reason?: string | null
          id?: number
          intent_type?: string | null
          last_updated_at?: string | null
          order_status?: string | null
          platform: string
          priority?: string | null
          product_info?: Json | null
          status?: string
          title: string
          type: string
          user_id?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          body?: string
          confidence_score?: number | null
          confirmation_message_id?: string | null
          context?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_name?: string
          escalation_reason?: string | null
          id?: number
          intent_type?: string | null
          last_updated_at?: string | null
          order_status?: string | null
          platform?: string
          priority?: string | null
          product_info?: Json | null
          status?: string
          title?: string
          type?: string
          user_id?: string
          whatsapp_message_id?: string | null
        }
      }
      usage_stats: {
        Row: {
          action_type: string
          details: Json | null
          feature_name: string
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          details?: Json | null
          feature_name: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          details?: Json | null
          feature_name?: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          ui_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ui_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ui_mode?: string | null
          updated_at?: string
          user_id?: string
        }
      }
      user_secrets: {
        Row: {
          created_at: string | null
          encrypted_value: string
          id: string
          secret_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_value: string
          id?: string
          secret_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_value?: string
          id?: string
          secret_type?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      webhook_errors: {
        Row: {
          created_at: string
          details: Json | null
          error_type: string
          id: string
          message: string
          notified: boolean | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          error_type: string
          id?: string
          message: string
          notified?: boolean | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          error_type?: string
          id?: string
          message?: string
          notified?: boolean | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
