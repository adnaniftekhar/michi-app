# Complete API Setup Guide

## The Problem

Your app needs **TWO** Google Cloud API keys to work properly:

1. **PLACES_API_KEY** (Server-side) - For resolving locations to coordinates
2. **NEXT_PUBLIC_MAPS_BROWSER_KEY** (Client-side) - For displaying interactive maps

Currently, both are missing, which is causing:
- ❌ "Failed to resolve location coordinates" errors
- ❌ Maps not loading

## Quick Setup (5 Steps)

### Step 1: Go to Google Cloud Console

Visit: https://console.cloud.google.com/apis/credentials?project=worldschool-mvp

### Step 2: Enable Required APIs

Make sure these APIs are enabled:
- **Places API (New)** - For location resolution
- **Maps JavaScript API** - For interactive maps

To enable:
1. Go to: APIs & Services > Library
2. Search for each API
3. Click "Enable" if not already enabled

### Step 3: Create Two API Keys

#### Key 1: Places API Key (Server-side)

1. In Credentials page, click **"Create Credentials"** → **"API Key"**
2. Click on the newly created key to edit it
3. **Name it:** "Michi Places Server Key"
4. **Restrictions:**
   - **API restrictions:** Select "Restrict key" → Choose "Places API (New)"
   - **Application restrictions:** Select "IP addresses" (or "None" for local dev)
5. **Copy the key** - This is your `PLACES_API_KEY`

#### Key 2: Maps Browser Key (Client-side)

1. Click **"Create Credentials"** → **"API Key"** again
2. Click on the newly created key to edit it
3. **Name it:** "Michi Maps Browser Key"
4. **Restrictions:**
   - **API restrictions:** Select "Restrict key" → Choose "Maps JavaScript API"
   - **Application restrictions:** Select "HTTP referrers"
   - **Add referrers:**
     - `http://localhost:3000/*`
     - `http://localhost:*/*`
     - Your production domain (e.g., `https://your-app.vercel.app/*`)
5. **Copy the key** - This is your `NEXT_PUBLIC_MAPS_BROWSER_KEY`

### Step 4: Create `.env.local` File

In your project root (`/Users/adnan/Desktop/michi-app-main`), create a file named `.env.local`:

```bash
cd /Users/adnan/Desktop/michi-app-main
touch .env.local
```

Then add both keys:

```bash
# Places API Key (Server-side)
PLACES_API_KEY=your-places-api-key-here

# Maps Browser API Key (Client-side)
NEXT_PUBLIC_MAPS_BROWSER_KEY=your-maps-browser-key-here
```

**Replace the placeholder values with your actual API keys!**

### Step 5: Restart Your Dev Server

1. **Stop the current server:**
   - In the terminal where `npm run dev` is running, press `Ctrl + C`

2. **Start it again:**
   ```bash
   npm run dev
   ```

## Verify It's Working

### Test 1: Places API
```bash
curl http://localhost:3000/api/places/resolve \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"New York City, NY"}'
```

Should return coordinates (not an error).

### Test 2: Maps API Key
```bash
curl http://localhost:3000/api/public-config
```

Should return: `{"mapsBrowserKey":"AIzaSy..."}` (not empty).

### Test 3: In Browser
1. Open: http://localhost:3000
2. Create or open a trip
3. Generate a pathway
4. Click map icons - should work without errors!

## Troubleshooting

### "Places API key not configured"
- ✅ Check `.env.local` exists
- ✅ Check `PLACES_API_KEY` is set (no quotes, no spaces)
- ✅ Restart dev server after adding/changing `.env.local`

### "Failed to resolve location coordinates"
- ✅ Verify Places API (New) is enabled
- ✅ Check API key restrictions allow Places API (New)
- ✅ Check billing is enabled for your Google Cloud project

### "Maps not loading"
- ✅ Check `NEXT_PUBLIC_MAPS_BROWSER_KEY` is set in `.env.local`
- ✅ Verify Maps JavaScript API is enabled
- ✅ Check HTTP referrer restrictions include `http://localhost:3000/*`
- ✅ Restart dev server

### "API key invalid" or "403 Forbidden"
- ✅ Check API key restrictions match what you're using
- ✅ For Places API: Must allow "Places API (New)"
- ✅ For Maps: Must allow "Maps JavaScript API"
- ✅ Check billing is enabled

### Still Not Working?

Check the server logs for detailed error messages. I've improved the logging to show exactly what's wrong.

## What I Fixed

✅ **Improved error logging** - Better error messages showing what's missing  
✅ **Added helpful hints** - API endpoints now suggest fixes  
✅ **Enhanced Places API error handling** - Shows specific authentication issues  

The code is now fixed. You just need to add both API keys to `.env.local`!
