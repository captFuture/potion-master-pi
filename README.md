# 🍹 Potion Master Pi - Cocktail Machine

Ein automatisches Cocktail-Mischsystem basierend auf Raspberry Pi mit Touch-Display, I2C-Relais-Board und Präzisionswaage.

## 🎯 Features

- **Touch-Benutzeroberfläche**: Responsive Web-App optimiert für Touch-Displays
- **Automatische Cocktail-Zubereitung**: 8-Kanal Pumpensteuerung über I2C-Relais
- **Präzise Dosierung**: HX711-Waage für genaue Mengenangaben
- **Echtzeit-Updates**: WebSocket-Verbindung für Live-Feedback
- **Kiosk-Modus**: Vollbild-Anzeige beim Systemstart
- **Auto-Update**: Automatisches Aktualisieren vom Git-Repository

## 🛠 Hardware-Anforderungen

### Hauptkomponenten
- **Raspberry Pi 4** (empfohlen: 4GB RAM)
- **MicroSD-Karte** (min. 32GB, Class 10)
- **7" Touch-Display** (offizielles Raspberry Pi Display)
- **I2C 8-Kanal Relais-Board** (Adresse 0x20)
- **HX711 Wägezelle-Verstärker** mit Waage
- **8x Peristaltik-Pumpen** (12V)
- **12V Netzteil** (min. 5A für alle Pumpen)

### Verkabelung

#### I2C Relais-Board (Adresse 0x20)
```
Raspberry Pi → I2C Relais
GPIO 2 (SDA) → SDA
GPIO 3 (SCL) → SCL
5V → VCC
GND → GND
```

#### HX711 Waage
```
Raspberry Pi → HX711
GPIO 5 → DT (Data)
GPIO 6 → SCK (Clock)
5V → VCC
GND → GND
```

#### Pumpen (über Relais)
- Kanal 1-8: Je eine Peristaltik-Pumpe (12V)
- Gemeinsames 12V Netzteil für alle Pumpen
- Relais schalten die 12V Versorgung

## 🚀 Installation

### 1. Raspberry Pi OS vorbereiten

```bash
# Raspberry Pi OS Lite (64-bit) auf SD-Karte flashen
# SSH und I2C aktivieren über raspi-config
sudo raspi-config
```

**Wichtige Einstellungen:**
- Interface Options → SSH → Enable
- Interface Options → I2C → Enable
- Interface Options → VNC → Enable (optional)
- Advanced Options → Memory Split → 128

