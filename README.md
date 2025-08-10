# Potion Master Pi – Raspberry Pi 4 Cocktail Machine

A React + Vite + TypeScript web UI with a Node.js hardware controller for mixing cocktails via I2C relays and an M5Stack MiniScale.

- Touch-friendly UI with real-time weight
- Manual startup scripts (no systemd needed)
- Mock mode when hardware is not connected

---

## Recommended OS for Raspberry Pi 4

- Use Raspberry Pi OS (64‑bit) Bookworm. Yes, the 13 May 2025 release with kernel 6.12 is suitable.
- Why 64‑bit: better compatibility with Node.js 20 LTS, Vite toolchain, Chromium, and fewer “Illegal instruction” issues than 32‑bit.

Check your arch after install: `uname -m` should print `aarch64`.

---

## Blank SD Card Setup (Fresh Install)

1) Flash OS
- Raspberry Pi Imager → Raspberry Pi OS (64‑bit) Bookworm (Desktop or Lite)
- Pre-configure hostname, user, password, locale, Wi‑Fi, and enable SSH if desired

2) First boot and base system
```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

3) Enable I2C
```bash
# Non-interactive (preferred in scripts)
sudo raspi-config nonint do_i2c 0 || true
# or interactive: sudo raspi-config → Interface Options → I2C → Enable
```

4) Install required packages (build tools + Chromium for kiosk/dev)
```bash
sudo apt install -y git i2c-tools curl chromium-browser build-essential python3 make g++ pkg-config
```

5) Install Node.js 20.x LTS (remove 22.x if present)
```bash
# Remove existing Node.js and potential NodeSource 22.x list
sudo apt purge -y nodejs npm || true
sudo rm -f /etc/apt/sources.list.d/nodesource.list /etc/apt/sources.list.d/nodesource.list.d/*.list 2>/dev/null || true
sudo apt autoremove -y || true

# Add NodeSource 20.x and install
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

node -v  # should be v20.x.x
npm -v
```

6) Clone the project
```bash
git clone https://github.com/captFuture/potion-master-pi.git
cd potion-master-pi
```

7) Install hardware service dependencies (includes native i2c-bus)
```bash
cd hardware
npm ci || npm install
cd ..
```

8) Install frontend dependencies (skip native/optional postinstalls)
```bash
rm -rf node_modules dist && rm -f package-lock.json
NPM_CONFIG_IGNORE_OPTIONAL=1 NPM_CONFIG_IGNORE_SCRIPTS=1 npm install
```

9) Build frontend with ARM-safe flags (fallback preserves compatibility)
```bash
export NODE_OPTIONS="--max-old-space-size=2048"
export DISABLE_OPENCOLLECTIVE=1
export ADBLOCK=1

npm run build \
  || npx vite build --mode production --logLevel warn --minify=false --target=es2020 \
  || npx vite build --mode production --logLevel warn --minify=false --target=es2018 --force
```

If the build still fails, you can run in development mode (see below).

---

## One-Command Setup (on Pi)

You can run our scripted version of the steps above:
```bash
./scripts/setup-pi.sh
```
What it does:
- Ensures build tools and Node.js 20.x
- Installs hardware deps (native i2c-bus)
- Installs frontend deps without optional/native postinstalls
- Builds with ARM-safe flags and provides a dev-mode fallback
- Enables I2C via raspi-config and config.txt

---

## Starting the Apps (Manual, no services)

- Hardware API (port 3001):
```bash
./scripts/start-hardware.sh
```

- Frontend (Vite dev, port 8080):
```bash
./scripts/start-frontend.sh
```

- Dev mode (both in one):
```bash
./scripts/dev-mode.sh
```

Open:
- Hardware health: http://localhost:3001/health
- App UI: http://localhost:8080

---

## Troubleshooting on Raspberry Pi

1) “Illegal instruction” when building or running Vite/@swc/esbuild
- Verify 64‑bit OS (aarch64): `uname -m`
- Ensure Node 20.x LTS: `node -v`; if not 20, reinstall as above
- Reinstall frontend deps without optional/native binaries:
```bash
rm -rf node_modules package-lock.json
NPM_CONFIG_IGNORE_OPTIONAL=1 NPM_CONFIG_IGNORE_SCRIPTS=1 npm install
```
- Build with our safer targets (see build command above)

2) i2c-bus / node-gyp build errors (hardware directory)
- Make sure build tools are installed: `sudo apt install -y build-essential python3 make g++ pkg-config`
- Clean and reinstall in hardware/: `rm -rf node_modules && npm ci || npm install`

3) No I2C devices found
```bash
sudo raspi-config nonint do_i2c 0 || true
sudo i2cdetect -y 1
```
Expected addresses:
- Relay board: 0x20
- M5Stack MiniScale: 0x26

4) Frontend fails to build but dev server works
- Use dev mode: `./scripts/start-frontend.sh`
- You can still access the UI at http://localhost:8080

5) Ports already in use
- Hardware: 3001, Frontend dev: 8080
- Kill conflicting processes or choose alternative ports in scripts

---

## Features

- 🍹 Interactive cocktail selection and mixing
- ⚖️ Real-time weight monitoring with M5Stack MiniScale
- 🔌 8-channel relay control for pumps
- 📱 Responsive, touch-friendly interface
- 🎮 Hardware mock mode for development
- 🚀 Manual start scripts (no systemd)

---

## Project Structure

```
potion-master-pi/
├── src/                     # React frontend
│   ├── components/          # UI components
│   ├── hooks/               # Custom hooks
│   ├── services/            # API services
│   ├── data/                # Cocktail & ingredient data
│   └── pages/               # Routes
├── hardware/                # Hardware controller (Node + I2C)
│   ├── cocktail-machine.js  # Main hardware service
│   ├── test-*.js            # Hardware test scripts
│   └── package.json         # Hardware dependencies
├── scripts/                 # Setup & utilities
│   ├── setup-pi.sh          # Full Pi setup (manual mode)
│   ├── update-system.sh     # Update & rebuild
│   ├── dev-mode.sh          # Start both (dev)
│   ├── start-hardware.sh    # Start hardware API
│   └── start-frontend.sh    # Start frontend
└── dist/                    # Built frontend
```

---

## API (Hardware Controller on :3001)

- GET `/health` → service health
- GET `/api/status` → hardware status
- GET `/api/weight` → current weight
- POST `/api/tare` → tare scale
- POST `/api/pump` → `{ "pump": number, "duration": ms }`

WebSocket: connect to `ws://localhost:3001` and listen for `{ type: "weight", data: number }`.

---

## Customization

- Add cocktails: edit `src/data/cocktails.json`
- Map pumps to ingredients: `src/data/pump_mapping.json`

---

## Development (Any Platform)

```bash
# Frontend
npm install
npm run dev  # http://localhost:8080

# Hardware (in hardware/)
cd hardware
npm install
npm run dev  # http://localhost:3001
```

---

## License

MIT
