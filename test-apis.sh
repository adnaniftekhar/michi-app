#!/bin/bash

# Quick test script for Maps & Places API

echo "🧪 Testing Maps & Places API Setup"
echo "=================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Dev server is not running!"
    echo "   Start it with: npm run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Test 1: Places API
echo "1️⃣  Testing Places API (location resolution)..."
PLACES_RESPONSE=$(curl -s -X POST http://localhost:3000/api/places/resolve \
  -H "Content-Type: application/json" \
  -d '{"query":"New York City, NY"}')

if echo "$PLACES_RESPONSE" | grep -q '"location"'; then
    LAT=$(echo "$PLACES_RESPONSE" | grep -o '"lat":[^,]*' | cut -d: -f2)
    LNG=$(echo "$PLACES_RESPONSE" | grep -o '"lng":[^,}]*' | cut -d: -f2)
    echo "✅ Places API working!"
    echo "   Location: New York City, NY"
    echo "   Coordinates: lat=$LAT, lng=$LNG"
else
    echo "❌ Places API failed"
    echo "   Response: $PLACES_RESPONSE"
    echo ""
    echo "   💡 Check:"
    echo "      - Is PLACES_API_KEY in .env.local?"
    echo "      - Did you restart the dev server?"
    echo "      - Check server logs for details"
fi

echo ""

# Test 2: Maps API Key
echo "2️⃣  Testing Maps API key availability..."
MAPS_RESPONSE=$(curl -s http://localhost:3000/api/public-config)

if echo "$MAPS_RESPONSE" | grep -q '"mapsBrowserKey"' && ! echo "$MAPS_RESPONSE" | grep -q '""'; then
    KEY_LENGTH=$(echo "$MAPS_RESPONSE" | grep -o '"mapsBrowserKey":"[^"]*' | cut -d'"' -f4 | wc -c)
    echo "✅ Maps API key available!"
    echo "   Key length: $((KEY_LENGTH - 1)) characters"
else
    echo "❌ Maps API key missing"
    echo "   Response: $MAPS_RESPONSE"
    echo ""
    echo "   💡 Check:"
    echo "      - Is NEXT_PUBLIC_MAPS_BROWSER_KEY in .env.local?"
    echo "      - Did you restart the dev server?"
    echo "      - Check server logs for details"
fi

echo ""
echo "=================================="
echo "✅ Testing complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Check browser console when using maps (F12)"
echo "   2. Check server logs in terminal for detailed info"
echo "   3. Try clicking a map icon in the app to test interactive maps"
