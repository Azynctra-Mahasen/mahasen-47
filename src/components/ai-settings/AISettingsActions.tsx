
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AISettingsActionsProps {
  onSave: () => void;
  isLoading: boolean;
}

export const AISettingsActions = ({ onSave, isLoading }: AISettingsActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end space-x-4 pt-4">
      <Button
        onClick={onSave}
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};
