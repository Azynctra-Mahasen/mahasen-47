
import { Ticket } from "@/types/ticket";
import { TicketPrioritySection } from "./TicketPriority";
import { TicketAssignment } from "./TicketAssignment";
import { TicketStatus } from "./TicketStatus";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface TicketMetadataProps {
  ticket: Ticket;
  isUpdating: boolean;
  onPriorityChange: (priority: "LOW" | "MEDIUM" | "HIGH") => void;
  onAssignmentChange: (assignedTo: string) => void;
  onStatusChange: (status: Ticket["status"]) => void;
}

export const TicketMetadata = ({ 
  ticket,
  isUpdating,
  onPriorityChange,
  onAssignmentChange,
  onStatusChange
}: TicketMetadataProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Function to get first two lines of text
  const getFirstTwoLines = (text: string) => {
    const lines = text.split('\n');
    return lines.slice(0, 2).join('\n');
  };

  return (
    <div className="space-y-4 text-gray-600 dark:text-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <TicketStatus 
          status={ticket.status} 
          isUpdating={isUpdating} 
          onStatusChange={onStatusChange}
        />

        <TicketPrioritySection
          priority={ticket.priority}
          isUpdating={isUpdating}
          onPriorityChange={onPriorityChange}
        />

        <TicketAssignment
          assignedTo={ticket.assigned_to}
          isUpdating={isUpdating}
          onAssignmentChange={onAssignmentChange}
        />
      </div>

      {ticket.confidence_score !== undefined && (
        <div className="space-y-2">
          <h4 className="font-medium">Confidence Score</h4>
          <p>{(ticket.confidence_score * 100).toFixed(1)}%</p>
        </div>
      )}

      {ticket.context && (
        <div className="space-y-2">
          <h4 className="font-medium">Conversation Context</h4>
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full space-y-2"
          >
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border bg-white px-4 py-2 font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800">
                <span className="text-sm">
                  {isOpen ? "Show Less" : "Show More"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
            </div>
            <div className="rounded-md border px-4 py-3 font-mono text-sm">
              <p className="whitespace-pre-wrap">
                {isOpen ? ticket.context : getFirstTwoLines(ticket.context)}
              </p>
            </div>
            <CollapsibleContent className="space-y-2">
              <div className="rounded-md bg-slate-50 px-4 py-3 font-mono text-sm dark:bg-slate-900">
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
};
