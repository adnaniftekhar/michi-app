#!/bin/bash

# Script to check GCP secrets and configure local environment

echo "🔍 Checking Google Cloud Platform configuration..."
echo ""

# Add gcloud to PATH
export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud command not found. Please install Google Cloud SDK first."
    exit 1
fi

# Check authentication
echo "📋 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "⚠️  Not authenticated. Please run:"
    echo "   gcloud auth login"
    echo ""
    echo "This will open your browser to sign in."
    exit 1
fi

ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
echo "✅ Authenticated as: $ACCOUNT"
echo ""

# Check project
PROJECT=$(gcloud config get-value project 2>/dev/null)
echo "📁 Project: $PROJECT"
echo ""

# List available secrets
echo "🔐 Checking Secret Manager secrets..."
echo ""

SECRETS=$(gcloud secrets list --project=$PROJECT --format="table(name)" 2>&1)

if echo "$SECRETS" | grep -q "ERROR"; then
    echo "❌ Error accessing secrets. You may need:"
    echo "   1. Secret Manager API enabled"
    echo "   2. Proper IAM permissions"
    echo ""
    echo "Error: $SECRETS"
    exit 1
fi

echo "$SECRETS"
echo ""

# Check for common secret names
echo "🔍 Looking for API key secrets..."
echo ""

check_secret() {
    local secret_name=$1
    echo -n "Checking $secret_name... "
    
    if gcloud secrets describe "$secret_name" --project=$PROJECT &>/dev/null; then
        echo "✅ Found"
        
        # Try to get the latest version (without showing the value)
        VERSION=$(gcloud secrets versions list "$secret_name" --project=$PROJECT --format="value(name)" --limit=1 2>/dev/null | head -1)
        if [ -n "$VERSION" ]; then
            echo "   Latest version: $VERSION"
        fi
        return 0
    else
        echo "❌ Not found"
        return 1
    fi
}

# Check common secret names
FOUND_SECRETS=()

if check_secret "PLACES_API_KEY"; then
    FOUND_SECRETS+=("PLACES_API_KEY")
fi

if check_secret "NEXT_PUBLIC_MAPS_BROWSER_KEY"; then
    FOUND_SECRETS+=("NEXT_PUBLIC_MAPS_BROWSER_KEY")
fi

if check_secret "MAPS_BROWSER_KEY"; then
    FOUND_SECRETS+=("MAPS_BROWSER_KEY")
fi

if check_secret "places-api-key"; then
    FOUND_SECRETS+=("places-api-key")
fi

if check_secret "maps-browser-key"; then
    FOUND_SECRETS+=("maps-browser-key")
fi

echo ""
echo "📝 Found ${#FOUND_SECRETS[@]} relevant secret(s)"
echo ""

if [ ${#FOUND_SECRETS[@]} -eq 0 ]; then
    echo "⚠️  No API key secrets found in Secret Manager."
    echo "   You may need to create them or use a different method."
    exit 0
fi

# Offer to create .env.local from secrets
echo "💡 Would you like to create .env.local from these secrets? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Creating .env.local from GCP secrets..."
    
    # Create .env.local
    cat > .env.local << EOF
# Auto-generated from GCP Secret Manager
# Generated on: $(date)

EOF

    for secret in "${FOUND_SECRETS[@]}"; do
        echo -n "Fetching $secret... "
        VALUE=$(gcloud secrets versions access latest --secret="$secret" --project=$PROJECT 2>&1)
        
        if [ $? -eq 0 ]; then
            # Determine env var name
            if [[ "$secret" == *"PLACES"* ]] || [[ "$secret" == *"places"* ]]; then
                ENV_VAR="PLACES_API_KEY"
            elif [[ "$secret" == *"MAPS"* ]] || [[ "$secret" == *"maps"* ]]; then
                if [[ "$secret" == *"NEXT_PUBLIC"* ]] || [[ "$secret" == *"BROWSER"* ]]; then
                    ENV_VAR="NEXT_PUBLIC_MAPS_BROWSER_KEY"
                else
                    ENV_VAR="MAPS_BROWSER_KEY"
                fi
            else
                ENV_VAR=$(echo "$secret" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
            fi
            
            echo "$ENV_VAR=$VALUE" >> .env.local
            echo "✅ Added as $ENV_VAR"
        else
            echo "❌ Failed: $VALUE"
        fi
    done
    
    echo ""
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Restart your dev server for changes to take effect!"
    echo "   Run: npm run dev"
else
    echo "Skipped creating .env.local"
fi
