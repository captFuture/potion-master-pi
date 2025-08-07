// Hardware API für Raspberry Pi Integration
export class HardwareAPI {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private weightCallback?: (weight: number) => void;
  private i2cBus: any = null;
  
  // I2C Constants
  private readonly SCALE_ADDRESS = 0x26;
  private readonly RELAY_ADDRESS = 0x20;
  private readonly WEIGHT_REGISTER = 0x10;
  private readonly TARE_REGISTER = 0x50;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.initializeI2C();
    this.connectWebSocket();
  }

  // Initialize I2C Bus
  private async initializeI2C() {
    try {
      // Check if running in browser or Node.js environment
      if (typeof window !== 'undefined') {
        // Browser environment - use HTTP API
        return;
      }
      
      // Node.js environment - use direct I2C (only in hardware context)
      // This will be undefined in browser context
      this.i2cBus = null;
    } catch (error) {
      console.warn('I2C not available, using HTTP API fallback:', error);
    }
  }

  // WebSocket für Live-Updates
  private connectWebSocket() {
    try {
      this.ws = new WebSocket(`ws://localhost:3000`);
      
      this.ws.onopen = () => {
        console.log('🔗 Hardware WebSocket connected');
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'weight' && this.weightCallback) {
          this.weightCallback(data.data);
        }
      };
      
      this.ws.onclose = () => {
        console.log('❌ Hardware WebSocket disconnected');
        // Reconnect nach 5 Sekunden
        setTimeout(() => this.connectWebSocket(), 5000);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }

  // Check WiFi connection
  async checkWiFiConnection(): Promise<boolean> {
    try {
      // Check network connectivity
      const response = await fetch('http://www.google.com', { 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check I2C device availability
  async checkI2CDevice(address: number): Promise<boolean> {
    if (this.i2cBus) {
      try {
        this.i2cBus.receiveByteSync(address);
        return true;
      } catch (error) {
        return false;
      }
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch(`${this.baseUrl}/api/status`);
        const data = await response.json();
        if (address === this.SCALE_ADDRESS) return data.scale;
        if (address === this.RELAY_ADDRESS) return data.status === 'ready';
        return false;
      } catch (error) {
        return false;
      }
    }
  }

  // Hardware Status prüfen
  async getStatus(): Promise<{ 
    status: string; 
    pumps: number; 
    scale: boolean; 
    relay: boolean;
    wifi: boolean;
  }> {
    try {
      const wifi = await this.checkWiFiConnection();
      const scale = await this.checkI2CDevice(this.SCALE_ADDRESS);
      const relay = await this.checkI2CDevice(this.RELAY_ADDRESS);
      
      const status = relay && scale ? 'ready' : 'partial';
      
      return { 
        status, 
        pumps: relay ? 8 : 0, 
        scale,
        relay,
        wifi
      };
    } catch (error) {
      console.error('Hardware status check failed:', error);
      return { status: 'offline', pumps: 0, scale: false, relay: false, wifi: false };
    }
  }

  // Pumpe aktivieren
  async activatePump(pump: number, duration: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pump, duration })
      });
      
      if (!response.ok) {
        throw new Error(`Pump activation failed: ${response.statusText}`);
      }
      
      console.log(`✅ Pump ${pump} activated for ${duration}ms`);
    } catch (error) {
      console.error('Pump activation error:', error);
      throw error;
    }
  }

  // Gewicht einmalig messen
  async getWeight(): Promise<number> {
    if (this.i2cBus) {
      try {
        const buffer = Buffer.alloc(4);
        this.i2cBus.readI2cBlockSync(this.SCALE_ADDRESS, this.WEIGHT_REGISTER, 4, buffer);
        const weight = buffer.readFloatLE(0);
        return parseFloat(weight.toFixed(1));
      } catch (error) {
        console.error('Direct I2C weight reading error:', error);
        return 0;
      }
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch(`${this.baseUrl}/api/weight`);
        const data = await response.json();
        return data.weight;
      } catch (error) {
        console.error('Weight reading error:', error);
        return 0;
      }
    }
  }

  // Waage tarieren
  async tareScale(): Promise<void> {
    if (this.i2cBus) {
      try {
        this.i2cBus.writeByteSync(this.SCALE_ADDRESS, this.TARE_REGISTER, 0x1);
        console.log('⚖️ Scale tared successfully (direct I2C)');
        
        // Short delay to let tare complete
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Direct I2C tare error:', error);
        throw error;
      }
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch(`${this.baseUrl}/api/tare`, {
          method: 'POST'
        });
        
        if (!response.ok) {
          throw new Error('Scale tare failed');
        }
        
        console.log('⚖️ Scale tared successfully (HTTP API)');
      } catch (error) {
        console.error('Scale tare error:', error);
        throw error;
      }
    }
  }

  // Live Gewichtsupdates registrieren
  onWeightUpdate(callback: (weight: number) => void) {
    this.weightCallback = callback;
  }

  // WebSocket schließen
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.i2cBus) {
      try {
        this.i2cBus.closeSync();
        this.i2cBus = null;
      } catch (error) {
        console.warn('I2C bus close error:', error);
      }
    }
  }
}

// Singleton Instance
export const hardwareAPI = new HardwareAPI();