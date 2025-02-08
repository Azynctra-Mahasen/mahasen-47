import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { priorityColors } from "../ticket-utils";
import { TicketPriority as Priority } from "@/types/ticket";

interface TicketPriorityProps {
  priority: Priority;
  isUpdating: boolean;
  onPriorityChange: (priority: Priority) => void;
}

export const TicketPrioritySection = ({ priority, isUpdating, onPriorityChange }: TicketPriorityProps) => {
  return (
    <div className="space-y-2 text-gray-600 dark:text-gray-300">
      <h4 className="font-medium ">Priority</h4>
      <div className="flex items-center gap-2 ">
        <Badge variant="secondary" className={priorityColors[priority]}>
          {priority}
        </Badge>
        <Select value={priority} onValueChange={onPriorityChange} disabled={isUpdating}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Set priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};