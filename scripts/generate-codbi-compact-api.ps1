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

function Get-AllDocBlocks {
  # Returns all /** ... */ blocks as an array of cleaned doc strings.
  param([string]$Content)
  $blocks = @()
  foreach ($m in [regex]::Matches($Content, "(?s)/\*\*(.*?)\*/")) {
    $raw = $m.Groups[1].Value
    $lines = $raw -split "`r?`n" | ForEach-Object { ($_ -replace "^\s*\*\s?", "").TrimEnd() }
    $blocks += ,($lines -join "`n")
  }
  return $blocks
}

function Get-BestDescription {
  # Returns the best one-sentence description from the file.
  # Priority: (1) JSDoc block immediately before functionality()/retrieve() static method,
  #           (2) first non-stub JSDoc block,
  #           (3) first non-empty description.
  param([string]$FileContent)
  # Priority 1: JSDoc directly before the core static method
  $coreMatch = [regex]::Match($FileContent, "(?s)/\*\*(.*?)\*/\s*(?:public\s+)?static\s+(?:functionality|retrieve)\s*\(")
  if ($coreMatch.Success) {
    $raw = $coreMatch.Groups[1].Value
    $lines = $raw -split "`r?`n" | ForEach-Object { ($_ -replace "^\s*\*\s?", "").TrimEnd() }
    $d = Get-ElementDescription ($lines -join "`n")
    if ($d) { return $d }
  }
  # Priority 2: first non-stub JSDoc block
  $stubPattern = "^(Provides the |Registers the |Extended |A single |The type of )"
  $blocks = Get-AllDocBlocks $FileContent
  foreach ($block in $blocks) {
    $d = Get-ElementDescription $block
    if ($d -and $d -notmatch $stubPattern) {
      return $d
    }
  }
  # Priority 3: any description
  foreach ($block in $blocks) {
    $d = Get-ElementDescription $block
    if ($d) { return $d }
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

function Get-AllConfigParamHints {
  # Scans every /** ... */ block in the full file content for Config Parameter hints,
  # so method-level docs are captured even when the class-level doc has none.
  param([string]$FileContent)
  $combined = ""
  foreach ($m in [regex]::Matches($FileContent, "(?s)/\*\*(.*?)\*/")) {
    $raw = $m.Groups[1].Value
    $lines = $raw -split "`r?`n" | ForEach-Object { ($_ -replace "^\s*\*\s?", "").TrimEnd() }
    $combined += "`n" + ($lines -join "`n")
  }
  return Get-ConfigParamHints $combined
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

# BEGIN: GENERIC AI GUIDANCE FOR REFERENCING FORM ELEMENTS
# This preamble applies to every CSS-selector parameter below.
# Reason: In repeatable containers, element IDs are mangled/duplicated.
# CodBi's pattern always searches within the shared parent container
# (e.g., parentElement.parentElement.querySelector(...)), so only
# selectors based on the element's properties.name work reliably.
[void]$sb.AppendLine("### GENERIC RULE for all CSS-Selector parameters below")
[void]$sb.AppendLine("When a parameter below requires a CSS-Selector referencing another form element,")
[void]$sb.AppendLine("ALWAYS use the target element's properties.name value prefixed with a dot '.' (e.g., '.tfInterviewBis' or '.taAddress').")
[void]$sb.AppendLine("NEVER use an ID selector (# prefix, e.g., '#xi-tf-interviewbis'), because")
[void]$sb.AppendLine("element IDs are mangled in repeatable containers; only properties.name-based selectors work reliably")
[void]$sb.AppendLine("when CodBi searches within the shared parent container.")
[void]$sb.AppendLine("")

# Human-authored applicability descriptions that override auto-generated ones.
# These tell the AI *when* and *where* each CodBi element should be applied.
$compactDescOverrides = @{
  "Time.Frame"           = "Applicable ONLY on the BEGIN (minimum) XTextField of type 'time' when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element."
  "Date.Frame"           = "Applicable ONLY on the BEGIN (minimum) XTextField of type 'date' when there is a second related end date field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end date element."
  "Date.Min"             = "Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates)."
  "Date.NoWeekends"      = "Applicable on a XTextField of type 'date' to disallow weekend dates."
  "HTML.Input.REGEX"     = "Applicable on a XTextField to validate or reformat the typed value against a regular expression pattern."
  "HTML.Input.Cleave"    = "Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js."
  "OpenPLZ.Autocomplete" = "Applicable on every XTextField (input type=text) within a group of related address fields (postal code, locality/city, street, building number). Tag EACH address field with this functionality and set its own parameters individually. For every tagged field: set TargetData to match its type (Localities, PostalCodes, or Streets), set Country. On the STREET field only: set DependentPLZ to reference the postal code field and DependentLocality to reference the locality/city field. On the POSTAL CODE and LOCALITY fields: set Dependent as the CSS class selector of the corresponding field that gets filled automatically (e.g., on a postal code field set Dependent to the locality field, on a locality field set Dependent to the postal code field). On POSTAL CODE and LOCALITY fields: set FocusOnAutocomplete to the street field. On the STREET field: set FocusOnAutocomplete to the building number field, if one exists."
  "Form.Navigator"       = "Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms."
  "HTML.CSS"             = "Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements)."
  "HTML.Panel.Accordion" = "Applicable on a container (XContainer/XFieldSet) that wraps multiple collapsible panels. Joins all child panels with the .CodBi.--HTML_Panel class into an accordion group where only one panel can be open at a time. Set the data-cb-Accordion parameter to a unique group name."
  "HTML.Panel"           = "Applicable on any element to wrap it in a collapsible accordion/panel widget. CRITICAL: \"Standard-Panel\" means creating an XFieldSet (fieldset) with CSS class CodBi_HTML_Panel_Standard and a \"legend\" property for the title. Do NOT use XContainer for standard panels — panels on XFieldSet use CSS classes, panels on XContainer use data-cb-func=html.panel."
  "HTML.SETAttribute"    = "Applicable on any element to dynamically set one or more HTML attributes on it."
  "HTML.Text.Injector"   = "Applicable on any element to inject a dynamic text value into a specific property of that element."
  "HTML.Text.Mapper"     = "Applicable on any element to map object properties to named placeholders in a text template."
  "JSON.SET"             = "Applicable on a hidden field to store a JSON-serialized value derived from another element."
  "LDAP.Autocomplete"    = "Applicable on a text input that should autocomplete entries from an LDAP directory search."
  "LDAP.Autocomplete.Set"= "Applicable on form fields that should be auto-filled from a selected LDAP directory match."
  "Matomo.Tracking"      = "Applicable on any form to add Matomo/Piwik analytics event tracking."
  "Media.Image.Cropper"  = "Applicable on an XUpload field for images; adds an interactive crop dialog before upload."
  "MEDIA.INPUT.SPEECH"   = "Applicable on a text input field to enable speech-to-text dictation via the Web Speech API."
  "MEDIA.INPUT.SPEECH.WHISPER" = "Applicable on a text input field or textarea to enable speech-to-text dictation via a self-hosted Whisper model on the Formcycle server. DSGVO/GDPR-compliant as no audio data leaves the server."
  "Print.Remove"         = "Applicable on any element that should be invisible when the form is printed."
  "Sys.Log.Console"      = "Applicable for debugging; logs CodBi runtime data to the browser developer console."
  "AI.OCR"               = "Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR."
  "AI.LLAMA.CHAT"        = "Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings)."
}

# Parameter-level hints that override auto-extracted JSDoc descriptions.
# Critical for guiding the AI to use correct CSS class selectors (dot-prefixed) rather than
# ID selectors (hash-prefixed) when referencing other form elements by their name.
# In repeatable containers, IDs are mangled — only class-based selectors work reliably
# since CodBi searches within the nearest shared parent container.
$paramDescOverrides = @{
  # Time/Date frame - reference maximum field
  "Time.Frame.MaxField" = "CSS-Class-Selector for the max time input (e.g., '.tfInterviewBis'). Use the target element's name as a dot-prefixed CSS class. Do NOT use an ID selector (hash prefix), as IDs break in repeatable containers."
  "Date.Frame.MaxField" = "CSS-Class-Selector for the max date input (e.g., '.tfInterviewBis'). Use the target element's name as a dot-prefixed CSS class. Do NOT use an ID selector (hash prefix), as IDs break in repeatable containers."
  # HTML.CSS - destination element for CSS injection
  "HTML.CSS.Destination" = "CSS-Class-Selector of the destination element (e.g., '.tfHeadline'). Use a dot-prefixed class selector based on the target element's name. Do NOT use an ID selector."
  # Media.Image.Cropper - references to UI/form elements
  "Media.Image.Cropper.Container" = "CSS-Class-Selector for the container element (e.g., '.divCropperBoard'). Use dot-prefixed class selector. Do NOT use an ID selector."
  "Media.Image.Cropper.File" = "CSS-Class-Selector for the file input (e.g., '.fuUpload'). Use dot-prefixed class selector. Do NOT use an ID selector."
  "Media.Image.Cropper.Target" = "CSS-Class-Selector for the target image element (e.g., '.imgCropped'). Use dot-prefixed class selector. Do NOT use an ID selector."
  "Media.Image.Cropper.Updater" = "CSS-Class-Selector for the update button (e.g., '.btnUpdate'). Use dot-prefixed class selector. Do NOT use an ID selector."
  # Print.Remove - selector for element to remove
  "Print.Remove.DocumentSelector" = "CSS-Class-Selector for the element to remove (e.g., '.divPrintSection'). Use dot-prefixed class selector based on the target element's name. Do NOT use an ID selector."
  # AI.OCR - field to receive OCR output
  "AI.OCR.Field" = "CSS-Class-Selector for the field receiving the OCR output (e.g., '.tfExtractedText'). Use dot-prefixed class selector based on the target element's name. Do NOT use an ID selector."
  # OpenPLZ.Autocomplete - address field cross-references
  "OpenPLZ.Autocomplete.TargetData" = "Defines what type of data is being autocompleted: 'Localities' (city/town), 'PostalCodes' (ZIP/PLZ), or 'Streets'. Pick the one that matches the tagged field's purpose."
  "OpenPLZ.Autocomplete.Country" = "Country code for address data: de (Germany), at (Austria), li (Liechtenstein), ch (Switzerland), or en (England)."
  "OpenPLZ.Autocomplete.AllowEmpty" = "If set to 'true', an empty input value won't trigger an error message."
  "OpenPLZ.Autocomplete.MsgNotKnown" = "Message to show when the entered value is not found in the OpenPLZ database."
  "OpenPLZ.Autocomplete.CSSProposals" = "CSS style for the proposals popup appearing when there are multiple matches."
  "OpenPLZ.Autocomplete.Dependent" = "CSS-Class-Selector of the field that gets automatically filled when an autocomplete selection is made. For postal code fields: set to the locality field (e.g., '.tfCity'). For locality fields: set to the postal code field (e.g., '.tfPLZ'). Do NOT use on the street field. Do NOT use an ID selector."
  "OpenPLZ.Autocomplete.DependentPLZ" = "CSS-Class-Selector referencing the postal-code field in the same address group (e.g., '.tfPLZ'). Set this on each tagged field when a postal code field exists in the group. Do NOT use an ID selector."
  "OpenPLZ.Autocomplete.DependentLocality" = "CSS-Class-Selector referencing the locality/city field in the same address group (e.g., '.tfCity'). Set this on each tagged field when a locality/city field exists in the group. Can be set together with DependentPLZ when both exist. Do NOT use an ID selector."
  "OpenPLZ.Autocomplete.FocusOnAutocomplete" = "CSS-Class-Selector of the field to focus after an autocomplete selection. On POSTAL CODE and LOCALITY fields: set to the street field (e.g., '.tfStreet'). On the STREET field: set to the building number field if one exists (e.g., '.tfBuildingNumber'). Do NOT use an ID selector."
}

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
  $desc = if ($compactDescOverrides.ContainsKey($id)) {
    $compactDescOverrides[$id]
  } else {
    $d = Get-BestDescription $ts
    if (-not $d) { "Executes this functionality on tagged form elements." } else { $d }
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

  $paramHints = Get-AllConfigParamHints $ts
  $entryParams = [ordered]@{}
  if ($paramKeys.Count -eq 0) {
    [void]$sb.AppendLine("  - Parameters: none.")
  } else {
    foreach ($paramName in $paramKeys) {
      $overrideKey = "${id}.${paramName}"
      $pDesc = if ($paramDescOverrides.ContainsKey($overrideKey)) {
        $paramDescOverrides[$overrideKey]
      } elseif ($paramHints.ContainsKey($paramName)) {
        $paramHints[$paramName]
      } else {
        "Configures '$paramName' for this functionality."
      }
      if ($paramHints.ContainsKey($paramName) -or $paramDescOverrides.ContainsKey($overrideKey)) {
        $entryParams[$paramName] = $pDesc
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
  $idMatch = [regex]::Match($ts, 'registerEP\(\s*"([^"]+)"')
  if (-not $idMatch.Success) { return }

  $id = $idMatch.Groups[1].Value
  $doc = Get-DocBlock $ts
  $docDetail = Get-DocDetail $doc
  $desc = Get-BestDescription $ts
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