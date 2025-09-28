
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CurvedHeader } from "@/components/ui/curved-header";
import { FooterNav } from "@/components/ui/footer-nav";
import { HistoryCard } from "@/components/ui/history-card";

// Mock data with more variety for better testing
const mockHistoryItems = [
  {
    id: 1,
    productName: "Nike Air Force 1 '07",
    price: "$70.50",
    imageUrl: "/placeholder.svg",
    date: "2024-01-15",
    category: "Shoes"
  },
  {
    id: 2,
    productName: "Apple AirPods Pro (2nd Gen)",
    price: "$249.00",
    imageUrl: "/placeholder.svg",
    date: "2024-01-14",
    category: "Electronics"
  },
  {
    id: 3,
    productName: "Samsung Galaxy S24 Ultra",
    price: "$1,199.99",
    imageUrl: "/placeholder.svg",
    date: "2024-01-13",
    category: "Electronics"
  },
  {
    id: 4,
    productName: "Levi's 501 Original Jeans",
    price: "$89.50",
    imageUrl: "/placeholder.svg",
    date: "2024-01-12",
    category: "Clothing"
  }
];

const History = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        title={t('history')}
        rightAction={
          <Button
            onClick={handleClearAll}
            className="bg-brand-blue hover:bg-brand-blue/90 text-text-inverse rounded-full px-6 py-2 text-sm font-medium"
          >
            {t('clearAll')}
          </Button>
        }
      />

      {/* Content */}
      <div className="px-6 pt-6 pb-32">
        {mockHistoryItems.length > 0 ? (
          <div className="space-y-6">
            {/* Stats Section */}
            <div className="bg-gradient-to-r from-brand-blue/10 to-brand-green/10 rounded-2xl p-6 border border-brand-blue/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text-primary font-bold text-xl mb-1">
                    {mockHistoryItems.length} {mockHistoryItems.length === 1 ? 'Item' : 'Items'} Scanned
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Total estimated savings: $127.50
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand-green">
                    {mockHistoryItems.length}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Products
                  </div>
                </div>
              </div>
            </div>

            {/* History Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-text-primary font-semibold text-lg">
                  Recent Scans
                </h2>
                <div className="text-sm text-text-secondary">
                  Last updated: Today
                </div>
              </div>
              
              {mockHistoryItems.map((item, index) => (
                <div key={item.id} className="relative">
                  <HistoryCard
                    productName={item.productName}
                    price={item.price}
                    imageUrl={item.imageUrl}
                    onCardClick={() => handleItemClick(item)}
                    onLinkClick={() => handleLinkClick(item)}
                  />
                  {/* Subtle separator for visual hierarchy */}
                  {index < mockHistoryItems.length - 1 && (
                    <div className="absolute -bottom-2 left-6 right-6 h-px bg-border/30"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-surface-card rounded-full flex items-center justify-center">
              <div className="text-4xl">📱</div>
            </div>
            <h3 className="text-text-primary font-bold text-xl mb-3">
              {t('nothingScanned')}
            </h3>
            <p className="text-text-secondary text-base mb-8 max-w-sm mx-auto">
              Start scanning products to build your price comparison history and discover the best deals.
            </p>
            <Button 
              onClick={() => navigate("/")} 
              className="bg-brand-green hover:bg-brand-green/90 text-text-inverse px-8 py-3 text-base font-medium rounded-full shadow-lg"
            >
              {t('scanProduct')}
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
