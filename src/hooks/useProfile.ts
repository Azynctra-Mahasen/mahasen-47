
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProfile = () => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [secrets, setSecrets] = useState({
    whatsapp_phone_id: "",
    whatsapp_verify_token: "",
    whatsapp_access_token: "",
    groq_api_key: ""
  });

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("No session found");
        }

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setUsername(profileData.username || "");
          setEmail(session.user.email || "");
          setWhatsappNumber(profileData.whatsapp_number || "");
          setProfileUrl(profileData.avatar_url || "");
        }

        // Get secrets
        const { data: secrets, error: secretsError } = await supabase
          .from('decrypted_user_secrets')
          .select('secret_type, secret_value');

        if (secretsError) throw secretsError;

        const secretsMap = secrets?.reduce((acc: any, curr) => {
          acc[curr.secret_type] = curr.secret_value;
          return acc;
        }, {});

        setSecrets({
          whatsapp_phone_id: secretsMap?.whatsapp_phone_id || "",
          whatsapp_verify_token: secretsMap?.whatsapp_verify_token || "",
          whatsapp_access_token: secretsMap?.whatsapp_access_token || "",
          groq_api_key: secretsMap?.groq_api_key || ""
        });

      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

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
