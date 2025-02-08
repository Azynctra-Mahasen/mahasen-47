
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Ticket } from "@/types/ticket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TicketHeader } from "./ticket-details/TicketHeader";
import { TicketContent } from "./ticket-details/TicketContent";
import { TicketHistory } from "./ticket-details/TicketHistory";
import { TicketActions } from "./ticket-details/TicketActions";
import { TicketMetadata } from "./ticket-details/TicketMetadata";
import { useTicketUpdates } from "./ticket-details/useTicketUpdates";
import { useTicketHistory } from "./ticket-details/useTicketHistory";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TicketDetailsDialog = ({ ticket, open, onOpenChange }: TicketDetailsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate();
  const { ticketHistory } = useTicketHistory(ticket?.id ?? null);
  const { isUpdating, handleStatusChange, handleAssignmentChange, handlePriorityChange } = 
    useTicketUpdates(ticket, () => onOpenChange(false));

  const handleGoToMessage = () => {
    if (ticket?.conversation_id) {
      onOpenChange(false);
      navigate(`/chat/${ticket.conversation_id}`);
    }
  };

  const handleMarkComplete = () => {
    handleStatusChange('Completed');
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-4 md:p-6 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between p-0 mb-4">
          <DialogTitle className="text-xl font-semibold">Ticket #{ticket.id}</DialogTitle>
          <Button
            onClick={handleMarkComplete}
            disabled={isUpdating || ticket.status === 'Completed'}
            className="bg-green-500 hover:bg-green-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        </DialogHeader>
        
        <ScrollArea className={`${isOpen ? 'h-[calc(90vh-120px)]' : 'h-auto max-h-[70vh]'} pr-4`}>
          <div className="space-y-4">
            <TicketHeader ticket={ticket} />
            
            <TicketContent ticket={ticket} />
            
            <TicketHistory history={ticketHistory} />
            
            <TicketActions 
              conversationId={ticket.conversation_id} 
              onGoToMessage={handleGoToMessage}
            />

            <hr className="border-gray-200 dark:border-gray-700" />
            
            <Collapsible 
              open={isOpen}
              onOpenChange={setIsOpen}
              className="w-full space-y-2"
            >
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 font-medium hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-800">
                <span className="text-sm">
                  {isOpen ? "Show Less" : "Show More"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <div className="rounded-md bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <TicketMetadata
                    ticket={ticket}
                    isUpdating={isUpdating}
                    onPriorityChange={handlePriorityChange}
                    onAssignmentChange={handleAssignmentChange}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
