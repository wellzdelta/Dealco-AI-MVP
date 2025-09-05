
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CurvedHeader } from "@/components/ui/curved-header";
import { FooterNav } from "@/components/ui/footer-nav";
import { HistoryCard } from "@/components/ui/history-card";

// Mock data matching the screenshot
const mockHistoryItems = [
  {
    id: 1,
    productName: "Nike Airforce 1",
    price: "$70.50",
    imageUrl: "/placeholder.svg" // Using placeholder for now
  },
  {
    id: 2,
    productName: "Nike Airforce 1",
    price: "$70.50",
    imageUrl: "/placeholder.svg"
  }
];

const History = () => {
  const navigate = useNavigate();

  const handleClearAll = () => {
    // Handle clear all logic
    console.log("Clear all history");
  };

  const handleItemClick = (item: any) => {
    console.log("Item clicked:", item);
  };

  const handleLinkClick = (item: any) => {
    console.log("Link clicked:", item);
  };

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Header with Clear All button */}
      <CurvedHeader
        title="History"
        rightAction={
          <Button
            onClick={handleClearAll}
            className="bg-brand-blue hover:bg-brand-blue/90 text-text-inverse rounded-full px-6 py-2 text-sm font-medium"
          >
            Clear All
          </Button>
        }
      />

      {/* Content */}
      <div className="px-6 pt-6 pb-32">
        {mockHistoryItems.length > 0 ? (
          <div className="space-y-4">
            {mockHistoryItems.map((item) => (
              <HistoryCard
                key={item.id}
                productName={item.productName}
                price={item.price}
                imageUrl={item.imageUrl}
                onCardClick={() => handleItemClick(item)}
                onLinkClick={() => handleLinkClick(item)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-secondary text-lg mb-6">Nothing scanned yet.</p>
            <Button 
              onClick={() => navigate("/")} 
              className="bg-brand-green hover:bg-brand-green/90 text-text-inverse"
            >
              Scan a product
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0">
        <FooterNav />
      </div>
    </div>
  );
};

export default History;
