import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/types/ticket";
import { toast } from "sonner";

export const useRealtimeTickets = (
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>,
  sortConfig: { key: keyof Ticket; direction: 'asc' | 'desc' }
) => {
  useEffect(() => {
    console.log("Setting up real-time subscription for tickets");
    let channel: any = null;

    // Get the current user session
    const getCurrentUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error("No active session for real-time subscription");
          return null;
        }
        return session.user.id;
      } catch (error) {
        console.error("Error getting user session:", error);
        return null;
      }
    };

    getCurrentUserId().then(userId => {
      if (!userId) {
        console.log("No user ID found, skipping real-time subscription");
        return;
      }

      console.log("Setting up real-time subscription for user:", userId);

      // Clean up any existing channels first
      const existingChannels = supabase.getChannels();
      for (const existingChannel of existingChannels) {
        if (existingChannel.topic === 'tickets-changes') {
          console.log('Found existing channel, removing it first');
          supabase.removeChannel(existingChannel);
        }
      }

      try {
        channel = supabase
          .channel('tickets-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'tickets',
              filter: `user_id=eq.${userId} AND status=neq.Completed`
            },
            (payload) => {
              console.log("Received ticket INSERT:", payload);
              const newTicket = payload.new as Ticket;
              setTickets(currentTickets => {
                const updatedTickets = [newTicket, ...currentTickets];
                return sortTickets(updatedTickets, sortConfig);
              });
              toast.success('New ticket created');
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'tickets',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              console.log("Received ticket UPDATE:", payload);
              const updatedTicket = payload.new as Ticket;
              
              // If ticket is completed, remove it from the list
              if (updatedTicket.status === 'Completed') {
                setTickets(currentTickets => 
                  currentTickets.filter(ticket => ticket.id !== updatedTicket.id)
                );
                toast.info(`Ticket #${updatedTicket.id} marked as completed`);
              } else {
                // Otherwise update it in the list
                setTickets(currentTickets => {
                  const updatedTickets = currentTickets.map(ticket =>
                    ticket.id === updatedTicket.id ? updatedTicket : ticket
                  );
                  return sortTickets(updatedTickets, sortConfig);
                });
                toast.info(`Ticket #${updatedTicket.id} updated`);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'tickets',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              console.log("Received ticket DELETE:", payload);
              const deletedTicket = payload.old as Pick<Ticket, 'id'>;
              setTickets(currentTickets => 
                currentTickets.filter(ticket => ticket.id !== deletedTicket.id)
              );
              toast.info(`Ticket #${deletedTicket.id} deleted`);
            }
          )
          .subscribe((status) => {
            console.log("Realtime subscription status:", status);
            
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to tickets updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to connect to real-time updates');
            }
          });
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    });

    // Cleanup function
    return () => {
      console.log("Cleaning up tickets subscription");
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error("Error removing channel:", err);
        }
      }
    };
  }, [setTickets, sortConfig]);
};

// Helper function to sort tickets
const sortTickets = (
  tickets: Ticket[], 
  sortConfig: { key: keyof Ticket; direction: 'asc' | 'desc' }
): Ticket[] => {
  return [...tickets].sort((a, b) => {
    const modifier = sortConfig.direction === 'asc' ? 1 : -1;
    if (a[sortConfig.key] < b[sortConfig.key]) return -1 * modifier;
    if (a[sortConfig.key] > b[sortConfig.key]) return 1 * modifier;
    return 0;
  });
};
