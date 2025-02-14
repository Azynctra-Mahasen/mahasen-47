
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types/common";

type AIModel = Database['public']['Enums']['ai_model'];

interface AdvancedSettingsProps {
  contextMemoryLength: string;
  conversationTimeout: number;
  modelName: AIModel;
  useMCP: boolean;
  onContextMemoryChange: (value: string) => void;
  onTimeoutChange: (value: number) => void;
  onModelChange: (value: AIModel) => void;
  onMCPChange: (value: boolean) => void;
  isModelChangeDisabled: boolean;
}

export const AdvancedSettings = ({
  contextMemoryLength,
  conversationTimeout,
  modelName,
  useMCP,
  onContextMemoryChange,
  onTimeoutChange,
  onModelChange,
  onMCPChange,
  isModelChangeDisabled,
}: AdvancedSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleTimeoutChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please enter a valid number between 1 and 6",
      });
      return;
    }

    if (numValue < 1 || numValue > 6) {
      toast({
        variant: "destructive",
        title: "Invalid range",
        description: "Timeout must be between 1 and 6 hours",
      });
      return;
    }

    onTimeoutChange(numValue);
  };

  const handleModelChange = (value: AIModel) => {
    if (isModelChangeDisabled) {
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
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-lg"
    >
      <CollapsibleTrigger className="flex w-full justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
        <h2 className="text-lg font-medium">Advanced Settings</h2>
        <span className="text-sm text-slate-500">
          {isOpen ? "Hide" : "Show"}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 pt-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <Select
              value={modelName}
              onValueChange={handleModelChange}
              disabled={isModelChangeDisabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq-llama-3.3-70b-versatile">Groq: Llama 3.3 70B Versatile</SelectItem>
                <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</SelectItem>
                <SelectItem value="deepseek-r1-distill-llama-70b">Groq: deepseek-r1-distill-llama-70b</SelectItem>
                <SelectItem value="mcp-llama-70b">MCP: Llama 70B (Experimental)</SelectItem>
              </SelectContent>
            </Select>
            {isModelChangeDisabled && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Model change is temporarily disabled. Please wait 2 minutes.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="mcp-toggle">Use Model Context Protocol</Label>
              <p className="text-sm text-slate-500">
                Enable advanced context handling with MCP
              </p>
            </div>
            <Switch
              id="mcp-toggle"
              checked={useMCP}
              onCheckedChange={onMCPChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Context Memory Length</label>
            <RadioGroup
              value={contextMemoryLength}
              onValueChange={onContextMemoryChange}
              className="flex flex-wrap gap-4"
            >
              {["1", "2", "3", "5", "Disable"].map((value) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`memory-${value}`} />
                  <Label htmlFor={`memory-${value}`}>{value}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              New Conversation Timeout (hours)
            </label>
            <Input
              type="number"
              min={1}
              max={6}
              value={conversationTimeout}
              onChange={(e) => handleTimeoutChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Set between 1-6 hours
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
