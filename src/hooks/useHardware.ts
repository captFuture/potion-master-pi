import { useState, useEffect, useCallback } from 'react';
import { hardwareAPI } from '@/services/hardwareAPI';

export interface HardwareStatus {
  isConnected: boolean;
  relayStatus: boolean;
  scaleStatus: boolean;
  wifiStatus: boolean;
  currentWeight: number;
  activePumps: Set<number>;
}

export function useHardware() {
  const [status, setStatus] = useState<HardwareStatus>({
    isConnected: false,
    relayStatus: false,
    scaleStatus: false,
    wifiStatus: false,
    currentWeight: 0,
    activePumps: new Set()
  });

  // Check hardware status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const hwStatus = await hardwareAPI.getStatus();
        setStatus(prev => ({
          ...prev,
          isConnected: hwStatus.relay && hwStatus.scale,
          relayStatus: hwStatus.relay,
          scaleStatus: hwStatus.scale,
          wifiStatus: hwStatus.wifi
        }));
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          isConnected: false,
          relayStatus: false,
          scaleStatus: false,
          wifiStatus: false
        }));
      }
    };

    const updateWeight = async () => {
      try {
        const weight = await hardwareAPI.getWeight();
        setStatus(prev => ({ ...prev, currentWeight: weight }));
      } catch (error) {
        console.error('Weight update failed:', error);
      }
    };

    checkStatus();
    updateWeight();
    
    const statusInterval = setInterval(checkStatus, 5000);
    const weightInterval = setInterval(updateWeight, 1000);

    // Listen to weight updates from WebSocket
    hardwareAPI.onWeightUpdate((weight) => {
      setStatus(prev => ({ ...prev, currentWeight: weight }));
    });

    return () => {
      clearInterval(statusInterval);
      clearInterval(weightInterval);
      hardwareAPI.disconnect();
    };
  }, []);

  const activatePump = useCallback(async (pumpNumber: number, duration: number) => {
    try {
      setStatus(prev => ({
        ...prev,
        activePumps: new Set([...prev.activePumps, pumpNumber])
      }));

      await hardwareAPI.activatePump(pumpNumber, duration);

      // Remove pump from active set after duration
      setTimeout(() => {
        setStatus(prev => {
          const newActivePumps = new Set(prev.activePumps);
          newActivePumps.delete(pumpNumber);
          return { ...prev, activePumps: newActivePumps };
        });
      }, duration);
    } catch (error) {
      setStatus(prev => {
        const newActivePumps = new Set(prev.activePumps);
        newActivePumps.delete(pumpNumber);
        return { ...prev, activePumps: newActivePumps };
      });
      throw error;
    }
  }, []);

  const startPump = useCallback(async (pumpNumber: number) => {
    setStatus(prev => ({
      ...prev,
      activePumps: new Set([...prev.activePumps, pumpNumber])
    }));
    try {
      await hardwareAPI.startPump(pumpNumber);
    } catch (error) {
      setStatus(prev => {
        const newActivePumps = new Set(prev.activePumps);
        newActivePumps.delete(pumpNumber);
        return { ...prev, activePumps: newActivePumps };
      });
      throw error;
    }
  }, []);

  const stopPump = useCallback(async (pumpNumber: number) => {
    try {
      await hardwareAPI.stopPump(pumpNumber);
    } finally {
      setStatus(prev => {
        const newActivePumps = new Set(prev.activePumps);
        newActivePumps.delete(pumpNumber);
        return { ...prev, activePumps: newActivePumps };
      });
    }
  }, []);

  const tareScale = useCallback(async () => {
    try {
      await hardwareAPI.tareScale();
    } catch (error) {
      console.error('Tare failed:', error);
      throw error;
    }
  }, []);

  const getWeight = useCallback(async () => {
    try {
      return await hardwareAPI.getWeight();
    } catch (error) {
      console.error('Weight reading failed:', error);
      return 0;
    }
  }, []);

  return {
    status,
    activatePump,
    startPump,
    stopPump,
    tareScale,
    getWeight
  };
}