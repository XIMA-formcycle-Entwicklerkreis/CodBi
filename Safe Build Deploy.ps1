$maxRetries = 3
$retryDelay = 5 # seconds
$attempt = 0
$success = $false

while (-not $success -and $attempt -lt $maxRetries) {
    $attempt++
    Write-Host "[Safe Build Deploy] Deploy attempt $attempt..."
    & .\mvnw.cmd -Pdev -DskipTests=true -DfcDeployUrl=http://localhost:8080/xima-formcycle -DfcDeployToken=admin fc-deploy:deploy
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
