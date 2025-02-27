
import { useState } from "react";
import type { WhatsAppMessage } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { 
  saveMessageToDatabase, 
  sendWhatsAppMessage, 
  getWhatsAppSecrets 
} from "@/utils/messageOperations";

export const useMessageSending = (
  id: string | undefined,
  contactNumber: string | undefined,
  refetchMessages: () => void,
  isAIEnabled: boolean
) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (newMessage: string) => {
    if (!newMessage.trim() || !id || !contactNumber) return;
    
    setIsSending(true);
    try {
      // Get WhatsApp configuration
      const secrets = await getWhatsAppSecrets();

      // Save message to database
      const { error: dbError } = await saveMessageToDatabase(id, newMessage);
      if (dbError) throw dbError;

      // Send WhatsApp message
      const messagePayload: WhatsAppMessage = {
        to: contactNumber,
        message: newMessage,
        type: "text",
        useAI: isAIEnabled,
        phoneId: secrets.whatsapp_phone_id,
        accessToken: secrets.whatsapp_access_token,
        groqApiKey: secrets.groq_api_key // Add Groq API key
      };

      const { error: whatsappError } = await sendWhatsAppMessage(messagePayload);
      if (whatsappError) throw whatsappError;

      // Update UI
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
