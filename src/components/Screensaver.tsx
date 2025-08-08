import { useEffect } from 'react';
import splashImage from '@/data/rpi_splash.png';

interface ScreensaverProps {
  isActive: boolean;
  onDismiss: () => void;
}

export const Screensaver = ({ isActive, onDismiss }: ScreensaverProps) => {
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex items-center justify-center cursor-pointer"
      onClick={onDismiss}
      onTouchStart={onDismiss}
    >
      <div className="w-full h-full flex items-center justify-center p-8">
        <img 
          src={splashImage} 
          alt="Potion Master Screensaver" 
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      {/* Touch anywhere hint */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-muted-foreground text-sm animate-pulse">
        Touch anywhere to continue
      </div>
    </div>
  );
};