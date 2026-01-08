# Quick Start: Testing Your Deployment

## 1. Test Locally First

### Setup Google Cloud Credentials

**Option A: Service Account Key (Easiest for testing)**
```bash
# Create service account and download key
gcloud iam service-accounts create michi-app-sa \
  --display-name="Michi App Service Account" \
  --project=worldschool-mvp

gcloud projects add-iam-policy-binding worldschool-mvp \
  --member="serviceAccount:michi-app-sa@worldschool-mvp.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud iam service-accounts keys create key.json \
  --iam-account=michi-app-sa@worldschool-mvp.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=./key.json
```

**Option B: Application Default Credentials**
```bash
gcloud auth application-default login
```

### Run the App

```bash
npm install
npm run dev
```

Visit http://localhost:3000

### Test AI Connection

Visit http://localhost:3000/api/ai-test - should return `{"text":"OK"}`

---

## 2. Deploy to Vercel (Recommended)

### Step-by-Step:

1. **Go to [vercel.com](https://vercel.com)**
   - Sign in with GitHub
   - Click "Add New Project"

2. **Import your repository:**
   - Select `michi-app` (or your repo name)
   - Click "Import"

3. **Configure Environment Variables:**
   - In project settings → Environment Variables
   - Add:
     ```
     GOOGLE_CLOUD_PROJECT = worldschool-mvp
     GOOGLE_CLOUD_LOCATION = us-central1
     ```
   - For Google Cloud auth, you have two options:
     - **Option A:** Use Vercel's Google Cloud integration
     - **Option B:** Base64 encode your service account key and add as `GOOGLE_CLOUD_CREDENTIALS_BASE64`

4. **Deploy:**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your app is live! 🎉

5. **Test:**
   - Visit `https://your-project.vercel.app/api/ai-test`
   - Should return `{"text":"OK"}`

---

## 3. Deploy to Google Cloud Run

### Using GitHub Actions (Automatic):

1. **Set up Workload Identity Federation:**
   ```bash
   # One-time setup
   gcloud iam workload-identity-pools create github-pool \
     --project=worldschool-mvp \
     --location=global

   gcloud iam workload-identity-pools providers create-oidc github-provider \
     --project=worldschool-mvp \
     --location=global \
     --workload-identity-pool=github-pool \
     --issuer-uri=https://token.actions.githubusercontent.com \
     --allowed-audiences=https://github.com/adnaniftekhar
   ```

2. **Add GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add:
     - `WIF_PROVIDER`: Your workload identity provider
     - `WIF_SERVICE_ACCOUNT`: Service account email

3. **Push to main branch:**
   ```bash
   git push origin main
   ```
   - GitHub Actions will automatically build and deploy

### Manual Deployment:

```bash
# Build and push
docker build -t gcr.io/worldschool-mvp/michi-app .
docker push gcr.io/worldschool-mvp/michi-app

# Deploy
gcloud run deploy michi-app \
  --image gcr.io/worldschool-mvp/michi-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=worldschool-mvp,GOOGLE_CLOUD_LOCATION=us-central1
```

---

## 4. Verify Everything Works

### Test Checklist:

- [ ] App loads at deployed URL
- [ ] Can create a trip
- [ ] Can set learning target
- [ ] Can generate AI pathway (this tests Google Cloud connection)
- [ ] Images and maps display (if enabled in settings)
- [ ] Tooltips work on profile page

### Common Issues:

**"Authentication Error"**
- Check environment variables are set
- Verify service account has `roles/aiplatform.user` role
- For Cloud Run: Service account needs proper IAM permissions

**"Project not found"**
- Verify `GOOGLE_CLOUD_PROJECT` matches your actual project ID
- Check Vertex AI API is enabled: `gcloud services enable aiplatform.googleapis.com`

**API routes return 404**
- Make sure you're using a platform that supports Next.js API routes (Vercel, Cloud Run)
- GitHub Pages won't work for API routes

---

## Next Steps

Once deployed, you can:
- Share the URL with others
- Test the full learning pathway generation flow
- Monitor usage in Google Cloud Console
- Set up custom domain (Vercel/Cloud Run both support this)
