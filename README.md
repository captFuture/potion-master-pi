# Potion Master Pi – PC Build, Nginx on Raspberry Pi (Raspberry Pi 4/5)

Goal: Build the frontend on a Windows 11 PC, copy the built files to the Raspberry Pi, and serve them via Nginx from /var/www/potion-frontend-pi/dist. The Hardware API remains as-is and can run via systemd or manually.

---

## 1) PC (Windows 11) – Build Frontend

Prerequisites:
- Node.js 20 LTS
- npm (bundled with Node)

Steps:
1. In the project root on your PC:
   - npm ci
   - npm run build
2. The build output is in ./dist

Copy to the Pi (after you set up the Pi below):
- sudo ./potion-master-pi/scripts/copy_pcfiles.sh

---

## 2) Raspberry Pi – OS, Node.js, Git, Clone, Nginx

Recommended hardware and OS:
- Raspberry Pi 4 or 5
- Raspberry Pi OS (Bookworm) 64-bit, latest (2024+)

Flash the SD card:
1. Use Raspberry Pi Imager (Windows/Mac/Linux)
2. Choose Raspberry Pi OS (64-bit) – Bookworm
3. Click gear icon and configure:
   - Hostname (e.g., potionpi)
   - Enable SSH (password or key)
   - Username: pi (recommended) and set password
4. Flash and boot the Pi; connect it to the network

First login and updates (on the Pi):
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

Clone this repository (on the Pi):
```bash
sudo apt-get install -y git
# Replace with your actual repo URL
git clone https://github.com/your-org/your-repo.git potion-master-pi
cd potion-master-pi
```

Automatic one-shot setup (recommended):
```bash
# Runs with sudo, installs Nginx, Chromium (kiosk), Node.js 20 LTS, hardware deps, services
sudo ./scripts/setup-pi-all.sh -u pi
```
- Nginx will serve from: /var/www/potion-frontend-pi/dist
- Nginx is enabled on boot
- Services are installed; to auto-start them on boot, run:
  ```bash
  sudo systemctl enable cocktail-hardware.service
  sudo systemctl enable cocktail-kiosk.service
  ```

Manual setup (alternative):
```bash
# Nginx install + site config + autostart
sudo ./scripts/setup-nginx.sh /var/www/potion-frontend-pi

# Install systemd services (hardware + kiosk)
sudo ./scripts/install-services.sh -u pi
```

Deploy the built frontend (after building on the PC):
- scp -r dist/* pi@<pi-ip>:/var/www/potion-frontend-pi/dist/
- Open http://<pi-ip>/

---

## 3) Services and Kiosk

- Nginx: enabled on boot
  - Check: sudo systemctl status nginx
- Hardware API:
  - Start now: sudo systemctl start cocktail-hardware.service (port 3000)
  - Autostart: sudo systemctl enable cocktail-hardware.service
- Chromium Kiosk (opens http://localhost/):
  - Start now: sudo systemctl start cocktail-kiosk.service
  - Autostart: sudo systemctl enable cocktail-kiosk.service

Manual hardware start (without systemd):
```bash
./scripts/start-hardware.sh
```

---

## 4) Hardware API – Tests (optional)

From hardware/ on the Pi:
```bash
npm install
npm run test-i2c
npm run test-scale
npm run test-relay
```

---

## Notes
- Frontend build happens only on the PC; the Pi only serves static files via Nginx.
- Web root used by Nginx: /var/www/potion-frontend-pi/dist
- Clean update flow: rebuild on PC, copy files to /var/www/potion-frontend-pi/dist, then:
  ```bash
  sudo systemctl reload nginx
  ```
- License: MIT
