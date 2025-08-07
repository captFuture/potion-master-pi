import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHardware } from '@/hooks/useHardware';
import { Wifi, WifiOff, Scale, Zap, Router } from 'lucide-react';

interface HardwareStatusProps {
  activePumps?: Set<number>;
}

export const HardwareStatus = ({ activePumps }: HardwareStatusProps) => {
  const { status, tareScale } = useHardware();
  
  // Use prop activePumps if provided, otherwise use hardware status
  const displayActivePumps = activePumps || status.activePumps;

  const handleTareScale = async () => {
    try {
      await tareScale();
    } catch (error) {
      console.error('Tare failed:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-card-border rounded-lg min-w-[280px]">
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Hardware Status</span>
        <div className="flex items-center gap-2">
          {status.isConnected ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <Badge variant={status.isConnected ? "default" : "destructive"}>
            {status.isConnected ? "Ready" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* WiFi Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Router className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">WiFi</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${status.wifiStatus ? 'bg-success' : 'bg-destructive'}`} />
          <span className="text-xs">{status.wifiStatus ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      {/* I2C Device Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Relay (0x20)</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status.relayStatus ? 'bg-success' : 'bg-destructive'}`} />
            <span className="text-xs">{status.relayStatus ? 'OK' : 'ERROR'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Scale (0x26)</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status.scaleStatus ? 'bg-success' : 'bg-destructive'}`} />
            <span className="text-xs">{status.scaleStatus ? 'OK' : 'ERROR'}</span>
          </div>
        </div>
      </div>

      {/* Scale Value and Tare */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{status.currentWeight.toFixed(1)}g</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleTareScale}
            disabled={!status.isConnected}
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
          {Array.from({ length: 8 }, (_, i) => i + 1).map(pumpNumber => {
            const isActive = displayActivePumps.has(pumpNumber);
            return (
              <div 
                key={pumpNumber}
                className="flex flex-col items-center gap-1"
              >
                <div 
                  className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    isActive 
                      ? 'bg-success border-success shadow-lg shadow-success/30' 
                      : 'bg-muted border-muted-foreground/20'
                  }`}
                />
                <span className="text-xs text-muted-foreground">{pumpNumber}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};