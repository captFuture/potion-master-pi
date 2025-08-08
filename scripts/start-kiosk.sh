#!/bin/bash

echo "🖥️ Starting Kiosk Mode"
echo "====================="

cd "$(dirname "$0")/.."

# Check if hardware service is running
if ! sudo systemctl is-active cocktail-machine.service --quiet; then
    echo "🚀 Starting hardware service..."
    sudo systemctl start cocktail-machine.service
    sleep 5
fi

# Start the preview server in background
echo "🌐 Starting web interface..."
npm run preview -- --host 0.0.0.0 --port 3000 &

# Wait for server to start
sleep 10

# Launch browser in kiosk mode
echo "🖥️ Launching kiosk browser..."
DISPLAY=:0 chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --disable-features=Translate \
    --no-first-run \
    --fast \
    --fast-start \
    --disable-default-apps \
    --disable-popup-blocking \
    --disable-translate \
    --no-default-browser-check \
    --autoplay-policy=no-user-gesture-required \
    --disable-web-security \
    --touch-events=enabled \
    http://localhost:3000

# Kill background processes when browser closes
pkill -f "npm run preview"