#!/bin/bash

echo "🖥️ Starting Kiosk Mode"
echo "====================="

cd "$(dirname "$0")/.."

# Try to start hardware service (new name), fallback to legacy name
if systemctl list-unit-files | grep -q '^cocktail-hardware.service'; then
    if ! sudo systemctl is-active cocktail-hardware.service --quiet; then
        echo "🚀 Starting hardware service (cocktail-hardware.service)..."
        sudo systemctl start cocktail-hardware.service
        sleep 3
    fi
else
    if ! sudo systemctl is-active cocktail-machine.service --quiet; then
        echo "🚀 Starting hardware service (cocktail-machine.service)..."
        sudo systemctl start cocktail-machine.service
        sleep 3
    fi
fi

# Ensure nginx is running (serving static frontend)
echo "🌐 Ensuring Nginx is running..."
sudo systemctl start nginx || true

# Wait a bit for nginx to be ready
sleep 3

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
    http://localhost/
