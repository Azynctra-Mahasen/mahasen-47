
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ScrollButtonProps {
  onClick: () => void;
}

export const ScrollButton = ({ onClick }: ScrollButtonProps) => (
  <Button
    variant="secondary"
    size="icon"
    className="fixed bottom-32 right-4 rounded-full shadow-lg z-50 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700"
    onClick={onClick}
  >
    <ChevronDown className="h-4 w-4" />
  </Button>
);
