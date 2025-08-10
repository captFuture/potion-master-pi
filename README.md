# Potion Master Pi – Build am PC, Auslieferung via Nginx (Raspberry Pi 4)

Ziel: Das Frontend wird auf einem Windows 11 PC gebaut und manuell auf den Raspberry Pi kopiert. Der Pi liefert die Dateien mit Nginx aus. Die Hardware-API bleibt unverändert.

---

## A) PC (Windows 11): Frontend-Build

Voraussetzungen: Node.js 20 LTS, npm

1. Im Projektordner ausführen:
   - npm ci
   - npm run build
2. Ergebnis liegt in ./dist
3. Kopiere anschließend den Inhalt von ./dist manuell auf den Raspberry Pi nach:
   - /home/pi/potion-frontent-pi

Tipps zum Kopieren von Windows:
- PowerShell (OpenSSH):
  - scp -r .\dist\* pi@<pi-ip>:/home/pi/potion-frontent-pi/
- Oder WinSCP verwenden (Zielordner: /home/pi/potion-frontent-pi)

---

## B) Raspberry Pi: Nginx installieren, konfigurieren und starten

Auf dem Pi ausführen (als root bzw. per sudo):

```bash
cd <projektverzeichnis>
sudo chmod +x ./scripts/setup-nginx.sh
sudo ./scripts/setup-nginx.sh /home/pi/potion-frontent-pi
```

Das Script:
- installiert Nginx (falls nicht vorhanden)
- erstellt das Doc-Root /home/pi/potion-frontent-pi (falls nicht vorhanden)
- schreibt die Site-Config mit SPA-Fallback und Asset-Caching
- aktiviert die Site, deaktiviert die Default-Site
- testet die Config und startet Nginx neu
- aktiviert Autostart (systemctl enable nginx)

Danach erreichbar unter: http://<pi-ip>/

Update des Frontends: Dateien erneut nach /home/pi/potion-frontent-pi kopieren, dann optional `sudo systemctl reload nginx`.

---

## C) Hardware-API (unverändert)

- Start: ./scripts/start-hardware.sh
- Tests (im Ordner hardware/):
  - npm install
  - npm run dev
  - npm run test-i2c, npm run test-relay, npm run test-scale

---

## D) Optionale Services (inkl. Chromium Kiosk)

Systemd-Services können installiert werden, sind aber optional.

```bash
# Auf dem Pi, im Projektverzeichnis
sudo ./scripts/install-services.sh -u pi

# Autostart (optional)
sudo systemctl enable cocktail-hardware.service
sudo systemctl enable cocktail-kiosk.service

# Starten
sudo systemctl start cocktail-hardware.service
sudo systemctl start cocktail-kiosk.service
```

- cocktail-hardware.service: startet ./scripts/start-hardware.sh
- cocktail-kiosk.service: öffnet Chromium im Kiosk-Modus auf http://localhost/

---

## Hinweise

- Frontend-Build findet ausschließlich auf dem PC statt; auf dem Pi wird nichts mit Vite/esbuild kompiliert.
- Statische Auslieferung über Nginx mit SPA-Fallback und Asset-Caching.

Lizenz: MIT
