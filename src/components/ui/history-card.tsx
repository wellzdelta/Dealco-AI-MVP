import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface HistoryCardProps {
  productName: string;
  price: string;
  imageUrl?: string;
  onLinkClick?: () => void;
  onCardClick?: () => void;
}

export const HistoryCard = ({ 
  productName, 
  price, 
  imageUrl, 
  onLinkClick,
  onCardClick 
}: HistoryCardProps) => {
  return (
    <div
      onClick={onCardClick}
      className="bg-surface-card rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
    >
      <div className="flex items-center space-x-4">
        {/* Product Image */}
        <div className="w-20 h-20 bg-surface-alt rounded-xl flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-alt flex items-center justify-center">
              <span className="text-text-secondary text-xs">No Image</span>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-bold text-lg leading-tight mb-2">
            {productName}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-brand-green font-semibold text-lg">
              {price}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLinkClick?.();
              }}
              className="text-link-blue hover:text-link-blue/80 font-medium p-0 h-auto"
            >
              Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};