#!/bin/bash

echo "🔄 Updating Cocktail Machine System"
echo "=================================="

cd "$(dirname "$0")/.."

# Stop services
echo "Stopping services..."
sudo systemctl stop cocktail-kiosk.service
sudo systemctl stop cocktail-machine.service

# Update from git
echo "Updating from git..."
git pull origin main

# Rebuild
echo "Rebuilding application..."
rm -rf node_modules package-lock.json dist
npm install
npm run build

# Update hardware dependencies
echo "Updating hardware dependencies..."
cd hardware
rm -rf node_modules package-lock.json
npm install
cd ..

# Restart services
echo "Restarting services..."
sudo systemctl daemon-reload
sudo systemctl start cocktail-machine.service
sudo systemctl start cocktail-kiosk.service

echo ""
echo "✅ System updated and restarted!"
echo "Check status: sudo systemctl status cocktail-machine.service"