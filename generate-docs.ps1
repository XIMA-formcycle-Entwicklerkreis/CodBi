Push-Location "$PSScriptRoot\src\main\web"
try {
    Write-Host "[Docs] Running TypeDoc..."
    yarn workspace codbi-form docs
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[Docs] Done. Output: src\main\web\packages\form\docs\"
    } else {
        Write-Host "[Docs] TypeDoc failed (exit $LASTEXITCODE)."
        exit 1
    }
} finally {
    Pop-Location
}
