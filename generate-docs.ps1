# ─── CodBi Full Documentation Generator ──────────────────────────────────────
# Generates TypeDoc documentation for all TypeScript packages (form, common, designer)
# and Dokka documentation for the Kotlin logic layer.
# Each section is generated in English, then translated to German and Italian.
# Output is placed both in each package's local docs/ folder AND mirrored into root/docs/.
#
# Final structure:
#   root/docs/
#     index.html            ← landing page
#     form/                 ← form EN docs
#     form/de/              ← form DE docs
#     form/it/              ← form IT docs
#     common/               ← common EN docs
#     common/de/ common/it/
#     designer/             ← designer EN docs
#     designer/de/ designer/it/
#     logic/                ← Kotlin logic EN docs (Dokka)
#     logic/de/ logic/it/
# ──────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Continue"
$rootDir = $PSScriptRoot
$webDir = "$rootDir\src\main\web"
$docsRoot = "$rootDir\docs"
$scriptsDir = "$rootDir\scripts"

# Clean the docs root (preserve .nojekyll) — use cmd /c rd for MAX_PATH safety
if (Test-Path $docsRoot) {
    Get-ChildItem $docsRoot -Force | Where-Object { $_.Name -ne '.nojekyll' } | ForEach-Object {
        if ($_.PSIsContainer) { cmd /c "rd /s /q `"$($_.FullName)`"" 2>$null }
        else { Remove-Item -Force $_.FullName -ErrorAction SilentlyContinue }
    }
    Write-Host "[Docs] Cleaned docs/ directory" -ForegroundColor Yellow
}

$languages = @(
    @{ code = "de"; name = "German" },
    @{ code = "it"; name = "Italian" }
)

# TypeScript packages: name, yarn workspace name, relative path from web dir, source subdir
$tsPackages = @(
    @{ name = "form";     workspace = "codbi-form";     relPath = "packages\form";     srcSub = "src/js" },
    @{ name = "common";   workspace = "codbi-common";   relPath = "packages\common";   srcSub = "src/js" },
    @{ name = "designer"; workspace = "codbi-designer"; relPath = "packages\designer"; srcSub = "src/js" }
)

# ─── Helper: Generate TypeDoc for a package ───────────────────────────────────
function Invoke-TypeDoc {
    param(
        [string]$PackageName,
        [string]$WorkspaceName,
        [string]$PkgAbsPath,
        [string]$ConfigFile
    )
    Push-Location $PkgAbsPath
    try {
        if ($ConfigFile) {
            yarn typedoc --options $ConfigFile
        } else {
            yarn typedoc
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[Docs]   ✗ TypeDoc failed for $PackageName" -ForegroundColor Red
            return $false
        }
        Write-Host "[Docs]   ✓ TypeDoc succeeded for $PackageName" -ForegroundColor Green
        return $true
    } finally {
        Pop-Location
    }
}

# ─── Helper: Copy docs into root/docs/<section> ──────────────────────────────
function Copy-DocsToRoot {
    param(
        [string]$SourceDocsPath,
        [string]$SectionName,
        [string]$LangSubfolder  # empty string for EN root
    )
    $targetPath = if ($LangSubfolder) { "$docsRoot\$SectionName\$LangSubfolder" } else { "$docsRoot\$SectionName" }
    if (Test-Path $targetPath) {
        cmd /c "rd /s /q `"$targetPath`"" 2>$null
    }
    if (Test-Path $SourceDocsPath) {
        # Use robocopy to handle Windows MAX_PATH (260 char) limits on deep Dokka paths
        robocopy $SourceDocsPath $targetPath /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
        Write-Host "[Docs]   → Copied to docs/$SectionName$(if ($LangSubfolder) { "/$LangSubfolder" })"
    } else {
        Write-Host "[Docs]   ⚠ Source not found: $SourceDocsPath" -ForegroundColor Yellow
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# Phase 1: TypeScript packages
# ──────────────────────────────────────────────────────────────────────────────
Push-Location $webDir
try {
    foreach ($pkg in $tsPackages) {
        $pkgName = $pkg.name
        $pkgAbsPath = "$webDir\$($pkg.relPath)"
        $pkgRelFromRepo = "src/main/web/$($pkg.relPath -replace '\\','/')"

        Write-Host "`n══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "[Docs] Processing: $pkgName" -ForegroundColor Cyan
        Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan

        # ── English docs ──────────────────────────────────────────────────
        Write-Host "[Docs] Generating English docs for $pkgName..."
        $ok = Invoke-TypeDoc -PackageName $pkgName -WorkspaceName $pkg.workspace -PkgAbsPath $pkgAbsPath
        if (-not $ok) {
            Write-Host "[Docs] Skipping $pkgName due to TypeDoc failure." -ForegroundColor Red
            continue
        }

        # Copy EN docs into root/docs/<pkgName>
        Copy-DocsToRoot -SourceDocsPath "$pkgAbsPath\docs" -SectionName $pkgName

        # ── Translated docs ───────────────────────────────────────────────
        foreach ($lang in $languages) {
            $code = $lang.code
            $langName = $lang.name

            Write-Host "`n[Docs] Starting $langName translation for $pkgName..."
            node "$scriptsDir\translate-docs.mjs" $code $pkgRelFromRepo $($pkg.srcSub)
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[Docs]   ✗ $langName translation failed for $pkgName" -ForegroundColor Red
                continue
            }

            Write-Host "[Docs] Running TypeDoc for $pkgName ($langName)..."
            $ok = Invoke-TypeDoc -PackageName "$pkgName/$langName" -WorkspaceName $pkg.workspace -PkgAbsPath $pkgAbsPath -ConfigFile "typedoc.$code.json"
            if ($ok) {
                # Copy translated docs both into local docs/<lang> and root/docs/<pkgName>/<lang>
                Copy-DocsToRoot -SourceDocsPath "$pkgAbsPath\docs\$code" -SectionName $pkgName -LangSubfolder $code
            }

            # Cleanup temporary translated files
            Remove-Item -Recurse -Force "$pkgAbsPath\src_${code}_temp" -ErrorAction SilentlyContinue
            Remove-Item -Force "$pkgAbsPath\typedoc.$code.json" -ErrorAction SilentlyContinue
            Remove-Item -Force "$pkgAbsPath\tsconfig.$code.json" -ErrorAction SilentlyContinue
        }
    }
} finally {
    Pop-Location
}

# ──────────────────────────────────────────────────────────────────────────────
# Phase 2: Kotlin logic (Dokka)
# ──────────────────────────────────────────────────────────────────────────────
$kotlinLogicDir = "$rootDir\src\main\kotlin\com\github\xima_formcycle_entwicklerkreis\fc\plugin\codbi\logic"

Write-Host "`n══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "[Docs] Processing: logic (Kotlin)" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Generate English docs using Dokka
$dokkaAvailable = $false
Write-Host "[Docs] Generating English docs for logic (Dokka)..."
Push-Location $rootDir
try {
    & "$rootDir\mvnw.cmd" dokka:dokka "-Ddokka.outputDir=$rootDir\target\dokka" -q
    if ($LASTEXITCODE -eq 0) { $dokkaAvailable = $true }
} catch { }
Pop-Location

if ($dokkaAvailable -and (Test-Path "$rootDir\target\dokka")) {
    Write-Host "[Docs]   ✓ Dokka generated English docs for logic" -ForegroundColor Green
    Copy-DocsToRoot -SourceDocsPath "$rootDir\target\dokka" -SectionName "logic"

    # Translate KDoc comments for each language
    foreach ($lang in $languages) {
        $code = $lang.code
        $langName = $lang.name

        Write-Host "`n[Docs] Starting $langName translation for logic (Kotlin)..."
        node "$scriptsDir\translate-docs.mjs" $code "src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic" "." ".kt"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[Docs]   ✗ $langName translation failed for logic" -ForegroundColor Red
            continue
        }

        # Run Dokka on translated sources
        $translatedSrc = "$kotlinLogicDir\src_${code}_temp"
        if (Test-Path $translatedSrc) {
            Write-Host "[Docs] Running Dokka for logic - $langName..."
            Push-Location $rootDir
            & "$rootDir\mvnw.cmd" dokka:dokka "-Ddokka.outputDir=$rootDir\target\dokka-$code" "-Ddokka.sourceDir=$translatedSrc" -q
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[Docs]   ✓ Dokka generated $langName docs for logic" -ForegroundColor Green
                Copy-DocsToRoot -SourceDocsPath "$rootDir\target\dokka-$code" -SectionName "logic" -LangSubfolder $code
            } else {
                Write-Host "[Docs]   ✗ Dokka failed for logic - $langName" -ForegroundColor Red
            }
            Pop-Location
            Remove-Item -Recurse -Force $translatedSrc -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "[Docs]   ✗ Dokka failed for logic. Check Maven output." -ForegroundColor Red
}

# ──────────────────────────────────────────────────────────────────────────────
# Phase 3: Generate landing page and finalize
# ──────────────────────────────────────────────────────────────────────────────
Write-Host "`n══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "[Docs] Generating landing page" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Ensure .nojekyll exists
if (-not (Test-Path "$docsRoot\.nojekyll")) {
    New-Item -ItemType File -Path "$docsRoot\.nojekyll" -Force | Out-Null
}

# Build section cards
$sections = @()
foreach ($pkg in $tsPackages) {
    $sections += $pkg.name
}
if (Test-Path "$docsRoot\logic") { $sections += "logic" }

$sectionCards = ($sections | ForEach-Object {
    $sectionName = $_
    $langLinks = ($languages | ForEach-Object {
        $langCode = $_.code
        $langFlag = switch ($langCode) { "de" { "🇩🇪" }; "it" { "🇮🇹" }; default { $langCode.ToUpper() } }
        "<a href=`"$sectionName/$langCode/index.html`" class=`"lang`">$langFlag $($_.name)</a>"
    }) -join "`n              "
    @"
          <div class="card">
            <h2>$sectionName</h2>
            <a href="$sectionName/index.html" class="lang">🇬🇧 English</a>
            $langLinks
          </div>
"@
}) -join "`n"

$indexHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CodBi API Documentation</title>
  <style>
    :root { --accent: #2a7b9b; --bg: #f5f7fa; --card: #fff; --shadow: 0 2px 8px rgba(0,0,0,.08); }
    @media (prefers-color-scheme: dark) { :root { --bg: #1a1a2e; --card: #16213e; --accent: #4ecdc4; } body { color: #e0e0e0; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); padding: 2rem; }
    .header { text-align: center; margin-bottom: 2rem; }
    .header h1 { color: var(--accent); font-size: 2rem; }
    .header p { opacity: .7; margin-top: .5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; max-width: 1000px; margin: 0 auto; }
    .card { background: var(--card); border-radius: .75rem; padding: 1.5rem; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: .75rem; }
    .card h2 { color: var(--accent); font-size: 1.25rem; text-transform: capitalize; }
    .card a.lang { display: inline-block; padding: .4rem .8rem; border-radius: .4rem; text-decoration: none; color: inherit; border: 1px solid #ddd; font-size: .9rem; transition: background .15s; }
    .card a.lang:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
    footer { text-align: center; margin-top: 3rem; opacity: .5; font-size: .85rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CodBi API Documentation</h1>
    <p>Select a module and language to browse the docs.</p>
  </div>
  <div class="grid">
$sectionCards
  </div>
  <footer>Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm')</footer>
</body>
</html>
"@

Set-Content -Path "$docsRoot\index.html" -Value $indexHtml -Encoding UTF8
Write-Host "[Docs] ✓ Landing page written to docs/index.html" -ForegroundColor Green

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "`n══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "[Docs] COMPLETE — Documentation generated at: $docsRoot" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
$totalFiles = (Get-ChildItem $docsRoot -Filter *.html -Recurse -ErrorAction SilentlyContinue).Count
Write-Host "[Docs] Total HTML files: $totalFiles"
Get-ChildItem $docsRoot -Directory | ForEach-Object {
    $count = (Get-ChildItem $_.FullName -Filter *.html -Recurse -ErrorAction SilentlyContinue).Count
    Write-Host "  $($_.Name)/  $count files"
}
