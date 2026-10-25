param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

# Generates the typed parameter Signature for every Element-Placeholder into its sibling .json file
# (EPs/<name>.json). The designer reads these .json files at runtime via
# CodbiFormDesignerResourcePlugin.getDetails(".../EPs") to populate
# window.CodbiPluginData.detElementplaceholder, which is what the EP builder resolves against.
#
# Source of truth: the EP's class-level TSDoc "Config Parameter:" / "Placeholder Parameter:" list
# (ordinal bullets, optionally carrying an inline `{Type}` prefix) plus explicit `@epParam` tags.
# Existing keys in the .json (e.g. Description) are preserved; only `Signature` is added/updated.

$epDir = Join-Path $RepoRoot "src/main/web/packages/form/src/js/EPs"

# Curated datatype hints for well-known parameters (key: "<ep-file>.<index>"). Anything not listed
# falls back to the inline {Type} or "any".
$typeOverrides = @{
  "sorted.1"                      = "array"; "sorted.2"                      = "string"
  "unique.1"                      = "array"; "unique.2"                      = "string"
  "json.path.1"                   = "object"; "json.path.2"                  = "string"
  "net.url.1"                     = "string"
  "v.1"                           = "string"; "v.2"                          = "string"
  "vp.1"                          = "string"; "vp.2"                         = "string"
  "i.1"                           = "number"; "i.2"                         = "array"
  "f.1"                           = "string"
  "data.join.1"                   = "object"; "data.join.2"                  = "object"; "data.join.3" = "object"
  "ldap.find.1"                   = "string"; "ldap.find.2"                  = "string"; "ldap.find.3" = "string"
  "urlparameter.1"                = "string"
  "openplz.localities.1"          = "string"; "openplz.localities.2"         = "string"; "openplz.localities.3" = "string"; "openplz.localities.4" = "number"
  "openplz.textsearch.1"          = "string"; "openplz.textsearch.2"         = "string"; "openplz.textsearch.3" = "number"
  "openplz.streets.1"             = "string"; "openplz.streets.2"            = "string"; "openplz.streets.3" = "string"; "openplz.streets.4" = "string"; "openplz.streets.5" = "number"
  "openplz.organizationalunits.1" = "string"; "openplz.organizationalunits.2" = "string"; "openplz.organizationalunits.3" = "string"; "openplz.organizationalunits.4" = "string"; "openplz.organizationalunits.5" = "number"
  "openplz.1"                     = "string"; "openplz.2"                     = "string"; "openplz.3" = "string"; "openplz.4" = "string"; "openplz.5" = "string"; "openplz.6" = "string"; "openplz.7" = "string"; "openplz.8" = "string"; "openplz.9" = "number"
}

# Optional German translations (English text -> German) for summaries and parameter descriptions.
$deTranslationsFile = Join-Path $PSScriptRoot "ep-translations.de.json"
$deTranslations = $null
if (Test-Path $deTranslationsFile) {
  $deTranslations = Get-Content -Raw -Encoding UTF8 $deTranslationsFile | ConvertFrom-Json
}

function Get-DeTranslation {
  # Returns the German text for an EP's summary ("") or a 1-based parameter index, or $null.
  param([string]$BaseName, [string]$Index)
  if ($null -eq $deTranslations) { return $null }
  $entryProp = $deTranslations.PSObject.Properties[$BaseName]
  if ($null -eq $entryProp) { return $null }
  $entry = $entryProp.Value
  if ($Index -eq "") { return $entry.summary }
  if ($null -eq $entry.params) { return $null }
  $paramProp = $entry.params.PSObject.Properties[$Index]
  if ($null -eq $paramProp) { return $null }
  return $paramProp.Value
}

