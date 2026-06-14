# Launch a local FORMCYCLE server with optional HTTPS via stunnel.
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

# Stunnel setup
$stunnelDir = Join-Path $repoRoot ".stunnel"
$httpsPort = 8443
$stunnelProcess = $null

if (-not $PlainHttp) {
  Write-Host "Setting up HTTPS via stunnel..."

  # Detect OS and download stunnel
  $isWindows = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
  $isLinux = [Environment]::OSVersion.Platform -eq [PlatformID]::Unix -and (Get-Variable -Name IsWindows -ErrorAction Ignore) -ne $true
  $isMac = (Get-Variable -Name IsMacOS -ErrorAction Ignore) -eq $true
  if (-not $isWindows -and -not $isLinux -and -not $isMac) {
    $platform = if ($isWindows) { "windows" } elseif ($isLinux) { "linux" } elseif ($isMac) { "mac" } else { "unknown" }
    Write-Host "  Detected OS: $platform"
  }

  # Ensure certs directory
  $certsDir = Join-Path $repoRoot ".certs"
  if (-not (Test-Path $certsDir)) { New-Item -ItemType Directory -Path $certsDir -Force | Out-Null }

  # Generate self-signed certificate if missing
  $pemPath = Join-Path $certsDir "stunnel.pem"
  if (-not (Test-Path $pemPath)) {
    Write-Host "  Generating self-signed certificate..."
    & "$PSScriptRoot\generate-selfsigned-cert.ps1" -Quiet
    $p12Path = Join-Path $certsDir "formcycle-dev.p12"
    if (Test-Path $p12Path) {
      # Convert PKCS12 to PEM for stunnel using keytool export
      $keytoolCmd = "keytool -exportcert -alias formcycle-dev -keystore `"$p12Path`" -storepass changeit -rfc -file `"$pemPath`" 2>nul && " +
        "keytool -importkeystore -srckeystore `"$p12Path`" -srcstorepass changeit -srcalias formcycle-dev -destkeystore `"$pemPath.tmp`" -deststorepass changeit -destkeypass changeit -deststoretype PKCS12 2>nul"
      cmd /c $keytoolCmd | Out-Null
    }
    if (-not (Test-Path $pemPath)) {
      # Fallback: create a simple PEM with OpenSSL or just use self-signed .NET
      Write-Host "  WARNING: Could not generate PEM certificate. HTTPS may not work."
    }
  }

  # Determine stunnel binary path
  $stunnelBin = if ($isWindows) { Join-Path $stunnelDir "stunnel.exe" } else { Join-Path $stunnelDir "stunnel" }

  # Download stunnel if not present
  if (-not (Test-Path $stunnelBin)) {
    Write-Host "  Downloading stunnel..."
    if (-not (Test-Path $stunnelDir)) { New-Item -ItemType Directory -Path $stunnelDir -Force | Out-Null }

    if ($isWindows) {
      $url = "https://www.stunnel.org/downloads/stunnel-5.74-win64.zip"
      $zipPath = Join-Path $stunnelDir "stunnel.zip"
      Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
      Expand-Archive -Path $zipPath -DestinationPath $stunnelDir -Force
      Remove-Item $zipPath
      # Find stunnel.exe in the extracted folder
      $exe = Get-ChildItem -Path $stunnelDir -Recurse -Filter "stunnel.exe" | Select-Object -First 1
      if ($exe) { Move-Item $exe.FullName $stunnelBin -Force }
    } elseif ($isLinux) {
      $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
      Invoke-WebRequest -Uri $url -OutFile $stunnelBin -UseBasicParsing
      # cloudflared can also do TLS tunnels
    }
  }

  # Create stunnel config
  $stunnelConfig = @"
foreground = yes
[https]
accept = $httpsPort
connect = $PortStart
cert = $pemPath
"@
  $configPath = Join-Path $stunnelDir "stunnel.conf"
  $stunnelConfig | Out-File -FilePath $configPath -Encoding ASCII

  # Start stunnel
  if (Test-Path $stunnelBin) {
    Write-Host "  Starting stunnel on https://localhost:$httpsPort -> http://localhost:$PortStart"
    if ($isWindows) {
      $stunnelProcess = Start-Process -FilePath $stunnelBin -ArgumentList $configPath -NoNewWindow -PassThru
    } else {
      $stunnelProcess = Start-Process -FilePath $stunnelBin -ArgumentList $configPath -PassThru
    }
  }
}

$cts = New-Object System.Threading.CancellationTokenSource
$urls = Build-UrlCandidates -PortStart $PortStart -PortEnd $PortEnd -Path $Path -UseHttps:$(-not $PlainHttp)

$notifyTask = [System.Threading.Tasks.Task]::Run([Action]{
  $handler = New-Object System.Net.Http.HttpClientHandler
  $handler.AllowAutoRedirect = $true
  $handler.ServerCertificateCustomValidationCallback = [System.Net.Security.RemoteCertificateValidationCallback]{
    param($sender, $certificate, $chain, $sslPolicyErrors) return $true
  }
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
  $mvnArgs = @("-P$Profile", $skipTestsArg, "fc-server:run-ms-war")
  & $mvnw $mvnArgs
  $exitCode = $LASTEXITCODE
} finally {
  $cts.Cancel()
  try { $notifyTask.Wait(1500) } catch {}
  Pop-Location
  if ($stunnelProcess -and -not $stunnelProcess.HasExited) { $stunnelProcess.Kill() }
}

exit $exitCode
