
import { Ticket } from "@/types/ticket";

interface TicketContentProps {
  ticket: Ticket;
}

export const TicketContent = ({ ticket }: TicketContentProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <h4 className="font-medium">Customer</h4>
          <p>{ticket.customer_name}</p>
        </div>

        <div className="flex-1 min-w-[200px]">
          <h4 className="font-medium">Type</h4>
          <p>{ticket.type}</p>
        </div>

        {ticket.intent_type && (
          <div className="flex-1 min-w-[200px]">
            <h4 className="font-medium">Intent Type</h4>
            <p>{ticket.intent_type}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Description</h4>
        <div className="border-2 border-green-500 rounded-lg p-4">
          <p className="whitespace-pre-wrap">{ticket.body}</p>
        </div>
      </div>

      {ticket.escalation_reason && (
        <div className="space-y-2">
          <h4 className="font-medium">Escalation Reason</h4>
          <p>{ticket.escalation_reason}</p>
        </div>
      )}
    </div>
  );
};
