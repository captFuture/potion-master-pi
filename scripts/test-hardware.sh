#!/bin/bash

echo "🧪 Testing Cocktail Machine Hardware"
echo "===================================="

cd "$(dirname "$0")/../hardware"

echo ""
echo "🔍 Running I2C device scan..."
npm run test-i2c

echo ""
echo "⚖️ Testing scale..."
npm run test-scale

echo ""
echo "🔌 Testing relay board..."
npm run test-relay

echo ""
echo "✅ Hardware test complete!"