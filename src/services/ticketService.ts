import { supabase } from "@/integrations/supabase/client";
import { Platform, Ticket, TicketPriority, TicketStatus, TicketType } from "@/types/ticket";
import { toast } from "@/hooks/use-toast";

interface CreateTicketParams {
  title: string;
  customerName: string;
  platform: Platform;
  type: string;
  body: string;
  messageId?: string;
  conversationId?: string;
  intentType?: TicketType;
  context?: string;
  confidenceScore?: number;
  escalationReason?: string;
  priority?: TicketPriority;
}

interface UpdateTicketStatusParams {
  ticketId: number;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  changedBy: string;
}

interface UpdateTicketAssignmentParams {
  ticketId: number;
  previousAssignedTo?: string;
  newAssignedTo: string;
  changedBy: string;
}

export class TicketService {
  static async createTicket(params: CreateTicketParams): Promise<Ticket> {
    console.log('TicketService: Starting ticket creation with params:', params);

    try {
      const ticketData = {
        title: params.title,
        customer_name: params.customerName,
        platform: params.platform,
        type: params.type,
        body: params.body,
        message_id: params.messageId,
        conversation_id: params.conversationId,
        intent_type: params.intentType || 'SUPPORT',
        context: params.context,
        confidence_score: params.confidenceScore,
        escalation_reason: params.escalationReason,
        priority: params.priority || 'LOW',
        status: 'New' as TicketStatus
      };

      console.log('TicketService: Attempting database insertion with:', ticketData);

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (ticketError) {
        console.error('TicketService: Database insertion error:', ticketError);
        toast({
          variant: "destructive",
          title: "Ticket Creation Failed",
          description: ticketError.message,
        });
        throw ticketError;
      }

      if (!ticket) {
        const error = new Error('No ticket data returned after creation');
        console.error('TicketService:', error);
        toast({
          variant: "destructive",
          title: "Ticket Creation Failed",
          description: "No ticket data returned after creation",
        });
        throw error;
      }

      console.log('TicketService: Successfully created ticket:', ticket);

      // Create ticket history entry
      await this.createTicketHistory({
        ticketId: ticket.id,
        action: 'Ticket Created',
        newStatus: 'New',
        changedBy: 'System'
      });

      return ticket as Ticket;
    } catch (error) {
      console.error('TicketService: Failed to create ticket:', error);
      throw error;
    }
  }

  static async updateTicketStatus(params: UpdateTicketStatusParams): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          status: params.newStatus,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', params.ticketId);

      if (updateError) throw updateError;

      await this.createTicketHistory({
        ticketId: params.ticketId,
        action: 'Status Update',
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        changedBy: params.changedBy
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  static async updateTicketAssignment(params: UpdateTicketAssignmentParams): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: params.newAssignedTo,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', params.ticketId);

      if (updateError) throw updateError;

      await this.createTicketHistory({
        ticketId: params.ticketId,
        action: 'Assignment Update',
        previousAssignedTo: params.previousAssignedTo,
        newAssignedTo: params.newAssignedTo,
        changedBy: params.changedBy
      });
    } catch (error) {
      console.error('Error updating ticket assignment:', error);
      throw error;
    }
  }

  private static async createTicketHistory(params: {
    ticketId: number;
    action: string;
    previousStatus?: TicketStatus;
    newStatus?: TicketStatus;
    previousAssignedTo?: string;
    newAssignedTo?: string;
    changedBy: string;
  }): Promise<void> {
    try {
      const { error: historyError } = await supabase
        .from('ticket_history')
        .insert({
          ticket_id: params.ticketId,
          action: params.action,
          previous_status: params.previousStatus,
          new_status: params.newStatus,
          previous_assigned_to: params.previousAssignedTo,
          new_assigned_to: params.newAssignedTo,
          changed_by: params.changedBy
        });

      if (historyError) throw historyError;
    } catch (error) {
      console.error('Error creating ticket history:', error);
      throw error;
    }
  }
}