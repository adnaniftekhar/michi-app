#!/bin/bash

# Comprehensive script to check GCP secrets and load them

set -e

echo "🔐 Google Cloud Secrets Checker & Loader"
echo "=========================================="
echo ""

# Add gcloud to PATH
export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud command not found."
    echo "   Install: brew install --cask google-cloud-sdk"
    exit 1
fi

# Check authentication
echo "📋 Step 1: Checking authentication..."
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)

if [ -z "$ACCOUNT" ]; then
    echo "⚠️  Not authenticated."
    echo ""
    echo "🔐 Attempting to authenticate now..."
    echo "   This will open your browser for sign-in..."
    echo ""
    
    # Try to authenticate
    if gcloud auth login --no-launch-browser 2>&1 | grep -q "Go to the following link"; then
        echo ""
        echo "✅ Authentication link generated!"
        echo "   Please open the link above in your browser and sign in."
        echo "   After signing in, run this script again."
        exit 1
    else
        # Try with browser launch
        echo "   Opening browser for authentication..."
        gcloud auth login
        ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)
        
        if [ -z "$ACCOUNT" ]; then
            echo ""
            echo "❌ Authentication failed or cancelled."
            echo "   Please run manually: gcloud auth login"
            exit 1
        fi
    fi
fi

echo "✅ Authenticated as: $ACCOUNT"
echo ""

# Check project
PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT" ]; then
    PROJECT="worldschool-mvp"
    gcloud config set project $PROJECT
    echo "📁 Set project to: $PROJECT"
else
    echo "📁 Project: $PROJECT"
fi
echo ""

# List all secrets
echo "🔍 Step 2: Listing all secrets in Secret Manager..."
echo ""

# Enable Secret Manager API if needed
if ! gcloud services list --enabled --filter="name:secretmanager.googleapis.com" --format="value(name)" 2>/dev/null | grep -q secretmanager; then
    echo "⚠️  Secret Manager API not enabled. Enabling now..."
    gcloud services enable secretmanager.googleapis.com --project=$PROJECT
    echo "✅ Secret Manager API enabled"
    echo ""
fi

SECRETS=$(gcloud secrets list --project=$PROJECT --format="value(name)" 2>/dev/null)

if [ -z "$SECRETS" ]; then
    echo "❌ No secrets found in Secret Manager"
    echo ""
    echo "You may need to:"
    echo "  1. Create secrets in Secret Manager, OR"
    echo "  2. Check you have the right permissions"
    exit 1
fi

echo "Found secrets:"
echo "$SECRETS" | while read -r secret; do
    echo "  - $secret"
done
echo ""

# Function to get secret value
get_secret() {
    local secret_name=$1
    gcloud secrets versions access latest --secret="$secret_name" --project=$PROJECT 2>/dev/null
}

# Create .env.local
ENV_FILE=".env.local"
BACKUP_FILE=".env.local.backup.$(date +%Y%m%d_%H%M%S)"

if [ -f "$ENV_FILE" ]; then
    echo "📦 Backing up existing .env.local to $BACKUP_FILE"
    cp "$ENV_FILE" "$BACKUP_FILE"
fi

echo "# Auto-generated from GCP Secret Manager" > "$ENV_FILE"
echo "# Generated on: $(date)" >> "$ENV_FILE"
echo "# Project: $PROJECT" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"

LOADED_COUNT=0

echo "🔍 Step 3: Loading secrets..."
echo ""

# Try common secret names (using simple array instead of associative for zsh compatibility)
check_and_load_secret() {
    local secret_name=$1
    local env_var=$2
    
    if echo "$SECRETS" | grep -q "^$secret_name$"; then
        echo -n "  Loading $secret_name → $env_var... "
        
        if secret_value=$(get_secret "$secret_name" 2>/dev/null); then
            # Check if already added
            if ! grep -q "^$env_var=" "$ENV_FILE"; then
                echo "$env_var=$secret_value" >> "$ENV_FILE"
                echo "✅"
                return 0
            else
                echo "⚠️  (already loaded)"
                return 0
            fi
        else
            echo "❌ (permission denied?)"
            return 1
        fi
    fi
    return 1
}

