import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageInput } from "@/components/chat/MessageInput";
import { useConversation } from "@/components/chat/useConversation";
import { useMessageSending } from "@/components/chat/useMessageSending";
import { useRealtimeMessages } from "@/components/chat/useRealtimeMessages";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ChatConversation = () => {
  const { id } = useParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState("");
  const [isAIEnabled, setIsAIEnabled] = useState<boolean | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { conversation, messages, refetchMessages, updateAIEnabled } = useConversation(id);
  const { sendMessage, isSending } = useMessageSending(
    id,
    conversation?.contact_number,
    refetchMessages,
    isAIEnabled ?? true
  );

  // Set up realtime subscription
  useRealtimeMessages(id, refetchMessages);

  // Initialize AI state from conversation data
  useEffect(() => {
    if (conversation?.ai_enabled !== undefined && isAIEnabled === null) {
      console.log('Setting AI enabled state from conversation:', conversation.ai_enabled);
      setIsAIEnabled(conversation.ai_enabled);
    }
  }, [conversation?.ai_enabled, isAIEnabled]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages?.length) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle scroll button visibility
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAIToggle = async (enabled: boolean) => {
    console.log('Toggling AI state to:', enabled);
    setIsAIEnabled(enabled);
    updateAIEnabled.mutate(enabled);
  };

  const handleSendMessage = async () => {
    await sendMessage(newMessage);
    setNewMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!id) {
    return <div>Invalid conversation ID</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col relative">
      <ChatHeader
        contactName={conversation?.contact_name}
        platform={conversation?.platform}
        isAIEnabled={isAIEnabled ?? true}
        onAIToggle={handleAIToggle}
      />

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 mt-16 mb-24"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.status === "sent" ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={cn(
                  "max-w-[80%]",
                  message.status === "sent" 
                    ? message.sender_name === "AI Assistant"
                      ? "bg-[#3FA2F6] text-white" // Updated color for AI Assistant
                      : "bg-[#96C9F4] text-white" // Updated color for Agent
                    : "dark:bg-slate-800 dark:text-white"
                )}
              >
                <CardContent className="p-3">
                  <div className="text-sm font-medium mb-1">
                    {message.sender_name}
                  </div>
                  <div className="text-sm whitespace-pre-line">
                    {message.content}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-32 right-4 rounded-full shadow-lg z-50 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700"
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      <MessageInput
        newMessage={newMessage}
        isSending={isSending}
        onMessageChange={setNewMessage}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatConversation;