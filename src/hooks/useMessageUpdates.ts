
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Platform } from "@/types/platform";

export const useMessageUpdates = (platform: Platform | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!platform) return;

    console.log('Setting up real-time subscription for messages');

    // Get the current user session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session, skipping real-time subscription');
        return null;
      }
      return session.user.id;
    };

    checkSession().then(userId => {
      if (!userId) return;

      // First, check if a channel with this name already exists and remove it
      const existingChannel = supabase.getChannels().find(ch => ch.topic === 'messages-updates');
      if (existingChannel) {
        console.log('Found existing channel, removing it first');
        supabase.removeChannel(existingChannel);
      }

      const channel = supabase
        .channel('messages-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `user_id=eq.${userId}` // This filter syntax is correct
          },
          (payload) => {
            console.log('Received real-time update:', payload);
            
            // Immediately invalidate and refetch conversations
            queryClient.invalidateQueries({ 
              queryKey: ["conversations", platform],
              exact: true
            });

            // Show notification for new messages
            if (payload.eventType === 'INSERT' && payload.new.status === 'received') {
              toast.success(`New message from ${payload.new.sender_name}`);
            }
          }
        )
        .subscribe((status) => {
          console.log("Subscription status:", status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to messages updates');
          }
        });

      // Cleanup function
      return () => {
        console.log("Cleaning up subscription");
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    });

    return () => {
      console.log("Cleaning up subscription setup");
    };
  }, [platform, queryClient]);
};
