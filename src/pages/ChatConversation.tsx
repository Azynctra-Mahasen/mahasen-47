
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageInput } from "@/components/chat/MessageInput";
import { Messages } from "@/components/chat/Messages";
import { ScrollButton } from "@/components/chat/ScrollButton";
import { ClearChatDialog } from "@/components/chat/ClearChatDialog";
import { useConversation } from "@/components/chat/useConversation";
import { useMessageSending } from "@/components/chat/useMessageSending";
import { useRealtimeMessages } from "@/components/chat/useRealtimeMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ChatConversation = () => {
  const { id } = useParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState("");
  const [isAIEnabled, setIsAIEnabled] = useState<boolean | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { conversation, messages, refetchMessages, updateAIEnabled } = useConversation(id);
  const { sendMessage, isSending } = useMessageSending(
    id,
    conversation?.contact_number,
    refetchMessages,
    isAIEnabled ?? true
  );

  useRealtimeMessages(id, refetchMessages);

  useEffect(() => {
    if (conversation?.ai_enabled !== undefined && isAIEnabled === null) {
      console.log('Setting AI enabled state from conversation:', conversation.ai_enabled);
      setIsAIEnabled(conversation.ai_enabled);
    }
  }, [conversation?.ai_enabled, isAIEnabled]);

  useEffect(() => {
    if (messages?.length) {
      scrollToBottom();
      setIsCleared(false);
    }
  }, [messages]);

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

  const handleClearChat = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);

      if (error) throw error;

      refetchMessages();
      setIsCleared(true);
      toast.success("Chat history cleared successfully");
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error("Failed to clear chat history");
    }
  };

  if (!id) {
    return <div>Invalid conversation ID</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col relative">
      <div className="fixed top-0 left-0 right-0 z-10">
        <ChatHeader
          contactName={conversation?.contact_name}
          platform={conversation?.platform}
          isAIEnabled={isAIEnabled ?? true}
          onAIToggle={handleAIToggle}
        >
          <ClearChatDialog onClear={handleClearChat} />
        </ChatHeader>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 mt-16 mb-24"
      >
        <Messages messages={messages} isCleared={isCleared} />
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && <ScrollButton onClick={scrollToBottom} />}

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
