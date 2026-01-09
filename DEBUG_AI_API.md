# Debugging AI API 500 Error

## Quick Checks

1. **Test basic AI connection:**
   ```bash
   curl http://localhost:3000/api/ai-test
   ```
   Should return `{"text":"OK"}` if Vertex AI is working.

2. **Check environment variables:**
   ```bash
   cat .env.local | grep GOOGLE_CLOUD
   ```
   Should show:
   - `GOOGLE_CLOUD_PROJECT=worldschool-mvp`
   - `GOOGLE_CLOUD_LOCATION=us-central1`

3. **Check Google Cloud authentication:**
   ```bash
   gcloud auth application-default print-access-token
   ```
   Should return a token (not an error).

## Common Issues

### Issue 1: Authentication Error
**Symptoms:** Error about "Unable to authenticate" or "Failed to connect to Google Cloud"

**Fix:**
```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project worldschool-mvp
```

### Issue 2: Vertex AI API Not Enabled
**Symptoms:** Error about API not enabled or 403 Forbidden

**Fix:**
```bash
gcloud services enable aiplatform.googleapis.com --project=worldschool-mvp
```

### Issue 3: Wrong Model Name
**Symptoms:** Error about model not found

**Current model:** `gemini-2.0-flash`
**Alternative models to try:**
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### Issue 4: Network/Timeout
**Symptoms:** Request times out or connection refused

**Check:**
- Internet connectivity
- Firewall settings
- VPN issues

## Viewing Server Logs

When you get a 500 error, check your terminal where `npm run dev` is running. The error details will be logged there.

Look for:
- `AI plan generation error:`
- `Error stack:`
- `Error details:`

## Testing the AI Plan Endpoint Directly

```bash
curl -X POST http://localhost:3000/api/ai/plan \
  -H "Content-Type: application/json" \
  -d '{
    "learnerProfileId": "alice",
    "trip": {
      "id": "test",
      "title": "Test Trip",
      "startDate": "2026-06-01",
      "endDate": "2026-06-03",
      "baseLocation": "Tokyo, Japan",
      "createdAt": "2026-01-01T00:00:00Z"
    },
    "learningTarget": {
      "track": "15min"
    }
  }'
```

This will show you the exact error message.
