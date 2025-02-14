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
          ai_enabled: boolean | null
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
          ai_enabled?: boolean | null
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
          ai_enabled?: boolean | null
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
          message_id: string | null
          order_status: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          priority: string | null
          product_info: Json | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          type: string
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
          message_id?: string | null
          order_status?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          priority?: string | null
          product_info?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          type: string
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
          message_id?: string | null
          order_status?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          priority?: string | null
          product_info?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
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
