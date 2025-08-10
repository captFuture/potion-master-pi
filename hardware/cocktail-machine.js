const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const i2c = require('i2c-bus');

class CocktailMachine {
  constructor() {
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    // Hardware configuration
    this.relayAddress = 0x20; // Standard PCF8574 Address
    this.scaleAddress = 0x26; // M5Stack MiniScale I2C address
    this.tareRegister = 0x50; // Tare register
    this.weightRegister = 0x10; // Weight register
    
    // Pump status tracking
    this.activePumps = new Set();
    this.i2cBus = null;
    this.mockMode = false;
    
    console.log('🔧 Initializing Cocktail Machine...');
    console.log(`🔌 Relay Address: 0x${this.relayAddress.toString(16)}`);
    console.log(`⚖️ Scale Address: 0x${this.scaleAddress.toString(16)}`);
    
    this.initializeI2C();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.initializeHardware();
  }

  initializeI2C() {
    try {
      this.i2cBus = i2c.openSync(1);
      console.log('✅ I2C bus initialized successfully');
    } catch (error) {
      console.warn('⚠️ I2C initialization failed, running in mock mode:', error.message);
      this.mockMode = true;
    }
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', mockMode: this.mockMode });
    });
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
        
        if (this.mockMode) {
          console.log(`🎭 Mock mode: Pump ${pumpNumber} activated`);
        } else {
          // PCF8574 relay control: 0 = relay ON, 1 = relay OFF
          // pumpNumber is 1-8, convert to bit position 0-7
          const bitPosition = pumpNumber - 1;
          
          // Read current state first to preserve other relays
          let currentState;
          try {
            currentState = this.readRelayState();
          } catch (error) {
            // If read fails, assume all relays are OFF (0xFF)
            currentState = 0xFF;
          }
          
          // Set the specific bit to 0 (activate relay)
          const activeMask = currentState & ~(1 << bitPosition);
          
          this.writeRelayState(activeMask);
          console.log(`✅ Pump ${pumpNumber} activated - bit ${bitPosition} set to 0 (mask: 0x${activeMask.toString(16).padStart(2, '0').toUpperCase()})`);
        }
        
        setTimeout(() => {
          try {
            if (!this.mockMode) {
              // Read current state and set the specific bit to 1 (deactivate relay)
              let currentState;
              try {
                currentState = this.readRelayState();
              } catch (error) {
                currentState = 0xFF;
              }
              
              const bitPosition = pumpNumber - 1;
              const deactiveMask = currentState | (1 << bitPosition);
              this.writeRelayState(deactiveMask);
              console.log(`🛑 Pump ${pumpNumber} deactivated - bit ${bitPosition} set to 1 (mask: 0x${deactiveMask.toString(16).padStart(2, '0').toUpperCase()})`);
            }
            this.activePumps.delete(pumpNumber);
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
      if (this.mockMode) {
        // Return mock weight with slight variation
        const mockWeight = 0 + (Math.random() * 2 - 1);
        return Math.round(mockWeight * 100) / 100;
      }
      
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
      if (!this.mockMode) {
        return 0; // Fallback to 0 instead of throwing
      }
      throw error;
    }
  }
  
  async tareScale() {
    console.log('🔄 Taring scale...');
    
    try {
      if (this.mockMode) {
        console.log('🎭 Mock mode: Scale tared');
        return;
      }
      
      // Write to tare register (0x50) to reset tare
      console.log(`📝 Writing 0x1 to tare register 0x${this.tareRegister.toString(16)} at address 0x${this.scaleAddress.toString(16)}`);
      this.i2cBus.writeByteSync(this.scaleAddress, this.tareRegister, 0x1);
      
      // Wait a moment for the scale to process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ Scale tared successfully');
    } catch (error) {
      console.error('❌ Tare error:', error);
      throw error;
    }
  }

  // Initialize and check hardware devices
  async initializeHardware() {
    console.log('🔍 Checking hardware devices...');
    
    if (this.mockMode) {
      console.log('🎭 Running in mock mode - hardware simulation active');
      return;
    }
    
    try {
      // Initialize all relays to OFF state
       this.writeRelayState(0xFF);
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
    if (this.mockMode) {
      return true; // Mock devices are always "available"
    }
    
    try {
      this.i2cBus.receiveByteSync(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Relay helpers for PCF8574 (single byte write/read)
  writeRelayState(state) {
    if (this.mockMode) return;
    const buf = Buffer.from([state & 0xFF]);
    this.i2cBus.i2cWriteSync(this.relayAddress, 1, buf);
  }

  readRelayState() {
    if (this.mockMode) return 0xFF;
    const buf = Buffer.alloc(1);
    this.i2cBus.i2cReadSync(this.relayAddress, 1, buf);
    return buf[0];
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
    console.log('🧹 Cleaning up hardware...');
    
    // Deactivate all relays
    if (!this.mockMode && this.i2cBus) {
      try {
        this.writeRelayState(0xFF);
        console.log('✅ All pumps deactivated');
      } catch (error) {
        console.error('❌ Cleanup error:', error);
      }
    }
    
    // Close I2C Bus
    if (this.i2cBus) {
      try {
        this.i2cBus.closeSync();
        console.log('✅ I2C bus closed');
      } catch (error) {
        console.error('❌ I2C cleanup error:', error);
      }
    }
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
