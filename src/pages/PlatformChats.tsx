
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ConversationCard } from "@/components/platform-chats/ConversationCard";
import { useConversations } from "@/hooks/useConversations";
import { useMessageUpdates } from "@/hooks/useMessageUpdates";
import { isValidPlatform } from "@/types/platform";

const PlatformChats = () => {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Set up real-time subscription for message updates
  useMessageUpdates(isValidPlatform(platform) ? platform : undefined);

  const { data: conversations, isLoading } = useConversations(
    isValidPlatform(platform) ? platform : undefined
  );

  const handleChatClick = async (conversationId: string) => {
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
        <div className="flex items-center mb-6">
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformChats;
