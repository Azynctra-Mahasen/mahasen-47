
import { Textarea } from "@/components/ui/textarea";

interface AIBehaviourInputProps {
  behaviour: string;
  onBehaviourChange: (value: string) => void;
}

export const AIBehaviourInput = ({ behaviour, onBehaviourChange }: AIBehaviourInputProps) => {
  return (
    <div className="space-y-4">
      <label className="text-lg font-medium">AI Behaviour</label>
      <Textarea
        value={behaviour}
        onChange={(e) => onBehaviourChange(e.target.value)}
        placeholder="Define how the AI should behave when answering customer inquiries..."
        className="min-h-[150px]"
        maxLength={1000}
      />
      <p className="text-sm text-slate-500">
        {behaviour.length}/1000 characters
      </p>
    </div>
  );
};
