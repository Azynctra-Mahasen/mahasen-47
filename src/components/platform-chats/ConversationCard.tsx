
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, Circle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Platform } from "@/types/platform";

interface ConversationCardProps {
  id: string;
  contact_name: string;
  contact_number: string;
  latest_message_time: string;
  has_unread: boolean;
  onClick: () => void;
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
}

export const ConversationCard = ({
  id,
  contact_name,
  contact_number,
  latest_message_time,
  has_unread,
  onClick,
  onSelect,
  isSelected,
  selectionMode,
}: ConversationCardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(id, !isSelected);
    } else {
      onClick();
    }
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-800 ${
        isSelected ? "border-2 border-primary" : ""
      }`}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect?.(id, checked as boolean)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <CardTitle className="text-lg font-semibold">
            {contact_name}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {has_unread && (
            <div className="h-3 w-3 rounded-full bg-green-500" />
          )}
          <div className="text-sm text-muted-foreground">
            {new Date(latest_message_time).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4 mr-2" />
          {contact_number}
        </div>
      </CardContent>
    </Card>
  );
};
