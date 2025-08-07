import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { hardwareAPI } from '@/services/hardwareAPI';
import { Wifi, WifiOff, Scale, Zap } from 'lucide-react';

interface HardwareStatusProps {
  activePumps?: Set<number>;
}

export const HardwareStatus = ({ activePumps = new Set() }: HardwareStatusProps) => {
  const [hardwareStatus, setHardwareStatus] = useState({
    status: 'offline',
    pumps: 0,
    scale: false
  });
  const [currentWeight, setCurrentWeight] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial status check
    checkHardwareStatus();
    
    // Periodic status checks
    const statusInterval = setInterval(checkHardwareStatus, 5000);
    
    // Listen to weight updates
    hardwareAPI.onWeightUpdate(setCurrentWeight);
    
    return () => {
      clearInterval(statusInterval);
      hardwareAPI.disconnect();
    };
  }, []);

  const checkHardwareStatus = async () => {
    try {
      const status = await hardwareAPI.getStatus();
      setHardwareStatus(status);
      setIsConnected(status.status === 'ready');
    } catch (error) {
      setIsConnected(false);
      setHardwareStatus({ status: 'offline', pumps: 0, scale: false });
    }
  };

  const handleTareScale = async () => {
    try {
      await hardwareAPI.tareScale();
    } catch (error) {
      console.error('Tare failed:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-card-border rounded-lg min-w-[280px]">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Hardware Status</span>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* I2C Device Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Relay (0x20)</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
            <span className="text-xs">{isConnected ? 'OK' : 'ERROR'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Scale (0x26)</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${hardwareStatus.scale ? 'bg-success' : 'bg-destructive'}`} />
            <span className="text-xs">{hardwareStatus.scale ? 'OK' : 'ERROR'}</span>
          </div>
        </div>
      </div>

      {/* Scale Value and Tare */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{currentWeight.toFixed(1)}g</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleTareScale}
            disabled={!isConnected}
          >
            Zero
          </Button>
        </div>
      </div>

      {/* Pump Status Indicators */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Pumps</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }, (_, i) => i).map(pumpIndex => {
            const isActive = activePumps.has(pumpIndex);
            return (
              <div 
                key={pumpIndex}
                className="flex flex-col items-center gap-1"
              >
                <div 
                  className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    isActive 
                      ? 'bg-success border-success shadow-lg shadow-success/30' 
                      : 'bg-muted border-muted-foreground/20'
                  }`}
                />
                <span className="text-xs text-muted-foreground">{pumpIndex + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};