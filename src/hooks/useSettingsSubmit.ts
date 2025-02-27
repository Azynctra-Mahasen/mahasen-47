
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type UserSecrets = {
  whatsapp_phone_id: string;
  whatsapp_verify_token: string;
  whatsapp_access_token: string;
  groq_api_key: string;
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
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

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
      
      // Save Groq API Key
      if (secrets.groq_api_key) {
        const { error: groqKeyError } = await supabase
          .rpc('store_user_secret', {
            p_user_id: session.user.id,
            p_secret_type: 'groq_api_key',
            p_secret_value: secrets.groq_api_key
          });

        if (groqKeyError) throw groqKeyError;
      }

      toast({
        title: "Success",
        description: "Settings and secrets saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleSave };
};
