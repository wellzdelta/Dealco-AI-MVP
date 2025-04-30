
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const History = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 bg-white shadow-md">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Scan History</h1>
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-center text-gray-500 py-8">
          <p>No scan history found</p>
          <Button 
            onClick={() => navigate("/")} 
            variant="outline"
            className="mt-4"
          >
            Start scanning
          </Button>
        </div>
      </div>
    </div>
  );
};

export default History;
