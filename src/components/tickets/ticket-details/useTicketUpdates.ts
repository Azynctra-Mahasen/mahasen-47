
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Ticket, TicketPriority } from "@/types/ticket";

export const useTicketUpdates = (ticket: Ticket | null, onClose: () => void) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: Ticket["status"]) => {
    if (!ticket) {
      toast({
        title: "Error",
        description: "No ticket selected",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
          status: newStatus,
          last_updated_at: new Date().toISOString()
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ticket_history')
        .insert({
          ticket_id: ticket.id,
          action: 'Status Update',
          previous_status: ticket.status,
          new_status: newStatus,
          changed_by: 'Agent'
        });

      if (historyError) throw historyError;
      
      toast({
        title: "Status updated",
        description: `Ticket status changed to ${newStatus}`,
      });

      // Removed the redirection logic, just close the dialog
      if (newStatus === 'Completed') {
        onClose();
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignmentChange = async (newAssignedTo: string) => {
    if (!ticket) {
      toast({
        title: "Error",
        description: "No ticket selected",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
          assigned_to: newAssignedTo,
          last_updated_at: new Date().toISOString()
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ticket_history')
        .insert({
          ticket_id: ticket.id,
          action: 'Assignment Update',
          previous_assigned_to: ticket.assigned_to,
          new_assigned_to: newAssignedTo,
          changed_by: 'Agent'
        });

      if (historyError) throw historyError;
      
      toast({
        title: "Assignment updated",
        description: `Ticket assigned to ${newAssignedTo}`,
      });
    } catch (error) {
      console.error("Error updating ticket assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket assignment",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) {
      toast({
        title: "Error",
        description: "No ticket selected",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
          priority: newPriority,
          last_updated_at: new Date().toISOString()
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ticket_history')
        .insert({
          ticket_id: ticket.id,
          action: 'Priority Update',
          previous_status: ticket.priority,
          new_status: newPriority,
          changed_by: 'Agent'
        });

      if (historyError) throw historyError;
      
      toast({
        title: "Priority updated",
        description: `Ticket priority changed to ${newPriority}`,
      });
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket priority",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    handleStatusChange,
    handleAssignmentChange,
    handlePriorityChange
  };
};

