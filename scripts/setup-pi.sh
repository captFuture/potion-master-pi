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

# Clean package management
echo "🧹 Cleaning up conflicting packages..."
sudo apt remove -y --purge nodejs-legacy npm 2>/dev/null || true
sudo apt autoremove -y

# Install essential packages
echo "📦 Installing essential packages..."
sudo apt install -y git i2c-tools curl chromium-browser

# Install Node.js from NodeSource
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "📦 Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Verify Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
echo "📋 Node.js version: $NODE_VERSION"

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

# Install frontend dependencies and build
echo ""
echo "📦 Installing frontend dependencies and building..."
cd "$PROJECT_ROOT"
rm -rf node_modules package-lock.json dist

# Install with legacy peer deps to avoid conflicts
npm install --legacy-peer-deps

# Build with increased memory and ARM-compatible settings
echo "🔨 Building with ARM optimizations..."
export NODE_OPTIONS="--max-old-space-size=2048"
export DISABLE_OPENCOLLECTIVE=1
export ADBLOCK=1

# Try building with fallback
npm run build || {
    echo "⚠️ Standard build failed, trying with compatibility mode..."
    npx vite build --mode production --logLevel warn
}

# Verify build
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    echo "ℹ️ System will run in development mode only"
    # Create minimal dist for service compatibility
    mkdir -p dist
    echo "<html><body><h1>Development Mode</h1><p>Use npm run dev</p></body></html>" > dist/index.html
else
    echo "✅ Frontend build successful"
fi

# Install system services
echo ""
echo "⚙️ Installing system services..."
sudo cp scripts/cocktail-machine.service /etc/systemd/system/
sudo cp scripts/cocktail-kiosk.service /etc/systemd/system/

# Reload and enable services
sudo systemctl daemon-reload
sudo systemctl enable cocktail-machine.service

# Configure system for hardware access
echo ""
echo "🔧 Configuring system for hardware access..."

# Enable I2C
if ! grep -q "dtparam=i2c_arm=on" /boot/config.txt; then
    echo "dtparam=i2c_arm=on" | sudo tee -a /boot/config.txt
fi

# Configure GPU memory split
if ! grep -q "gpu_mem=128" /boot/config.txt; then
    echo "gpu_mem=128" | sudo tee -a /boot/config.txt
fi

# Test hardware
echo ""
echo "🧪 Testing hardware..."
cd hardware
echo "Running I2C scan..."
npm run test-i2c || echo "⚠️ I2C test failed - hardware may not be connected (will run in mock mode)"

# Start hardware service
echo ""
echo "🚀 Starting hardware service..."
cd "$PROJECT_ROOT"
sudo systemctl start cocktail-machine.service

# Wait for service to start
echo "⏳ Waiting for hardware service to start..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
if sudo systemctl is-active cocktail-machine.service --quiet; then
    echo "✅ Hardware service running"
else
    echo "❌ Hardware service failed - checking logs..."
    sudo journalctl -u cocktail-machine.service --no-pager -n 10
fi

echo ""
echo "✅ Setup complete!"
echo "=================="
echo ""
echo "🔧 Hardware Setup:"
echo "   I2C Relay Board → Address 0x20"
echo "   M5Stack MiniScale → Address 0x26"
echo ""
echo "🌐 Access URLs:"
echo "   Hardware API: http://localhost:3001/health"
echo "   Hardware Status: http://localhost:3001/api/status"
echo ""
echo "🛠️ Useful Commands:"
echo "   Check hardware logs: sudo journalctl -u cocktail-machine.service -f"
echo "   Restart hardware: sudo systemctl restart cocktail-machine.service"
echo "   Test hardware: cd hardware && npm run test-all"
echo "   Start development: npm run dev"
echo "   Update system: scripts/update-system.sh"
echo ""
echo "📝 Note: Hardware will run in mock mode if I2C devices are not connected."
echo "📝 Reboot may be required for I2C changes to take effect."