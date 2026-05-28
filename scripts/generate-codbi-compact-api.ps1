param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

$jsRoot = Join-Path $RepoRoot "src/main/web/packages/form/src/js"
$outFile = Join-Path $RepoRoot "src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md"
$elementsOnlyOutFile = Join-Path $RepoRoot "src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-elements-compact.md"
$detailsIndexOutFile = Join-Path $RepoRoot "src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json"

function Normalize-Text {
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
  $t = $Text
  $t = $t -replace "\{@link\s+([^}]+)\}", '$1'
  $t = $t -replace "\*\*", ""
  $t = $t -replace "\s+", " "
  $t = $t.Trim()
  if ([string]::IsNullOrWhiteSpace($t)) { return "" }
  return $t
}

function To-OneSentence {
  param([string]$Text)
  $t = Normalize-Text $Text
  if ([string]::IsNullOrWhiteSpace($t)) { return "" }
  $m = [regex]::Match($t, "^(.+?[.!?])(\s|$)")
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return ($t.TrimEnd(".") + ".")
}

function Get-DocBlock {
  param([string]$Content)
  $m = [regex]::Match($Content, "(?s)/\*\*(.*?)\*/")
  if (-not $m.Success) { return "" }
  $raw = $m.Groups[1].Value
  $lines = $raw -split "`r?`n" | ForEach-Object { ($_ -replace "^\s*\*\s?", "").TrimEnd() }
  return ($lines -join "`n")
}

function Get-DocDetail {
  param([string]$Doc)
  if ([string]::IsNullOrWhiteSpace($Doc)) { return "" }
  $lines =
    $Doc -split "`n" |
    ForEach-Object { $_.Trim() } |
    Where-Object {
      $_ -ne "" -and
      $_ -notmatch "^(Initial Author|Maintainer|@remarks)\b"
    }
  if ($lines.Count -eq 0) { return "" }
  return ($lines -join "`n")
}

function Get-ElementDescription {
  param([string]$Doc)
  $lines = $Doc -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
  foreach ($line in $lines) {
    if ($line -match "^(Initial Author|Maintainer|@remarks|###|####|Config Parameter|CSS-Classes|CSS Classes|\|\s*:---)") { continue }
    if ($line -like "|*") { continue }
    return (To-OneSentence $line)
  }
  return ""
}

function Get-ConfigParamHints {
  param([string]$Doc)
  $map = @{}
  foreach ($m in [regex]::Matches($Doc, "(?im)^\s*-\s*([A-Za-z0-9_]+)\s*:\s*(.+)$")) {
    $name = $m.Groups[1].Value.Trim()
    $desc = To-OneSentence $m.Groups[2].Value
    if ($name -and $desc) {
      $map[$name] = $desc
    }
  }
  return $map
}

function Get-EpParamHints {
  param([string]$Doc)
  $map = @{}
  foreach ($m in [regex]::Matches($Doc, "(?im)^\s*-\s*(\d+)(?:st|nd|rd|th)\s*:\s*(.+)$")) {
    $idx = [int]$m.Groups[1].Value
    $desc = To-OneSentence $m.Groups[2].Value
    if ($desc) {
      $map[$idx] = $desc
    }
  }
  return $map
}

function Get-ConfigClassHints {
  param(
    [string]$Doc,
    [string[]]$KnownClasses
  )
  $map = @{}
  if ([string]::IsNullOrWhiteSpace($Doc)) { return $map }

  $lines = $Doc -split "`n"
  $currentClasses = @()
  $buffer = @()

  function Flush-Current {
    param(
      [ref]$CurrentClassesRef,
      [ref]$BufferRef,
      [ref]$MapRef
    )
    if ($CurrentClassesRef.Value.Count -eq 0) { return }
    $desc = To-OneSentence (($BufferRef.Value -join " "))
    if (-not $desc) {
      $desc = "Applies this standard configuration behavior to tagged elements."
    }
    foreach ($cls in $CurrentClassesRef.Value) {
      if (-not $MapRef.Value.ContainsKey($cls)) {
        $MapRef.Value[$cls] = $desc
      }
    }
    $CurrentClassesRef.Value = @()
    $BufferRef.Value = @()
  }

  foreach ($raw in $lines) {
    $line = $raw.Trim()
    $bullet = [regex]::Match($line, "^-\s*\*\*([^*]+)\*\*")
    if ($bullet.Success) {
      Flush-Current -CurrentClassesRef ([ref]$currentClasses) -BufferRef ([ref]$buffer) -MapRef ([ref]$map)
      $label = $bullet.Groups[1].Value
      $hits = @()
      foreach ($cls in $KnownClasses) {
        if ($label -like "*$cls*") {
          $hits += $cls
        }
      }
      $currentClasses = $hits
      $tail = $line.Substring($bullet.Length).Trim(" ", "-", ":")
      if ($tail) {
        $buffer += $tail
      }
      continue
    }

    if ($currentClasses.Count -gt 0 -and $line) {
      $buffer += $line
    }
  }

  Flush-Current -CurrentClassesRef ([ref]$currentClasses) -BufferRef ([ref]$buffer) -MapRef ([ref]$map)
  return $map
}

