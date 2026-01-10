# Deployment Guide

This guide explains how to deploy the Michi app and connect it to Google Cloud Vertex AI.

## Important: Build-Time Environment Variables

**NEXT_PUBLIC_* variables are build-time only** - Next.js embeds them in the client bundle during `npm run build`. These must be:
- Available during Docker build (passed as `--build-arg`)
- Stored in Google Secret Manager (not in git)
- Passed via Cloud Build using `cloudbuild.yaml`

**Secrets Management:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Stored in Secret Manager
- `NEXT_PUBLIC_MAPS_BROWSER_KEY` - Stored in Secret Manager
- Cloud Build automatically pulls these from Secret Manager and passes them as build args

**Cloud Build Setup:**
- Use `cloudbuild.yaml` for automated builds
- Secrets are automatically injected from Secret Manager
- No secrets are stored in git or Docker images

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy Next.js apps and provides excellent integration with GitHub.

#### Steps:

1. **Push your code to GitHub** (already done ✅)

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your GitHub repository (`michi-app`)

3. **Configure Environment Variables:**
   - In Vercel project settings, go to "Environment Variables"
   - Add the following:
     ```
     GOOGLE_CLOUD_PROJECT=worldschool-mvp
     GOOGLE_CLOUD_LOCATION=us-central1
     GOOGLE_APPLICATION_CREDENTIALS=<base64-encoded-service-account-json>
     ```
   - Or use Application Default Credentials (see below)

4. **Deploy:**
   - Vercel will automatically deploy on every push to `main`
   - Your app will be live at `https://your-project.vercel.app`

#### Google Cloud Authentication on Vercel:

**Option A: Service Account Key (Base64)**
1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Base64 encode it: `cat key.json | base64`
4. Add as `GOOGLE_CLOUD_CREDENTIALS_BASE64` environment variable
5. Update API routes to decode and use it

**Option B: Application Default Credentials (Recommended)**
- Use Vercel's integration with Google Cloud
- Or set up Workload Identity Federation (more secure)

---

### Option 2: Google Cloud Run with Cloud Build (Recommended for GCP)

Automated deployment using Cloud Build with Secret Manager integration.

#### Prerequisites:

1. **Create secrets in Secret Manager:**
   ```bash
   # Create secrets for build-time environment variables
   echo -n "your-clerk-publishable-key" | gcloud secrets create NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
     --data-file=- \
     --replication-policy="automatic"
   
   echo -n "your-maps-browser-key" | gcloud secrets create NEXT_PUBLIC_MAPS_BROWSER_KEY \
     --data-file=- \
     --replication-policy="automatic"
   ```

2. **Grant Cloud Build access to secrets:**
   ```bash
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
   gcloud secrets add-iam-policy-binding NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
     --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   
   gcloud secrets add-iam-policy-binding NEXT_PUBLIC_MAPS_BROWSER_KEY \
     --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

3. **Create Artifact Registry repository:**
   ```bash
   gcloud artifacts repositories create michi-backend \
     --repository-format=docker \
     --location=us-central1 \
     --description="Michi backend Docker images"
   ```

#### Automated Deployment:

1. **Set up Cloud Build trigger:**
   - Go to Cloud Build → Triggers
   - Connect your GitHub repository
   - Use `cloudbuild.yaml` as the build configuration file
   - Trigger on push to `main` branch

2. **Deploy:**
   - Push to `main` branch
   - Cloud Build automatically:
     - Pulls secrets from Secret Manager
     - Builds Docker image with build args
     - Pushes to Artifact Registry
     - Deploys to Cloud Run service `michi-backend`

#### Manual Deployment (Alternative):

If you need to deploy manually:

```bash
# Build and deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml
```

**Note:** 
- Secrets are automatically pulled from Secret Manager
- No secrets are stored in git or Docker images
- Cloud Run automatically uses Application Default Credentials for GCP APIs

---

### Option 3: GitHub Pages (Static Export - Limited)

GitHub Pages only works for static sites. Since this app uses API routes and server-side features, you'd need to:
- Use a different hosting for API routes (e.g., Vercel Serverless Functions)
- Export static pages only

**Not recommended** for this app due to API routes and Google Cloud integration.

---

## Google Cloud Setup

### 1. Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com --project=worldschool-mvp
```

### 2. Create Service Account (for local development/testing)

```bash
# Create service account
gcloud iam service-accounts create michi-app-sa \
  --display-name="Michi App Service Account" \
  --project=worldschool-mvp

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding worldschool-mvp \
  --member="serviceAccount:michi-app-sa@worldschool-mvp.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=michi-app-sa@worldschool-mvp.iam.gserviceaccount.com
```

### 3. Local Development Setup

1. **Copy `.env.example` to `.env.local`:**
   ```bash
   cp .env.example .env.local
   ```

2. **Set the service account path:**
   ```bash
   # In .env.local
   GOOGLE_APPLICATION_CREDENTIALS=./key.json
   ```

3. **Or use Application Default Credentials:**
   ```bash
   gcloud auth application-default login
   ```

---

## Testing the Deployment

### Test Google Cloud Connection

1. **Test locally:**
   ```bash
   npm run dev
   # Visit http://localhost:3000/api/ai-test
   # Should return {"text":"OK"}
   ```

2. **Test on deployed app:**
   - Visit `https://your-app-url/api/ai-test`
   - Should return `{"text":"OK"}`

### Test Full Workflow

1. Create a trip
2. Set a learning target
3. Click "Generate learning pathway"
4. Should see AI-generated pathway with schedule blocks

---

## Environment Variables Reference

| Variable | Description | Required | Default | Build Time |
|----------|-------------|----------|---------|------------|
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | Yes | `worldschool-mvp` | No |
| `GOOGLE_CLOUD_LOCATION` | GCP Region | Yes | `us-central1` | No |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON | No* | - | No |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (client-side) | Yes | - | **Yes** |
| `NEXT_PUBLIC_MAPS_BROWSER_KEY` | Google Maps browser API key | No | - | **Yes** |
| `PORT` | Server port | No | `8080` | No |

**Note:** Variables prefixed with `NEXT_PUBLIC_` must be available at **build time** and should be passed as Docker build arguments (`--build-arg`) when building the Docker image.

*Required for local development or if not using Application Default Credentials

---

## Troubleshooting

### "Authentication Error" when calling AI API

- **Local:** Make sure `GOOGLE_APPLICATION_CREDENTIALS` points to valid key file
- **Cloud Run:** Service account needs `roles/aiplatform.user` role
- **Vercel:** Check that environment variables are set correctly

### "Project not found"

- Verify `GOOGLE_CLOUD_PROJECT` matches your actual project ID
- Check that Vertex AI API is enabled: `gcloud services list --enabled`

### API Routes not working

- Make sure you're deploying to a platform that supports Next.js API routes (Vercel, Cloud Run)
- GitHub Pages won't work for API routes

---

## Quick Start: Deploy to Vercel

1. **Fork/Clone this repo** (if not already)
2. **Go to vercel.com** → Import Project
3. **Add environment variables:**
   - `GOOGLE_CLOUD_PROJECT=worldschool-mvp`
   - `GOOGLE_CLOUD_LOCATION=us-central1`
4. **Deploy!** 🚀

Your app will be live in ~2 minutes.
