
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

    // Check for existing channel with this ID
    const existingChannel = supabase.getChannels().find(ch => ch.topic === `messages:${id}`);
    if (existingChannel) {
      console.log('Found existing channel, removing it first');
      supabase.removeChannel(existingChannel);
    }

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
        async (payload) => {
          console.log("Received real-time update:", payload);
          
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(
              ['messages', id],
              (oldData: any[] | undefined) => {
                if (!oldData) {
                  // If cache is empty, trigger a refetch instead of replacing
                  refetchMessages();
                  return [];
                }
                // Only add if message doesn't already exist
                const messageExists = oldData.some(msg => msg.id === payload.new.id);
                if (!messageExists) {
                  if (payload.new.status === 'received') {
                    toast.success('New message received');
                  }
                  // Ensure proper ordering by timestamp
                  const newData = [...oldData, payload.new];
                  return newData.sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );
                }
                return oldData;
              }
            );
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(
              ['messages', id],
              (oldData: any[] | undefined) => {
                if (!oldData) {
                  refetchMessages();
                  return [];
                }
                const updatedData = oldData.map(msg => 
                  msg.id === payload.new.id ? payload.new : msg
                );
                return updatedData.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              }
            );
            if (payload.old.read === false && payload.new.read === true) {
              console.log('Message marked as read:', payload.new.id);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
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

    // Cleanup function
    return () => {
      console.log("Cleaning up subscription for conversation:", id);
      supabase.removeChannel(channel);
    };
  }, [id, queryClient, refetchMessages]);
};
