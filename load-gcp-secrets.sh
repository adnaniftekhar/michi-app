#!/bin/bash

# Script to load GCP secrets into .env.local for local development

set -e

echo "🔐 Loading Google Cloud Secrets for Local Development"
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
echo "📋 Checking authentication..."
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)

if [ -z "$ACCOUNT" ]; then
    echo "⚠️  Not authenticated. Please run:"
    echo "   gcloud auth login"
    echo ""
    read -p "Would you like to authenticate now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud auth login
        ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
    else
        exit 1
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

# Check if Secret Manager API is enabled
echo "🔍 Checking Secret Manager API..."
if ! gcloud services list --enabled --filter="name:secretmanager.googleapis.com" --format="value(name)" 2>/dev/null | grep -q secretmanager; then
    echo "⚠️  Secret Manager API not enabled. Enabling now..."
    gcloud services enable secretmanager.googleapis.com --project=$PROJECT
    echo "✅ Secret Manager API enabled"
fi
echo ""

# List all secrets
echo "🔐 Available secrets in Secret Manager:"
echo ""
SECRETS=$(gcloud secrets list --project=$PROJECT --format="value(name)" 2>/dev/null)

if [ -z "$SECRETS" ]; then
    echo "❌ No secrets found in Secret Manager"
    echo ""
    echo "You may need to create secrets first, or they might be named differently."
    exit 1
fi

echo "$SECRETS" | while read -r secret; do
    echo "  - $secret"
done
echo ""

# Function to get secret value
get_secret() {
    local secret_name=$1
    gcloud secrets versions access latest --secret="$secret_name" --project=$PROJECT 2>/dev/null
}

# Map of secret names to env var names
declare -A SECRET_MAP
SECRET_MAP["PLACES_API_KEY"]="PLACES_API_KEY"
SECRET_MAP["places-api-key"]="PLACES_API_KEY"
SECRET_MAP["PLACES_API"]="PLACES_API_KEY"
SECRET_MAP["NEXT_PUBLIC_MAPS_BROWSER_KEY"]="NEXT_PUBLIC_MAPS_BROWSER_KEY"
SECRET_MAP["maps-browser-key"]="NEXT_PUBLIC_MAPS_BROWSER_KEY"
SECRET_MAP["MAPS_BROWSER_KEY"]="NEXT_PUBLIC_MAPS_BROWSER_KEY"
SECRET_MAP["maps-api-key"]="NEXT_PUBLIC_MAPS_BROWSER_KEY"

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

# Try to load each known secret
for secret_name in "${!SECRET_MAP[@]}"; do
    # Check if secret exists
    if echo "$SECRETS" | grep -q "^$secret_name$"; then
        env_var="${SECRET_MAP[$secret_name]}"
        echo -n "Loading $secret_name as $env_var... "
        
        if secret_value=$(get_secret "$secret_name" 2>/dev/null); then
            echo "$env_var=$secret_value" >> "$ENV_FILE"
            echo "✅"
            ((LOADED_COUNT++))
        else
            echo "❌ Failed to access"
        fi
    fi
done

# Also try direct matches
echo "$SECRETS" | while read -r secret; do
    # Skip if already processed
    if [[ ! " ${!SECRET_MAP[@]} " =~ " ${secret} " ]]; then
        # Try to infer env var name
        env_var=$(echo "$secret" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        
        # Check if it looks like an API key secret
        if [[ "$secret" == *"PLACES"* ]] || [[ "$secret" == *"places"* ]]; then
            if ! grep -q "PLACES_API_KEY" "$ENV_FILE"; then
                echo -n "Loading $secret as PLACES_API_KEY... "
                if secret_value=$(get_secret "$secret" 2>/dev/null); then
                    echo "PLACES_API_KEY=$secret_value" >> "$ENV_FILE"
                    echo "✅"
                    ((LOADED_COUNT++))
                else
                    echo "❌ Failed"
                fi
            fi
        elif [[ "$secret" == *"MAPS"* ]] || [[ "$secret" == *"maps"* ]]; then
            if ! grep -q "NEXT_PUBLIC_MAPS_BROWSER_KEY" "$ENV_FILE"; then
                echo -n "Loading $secret as NEXT_PUBLIC_MAPS_BROWSER_KEY... "
                if secret_value=$(get_secret "$secret" 2>/dev/null); then
                    echo "NEXT_PUBLIC_MAPS_BROWSER_KEY=$secret_value" >> "$ENV_FILE"
                    echo "✅"
                    ((LOADED_COUNT++))
                else
                    echo "❌ Failed"
                fi
            fi
        fi
    fi
done

echo ""
if [ $LOADED_COUNT -eq 0 ]; then
    echo "⚠️  No secrets were loaded."
    echo "   Check that:"
    echo "   1. Secrets exist in Secret Manager"
    echo "   2. You have permission to access them"
    echo "   3. Secret names match expected patterns"
    exit 1
else
    echo "✅ Loaded $LOADED_COUNT secret(s) into $ENV_FILE"
    echo ""
    echo "⚠️  IMPORTANT: Restart your dev server for changes to take effect!"
    echo "   Run: npm run dev"
fi
