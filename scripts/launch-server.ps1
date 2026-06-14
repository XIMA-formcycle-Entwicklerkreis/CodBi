# Launch a local FORMCYCLE server and play a sound once it becomes reachable.
# Usage (PowerShell):
#   .\scripts\launch-server.ps1
#   .\scripts\launch-server.ps1 -PortStart 8080 -PortEnd 8090 -Profile dev -SkipTests
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

function Start-TlsProxy {
  param([int]$ListenPort, [int]$BackendPort, [string]$CertThumbprint)
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("https://+:$ListenPort/")
  $listener.Start()
  Write-Host "TLS proxy listening on https://localhost:$ListenPort -> http://localhost:$BackendPort"
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $job = Start-Job -ScriptBlock {
      param($ctx, $backendPort, $certThumbprint)
      try {
        $request = $ctx.Request
        $url = "http://localhost:$backendPort$($request.RawUrl)"
        $webRequest = [System.Net.WebRequest]::Create($url)
        $webRequest.Method = $request.HttpMethod
        $webRequest.ContentType = $request.ContentType
        if ($request.InputStream.Length -gt 0) {
          $stream = $webRequest.GetRequestStream()
          $request.InputStream.CopyTo($stream)
          $stream.Close()
        }
        $backendResponse = $webRequest.GetResponse()
        $response = $ctx.Response
        $response.StatusCode = [int]$backendResponse.StatusCode
        $response.ContentType = $backendResponse.ContentType
        $backendResponse.GetResponseStream().CopyTo($response.OutputStream)
        $response.Close()
        $backendResponse.Close()
      } catch {
        try { $ctx.Response.StatusCode = 502; $ctx.Response.Close() } catch {}
      }
    } -ArgumentList $context, $BackendPort
  }
}

$repoRoot = Resolve-RepoRoot
$mvnw     = Resolve-Mvnw -RepoRoot $repoRoot

# Determine ports
$httpPort = $PortStart
$httpsPort = 8443

if (-not $PlainHttp) {
  # Check for admin rights (required for netsh cert binding)
  $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $isAdmin) {
    Write-Host "WARNING: HTTPS mode requires Administrator privileges for certificate setup."
    Write-Host "Falling back to plain HTTP. Run PowerShell as Administrator to use HTTPS."
    Write-Host ""
    $PlainHttp = $true
  }
}

$cts = New-Object System.Threading.CancellationTokenSource
$urls = Build-UrlCandidates -PortStart $PortStart -PortEnd $PortEnd -Path $Path -UseHttps:$(-not $PlainHttp)

if (-not $PlainHttp) {
  # Generate self-signed certificate and bind to port
  $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(10)
  $thumbprint = $cert.Thumbprint
  $appId = [Guid]::NewGuid().ToString("D")
  netsh http delete sslcert ipport=0.0.0.0:$httpsPort 2>$null
  netsh http add sslcert ipport=0.0.0.0:$httpsPort certhash=$thumbprint appid="{$appId}"
  Write-Host "HTTPS enabled: https://localhost:$httpsPort$Path -> http://localhost:$httpPort$Path"
}

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
  $mvnArgs = @("-P$Profile", $skipTestsArg, "fc-server:run-ms-war")
  & $mvnw $mvnArgs
  $exitCode = $LASTEXITCODE
} finally {
  $cts.Cancel()
  try { $notifyTask.Wait(1500) } catch {}
  Pop-Location
  if (-not $PlainHttp) {
    netsh http delete sslcert ipport=0.0.0.0:$httpsPort 2>$null
  }
}

exit $exitCode
