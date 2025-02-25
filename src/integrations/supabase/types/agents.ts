
import { DatabaseEnums } from './common';

export type AgentTables = {
  agents: {
    Row: {
      created_at: string;
      features: string[];
      id: string;
      name: string;
      prompt: string;
      system_role: string;
      type: DatabaseEnums["agent_type"];
      updated_at: string;
    };
    Insert: {
      created_at?: string;
      features?: string[];
      id?: string;
      name: string;
      prompt: string;
      system_role: string;
      type: DatabaseEnums["agent_type"];
      updated_at?: string;
    };
    Update: {
      created_at?: string;
      features?: string[];
      id?: string;
      name?: string;
      prompt?: string;
      system_role?: string;
      type?: DatabaseEnums["agent_type"];
      updated_at?: string;
    };
    Relationships: [];
  };
};
