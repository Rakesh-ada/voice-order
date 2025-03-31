# PowerShell script to deploy to GitHub Pages

# Variables
$BRANCH = "gh-pages"
$REPO_URL = git config --get remote.origin.url

# Create a temporary directory
Write-Host "Creating temporary build directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "build" -Force | Out-Null
Copy-Item -Path "index.html", "manifest.json", "service-worker.js", "LICENSE" -Destination "build\" -Force
Copy-Item -Path "css", "js", "public" -Destination "build\" -Recurse -Force

# Initialize Git in the build folder
Write-Host "Initializing Git repository in build directory..." -ForegroundColor Cyan
Set-Location -Path "build"
git init
git add .
git commit -m "Deploy to GitHub Pages"

# Force push to the gh-pages branch
Write-Host "Pushing to $BRANCH branch..." -ForegroundColor Cyan
git branch -M $BRANCH
git push -f $REPO_URL $BRANCH

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Cyan
Set-Location -Path ".."
Remove-Item -Path "build" -Recurse -Force

# Extract username and repo name from URL to construct GitHub Pages URL
$repoInfo = $REPO_URL -replace "^git@github\.com:", "" -replace "\.git$", "" -replace "https://github.com/", ""
$parts = $repoInfo -split '/'
$username = $parts[0]
$repoName = $parts[1]

Write-Host "Deployment complete! Your app should be available at:" -ForegroundColor Green
Write-Host "https://$username.github.io/$repoName" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: It may take a few minutes for the changes to appear." -ForegroundColor Cyan 