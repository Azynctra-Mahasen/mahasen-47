
import { DatabaseEnums } from './common';

export type TicketTables = {
  tickets: {
    Row: {
      body: string;
      created_at: string;
      customer_name: string;
      id: number;
      platform: DatabaseEnums["platform"];
      type: string;
      status: DatabaseEnums["ticket_status"];
      title: string;
    };
    Insert: {
      body: string;
      created_at?: string;
      customer_name: string;
      id?: number;
      platform: DatabaseEnums["platform"];
      status?: DatabaseEnums["ticket_status"];
      title: string;
      type: string;
    };
    Update: {
      body?: string;
      created_at?: string;
      customer_name?: string;
      id?: number;
      platform?: DatabaseEnums["platform"];
      status?: DatabaseEnums["ticket_status"];
      title?: string;
      type?: string;
    };
    Relationships: [];
  };
};
