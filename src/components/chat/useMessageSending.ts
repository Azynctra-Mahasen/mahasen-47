
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsAppMessage } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { useIntentDetection } from "@/hooks/useIntentDetection";
import { TicketService } from "@/services/ticketService";
import { AutomatedTicketService } from "@/services/automatedTicketService";

export const useMessageSending = (
  id: string | undefined,
  contactNumber: string | undefined,
  refetchMessages: () => void,
  isAIEnabled: boolean
) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { analyzeMessage } = useIntentDetection();

  const sendMessage = async (newMessage: string) => {
    if (!newMessage.trim() || !id || !contactNumber) return;
    
    setIsSending(true);
    try {
      // Store message in database
      const { data: messageData, error: dbError } = await supabase
        .from("messages")
        .insert({
          conversation_id: id,
          content: newMessage,
          status: "sent",
          sender_name: "Agent",
          sender_number: "system",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Get conversation data
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .single();

      if (convError) throw convError;

      // Send WhatsApp message
      const messagePayload: WhatsAppMessage = {
        to: contactNumber,
        message: newMessage,
        type: "text",
        useAI: false
      };

      const { error: whatsappError } = await supabase.functions.invoke(
        'send-whatsapp',
        {
          body: messagePayload,
        }
      );

      if (whatsappError) throw whatsappError;

      refetchMessages();
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error in message sending process:", error);
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendMessage,
    isSending,
  };
};
