# Potion Master Pi – Statisches Frontend über Nginx (Raspberry Pi 4)

Ziel: Frontend wird auf einem Windows 11 PC gebaut und manuell auf den Raspberry Pi kopiert. Der Pi liefert die Dateien mit Nginx aus. Die Hardware-API bleibt unverändert.

---

## 1) Build auf dem Windows 11 PC

Voraussetzungen: Node.js 20 LTS, npm

- Im Projektordner ausführen:
  - npm ci
  - npm run build
- Ergebnis liegt in ./dist

Kopiere anschließend den Inhalt von ./dist manuell auf den Raspberry Pi nach:
- /home/pi/potion-frontent-pi

Tipps zum Kopieren von Windows:
- PowerShell (OpenSSH): scp -r .\dist\* pi@<pi-ip>:/home/pi/potion-frontent-pi/
- Oder WinSCP verwenden (Zielordner: /home/pi/potion-frontent-pi)

---

## 2) Nginx auf dem Raspberry Pi installieren und aktivieren

Auf dem Pi ausführen:

```bash
cd <projektverzeichnis>
sudo chmod +x ./scripts/setup-nginx.sh
sudo ./scripts/setup-nginx.sh /home/pi/potion-frontent-pi
```

Das Script:
- installiert Nginx (falls nicht vorhanden)
- konfiguriert eine Site, die /home/pi/potion-frontent-pi als Root nutzt
- aktiviert die Site, deaktiviert die Default-Site
- testet die Config und startet Nginx neu
- aktiviert Autostart (systemctl enable nginx)

Danach erreichbar unter: http://<pi-ip>/

Update des Frontends: Dateien erneut nach /home/pi/potion-frontent-pi kopieren, dann optional sudo systemctl reload nginx.

---

## 3) Hardware-API (unverändert)

- Start: ./scripts/start-hardware.sh
- Tests (im Ordner hardware/):
  - npm install
  - npm run dev
  - npm run test-i2c, npm run test-relay, npm run test-scale

---

## 4) Optionale Services (inkl. Chromium Kiosk)

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

## 5) Projekt-Hinweise

- Frontend-Build findet ausschließlich auf dem PC statt; auf dem Pi wird nichts mit Vite/esbuild kompiliert.
- Statische Auslieferung über Nginx mit SPA-Fallback und Asset-Caching.

Lizenz: MIT
