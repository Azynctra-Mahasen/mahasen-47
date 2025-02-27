
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AITone } from "@/types/ai";
import type { Database } from "@/integrations/supabase/types/common";
import { AISettingsHeader } from "@/components/ai-settings/AISettingsHeader";
import { AIToneSelect } from "@/components/ai-settings/AIToneSelect";
import { AIBehaviourInput } from "@/components/ai-settings/AIBehaviourInput";
import { AdvancedSettings } from "@/components/ai-settings/AdvancedSettings";
import { AISettingsActions } from "@/components/ai-settings/AISettingsActions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";

type AIModel = Database['public']['Enums']['ai_model'];

const AISettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tone, setTone] = useState<AITone>("Professional");
  const [behaviour, setBehaviour] = useState("");
  const [contextMemoryLength, setContextMemoryLength] = useState<string>("2");
  const [conversationTimeout, setConversationTimeout] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [modelName, setModelName] = useState<AIModel>("deepseek-r1-distill-llama-70b");
  const [isModelChangeDisabled, setIsModelChangeDisabled] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        // Load AI settings
        const { data: aiSettings, error: aiError } = await supabase
          .from('ai_settings')
          .select('*')
          .single();

        if (aiError && aiError.code !== 'PGRST116') {
          console.error('Error loading AI settings:', aiError);
          throw aiError;
        }

        if (aiSettings) {
          setTone(aiSettings.tone as AITone);
          setBehaviour(aiSettings.behaviour || "");
          setContextMemoryLength(aiSettings.context_memory_length?.toString() || "2");
          setConversationTimeout(aiSettings.conversation_timeout_hours || 1);
          setModelName(aiSettings.model_name);
        }

        // Load Groq API key
        const { data: secretData, error: secretError } = await supabase
          .from('decrypted_user_secrets')
          .select('secret_value')
          .eq('secret_type', 'groq_api_key')
          .single();

        if (secretError && secretError.code !== 'PGRST116') {
          console.error('Error loading Groq API key:', secretError);
        }

        if (secretData) {
          setGroqApiKey(secretData.secret_value || "");
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load AI settings. Please try again.",
        });
      }
    };

    loadSettings();
  }, [toast, navigate]);

  const handleModelChange = (value: AIModel) => {
    setModelName(value);
    setIsModelChangeDisabled(true);
    setTimeout(() => {
      setIsModelChangeDisabled(false);
    }, 120000); // 2 minutes
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const memoryLength = contextMemoryLength === "Disable" ? 0 : parseInt(contextMemoryLength);
      if (isNaN(memoryLength) || memoryLength < 0 || memoryLength > 5) {
        throw new Error("Invalid context memory length");
      }

      if (conversationTimeout < 1 || conversationTimeout > 6) {
        throw new Error("Conversation timeout must be between 1 and 6 hours");
      }

      // Save AI settings
      const { error: aiError } = await supabase
        .from('ai_settings')
        .upsert({ 
          id: 1,
          tone,
          behaviour,
          context_memory_length: memoryLength,
          conversation_timeout_hours: conversationTimeout,
          model_name: modelName,
          updated_at: new Date().toISOString()
        });

      if (aiError) throw aiError;

      // Save Groq API key if provided
      if (groqApiKey) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("No active session");
        }

        const { error: groqKeyError } = await supabase
          .rpc('store_user_secret', {
            p_user_id: session.user.id,
            p_secret_type: 'groq_api_key',
            p_secret_value: groqApiKey
          });

        if (groqKeyError) throw groqKeyError;
      }

      toast({
        title: "Settings saved",
        description: "AI settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save AI settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AISettingsHeader />
        
        <div className="space-y-8 bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
          <AIToneSelect tone={tone} onToneChange={setTone} />
          <AIBehaviourInput behaviour={behaviour} onBehaviourChange={setBehaviour} />
          
          <AdvancedSettings
            contextMemoryLength={contextMemoryLength}
            conversationTimeout={conversationTimeout}
            modelName={modelName}
            onContextMemoryChange={setContextMemoryLength}
            onTimeoutChange={setConversationTimeout}
            onModelChange={handleModelChange}
            isModelChangeDisabled={isModelChangeDisabled}
          />

          <Card className="border-gray-300">
            <CardContent className="p-4">
              <Label htmlFor="groq_api_key" className="text-sm font-medium">Groq API Key</Label>
              <div className="relative mt-1">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="groq_api_key"
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  className="pl-10 border-gray-300"
                  placeholder="Enter your Groq API Key for AI responses"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The Groq API key will be used for generating AI responses in WhatsApp conversations
              </p>
            </CardContent>
          </Card>

          <AISettingsActions onSave={handleSave} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default AISettings;
