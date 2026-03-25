Push-Location "$PSScriptRoot\src\main\web"
try {
    Write-Host "[Docs] Running TypeDoc..."
    yarn workspace codbi-form docs
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[Docs] Done. Output: src\main\web\packages\form\docs\"
        
        # Generate a proper 404.html for Cloudflare Pages to prevent broken SPA fallbacks
        $indexPath = "packages\form\docs\index.html"
        $404Path = "packages\form\docs\404.html"
        if (Test-Path $indexPath) {
            (Get-Content $indexPath) -replace 'href="assets/', 'href="/assets/' -replace 'src="assets/', 'src="/assets/' | Set-Content $404Path
            Write-Host "[Docs] Generated 404.html for proper Cloudflare routing."
        }
    } else {
        Write-Host "[Docs] TypeDoc failed (exit $LASTEXITCODE)."
        exit 1
    }
} finally {
    Pop-Location
}
