#!/bin/bash
# Quick script to authenticate and load secrets

export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"

echo "🔐 Authenticating with Google Cloud..."
echo ""

# Check if already authenticated
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)

if [ -z "$ACCOUNT" ]; then
    echo "Opening browser for authentication..."
    gcloud auth login
    echo ""
fi

ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)

if [ -n "$ACCOUNT" ]; then
    echo "✅ Authenticated as: $ACCOUNT"
    echo ""
    echo "📥 Loading secrets..."
    ./check-and-load-secrets.sh
else
    echo "❌ Authentication failed"
    exit 1
fi
