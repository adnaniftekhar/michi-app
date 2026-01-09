# ✅ API Keys Setup Complete

Your API keys have been successfully configured!

## What Was Set Up

1. **`.env.local` file created** with your API keys:
   - `PLACES_API_KEY` - Server-side Places API key
   - `NEXT_PUBLIC_MAPS_BROWSER_KEY` - Browser Maps API key

2. **Security verified:**
   - ✅ `.env.local` is properly gitignored (won't be committed to git)
   - ✅ Keys are stored locally only

## Next Steps

### 1. Restart Your Dev Server

If your dev server is running, **restart it** to load the new environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Test the Setup

Once your server is restarted, test the Places API:

```bash
# Test Places API endpoint
curl http://localhost:3000/api/places/resolve \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "Tokyo, Japan"}'
```

You should get a JSON response with place data.

### 3. Test in the App

1. Open your app: `http://localhost:3000`
2. Create or open a trip
3. Set a learning target
4. Click "Generate learning pathway"
5. In the options modal:
   - Select "Google place photos" for Images
   - Toggle "Include maps" ON
6. Generate the pathway
7. You should see:
   - Images from Google Places (with attribution)
   - Map icons on activities
   - Clicking map icons opens interactive maps

## For Deployment

When you deploy to Vercel or Cloud Run, add these same environment variables:

### Vercel:
1. Go to Project Settings → Environment Variables
2. Add:
   - `PLACES_API_KEY` = `AIzaSyBM3bV46ybAV-M5LHiY7VUU95AmSNIjbkc`
   - `NEXT_PUBLIC_MAPS_BROWSER_KEY` = `AIzaSyCMwI1vt9nOizbMrdJr7y_bhLjJDrImjuo`

### Cloud Run:
```bash
gcloud run deploy michi-app \
  --set-env-vars="PLACES_API_KEY=AIzaSyBM3bV46ybAV-M5LHiY7VUU95AmSNIjbkc,NEXT_PUBLIC_MAPS_BROWSER_KEY=AIzaSyCMwI1vt9nOizbMrdJr7y_bhLjJDrImjuo"
```

## Security Reminders

⚠️ **Important**: 
- Never commit `.env.local` to git (it's already gitignored ✅)
- Restrict your browser API key by domain in GCP Console:
  - Add `http://localhost:3000/*` for local dev
  - Add your production domain (e.g., `https://your-app.vercel.app/*`)

## Troubleshooting

If things don't work after restarting:

1. **Check the keys are loaded:**
   ```bash
   # In your terminal, verify:
   cat .env.local
   ```

2. **Verify APIs are enabled in GCP:**
   - Places API (New) ✅
   - Maps JavaScript API ✅

3. **Check browser console** for any API key errors

4. **Check server logs** for Places API errors

---

**You're all set!** 🎉 Restart your dev server and start generating pathways with images and maps!
