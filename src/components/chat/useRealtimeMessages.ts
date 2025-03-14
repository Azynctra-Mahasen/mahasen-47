
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";

export const useRealtimeMessages = (
  id: string | undefined,
  refetchMessages: () => void
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;

    console.log("Setting up real-time subscription for conversation:", id);
    let channel: RealtimeChannel | null = null;

    // Get the current user session
    const setupChannel = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session, skipping real-time subscription');
        return null;
      }
      const userId = session.user.id;

      // Check for existing channel with this ID and remove it
      const existingChannel = supabase.getChannels().find(ch => ch.topic === `messages:${id}`);
      if (existingChannel) {
        console.log('Found existing channel, removing it first');
        supabase.removeChannel(existingChannel);
      }

      try {
        channel = supabase
          .channel(`messages:${id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${id}` // Corrected filter syntax
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
        
        return channel;
      } catch (err) {
        console.error("Error setting up realtime subscription:", err);
        return null;
      }
    };
    
    const channelPromise = setupChannel();

    // Mark messages as read when entering the chat
    const markMessagesAsRead = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

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
      channelPromise.then(ch => {
        if (ch) {
          try {
            supabase.removeChannel(ch);
          } catch (err) {
            console.error("Error removing channel:", err);
          }
        }
      });
    };
  }, [id, queryClient, refetchMessages]);
};
