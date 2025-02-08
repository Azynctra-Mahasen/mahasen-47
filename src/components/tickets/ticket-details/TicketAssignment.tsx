import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketAssignmentProps {
  assignedTo: string | undefined;
  isUpdating: boolean;
  onAssignmentChange: (assignedTo: string) => void;
}

export const TicketAssignment = ({ assignedTo, isUpdating, onAssignmentChange }: TicketAssignmentProps) => {
  return (
    <div className="space-y-2 text-gray-600 dark:text-gray-300">
      <h4 className="font-medium ">Assigned To</h4>
      <Select 
        value={assignedTo || "unassigned"} 
        onValueChange={onAssignmentChange} 
        disabled={isUpdating}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Assign ticket" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          <SelectItem value="agent1">Agent 1</SelectItem>
          <SelectItem value="agent2">Agent 2</SelectItem>
          <SelectItem value="agent3">Agent 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};