import React from "react";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsItemProps {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export const SettingsItem = ({ 
  label, 
  icon: Icon, 
  onClick,
  className 
}: SettingsItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 text-left hover:bg-surface-alt/50 transition-colors",
        "border-b border-border last:border-b-0",
        className
      )}
    >
      <div className="flex items-center space-x-3">
        {Icon && <Icon className="h-5 w-5 text-text-secondary" />}
        <span className="text-text-primary font-medium">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-text-secondary flex-shrink-0" />
    </button>
  );
};