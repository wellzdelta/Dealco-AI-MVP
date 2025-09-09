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
      className="bg-surface-card rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-border/50 hover:border-brand-blue/30 group"
    >
      <div className="flex items-center space-x-5">
        {/* Product Image */}
        <div className="w-24 h-24 bg-surface-alt rounded-2xl flex-shrink-0 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface-alt to-surface-card flex items-center justify-center">
              <span className="text-text-secondary text-xs font-medium">No Image</span>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-bold text-lg leading-tight mb-3 line-clamp-2 group-hover:text-brand-blue transition-colors">
            {productName}
          </h3>
          
          {/* Price and Action Row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-brand-green font-bold text-xl">
                {price}
              </span>
              <span className="text-text-secondary text-xs font-medium">
                Best Price Found
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLinkClick?.();
              }}
              className="text-link-blue hover:text-link-blue/80 font-semibold p-2 h-auto rounded-full hover:bg-link-blue/10 transition-all"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};