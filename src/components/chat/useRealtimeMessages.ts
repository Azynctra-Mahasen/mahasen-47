
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useRealtimeMessages = (
  id: string | undefined,
  refetchMessages: () => void
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;

    console.log("Setting up real-time subscription for conversation:", id);

    // Single channel subscription
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`
        },
        (payload) => {
          console.log("Received real-time update:", payload);
          // Always refetch messages to ensure consistency
          refetchMessages();
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Failed to connect to real-time updates');
          toast.error('Failed to connect to real-time updates');
        }
      });

    // Mark messages as read when entering the chat
    const markMessagesAsRead = async () => {
      try {
        const { error } = await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", id)
          .eq("status", "received")
          .eq("read", false);

        if (error) {
          console.error("Error marking messages as read:", error);
        }
      } catch (error) {
        console.error("Error in markMessagesAsRead:", error);
      }
    };

    markMessagesAsRead();

    return () => {
      console.log("Cleaning up subscription for conversation:", id);
      supabase.removeChannel(channel);
    };
  }, [id, refetchMessages]);
};
