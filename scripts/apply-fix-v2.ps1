param([string]$File)

$ErrorActionPreference = "Stop"
$fp = Resolve-Path $File
$c = [System.IO.File]::ReadAllText($fp)
$origLen = $c.Length
Write-Host "Processing: $fp ($origLen bytes)"

# Change 1: Add FC_ENCODE_BASE64/FC_DECODE_BASE64 to the system prompt
# Find the exact text 'Set ''fileName'' to the exact filename as stored in the form''s file section (e.g. "xoxo.txt").\n" +'
# followed by 13 spaces and '"  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +'
# Note: The file uses EM DASH (U+2014) between 'FC_SHOW_TEMPLATE"' and ' renders'

$oldStr = "Set 'fileName' to the exact filename as stored in the form's file section (e.g. `"xoxo.txt`").\n`" +`r`n            `"  - `"FC_SHOW_TEMPLATE`" - renders an HTML template to the user; `" +"

$idx = $c.IndexOf("Set 'fileName' to the exact filename as stored in the form's file section")
if ($idx -lt 0) { Write-Host "ERROR: Pivot not found"; exit 1 }

# Find the FC_SHOW_TEMPLATE line after it
$after = $c.Substring($idx)
$showIdx = $after.IndexOf('FC_SHOW_TEMPLATE')
if ($showIdx -lt 0) { Write-Host "ERROR: FC_SHOW_TEMPLATE not found after pivot"; exit 1 }

# Get the actual characters around the target
$actualLineStart = $after.LastIndexOf("`n", $showIdx) + 1
$actualLineEnd = $after.IndexOf("`n", $showIdx)
$actualLine = $after.Substring($actualLineStart, $actualLineEnd - $actualLineStart)
Write-Host "Line: '$actualLine'"

# Extract the exact opening quote/dash pattern
$lineTrimmed = $actualLine.TrimStart()
Write-Host "Trimmed: '$lineTrimmed'"

# Now replace: find the exact pivot followed by the FC_SHOW_TEMPLATE line
$pivotEnd = $idx + "Set 'fileName' to the exact filename as stored in the form's file section (e.g. `"xoxo.txt`").".Length
$afterPivot = $c.Substring($pivotEnd)
$endOfLine = $afterPivot.IndexOf("`n")
$trailingNewline = $afterPivot.Substring(0, $endOfLine + 1)  # includes \n

# The next line after pivot's \n" + 
$remainder = $afterPivot.Substring($endOfLine + 1)
$endOfNextPart = $remainder.IndexOf('"  - "FC_SHOW_TEMPLATE"')
if ($endOfNextPart -lt 0) { Write-Host "ERROR: FC_SHOW_TEMPLATE line not in remainder"; exit 1 }

$showLineEnd = $remainder.IndexOf("`n", $endOfNextPart)
$showLine = $remainder.Substring(0, $showLineEnd + 1)  # whole line including \n

Write-Host "Pivot trailing: '$($trailingNewline.Replace("`n",'\n').Replace("`r",'\r'))'"
Write-Host "Show line: '$($showLine.TrimEnd() -replace '"','\"')'"

# Build the replacement
$newContent = "Set 'fileName' to the exact filename as stored in the form's file section (e.g. `"xoxo.txt`")." + "`n" + '`" +' + "`n" +
    '            "  - "FC_ENCODE_BASE64" - encodes a file or form upload to Base64; " +' + "`n" +
    '            "nodeParams: {\"file\":\"<filename from form resources, e.g. ''xoxo.txt''>\"}' + "`n" + '`" +' + "`n" +
    '            "  - "FC_DECODE_BASE64" - decodes a Base64-encoded file back to its original format; " +' + "`n" +
    '            "nodeParams: {\"base64\":\"<base64 content>\", \"exportName\":\"<output filename, e.g. ''xoxo.txt''>\"}' + "`n" + '`" +' + "`n" +
    '            "  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +'

# The old content from pivot to end of FC_SHOW_TEMPLATE line
$oldSection = $c.Substring($idx, ($pivotEnd - $idx) + $trailingNewline.Length + $showLine.Length)
$newSection = $newContent

$c2 = $c.Substring(0, $idx) + $newSection + $c.Substring($idx + $oldSection.Length)

if ($c2.Length -ne $c.Length) {
    [System.IO.File]::WriteAllText($fp, $c2)
    Write-Host "Change 1 applied. Bytes changed: $($c2.Length - $origLen)"
} else {
    Write-Host "ERROR: No change made"
}

# Change 2: Verify that the buildNodeParamsJson handler was already added
$count = [System.Text.RegularExpressions.Regex]::Matches($c2, "FC_ENCODE_BASE64").Count
Write-Host "FC_ENCODE_BASE64 occurrences: $count"
