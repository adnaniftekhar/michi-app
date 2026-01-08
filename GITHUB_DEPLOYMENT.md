# Running Your App on GitHub

## Can You "Publish" on GitHub?

**Short answer:** GitHub itself doesn't host running applications, but you can use GitHub to automatically deploy to hosting platforms.

## What GitHub Can Do:

### ✅ What Works:

1. **GitHub Actions** - Automatically deploy to:
   - **Vercel** (easiest, free tier available)
   - **Google Cloud Run** (uses your GCP project)
   - **Netlify** (alternative to Vercel)
   - **Railway** (simple hosting)

2. **GitHub Codespaces** - Run the app in a cloud development environment (for testing, not production)

3. **GitHub Pages** - ❌ **WON'T WORK** for this app because:
   - Only hosts static HTML/CSS/JS
   - Your app has API routes (`/api/ai-test`, `/api/ai/plan`)
   - Needs server-side Node.js runtime

## Best Option: Deploy via GitHub to Vercel

### Step-by-Step:

1. **Your code is already on GitHub** ✅

2. **Connect GitHub to Vercel:**
   - Go to https://vercel.com
   - Click "Sign Up" → Choose "Continue with GitHub"
   - Click "Add New Project"
   - Find your `michi-app` repository
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add:
     ```
     GOOGLE_CLOUD_PROJECT = worldschool-mvp
     GOOGLE_CLOUD_LOCATION = us-central1
     ```
   - For Google Cloud auth, you'll need to set up a service account (see below)

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

6. **Automatic Deployments:**
   - Every push to `main` branch = automatic deployment
   - Pull requests get preview deployments
   - All free on Vercel's hobby plan

### Your App Will Be Live At:
`https://michi-app-xxx.vercel.app` (or your custom domain)

---

## Setting Up Google Cloud Authentication

### For Vercel Deployment:

**Option 1: Service Account Key (Easiest)**

1. **Create service account in Google Cloud:**
   ```bash
   gcloud iam service-accounts create michi-app-sa \
     --display-name="Michi App Service Account" \
     --project=worldschool-mvp
   
   gcloud projects add-iam-policy-binding worldschool-mvp \
     --member="serviceAccount:michi-app-sa@worldschool-mvp.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

2. **Download the key:**
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=michi-app-sa@worldschool-mvp.iam.gserviceaccount.com
   ```

3. **Base64 encode it:**
   ```bash
   cat key.json | base64
   ```

4. **Add to Vercel:**
   - Go to Vercel project → Settings → Environment Variables
   - Add: `GOOGLE_CLOUD_CREDENTIALS_BASE64` = (paste the base64 string)

5. **Update API routes** to decode and use it (I can help with this if needed)

**Option 2: Use Vercel's Google Cloud Integration** (More Secure)
- Connect Vercel to your Google Cloud project
- Uses Workload Identity (no keys needed)

---

## Alternative: Deploy to Google Cloud Run via GitHub Actions

The `.github/workflows/cloud-run.yml` file I created will automatically deploy to Cloud Run when you push to GitHub.

**Setup (one-time):**

1. **Enable the workflow:**
   - The workflow file is already in your repo
   - You just need to set up the GitHub secrets

2. **Set up Workload Identity:**
   ```bash
   # Create workload identity pool
   gcloud iam workload-identity-pools create github-pool \
     --project=worldschool-mvp \
     --location=global
   
   # Create provider
   gcloud iam workload-identity-pools providers create-oidc github-provider \
     --project=worldschool-mvp \
     --location=global \
     --workload-identity-pool=github-pool \
     --issuer-uri=https://token.actions.githubusercontent.com \
     --allowed-audiences=https://github.com/adnaniftekhar
   ```

3. **Add GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add:
     - `WIF_PROVIDER`: Your provider name
     - `WIF_SERVICE_ACCOUNT`: Service account email

4. **Push to main:**
   ```bash
   git push origin main
   ```
   - GitHub Actions will automatically build and deploy!

---

## Testing Locally (Fix the 500 Error)

The 500 error happens because Google Cloud credentials aren't set up. Here's how to fix it:

### Quick Fix:

```bash
# Option 1: Use Application Default Credentials
gcloud auth application-default login

# Option 2: Use service account key
export GOOGLE_APPLICATION_CREDENTIALS=./key.json
```

Then restart your dev server:
```bash
npm run dev
```

Visit http://localhost:3000/api/ai-test - should work now!

---

## Summary: GitHub Deployment Options

| Option | Hosts App? | Auto-Deploy? | Cost | Best For |
|--------|------------|--------------|------|----------|
| **Vercel** | ✅ Yes | ✅ Yes (via GitHub) | Free tier | Easiest, best for Next.js |
| **Cloud Run** | ✅ Yes | ✅ Yes (via GitHub Actions) | Pay per use | If you're already using GCP |
| **GitHub Pages** | ❌ No | N/A | Free | Static sites only (won't work) |
| **GitHub Codespaces** | ⚠️ Dev only | N/A | Free hours | Testing, not production |

**Recommendation:** Use **Vercel** - it's the easiest and works perfectly with GitHub!

---

## Next Steps:

1. **Fix local 500 error:**
   ```bash
   gcloud auth application-default login
   npm run dev
   ```

2. **Deploy to Vercel:**
   - Go to vercel.com → Import your GitHub repo
   - Add environment variables
   - Deploy!

3. **Test your deployed app:**
   - Visit your Vercel URL
   - Test the AI pathway generation

Your app will be publicly accessible and automatically update when you push to GitHub! 🚀
