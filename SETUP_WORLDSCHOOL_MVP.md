# Setup worldschool-mvp Project

## Step-by-Step Setup

### Step 1: Refresh Google Cloud Authentication

```bash
# Login to Google Cloud
gcloud auth login

# Set up Application Default Credentials (for local development)
gcloud auth application-default login
```

### Step 2: Create the Project (if it doesn't exist)

```bash
# Create the project
gcloud projects create worldschool-mvp --name="Worldschool MVP"

# Set it as your active project
gcloud config set project worldschool-mvp

# Link it to a billing account (required for Vertex AI)
# Replace BILLING_ACCOUNT_ID with your billing account ID
gcloud billing projects link worldschool-mvp --billing-account=BILLING_ACCOUNT_ID
```

**To find your billing account ID:**
```bash
gcloud billing accounts list
```

### Step 3: Enable Vertex AI API

```bash
# Enable the Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=worldschool-mvp

# Verify it's enabled
gcloud services list --enabled --project=worldschool-mvp | grep aiplatform
```

### Step 4: Create Service Account (for local development)

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

### Step 5: Set Up Local Environment

**Option A: Use Application Default Credentials (Recommended)**

```bash
# Already done in Step 1, just verify:
gcloud auth application-default print-access-token
```

**Option B: Use Service Account Key**

```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=./key.json

# Or create .env.local file:
echo "GOOGLE_APPLICATION_CREDENTIALS=./key.json" > .env.local
echo "GOOGLE_CLOUD_PROJECT=worldschool-mvp" >> .env.local
echo "GOOGLE_CLOUD_LOCATION=us-central1" >> .env.local
```

### Step 6: Verify Setup

```bash
# Check project is set
gcloud config get-value project
# Should output: worldschool-mvp

# Test Vertex AI access
gcloud ai models list --region=us-central1 --project=worldschool-mvp
```

### Step 7: Start Your App

```bash
npm run dev
```

Visit http://localhost:3000/api/ai-test - should return `{"text":"OK"}` ✅

---

## Quick Commands Summary

```bash
# 1. Auth
gcloud auth login
gcloud auth application-default login

# 2. Create project (if needed)
gcloud projects create worldschool-mvp --name="Worldschool MVP"
gcloud config set project worldschool-mvp

# 3. Enable API
gcloud services enable aiplatform.googleapis.com --project=worldschool-mvp

# 4. Create service account
gcloud iam service-accounts create michi-app-sa \
  --display-name="Michi App Service Account" \
  --project=worldschool-mvp

gcloud projects add-iam-policy-binding worldschool-mvp \
  --member="serviceAccount:michi-app-sa@worldschool-mvp.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# 5. Test
npm run dev
# Visit http://localhost:3000/api/ai-test
```

---

## Troubleshooting

**"Project not found"**
- Make sure you created the project: `gcloud projects create worldschool-mvp`
- Check you have access: `gcloud projects list`

**"Permission denied"**
- Make sure Vertex AI API is enabled
- Check service account has `roles/aiplatform.user` role

**"Billing not enabled"**
- Vertex AI requires billing to be enabled
- Link billing account: `gcloud billing projects link worldschool-mvp --billing-account=YOUR_BILLING_ID`

**"Authentication error"**
- Run: `gcloud auth application-default login`
- Or set: `export GOOGLE_APPLICATION_CREDENTIALS=./key.json`

---

## Next Steps After Setup

Once local is working:
1. Deploy to Vercel (see `GITHUB_DEPLOYMENT.md`)
2. Set up environment variables in Vercel
3. Your app will be live! 🚀
