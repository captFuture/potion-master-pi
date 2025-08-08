import { Button } from '@/components/ui/button';
import { useHardware } from '@/hooks/useHardware';
import { Wifi, WifiOff, Scale, Zap, Router, Activity } from 'lucide-react';

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

  // Get status colors using semantic tokens
  const getStatusColor = (isOk: boolean) => {
    return isOk ? 'text-success' : 'text-destructive';
  };

  const getOverallStatusColor = () => {
    if (status.isConnected) return 'text-success';
    if (status.wifiStatus) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Overall Connection Status */}
      <div className="flex items-center gap-1">
        {status.isConnected ? (
          <Wifi className={`h-4 w-4 ${getOverallStatusColor()}`} />
        ) : (
          <WifiOff className={`h-4 w-4 ${getOverallStatusColor()}`} />
        )}
      </div>

      {/* I2C Devices Status */}
      <div className="flex items-center gap-2">
        <Activity className={`h-4 w-4 ${getStatusColor(status.relayStatus)}`} />
        <Scale className={`h-4 w-4 ${getStatusColor(status.scaleStatus)}`} />
      </div>

      {/* Weight Display */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono text-foreground">{status.currentWeight.toFixed(1)}g</span>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleTareScale}
          disabled={!status.isConnected}
          className="h-6 px-2 text-xs"
        >
          Zero
        </Button>
      </div>

      {/* Active Pumps Indicator */}
      {displayActivePumps.size > 0 && (
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-success" />
          <span className="text-xs text-muted-foreground">{displayActivePumps.size}</span>
        </div>
      )}
    </div>
  );
};