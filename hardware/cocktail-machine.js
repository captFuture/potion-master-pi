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
    this.tareRegister = 0x50; // Tare register
    this.weightRegister = 0x10; // Weight register
    
    // Pump status tracking
    this.activePumps = new Set();
    
    console.log('🔧 Initializing Cocktail Machine...');
    console.log(`📡 I2C Bus: 1`);
    console.log(`🔌 Relay Address: 0x${this.relayAddress.toString(16)}`);
    console.log(`⚖️ Scale Address: 0x${this.scaleAddress.toString(16)}`);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.initializeHardware();
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
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = await this.getHardwareStatus();
        res.json(status);
      } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: error.message });
      }
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
        console.log(`🚀 Activating pump ${pumpNumber} for ${duration}ms`);
        this.activePumps.add(pumpNumber);
        
        // Relais aktivieren (LOW = aktiviert bei den meisten Boards)
        const activeMask = ~(1 << pumpNumber) & 0xFF;
        this.i2cBus.writeByteSync(this.relayAddress, activeMask);
        
        console.log(`✅ Pump ${pumpNumber} activated with mask: 0x${activeMask.toString(16)}`);
        
        setTimeout(() => {
          try {
            // Alle Relais deaktivieren
            this.i2cBus.writeByteSync(this.relayAddress, 0xFF);
            this.activePumps.delete(pumpNumber);
            console.log(`🛑 Pump ${pumpNumber} deactivated`);
            resolve();
          } catch (error) {
            console.error(`❌ Error deactivating pump ${pumpNumber}:`, error);
            this.activePumps.delete(pumpNumber);
            reject(error);
          }
        }, duration);
        
      } catch (error) {
        console.error(`❌ Error activating pump ${pumpNumber}:`, error);
        this.activePumps.delete(pumpNumber);
        reject(error);
      }
    });
  }
  
  async readWeight() {
    try {
      console.log('📏 Reading weight from scale...');
      
      // M5Stack MiniScale: Read weight from register 0x10 (4 bytes float)
      const buffer = Buffer.alloc(4);
      this.i2cBus.readI2cBlockSync(this.scaleAddress, this.weightRegister, 4, buffer);
      
      // Convert 4 bytes to float (little endian)
      const weight = buffer.readFloatLE(0);
      const finalWeight = Math.round(weight * 100) / 100; // 2 decimal places
      
      console.log(`⚖️ Weight reading: ${finalWeight}g (raw: ${weight})`);
      
      return finalWeight;
    } catch (error) {
      console.error('❌ Scale reading error:', error);
      throw error;
    }
  }
  
  async tareScale() {
    console.log('🔄 Taring M5Stack MiniScale...');
    
    try {
      // Write to tare register (0x50) to reset tare
      console.log(`📝 Writing 0x1 to tare register 0x${this.tareRegister.toString(16)} at address 0x${this.scaleAddress.toString(16)}`);
      this.i2cBus.writeByteSync(this.scaleAddress, this.tareRegister, 0x1);
      
      // Wait a moment for the scale to process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ M5Stack MiniScale tared successfully');
    } catch (error) {
      console.error('❌ Tare error:', error);
      throw error;
    }
  }

  // Initialize and check hardware devices
  async initializeHardware() {
    console.log('🔍 Checking hardware devices...');
    
    try {
      // Initialize all relays to OFF state
      this.i2cBus.writeByteSync(this.relayAddress, 0xFF);
      console.log('✅ Relay board initialized (all pumps OFF)');
    } catch (error) {
      console.error('❌ Relay board initialization failed:', error);
    }
    
    try {
      // Test scale communication
      const testWeight = await this.readWeight();
      console.log(`✅ Scale communication OK, initial weight: ${testWeight}g`);
    } catch (error) {
      console.error('❌ Scale communication failed:', error);
    }
  }

  // Check I2C device availability
  async checkI2CDevice(address) {
    try {
      this.i2cBus.receiveByteSync(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get comprehensive hardware status
  async getHardwareStatus() {
    console.log('🔍 Checking hardware status...');
    
    const relayConnected = await this.checkI2CDevice(this.relayAddress);
    const scaleConnected = await this.checkI2CDevice(this.scaleAddress);
    
    let currentWeight = 0;
    if (scaleConnected) {
      try {
        currentWeight = await this.readWeight();
      } catch (error) {
        console.error('Weight reading failed during status check:', error);
      }
    }
    
    const status = relayConnected && scaleConnected ? 'ready' : 'partial';
    
    const hardwareStatus = {
      status,
      overall: status,
      relay: {
        connected: relayConnected,
        address: `0x${this.relayAddress.toString(16)}`,
        status: relayConnected ? 'OK' : 'ERROR'
      },
      scale: {
        connected: scaleConnected,
        address: `0x${this.scaleAddress.toString(16)}`,
        status: scaleConnected ? 'OK' : 'ERROR',
        currentWeight
      },
      pumps: {
        total: 8,
        active: Array.from(this.activePumps),
        activeCount: this.activePumps.size
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Hardware Status:', JSON.stringify(hardwareStatus, null, 2));
    
    return hardwareStatus;
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
const PORT = process.env.PORT || 3001;
const machine = new CocktailMachine();
global.machine = machine;
machine.start(PORT);

module.exports = CocktailMachine;