# Check for Places API key
check_and_load_secret "PLACES_API_KEY" "PLACES_API_KEY" && ((LOADED_COUNT++))
check_and_load_secret "places-api-key" "PLACES_API_KEY" && ((LOADED_COUNT++))
check_and_load_secret "PLACES_API" "PLACES_API_KEY" && ((LOADED_COUNT++))

# Check for Maps API key
check_and_load_secret "NEXT_PUBLIC_MAPS_BROWSER_KEY" "NEXT_PUBLIC_MAPS_BROWSER_KEY" && ((LOADED_COUNT++))
check_and_load_secret "maps-browser-key" "NEXT_PUBLIC_MAPS_BROWSER_KEY" && ((LOADED_COUNT++))
check_and_load_secret "MAPS_BROWSER_KEY" "NEXT_PUBLIC_MAPS_BROWSER_KEY" && ((LOADED_COUNT++))
check_and_load_secret "maps-api-key" "NEXT_PUBLIC_MAPS_BROWSER_KEY" && ((LOADED_COUNT++))

# Also check all secrets for partial matches
while IFS= read -r secret; do
    # Skip if already processed (check if it's in the file)
    if grep -q "^PLACES_API_KEY=" "$ENV_FILE" && ([[ "$secret" == *"PLACES"* ]] || [[ "$secret" == *"places"* ]]); then
        continue
    fi
    if grep -q "^NEXT_PUBLIC_MAPS_BROWSER_KEY=" "$ENV_FILE" && ([[ "$secret" == *"MAPS"* ]] || [[ "$secret" == *"maps"* ]]); then
        continue
    fi
    
    # Try to infer
    if [[ "$secret" == *"PLACES"* ]] || [[ "$secret" == *"places"* ]]; then
        if ! grep -q "^PLACES_API_KEY=" "$ENV_FILE"; then
            echo -n "  Loading $secret → PLACES_API_KEY... "
            if secret_value=$(get_secret "$secret" 2>/dev/null); then
                echo "PLACES_API_KEY=$secret_value" >> "$ENV_FILE"
                echo "✅"
                LOADED_COUNT=$((LOADED_COUNT + 1))
            else
                echo "❌"
            fi
        fi
    elif [[ "$secret" == *"MAPS"* ]] || [[ "$secret" == *"maps"* ]]; then
        if ! grep -q "^NEXT_PUBLIC_MAPS_BROWSER_KEY=" "$ENV_FILE"; then
            echo -n "  Loading $secret → NEXT_PUBLIC_MAPS_BROWSER_KEY... "
            if secret_value=$(get_secret "$secret" 2>/dev/null); then
                echo "NEXT_PUBLIC_MAPS_BROWSER_KEY=$secret_value" >> "$ENV_FILE"
                echo "✅"
                LOADED_COUNT=$((LOADED_COUNT + 1))
            else
                echo "❌"
            fi
        fi
    fi
done <<< "$SECRETS"

echo ""
if [ $LOADED_COUNT -eq 0 ]; then
    echo "⚠️  No secrets were loaded."
    echo ""
    echo "Available secrets:"
    echo "$SECRETS" | while read -r secret; do
        echo "  - $secret"
    done
    echo ""
    echo "If your secrets have different names, you can manually edit .env.local"
    exit 1
else
    echo "✅ Successfully loaded $LOADED_COUNT secret(s) into $ENV_FILE"
    echo ""
    echo "📋 Contents of .env.local:"
    cat "$ENV_FILE" | grep -v "^#" | grep "=" | sed 's/=.*/=***HIDDEN***/'
    echo ""
    echo "⚠️  IMPORTANT: Restart your dev server for changes to take effect!"
    echo "   Run: npm run dev"
fi
