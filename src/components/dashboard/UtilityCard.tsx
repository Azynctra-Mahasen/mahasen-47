
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";

interface UtilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  colorClass: string;
  bgColorClass: string;
  useShine?: boolean;
}

export const UtilityCard = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
  colorClass,
  bgColorClass,
  useShine = false,
}: UtilityCardProps) => {
  const content = (
    <Card className="w-full p-6 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-transparent dark:bg-slate-900">
      <div className={`rounded-full w-12 h-12 ${bgColorClass} ${colorClass} flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{description}</p>
      <Button
        variant="ghost"
        className={`w-full justify-start ${colorClass}`}
        onClick={onClick}
      >
        {buttonText}
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
