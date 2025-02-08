
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket } from "@/types/ticket";
import { statusColors } from "../ticket-utils";

interface TicketStatusProps {
  status: Ticket["status"];
  isUpdating: boolean;
  onStatusChange: (status: Ticket["status"]) => void;
}

export const TicketStatus = ({ status, isUpdating, onStatusChange }: TicketStatusProps) => {
  return (
    <div className="space-y-2 text-gray-600 dark:text-gray-300">
      <h4 className="font-medium">Status</h4>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={statusColors[status]}>
          {status}
        </Badge>
        <Select value={status} onValueChange={onStatusChange} disabled={isUpdating}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Escalated">Escalated</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
