import { useState, useEffect, useCallback } from 'react';

export interface ScreensaverHook {
  isScreensaverActive: boolean;
  resetScreensaver: () => void;
}

export const useScreensaver = (timeoutSeconds: number = 60): ScreensaverHook => {
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetScreensaver = useCallback(() => {
    setIsScreensaverActive(false);
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      if (timeSinceLastActivity >= timeoutSeconds * 1000 && !isScreensaverActive) {
        setIsScreensaverActive(true);
      }
    };

    const interval = setInterval(checkInactivity, 1000);
    
    return () => clearInterval(interval);
  }, [lastActivity, timeoutSeconds, isScreensaverActive]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (isScreensaverActive) {
        resetScreensaver();
      } else {
        setLastActivity(Date.now());
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isScreensaverActive, resetScreensaver]);

  return {
    isScreensaverActive,
    resetScreensaver
  };
};