#!/bin/bash

# Deploy Firestore indexes
# This script deploys the Firestore indexes defined in firestore.indexes.json

echo "🔥 Deploying Firestore indexes..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

# Deploy indexes
echo "📋 Deploying Firestore indexes from firestore.indexes.json..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firestore indexes deployed successfully!"
    echo "📝 Note: Index creation may take a few minutes to complete."
    echo "🔗 You can monitor progress at: https://console.firebase.google.com/project/bgmi-form/firestore/indexes"
else
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi