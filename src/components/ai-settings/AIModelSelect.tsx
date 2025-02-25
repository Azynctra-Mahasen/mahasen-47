
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types/common";

type AIModel = Database['public']['Enums']['ai_model'];

interface AIModelSelectProps {
  modelName: AIModel;
  onModelChange: (value: AIModel) => void;
  isDisabled: boolean;
}

export const AIModelSelect = ({ modelName, onModelChange, isDisabled }: AIModelSelectProps) => {
  const { toast } = useToast();

  const handleModelChange = (value: AIModel) => {
    if (isDisabled) {
      toast({
        variant: "destructive",
        title: "Model change not allowed",
        description: "Please wait 2 minutes before changing the model again.",
      });
      return;
    }
    onModelChange(value);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">AI Model</label>
      <Select
        value={modelName}
        onValueChange={handleModelChange}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="groq-llama-3.3-70b-versatile">Groq: Llama 3.3 70B Versatile</SelectItem>
          <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</SelectItem>
          <SelectItem value="deepseek-r1-distill-llama-70b">Groq: deepseek-r1-distill-llama-70b</SelectItem>
        </SelectContent>
      </Select>
      {isDisabled && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          Model change is temporarily disabled. Please wait 2 minutes.
        </p>
      )}
    </div>
  );
};