function Get-DocBlock {
  param([string]$Content)
  # Prefer the TSDoc block immediately preceding the class declaration (files may contain other
  # doc comments, e.g. for helper types, before the class).
  $classMatch = [regex]::Match($Content, "(?m)^\s*(?:export\s+)?class\s+\w+")
  if ($classMatch.Success) {
    $before = $Content.Substring(0, $classMatch.Index)
    $blocks = [regex]::Matches($before, "(?s)/\*\*(.*?)\*/")
    if ($blocks.Count -gt 0) {
      $raw = $blocks[$blocks.Count - 1].Groups[1].Value
      $lines = $raw -split "`r?`n" | ForEach-Object { ($_ -replace "^\s*\*\s?", "").TrimEnd() }
      return ($lines -join "`n")
    }
  }
  # Fallback: the first doc block in the file.
  $m = [regex]::Match($Content, "(?s)/\*\*(.*?)\*/")
  if (-not $m.Success) { return "" }
  $raw = $m.Groups[1].Value
  $lines = $raw -split "`r?`n" | ForEach-Object { ($_ -replace "^\s*\*\s?", "").TrimEnd() }
  return ($lines -join "`n")
}

function To-OneSentence {
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
  $t = $Text
  $t = $t -replace "\{@link\s+([^}]+)\}", '$1'
  $t = $t -replace "\*\*", ""
  $t = $t -replace "\s+", " "
  return $t.Trim()
}

function Get-OptionsFromDescription {
  # Extracts candidate literal values a parameter description enumerates: parenthesized
  # comma-separated token lists (e.g. the state abbreviations of Date.Holidays) and quoted
  # single-word tokens (e.g. "THIS_YEAR", "Friedensfest", "bezeichnung"). Deduplicated, order kept.
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return @() }
  $options = New-Object System.Collections.Generic.List[string]
  $seen = @{}
  $add = {
    param([string]$value)
    $trimmed = $value.Trim()
    if ($trimmed -match "^[A-Za-z][A-Za-z0-9_]{1,}$" -and -not $seen.ContainsKey($trimmed.ToLowerInvariant())) {
      $seen[$trimmed.ToLowerInvariant()] = $true
      $options.Add($trimmed)
    }
  }
  foreach ($m in [regex]::Matches($Text, "\(([A-Za-z0-9_]{2}(?:\s*,\s*[A-Za-z0-9_]{2,})+)\)")) {
    foreach ($part in ($m.Groups[1].Value -split ",")) { & $add $part }
  }
  foreach ($m in [regex]::Matches($Text, '"([A-Za-z][A-Za-z0-9_]{1,})"')) { & $add $m.Groups[1].Value }
  return @($options)
}

function Get-RegexOptionList {
  # Returns the alternatives of the FIRST/LONGEST static `stdExp` alternation regex of the simple
  # /^(a|b|c)$/ form — the BayVIS EPs declare their valid directory properties that way.
  param([string]$Content)
  $best = @()
  foreach ($m in [regex]::Matches($Content, "/\^\(([^()]*)\)\$/")) {
    $values = @($m.Groups[1].Value -split "\|" | ForEach-Object { $_.Trim() } | Where-Object { $_ -match "^[A-Za-z][A-Za-z0-9_]*$" })
    if ($values.Count -ge 2 -and $values.Count -gt $best.Count) { $best = $values }
  }
  return $best
}

function Get-Summary {
  # Derives a very short (first-sentence) description of the EP from its class-level TSDoc,
  # skipping parameter lists, headings, tables and @-tags. Prose that wraps over several lines is
  # joined first so the first sentence isn't truncated at a line break.
  param([string]$Doc)
  $lines = $Doc -split "`n" | ForEach-Object { $_.Trim() }
  $buffer = ""
  foreach ($line in $lines) {
    if ($line -eq "") {
      if ($buffer -ne "") { break }
      continue
    }
    if ($line -match "^(Initial Author|Maintainer|@|###|####|Config Parameter|Placeholder Parameter|Parameter:|CSS-Classes|CSS Classes|\|)") { continue }
    if ($line -match "^-\s") { continue }
    $buffer += " " + (To-OneSentence $line)
  }
  $buffer = ($buffer -replace "\s+", " ").Trim()
  if ($buffer -eq "") { return "" }
  $m = [regex]::Match($buffer, "^(.+?[.!?])(?=\s+[A-Z0-9]|$)")
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return $buffer
}

