
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ConversationTimeoutInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const ConversationTimeoutInput = ({ value, onChange }: ConversationTimeoutInputProps) => {
  const { toast } = useToast();

  const handleTimeoutChange = (inputValue: string) => {
    const numValue = parseInt(inputValue);
    if (isNaN(numValue)) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please enter a valid number between 1 and 6",
      });
      return;
    }

    if (numValue < 1 || numValue > 6) {
      toast({
        variant: "destructive",
        title: "Invalid range",
        description: "Timeout must be between 1 and 6 hours",
      });
      return;
    }

    onChange(numValue);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        New Conversation Timeout (hours)
      </label>
      <Input
        type="number"
        min={1}
        max={6}
        value={value}
        onChange={(e) => handleTimeoutChange(e.target.value)}
        className="w-full"
      />
      <p className="text-xs text-slate-500">
        Set between 1-6 hours
      </p>
    </div>
  );
};
