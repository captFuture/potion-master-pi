# Potion Master Pi – Raspberry Pi 4 Cocktail Machine (Pi‑Safe esbuild)

A React + Vite + TypeScript web UI with a Node.js hardware controller for mixing cocktails via I2C relays and an M5Stack MiniScale.

- Touch-friendly UI with real-time weight
- Manual startup scripts (no systemd needed)
- Mock mode when hardware is not connected
- Pi‑safe Vite startup using a locally compiled esbuild binary

---

## Quick Fix (Illegal instruction on Pi 4)

If `npm run dev` crashes instantly with "Illegal instruction", do this on your Pi 4:

1) Install Go (required for esbuild from source)
- sudo apt-get update && sudo apt-get install -y golang-go

2) Build esbuild locally and force Vite to use it
- bash ./scripts/build-esbuild-from-source.sh

3) Start the frontend (uses ESBUILD_BINARY_PATH automatically)
- bash ./scripts/start-frontend.sh

4) Need verbose logs?
- bash ./scripts/dev-verbose.sh
  - Output is saved to vite-verbose.log

If the issue reappears after dependency updates:
- bash ./scripts/reinstall-deps.sh
- bash ./scripts/build-esbuild-from-source.sh
- bash ./scripts/start-frontend.sh

Why this works: Some prebuilt esbuild arm64 binaries use newer ARM instructions not available on Raspberry Pi 4 (Cortex‑A72). Compiling on-device produces a compatible binary and we export ESBUILD_BINARY_PATH so Vite always uses it.

---

## Recommended OS for Raspberry Pi 4

- Raspberry Pi OS (64‑bit) Bookworm (e.g., 13 May 2025, kernel 6.12)
- 64‑bit is strongly recommended for Node 20 LTS and modern toolchains
- Verify: `uname -m` should print `aarch64`

---

## Fresh Install on a Blank SD Card

1) Flash OS
- Raspberry Pi Imager → Raspberry Pi OS (64‑bit) Bookworm
- Pre-configure Wi‑Fi, SSH, user, etc.

2) First boot and base system
```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

3) Enable I2C
```bash
sudo raspi-config nonint do_i2c 0 || true
# or interactive via raspi-config UI
```

4) Install required packages
```bash
sudo apt install -y git i2c-tools curl chromium-browser build-essential python3 make g++ pkg-config golang-go
```

5) Install Node.js 20.x LTS (remove 22.x if present)
```bash
sudo apt purge -y nodejs npm || true
sudo rm -f /etc/apt/sources.list.d/nodesource.list /etc/apt/sources.list.d/nodesource.list.d/*.list 2>/dev/null || true
sudo apt autoremove -y || true

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

node -v  # v20.x.x
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

8) Frontend deps and Pi‑safe esbuild
```bash
bash ./scripts/reinstall-deps.sh            # clean install, dedupe, remove nested esbuild under vite
bash ./scripts/build-esbuild-from-source.sh # compile esbuild locally and verify
```

9) Start services
- Hardware API (port 3001):
```bash
./scripts/start-hardware.sh
```
- Frontend (port 8080):
```bash
./scripts/start-frontend.sh
```

Open:
- Hardware health: http://<Pi-IP>:3001/health
- App UI: http://<Pi-IP>:8080

---

## Scripts Overview

- scripts/build-esbuild-from-source.sh
  - Rebuild esbuild via Go on the Pi
  - Removes nested esbuild under Vite so Node resolves the hoisted/local build
  - Verifies the chosen binary and sets ESBUILD_BINARY_PATH via scripts/use-local-esbuild.sh

- scripts/use-local-esbuild.sh
  - Source this to export ESBUILD_BINARY_PATH to a working binary
  - Used automatically by start scripts

- scripts/start-frontend.sh
  - Starts Vite directly via Node CLI with ESBUILD_BINARY_PATH in env
  - Host/port: :: :8080

- scripts/dev-verbose.sh
  - Same as above with DEBUG and Node tracing; logs to vite-verbose.log

- scripts/probe-esbuild.sh
  - Lists esbuild binaries, probes require('esbuild') and minimal Vite create/close,
    and executes binaries with --version to detect immediate crashes

- scripts/reinstall-deps.sh
  - Clean npm install with scripts enabled, dedupe, remove nested esbuild under Vite
  - Rebuilds esbuild from source if Go is available

- scripts/force-hoist-esbuild.sh
  - Removes nested esbuild under Vite to force a single hoisted resolution

- scripts/dev-mode.sh
  - Starts hardware and frontend; sources ESBUILD_BINARY_PATH

---

## Troubleshooting on Raspberry Pi

Illegal instruction on `vite`
- Ensure 64‑bit OS and Node 20 (see above)
- Run:
```bash
sudo apt-get install -y golang-go
bash ./scripts/build-esbuild-from-source.sh
bash ./scripts/start-frontend.sh
```

`vite-verbose.log` is empty
- Crash happens before Vite logs due to esbuild
- Rebuild from source and ensure ESBUILD_BINARY_PATH is exported (start script handles this)

Hardware build errors
- Ensure build tools: `sudo apt install -y build-essential python3 make g++ pkg-config`
- In hardware/: `rm -rf node_modules && npm ci || npm install`

Ports in use
- Hardware 3001, Frontend 8080 — change in scripts if needed

---

## Development (non‑Pi)
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
