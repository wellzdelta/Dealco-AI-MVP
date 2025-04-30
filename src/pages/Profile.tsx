
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";

const Profile = () => {
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
          <h1 className="text-xl font-bold ml-2">Profile</h1>
        </div>
      </div>
      
      <div className="flex flex-col items-center py-8 px-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mt-4">User Name</h2>
        <p className="text-gray-500">user@example.com</p>
        
        <div className="w-full max-w-md mt-8">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex justify-between items-center">
            <span>Storage Used</span>
            <span className="text-blue-600">0 MB</span>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex justify-between items-center">
            <span>Total Scans</span>
            <span className="text-blue-600">0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
