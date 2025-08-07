// Hardware API für Raspberry Pi Integration
export class HardwareAPI {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private weightCallback?: (weight: number) => void;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.connectWebSocket();
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

  // Hardware Status prüfen
  async getStatus(): Promise<{ status: string; pumps: number; scale: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`);
      return await response.json();
    } catch (error) {
      console.error('Hardware status check failed:', error);
      return { status: 'offline', pumps: 0, scale: false };
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
    try {
      const response = await fetch(`${this.baseUrl}/api/weight`);
      const data = await response.json();
      return data.weight;
    } catch (error) {
      console.error('Weight reading error:', error);
      return 0;
    }
  }

  // Waage tarieren
  async tareScale(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tare`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Scale tare failed');
      }
      
      console.log('⚖️ Scale tared successfully');
    } catch (error) {
      console.error('Scale tare error:', error);
      throw error;
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
  }
}

// Singleton Instance
export const hardwareAPI = new HardwareAPI();