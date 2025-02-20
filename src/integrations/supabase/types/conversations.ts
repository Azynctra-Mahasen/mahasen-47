
import { DatabaseEnums } from './common';

export type ConversationTables = {
  conversations: {
    Row: {
      ai_enabled: boolean;
      contact_name: string;
      contact_number: string;
      created_at: string | null;
      id: string;
      platform: DatabaseEnums["platform"];
      updated_at: string | null;
    };
    Insert: {
      ai_enabled?: boolean;
      contact_name: string;
      contact_number: string;
      created_at?: string | null;
      id?: string;
      platform: DatabaseEnums["platform"];
      updated_at?: string | null;
    };
    Update: {
      ai_enabled?: boolean;
      contact_name?: string;
      contact_number?: string;
      created_at?: string | null;
      id?: string;
      platform?: DatabaseEnums["platform"];
      updated_at?: string | null;
    };
    Relationships: [];
  };
};
