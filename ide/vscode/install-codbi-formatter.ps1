# Install CodBi Formatter Extension
# This script installs the extension to your VS Code extensions directory

$extensionSource = Join-Path $PSScriptRoot ".vscode\extensions\codbi-formatter"
$extensionDest = Join-Path $env:USERPROFILE ".vscode\extensions\codbi-formatter"

if (-not (Test-Path $extensionSource)) {
    Write-Host "Error: Extension source not found at $extensionSource" -ForegroundColor Red
    exit 1
}

# Remove existing installation if it exists
if (Test-Path $extensionDest) {
    Write-Host "Removing existing installation..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $extensionDest
}

# Copy extension
Write-Host "Installing CodBi Formatter extension..." -ForegroundColor Green
Copy-Item -Recurse -Force $extensionSource $extensionDest

Write-Host "Extension installed successfully!" -ForegroundColor Green
Write-Host "Please reload VS Code for the extension to take effect." -ForegroundColor Yellow
