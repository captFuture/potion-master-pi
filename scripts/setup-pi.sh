#!/bin/bash

set -e  # Exit on any error

echo "🍹 Setting up Cocktail Machine on Raspberry Pi..."
echo "==============================================="

# Ensure we're in the project root
cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"
echo "📁 Project root: $PROJECT_ROOT"

# Update system packages
echo ""
echo "📦 Updating system packages..."
sudo apt update
sudo apt install -y git nodejs npm i2c-tools

# Update Node.js to supported version if needed
NODE_VERSION=$(node --version | cut -d'v' -f2)
echo "📋 Current Node.js version: $NODE_VERSION"

# Add user to required groups
echo ""
echo "👤 Adding user to gpio and i2c groups..."
sudo usermod -a -G gpio,i2c $USER

# Stop existing services
echo ""
echo "🛑 Stopping existing services..."
sudo systemctl stop cocktail-machine.service 2>/dev/null || true
sudo systemctl stop cocktail-kiosk.service 2>/dev/null || true

# Update from git
echo ""
echo "📥 Pulling latest version from git..."
git pull origin main

# Install hardware dependencies
echo ""
echo "🔧 Installing hardware dependencies..."
cd hardware
rm -rf node_modules package-lock.json
npm install

# Build frontend
echo ""
echo "📦 Building frontend..."
cd "$PROJECT_ROOT"
rm -rf node_modules package-lock.json dist
npm install
npm run build

# Verify build
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi
echo "✅ Frontend build successful"

# Install system services
echo ""
echo "⚙️ Installing system services..."
sudo cp scripts/cocktail-machine.service /etc/systemd/system/
sudo cp scripts/cocktail-kiosk.service /etc/systemd/system/

# Reload and enable services
sudo systemctl daemon-reload
sudo systemctl enable cocktail-machine.service
sudo systemctl enable cocktail-kiosk.service

# Configure system for kiosk mode
echo ""
echo "📱 Configuring system for kiosk mode..."

# Enable I2C
if ! grep -q "dtparam=i2c_arm=on" /boot/config.txt; then
    echo "dtparam=i2c_arm=on" | sudo tee -a /boot/config.txt
fi

# Configure GPU memory split
if ! grep -q "gpu_mem=128" /boot/config.txt; then
    echo "gpu_mem=128" | sudo tee -a /boot/config.txt
fi

# Install custom splash screen
echo "🖼️ Installing custom splash screen..."
if [ -f "src/data/rpi_splash.png" ]; then
    sudo cp src/data/rpi_splash.png /usr/share/plymouth/themes/pix/splash.png
fi

# Configure boot splash
if ! grep -q "splash" /boot/cmdline.txt; then
    sudo sed -i 's/$/ quiet splash plymouth.ignore-serial-consoles/' /boot/cmdline.txt
fi

# Optimize boot time
echo "⚡ Optimizing boot time..."
sudo systemctl disable triggerhappy 2>/dev/null || true
sudo systemctl disable dphys-swapfile 2>/dev/null || true

# Configure Chromium for kiosk mode
echo "🌐 Configuring Chromium..."
mkdir -p ~/.config/chromium/Default
cat > ~/.config/chromium/Default/Preferences << 'EOF'
{
   "profile": {
      "default_content_setting_values": {
         "geolocation": 1,
         "media_stream": 1,
         "notifications": 1
      },
      "exit_type": "Normal",
      "password_manager_enabled": false
   }
}
EOF

# Install additional packages
echo "📦 Installing additional packages..."
sudo apt install -y chromium-browser xdotool unclutter

# Test hardware
echo ""
echo "🧪 Testing hardware..."
cd hardware
echo "Running I2C scan..."
npm run test-i2c || echo "⚠️ I2C test failed - hardware may not be connected"

# Start services
echo ""
echo "🚀 Starting services..."
cd "$PROJECT_ROOT"
sudo systemctl start cocktail-machine.service

# Wait for hardware service to start
echo "⏳ Waiting for hardware service to start..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
sudo systemctl is-active cocktail-machine.service --quiet && echo "✅ Hardware service running" || echo "❌ Hardware service failed"

echo ""
echo "✅ Setup complete!"
echo "=================="
echo ""
echo "🔧 Hardware Setup:"
echo "   I2C Relay Board → Address 0x20"
echo "   M5Stack MiniScale → Address 0x26"
echo ""
echo "🌐 Access URLs:"
echo "   Web Interface: http://localhost:3000"
echo "   Hardware API: http://localhost:3001/api/status"
echo ""
echo "🛠️ Useful Commands:"
echo "   Check logs: sudo journalctl -u cocktail-machine.service -f"
echo "   Restart services: sudo systemctl restart cocktail-machine.service"
echo "   Test hardware: cd hardware && npm run test-all"
echo ""
echo "🔄 For full kiosk mode, reboot the system:"
echo "   sudo reboot"
echo ""
echo "📝 Note: You may need to log out and back in for group permissions to take effect."