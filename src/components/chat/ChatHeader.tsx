import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatHeaderProps {
  contactName: string | undefined;
  platform: string | undefined;
  isAIEnabled: boolean;
  onAIToggle: (enabled: boolean) => void;
}

export const ChatHeader = ({
  contactName,
  platform,
  isAIEnabled,
  onAIToggle,
}: ChatHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#F1F0FB] dark:bg-slate-800 border-b dark:border-slate-700 p-4 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="secondary"
            className="mr-4 hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={() => navigate(`/chats/${platform}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold dark:text-white">
            Chat with {contactName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">AI Assistant</span>
          <Switch
            checked={isAIEnabled}
            onCheckedChange={onAIToggle}
            aria-label="Toggle AI Assistant"
          />
        </div>
      </div>
    </div>
  );
};