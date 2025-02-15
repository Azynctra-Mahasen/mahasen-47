
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Database } from "@/integrations/supabase/types/common";
import { AIModelSelect } from "./AIModelSelect";
import { ContextMemorySelect } from "./ContextMemorySelect";
import { ConversationTimeoutInput } from "./ConversationTimeoutInput";

type AIModel = Database['public']['Enums']['ai_model'];

interface AdvancedSettingsProps {
  contextMemoryLength: string;
  conversationTimeout: number;
  modelName: AIModel;
  onContextMemoryChange: (value: string) => void;
  onTimeoutChange: (value: number) => void;
  onModelChange: (value: AIModel) => void;
  isModelChangeDisabled: boolean;
}

export const AdvancedSettings = ({
  contextMemoryLength,
  conversationTimeout,
  modelName,
  onContextMemoryChange,
  onTimeoutChange,
  onModelChange,
  isModelChangeDisabled,
}: AdvancedSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
          <AIModelSelect
            modelName={modelName}
            onModelChange={onModelChange}
            isDisabled={isModelChangeDisabled}
          />

          <ContextMemorySelect
            value={contextMemoryLength}
            onChange={onContextMemoryChange}
          />

          <ConversationTimeoutInput
            value={conversationTimeout}
            onChange={onTimeoutChange}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
