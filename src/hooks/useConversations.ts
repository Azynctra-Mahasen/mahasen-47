
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Platform } from "@/types/platform";

export const useConversations = (platform: Platform | undefined) => {
  return useQuery({
    queryKey: ["conversations", platform],
    queryFn: async () => {
      if (!platform) {
        throw new Error("Invalid platform specified");
      }

      const { data: conversationsData, error: conversationsError } = await supabase
        .from("conversations")
        .select(`
          *,
          messages:messages (
            created_at,
            read,
            status
          )
        `)
        .eq("platform", platform);

      if (conversationsError) throw conversationsError;

      // Process the conversations to include latest message time and unread status
      const processedConversations = conversationsData.map(conversation => {
        const messages = conversation.messages || [];
        const latestMessage = messages.reduce((latest: any, current: any) => {
          return !latest || new Date(current.created_at) > new Date(latest.created_at)
            ? current
            : latest;
        }, null);

        // Check for unread messages that are received (from user)
        const hasUnread = messages.some((msg: any) => !msg.read && msg.status === 'received');

        return {
          ...conversation,
          has_unread: hasUnread,
          latest_message_time: latestMessage ? latestMessage.created_at : conversation.created_at
        };
      });

      // Sort by latest message time
      return processedConversations.sort((a, b) => 
        new Date(b.latest_message_time).getTime() - new Date(a.latest_message_time).getTime()
      );
    },
    refetchOnWindowFocus: true,
  });
};
