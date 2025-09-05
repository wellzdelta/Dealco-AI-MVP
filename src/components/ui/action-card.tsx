import React from "react";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  variant: "support" | "feature";
  onClick?: () => void;
  className?: string;
}

export const ActionCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  variant, 
  onClick,
  className 
}: ActionCardProps) => {
  const variantStyles = {
    support: "bg-brand-blue",
    feature: "bg-brand-green"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl p-6 flex items-center justify-between text-left transition-transform hover:scale-98 active:scale-95",
        "shadow-lg",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-text-inverse" />
        </div>
        <div>
          <h3 className="text-text-inverse font-semibold text-lg">{title}</h3>
          <p className="text-text-inverse/80 text-sm">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-text-inverse flex-shrink-0" />
    </button>
  );
};