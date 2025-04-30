
import { useState } from "react";
import ScannerInterface from "@/components/ScannerInterface";
import FlashOverlay from "@/components/FlashOverlay";

const Index = () => {
  const [showFlash, setShowFlash] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Show flash animation overlay when flash is triggered */}
      {showFlash && <FlashOverlay onComplete={() => setShowFlash(false)} />}
      
      <ScannerInterface 
        onFlashToggle={() => setShowFlash(true)} 
        uploadedImage={uploadedImage}
        onImageUpload={setUploadedImage}
      />
    </div>
  );
};

export default Index;
