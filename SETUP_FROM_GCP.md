# Setup from Google Cloud Secrets

This guide helps you use your existing Google Cloud Secret Manager secrets for local development.

## Quick Setup

### Step 1: Authenticate with Google Cloud

```bash
gcloud auth login
```

This will open your browser to sign in with your Google account.

### Step 2: Load Secrets from Secret Manager

Run the automated script:

```bash
./load-gcp-secrets.sh
```

This script will:
- ✅ Check your authentication
- ✅ List all available secrets
- ✅ Automatically map secrets to environment variables
- ✅ Create `.env.local` with the secrets

### Step 3: Restart Your Dev Server

```bash
npm run dev
```

## What Secrets Are Expected?

The script looks for these secret names (case-insensitive):

**For Places API:**
- `PLACES_API_KEY`
- `places-api-key`
- `PLACES_API`

**For Maps API:**
- `NEXT_PUBLIC_MAPS_BROWSER_KEY`
- `maps-browser-key`
- `MAPS_BROWSER_KEY`
- `maps-api-key`

## Manual Setup

If the automated script doesn't work, you can manually fetch secrets:

```bash
# Set your project
gcloud config set project worldschool-mvp

# Get Places API key
gcloud secrets versions access latest --secret="PLACES_API_KEY" > places_key.txt

# Get Maps API key  
gcloud secrets versions access latest --secret="NEXT_PUBLIC_MAPS_BROWSER_KEY" > maps_key.txt

# Create .env.local
cat > .env.local << EOF
PLACES_API_KEY=$(cat places_key.txt)
NEXT_PUBLIC_MAPS_BROWSER_KEY=$(cat maps_key.txt)
EOF

# Clean up
rm places_key.txt maps_key.txt
```

## Troubleshooting

### "Not authenticated"
```bash
gcloud auth login
```

### "Permission denied" when accessing secrets
You need the `secretmanager.secretAccessor` role:
```bash
gcloud projects add-iam-policy-binding worldschool-mvp \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/secretmanager.secretAccessor"
```

### "Secret not found"
Check what secrets you have:
```bash
gcloud secrets list --project=worldschool-mvp
```

If your secrets have different names, you can:
1. Rename them in Secret Manager, OR
2. Manually create `.env.local` with the correct names

### Secret Manager API not enabled
```bash
gcloud services enable secretmanager.googleapis.com --project=worldschool-mvp
```

## Verify It's Working

After loading secrets:

```bash
# Check .env.local was created
cat .env.local

# Test Places API
curl http://localhost:3000/api/places/resolve \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"New York City, NY"}'

# Test Maps config
curl http://localhost:3000/api/public-config
```

Both should return data (not errors).
