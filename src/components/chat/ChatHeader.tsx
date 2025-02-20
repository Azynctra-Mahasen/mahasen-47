
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Platform } from "@/types/platform";
import { capitalize } from "lodash";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatHeaderProps {
  contactName?: string;
  platform?: Platform;
  isAIEnabled: boolean;
  onAIToggle: (enabled: boolean) => void;
  children?: ReactNode;
}

export const ChatHeader = ({ 
  contactName, 
  platform, 
  isAIEnabled, 
  onAIToggle,
  children 
}: ChatHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border-b bg-white dark:bg-slate-900 flex items-center justify-between">
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
        <div>
          <h2 className="font-semibold">{contactName}</h2>
          {platform && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              via {capitalize(platform)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="ai-mode"
            checked={isAIEnabled}
            onCheckedChange={onAIToggle}
            disabled={false} // Set this to true when loading
            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200"
          />
          <Label htmlFor="ai-mode">AI Assistant</Label>
        </div>
        {children}
      </div>
    </div>
  );
};
