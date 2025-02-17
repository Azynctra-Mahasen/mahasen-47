
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

export const useConversation = (id: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversation, refetch: refetchConversation } = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      if (!id) throw new Error("Conversation ID is required");

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Conversation;
    },
    enabled: !!id,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      if (!id) throw new Error("Conversation ID is required");

      console.log("Fetching messages for conversation:", id);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      console.log("Fetched messages:", data);
      return data as Message[];
    },
    enabled: !!id,
    staleTime: 0, // Always fetch fresh data
  });

  const updateAIEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!id) throw new Error("Conversation ID is required");

      const { error } = await supabase
        .from("conversations")
        .update({ ai_enabled: enabled })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      toast({
        title: "AI Assistant Updated",
        description: `AI Assistant has been ${enabled ? 'enabled' : 'disabled'} for this chat.`,
      });
    },
    onError: (error) => {
      console.error("Error updating AI enabled state:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update AI Assistant state",
      });
    },
  });

  const clearMessages = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Conversation ID is required");

      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      toast({
        title: "Success",
        description: "Chat history cleared successfully",
      });
    },
    onError: (error) => {
      console.error("Error clearing messages:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear chat history",
      });
    },
  });

  return {
    conversation,
    messages,
    refetchMessages,
    updateAIEnabled,
    clearMessages,
  };
};