function New-EPParam {
  # Builds one signature parameter entry, applying the curated datatype overrides, German translations
  # and the enum values its description enumerates (quoted tokens / parenthesized lists).
  param([string]$BaseName, [int]$Index, [string]$Type, [string]$Desc)
  $overrideKey = "$BaseName.$Index"
  if ($typeOverrides.ContainsKey($overrideKey)) { $Type = $typeOverrides[$overrideKey] }
  $de = Get-DeTranslation -BaseName $BaseName -Index "$Index"
  $options = Get-OptionsFromDescription -Text $Desc
  $entry = [ordered]@{
    index    = $Index
    type     = $Type
    optional = [bool]($Desc -match "(?i)\boptional\b")
    variadic = [bool]($Desc -match "(?i)\bup to\b|\bvariadic\b|\band beyond\b")
  }
  if ($options.Count -ge 2) { $entry["options"] = @($options) }
  $entry["description"] = if ($de) { [ordered]@{ en = $Desc; de = $de } } else { $Desc }
  return $entry
}

function Get-Signature {
  param([string]$Doc, [string]$BaseName, [string]$Content = "")
  $params = @()
  $seen = @{}
  $lines = $Doc -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }

  # 1) Explicitly numbered items — supports both the "- 1st: ..." bullet style and the plain
  #    "1. ..." / "2) ..." numbered-list style (e.g. Net.URL, Date.Weekends, Date.Holidays).
  foreach ($line in $lines) {
    $m = [regex]::Match($line, "^(?:-\s*)?(\d+)(?:st|nd|rd|th)?(?:\s*[\.\):]\s*|\s+)(?:\{\s*([A-Za-z]+)\s*\})?\s*(.+)$")
    if (-not $m.Success) { continue }
    $idx = [int]$m.Groups[1].Value
    if ($idx -lt 1 -or $idx -gt 99) { continue }
    if ($seen.ContainsKey($idx)) { continue }
    $seen[$idx] = $true
    $type = if ($m.Groups[2].Success -and $m.Groups[2].Value) { $m.Groups[2].Value.ToLowerInvariant() } else { "any" }
    $params += New-EPParam -BaseName $BaseName -Index $idx -Type $type -Desc (To-OneSentence $m.Groups[3].Value)
  }

  # 2) Otherwise unnumbered dash bullets ("- The index ..."), indexed sequentially (e.g. I).
  if ($params.Count -eq 0) {
    $auto = 0
    foreach ($line in $lines) {
      $m = [regex]::Match($line, "^-\s*(?:\{\s*([A-Za-z]+)\s*\})?\s*(.+)$")
      if (-not $m.Success) { continue }
      $auto++
      $type = if ($m.Groups[1].Success -and $m.Groups[1].Value) { $m.Groups[1].Value.ToLowerInvariant() } else { "any" }
      $params += New-EPParam -BaseName $BaseName -Index $auto -Type $type -Desc (To-OneSentence $m.Groups[2].Value)
    }
  }

  # 3) Otherwise a single plain description right below a "… Parameter:" heading (e.g. DOM.Query).
  if ($params.Count -eq 0) {
    $heading = -1
    for ($k = 0; $k -lt $lines.Count; $k++) {
      if ($lines[$k] -match "(?i)(Placeholder|Config)\s+Parameter") { $heading = $k; break }
    }
    if ($heading -ge 0) {
      for ($k = $heading + 1; $k -lt $lines.Count; $k++) {
        $candidate = $lines[$k]
        if ($candidate -match "^@") { break }
        if ($candidate -match "^\||^###|^-|^\*") { continue }
        $params += New-EPParam -BaseName $BaseName -Index 1 -Type "any" -Desc (To-OneSentence $candidate)
        break
      }
    }
  }

  # 4) Explicit @epParam tags (kept for EPs that use them).
  foreach ($m in [regex]::Matches($Doc, "(?im)@epParam\s+(\d+)\s*(?:\{\s*([A-Za-z]+)\s*\})?\s*(?:(optional|variadic)\b)?\s*([^\r\n]*)?")) {
    $idx = [int]$m.Groups[1].Value
    if ($seen.ContainsKey($idx)) { continue }
    $seen[$idx] = $true
    $type = if ($m.Groups[2].Success -and $m.Groups[2].Value) { $m.Groups[2].Value.ToLowerInvariant() } else { "any" }
    $desc = ($m.Groups[4].Value).Trim()
    $de = Get-DeTranslation -BaseName $BaseName -Index "$idx"
    $options = Get-OptionsFromDescription -Text $desc
    $entry = [ordered]@{
      index    = $idx
      type     = $type
      optional = ($m.Groups[3].Value -eq "optional")
      variadic = ($m.Groups[3].Value -eq "variadic")
    }
    if ($options.Count -ge 2) { $entry["options"] = @($options) }
    $entry["description"] = if ($de) { [ordered]@{ en = $desc; de = $de } } else { $desc }
    $params += $entry
  }

  if ($params.Count -eq 0) { return $null }

  $sorted = @($params | Sort-Object { $_.index })

  # The BayVIS EPs declare their valid directory properties as a stdExp alternation regex. Attach
  # that list as `options` to the parameter whose description mentions a "property" (else the last).
  $regexOptions = Get-RegexOptionList -Content $Content
  if ($regexOptions.Count -ge 2 -and $sorted.Count -gt 0) {
    $target = $null
    foreach ($p in $sorted) {
      $desc = $p["description"]
      $en = if ($desc -is [string]) { $desc } elseif ($null -ne $desc.en) { [string]$desc.en } else { "" }
      if ($en -match "(?i)propert") { $target = $p }
    }
    if ($null -eq $target) { $target = $sorted[$sorted.Count - 1] }
    $target["options"] = @($regexOptions)
  }

  return [ordered]@{
    params     = $sorted
    returnType = "any"
    source     = "tsdoc"
  }
}

