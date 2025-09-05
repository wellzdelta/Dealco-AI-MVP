import React from "react";
import { Button } from "@/components/ui/button";
import { History, User, ScanLine } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const FooterNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="relative">
      {/* Green curved wave background */}
      <div className="h-20 bg-brand-green relative">
        <svg
          viewBox="0 0 400 40"
          className="w-full h-10 absolute top-0"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 Q200,0 400,40 L400,0 L0,0 Z"
            fill="currentColor"
            className="text-brand-green"
          />
        </svg>
        
        {/* Navigation items */}
        <div className="absolute inset-0 flex items-center justify-between px-8 pt-6">
          {/* History icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/history")}
            className={`text-text-inverse hover:bg-transparent h-8 w-8 ${
              location.pathname === "/history" ? "opacity-100" : "opacity-70"
            }`}
          >
            <History className="h-6 w-6" />
          </Button>

          {/* Central FAB */}
          <Button
            onClick={() => navigate("/")}
            className="bg-brand-navy hover:bg-brand-navy/90 text-text-inverse rounded-full h-16 w-16 shadow-xl hover:scale-105 transition-all"
          >
            <ScanLine className="h-8 w-8" />
          </Button>

          {/* Profile icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className={`text-text-inverse hover:bg-transparent h-8 w-8 ${
              location.pathname === "/profile" ? "opacity-100" : "opacity-70"
            }`}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};