
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AITone } from "@/types/ai";

interface AIToneSelectProps {
  tone: AITone;
  onToneChange: (value: AITone) => void;
}

export const AIToneSelect = ({ tone, onToneChange }: AIToneSelectProps) => {
  return (
    <div className="space-y-4">
      <label className="text-lg font-medium">AI Tone</label>
      <Select 
        value={tone} 
        onValueChange={(value: string) => onToneChange(value as AITone)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select tone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Professional">Professional</SelectItem>
          <SelectItem value="Friendly">Friendly</SelectItem>
          <SelectItem value="Empathetic">Empathetic</SelectItem>
          <SelectItem value="Playful">Playful</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
