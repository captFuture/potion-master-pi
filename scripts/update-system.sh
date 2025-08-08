#!/bin/bash

echo "🔄 Updating Cocktail Machine System"
echo "=================================="

cd "$(dirname "$0")/.."

# Stop services
echo "Stopping services..."
sudo systemctl stop cocktail-kiosk.service 2>/dev/null || true
sudo systemctl stop cocktail-machine.service

# Update from git
echo "Updating from git..."
git pull origin main

# Update hardware dependencies
echo "Updating hardware dependencies..."
cd hardware
rm -rf node_modules package-lock.json
npm install
cd ..

# Update frontend and build
echo "Updating frontend dependencies and building..."
rm -rf node_modules package-lock.json dist
npm install
npm run build

# Reload services configuration
echo "Reloading service configuration..."
sudo systemctl daemon-reload

# Restart hardware service
echo "Starting hardware service..."
sudo systemctl start cocktail-machine.service

# Wait and check status
sleep 5
if sudo systemctl is-active cocktail-machine.service --quiet; then
    echo "✅ Hardware service running"
else
    echo "❌ Hardware service failed - check logs:"
    sudo journalctl -u cocktail-machine.service --no-pager -n 10
    exit 1
fi

echo ""
echo "✅ System updated and restarted!"
echo "Hardware API: http://localhost:3001/health"
echo "Check status: sudo systemctl status cocktail-machine.service"