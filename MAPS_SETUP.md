# Maps API Setup Guide

## Quick Fix: Enable Maps in Your App

The Maps API requires a Google Maps API key to work. Here's how to set it up:

### Step 1: Get Your Google Maps API Key

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Make sure you're in the `worldschool-mvp` project

2. **Enable the Maps JavaScript API:**
   - Go to: APIs & Services > Library
   - Search for "Maps JavaScript API"
   - Click "Enable"

3. **Create a Browser API Key:**
   - Go to: APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"
   - Select "Browser key" (or "Restrict key" and choose "HTTP referrers")
   - Copy the API key

4. **Restrict the API Key (Important for Security):**
   - Click on your newly created API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Maps JavaScript API" only
   - Under "Application restrictions", select "HTTP referrers"
   - Add these referrers:
     - `http://localhost:3000/*` (for local development)
     - `http://localhost:*/*` (for any localhost port)
     - Your production domain (e.g., `https://your-app.vercel.app/*`)
   - Click "Save"

### Step 2: Add the Key to Your Local Environment

1. **Create a `.env.local` file in your project root:**
   ```bash
   cd /Users/adnan/Desktop/michi-app-main
   touch .env.local
   ```

2. **Add your Maps API key to `.env.local`:**
   ```bash
   NEXT_PUBLIC_MAPS_BROWSER_KEY=your-actual-api-key-here
   ```

   Replace `your-actual-api-key-here` with the API key you copied from Google Cloud Console.

3. **Restart your dev server:**
   - Stop the current server (Ctrl + C)
   - Start it again: `npm run dev`

### Step 3: Test It

1. Open your app in the browser: http://localhost:3000
2. Navigate to a trip with activities
3. Click the map icon on any activity
4. You should see an interactive Google Map!

## What I Fixed

1. ✅ **Added geocoding library import** - The code was trying to use `Geocoder` but wasn't importing the geocoding library. Now it properly imports `geocoding` along with `maps` and `places`.

2. ✅ **Created setup documentation** - This guide helps you configure the Maps API key.

## Troubleshooting

### Maps still not showing?

1. **Check the browser console:**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Look for errors related to Google Maps
   - Common errors:
     - "This API key is not authorized" → Check API restrictions
     - "RefererNotAllowedMapError" → Add your domain to HTTP referrer restrictions
     - "ApiNotActivatedMapError" → Enable Maps JavaScript API

2. **Verify your API key is loaded:**
   - Visit: http://localhost:3000/api/public-config
   - You should see: `{"mapsBrowserKey":"your-key-here"}`
   - If it's empty, check your `.env.local` file

3. **Check environment variable:**
   ```bash
   # In your terminal, check if the variable is set
   echo $NEXT_PUBLIC_MAPS_BROWSER_KEY
   ```
   - If empty, make sure `.env.local` exists and has the key
   - Restart your dev server after adding/changing `.env.local`

### Static maps work but interactive maps don't?

- This means your API key is working for Static Maps API but not Maps JavaScript API
- Make sure "Maps JavaScript API" is enabled in Google Cloud Console
- Check that your API key restrictions allow Maps JavaScript API

### Getting quota/billing errors?

- Make sure billing is enabled for your Google Cloud project
- Check your API quotas in Google Cloud Console
- Maps JavaScript API has a free tier (usually $200/month credit)

## Next Steps

Once Maps is working, you can also set up:
- **Places API** - For better location resolution and place details
- See `ENV_SETUP.md` for Places API setup instructions
