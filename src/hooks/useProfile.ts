
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserSecrets = {
  whatsapp_phone_id: string;
  whatsapp_verify_token: string;
  whatsapp_access_token: string;
};

export const useProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [secrets, setSecrets] = useState<UserSecrets>({
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
