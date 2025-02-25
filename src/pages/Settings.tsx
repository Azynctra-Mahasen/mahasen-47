import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";
import { AISettingsHeader } from "@/components/ai-settings/AISettingsHeader";
import { AISettingsActions } from "@/components/ai-settings/AISettingsActions";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { PlatformsSection } from "@/components/settings/PlatformsSection";
import { SecretsSection } from "@/components/settings/SecretsSection";

type Profile = Database['public']['Tables']['profiles']['Row'];

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [secrets, setSecrets] = useState<{
    whatsapp_phone_id: string;
    whatsapp_verify_token: string;
    whatsapp_access_token: string;
  }>({
    whatsapp_phone_id: "",
    whatsapp_verify_token: "",
    whatsapp_access_token: ""
  });

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, profile_url, whatsapp_number')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }

        if (profileData) {
          setUsername(profileData.username ?? "");
          setEmail(session.user.email ?? "");
          setWhatsappNumber(profileData.whatsapp_number ?? "");
          setProfileUrl(profileData.profile_url ?? "");
        }

        const { data: secretsData, error: secretsError } = await supabase
          .from('decrypted_user_secrets')
          .select('secret_type, secret_value')
          .eq('user_id', session.user.id);

        if (secretsError) {
          console.error('Error fetching secrets:', secretsError);
          throw secretsError;
        }

        if (secretsData) {
          const secretsMap = secretsData.reduce((acc, curr) => {
            acc[curr.secret_type] = curr.secret_value;
            return acc;
          }, {} as Record<string, string>);

          setSecrets({
            whatsapp_phone_id: secretsMap.whatsapp_phone_id ?? "",
            whatsapp_verify_token: secretsMap.whatsapp_verify_token ?? "",
            whatsapp_access_token: secretsMap.whatsapp_access_token ?? ""
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data",
        });
      }
    };

    getProfile();
  }, [navigate, toast]);

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size must be less than 2MB");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

      if (profileUrl) {
        const oldFileName = profileUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('profile-pictures')
            .remove([oldFileName]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setProfileUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent",
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate password reset",
      });
    }
  };

  const handleSave = async () => {
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

      const { data: phoneIdData, error: phoneIdError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_phone_id',
          p_secret_value: secrets.whatsapp_phone_id
        });

      if (phoneIdError) throw phoneIdError;

      const { data: verifyTokenData, error: verifyTokenError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_verify_token',
          p_secret_value: secrets.whatsapp_verify_token
        });

      if (verifyTokenError) throw verifyTokenError;

      const { data: accessTokenData, error: accessTokenError } = await supabase
        .rpc('store_user_secret', {
          p_user_id: session.user.id,
          p_secret_type: 'whatsapp_access_token',
          p_secret_value: secrets.whatsapp_access_token
        });

      if (accessTokenError) throw accessTokenError;

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AISettingsHeader />
        
        <div className="space-y-6">
          <ProfileSection
            username={username}
            email={email}
            profileUrl={profileUrl}
            loading={loading}
            onUsernameChange={setUsername}
            onFileUpload={handleFileUpload}
          />

          <SecuritySection
            onUpdatePassword={handleUpdatePassword}
          />

          <PlatformsSection
            whatsappNumber={whatsappNumber}
            onWhatsappNumberChange={setWhatsappNumber}
          />

          <SecretsSection
            secrets={secrets}
            onSecretsChange={setSecrets}
          />

          <AISettingsActions
            onSave={handleSave}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