function Build-ElementsOnlyMarkdown {
  param([string]$FullMarkdown)

  $srcLines = $FullMarkdown -split "`r?`n"
  $out = New-Object System.Text.StringBuilder
  [void]$out.AppendLine("# CodBi Core Elements (Compact)")
  [void]$out.AppendLine("")
  [void]$out.AppendLine("Element-only reference: what each functionality, element placeholder, and standard class does.")
  [void]$out.AppendLine("")

  $currentSection = ""
  foreach ($line in $srcLines) {
    $trimmed = $line.Trim()
    if ($trimmed -eq "## Functionalities") {
      $currentSection = "Functionalities"
      [void]$out.AppendLine("## Functionalities")
      [void]$out.AppendLine("")
      continue
    }
    if ($trimmed -eq "## Element Placeholders (EPs)") {
      $currentSection = "EPs"
      [void]$out.AppendLine("## Element Placeholders (EPs)")
      [void]$out.AppendLine("")
      continue
    }
    if ($trimmed -eq "## Standard Configuration Classes") {
      $currentSection = "Classes"
      [void]$out.AppendLine("## Standard Configuration Classes")
      [void]$out.AppendLine("")
      continue
    }

    # Keep only top-level element entries; drop parameter/class detail bullets.
    if ($trimmed -like "- *" -and -not $trimmed.StartsWith("- .") -and -not $trimmed.StartsWith("- Param[")) {
      if ($line.StartsWith("- ")) {
        [void]$out.AppendLine($line)
      }
    }
  }

  return $out.ToString().TrimEnd() + "`n"
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# CodBi Core Components API (Compact)")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("Compact reference for AI prompts: one sentence per component and parameter.")
[void]$sb.AppendLine("")

[void]$sb.AppendLine("## Functionalities")
[void]$sb.AppendLine("")
$detailsEntries = [ordered]@{}
$detailsAliases = [ordered]@{}

$funcDir = Join-Path $jsRoot "Functionalities"
Get-ChildItem $funcDir -Filter "*.ts" | Sort-Object Name | ForEach-Object {
  $file = $_
  $ts = Get-Content -Raw $file.FullName
  $idMatch = [regex]::Match($ts, 'registerFunctionality\("([^"]+)"')
  if (-not $idMatch.Success) { return }

  $id = $idMatch.Groups[1].Value
  $doc = Get-DocBlock $ts
  $docDetail = Get-DocDetail $doc
  $desc = Get-ElementDescription $doc
  if (-not $desc) {
    $desc = "Executes this functionality on tagged form elements."
  }
  [void]$sb.AppendLine("- ${id}: $desc")

  $jsonPath = [System.IO.Path]::ChangeExtension($file.FullName, ".json")
  $paramKeys = @()
  if (Test-Path $jsonPath) {
    $json = Get-Content -Raw $jsonPath | ConvertFrom-Json
    if ($null -ne $json.Parameter) {
      $paramKeys = @($json.Parameter.PSObject.Properties.Name | Sort-Object)
    }
  }

  $paramHints = Get-ConfigParamHints $doc
  $entryParams = [ordered]@{}
  if ($paramKeys.Count -eq 0) {
    [void]$sb.AppendLine("  - Parameters: none.")
  } else {
    foreach ($paramName in $paramKeys) {
      $pDesc = if ($paramHints.ContainsKey($paramName)) {
        $paramHints[$paramName]
      } else {
        "Configures '$paramName' for this functionality."
      }
      if ($paramHints.ContainsKey($paramName)) {
        $entryParams[$paramName] = $paramHints[$paramName]
      }
      [void]$sb.AppendLine("  - ${paramName}: $pDesc")
    }
  }

  $detailsEntries[$id] = [ordered]@{
    id = $id
    type = "functionality"
    summary = $desc
    tsdoc = $docDetail
    parameters = $entryParams
    classDescriptions = [ordered]@{}
  }
  $detailsAliases[$id] = $id
  $detailsAliases[$id.ToLowerInvariant()] = $id
}

[void]$sb.AppendLine("")
[void]$sb.AppendLine("## Element Placeholders (EPs)")
[void]$sb.AppendLine("")
$epDir = Join-Path $jsRoot "EPs"
Get-ChildItem $epDir -Filter "*.ts" | Sort-Object Name | ForEach-Object {
  $file = $_
  $ts = Get-Content -Raw $file.FullName
  $idMatch = [regex]::Match($ts, 'registerEP\("([^"]+)"')
  if (-not $idMatch.Success) { return }

  $id = $idMatch.Groups[1].Value
  $doc = Get-DocBlock $ts
  $docDetail = Get-DocDetail $doc
  $desc = Get-ElementDescription $doc
  if (-not $desc) {
    $desc = "Returns placeholder data for use in CodBi expressions."
  }
  [void]$sb.AppendLine("- ${id}: $desc")

  $epHints = Get-EpParamHints $doc
  $entryParams = [ordered]@{}
  if ($epHints.Count -eq 0) {
    [void]$sb.AppendLine("  - Parameters: none.")
  } else {
    foreach ($idx in ($epHints.Keys | Sort-Object)) {
      $entryParams[[string]$idx] = $epHints[$idx]
      [void]$sb.AppendLine("  - Param[$idx]: $($epHints[$idx])")
    }
  }

  $detailsEntries[$id] = [ordered]@{
    id = $id
    type = "ep"
    summary = $desc
    tsdoc = $docDetail
    parameters = $entryParams
    classDescriptions = [ordered]@{}
  }
  $detailsAliases[$id] = $id
  $detailsAliases[$id.ToLowerInvariant()] = $id
}

[void]$sb.AppendLine("")
[void]$sb.AppendLine("## Standard Configuration Classes")
[void]$sb.AppendLine("")
$cfgDir = Join-Path $jsRoot "Configurations"
Get-ChildItem $cfgDir -Filter "*.json" | Sort-Object Name | ForEach-Object {
  $file = $_
  $cfgId = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
  $json = Get-Content -Raw $file.FullName | ConvertFrom-Json
  $classNames = @()
  if ($null -ne $json.classes) {
    $classNames = @($json.classes.PSObject.Properties.Name | Sort-Object)
  }

  $tsPath = [System.IO.Path]::ChangeExtension($file.FullName, ".ts")
  $doc = ""
  if (Test-Path $tsPath) {
    $doc = Get-DocBlock (Get-Content -Raw $tsPath)
  }
  $docDetail = Get-DocDetail $doc

  $cfgDesc = Get-ElementDescription $doc
  if (-not $cfgDesc) {
    $cfgDesc = "Applies grouped behavior to elements tagged with its CSS classes."
  }
  [void]$sb.AppendLine("- ${cfgId}: $cfgDesc")

  $entryClasses = [ordered]@{}
  if ($classNames.Count -eq 0) {
    [void]$sb.AppendLine("  - Classes: none.")
  } else {
    $classHints = Get-ConfigClassHints -Doc $doc -KnownClasses $classNames
    foreach ($cls in $classNames) {
      $cDesc = if ($classHints.ContainsKey($cls)) {
        $classHints[$cls]
      } else {
        "Applies '$cfgId' behavior to elements tagged with '.$cls'."
      }
      if ($classHints.ContainsKey($cls)) {
        $entryClasses[$cls] = $classHints[$cls]
      }
      [void]$sb.AppendLine("  - .${cls}: $cDesc")

      $detailsAliases[$cls] = $cfgId
      $detailsAliases[$cls.ToLowerInvariant()] = $cfgId
    }
  }

  $detailsEntries[$cfgId] = [ordered]@{
    id = $cfgId
    type = "standard"
    summary = $cfgDesc
    tsdoc = $docDetail
    parameters = [ordered]@{}
    classDescriptions = $entryClasses
  }
  $detailsAliases[$cfgId] = $cfgId
  $detailsAliases[$cfgId.ToLowerInvariant()] = $cfgId
}

New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetDirectoryName($outFile)) | Out-Null
[System.IO.File]::WriteAllText($outFile, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))

$elementsOnly = Build-ElementsOnlyMarkdown -FullMarkdown $sb.ToString()
[System.IO.File]::WriteAllText($elementsOnlyOutFile, $elementsOnly, [System.Text.UTF8Encoding]::new($false))

$detailsIndex = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  entries = $detailsEntries
  aliases = $detailsAliases
}
$detailsJson = $detailsIndex | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($detailsIndexOutFile, $detailsJson, [System.Text.UTF8Encoding]::new($false))

Write-Output "Generated compact API file: $outFile"
Write-Output "Generated elements-only file: $elementsOnlyOutFile"
Write-Output "Generated details index file: $detailsIndexOutFile"