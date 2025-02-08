
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";

interface PlatformCardProps {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  useShine?: boolean;
}

export const PlatformCard = ({
  id,
  name,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  description,
  isSelected,
  onSelect,
  useShine = false,
}: PlatformCardProps) => {
  const content = (
    <Card
      className={`w-full p-6 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
        isSelected ? borderColor : "border-transparent"
      } dark:bg-slate-900`}
      onClick={() => onSelect(id)}
    >
      <div className={`rounded-full w-12 h-12 ${bgColor} ${color} flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{description}</p>
      <Button
        variant="ghost"
        className={`w-full justify-start ${color}`}
        onClick={() => onSelect(id)}
      >
        View Chats
      </Button>
    </Card>
  );

  if (useShine) {
    return (
      <div className="w-full">
        <ShineBorder color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}>
          {content}
        </ShineBorder>
      </div>
    );
  }

  return content;
};
