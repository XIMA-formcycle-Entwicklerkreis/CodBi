#!/usr/bin/env pwsh
# ─── CodBi Section Translator ────────────────────────────────────────────────
# Translates a single documentation section (or all) to German and Italian.
# Uses the existing translate-docs.mjs incremental cache — unchanged doc comments
# are served from cache instead of re-translated.
#
# Usage:
#   .\translate-section.ps1 -Section form          # translate form only
#   .\translate-section.ps1 -Section logic          # translate Kotlin logic only
#   .\translate-section.ps1 -Section all            # translate all sections
#   .\translate-section.ps1                         # defaults to "all"
#
# After translation, runs TypeDoc / Dokka on the translated sources and copies
# results into root/docs/<section>/<lang>.
# ──────────────────────────────────────────────────────────────────────────────
param(
    [Parameter(Position = 0)]
    [ValidateSet("form", "common", "designer", "logic", "all")]
    [string]$Section = "all"
)

$ErrorActionPreference = "Continue"
$rootDir = $PSScriptRoot
$webDir = "$rootDir\src\main\web"
$docsRoot = "$rootDir\docs"
$scriptsDir = "$rootDir\scripts"

$languages = @(
    @{ code = "de"; name = "German" },
    @{ code = "it"; name = "Italian" }
)

$tsPackages = @{
    form     = @{ workspace = "codbi-form";     relPath = "packages\form";     srcSub = "src/js" }
    common   = @{ workspace = "codbi-common";   relPath = "packages\common";   srcSub = "src/js" }
    designer = @{ workspace = "codbi-designer"; relPath = "packages\designer"; srcSub = "src/js" }
}

# ─── Helper: Copy docs into root/docs/<section> (robocopy for MAX_PATH) ──────
function Copy-DocsToRoot {
    param(
        [string]$SourceDocsPath,
        [string]$SectionName,
        [string]$LangSubfolder
    )
    $targetPath = if ($LangSubfolder) { "$docsRoot\$SectionName\$LangSubfolder" } else { "$docsRoot\$SectionName" }
    if (Test-Path $targetPath) {
        cmd /c "rd /s /q `"$targetPath`"" 2>$null
    }
    if (Test-Path $SourceDocsPath) {
        robocopy $SourceDocsPath $targetPath /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
        Write-Host "[Translate]   -> Copied to docs/$SectionName$(if ($LangSubfolder) { "/$LangSubfolder" })"
    } else {
        Write-Host "[Translate]   ! Source not found: $SourceDocsPath" -ForegroundColor Yellow
    }
}

# ─── Translate a TypeScript package ───────────────────────────────────────────
function Invoke-TranslateTS {
    param([string]$Name)

    $pkg = $tsPackages[$Name]
    $pkgAbsPath = "$webDir\$($pkg.relPath)"
    $pkgRelFromRepo = "src/main/web/$($pkg.relPath -replace '\\','/')"

    Write-Host "`n======================================================" -ForegroundColor Cyan
    Write-Host "[Translate] $Name (TypeScript)" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan

    foreach ($lang in $languages) {
        $code = $lang.code
        $langName = $lang.name

        Write-Host "[Translate] $langName translation for $Name..."
        node "$scriptsDir\translate-docs.mjs" $code $pkgRelFromRepo $($pkg.srcSub)
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[Translate]   x $langName translation failed for $Name" -ForegroundColor Red
            continue
        }

        Write-Host "[Translate] Running TypeDoc for $Name ($langName)..."
        Push-Location $pkgAbsPath
        try {
            yarn typedoc --options "typedoc.$code.json"
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[Translate]   ok TypeDoc succeeded for $Name/$langName" -ForegroundColor Green
                Copy-DocsToRoot -SourceDocsPath "$pkgAbsPath\docs\$code" -SectionName $Name -LangSubfolder $code
            } else {
                Write-Host "[Translate]   x TypeDoc failed for $Name/$langName" -ForegroundColor Red
            }
        } finally { Pop-Location }

        Remove-Item -Recurse -Force "$pkgAbsPath\src_${code}_temp" -ErrorAction SilentlyContinue
        Remove-Item -Force "$pkgAbsPath\typedoc.$code.json" -ErrorAction SilentlyContinue
        Remove-Item -Force "$pkgAbsPath\tsconfig.$code.json" -ErrorAction SilentlyContinue
    }
}

# ─── Translate Kotlin logic ──────────────────────────────────────────────────
function Invoke-TranslateLogic {
    $kotlinLogicDir = "$rootDir\src\main\kotlin\com\github\xima_formcycle_entwicklerkreis\fc\plugin\codbi\logic"

    Write-Host "`n======================================================" -ForegroundColor Cyan
    Write-Host "[Translate] logic (Kotlin)" -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan

    foreach ($lang in $languages) {
        $code = $lang.code
        $langName = $lang.name

        Write-Host "[Translate] $langName translation for logic..."
        node "$scriptsDir\translate-docs.mjs" $code "src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic" "." ".kt"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[Translate]   x $langName translation failed for logic" -ForegroundColor Red
            continue
        }

        $translatedSrc = "$kotlinLogicDir\src_${code}_temp"
        if (Test-Path $translatedSrc) {
            Write-Host "[Translate] Running Dokka for logic - $langName..."
            Push-Location $rootDir
            & "$rootDir\mvnw.cmd" dokka:dokka "-Ddokka.outputDir=$rootDir\target\dokka-$code" "-Ddokka.sourceDir=$translatedSrc" -q
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[Translate]   ok Dokka generated $langName docs" -ForegroundColor Green
                Copy-DocsToRoot -SourceDocsPath "$rootDir\target\dokka-$code" -SectionName "logic" -LangSubfolder $code
            } else {
                Write-Host "[Translate]   x Dokka failed for logic - $langName" -ForegroundColor Red
            }
            Pop-Location
            Remove-Item -Recurse -Force $translatedSrc -ErrorAction SilentlyContinue
        }
    }

}

# ─── Main ─────────────────────────────────────────────────────────────────────
$sections = if ($Section -eq "all") { @("form", "common", "designer", "logic") } else { @($Section) }

foreach ($s in $sections) {
    if ($s -eq "logic") {
        Invoke-TranslateLogic
    } else {
        Invoke-TranslateTS -Name $s
    }
}

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "[Translate] Done." -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
