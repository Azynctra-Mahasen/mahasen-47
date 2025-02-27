import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

type OnboardingStep = "welcome" | "whatsapp-number" | "whatsapp-config" | "completion";

export const WhatsAppOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // Check if user has already completed onboarding when component mounts
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/login");
          return;
        }
        
        const { data, error } = await supabase
          .from('platform_secrets')
          .select('whatsapp_phone_id, whatsapp_verify_token, whatsapp_access_token')
          .eq('user_id', session.user.id)
          .single();
        
        if (!error && 
            data && 
            data.whatsapp_phone_id && 
            data.whatsapp_phone_id.trim() !== '' &&
            data.whatsapp_verify_token && 
            data.whatsapp_verify_token.trim() !== '' &&
            data.whatsapp_access_token && 
            data.whatsapp_access_token.trim() !== '') {
          // User has already completed onboarding, redirect to dashboard
          console.log("WhatsAppOnboarding: User has already completed onboarding");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    
    checkOnboardingStatus();
  }, [navigate]);

  const handleSaveConfiguration = async () => {
    try {
      setLoading(true);
      
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("You must be logged in to complete onboarding");
      }

      // Update profile with WhatsApp number
      await supabase
        .from('profiles')
        .update({ whatsapp_number: whatsappNumber })
        .eq('id', session.user.id);

      // Save WhatsApp secrets
      await supabase.rpc('store_user_secret', {
        p_user_id: session.user.id,
        p_secret_type: 'whatsapp_phone_id',
        p_secret_value: phoneId
      });
      
      await supabase.rpc('store_user_secret', {
        p_user_id: session.user.id,
        p_secret_type: 'whatsapp_verify_token',
        p_secret_value: verifyToken
      });
      
      await supabase.rpc('store_user_secret', {
        p_user_id: session.user.id,
        p_secret_type: 'whatsapp_access_token',
        p_secret_value: accessToken
      });

      // Update platform_secrets
      await supabase
        .from('platform_secrets')
        .upsert({
          user_id: session.user.id,
          whatsapp_phone_id: phoneId,
          whatsapp_verify_token: verifyToken,
          whatsapp_access_token: accessToken,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      // Move to completion step
      setCurrentStep("completion");
      toast({
        title: "WhatsApp configured successfully",
        description: "Your WhatsApp Business account has been connected.",
      });
    } catch (error) {
      console.error("Error saving WhatsApp configuration:", error);
      toast({
        variant: "destructive",
        title: "Configuration failed",
        description: error instanceof Error ? error.message : "Please check your inputs and try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to Mahasen</CardTitle>
              <CardDescription>
                Let's get you set up with WhatsApp Business integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  This onboarding will guide you through connecting your WhatsApp Business account to enable automated responses, AI-powered messaging, and order management.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <h3 className="font-medium mb-2">Step 1</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Enter your WhatsApp business phone number</p>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <h3 className="font-medium mb-2">Step 2</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Configure WhatsApp Business API credentials</p>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <h3 className="font-medium mb-2">Step 3</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Start receiving and automating WhatsApp messages</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                className="ml-auto" 
                onClick={() => setCurrentStep("whatsapp-number")}
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );

      case "whatsapp-number":
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>WhatsApp Business Number</CardTitle>
              <CardDescription>
                Enter the phone number associated with your WhatsApp Business account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-number">WhatsApp Business Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="whatsapp-number"
                      type="tel"
                      placeholder="+1234567890"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Include the country code (e.g., +1 for US)
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="w-full flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep("welcome")}
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep("whatsapp-config")}
                  disabled={!whatsappNumber}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        );

      case "whatsapp-config":
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>WhatsApp API Configuration</CardTitle>
              <CardDescription>
                Enter your WhatsApp Business API credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md mb-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    You'll need to create a Meta Developer account and set up a WhatsApp Business API app to get these credentials.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-id">WhatsApp Phone ID</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone-id"
                      type="text"
                      placeholder="Enter your WhatsApp Phone ID"
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    The Phone Number ID from Meta Developer Dashboard
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verify-token">Verify Token</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="verify-token"
                      type="text"
                      placeholder="Enter your custom verification token"
                      value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    A custom token you create for webhook verification
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-token">Access Token</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="access-token"
                      type="password"
                      placeholder="Enter your WhatsApp API access token"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    The permanent access token from your WhatsApp Business app
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="w-full flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep("whatsapp-number")}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSaveConfiguration}
                  disabled={!phoneId || !verifyToken || !accessToken || loading}
                >
                  {loading ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        );

      case "completion":
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-green-600 flex items-center">
                <CheckCircle2 className="mr-2 h-6 w-6" /> Setup Complete!
              </CardTitle>
              <CardDescription>
                Your WhatsApp Business account is now connected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-300">
                  You've successfully configured your WhatsApp integration. You can now start receiving messages and managing orders through WhatsApp.
                </p>
              </div>
              
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-md">
                <h3 className="font-medium mb-2">Next Steps</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                    <span>Configure your Meta Webhooks to point to your Mahasen webhook URL</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                    <span>Test your integration by sending a message to your WhatsApp Business number</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                    <span>Customize your AI responses in the Agent Flow section</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="w-full flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                  className="mr-2"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  onClick={() => navigate("/chats/whatsapp")}
                >
                  View WhatsApp Chats
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {renderStepContent()}
      </div>
      <div className="w-full flex justify-center mt-auto fixed bottom-12 left-0">
        <img 
          src="../src/uploads/onboarding_footer.png" 
          alt="Mahasen AI - AI for People" 
          className="h-10" 
        />
      </div>
    </div>
  );
};
