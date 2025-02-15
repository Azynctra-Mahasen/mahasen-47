import { Button } from "@/components/ui/button";
import { FileText, Network, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  userName: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

export const DashboardHeader = ({ userName, onNavigate, onSignOut }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Mahasen AI</h1>
        <p className="text-slate-600 dark:text-slate-400">Welcome, {userName}</p>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => onNavigate("/knowledge-base")}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Manage Files
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate("/agent-flow")}
          className="flex items-center gap-2"
        >
          <Network className="h-4 w-4" />
          Agent Flow
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate("/ai-settings")}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          AI Settings
        </Button>
        <ThemeToggle />
        <Button variant="outline" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};