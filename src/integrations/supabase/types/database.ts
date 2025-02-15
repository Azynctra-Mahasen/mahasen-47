
import { AgentTables } from './agents';
import { AiSettingsTables } from './ai-settings';
import { ConversationTables } from './conversations';
import { KnowledgeBaseTables } from './knowledge-base';
import { MessageTables } from './messages';
import { MessengerTables } from './messenger';
import { TicketTables } from './tickets';
import { DatabaseEnums } from './common';

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
    Functions: {
      [_ in never]: never;
    };
    Enums: DatabaseEnums;
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;
