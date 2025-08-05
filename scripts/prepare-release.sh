#!/bin/bash

# Release preparation script for FLIP
# This script helps you prepare and create releases

set -e

echo "🚀 FLIP Release Preparation"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the project root."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Ask for new version
echo ""
echo "🏷️  What type of release is this?"
echo "   1) patch (bug fixes) - e.g., 1.0.0 → 1.0.1"
echo "   2) minor (new features) - e.g., 1.0.0 → 1.1.0"
echo "   3) major (breaking changes) - e.g., 1.0.0 → 2.0.0"
echo "   4) custom version"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        npm version patch --no-git-tag-version || echo "Version may already be set correctly"
        ;;
    2)
        npm version minor --no-git-tag-version || echo "Version may already be set correctly"
        ;;
    3)
        npm version major --no-git-tag-version || echo "Version may already be set correctly"
        ;;
    4)
        read -p "Enter new version (e.g., 1.2.3): " new_version
        npm version $new_version --no-git-tag-version || echo "Version may already be set correctly"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

NEW_VERSION=$(node -p "require('./package.json').version")
echo ""
echo "✅ Version updated: $CURRENT_VERSION → $NEW_VERSION"

# Ask for release notes
echo ""
echo "📝 Please describe what's new in this release:"
read -p "Release notes: " release_notes

# Commit changes
echo ""
echo "📝 Committing version bump..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create and push tag
echo "🏷️  Creating tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION: $release_notes"

echo ""
echo "🎉 Release prepared! Next steps:"
echo "   1. Push changes: git push origin main"
echo "   2. Push tag: git push origin v$NEW_VERSION"
echo "   3. This will trigger GitHub Actions to build and release automatically"
echo ""
echo "Or run both at once:"
echo "   git push origin main && git push origin v$NEW_VERSION"
