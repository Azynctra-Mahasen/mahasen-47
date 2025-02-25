
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ConversationCard } from "@/components/platform-chats/ConversationCard";
import { useConversations } from "@/hooks/useConversations";
import { useMessageUpdates } from "@/hooks/useMessageUpdates";
import { isValidPlatform } from "@/types/platform";
import { useState } from "react";
import { toast } from "sonner";

const PlatformChats = () => {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Set up real-time subscription for message updates
  useMessageUpdates(isValidPlatform(platform) ? platform : undefined);

  const { data: conversations, isLoading } = useConversations(
    isValidPlatform(platform) ? platform : undefined
  );

  const handleChatClick = async (conversationId: string) => {
    if (isSelectionMode) return;
    
    try {
      // Mark all messages as read when entering the chat
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .eq("status", "received")
        .eq("read", false);

      if (error) {
        console.error("Error marking messages as read:", error);
      }

      // Immediately invalidate the conversations query to update UI
      queryClient.invalidateQueries({ 
        queryKey: ["conversations", platform],
        exact: true
      });

      // Navigate to the chat
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error in handleChatClick:", error);
    }
  };

  const toggleConversationSelection = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedConversations);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedConversations(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (selectedConversations.size === 0) return;

    try {
      // Delete messages first
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .in("conversation_id", Array.from(selectedConversations));

      if (messagesError) throw messagesError;

      // Then delete conversations
      const { error: conversationsError } = await supabase
        .from("conversations")
        .delete()
        .in("id", Array.from(selectedConversations));

      if (conversationsError) throw conversationsError;

      // Reset selection mode and selected conversations
      setIsSelectionMode(false);
      setSelectedConversations(new Set());

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: ["conversations", platform],
        exact: true
      });

      toast.success(`Successfully deleted ${selectedConversations.size} conversation(s)`);
    } catch (error) {
      console.error("Error deleting conversations:", error);
      toast.error("Failed to delete conversations");
    }
  };

  if (!isValidPlatform(platform)) {
    return (
      <div className="min-h-screen bg-[#F1F0FB] dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              className="mr-4"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-red-600">Invalid Platform</h1>
          </div>
          <p>The specified platform is not valid. Please select a valid platform from the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F0FB] dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="secondary"
              className="mr-4 hover:bg-slate-200 dark:hover:bg-slate-700"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold capitalize">{platform} Chats</h1>
          </div>
          <div className="flex gap-2">
            {conversations?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedConversations(new Set());
                }}
              >
                {isSelectionMode ? "Cancel Selection" : "Select Chats"}
              </Button>
            )}
            {isSelectionMode && selectedConversations.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedConversations.size})
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading conversations...</div>
        ) : conversations?.length === 0 ? (
          <div className="text-center py-8">No conversations found</div>
        ) : (
          <div className="grid gap-4">
            {conversations?.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                {...conversation}
                onClick={() => handleChatClick(conversation.id)}
                onSelect={toggleConversationSelection}
                isSelected={selectedConversations.has(conversation.id)}
                selectionMode={isSelectionMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformChats;
