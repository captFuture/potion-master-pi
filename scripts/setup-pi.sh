#!/bin/bash

echo "🍹 Setting up Cocktail Machine on Raspberry Pi..."

# Git Repository aktualisieren
echo "📥 Pulling latest version from git..."
git pull origin main

# Benutzer zu gpio und i2c Gruppen hinzufügen
sudo usermod -a -G gpio,i2c pi

# Hardware Dependencies installieren
cd ..
cd hardware
npm install

# Frontend bauen
echo "📦 Building frontend..."
cd ..
rm -rf node_modules package-lock.json
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

# Services stoppen falls sie bereits laufen
sudo systemctl stop cocktail-machine.service 2>/dev/null || true
sudo systemctl stop cocktail-kiosk.service 2>/dev/null || true

# Touch-Display konfigurieren
echo "📱 Configuring touch display..."
if ! grep -q "dtoverlay=vc4-kms-v3d" /boot/config.txt; then
    echo "dtoverlay=vc4-kms-v3d" | sudo tee -a /boot/config.txt
fi

# Boot splash image installieren
echo "🖼️ Installing custom splash screen..."
sudo cp src/data/rpi_splash.png /usr/share/plymouth/themes/pix/splash.png

# Boot splash konfigurieren
if ! grep -q "splash" /boot/cmdline.txt; then
    sudo sed -i 's/$/ quiet splash plymouth.ignore-serial-consoles/' /boot/cmdline.txt
fi

# Boot-Zeit optimieren (behält WiFi und Bluetooth aktiv)
echo "⚡ Optimizing boot time..."
sudo systemctl disable triggerhappy
sudo systemctl disable dphys-swapfile

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

# I2C Tools für Hardware-Tests
echo "🔧 Installing I2C tools..."
sudo apt install -y i2c-tools

echo "✅ Setup complete!"
echo ""
echo "🔧 Hardware Setup:"
echo "   I2C Relais Board → Adresse 0x26"
echo "   M5Stack MiniScale → Adresse 0x26"
echo ""
echo "🧪 Testing hardware..."
cd hardware
echo "Running I2C scan..."
npm run test-i2c

echo ""
echo "🚀 Starting services..."
cd ..
sudo systemctl start cocktail-machine.service

echo "🌐 Web interface: http://localhost:3000"
echo "📊 Hardware API: http://localhost:3000/api/status"
echo ""
echo "Reboot for full kiosk mode:"
echo "sudo reboot"