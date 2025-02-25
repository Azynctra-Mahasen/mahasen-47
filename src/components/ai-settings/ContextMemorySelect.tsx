
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ContextMemorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const ContextMemorySelect = ({ value, onChange }: ContextMemorySelectProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Context Memory Length</label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex flex-wrap gap-4"
      >
        {["1", "2", "3", "5", "Disable"].map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`memory-${option}`} />
            <Label htmlFor={`memory-${option}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
