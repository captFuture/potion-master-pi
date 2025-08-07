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

#### M5Stack MiniScale (I2C-Waage, Adresse 0x26)
```
Raspberry Pi → M5Stack MiniScale
GPIO 2 (SDA) → SDA
GPIO 3 (SCL) → SCL
5V → VCC
GND → GND
```

**I2C-Protokoll:**
- Adresse: 0x26
- Weight Register: 0x10 (4 Bytes, Little Endian)
- Tare Register: 0x30 (Write 1 to tare)

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
- Boot Options → Splash Screen → Enable (für Custom Splash)

### 2. System-Updates und Dependencies

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js installieren (Version lts)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\
sudo apt-get install -y nodejs

# Git und weitere Tools
sudo apt install -y git chromium-browser xinit xorg

# I2C Tools für Hardware-Tests
sudo apt install -y i2c-tools
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

#### I2C Hardware testen:
```bash
cd hardware

# Alle I2C Geräte scannen
npm run test-i2c
# Sollte Adressen 0x20 (Relais) und 0x26 (Waage) anzeigen

# Relais-Board testen (alle 8 Kanäle)
npm run test-relay

# M5Stack MiniScale testen
npm run test-scale

# Alle Hardware-Tests ausführen
npm run test-all
```

#### Splash Screen konfigurieren:
```bash
# Custom Splash Image wurde automatisch installiert
# Splash Screen manuell aktivieren:
sudo plymouth-set-default-theme spinner
sudo update-initramfs -u
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
// I2C Adressen
const RELAY_I2C_ADDRESS = 0x20;  // 8-Kanal Relais
const SCALE_I2C_ADDRESS = 0x26;  // M5Stack MiniScale

// Waage Register
const WEIGHT_REGISTER = 0x10;    // 4 Bytes, Little Endian
const TARE_REGISTER = 0x30;      // Write 1 to tare

// Pumpen-Mapping
const PUMP_CHANNELS = {
  1: 0xFE, 2: 0xFD, 3: 0xFB, 4: 0xF7,
  5: 0xEF, 6: 0xDF, 7: 0xBF, 8: 0x7F
};
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

**"Failed to fetch" Errors / Weight not shown:**
```bash
# Hardware Server muss separat gestartet werden
cd hardware
npm start

# Oder Service starten
sudo systemctl start cocktail-machine.service
sudo systemctl status cocktail-machine.service

# Mock-Modus wird automatisch aktiviert wenn Server nicht verfügbar
# Status zeigt dann "Mock Mode" statt "Ready"
```

**I2C funktioniert nicht:**
```bash
# I2C aktivieren
sudo raspi-config
# Interface Options → I2C → Enable

# Berechtigungen prüfen
groups pi | grep i2c
sudo usermod -a -G i2c pi

# I2C Geräte scannen
sudo i2cdetect -y 1
# Sollte zeigen: 0x20 (Relais), 0x26 (Waage)
```

**Waage zeigt falsche Werte:**
```bash
# Waage testen und tarieren
cd hardware
npm run test:scale

# Tare Register ist 0x50 (nicht 0x30)
# Write 1 to register 0x50 to tare
```

**Relais reagieren nicht:**
```bash
# Relais-Board testen
cd hardware
npm run test:relay

# I2C Adresse prüfen (sollte 0x20 sein)
sudo i2cdetect -y 1
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
# Alle Hardware-Tests ausführen
cd hardware
npm run test:all

# Einzelne Tests
npm run test:i2c    # I2C Geräte scannen
npm run test:relay  # Relais-Board testen
npm run test:scale  # Waage testen

# Hardware-API testen
curl http://localhost:3000/api/status
```

### Development vs Production

**Development Mode:**
```bash
# Frontend (React Dev Server)
npm run dev

# Hardware Server (separates Terminal)
cd hardware
npm start
```

**Production Mode:**
```bash
# Build React App
npm run build

# Services werden automatisch gestartet
sudo systemctl status cocktail-machine
sudo systemctl status cocktail-kiosk
```

**Mock Mode:**
- Aktiviert sich automatisch wenn Hardware-Server nicht verfügbar
- Simulierte Gewichtswerte
- Alle UI-Funktionen verfügbar
- Status zeigt "Mock Mode"

## 📁 Projektstruktur

```
potion-master-pi/
├── src/
│   ├── components/           # UI Komponenten
│   │   ├── ui/              # Basis UI-Komponenten (shadcn)
│   │   ├── CocktailGrid.tsx # Cocktail-Auswahl
│   │   ├── HardwareStatus.tsx # Hardware-Statusanzeige
│   │   ├── ServingProgress.tsx # Zubereitungs-Fortschritt
│   │   └── SettingsScreen.tsx # Einstellungen
│   ├── hooks/               # React Hooks
│   │   ├── useHardware.ts   # Hardware-Integration
│   │   ├── useCocktailMachine.ts # Mock für Entwicklung
│   │   └── useTheme.ts      # Theme-Management
│   ├── services/            # API Services
│   │   ├── hardwareAPI.ts   # Hardware-Kommunikation
│   │   └── cocktailService.ts # Cocktail-Zubereitung
│   ├── data/                # Cocktail-Daten & Mapping
│   │   ├── cocktails.json   # Rezept-Definitionen
│   │   ├── ingredient_mapping.json # Pumpen-Zuordnung
│   │   ├── cocktail_name_mapping.json # Übersetzungen
│   │   ├── ingredient_category.json # Kategorien
│   │   └── rpi_splash.png   # Boot Splash Screen
│   ├── pages/               # Seiten-Komponenten
│   │   ├── Index.tsx        # Hauptseite
│   │   └── NotFound.tsx     # 404-Seite
│   └── types/               # TypeScript Definitionen
├── hardware/                # Backend (Node.js)
│   ├── cocktail-machine.js  # Hardware Controller
│   └── package.json         # Node.js Dependencies
├── scripts/                 # Systemd Services & Setup
│   ├── setup-pi.sh         # Installations-Script
│   ├── cocktail-machine.service # Hardware Service
│   └── cocktail-kiosk.service # Kiosk Service
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