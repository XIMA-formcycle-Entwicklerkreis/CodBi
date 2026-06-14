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
  [switch]$PlainHttp = $false
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
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

if ($PlainHttp) {
  Write-Host "HTTP mode (plain HTTP, no HTTPS)"
} else {
  Write-Host "HTTPS mode enabled (fc-server-maven-plugin handles certificate automatically)"
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
    $mvnArgs += "-DhttpsPort=$PortStart"
  }
  $mvnArgs += "fc-server:run-ms-war"

  & $mvnw $mvnArgs
  $exitCode = $LASTEXITCODE
} finally {
  $cts.Cancel()
  try { $notifyTask.Wait(1500) } catch {}
  Pop-Location
}

exit $exitCode
