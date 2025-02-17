
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
      product_info?: Record<string, any>;
      last_updated_at?: string;
      confidence_score?: number;
      conversation_id?: string;
      intent_type?: string;
      context?: string;
      escalation_reason?: string;
      assigned_to?: string;
      priority?: string;
      order_status?: string;
      confirmation_message_id?: string;
      whatsapp_message_id?: string;
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
      product_info?: Record<string, any>;
      conversation_id?: string;
      intent_type?: string;
      context?: string;
      escalation_reason?: string;
      priority?: string;
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
      product_info?: Record<string, any>;
      last_updated_at?: string;
      conversation_id?: string;
      intent_type?: string;
      context?: string;
      escalation_reason?: string;
      assigned_to?: string;
      priority?: string;
      order_status?: string;
      confirmation_message_id?: string;
      whatsapp_message_id?: string;
    };
    Relationships: [];
  };
  ticket_messages: {
    Row: {
      id: number;
      ticket_id: number;
      message_id: string;
      created_at: string;
    };
    Insert: {
      ticket_id: number;
      message_id: string;
      created_at?: string;
    };
    Update: {
      ticket_id?: number;
      message_id?: string;
      created_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "ticket_messages_ticket_id_fkey";
        columns: ["ticket_id"];
        isOneToOne: false;
        referencedRelation: "tickets";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "ticket_messages_message_id_fkey";
        columns: ["message_id"];
        isOneToOne: false;
        referencedRelation: "messages";
        referencedColumns: ["id"];
      }
    ];
  };
};
