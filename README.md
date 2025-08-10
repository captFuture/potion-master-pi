# Potion Master Pi – Raspberry Pi 4 Cocktail Machine (Static Frontend via Nginx)

A React + Vite + TypeScript web UI shipped as static files built on your PC and served by Nginx on the Raspberry Pi. The Hardware API still runs on the Pi via Node.js.

---

## Ziel: Stabiler Betrieb auf dem Raspberry Pi 4 ohne Vite/esbuild

- Frontend wird auf dem PC gebaut (Node 20 LTS)
- Deploy per scp/ssh auf den Pi nach /opt/cocktail-machine/frontend
- Auslieferung via Nginx (Systemdienst vorhanden)
- Optionaler Kiosk-Modus (Chromium im Vollbild) als systemd Service
- Hardware-API (Node/Express) bleibt unverändert – Start/Tests/Setup wie gehabt

---

## Voraussetzungen

Auf dem PC:
- Node.js 20.x LTS, npm
- SSH-Zugang zum Pi (z. B. pi@<pi-ip>)

Auf dem Pi:
- Raspberry Pi OS 64‑bit (Bookworm empfohlen)
- Nginx (wird vom Deploy-Script installiert, falls nicht vorhanden)
- Chromium (für Kiosk-Modus)

---

## 1) Frontend auf dem PC bauen

```bash
# Im Projektordner
./scripts/build-frontend-pc.sh
# Ergebnis liegt in ./dist
```

---

## 2) Deploy auf den Pi und Nginx konfigurieren

```bash
# Syntax: ./scripts/deploy-frontend-to-pi.sh <PI_HOST> [PI_USER] [WEB_ROOT]
./scripts/deploy-frontend-to-pi.sh 192.168.1.50 pi /opt/cocktail-machine/frontend

# Das Script:
# - kopiert ./dist auf den Pi
# - installiert Nginx (falls fehlt)
# - schreibt Site-Config /etc/nginx/sites-available/cocktail-frontend
# - aktiviert Site und startet Nginx neu
# - Auslieferung: http://<PI_HOST>/
```

Optionaler Test vom PC:
```bash
curl -I http://192.168.1.50/
```

---

## 3) Hardware-API (unverändert)

Start (manuell):
```bash
./scripts/start-hardware.sh
```

Dev/Test (im Ordner hardware/):
```bash
cd hardware
npm install
npm run dev
```

---

## 4) Services installieren (optional)

Installiert zwei Services: Hardware-API und Kiosk-Modus.

```bash
# Auf dem Pi, im Projektverzeichnis
sudo ./scripts/install-services.sh -u pi

# Autostart aktivieren (optional)
sudo systemctl enable cocktail-hardware.service
sudo systemctl enable cocktail-kiosk.service

# Sofort starten
sudo systemctl start cocktail-hardware.service
sudo systemctl start cocktail-kiosk.service
```

- cocktail-hardware.service: startet ./scripts/start-hardware.sh
- cocktail-kiosk.service: öffnet Chromium im Kiosk-Modus auf http://localhost/

Deinstallation:
```bash
sudo ./scripts/uninstall-services.sh
```

---

## 5) Kiosk-Startskript (angepasst)

- Nutzt Nginx statt Vite-Preview
- Startet bei Bedarf Hardware-Service (neuer Name oder Legacy)
- Öffnet Chromium im Kiosk-Modus

```bash
./scripts/start-kiosk.sh
```

---

## Typischer End-to-End Workflow

1) Auf dem PC bauen: `./scripts/build-frontend-pc.sh`
2) Auf den Pi deployen: `./scripts/deploy-frontend-to-pi.sh <PI_HOST> pi /opt/cocktail-machine/frontend`
3) Hardware-API starten: `./scripts/start-hardware.sh` (oder Service aktivieren)
4) Kiosk starten: `./scripts/start-kiosk.sh` (oder Service aktivieren)

---

## Hinweise & Fehlerbehebung

- Wenn Nginx bereits einen Default-Site aktiv hat, wird diese vom Deploy-Script deaktiviert.
- SPA-Routing: `try_files $uri /index.html` ist gesetzt.
- Statische Assets unter /assets werden 30 Tage gecacht.
- Chromium Kiosk erwartet eine laufende X/Wayland Session auf DISPLAY=:0.

---

## Development (PC)

```bash
npm install
npm run dev  # lokale Entwicklung
```

Für den Pi wird kein Vite/Dev-Server mehr benötigt, Frontend kommt als statische Dateien.

---

## License
MIT
