# Launch a local FORMCYCLE server and play a sound once it becomes reachable.
# Usage (PowerShell):
#   .\scripts\launch-server.ps1
#   .\scripts\launch-server.ps1 -PortStart 8443 -PortEnd 8453 -Profile dev -SkipTests
#   .\scripts\launch-server.ps1 -PlainHttp
#   .\scripts\launch-server.ps1 -PlainHttp -PortStart 8080 -PortEnd 8090

[CmdletBinding()]
param(
  [int]$PortStart = 8443,
  [int]$PortEnd   = 8453,
  [string]$Path   = "/xima-formcycle",
  [string]$Profile = "dev",
  [switch]$SkipTests = $true,
  [switch]$PlainHttp = $false,
  [string]$KeystoreDir,
  [string]$KeystoreFile = "formcycle-dev.p12",
  [string]$StorePassword = "changeit"
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Ensure-Keystore {
  param([string]$KeystorePath, [string]$StorePassword)
  if (Test-Path $KeystorePath) { return }
  Write-Host "Auto-generating self-signed certificate..."
  Write-Host "  Keystore: $KeystorePath"
  $dir = Split-Path $KeystorePath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $dname = "CN=Formcycle Dev Server, OU=Development, O=Local, L=Local, ST=Bavaria, C=DE"
  $san = "san=dns:localhost,ip:127.0.0.1,ip:::1"
  $keytoolCmd = "keytool -genkeypair -alias formcycle-dev -keyalg RSA -keysize 2048 -storetype PKCS12 " +
    "-keystore `"$KeystorePath`" -storepass $StorePassword -keypass $StorePassword " +
    "-dname `"$dname`" -validity 3650 -ext `"$san`""
  $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $keytoolCmd" -NoNewWindow -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "keytool exited with code $($process.ExitCode)" }
  Write-Host "Certificate generated successfully."
}

function Resolve-Mvnw {
  param([string]$RepoRoot)
  $mvnwCmd = Join-Path $RepoRoot "mvnw.cmd"
  if (Test-Path $mvnwCmd) { return $mvnwCmd }
  $mvnw = Join-Path $RepoRoot "mvnw"
  if (Test-Path $mvnw) { return $mvnw }
  throw "Could not find mvnw.cmd or mvnw in repo root: $RepoRoot"
}

function Build-UrlCandidates {
  param([int]$PortStart, [int]$PortEnd, [string]$Path, [switch]$UseHttps)
  $ports = $PortStart..$PortEnd
  $scheme = if ($UseHttps) { "https" } else { "http" }
  return $ports | ForEach-Object { "${scheme}://localhost:$($_)$Path" }
}

$repoRoot = Resolve-RepoRoot
$mvnw     = Resolve-Mvnw -RepoRoot $repoRoot

# --- HTTPS setup ---
if (-not $PlainHttp) {
  if (-not $KeystoreDir) { $KeystoreDir = Join-Path $repoRoot ".certs" }
  $keystorePath = Join-Path $KeystoreDir $KeystoreFile
  Ensure-Keystore -KeystorePath $keystorePath -StorePassword $StorePassword

  Write-Host "HTTPS mode enabled"
  Write-Host "  Keystore: $keystorePath"

  # Set Spring Boot SSL environment variables so the fc-server-maven-plugin
  # (which runs an embedded Spring Boot / Tomcat) picks them up.
  $env:SERVER_SSL_KEY_STORE          = $keystorePath
  $env:SERVER_SSL_KEY_STORE_PASSWORD = $StorePassword
  $env:SERVER_SSL_KEY_STORE_TYPE     = "PKCS12"
  $env:SERVER_SSL_KEY_ALIAS          = "formcycle-dev"
  $env:SERVER_SSL_ENABLED            = "true"

  Write-Host "  Server will start on one of the candidate HTTPS URLs below."
} else {
  # Clear any lingering SSL env vars from a previous HTTPS session
  Remove-Item Env:\SERVER_SSL_* -ErrorAction SilentlyContinue
}

$cts      = New-Object System.Threading.CancellationTokenSource
$urls     = Build-UrlCandidates -PortStart $PortStart -PortEnd $PortEnd -Path $Path -UseHttps:$(-not $PlainHttp)

$notifyTask = [System.Threading.Tasks.Task]::Run([Action]{
  $handler = New-Object System.Net.Http.HttpClientHandler
  $handler.AllowAutoRedirect = $true
  # Accept self-signed certificates for local development
  $handler.ServerCertificateCustomValidationCallback = [System.Net.Security.RemoteCertificateValidationCallback]{
    param($sender, $certificate, $chain, $sslPolicyErrors) return $true
  }
  $client  = New-Object System.Net.Http.HttpClient($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(1)

  try {
    while(-not $cts.IsCancellationRequested) {
      foreach($url in $urls) {
        if($cts.IsCancellationRequested) { break }
        $resp = $null
        try {
          $resp = $client.GetAsync($url, $cts.Token).GetAwaiter().GetResult()
          if($null -ne $resp -and [int]$resp.StatusCode -ne 404) {
            [Console]::WriteLine("")
            [Console]::WriteLine("============================================================")
            [Console]::WriteLine("FORMCYCLE server started: $url")
            [Console]::WriteLine("============================================================")
            try { [Console]::Write([char]7) } catch {}
            try { [System.Media.SystemSounds]::Asterisk.Play() } catch { try { [Console]::Beep(800, 250) } catch {} }
            return
          }
        } catch {
          # ignore and keep polling
        } finally {
          if($null -ne $resp) { $resp.Dispose() }
        }
      }
      Start-Sleep -Milliseconds 500
    }
  } finally {
    $client.Dispose()
  }
}, $cts.Token)

$exitCode = 0
try {
  Push-Location $repoRoot
  $skipTestsArg = if($SkipTests) { "-DskipTests=true" } else { "-DskipTests=false" }

  # Determine Maven arguments
  $mvnArgs = @("-P$Profile", $skipTestsArg)
  if (-not $PlainHttp) {
    # The fc-server-maven-plugin uses an embedded Spring Boot server.
    # Pass the server.port as a JVM property so the server listens on the
    # first available port from the range.
    $mvnArgs += "-Dserver.port=$PortStart"
  }
  $mvnArgs += "fc-server:run-ms-war"

  & $mvnw $mvnArgs
  $exitCode = $LASTEXITCODE
} finally {
  $cts.Cancel()
  try { $notifyTask.Wait(1500) } catch {}
  Pop-Location
  # Clean up SSL env vars
  if (-not $PlainHttp) {
    Remove-Item Env:\SERVER_SSL_* -ErrorAction SilentlyContinue
  }
}

exit $exitCode

