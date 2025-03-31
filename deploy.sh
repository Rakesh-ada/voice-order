#!/bin/bash

# Simple script to deploy to GitHub Pages

# Variables
BRANCH="gh-pages"
REPO_URL=$(git config --get remote.origin.url)

# Create a temporary directory
echo "Creating temporary build directory..."
mkdir -p build
cp -r index.html css js manifest.json service-worker.js public LICENSE build/

# Initialize Git in the build folder
echo "Initializing Git repository in build directory..."
cd build
git init
git add .
git commit -m "Deploy to GitHub Pages"

# Force push to the gh-pages branch
echo "Pushing to $BRANCH branch..."
git branch -M $BRANCH
git push -f $REPO_URL $BRANCH

# Cleanup
echo "Cleaning up..."
cd ..
rm -rf build

echo "Deployment complete! Your app should be available at:"
echo "https://$(git config --get remote.origin.url | sed -e 's/^git@github.com://' -e 's/.git$//' -e 's/.*github.com\///' | tr ':' '/'  | awk -F'/' '{print $1".github.io/"$2}')"
echo ""
echo "Note: It may take a few minutes for the changes to appear." 