Get-ChildItem $epDir -Filter "*.ts" | Sort-Object Name | ForEach-Object {
  $ts = Get-Content -Raw -Encoding UTF8 $_.FullName
  $doc = Get-DocBlock $ts
  if ([string]::IsNullOrWhiteSpace($doc)) { return }

  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
  $jsonPath = [System.IO.Path]::ChangeExtension($_.FullName, ".json")
  if (-not (Test-Path $jsonPath)) { Write-Output "skip (no json): $baseName"; return }

  $signature = Get-Signature -Doc $doc -BaseName $baseName -Content $ts
  $summary = Get-Summary $doc
  if ($null -eq $signature -and [string]::IsNullOrWhiteSpace($summary)) { return }

  $existing = Get-Content -Raw -Encoding UTF8 $jsonPath | ConvertFrom-Json
  $ordered = [ordered]@{}
  foreach ($prop in $existing.PSObject.Properties) { $ordered[$prop.Name] = $prop.Value }
  if (-not [string]::IsNullOrWhiteSpace($summary)) {
    $deSummary = Get-DeTranslation -BaseName $baseName -Index ""
    if ($deSummary) {
      $ordered["Summary"] = [ordered]@{ en = $summary; de = $deSummary }
    } else {
      $ordered["Summary"] = $summary
    }
  }
  if ($null -ne $signature) { $ordered["Signature"] = $signature }

  $json = $ordered | ConvertTo-Json -Depth 10
  [System.IO.File]::WriteAllText($jsonPath, $json, [System.Text.UTF8Encoding]::new($false))
  $pcount = if ($null -ne $signature) { $signature.params.Count } else { 0 }
  Write-Output "summary+signature -> $baseName ($pcount params)"
}
