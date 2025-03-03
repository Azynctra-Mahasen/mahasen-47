
export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          name: string;
          features: string[];
          created_at: string;
          type: string;
          system_role: string;
          updated_at: string;
          prompt: string;
        };
      };
      ai_settings: {
        Row: {
          id: number;
          model_name: string;
          use_mcp: boolean | null;
          behaviour: string | null;
          conversation_timeout_hours: number | null;
          tone: string;
          context_memory_length: number | null;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          contact_number: string;
          contact_name: string;
          platform: string;
          ai_enabled: boolean;
          created_at: string | null;
          updated_at: string | null;
          metadata: Record<string, any> | null;
          last_context_update: string | null;
          user_id: string;
        };
      };
      messages: {
        Row: {
          id: string;
          content: string;
          conversation_id: string | null;
          created_at: string | null;
          read: boolean | null;
          sender_name: string;
          sender_number: string;
          status: string;
          user_id: string;
          whatsapp_message_id: string | null;
          metadata: Record<string, any> | null;
          order_info: Record<string, any> | null;
        };
      };
      platform_secrets: {
        Row: {
          id: string;
          user_id: string;
          whatsapp_phone_id: string | null;
          whatsapp_verify_token: string | null;
          whatsapp_access_token: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      system_logs: {
        Row: {
          id: string;
          component: string;
          log_level: string;
          message: string;
          timestamp: string;
          metadata: Record<string, any> | null;
          error_code: string | null;
          stack_trace: string | null;
        };
      };
      tickets: {
        Row: {
          id: number;
          title: string;
          customer_name: string;
          body: string;
          platform: string;
          status: string;
          type: string;
          created_at: string;
          product_info: Record<string, any> | null;
          conversation_id: string | null;
          intent_type: string | null;
          context: string | null;
          escalation_reason: string | null;
          assigned_to: string | null;
          priority: string | null;
          order_status: string | null;
          confirmation_message_id: string | null;
          whatsapp_message_id: string | null;
          last_updated_at: string | null;
          confidence_score: number | null;
          user_id: string;
        };
      };
      webhook_errors: {
        Row: {
          id: string;
          error_type: string;
          message: string;
          details: Record<string, any> | null;
          created_at: string;
          notified: boolean | null;
        };
      };
    };
    Functions: {
      get_user_by_phone_number_id: {
        Args: {
          phone_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      platform: "whatsapp" | "facebook" | "instagram" | "telegram";
      message_status: "sent" | "delivered" | "read" | "failed";
      ticket_status: "New" | "In Progress" | "Resolved" | "Closed";
    };
  };
};
