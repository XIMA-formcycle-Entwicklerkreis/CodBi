# Pass-1 catalog audit for the CodBi form assistant.
#
# CONTRACT (see CodbiCapabilities.condenseEntryPurposes + CodbiCapabilitiesPass1CatalogTest):
# pass-1 advertises EVERY element with (a) one sentence "what it does" and (b) a `USE WHEN …`
# sentence saying which request maps to it. Parameters/attributes/JSON skeletons must NOT appear in
# the pass-1 catalog — they arrive in pass-2 via `need_codbi_details`.
#
# This script validates the CONTENT of the catalog file directly, i.e. without compiling the plugin,
# so a catalog edit can be checked in a second. It reports every entry that violates the contract.
#
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/pass1-coverage-audit.ps1
$ErrorActionPreference = 'Stop'

$catalog =
  Join-Path (Get-Location) `
    'src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-elements-compact.md'
if (-not (Test-Path $catalog)) { throw "catalog not found: $catalog" }

$lines = [IO.File]::ReadAllLines($catalog)
$entries = @()
$group = ''
$current = $null
$buffer = New-Object System.Text.StringBuilder

function Flush {
  if ($null -eq $script:current) { return }
  $script:entries +=
    [pscustomobject]@{
      Group = $script:group
      Id    = $script:current
      Body  = $script:buffer.ToString().Trim()
    }
  [void]$script:buffer.Clear()
}

foreach ($line in $lines) {
  $t = $line.Trim()
  if ($t -match '^##\s+(.+)$') { Flush; $group = $Matches[1].Trim(); $current = $null; continue }
  if ($t -match '^###\s+(.+)$') {
    Flush
    $current = $Matches[1].Trim()
    continue
  }
  if ($t.StartsWith('# ')) { Flush; $current = $null; continue }
  if ($null -ne $current -and $t -ne '') { [void]$buffer.Append($t).Append(' ') }
}
Flush

$missingPurpose = $entries | Where-Object { $_.Body -notmatch '(?i)USE WHEN' }
$missingWhat = $entries | Where-Object { ($_.Body -split '(?i)USE WHEN')[0].Trim().Length -lt 20 }
$attrLeak = $entries | Where-Object { $_.Body -match '(?i)data-cb-' }
$tooLong = $entries | Where-Object { $_.Body.Length -gt 800 }

# A dictated error message must be taught as ERROR COMPOSITION (Prefix + List + Postfix), never as an
# invented message attribute — this is the wiring that made the assistant emit "data-cb-Message".
$blacklist = $entries | Where-Object { $_.Id -eq 'HTML.Input.Blacklist' }
$blacklistWiring =
  -not (
    $blacklist -and
    $blacklist.Body -match '(?i)Prefix' -and
    $blacklist.Body -match '(?i)Postfix' -and
    $blacklist.Body -match '(?i)ShowBlacklist' -and
    # ... and the wiring must be CONDITIONAL: without a dictated message nothing is configured.
    $blacklist.Body -match '(?i)built-in message')
$junk =
  $entries | Where-Object {
    $_.Body -match '(?i)\bfrom\.\s*$' -or
    $_.Body -match '\s\.\s*$' -or
    $_.Body -match '(?i)\bthe requested years\.' -or
    $_.Body -match '(?i)\belement-id\.'
  }

'=== PASS-1 CATALOG AUDIT ==='
('entries                       : {0}' -f $entries.Count)
('bodies total                  : {0} chars' -f (($entries | ForEach-Object { $_.Body.Length } | Measure-Object -Sum).Sum))
('preamble + headings (approx.) : {0} chars' -f (($lines -join "`n").Length - (($entries | ForEach-Object { $_.Body.Length } | Measure-Object -Sum).Sum)))
''
('MISSING "USE WHEN"            : {0}' -f @($missingPurpose).Count)
$missingPurpose | ForEach-Object { ('  {0,-9} {1}' -f $_.Group, $_.Id) }
''
('MISSING "what it does"        : {0}' -f @($missingWhat).Count)
$missingWhat | ForEach-Object { ('  {0,-9} {1}' -f $_.Group, $_.Id) }
''
('ATTRIBUTE LEAK (data-cb-)    : {0}' -f @($attrLeak).Count)
$attrLeak | ForEach-Object { ('  {0,-9} {1}' -f $_.Group, $_.Id) }
''
('JSDoc JUNK (truncated prose) : {0}' -f @($junk).Count)
$junk | ForEach-Object { ('  {0,-9} {1} :: {2}' -f $_.Group, $_.Id, $_.Body) }
''
('BLACKLIST MESSAGE WIRING     : {0}' -f $(if ($blacklistWiring) { 'MISSING' } else { 'ok' }))
''
('BODY > 800 chars             : {0}' -f @($tooLong).Count)
$tooLong | ForEach-Object { ('  {0,-9} {1} :: {2} chars' -f $_.Group, $_.Id, $_.Body.Length) }

$violations =
  @($missingPurpose).Count + @($missingWhat).Count + @($attrLeak).Count + @($junk).Count +
  $(if ($blacklistWiring) { 1 } else { 0 })
''
if ($violations -gt 0) { ('RESULT: {0} violation(s)' -f $violations); exit 1 }
'RESULT: OK - every entry states what it does and when to apply it, with no build syntax.'
