
export type TicketType = 'SUPPORT' | 'REQUEST' | 'ORDER';
export type TicketStatus = 'New' | 'In Progress' | 'Escalated' | 'Completed';
export type Platform = 'whatsapp' | 'facebook' | 'instagram';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Ticket {
  id: number;
  title: string;
  customer_name: string;
  platform: Platform;
  type: string;
  status: TicketStatus;
  created_at: string;
  body: string;
  conversation_id?: string;
  intent_type?: TicketType;
  context?: string;
  confidence_score?: number;
  escalation_reason?: string;
  assigned_to?: string;
  priority?: TicketPriority;
  last_updated_at?: string;
  order_status?: string;
  confirmation_message_id?: string;
  whatsapp_message_id?: string;
}
