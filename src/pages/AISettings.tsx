
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedSettings } from "@/components/ai-settings/AdvancedSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AITone } from "@/types/ai";
import type { Database } from "@/integrations/supabase/types/common";

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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        const { data, error } = await supabase
          .from('ai_settings')
          .select('*')
          .single();

        if (error) {
          console.error('Error loading AI settings:', error);
          throw error;
        }

        if (data) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
      // Validate inputs before saving
      const memoryLength = contextMemoryLength === "Disable" ? 0 : parseInt(contextMemoryLength);
      if (isNaN(memoryLength) || memoryLength < 0 || memoryLength > 5) {
        throw new Error("Invalid context memory length");
      }

      if (conversationTimeout < 1 || conversationTimeout > 6) {
        throw new Error("Conversation timeout must be between 1 and 6 hours");
      }

      const { error } = await supabase
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

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "AI settings have been updated successfully.",
      });
      
      navigate("/dashboard");
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">AI Settings</h1>
          </div>
        </div>

        <div className="space-y-8 bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
          <div className="space-y-4">
            <label className="text-lg font-medium">AI Tone</label>
            <Select 
              value={tone} 
              onValueChange={(value: string) => setTone(value as AITone)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Empathetic">Empathetic</SelectItem>
                <SelectItem value="Playful">Playful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <label className="text-lg font-medium">AI Behaviour</label>
            <Textarea
              value={behaviour}
              onChange={(e) => setBehaviour(e.target.value)}
              placeholder="Define how the AI should behave when answering customer inquiries..."
              className="min-h-[150px]"
              maxLength={1000}
            />
            <p className="text-sm text-slate-500">
              {behaviour.length}/1000 characters
            </p>
          </div>

          <AdvancedSettings
            contextMemoryLength={contextMemoryLength}
            conversationTimeout={conversationTimeout}
            modelName={modelName}
            onContextMemoryChange={setContextMemoryLength}
            onTimeoutChange={setConversationTimeout}
            onModelChange={setModelName}
            isModelChangeDisabled={isModelChangeDisabled}
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
