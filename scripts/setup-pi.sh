#!/bin/bash

echo "🍹 Setting up Cocktail Machine on Raspberry Pi..."

# Git Repository aktualisieren
echo "📥 Pulling latest version from git..."
git pull origin main

# Benutzer zu gpio und i2c Gruppen hinzufügen
sudo usermod -a -G gpio,i2c pi

# Hardware Dependencies installieren
cd hardware
npm install

# Frontend bauen
echo "📦 Building frontend..."
cd ..
npm install
npm run build

# Services installieren
echo "⚙️ Installing system services..."
sudo cp scripts/cocktail-machine.service /etc/systemd/system/
sudo cp scripts/cocktail-kiosk.service /etc/systemd/system/

# Services aktivieren
sudo systemctl daemon-reload
sudo systemctl enable cocktail-machine.service
sudo systemctl enable cocktail-kiosk.service

# Touch-Display konfigurieren
echo "📱 Configuring touch display..."
if ! grep -q "dtoverlay=vc4-kms-v3d" /boot/config.txt; then
    echo "dtoverlay=vc4-kms-v3d" | sudo tee -a /boot/config.txt
fi

# Boot-Zeit optimieren
echo "⚡ Optimizing boot time..."
sudo systemctl disable bluetooth
sudo systemctl disable wifi-connect
sudo systemctl disable triggerhappy

# Chromium Kiosk Einstellungen
mkdir -p ~/.config/chromium/Default
cat > ~/.config/chromium/Default/Preferences << 'EOF'
{
   "profile": {
      "default_content_setting_values": {
         "geolocation": 1,
         "media_stream": 1,
         "notifications": 1
      },
      "exit_type": "Normal"
   }
}
EOF

echo "✅ Setup complete!"
echo ""
echo "🔧 Hardware Setup:"
echo "   I2C Relais Board → Adresse 0x20"
echo "   HX711 Waage → GPIO 5 (Data), GPIO 6 (Clock)"
echo ""
echo "🚀 Starting services..."
sudo systemctl start cocktail-machine.service

echo "🌐 Web interface: http://localhost:3000"
echo "📊 Hardware API: http://localhost:3000/api/status"
echo ""
echo "Reboot for full kiosk mode:"
echo "sudo reboot"