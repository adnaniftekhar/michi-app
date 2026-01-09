# Environment Variables Setup Guide

## Required API Keys

You need to add two API keys to use Google Places Photos and Maps:

### 1. PLACES_API_KEY (Server-side)
- **Type**: Server API Key
- **Name**: "Michi – Places Server Key"
- **Where to get it**: Google Cloud Console > APIs & Services > Credentials
- **Security**: Server-side only, never exposed to browser
- **Used for**: Places API (New) - resolving locations, getting place details, fetching photos

### 2. NEXT_PUBLIC_MAPS_BROWSER_KEY (Client-side)
- **Type**: Browser API Key
- **Name**: "Maps Platform API Key"
- **Where to get it**: Google Cloud Console > APIs & Services > Credentials
- **Security**: Safe to expose in browser (but restrict by domain!)
- **Used for**: Maps JavaScript API - displaying interactive maps

## Local Development Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys to `.env.local`:**
   ```bash
   PLACES_API_KEY=your-actual-places-api-key
   NEXT_PUBLIC_MAPS_BROWSER_KEY=your-actual-maps-api-key
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## Deployment Setup

### Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add these variables:
   - `PLACES_API_KEY` = your Places server API key
   - `NEXT_PUBLIC_MAPS_BROWSER_KEY` = your Maps browser API key
4. Redeploy your application

### Google Cloud Run

1. When deploying, set environment variables:
   ```bash
   gcloud run deploy michi-app \
     --set-env-vars="PLACES_API_KEY=your-key,NEXT_PUBLIC_MAPS_BROWSER_KEY=your-key"
   ```

   Or use a `.env` file:
   ```bash
   gcloud run deploy michi-app --env-vars-file .env.production
   ```

## API Key Security Best Practices

### For PLACES_API_KEY (Server Key):
- ✅ Keep it server-side only
- ✅ Never commit to git
- ✅ Restrict by IP address if possible
- ✅ Use Application Default Credentials in production (Cloud Run)

### For NEXT_PUBLIC_MAPS_BROWSER_KEY (Browser Key):
- ✅ Restrict by HTTP referrer (domain)
- ✅ Only allow your production domain (e.g., `https://your-app.vercel.app/*`)
- ✅ Add localhost for development: `http://localhost:3000/*`
- ✅ Restrict to specific APIs: Maps JavaScript API only

## Verifying Setup

1. **Test Places API:**
   ```bash
   curl http://localhost:3000/api/places/resolve \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"query": "Tokyo, Japan"}'
   ```

2. **Test Maps:**
   - Open your app in browser
   - Generate a learning pathway with maps enabled
   - Click the map icon on an activity
   - Map should load with a marker

3. **Check browser console:**
   - Should see no API key errors
   - Maps should load without authentication errors

## Troubleshooting

### "Places API key not configured"
- Make sure `PLACES_API_KEY` is set in `.env.local` (local) or environment variables (deployment)
- Restart your dev server after adding the key

### "Maps not loading"
- Check that `NEXT_PUBLIC_MAPS_BROWSER_KEY` is set
- Verify the key is restricted to your domain
- Check browser console for API key errors

### "API key restrictions"
- Make sure your browser key allows your domain
- For localhost: Add `http://localhost:3000/*` to referrer restrictions
- For production: Add your production domain

### "Quota exceeded"
- Check your Google Cloud billing
- Verify APIs are enabled:
  - Places API (New)
  - Maps JavaScript API
