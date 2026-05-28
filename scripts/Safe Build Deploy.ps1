$probePorts = @(8080, 8081, 8082, 8083, 8084, 8085, 8090, 9090)
$fcDeployUrl = $null
foreach ($port in $probePorts) {
    try {
        Invoke-WebRequest -Uri "http://localhost:$port/xima-formcycle/" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null
        $fcDeployUrl = "http://localhost:$port/xima-formcycle"
        Write-Host "[Safe Build Deploy] Detected FC server on port $port."
        break
    } catch { }
}
if ($null -eq $fcDeployUrl) {
    Write-Host "[Safe Build Deploy] Could not detect FC server on ports $($probePorts -join ', '). Is it running?"
    exit 1
}

$maxRetries = 3
$retryDelay = 5 # seconds
$attempt = 0
$success = $false

while (-not $success -and $attempt -lt $maxRetries) {
    $attempt++
    Write-Host "[Safe Build Deploy] Deploy attempt $attempt..."
    & .\mvnw.cmd -Pdev -DskipTests=true "-DfcDeployUrl=$fcDeployUrl" fc-deploy:deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[Safe Build Deploy] Deploy succeeded."
        $success = $true
        # Play success sound
        (New-Object Media.SoundPlayer "C:\Windows\Media\Alarm01.wav").PlaySync()
    } else {
        Write-Host "[Safe Build Deploy] Deploy failed. Retrying in $retryDelay seconds..."
        # Play failure sound
        (New-Object Media.SoundPlayer "C:\Windows\Media\Windows Background.wav").PlaySync()
        Start-Sleep -Seconds $retryDelay
    }
}

if (-not $success) {
    Write-Host "[Safe Build Deploy] Deploy failed after $maxRetries attempts."
    exit 1
}
