
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShoppingBag, DollarSign, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shopping and saving quotes
const quotes = [
  { text: "Smart shopping starts with smart scanning!", icon: ShoppingBag },
  { text: "Every scan saves you money and time!", icon: DollarSign },
  { text: "Discover amazing deals with every product!", icon: Star },
  { text: "Your shopping companion for better decisions!", icon: Zap },
  { text: "Compare prices, save money, shop smarter!", icon: ShoppingBag },
  { text: "Turn every purchase into a smart investment!", icon: DollarSign }
];

const Loading = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [mascotAnimation, setMascotAnimation] = useState(0);
  
  useEffect(() => {
    // Rotate quotes every 1.5 seconds
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 1500);

    // Mascot animation
    const mascotInterval = setInterval(() => {
      setMascotAnimation((prev) => (prev + 1) % 4);
    }, 800);

    // Simulate processing time, then return to home
    const timeout = setTimeout(() => {
      navigate("/");
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(quoteInterval);
      clearInterval(mascotInterval);
    };
  }, [navigate]);
  
  const currentQuote = quotes[currentQuoteIndex];
  const QuoteIcon = currentQuote.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col">
      <div className="p-4">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Mascot Character */}
        <div className="relative mb-8">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center transition-all duration-500 ${
            mascotAnimation === 0 ? 'scale-100 rotate-0' :
            mascotAnimation === 1 ? 'scale-110 rotate-12' :
            mascotAnimation === 2 ? 'scale-95 -rotate-6' :
            'scale-105 rotate-3'
          }`}>
            <div className="text-4xl">🛒</div>
          </div>
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 -left-3 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
        </div>

        {/* Scanner Animation */}
        <div className="relative w-64 h-64 mb-8">
          <div className="w-full h-full rounded-lg border-2 border-green-500 animate-pulse shadow-lg shadow-green-500/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          {/* Scanning lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-green-400 animate-pulse opacity-60"></div>
          </div>
        </div>

        {/* Rotating Quote */}
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center mb-4">
            <QuoteIcon className="h-6 w-6 text-green-400 mr-2" />
            <p className="text-white text-lg font-medium transition-all duration-500">
              {currentQuote.text}
            </p>
          </div>
          <p className="text-gray-400 text-sm animate-pulse">
            {t('processingScan')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
