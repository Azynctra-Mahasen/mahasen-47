
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTicketHistory = (ticketId: number | null) => {
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);

  const fetchTicketHistory = async () => {
    if (!ticketId) return;

    try {
      const { data, error } = await supabase
        .from('ticket_history')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTicketHistory(data || []);
    } catch (error) {
      console.error('Error fetching ticket history:', error);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketHistory();
    }
  }, [ticketId]);

  return {
    ticketHistory,
    fetchTicketHistory
  };
};
