#!/bin/bash

echo "🚀 Starting Cocktail Machine in Development Mode"
echo "================================================"

cd "$(dirname "$0")/.."

# Start hardware service in development
echo "Starting hardware service..."
cd hardware
npm run dev &
HARDWARE_PID=$!

# Wait for hardware service to start
sleep 3

# Start frontend development server
echo "Starting frontend development server..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "Frontend: http://localhost:8080"
echo "Hardware API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C and kill both processes
trap "echo 'Stopping servers...'; kill $HARDWARE_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Wait for background processes
wait