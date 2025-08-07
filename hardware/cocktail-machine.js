const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const i2c = require('i2c-bus');

class CocktailMachine {
  constructor() {
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    // I2C Bus setup
    this.i2cBus = i2c.openSync(1);
    this.relayAddress = 0x20; // Standard PCF8574 Adresse
    
    // M5Stack MiniScale I2C setup
    this.scaleAddress = 0x26; // M5Stack MiniScale I2C address
    this.tareOffset = 0;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('../dist')); // React Build
  }
  
  setupRoutes() {
    // Pumpe aktivieren
    this.app.post('/api/pump', async (req, res) => {
      try {
        const { pump, duration } = req.body;
        await this.activatePump(pump, duration);
        res.json({ status: 'success', pump, duration });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Gewicht messen
    this.app.get('/api/weight', async (req, res) => {
      try {
        const weight = await this.readWeight();
        res.json({ weight });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Waage tarieren
    this.app.post('/api/tare', async (req, res) => {
      try {
        await this.tareScale();
        res.json({ status: 'tared' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Hardware Status
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'ready',
        pumps: 8,
        scale: true,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      
      // Kontinuierliche Gewichtsupdates
      const weightInterval = setInterval(async () => {
        try {
          const weight = await this.readWeight();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'weight', data: weight }));
          }
        } catch (error) {
          console.error('Weight reading error:', error);
        }
      }, 500); // Alle 500ms
      
      ws.on('close', () => {
        clearInterval(weightInterval);
        console.log('WebSocket client disconnected');
      });
    });
  }
  
  async activatePump(pumpNumber, duration) {
    return new Promise((resolve, reject) => {
      try {
        // Relais aktivieren (LOW = aktiviert bei den meisten Boards)
        const activeMask = ~(1 << pumpNumber) & 0xFF;
        this.i2cBus.writeByteSync(this.relayAddress, activeMask);
        
        console.log(`Pump ${pumpNumber} activated for ${duration}ms`);
        
        setTimeout(() => {
          // Alle Relais deaktivieren
          this.i2cBus.writeByteSync(this.relayAddress, 0xFF);
          console.log(`Pump ${pumpNumber} deactivated`);
          resolve();
        }, duration);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  async readWeight() {
    try {
      // M5Stack MiniScale: Read weight from register 0x10 (4 bytes float)
      const buffer = Buffer.alloc(4);
      this.i2cBus.readI2cBlockSync(this.scaleAddress, 0x10, 4, buffer);
      
      // Convert 4 bytes to float (little endian)
      const weight = buffer.readFloatLE(0);
      
      // Apply tare offset
      const finalWeight = weight - this.tareOffset;
      
      return Math.round(finalWeight * 100) / 100; // 2 decimal places
    } catch (error) {
      console.error('Scale reading error:', error);
      throw error;
    }
  }
  
  async tareScale() {
    console.log('Tarierung der M5Stack MiniScale...');
    
    try {
      // Write to offset register (0x50) to reset tare
      this.i2cBus.writeByteSync(this.scaleAddress, 0x50);
      
      // Wait a moment for the scale to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Read current weight to set as tare offset
      const currentWeight = await this.readWeight();
      this.tareOffset = currentWeight;
      
      console.log(`M5Stack MiniScale tariert. Offset: ${this.tareOffset}g`);
    } catch (error) {
      console.error('Tare error:', error);
      throw error;
    }
  }
  
  start(port = 3000) {
    this.server.listen(port, () => {
      console.log(`🍹 Cocktail Machine API running on port ${port}`);
      console.log(`🌐 Web interface: http://localhost:${port}`);
    });
  }
  
  cleanup() {
    // Alle Relais deaktivieren
    try {
      this.i2cBus.writeByteSync(this.relayAddress, 0xFF);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    
    // I2C Bus schließen
    if (this.i2cBus) this.i2cBus.closeSync();
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down cocktail machine...');
  if (global.machine) {
    global.machine.cleanup();
  }
  process.exit(0);
});

// Server starten
const machine = new CocktailMachine();
global.machine = machine;
machine.start();

module.exports = CocktailMachine;