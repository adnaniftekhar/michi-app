# Fix Local Google Cloud Authentication

## Quick Fix (Run This in Your Terminal)

Open a new terminal window and run:

```bash
gcloud auth application-default login
```

This will:
1. Open your browser
2. Ask you to sign in with your Google account
3. Grant permissions for Application Default Credentials
4. Save credentials locally

**Then restart your dev server:**
```bash
npm run dev
```

Visit http://localhost:3000/api/ai-test - should work now! ✅

---

## Alternative: Use Service Account Key

If you prefer using a service account key file:

### Step 1: Create Service Account

```bash
# Make sure you're using the right project
gcloud config set project worldschool-mvp

# Create service account
gcloud iam service-accounts create michi-app-sa \
  --display-name="Michi App Service Account" \
  --project=worldschool-mvp

# Grant Vertex AI permissions
gcloud projects add-iam-policy-binding worldschool-mvp \
  --member="serviceAccount:michi-app-sa@worldschool-mvp.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=michi-app-sa@worldschool-mvp.iam.gserviceaccount.com
```

### Step 2: Set Environment Variable

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./key.json
```

### Step 3: Add to .env.local (Optional)

Create `.env.local` file:
```
GOOGLE_APPLICATION_CREDENTIALS=./key.json
GOOGLE_CLOUD_PROJECT=worldschool-mvp
GOOGLE_CLOUD_LOCATION=us-central1
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

---

## Verify It Works

After setting up authentication, test:

```bash
curl http://localhost:3000/api/ai-test
```

Should return:
```json
{"text":"OK"}
```

---

## Troubleshooting

**Still getting authentication errors?**

1. **Check your project:**
   ```bash
   gcloud config get-value project
   ```
   Should show: `worldschool-mvp`

2. **Verify Vertex AI API is enabled:**
   ```bash
   gcloud services enable aiplatform.googleapis.com --project=worldschool-mvp
   ```

3. **Check credentials:**
   ```bash
   gcloud auth application-default print-access-token
   ```
   Should print a token (not an error)

4. **Make sure you're logged in:**
   ```bash
   gcloud auth list
   ```
   Should show your account

---

## Why This Happens

Next.js API routes run on the server side, so they need server-side Google Cloud credentials. The `gcloud auth application-default login` command sets up credentials that server applications can use.
