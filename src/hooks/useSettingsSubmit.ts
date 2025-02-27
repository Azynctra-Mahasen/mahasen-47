
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type UserSecrets = {
  whatsapp_phone_id: string;
  whatsapp_verify_token: string;
  whatsapp_access_token: string;
  groq_api_key?: string;
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

      // Validate required WhatsApp fields
      if (!secrets.whatsapp_phone_id || !secrets.whatsapp_verify_token || !secrets.whatsapp_access_token) {
        throw new Error("WhatsApp configuration is required");
      }

      // Update the user profile
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

      // Store WhatsApp Phone ID
      const { error: phoneIdError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_phone_id',
          p_secret_value: secrets.whatsapp_phone_id
        });

      if (phoneIdError) throw phoneIdError;

      // Store WhatsApp Verify Token
      const { error: verifyTokenError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_verify_token',
          p_secret_value: secrets.whatsapp_verify_token
        });

      if (verifyTokenError) throw verifyTokenError;

      // Store WhatsApp Access Token
      const { error: accessTokenError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_access_token',
          p_secret_value: secrets.whatsapp_access_token
        });

      if (accessTokenError) throw accessTokenError;

      // Store Groq API Key if provided
      if (secrets.groq_api_key) {
        const { error: groqApiKeyError } = await supabase
          .rpc('store_user_secret', {
            p_user_id: session.user.id,
            p_secret_type: 'groq_api_key',
            p_secret_value: secrets.groq_api_key
          });

        if (groqApiKeyError) throw groqApiKeyError;
      }

      // Also store the same values in platform_secrets table for quick lookup
      const { error: platformSecretsError } = await supabase
        .from('platform_secrets')
        .upsert({
          user_id: session.user.id,
          whatsapp_phone_id: secrets.whatsapp_phone_id,
          whatsapp_verify_token: secrets.whatsapp_verify_token,
          whatsapp_access_token: secrets.whatsapp_access_token,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (platformSecretsError) {
        console.error('Error updating platform_secrets:', platformSecretsError);
        throw platformSecretsError;
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
        description: error instanceof Error ? error.message : "Failed to save settings",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleSave };
};
