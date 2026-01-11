# How to View Production Logs

## Quick Answer: Where to Find Logs

### If Deployed on **Vercel**:
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click on your project (`michi-app`)
3. Click **"Deployments"** tab
4. Click on the latest deployment
5. Click **"Functions"** tab
6. Click on any function (e.g., `/api/trips`)
7. Scroll down to see **"Logs"** section
8. **OR** use the **"Logs"** tab at the top for real-time logs

**Real-time Logs:**
- Click **"Logs"** tab in your Vercel project
- Filter by function: `/api/trips`
- Look for logs starting with `[Trips API] [req-xxx]`

### If Deployed on **Google Cloud Run**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** → Your service
3. Click **"Logs"** tab
4. Filter by: `[Trips API]` or `req-`
5. **OR** use command line:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'[Trips API]'" --limit 50
   ```

### If Deployed on **Other Platforms**:
- **Netlify**: Dashboard → Site → Functions → View logs
- **Railway**: Dashboard → Deployments → View logs
- **Heroku**: `heroku logs --tail` or Dashboard → More → View logs

---

## What to Look For in Logs

When trip creation fails, look for these log entries:

### Step-by-Step Logs:
```
[Trips API] [req-xxx] POST request received
[Trips API] [req-xxx] Step 1: Authenticating user...
[Trips API] [req-xxx] Step 2: Parsing request body...
[Trips API] [req-xxx] Step 3: Validating required fields...
[Trips API] [req-xxx] Step 4: Initializing Clerk client...
[Trips API] [req-xxx] Step 5: Fetching user from Clerk...
[Trips API] [req-xxx] Step 6: Processing trip data...
[Trips API] [req-xxx] Step 7: Saving to Clerk metadata...
```

### Error Logs:
Look for lines starting with `❌`:
```
[Trips API] [req-xxx] ❌ Auth error: ...
[Trips API] [req-xxx] ❌ Clerk client initialization error: ...
[Trips API] [req-xxx] ❌ Get user error: ...
[Trips API] [req-xxx] ❌ Metadata update attempt X failed: ...
[Trips API] [req-xxx] ❌❌❌ TOP-LEVEL ERROR: ...
```

---

## Browser Console (Easier!)

**I've added detailed error logging to the browser console!**

When trip creation fails:
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for `[handleCreateTrip] ❌ API ERROR:`
4. You'll see:
   - Error message
   - Request ID (use this to find server logs)
   - Full error details

**The Request ID** in the error response matches the server logs, so you can:
1. Copy the Request ID from browser console
2. Go to production logs
3. Search for that Request ID
4. See all related logs for that request

---

## Common Production Issues & Solutions

### Issue: "Authentication failed"
**Check:**
- Is `CLERK_SECRET_KEY` set in production environment variables?
- Vercel: Project Settings → Environment Variables
- Cloud Run: Service → Variables & Secrets

### Issue: "Failed to initialize Clerk client"
**Check:**
- `CLERK_SECRET_KEY` is correct and not expired
- Clerk API is accessible from your deployment region

### Issue: "Failed to fetch user from Clerk"
**Check:**
- User exists in Clerk
- Clerk API rate limits not exceeded
- Network connectivity to Clerk API

### Issue: "Metadata size limit exceeded"
**Solution:**
- Delete old trips or pathways
- Clerk has ~10KB limit for privateMetadata

---

## Quick Debug Steps

1. **Try creating a trip** (it will fail)
2. **Open browser console** (F12 → Console)
3. **Copy the Request ID** from the error
4. **Go to production logs** (Vercel/Cloud Run)
5. **Search for that Request ID**
6. **Find the step that failed** (Step 1-7)
7. **Read the error details** for that step

The logs will tell you EXACTLY what's wrong!
