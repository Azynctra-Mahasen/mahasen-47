
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
  const [aiSettingsId, setAISettingsId] = useState<number | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Fix the TypeScript error by using a different approach to get session
        const sessionResult = await supabase.auth.getSession();
        const session = sessionResult.data.session;
        
        if (!session) {
          navigate("/login");
          return;
        }

        const { data, error } = await supabase
          .from('ai_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is fine for new users
          console.error('Error loading AI settings:', error);
          throw error;
        }

        if (data) {
          setAISettingsId(data.id);
          setTone(data.tone as AITone);
          setBehaviour(data.behaviour || "");
          setContextMemoryLength(data.context_memory_length?.toString() || "2");
          setConversationTimeout(data.conversation_timeout_hours || 1);
          setModelName(data.model_name);
        }
      } catch (error) {
        console.error('Error loading AI settings:', error);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const memoryLength = contextMemoryLength === "Disable" ? 0 : parseInt(contextMemoryLength);
      if (isNaN(memoryLength) || memoryLength < 0 || memoryLength > 5) {
        throw new Error("Invalid context memory length");
      }

      if (conversationTimeout < 1 || conversationTimeout > 6) {
        throw new Error("Conversation timeout must be between 1 and 6 hours");
      }

      const aiSettings = {
        tone,
        behaviour,
        context_memory_length: memoryLength,
        conversation_timeout_hours: conversationTimeout,
        model_name: modelName,
        updated_at: new Date().toISOString(),
        user_id: session.user.id
      };

      if (aiSettingsId) {
        // Update existing settings
        const { error } = await supabase
          .from('ai_settings')
          .update(aiSettings)
          .eq('id', aiSettingsId);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('ai_settings')
          .insert(aiSettings);

        if (error) throw error;
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

          <AISettingsActions onSave={handleSave} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default AISettings;
