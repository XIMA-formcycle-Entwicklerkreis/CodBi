# check-graphics-build.ps1
#
# Answers ONE question: does the plugin JAR that the Formcycle server actually loads contain the
# document-graphics placement enforcement (the server-side re-anchoring of a graphic next to its
# printed line)?
#
# Why this exists: a run reported "the apple is still in the wrong position" while its log showed
# `Document graphics: 10 element(s) filled, 10 of 10 graphic(s) referenced` - i.e. WITHOUT the
# `N re-anchored next to their printed line` counter. That proves the running JAR was built BEFORE
# the feature existed, so no amount of source fixing could change that run. Check the artifact
# BEFORE debugging the behaviour.
#
# Usage:
#   powershell -NoProfile -File scripts\check-graphics-build.ps1
#   powershell -NoProfile -File scripts\check-graphics-build.ps1 -Jar 'C:\formcycle\plugins\fc-plugin-codbi-1.1.0.jar'
#   powershell -NoProfile -File scripts\check-graphics-build.ps1 -SearchRoot 'C:\Program Files\formcycle'
#
# Exit code 0 = at least one JAR contains the feature, 1 = none does (stale deployment).

[CmdletBinding()]
param(
  # Explicit JAR to inspect. When omitted the script scans -SearchRoot for fc-plugin-codbi*.jar.
  [string] $Jar,
  # Where to look for the deployed plugin when -Jar is not given.
  [string[]] $SearchRoot = @('C:\Program Files\formcycle', 'C:\formcycle', 'D:\formcycle', 'target'),
  # Maximum number of JARs to report when scanning.
  [int] $Take = 10
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Markers of the current graphics pipeline - all three live in AICodBiAssistant.class.
$MARKERS = @(
  'placement enforcement active',          # the summary log line of applyDocumentGraphics
  're-anchored next to their printed line', # the re-anchor counter
  'relocateGraphic'                         # the re-anchoring method itself
)

function Inspect-Jar {
  param([string] $Path)

  $item = Get-Item -LiteralPath $Path
  $result = [pscustomobject]@{
    Jar       = $item.FullName
    Built     = $item.LastWriteTime
    EntryTime = $null
    HasClass  = $false
    Markers   = @{}
    Verdict   = 'NO CLASS'
  }

  try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($item.FullName)
  } catch {
    $result.Verdict = 'UNREADABLE'
    return $result
  }

  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -like '*AICodBiAssistant.class' } | Select-Object -First 1
    if ($null -eq $entry) { return $result }
    $result.HasClass = $true
    $result.EntryTime = $entry.LastWriteTime
    $reader = New-Object System.IO.StreamReader($entry.Open())
    try { $text = $reader.ReadToEnd() } finally { $reader.Close() }
    foreach ($marker in $MARKERS) { $result.Markers[$marker] = $text.Contains($marker) }
    $found = ($result.Markers.Values | Where-Object { $_ }).Count
    $result.Verdict = if ($found -eq $MARKERS.Count) { 'CURRENT' } elseif ($found -eq 0) { 'STALE' } else { "PARTIAL ($found/$($MARKERS.Count))" }
  } finally {
    $zip.Dispose()
  }
  return $result
}

# ---- collect the JARs to inspect -------------------------------------------------------------
$jars = @()
if ($Jar) {
  if (-not (Test-Path -LiteralPath $Jar)) { Write-Host "JAR not found: $Jar" -ForegroundColor Red; exit 1 }
  $jars = @((Resolve-Path -LiteralPath $Jar).Path)
} else {
  foreach ($root in $SearchRoot) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $jars += Get-ChildItem -LiteralPath $root -Filter 'fc-plugin-codbi*.jar' -Recurse -File -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First $Take -ExpandProperty FullName
  }
  $jars = $jars | Select-Object -Unique
}

if ($jars.Count -eq 0) {
  Write-Host 'No fc-plugin-codbi*.jar found. Pass -Jar <path to the deployed plugin>.' -ForegroundColor Yellow
  exit 1
}

# ---- report -----------------------------------------------------------------------------------
$anyCurrent = $false
foreach ($path in $jars) {
  $r = Inspect-Jar -Path $path
  $colour = switch -Wildcard ($r.Verdict) {
    'CURRENT' { 'Green' }
    'STALE'   { 'Red' }
    default   { 'Yellow' }
  }
  Write-Host ''
  Write-Host ("JAR : {0}" -f $r.Jar)
  Write-Host ("built: {0}   class entry: {1}" -f $r.Built, $(if ($r.EntryTime) { $r.EntryTime } else { '-' }))
  Write-Host ("verdict: {0}" -f $r.Verdict) -ForegroundColor $colour
  foreach ($marker in $MARKERS) {
    $state = if ($r.Markers[$marker]) { 'yes' } else { 'no ' }
    Write-Host ("  [{0}] {1}" -f $state, $marker)
  }
  if ($r.Verdict -eq 'CURRENT') { $anyCurrent = $true }
}

Write-Host ''
if ($anyCurrent) {
  Write-Host 'A JAR with the placement enforcement exists. Make sure THIS file is the one the server loads' -ForegroundColor Green
  Write-Host '(plugin folder of the running instance, and restart it so the class is reloaded).' -ForegroundColor Green
  exit 0
}

Write-Host 'No inspected JAR contains the placement enforcement - the run cannot re-anchor anything.' -ForegroundColor Red
Write-Host 'Fix: rebuild and redeploy (scripts\Safe Build Deploy.ps1), then restart the Formcycle server,' -ForegroundColor Red
Write-Host 'and confirm the run logs "Document graphics (placement enforcement active): ... re-anchored ...".' -ForegroundColor Red
exit 1
