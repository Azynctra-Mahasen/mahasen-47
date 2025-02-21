export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          type: Database["public"]["Enums"]["agent_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: string[]
          id?: string
          name: string
          prompt: string
          system_role: string
          type: Database["public"]["Enums"]["agent_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: string[]
          id?: string
          name?: string
          prompt?: string
          system_role?: string
          type?: Database["public"]["Enums"]["agent_type"]
          updated_at?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          behaviour: string | null
          context_memory_length: number | null
          conversation_timeout_hours: number | null
          created_at: string
          id: number
          model_name: Database["public"]["Enums"]["ai_model"]
          tone: Database["public"]["Enums"]["ai_tone"]
          updated_at: string
          use_mcp: boolean | null
        }
        Insert: {
          behaviour?: string | null
          context_memory_length?: number | null
          conversation_timeout_hours?: number | null
          created_at?: string
          id?: number
          model_name?: Database["public"]["Enums"]["ai_model"]
          tone?: Database["public"]["Enums"]["ai_tone"]
          updated_at?: string
          use_mcp?: boolean | null
        }
        Update: {
          behaviour?: string | null
          context_memory_length?: number | null
          conversation_timeout_hours?: number | null
          created_at?: string
          id?: number
          model_name?: Database["public"]["Enums"]["ai_model"]
          tone?: Database["public"]["Enums"]["ai_tone"]
          updated_at?: string
          use_mcp?: boolean | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "context_tracking_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "conversation_contexts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
          platform: Database["public"]["Enums"]["platform_type"]
          updated_at: string | null
        }
        Insert: {
          ai_enabled?: boolean
          contact_name: string
          contact_number: string
          created_at?: string | null
          id?: string
          last_context_update?: string | null
          metadata?: Json | null
          platform: Database["public"]["Enums"]["platform_type"]
          updated_at?: string | null
        }
        Update: {
          ai_enabled?: boolean
          contact_name?: string
          contact_number?: string
          created_at?: string | null
          id?: string
          last_context_update?: string | null
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["platform_type"]
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
          status: Database["public"]["Enums"]["message_status"]
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
          status: Database["public"]["Enums"]["message_status"]
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
          status?: Database["public"]["Enums"]["message_status"]
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "ticket_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "ticket_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
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
          platform: Database["public"]["Enums"]["platform_type"]
          priority: string | null
          product_info: Json | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          type: string
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
          platform: Database["public"]["Enums"]["platform_type"]
          priority?: string | null
          product_info?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          type: string
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
          platform?: Database["public"]["Enums"]["platform_type"]
          priority?: string | null
          product_info?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          type?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          ui_mode: Database["public"]["Enums"]["ui_mode"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ui_mode?: Database["public"]["Enums"]["ui_mode"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ui_mode?: Database["public"]["Enums"]["ui_mode"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      decrypted_user_secrets: {
        Row: {
          created_at: string | null
          id: string | null
          secret_type: string | null
          secret_value: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          secret_type?: string | null
          secret_value?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          secret_type?: string | null
          secret_value?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      error_summary: {
        Row: {
          component: string | null
          error_count: number | null
          log_level: string | null
          time_bucket: string | null
        }
        Relationships: []
      }
      error_trends: {
        Row: {
          affected_components: number | null
          change_percentage: number | null
          day: string | null
          error_count: number | null
          log_level: string | null
        }
        Relationships: []
      }
      performance_summary: {
        Row: {
          avg_response_time: number | null
          endpoint_name: string | null
          max_response_time: number | null
          min_response_time: number | null
          success_rate: number | null
          successful_requests: number | null
          time_bucket: string | null
          total_requests: number | null
        }
        Relationships: []
      }
      usage_summary: {
        Row: {
          action_type: string | null
          day: string | null
          feature_name: string | null
          unique_users: number | null
          usage_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrypt_secret: {
        Args: {
          encrypted_secret: string
        }
        Returns: string
      }
      encrypt_secret: {
        Args: {
          secret: string
        }
        Returns: string
      }
      match_knowledge_base: {
        Args: {
          query_text: string
          query_embedding: string
          match_count?: number
          full_text_weight?: number
          semantic_weight?: number
          match_threshold?: number
          rrf_k?: number
        }
        Returns: {
          id: string
          content: string
          similarity: number
        }[]
      }
      match_knowledge_base_and_products: {
        Args: {
          query_text: string
          query_embedding: string
          match_count?: number
          full_text_weight?: number
          semantic_weight?: number
          match_threshold?: number
          rrf_k?: number
        }
        Returns: {
          id: string
          content: string
          similarity: number
          source: string
          metadata: Json
        }[]
      }
      store_user_secret: {
        Args: {
          p_user_id: string
          p_secret_type: string
          p_secret_value: string
        }
        Returns: string
      }
    }
    Enums: {
      agent_type: "welcome" | "sales" | "knowledge" | "support"
      ai_model:
        | "deepseek-r1-distill-llama-70b"
        | "gemini-2.0-flash-exp"
        | "groq-llama-3.3-70b-versatile"
      ai_tone: "Professional" | "Friendly" | "Empathetic" | "Playful"
      message_status: "sent" | "received"
      platform_type: "whatsapp" | "facebook" | "instagram"
      ticket_status: "New" | "In Progress" | "Escalated" | "Completed"
      ui_mode: "dev" | "full"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
