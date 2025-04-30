
import { useEffect } from "react";

interface FlashOverlayProps {
  onComplete: () => void;
}

const FlashOverlay = ({ onComplete }: FlashOverlayProps) => {
  useEffect(() => {
    // Auto-dismiss flash effect after animation completes
    const timer = setTimeout(() => {
      onComplete();
    }, 300);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 animate-[flash_0.3s_ease-out]">
      {/* This div serves as a full-screen white overlay */}
    </div>
  );
};

export default FlashOverlay;
