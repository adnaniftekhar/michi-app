#!/bin/bash

# Setup script for Google Cloud authentication
# This script helps set up Google Cloud credentials for local development

echo "🔧 Setting up Google Cloud authentication for Michi app..."
echo ""

# Add gcloud to PATH if not already there
if ! command -v gcloud &> /dev/null; then
    export PATH="/opt/homebrew/share/google-cloud-sdk/bin:$PATH"
fi

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud command not found."
    echo "Please install Google Cloud SDK first:"
    echo "  brew install --cask google-cloud-sdk"
    exit 1
fi

echo "✅ Google Cloud SDK found"
echo ""

# Set the project
echo "📋 Setting project to 'worldschool-mvp'..."
gcloud config set project worldschool-mvp
echo ""

# Check if already authenticated
if [ -f ~/.config/gcloud/application_default_credentials.json ]; then
    echo "✅ Application Default Credentials already exist"
    echo "Testing authentication..."
    if gcloud auth application-default print-access-token &> /dev/null; then
        echo "✅ Authentication is working!"
        echo ""
        echo "You can now restart your dev server with:"
        echo "  npm run dev"
        exit 0
    else
        echo "⚠️  Credentials exist but may be expired. Re-authenticating..."
    fi
fi

# Authenticate
echo "🔐 Starting authentication process..."
echo "This will open your browser for Google sign-in."
echo ""
gcloud auth application-default login

# Verify authentication
if [ -f ~/.config/gcloud/application_default_credentials.json ]; then
    echo ""
    echo "✅ Authentication successful!"
    echo ""
    echo "You can now restart your dev server with:"
    echo "  npm run dev"
else
    echo ""
    echo "❌ Authentication failed. Please try again."
    exit 1
fi
