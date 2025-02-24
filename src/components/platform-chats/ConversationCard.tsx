
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, Circle } from "lucide-react";
import type { Platform } from "@/types/platform";

interface ConversationCardProps {
  id: string;
  contact_name: string;
  contact_number: string;
  latest_message_time: string;
  has_unread: boolean;
  onClick: () => void;
}

export const ConversationCard = ({
  contact_name,
  contact_number,
  latest_message_time,
  has_unread,
  onClick,
}: ConversationCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-800"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {contact_name}
        </CardTitle>
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
