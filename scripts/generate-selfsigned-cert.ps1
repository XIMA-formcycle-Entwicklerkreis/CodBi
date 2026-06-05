<#
.SYNOPSIS
  Generates a self-signed PKCS12 keystore for local HTTPS development.
.DESCRIPTION
  Creates a self-signed certificate in the repository root's .certs/ directory.
  The keystore is used by launch-server.ps1 to start the formcycle dev server over HTTPS.
  The certificate has SAN (Subject Alternative Name) entries for localhost, 127.0.0.1,
  and ::1 so that modern browsers accept it (after manually confirming the security warning).
.PARAMETER KeystoreDir
  Directory where the keystore file is placed (default: repo-root/.certs).
.PARAMETER KeystoreFile
  Filename for the generated keystore (default: formcycle-dev.p12).
.PARAMETER StorePassword
  Password for the keystore and private key (default: changeit).
.PARAMETER ValidityDays
  Number of days the certificate remains valid (default: 3650).
.PARAMETER Quiet
  Suppress informational messages.
.EXAMPLE
  PS> .\scripts\generate-selfsigned-cert.ps1
  Creates .certs/formcycle-dev.p12 with a 10-year self-signed certificate.
#>

[CmdletBinding()]
param(
  [string]$KeystoreDir,
  [string]$KeystoreFile   = "formcycle-dev.p12",
  [string]$StorePassword  = "changeit",
  [int]   $ValidityDays   = 3650,
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"

# Resolve repository root
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

# Default keystore directory relative to repo root
if (-not $KeystoreDir) {
  $KeystoreDir = Join-Path $repoRoot ".certs"
}

# Ensure target directory exists
if (-not (Test-Path $KeystoreDir)) {
  New-Item -ItemType Directory -Path $KeystoreDir -Force | Out-Null
}

$keystorePath = Join-Path $KeystoreDir $KeystoreFile

# Remove old keystore if it exists
if (Test-Path $keystorePath) {
  if (-not $Quiet) { Write-Host "Removing existing keystore: $keystorePath" }
  Remove-Item -Path $keystorePath -Force
}

$dname = "CN=Formcycle Dev Server, OU=Development, O=Local, L=Local, ST=Bavaria, C=DE"

if (-not $Quiet) {
  Write-Host "Generating self-signed certificate..."
  Write-Host "  Keystore: $keystorePath"
  Write-Host "  Password: $StorePassword"
  Write-Host "  Validity: $ValidityDays days"
}

# Build SAN extension string
# Critical for browser acceptance: Subject Alternative Name
$san = "san=dns:localhost,ip:127.0.0.1,ip:::1"

# keytool writes informational messages to stderr, which PowerShell wraps as
# ErrorRecord objects. We use cmd.exe to invoke keytool to avoid this.
$keytoolCmd = "keytool -genkeypair -alias formcycle-dev -keyalg RSA -keysize 2048 -storetype PKCS12 " +
  "-keystore `"$keystorePath`" -storepass $StorePassword -keypass $StorePassword " +
  "-dname `"$dname`" -validity $ValidityDays -ext `"$san`""

$process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $keytoolCmd" -NoNewWindow -Wait -PassThru

if ($process.ExitCode -ne 0) {
  throw "keytool exited with code $($process.ExitCode)"
}

if (-not $Quiet) {
  Write-Host ""
  Write-Host "Certificate generated successfully!"
  Write-Host "  Location: $keystorePath"
  Write-Host ""
  Write-Host "To start the dev server with HTTPS, use:"
  Write-Host "  .\scripts\launch-server.ps1 -UseHttps"
  Write-Host ""
  Write-Host "Or pass a custom port:"
  Write-Host "  .\scripts\launch-server.ps1 -UseHttps -PortStart 8443 -PortEnd 8453"
  Write-Host ""
  Write-Host "IMPORTANT: When you first open https://localhost:<port> in your browser,"
  Write-Host "you will see a security warning. This is expected for self-signed certificates."
  Write-Host "Proceed to the site (in Chrome: click 'Advanced' → 'Proceed to localhost')."
  Write-Host "The microphone API will then work."
}
