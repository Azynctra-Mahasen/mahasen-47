
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserSecrets = {
  whatsapp_phone_id: string;
  whatsapp_verify_token: string;
  whatsapp_access_token: string;
};

export const useSettingsSubmit = () => {
  const { toast } = useToast();

  const handleSave = async (
    setLoading: (loading: boolean) => void,
    username: string,
    whatsappNumber: string,
    secrets: UserSecrets
  ) => {
    try {
      if (!secrets.whatsapp_phone_id || !secrets.whatsapp_verify_token || !secrets.whatsapp_access_token) {
        throw new Error("All WhatsApp configuration fields are required");
      }

      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username,
          whatsapp_number: whatsappNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (profileError) {
        throw profileError;
      }

      // Save WhatsApp secrets
      const { error: phoneIdError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_phone_id',
          p_secret_value: secrets.whatsapp_phone_id
        });

      if (phoneIdError) throw phoneIdError;

      const { error: verifyTokenError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_verify_token',
          p_secret_value: secrets.whatsapp_verify_token
        });

      if (verifyTokenError) throw verifyTokenError;

      const { error: accessTokenError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_access_token',
          p_secret_value: secrets.whatsapp_access_token
        });

      if (accessTokenError) throw accessTokenError;

      toast({
        title: "Success",
        description: "Settings and WhatsApp configuration saved successfully",
      });

      // Add a small delay to ensure all data is saved
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleSave };
};
