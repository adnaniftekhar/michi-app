# Fixed: Places API on GCP

## What Was Wrong

The `PLACES_API_KEY` was missing from the Cloud Run deployment configuration. The service didn't have access to the secret.

## What I Fixed

### 1. ✅ Granted Service Account Permission
```bash
gcloud secrets add-iam-policy-binding PLACES_API_KEY \
  --project=worldschool-mvp \
  --member="serviceAccount:451501234454-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 2. ✅ Updated Cloud Run Service
Added `PLACES_API_KEY` secret to the running service:
```bash
gcloud run services update michi-backend \
  --project=worldschool-mvp \
  --region=us-central1 \
  --update-secrets="PLACES_API_KEY=PLACES_API_KEY:latest"
```

### 3. ✅ Updated cloudbuild.yaml
Updated the deployment configuration so future deployments automatically include `PLACES_API_KEY`.

## Current Status

✅ **PLACES_API_KEY is now configured in Cloud Run**

The service now has access to:
- `CLERK_SECRET_KEY` (from secret)
- `MAPS_BROWSER_KEY` (from secret)
- `NEXT_PUBLIC_MAPS_BROWSER_KEY` (from secret)
- `PLACES_API_KEY` (from secret) ← **NEWLY ADDED**

## Test It

Test the Places API on the deployed service:

```bash
curl -X POST https://michi-backend-451501234454.us-central1.run.app/api/places/resolve \
  -H "Content-Type: application/json" \
  -d '{"query":"New York City, NY"}'
```

Should return coordinates (not an error).

## View Logs

To check logs for Places API calls:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=michi-backend" \
  --project=worldschool-mvp \
  --limit=50 \
  --format="table(timestamp,severity,textPayload,jsonPayload.message)" \
  --freshness=1h
```

Look for:
- `[places/resolve]` logs
- `[places-api]` logs
- Any error messages

## Future Deployments

The `cloudbuild.yaml` has been updated, so future deployments via Cloud Build will automatically include `PLACES_API_KEY`.
