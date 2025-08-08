#!/bin/bash

echo "🏭 Starting Cocktail Machine in Production Mode"
echo "==============================================="

cd "$(dirname "$0")/.."

# Build for production
echo "Building for production..."
npm run build

# Start services
echo "Starting production services..."
sudo systemctl start cocktail-machine.service
sudo systemctl start cocktail-kiosk.service

echo ""
echo "✅ Production services started!"
echo "Check status: sudo systemctl status cocktail-machine.service"
echo "View logs: sudo journalctl -u cocktail-machine.service -f"