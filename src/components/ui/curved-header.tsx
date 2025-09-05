import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CurvedHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
}

export const CurvedHeader = ({ 
  title, 
  subtitle, 
  showBackButton = true, 
  rightAction 
}: CurvedHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="bg-brand-green pb-16 pt-12 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="bg-brand-navy hover:bg-brand-navy/90 text-text-inverse rounded-full mr-3 h-12 w-12"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-text-inverse text-3xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-text-inverse text-lg font-normal mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {rightAction}
        </div>
      </div>
      
      {/* Curved bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-brand-green">
        <svg
          viewBox="0 0 400 40"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 Q200,40 400,0 L400,40 L0,40 Z"
            fill="currentColor"
            className="text-brand-green"
          />
        </svg>
      </div>
    </div>
  );
};