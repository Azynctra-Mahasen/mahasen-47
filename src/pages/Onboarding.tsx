
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppOnboarding } from "@/components/onboarding/WhatsAppOnboarding";

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth check error:", error);
          navigate("/login");
          return;
        }
        
        if (!session) {
          navigate("/login");
          return;
        }
        
        setIsAuthenticated(true);
        
        // Check if user has already completed onboarding
        const { data: platformSecrets, error: secretsError } = await supabase
          .from('platform_secrets')
          .select('whatsapp_phone_id, whatsapp_verify_token, whatsapp_access_token')
          .eq('user_id', session.user.id)
          .single();
        
        if (!secretsError && 
            platformSecrets && 
            platformSecrets.whatsapp_phone_id && 
            platformSecrets.whatsapp_verify_token && 
            platformSecrets.whatsapp_access_token) {
          // User has already configured WhatsApp, redirect to dashboard
          console.log("User has already completed onboarding, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Onboarding auth check error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login due to useEffect
  }

  return <WhatsAppOnboarding />;
};

export default Onboarding;
