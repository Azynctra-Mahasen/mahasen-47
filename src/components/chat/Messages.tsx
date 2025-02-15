
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

interface MessagesProps {
  messages: Message[] | undefined;
  isCleared: boolean;
}

export const Messages = ({ messages, isCleared }: MessagesProps) => {
  if (messages?.length === 0 || isCleared) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-slate-500 dark:text-slate-400">
          {isCleared ? "History was cleared." : "No messages yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {messages?.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.status === "sent" ? "justify-end" : "justify-start"
          }`}
        >
          <Card
            className={cn(
              "max-w-[80%]",
              message.status === "sent" 
                ? message.sender_name === "AI Assistant"
                  ? "bg-[#3FA2F6] text-white"
                  : "bg-[#96C9F4] text-white"
                : "dark:bg-slate-800 dark:text-white"
            )}
          >
            <CardContent className="p-3">
              <div className="text-sm font-medium mb-1">
                {message.sender_name}
              </div>
              <div className="text-sm whitespace-pre-line">
                {message.content}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
