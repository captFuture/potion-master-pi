const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { Gpio } = require('onoff');
const i2c = require('i2c-bus');

class CocktailMachine {
  constructor() {
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    // I2C Bus für Relais
    this.i2cBus = i2c.openSync(1);
    this.relayAddress = 0x20; // Standard PCF8574 Adresse
    
    // HX711 Waage Pins
    this.scaleDataPin = new Gpio(5, 'in');
    this.scaleClockPin = new Gpio(6, 'out');
    
    // Kalibrierungswerte (müssen angepasst werden)
    this.scaleCalibration = 1000; // Kalibrierungsfaktor
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
    return new Promise((resolve, reject) => {
      try {
        let count = 0;
        let readings = [];
        
        // 10 Messungen für Mittelwert
        const readCycle = () => {
          if (count >= 10) {
            const average = readings.reduce((a, b) => a + b) / readings.length;
            const weight = (average - this.tareOffset) / this.scaleCalibration;
            resolve(Math.round(weight * 100) / 100); // 2 Dezimalstellen
            return;
          }
          
          // HX711 Daten lesen (vereinfacht)
          const rawValue = this.readHX711();
          readings.push(rawValue);
          count++;
          
          setTimeout(readCycle, 10); // 10ms zwischen Messungen
        };
        
        readCycle();
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  readHX711() {
    // Vereinfachte HX711 Implementierung
    // In Produktion sollte eine robustere Bibliothek verwendet werden
    let value = 0;
    
    // Warten bis Daten bereit sind
    while (this.scaleDataPin.readSync() === 1) {
      // Warten
    }
    
    // 24 Bits lesen
    for (let i = 0; i < 24; i++) {
      this.scaleClockPin.writeSync(1);
      value = (value << 1) | this.scaleDataPin.readSync();
      this.scaleClockPin.writeSync(0);
    }
    
    // Zusätzlicher Clock-Impuls für nächste Messung
    this.scaleClockPin.writeSync(1);
    this.scaleClockPin.writeSync(0);
    
    // 24-Bit zu 32-Bit signed
    if (value & 0x800000) {
      value |= 0xFF000000;
    }
    
    return value;
  }
  
  async tareScale() {
    console.log('Tarierung der Waage...');
    const readings = [];
    
    for (let i = 0; i < 20; i++) {
      readings.push(this.readHX711());
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    this.tareOffset = readings.reduce((a, b) => a + b) / readings.length;
    console.log(`Waage tariert. Offset: ${this.tareOffset}`);
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
    
    // GPIO cleanup
    if (this.scaleDataPin) this.scaleDataPin.unexport();
    if (this.scaleClockPin) this.scaleClockPin.unexport();
    
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