### 2. System-Updates und Dependencies

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js installieren (Version 18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Git und weitere Tools
sudo apt install -y git chromium-browser xinit xorg

# I2C Tools für Hardware-Tests
sudo apt install -y i2c-tools python3-pip
sudo pip3 install RPi.GPIO hx711
```

### 3. Projekt klonen und einrichten

```bash
# Projekt vom Repository klonen
cd /home/pi
git clone <YOUR_REPOSITORY_URL> potion-master-pi
cd potion-master-pi

# Setup-Script ausführen (automatische Installation)
chmod +x scripts/setup-pi.sh
./scripts/setup-pi.sh
```

### 4. Hardware konfigurieren

#### I2C Relais testen:
```bash
# I2C Geräte scannen
sudo i2cdetect -y 1
# Sollte Adresse 0x20 anzeigen

# Relais testen (Kanal 1 ein/aus)
cd hardware
node -e "
const i2c = require('i2c-bus');
const bus = i2c.openSync(1);
bus.writeByteSync(0x20, 0xFE); // Kanal 1 an
setTimeout(() => bus.writeByteSync(0x20, 0xFF), 2000); // Alle aus
"
```

#### Waage kalibrieren:
```bash
cd hardware
# Waage ohne Gewicht starten für Nullpunkt
node -e "
const HX711 = require('./hx711-wrapper');
const scale = new HX711(5, 6);
console.log('Tare value:', scale.tare());
"

# Mit bekanntem Gewicht (z.B. 100g) für Kalibrierung
node -e "
const HX711 = require('./hx711-wrapper');
const scale = new HX711(5, 6);
scale.setOffset(TARE_VALUE); // Von vorherigem Schritt
console.log('Put 100g on scale and press Enter...');
// Kalibrierungsfaktor berechnen und in cocktail-machine.js eintragen
"
```

## 🎮 Verwendung

### Services starten/stoppen

```bash
# Hardware-Service
sudo systemctl start cocktail-machine.service
sudo systemctl stop cocktail-machine.service
sudo systemctl status cocktail-machine.service

# Kiosk-Service
sudo systemctl start cocktail-kiosk.service
sudo systemctl stop cocktail-kiosk.service

# Services beim Boot aktivieren/deaktivieren
sudo systemctl enable cocktail-machine.service
sudo systemctl disable cocktail-kiosk.service
```

### Web-Interface

- **Lokal**: http://localhost:3000
- **API Status**: http://localhost:3000/api/status
- **WebSocket**: ws://localhost:3000

### Logs anzeigen

```bash
# Hardware-Service Logs
sudo journalctl -u cocktail-machine.service -f

# Kiosk-Service Logs
sudo journalctl -u cocktail-kiosk.service -f

# Alle System-Logs
sudo journalctl -f
```

## 🔧 Konfiguration

### Cocktail-Rezepte anpassen

Rezepte sind in `src/data/cocktails.json` definiert:

```json
{
  "id": "mojito",
  "name": "Mojito",
  "ingredients": [
    {"ingredient": "white_rum", "amount": 50},
    {"ingredient": "lime_juice", "amount": 20},
    {"ingredient": "simple_syrup", "amount": 15}
  ]
}
```

### Ingredient-Mapping

Pumpen-Zuordnung in `src/data/ingredient_mapping.json`:

```json
{
  "white_rum": 1,
  "lime_juice": 2,
  "simple_syrup": 3
}
```

### Hardware-Einstellungen

In `hardware/cocktail-machine.js`:

```javascript
// I2C Adresse
const I2C_ADDRESS = 0x20;

// HX711 Pins
const HX711_DATA_PIN = 5;
const HX711_CLOCK_PIN = 6;

// Waage Kalibrierung
const SCALE_OFFSET = -8388608; // Nullpunkt
const SCALE_FACTOR = 2000;     // Kalibrierungsfaktor
```

## 🔄 Updates

Das System aktualisiert sich automatisch bei jedem Neustart. Für manuelle Updates:

```bash
cd /home/pi/potion-master-pi
git pull origin main
npm install
npm run build
sudo systemctl restart cocktail-machine.service
```

## 🐛 Troubleshooting

### Häufige Probleme

**I2C funktioniert nicht:**
```bash
# I2C aktivieren
sudo raspi-config
# Interface Options → I2C → Enable

# Berechtigungen prüfen
groups pi | grep i2c
sudo usermod -a -G i2c pi
```

**Waage zeigt falsche Werte:**
```bash
# Waage neu kalibrieren
cd hardware
node calibrate-scale.js
```

**Touch-Display reagiert nicht:**
```bash
# Display-Treiber prüfen
dmesg | grep -i touch

# Chromium im Debug-Modus
chromium-browser --kiosk --enable-logging --v=1
```

**Service startet nicht:**
```bash
# Service-Status prüfen
sudo systemctl status cocktail-machine.service

# Logs analysieren
sudo journalctl -u cocktail-machine.service --no-pager
```

### Hardware-Tests

```bash
# I2C Geräte scannen
sudo i2cdetect -y 1

# GPIO Pins prüfen
gpio readall

# Hardware-API testen
curl http://localhost:3000/api/status
```

## 📁 Projektstruktur

```
potion-master-pi/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/           # UI Komponenten
│   ├── data/                # Cocktail-Daten
│   └── services/            # API Services
├── hardware/                # Backend (Node.js)
│   ├── cocktail-machine.js  # Hardware Controller
│   └── package.json         # Node.js Dependencies
├── scripts/                 # Systemd Services & Setup
│   ├── setup-pi.sh         # Installations-Script
│   ├── cocktail-machine.service
│   └── cocktail-kiosk.service
└── public/                  # Statische Dateien
```

## 🛡 Sicherheit

- Services laufen unter `pi` Benutzer (nicht root)
- I2C/GPIO Zugriff über Gruppen-Berechtigungen
- Lokale Installation ohne externe Abhängigkeiten
- HTTPS optional über Reverse-Proxy

## 📈 Weiterentwicklung

### Geplante Features
- [ ] RFID/NFC Bezahlsystem
- [ ] Cocktail-Historie und Statistiken
- [ ] Remote-Management über Web-API
- [ ] Füllstands-Sensoren für Flaschen
- [ ] Temperatur-Überwachung

### Entwicklung

```bash
# Development-Server starten
npm run dev

# Hardware-Tests
cd hardware
npm test

# Build für Produktion
npm run build
```

## 📄 Lizenz

MIT License - siehe LICENSE Datei für Details.

## 🤝 Contributing

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Changes committen (`git commit -m 'Add AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📞 Support

Bei Problemen oder Fragen:
- GitHub Issues für Bug-Reports
- Dokumentation in diesem README
- Hardware-Schema in `/docs/hardware/`

---

**🍹 Prost! Viel Spaß mit deiner automatischen Cocktail-Maschine! 🍹**