
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Image, Flashlight, History, User, Camera } from "lucide-react";

interface ScannerInterfaceProps {
  onFlashToggle: () => void;
  uploadedImage: string | null;
  onImageUpload: (image: string | null) => void;
}

const ScannerInterface = ({ 
  onFlashToggle, 
  uploadedImage,
  onImageUpload 
}: ScannerInterfaceProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGalleryClick = () => {
    // Trigger file input click
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Convert file to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const handleScanClick = () => {
    setIsProcessing(true);
    // Add small delay before navigating to simulate processing
    setTimeout(() => {
      navigate("/loading");
    }, 300);
  };

  return (
    <div className="flex flex-col justify-between h-screen p-6">
      {/* Top Navigation Bar */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white/20 hover:bg-white/30 text-white rounded-full"
          onClick={() => navigate("/history")}
        >
          <History className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="bg-white/20 hover:bg-white/30 text-white rounded-full"
          onClick={() => navigate("/profile")}
        >
          <User className="h-5 w-5" />
        </Button>
      </div>

      {/* Scanner Viewfinder */}
      <div className="relative mx-auto w-full max-w-xs md:max-w-md">
        <div className="aspect-[3/4] w-full rounded-2xl border-2 border-white/80 shadow-lg overflow-hidden">
          {uploadedImage ? (
            <img 
              src={uploadedImage} 
              alt="Uploaded preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-black/30 flex items-center justify-center">
              <p className="text-white/70 text-sm">{t('positionDocument')}</p>
            </div>
          )}
        </div>

        {/* Scan corner marks */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-500"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-500"></div>
      </div>

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-around">
        {/* Gallery Button */}
        <button 
          onClick={handleGalleryClick}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white shadow-lg hover:opacity-90 transition-all"
        >
          <Image className="h-6 w-6" />
        </button>
        
        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Scan Button */}
        <button 
          onClick={handleScanClick}
          disabled={isProcessing}
          className={`w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-400 text-white shadow-lg hover:opacity-90 ${isProcessing ? 'animate-pulse' : ''} transition-all`}
        >
          <Camera className="h-8 w-8" />
        </button>

        {/* Flash Button */}
        <button 
          onClick={onFlashToggle}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white shadow-lg hover:opacity-90 transition-all"
        >
          <Flashlight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default ScannerInterface;
