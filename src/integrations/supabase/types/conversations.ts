
import { DatabaseEnums } from './common';

export type ConversationTables = {
  conversations: {
    Row: {
      ai_enabled: boolean | null;
      contact_name: string;
      contact_number: string;
      created_at: string | null;
      id: string;
      platform: DatabaseEnums["platform"];
      updated_at: string | null;
      user_id: string;
    };
    Insert: {
      ai_enabled?: boolean | null;
      contact_name: string;
      contact_number: string;
      created_at?: string | null;
      id?: string;
      platform: DatabaseEnums["platform"];
      updated_at?: string | null;
      user_id?: string;
    };
    Update: {
      ai_enabled?: boolean | null;
      contact_name?: string;
      contact_number?: string;
      created_at?: string | null;
      id?: string;
      platform?: DatabaseEnums["platform"];
      updated_at?: string | null;
      user_id?: string;
    };
    Relationships: [];
  };
};
