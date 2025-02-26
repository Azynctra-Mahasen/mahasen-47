
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
    if (!newMessage.trim() || !id || !contactNumber) {
      console.error("Missing required data:", { id, contactNumber, messageLength: newMessage.length });
      return;
    }
    
    setIsSending(true);
    try {
      console.log("Starting message send process...");
      
      // Get WhatsApp configuration
      const secrets = await getWhatsAppSecrets();
      console.log("WhatsApp secrets retrieved successfully");

      // Save message to database
      const { error: dbError } = await saveMessageToDatabase(id, newMessage);
      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }
      console.log("Message saved to database successfully");

      // Send WhatsApp message
      const messagePayload: WhatsAppMessage = {
        to: contactNumber,
        message: newMessage,
        type: "text",
        useAI: false,
        phoneId: secrets.whatsapp_phone_id,
        accessToken: secrets.whatsapp_access_token
      };

      console.log("Sending WhatsApp message with payload:", {
        to: messagePayload.to,
        type: messagePayload.type,
        useAI: messagePayload.useAI,
        phoneId: messagePayload.phoneId ? "Set" : "Missing"
      });

      const { error: whatsappError } = await sendWhatsAppMessage(messagePayload);
      if (whatsappError) {
        console.error("WhatsApp sending error:", whatsappError);
        throw whatsappError;
      }
      console.log("WhatsApp message sent successfully");

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
