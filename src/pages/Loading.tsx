
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Loading = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Simulate processing time, then return to home
    const timeout = setTimeout(() => {
      navigate("/");
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="p-4">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-64 h-64">
          <div className="w-full h-full rounded-lg border-2 border-green-500 animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="text-white mt-8 animate-pulse">Processing scan...</p>
      </div>
    </div>
  );
};

export default Loading;
