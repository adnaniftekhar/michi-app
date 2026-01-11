# Quick: Authenticate and Load Secrets

## Step-by-Step Instructions

### Step 1: Authenticate with Google Cloud

Open your terminal and run:

```bash
export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"
gcloud auth login
```

This will:
1. Open your browser
2. Ask you to sign in with your Google account
3. Grant permissions
4. Save credentials locally

**After signing in, you'll see a message like: "You are now authenticated..."**

### Step 2: Load Secrets from GCP

Once authenticated, run:

```bash
cd /Users/adnan/Desktop/michi-app-main
./check-and-load-secrets.sh
```

This will:
- ✅ Check your authentication
- ✅ List all secrets in Secret Manager
- ✅ Automatically load them into `.env.local`
- ✅ Show you what was loaded

### Step 3: Restart Your Dev Server

After secrets are loaded:

```bash
# Stop current server (Ctrl + C)
# Then restart:
npm run dev
```

### Step 4: Test It

Run the test script:

```bash
./test-apis.sh
```

You should see:
- ✅ Places API working!
- ✅ Maps API key available!

## Troubleshooting

### "gcloud: command not found"

Make sure gcloud is in your PATH:

```bash
export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"
```

Or add it permanently to your `~/.zshrc`:

```bash
echo 'export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "Permission denied" when accessing secrets

You need the `secretmanager.secretAccessor` role. Ask your GCP admin to grant it, or if you're the admin:

```bash
gcloud projects add-iam-policy-binding worldschool-mvp \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/secretmanager.secretAccessor"
```

### "No secrets found"

Check what secrets exist:

```bash
gcloud secrets list --project=worldschool-mvp
```

If secrets have different names, the script will try to detect them automatically, or you can manually edit `.env.local` after it's created.
