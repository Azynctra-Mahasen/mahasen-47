
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserSecrets = {
  whatsapp_phone_id: string;
  whatsapp_verify_token: string;
  whatsapp_access_token: string;
  groq_api_key?: string;
};

export const useProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [secrets, setSecrets] = useState<UserSecrets>({
    whatsapp_phone_id: "",
    whatsapp_verify_token: "",
    whatsapp_access_token: "",
    groq_api_key: ""
  });

  useEffect(() => {
    const getProfile = async () => {
      try {
        const sessionResponse = await supabase.auth.getSession();
        const session = sessionResponse.data.session;
        
        if (!session) {
          navigate("/login");
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, profile_url, whatsapp_number')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // No profile found, create one
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'user',
                whatsapp_number: ""
              });

            if (insertError) {
              throw new Error("Error creating profile: " + insertError.message);
            }
          } else {
            throw new Error("Error fetching profile: " + profileError.message);
          }
        }

        if (profileData) {
          setUsername(profileData.username ?? "");
          setEmail(session.user.email ?? "");
          setWhatsappNumber(profileData.whatsapp_number ?? "");
          setProfileUrl(profileData.profile_url ?? "");
        }

        // Define secretsMap at a higher scope so it can be accessed later
        let secretsMap: Record<string, string> = {};

        // Fetch secrets data
        const { data: secretsData, error: secretsError } = await supabase
          .from('decrypted_user_secrets')
          .select('secret_type, secret_value')
          .eq('user_id', session.user.id);

        if (secretsError) {
          throw new Error("Error fetching secrets: " + secretsError.message);
        }

        if (secretsData) {
          secretsMap = secretsData.reduce((acc, curr) => {
            acc[curr.secret_type as keyof UserSecrets] = curr.secret_value;
            return acc;
          }, {} as Record<string, string>);

          setSecrets({
            whatsapp_phone_id: secretsMap.whatsapp_phone_id ?? "",
            whatsapp_verify_token: secretsMap.whatsapp_verify_token ?? "",
            whatsapp_access_token: secretsMap.whatsapp_access_token ?? "",
            groq_api_key: secretsMap.groq_api_key ?? ""
          });
        }

        // Create platform_secrets entry if it doesn't exist
        const { data: platformSecrets, error: platformSecretsError } = await supabase
          .from('platform_secrets')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (platformSecretsError && platformSecretsError.code === 'PGRST116') {
          // No platform_secrets found, create one
          await supabase
            .from('platform_secrets')
            .insert({
              user_id: session.user.id,
              whatsapp_phone_id: secretsMap.whatsapp_phone_id || "",
              whatsapp_verify_token: secretsMap.whatsapp_verify_token || "",
              whatsapp_access_token: secretsMap.whatsapp_access_token || ""
            });
        }
      } catch (error) {
        console.error('Error in getProfile:', error);
        toast.error("Failed to load profile data", {
          description: error instanceof Error ? error.message : "Please try again later"
        });
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [navigate]);

  return {
    loading,
    setLoading,
    username,
    setUsername,
    email,
    whatsappNumber,
    setWhatsappNumber,
    profileUrl,
    setProfileUrl,
    secrets,
    setSecrets
  };
};
