# Launch a local FORMCYCLE server and play a sound once it becomes reachable.
# Usage (PowerShell):
#   .\scripts\launch-server.ps1
#   .\scripts\launch-server.ps1 -PlainHttp
#   .\scripts\launch-server.ps1 -PlainHttp -PortStart 8080 -PortEnd 8090

[CmdletBinding()]
param(
  [int]$PortStart = 8080,
  [int]$PortEnd   = 8090,
  [string]$Path   = "/xima-formcycle",
  [string]$Profile = "dev",
  [switch]$SkipTests = $true,
  [switch]$PlainHttp = $false
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

function Resolve-Mvnw {
  $mvnwCmd = Join-Path $repoRoot "mvnw.cmd"
  if (Test-Path $mvnwCmd) { return $mvnwCmd }
  $mvnw = Join-Path $repoRoot "mvnw"
  if (Test-Path $mvnw) { return $mvnw }
  throw "Could not find mvnw.cmd or mvnw in repo root: $repoRoot"
}

function Build-UrlCandidates {
  param([int]$PortStart, [int]$PortEnd, [string]$Path, [switch]$UseHttps)
  $ports = $PortStart..$PortEnd
  $scheme = if ($UseHttps) { "https" } else { "http" }
  return $ports | ForEach-Object { "${scheme}://localhost:$($_)$Path" }
}

$mvnw = Resolve-Mvnw
$httpsPort = 8443
$stunnelProcess = $null

if (-not $PlainHttp) {
  Write-Host "HTTPS mode: stunnel will wrap HTTP with TLS"
  $certsDir = Join-Path $repoRoot ".certs"
  if (-not (Test-Path $certsDir)) { New-Item -ItemType Directory -Path $certsDir -Force | Out-Null }

  # Generate self-signed PKCS12 keystore if missing
  $p12Path = Join-Path $certsDir "formcycle-dev.p12"
  if (-not (Test-Path $p12Path)) {
    Write-Host "  Generating self-signed certificate..."
    & "$PSScriptRoot\generate-selfsigned-cert.ps1" -Quiet
  }

  # Generate PEM for stunnel (cert + private key combined) using keytool + PowerShell
  $pemPath = Join-Path $certsDir "stunnel.pem"
  if (-not (Test-Path $pemPath) -and (Test-Path $p12Path)) {
    Write-Host "  Converting certificate for stunnel..."
    # Use .NET to export cert and key from PKCS12
    $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($p12Path, "changeit", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)
    $exportBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert, "changeit")
    $certWithKey = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($exportBytes, "changeit", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)
    $pkcs12Export = $certWithKey.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pkcs12, "changeit")
    [System.IO.File]::WriteAllBytes($pemPath, $pkcs12Export)
    Write-Host "  Certificate ready: $pemPath"
  }

  # Ensure stunnel directory
  $stunnelDir = Join-Path $repoRoot ".stunnel"
  if (-not (Test-Path $stunnelDir)) { New-Item -ItemType Directory -Path $stunnelDir -Force | Out-Null }
  $stunnelBin = Join-Path $stunnelDir "stunnel.exe"

  # Download stunnel for Windows if not present
  if (-not (Test-Path $stunnelBin)) {
    Write-Host "  Downloading stunnel for Windows..."
    $url = "https://www.stunnel.org/downloads/stunnel-5.74-win64-installer.exe"
    $installerPath = Join-Path $stunnelDir "stunnel-installer.exe"
    try {
      Invoke-WebRequest -Uri $url -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
      Start-Process -FilePath $installerPath -ArgumentList "/S /D=$stunnelDir" -NoNewWindow -Wait
      $exe = Get-ChildItem -Path $stunnelDir -Recurse -Filter "stunnel.exe" | Select-Object -First 1
      if ($exe) { Copy-Item $exe.FullName $stunnelBin -Force }
      Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    } catch {
      Write-Host "  WARNING: Could not download stunnel automatically."
      Write-Host "  Install manually from: https://www.stunnel.org/"
      Write-Host "  Falling back to plain HTTP."
      $PlainHttp = $true
    }
  }

  # Start stunnel if binary exists
  if (Test-Path $stunnelBin) {
    $configContent = @"
foreground = yes
[https]
accept = $httpsPort
connect = $PortStart
cert = $pemPath
"@
    $configPath = Join-Path $stunnelDir "stunnel.conf"
    $configContent | Out-File -FilePath $configPath -Encoding ASCII -Force

    Write-Host "  Starting stunnel: https://localhost:$httpsPort -> http://localhost:$PortStart"
    $stunnelProcess = Start-Process -FilePath $stunnelBin -ArgumentList $configPath -NoNewWindow -PassThru
  }
}

$cts = New-Object System.Threading.CancellationTokenSource
$urls = Build-UrlCandidates -PortStart $PortStart -PortEnd $PortEnd -Path $Path -UseHttps:$(-not $PlainHttp)

$notifyTask = [System.Threading.Tasks.Task]::Run([Action]{
  $handler = New-Object System.Net.Http.HttpClientHandler
  $handler.AllowAutoRedirect = $true
  $handler.ServerCertificateCustomValidationCallback = [System.Net.Security.RemoteCertificateValidationCallback]{ param($a,$b,$c,$d) $true }
  $client = New-Object System.Net.Http.HttpClient($handler)
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
        } catch { } finally { if($null -ne $resp) { $resp.Dispose() } }
      }
      Start-Sleep -Milliseconds 500
    }
  } finally { $client.Dispose() }
}, $cts.Token)

$exitCode = 0
try {
  Push-Location $repoRoot
  $skipTestsArg = if($SkipTests) { "-DskipTests=true" } else { "-DskipTests=false" }
  & $mvnw "-P$Profile" $skipTestsArg "fc-server:run-ms-war"
  $exitCode = $LASTEXITCODE
} finally {
  $cts.Cancel()
  try { $notifyTask.Wait(1500) } catch {}
  Pop-Location
  if ($stunnelProcess -and -not $stunnelProcess.HasExited) { $stunnelProcess.Kill() }
}

exit $exitCode
