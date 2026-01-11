# Quick Fix: Maps API Not Working

## The Problem
Your Maps API key is not configured. The app is trying to load Google Maps but can't find the API key.

## The Solution (3 Steps)

### Step 1: Get Your Google Maps API Key

1. Go to: https://console.cloud.google.com/apis/credentials?project=worldschool-mvp
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the API key (it will look like: `AIzaSy...`)

### Step 2: Create `.env.local` File

In your terminal, run:

```bash
cd /Users/adnan/Desktop/michi-app-main
echo "NEXT_PUBLIC_MAPS_BROWSER_KEY=YOUR_API_KEY_HERE" > .env.local
```

**Replace `YOUR_API_KEY_HERE` with the actual API key you copied.**

Or manually create the file:
1. Create a file named `.env.local` in the project root
2. Add this line (replace with your actual key):
   ```
   NEXT_PUBLIC_MAPS_BROWSER_KEY=AIzaSyYourActualKeyHere
   ```

### Step 3: Restart Your Dev Server

1. **Stop the current server:**
   - In the terminal where `npm run dev` is running, press `Ctrl + C`

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Test it:**
   - Visit: http://localhost:3000/api/public-config
   - You should see your API key (not empty)

## Verify It's Working

After restarting:
1. Open your app: http://localhost:3000
2. Go to a trip with activities
3. Click the map icon
4. You should see an interactive Google Map!

## Still Not Working?

### Check 1: Is the key in the file?
```bash
cat .env.local
```
Should show: `NEXT_PUBLIC_MAPS_BROWSER_KEY=AIzaSy...`

### Check 2: Is the server reading it?
```bash
curl http://localhost:3000/api/public-config
```
Should return: `{"mapsBrowserKey":"AIzaSy..."}` (not empty)

### Check 3: Browser Console
- Open browser DevTools (F12)
- Look for errors about Google Maps
- Common errors:
  - "RefererNotAllowedMapError" → Add `http://localhost:3000/*` to API key restrictions
  - "ApiNotActivatedMapError" → Enable "Maps JavaScript API" in Google Cloud Console

## Security: Restrict Your API Key

**Important:** Restrict your API key to prevent unauthorized use:

1. In Google Cloud Console, click on your API key
2. Under **"Application restrictions"**:
   - Select "HTTP referrers (web sites)"
   - Add: `http://localhost:3000/*`
3. Under **"API restrictions"**:
   - Select "Restrict key"
   - Choose "Maps JavaScript API"
4. Click **"Save"**

## What I Fixed

✅ **Added geocoding library import** - Fixed missing library that was causing errors  
✅ **Improved error messages** - Better console warnings when API key is missing  
✅ **Added user-facing warning** - Shows a helpful message in the UI when key is missing

The code is now fixed. You just need to add your API key!
