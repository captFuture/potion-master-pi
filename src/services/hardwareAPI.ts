// Hardware API für Raspberry Pi Integration
export class HardwareAPI {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private wsReconnectDelay = 2000;
  private wsHeartbeatInterval: number | null = null;
  private wsLastMessageAt = 0;
  private wsConnected = false;
  private weightCallback?: (weight: number) => void;
  private wsStatusCallback?: (connected: boolean, info?: { code?: number; reason?: string; clean?: boolean }) => void;
  private i2cBus: any = null;
  
  // I2C Constants
  private readonly SCALE_ADDRESS = 0x26;
  private readonly RELAY_ADDRESS = 0x20;
  private readonly WEIGHT_REGISTER = 0x10;
  private readonly TARE_REGISTER = 0x50;

  private mockMode = false;
  private mockWeight = 0;

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

  // WebSocket for live updates with heartbeat and detailed logging
  private connectWebSocket() {
    try {
      const wsUrl = this.baseUrl.replace(/^http/, 'ws');
      this.ws = new WebSocket(wsUrl);
      this.wsLastMessageAt = Date.now();

      this.ws.onopen = () => {
        console.log('🔗 Hardware WebSocket connected');
        this.wsReconnectDelay = 2000;
        this.wsLastMessageAt = Date.now();
        this.wsConnected = true;
        this.wsStatusCallback?.(true);

        // Heartbeat: if no messages arrive for 5s, log silence
        if (this.wsHeartbeatInterval) {
          clearInterval(this.wsHeartbeatInterval);
        }
        this.wsHeartbeatInterval = window.setInterval(() => {
          const silenceMs = Date.now() - this.wsLastMessageAt;
          if (silenceMs > 10000) {
            console.warn(`⏱️ WS silence ${silenceMs}ms (keeping connection open)`);
          }
        }, 2500);
      };

      this.ws.onmessage = (event) => {
        this.wsLastMessageAt = Date.now();
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'weight' && this.weightCallback) {
            this.weightCallback(data.data);
          } else if (data.type === 'pump') {
            console.log(`🔄 WS pump event: #${data.pump} -> ${data.state}`);
          }
        } catch (err) {
          console.warn('WS message parse error:', err);
        }
      };

      this.ws.onclose = (ev) => {
        console.log(`❌ Hardware WebSocket disconnected (code=${ev.code}, reason=${ev.reason}, clean=${ev.wasClean}) - will retry`);
        if (this.wsHeartbeatInterval) {
          clearInterval(this.wsHeartbeatInterval);
          this.wsHeartbeatInterval = null;
        }
        this.wsConnected = false;
        this.wsStatusCallback?.(false, { code: ev.code, reason: String(ev.reason || ''), clean: ev.wasClean });
        setTimeout(() => this.connectWebSocket(), this.wsReconnectDelay);
        this.wsReconnectDelay = Math.min(this.wsReconnectDelay * 2, 10000);
      };

      this.ws.onerror = (ev) => {
        console.error('⚠️ WebSocket error event:', ev);
      };
    } catch (error) {
      console.log('⚠️ Hardware WebSocket setup failed - will retry', error);
      setTimeout(() => this.connectWebSocket(), this.wsReconnectDelay);
      this.wsReconnectDelay = Math.min(this.wsReconnectDelay * 2, 10000);
    }
  }

  // Check WiFi connection
  async checkWiFiConnection(): Promise<boolean> {
    try {
      // In browser, rely on navigator.onLine to avoid CORS to external sites
      if (typeof window !== 'undefined') {
        return navigator.onLine;
      }
      // In Node.js (hardware), ping local health endpoint
      const controller = AbortSignal.timeout(3000);
      const res = await fetch(`${this.baseUrl}/health`, { signal: controller });
      return res.ok;
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
        if (address === this.RELAY_ADDRESS) return data.relay;
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
    if (this.mockMode) {
      return { 
        status: 'mock', 
        pumps: 8, 
        scale: true,
        relay: true,
        wifi: true
      };
    }

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
      console.error('Hardware status error:', error);
      return { status: 'error', pumps: 0, scale: false, relay: false, wifi: false };
    }
  }

  // Pumpe aktivieren - Updated for PCF8574 relay control
  async activatePump(pump: number, duration: number): Promise<void> {
    if (this.mockMode) {
      console.log(`🎭 Mock mode: Pump ${pump} activated for ${duration}ms`);
      return;
    }

    try {
      console.log(`Activating pump ${pump} for ${duration}ms via HTTP…`);
      const response = await fetch(`${this.baseUrl}/api/pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({ pump, duration })
      });
      
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Pump activation failed (${response.status}): ${response.statusText} ${text}`);
      }
      
      console.log(`✅ Pump ${pump} activation request accepted (duration=${duration}ms)`);
    } catch (error) {
      console.error('Pump activation error:', error);
      throw error;
    }
  }

  // Start pump until explicitly stopped (uses long duration)
  async startPump(pump: number): Promise<void> {
    console.log(`Start pump ${pump} (long run)`);
    const response = await fetch(`${this.baseUrl}/api/pump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ pump, duration: 600000 })
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Start pump failed (${response.status}): ${response.statusText} ${text}`);
    }
  }

  // Stop pump immediately via dedicated endpoint
  async stopPump(pump: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pump/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ pump })
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Stop pump failed (${response.status}): ${response.statusText} ${text}`);
    }
  }

  // Gewicht einmalig messen
  async getWeight(): Promise<number> {
    if (this.mockMode) {
      // Simulate slight weight variations in mock mode
      this.mockWeight += (Math.random() - 0.5) * 0.1;
      return Math.max(0, parseFloat(this.mockWeight.toFixed(1)));
    }

    if (this.i2cBus) {
      try {
        const buffer = Buffer.alloc(4);
        this.i2cBus.readI2cBlockSync(this.SCALE_ADDRESS, this.WEIGHT_REGISTER, 4, buffer);
        const weight = buffer.readFloatLE(0);
        return parseFloat(weight.toFixed(1));
      } catch (error) {
        console.error('Direct I2C weight reading error:', error);
        this.mockMode = true;
        return 0;
      }
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch(`${this.baseUrl}/api/weight`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        const data = await response.json();
        return data.weight;
      } catch (error) {
        console.error('HTTP API weight reading error:', error);
        return 0;
      }
    }
  }

  // Waage tarieren
  async tareScale(): Promise<void> {
    if (this.mockMode) {
      this.mockWeight = 0;
      console.log('⚖️ Scale tared successfully (mock mode)');
      return;
    }

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
          method: 'POST',
          signal: AbortSignal.timeout(2000)
        });
        
        if (!response.ok) {
          throw new Error('Scale tare failed');
        }
        
        console.log('⚖️ Scale tared successfully (HTTP API)');
      } catch (error) {
        console.error('Scale tare failed (HTTP API):', error);
        throw error;
      }
    }
  }

  // Live Gewichtsupdates registrieren
  onWeightUpdate(callback: (weight: number) => void) {
    this.weightCallback = callback;
  }

  // Expose WS/base URL and liveness for consumers
  getBaseUrl() { return this.baseUrl; }
  isWsConnected() { return this.wsConnected; }
  hasLiveFeed(thresholdMs = 3000) { return !!this.ws && Date.now() - this.wsLastMessageAt < thresholdMs; }
  onWsStatusChange(cb: (connected: boolean, info?: { code?: number; reason?: string; clean?: boolean }) => void) { this.wsStatusCallback = cb; }

  // WebSocket schließen
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.wsConnected = false;
    this.wsStatusCallback?.(false);
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
