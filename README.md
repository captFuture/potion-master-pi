# Potion Master Pi - Cocktail Machine

A React-based web interface for controlling a Raspberry Pi cocktail mixing machine with hardware integration.

## Features

- 🍹 Interactive cocktail selection and mixing
- ⚖️ Real-time weight monitoring with M5Stack MiniScale
- 🔌 8-channel relay control for pumps
- 📱 Touch-friendly responsive interface
- 🎮 Hardware abstraction with mock mode for development
- 🚀 Simple manual start scripts (no systemd required)

## Hardware Requirements

- Raspberry Pi 4 (recommended) or Raspberry Pi 3
- M5Stack MiniScale (I2C address: 0x26)
- 8-channel I2C relay board (I2C address: 0x20)
- Peristaltic pumps connected to relays
- 7" touchscreen (optional, for kiosk mode)

## Quick Start

### On Raspberry Pi

1. Clone and setup prerequisites:
   ```bash
   git clone <repository-url> potion-master-pi
   cd potion-master-pi
   ./scripts/setup-pi.sh
   ```

2. Start services manually:
   ```bash
   # Terminal 1 – Hardware API (port 3001)
   ./scripts/start-hardware.sh

   # Terminal 2 – Frontend (Vite dev server on port 8080)
   ./scripts/start-frontend.sh
   ```

3. Access the interface:
   - Hardware API: http://localhost:3001/health
   - Web interface: http://localhost:8080

### Development (Any Platform)

1. **Install dependencies:**
   ```bash
   npm install
   cd hardware && npm install && cd ..
   ```

2. **Start development servers:**
   ```bash
   # Option 1: Use the development script
   scripts/dev-mode.sh
   
   # Option 2: Start manually
   cd hardware && npm run dev &  # Hardware API on port 3001
   npm run dev                   # Frontend on port 8080
   ```

## Project Structure

```
potion-master-pi/
├── src/                     # React frontend
│   ├── components/          # UI components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── data/               # Cocktail and ingredient data
│   └── pages/              # Route components
├── hardware/               # Hardware controller
│   ├── cocktail-machine.js # Main hardware service
│   ├── test-*.js          # Hardware test scripts
│   └── package.json       # Hardware dependencies
├── scripts/               # Setup and utility scripts
│   ├── setup-pi.sh        # Full Pi setup (no services)
│   ├── update-system.sh   # Update code and rebuild
│   ├── dev-mode.sh        # Start both (dev)
│   ├── start-hardware.sh  # Start hardware API (manual)
│   └── start-frontend.sh  # Start frontend (manual)
└── dist/                  # Built frontend (after npm run build)
```

## API Endpoints

### Hardware Controller (Port 3001)

- `GET /health` - Service health check
- `GET /api/status` - Complete hardware status
- `GET /api/weight` - Current scale reading
- `POST /api/tare` - Tare the scale
- `POST /api/pump` - Activate pump
  ```json
  {
    "pump": 1,
    "duration": 3000
  }
  ```

### WebSocket (Port 3001)

Real-time weight updates:
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'weight') {
    console.log('Weight:', data.data, 'g');
  }
};
```

## Hardware Configuration

### I2C Setup

The system uses I2C bus 1 for hardware communication:

- **Relay Board (0x20)**: Controls 8 pumps via PCF8574 expander
- **Scale (0x26)**: M5Stack MiniScale for weight measurement

### Pump Mapping

Pumps are numbered 0-7 and mapped to ingredients in `src/data/pump_mapping.json`:

```json
{
  "0": "vodka",
  "1": "gin",
  "2": "rum",
  ...
}
```

## Available Scripts

### Utility Scripts

- `scripts/start-hardware.sh` - Start hardware API (manual)
- `scripts/start-frontend.sh` - Start frontend (manual)
- `scripts/test-hardware.sh` - Test all hardware components
- `scripts/dev-mode.sh` - Start both services in development
- `scripts/update-system.sh` - Update code and rebuild

### Hardware Scripts (in hardware/ directory)

- `npm run test-i2c` - Scan I2C devices
- `npm run test-scale` - Test scale communication
- `npm run test-relay` - Test relay board
- `npm run test-all` - Run all hardware tests

### Frontend Scripts

- `npm run dev` - Development server (port 8080)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Manual Start & Logs

Start both processes in separate terminals:
```bash
./scripts/start-hardware.sh    # Hardware API (port 3001)
./scripts/start-frontend.sh    # Frontend (port 8080)
```

Capture logs to a file if needed:
```bash
./scripts/start-hardware.sh | tee hardware.log
```


## Troubleshooting

### Hardware Issues

1. **I2C not working:**
   ```bash
   # Check I2C is enabled
   sudo raspi-config # → Interface Options → I2C → Enable
   
   # Scan for devices
   sudo i2cdetect -y 1
   ```

2. **Hardware won't start:**
   ```bash
   ./scripts/start-hardware.sh
   ```
   - Check console output for errors
   - Verify I2C devices: `sudo i2cdetect -y 1`
   - Run tests: `./scripts/test-hardware.sh`

3. **Permissions error:**
   ```bash
   # Add user to groups
   sudo usermod -a -G gpio,i2c $USER
   # Then logout and login again
   ```

### Development Issues

1. **Mock mode**: Hardware service automatically runs in mock mode when I2C devices are not available
2. **Port conflicts**: Hardware uses 3001, frontend development uses 8080
3. **Build issues (Raspberry Pi)**:
   - Frontend should NOT install native I2C modules. We removed `i2c-bus` from the root to avoid `node-gyp` builds.
   - Recommended: Node.js 20.x LTS on Pi for best compatibility.
   - Refresh installs:
     ```bash
     # Root (frontend)
     rm -rf node_modules package-lock.json && npm ci
     # Hardware service
     cd hardware && rm -rf node_modules && npm ci --no-audit && cd ..
     ```

### Network Access

Access from other devices on the network:
```bash
# Start with host binding
npm run preview -- --host 0.0.0.0 --port 3000
# Then access via: http://[pi-ip-address]:3000
```

## Customization

### Adding Cocktails

Edit `src/data/cocktails.json` to add new recipes:

```json
{
  "name": "New Cocktail",
  "ingredients": {
    "vodka": 30,
    "cranberry": 60,
    "lime": 10
  },
  "instructions": "Pour and enjoy!",
  "image": "/cocktail-images/new-cocktail.jpg"
}
```

### Pump Configuration

Modify `src/data/pump_mapping.json` to match your hardware setup:

```json
{
  "0": "vodka",
  "1": "gin",
  "2": "your-ingredient"
}
```

## License

MIT License - see LICENSE file for details.