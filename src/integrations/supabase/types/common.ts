
import { AgentTables } from './agents';
import { AiSettingsTables } from './ai-settings';
import { ConversationTables } from './conversations';
import { KnowledgeBaseTables } from './knowledge-base';
import { MessageTables } from './messages';
import { MessengerTables } from './messenger';
import { TicketTables } from './tickets';
import { DatabaseFunctions } from './database-functions';

export type Database = {
  public: {
    Tables: AgentTables &
      AiSettingsTables &
      ConversationTables &
      KnowledgeBaseTables &
      MessageTables &
      MessengerTables &
      TicketTables;
    Views: {
      [_ in never]: never;
    };
    Functions: DatabaseFunctions;
    Enums: {
      ai_model: "groq-llama-3.3-70b-versatile" | "gemini-2.0-flash-exp" | "deepseek-r1-distill-llama-70b";
      ai_tone: "Professional" | "Friendly" | "Empathetic" | "Playful";
      message_status: "sent" | "delivered" | "read" | "failed";
      platform: "whatsapp" | "facebook" | "instagram" | "telegram";
      ticket_status: "New" | "In Progress" | "Resolved" | "Closed";
      agent_type: "welcome" | "sales" | "knowledge" | "support";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type DatabaseEnums = Database['public']['Enums'];
