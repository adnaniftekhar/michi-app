# Testing Maps & Places API

## Quick Test Guide

### Step 1: Verify Environment Variables

First, check if your API keys are loaded:

```bash
# Check if .env.local exists and has keys
cat .env.local | grep -E "(PLACES|MAPS)" | sed 's/=.*/=***HIDDEN***/'
```

You should see:
```
PLACES_API_KEY=***HIDDEN***
NEXT_PUBLIC_MAPS_BROWSER_KEY=***HIDDEN***
```

### Step 2: Test Places API (Server-side)

Test location resolution:

```bash
curl -X POST http://localhost:3000/api/places/resolve \
  -H "Content-Type: application/json" \
  -d '{"query":"New York City, NY"}' \
  -v
```

**Expected Success Response:**
```json
{
  "placeId": "ChIJ...",
  "displayName": "New York, NY, USA",
  "formattedAddress": "New York, NY, USA",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

**Check Server Logs:**
You should see:
```
[places/resolve] 🔍 POST request received
[places/resolve] 📋 API key check: { hasPLACES_API_KEY: true, ... }
[places/resolve] ✅ Place resolved: { ... }
```

### Step 3: Test Maps API Key Endpoint

Test if Maps API key is available:

```bash
curl http://localhost:3000/api/public-config
```

**Expected Success Response:**
```json
{
  "mapsBrowserKey": "AIzaSy..."
}
```

**Check Server Logs:**
You should see:
```
[public-config] 🔍 GET request received
[public-config] 📋 Environment variable check: { hasNEXT_PUBLIC_MAPS_BROWSER_KEY: true, ... }
[public-config] ✅ Maps API key found and will be returned
```

### Step 4: Test in Browser

1. **Open your app:** http://localhost:3000

2. **Open Browser DevTools:**
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Go to the **Console** tab

3. **Create or open a trip** with activities

4. **Click the map icon** on any activity

5. **Watch the Console logs:**
   You should see:
   ```
   [MapModal] 🔍 Starting Maps API key fetch...
   [MapModal] 📡 Fetching /api/public-config...
   [MapModal] 📦 Response data: { hasMapsBrowserKey: true, ... }
   [MapModal] ✅ Maps API key received, length: 39
   [MapModal] ⚙️  Configuring Maps API loader...
   [MapModal] 📚 Importing maps library...
   [MapModal] ✅ Maps library imported
   [MapModal] ✅ Maps API is ready!
   ```

6. **Check if map loads:**
   - You should see an interactive Google Map
   - If not, check for error messages in console

### Step 5: Check Server Logs

In your terminal where `npm run dev` is running, you should see logs like:

```
[public-config] 🔍 GET request received
[public-config] 📋 Environment variable check: { ... }
[places/resolve] 🔍 POST request received
[places-api] 📡 Making Places API request: { ... }
[places-api] 📥 Places API response: { status: 200, ... }
```

## Troubleshooting

### ❌ "Places API key not configured"

**Check:**
```bash
# Verify .env.local exists
ls -la .env.local

# Check if key is set
grep PLACES_API_KEY .env.local
```

**Fix:**
- Run `./check-and-load-secrets.sh` to load from GCP
- Or manually add `PLACES_API_KEY=your-key` to `.env.local`
- **Restart dev server** after adding keys

### ❌ "Maps API key is empty"

**Check:**
```bash
curl http://localhost:3000/api/public-config
```

**Fix:**
- Run `./check-and-load-secrets.sh` to load from GCP
- Or manually add `NEXT_PUBLIC_MAPS_BROWSER_KEY=your-key` to `.env.local`
- **Restart dev server** after adding keys

### ❌ Maps library fails to load

**Check browser console for errors:**
- Look for `[MapModal] ❌` messages
- Check for Google Maps API errors (API key invalid, quota exceeded, etc.)

**Common issues:**
- API key restrictions too strict (add `http://localhost:3000/*` to referrers)
- Maps JavaScript API not enabled in Google Cloud Console
- Billing not enabled

### ❌ Places API returns 403 or authentication error

**Check server logs:**
```
[places-api] ❌ Places API resolve error: { status: 403, ... }
```

**Fix:**
- Verify Places API (New) is enabled in Google Cloud Console
- Check API key restrictions allow Places API (New)
- Verify billing is enabled

## Quick Test Script

Run this to test everything at once:

```bash
#!/bin/bash
echo "🧪 Testing Maps & Places API Setup"
echo ""

echo "1️⃣  Testing Places API..."
PLACES_RESPONSE=$(curl -s -X POST http://localhost:3000/api/places/resolve \
  -H "Content-Type: application/json" \
  -d '{"query":"New York City, NY"}')

if echo "$PLACES_RESPONSE" | grep -q "location"; then
  echo "✅ Places API working!"
else
  echo "❌ Places API failed: $PLACES_RESPONSE"
fi

echo ""
echo "2️⃣  Testing Maps API key..."
MAPS_RESPONSE=$(curl -s http://localhost:3000/api/public-config)

if echo "$MAPS_RESPONSE" | grep -q "mapsBrowserKey" && ! echo "$MAPS_RESPONSE" | grep -q '""'; then
  echo "✅ Maps API key available!"
else
  echo "❌ Maps API key missing: $MAPS_RESPONSE"
fi

echo ""
echo "✅ All tests complete! Check the results above."
```

Save as `test-apis.sh`, make it executable (`chmod +x test-apis.sh`), and run it.
