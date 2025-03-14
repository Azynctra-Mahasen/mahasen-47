
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
      // Step 1: Get WhatsApp configuration
      const secrets = await getWhatsAppSecrets();
      console.log("Retrieved WhatsApp secrets successfully");

      // Step 2: Save message to database
      const { data: savedMessage, error: dbError } = await saveMessageToDatabase(id, newMessage);
      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to save message: " + dbError.message);
      }
      console.log("Message saved to database successfully");

      // Step 3: Send WhatsApp message
      const messagePayload: WhatsAppMessage = {
        to: contactNumber,
        message: newMessage,
        type: "text",
        useAI: false,
        phoneId: secrets.whatsapp_phone_id,
        accessToken: secrets.whatsapp_access_token
      };

      const { error: whatsappError } = await sendWhatsAppMessage(messagePayload);
      if (whatsappError) {
        console.error("WhatsApp sending error:", whatsappError);
        throw new Error("Failed to send WhatsApp message: " + 
          (typeof whatsappError === 'string' ? whatsappError : 
           whatsappError instanceof Error ? whatsappError.message : 
           "Unknown error"));
      }
      console.log("WhatsApp message sent successfully");

      // Step 4: Update UI
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
