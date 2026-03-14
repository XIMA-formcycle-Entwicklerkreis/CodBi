$file = "c:\Users\callari\Git\CodBi-Dev\src\main\kotlin\com\github\xima_formcycle_entwicklerkreis\fc\plugin\codbi\logic\cb\ai\llama\Standard.kt"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$lf = if ($content.Contains("`r`n")) { "`r`n" } else { "`n" }
$lines = [System.Collections.ArrayList]@($content -split "`r?`n")
Write-Output "Original line count: $($lines.Count)"

# ============================================================
# STEP 1: Extract readPluginProperties() from initialize()
# ============================================================
# Find the region markers
$readPropsStart = -1
$readPropsEnd = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '// region Read external AI properties') { $readPropsStart = $i }
    if ($lines[$i] -match '// endregion Read external AI properties') { $readPropsEnd = $i; break }
}
Write-Output "readPluginProperties region: lines $readPropsStart-$readPropsEnd"

# Extract the property-reading lines (between the markers, exclusive)
$propLines = @()
for ($i = $readPropsStart + 1; $i -lt $readPropsEnd; $i++) {
    $propLines += $lines[$i]
}

# Replace the region in initialize() with a single call
$removeCount = $readPropsEnd - $readPropsStart + 1
$lines.RemoveRange($readPropsStart, $removeCount)
$lines.Insert($readPropsStart, "    readPluginProperties(configData)")
Write-Output "  Replaced $removeCount lines with readPluginProperties() call"

# Now find where to insert the new method -- right before initialize()
$initLine = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*override fun initialize\(configData: IPluginInitializeData\)') { $initLine = $i; break }
}
# Find the KDoc start above initialize
$docStart = $initLine
for ($i = $initLine - 1; $i -ge 0; $i--) {
    if ($lines[$i] -match '^\s*/\*\*') { $docStart = $i; break }
}

$newMethod = @()
$newMethod += "  /** Reads all `$PROP_PREFIX`-prefixed plugin properties into fields. */"
$newMethod += "  private fun readPluginProperties(configData: IPluginInitializeData) {"
foreach ($l in $propLines) { $newMethod += $l }
$newMethod += "  }"
$newMethod += ""

$lines.InsertRange($docStart, $newMethod)
Write-Output "  Inserted readPluginProperties() method ($($newMethod.Count) lines) before initialize()"

# ============================================================
# STEP 2: Split execute() into 3 handler methods
# ============================================================
# Find execute() method
$execLine = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*override fun execute\(params: IPluginServletActionParams\)') { $execLine = $i; break }
}
# Find KDoc start above execute
$execDocStart = $execLine
for ($i = $execLine - 1; $i -ge 0; $i--) {
    if ($lines[$i] -match '^\s*/\*\*') { $execDocStart = $i; break }
}
# Find the end of execute - look for "// endregion Servlet execute" or "// endregion Servlet-Execution"
$execEnd = -1
for ($i = $execLine; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*// endregion Servlet') { $execEnd = $i; break }
}
Write-Output "execute() region: lines $execDocStart-$execEnd"

# Extract the full execute block
$execBlock = @()
for ($i = $execDocStart; $i -le $execEnd; $i++) {
    $execBlock += $lines[$i]
}

# Now find key boundaries within execute (relative to $execLine)
# 1. Stream poll: from "val pollId =" to just before "val isHealthCheck ="
# 2. Health check: from "val isHealthCheck =" to just before "log(LogLevel.INFO, "Processing VQA request")"
# 3. New question: everything after health check to the closing brace

$pollIdLine = -1
$healthCheckLine = -1
$processingLine = -1
$streamReturnLine = -1  # the closing brace+return of the stream-poll block

for ($i = $execLine; $i -le $execEnd; $i++) {
    if ($lines[$i] -match '^\s*val pollId\s*=') { $pollIdLine = $i }
    if ($lines[$i] -match '^\s*val isHealthCheck\s*=') { $healthCheckLine = $i }
    if ($lines[$i] -match 'Processing VQA request') { $processingLine = $i }
}
Write-Output "  pollId at $pollIdLine, isHealthCheck at $healthCheckLine, processing at $processingLine"

# Find the closing brace of the if(pollId != null) block - it's the line before isHealthCheck
# Find last "}" before healthCheckLine that closes the pollId block
$pollEndBrace = $healthCheckLine - 1
while ($pollEndBrace -gt $pollIdLine -and $lines[$pollEndBrace].Trim() -eq '') { $pollEndBrace-- }
Write-Output "  Poll block ends at $pollEndBrace"

# Find the closing brace+return of health check block - it's the line before processingLine  
# We need the "return gsonResponse(healthResponse)" and closing brace before "log(...Processing VQA"
$healthEndBrace = $processingLine - 1
while ($healthEndBrace -gt $healthCheckLine -and $lines[$healthEndBrace].Trim() -eq '') { $healthEndBrace-- }
Write-Output "  Health block ends at $healthEndBrace"

# Find the final gsonResponse(finalResults) and closing brace of execute
$execCloseBrace = -1
for ($i = $execEnd - 1; $i -gt $processingLine; $i--) {
    if ($lines[$i].Trim() -eq '}') { $execCloseBrace = $i; break }
}
Write-Output "  execute() closing brace at $execCloseBrace"

# Build the new execute() + 3 handler methods
$newExec = @()
$newExec += "  // region Servlet-Execution"
$newExec += "  /**"
$newExec += "   * Routes incoming requests to one of three handlers:"
$newExec += "   * 1. [handleStreamPoll] -- returns the current state of an in-flight streaming session."  
$newExec += "   * 2. [handleHealthCheck] -- returns server readiness, model info, and resource status."
$newExec += "   * 3. [handleNewQuestion] -- processes a new question (streaming or synchronous)."
$newExec += "   */"
$newExec += "  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {"
$newExec += "    val pollId ="
$newExec += "        params.headerMap.entries.find { it.key.equals(`"X-Stream-Poll`", ignoreCase = true) }?.value"
$newExec += ""
$newExec += "    if (pollId != null) return handleStreamPoll(pollId, params)"
$newExec += ""
$newExec += "    val isHealthCheck ="
$newExec += "        params.headerMap.entries.any {"
$newExec += "          it.key.equals(`"X-Health-Check`", ignoreCase = true) &&"
$newExec += "              it.value.equals(`"true`", ignoreCase = true)"
$newExec += "        }"
$newExec += ""
$newExec += "    if (isHealthCheck) return handleHealthCheck()"
$newExec += ""
$newExec += "    return handleNewQuestion(params)"
$newExec += "  }"
$newExec += ""

# ---- handleStreamPoll ----
$newExec += "  /**"
$newExec += "   * Returns the current state of an in-flight streaming session identified by [pollId]."
$newExec += "   * Handles stop requests via `X-Stream-Stop` header."
$newExec += "   */"
$newExec += "  private fun handleStreamPoll("
$newExec += "      pollId: String,"  
$newExec += "      params: IPluginServletActionParams"
$newExec += "  ): IPluginServletActionRetVal {"

# The stream poll body: from after "if (pollId != null) {" up to the closing "}"
# Find "if (pollId != null) {" line
$pollIfLine = -1
for ($i = $pollIdLine; $i -lt $healthCheckLine; $i++) {
    if ($lines[$i] -match 'if \(pollId != null\)') { $pollIfLine = $i; break }
}

# Extract everything from pollIfLine+1 (skip the "if" and "{") to pollEndBrace-1 (skip closing "}")
# First, find the opening brace of the if block
$pollBodyStart = $pollIfLine + 1
# Skip to the first "cleanupStaleSessions()" line
for ($i = $pollBodyStart; $i -lt $pollEndBrace; $i++) {
    if ($lines[$i].Trim() -ne '' -and $lines[$i].Trim() -ne '{') { $pollBodyStart = $i; break }
}

for ($i = $pollBodyStart; $i -lt $pollEndBrace; $i++) {
    # Reduce indentation by 2 spaces (the if block indentation)
    $line = $lines[$i]
    if ($line.Length -ge 6 -and $line.StartsWith("      ")) {
        $newExec += "    " + $line.Substring(6)
    } else {
        $newExec += $line
    }
}
$newExec += "  }"
$newExec += ""

# ---- handleHealthCheck ----
$newExec += "  /**"
$newExec += "   * Returns server readiness status, model info, and optional thinking-model state."
$newExec += "   */"
$newExec += "  private fun handleHealthCheck(): IPluginServletActionRetVal {"

# The health check body: from after "if (isHealthCheck) {" to the closing "}"
$healthIfLine = -1
for ($i = $healthCheckLine; $i -lt $processingLine; $i++) {
    if ($lines[$i] -match 'if \(isHealthCheck\)') { $healthIfLine = $i; break }
}
$healthBodyStart = $healthIfLine + 1
for ($i = $healthBodyStart; $i -le $healthEndBrace; $i++) {
    if ($lines[$i].Trim() -ne '' -and $lines[$i].Trim() -ne '{') { $healthBodyStart = $i; break }
}

for ($i = $healthBodyStart; $i -lt $healthEndBrace; $i++) {
    $line = $lines[$i]
    if ($line.Length -ge 6 -and $line.StartsWith("      ")) {
        $newExec += "    " + $line.Substring(6)
    } else {
        $newExec += $line
    }
}
$newExec += "  }"
$newExec += ""

# ---- handleNewQuestion ----
$newExec += "  /**"
$newExec += "   * Processes a new question: collects images, detects language, builds the prompt, and either"
$newExec += "   * streams the response (background thread + poll UUID) or returns it synchronously."
$newExec += "   */"
$newExec += "  private fun handleNewQuestion(params: IPluginServletActionParams): IPluginServletActionRetVal {"

# Body: from the "log(...Processing VQA..." line to execCloseBrace-1
for ($i = $processingLine; $i -lt $execCloseBrace; $i++) {
    $line = $lines[$i]
    # These lines are already at 4-space indentation, which is correct for a method body
    $newExec += $line
}
$newExec += "  }"
$newExec += ""
$newExec += "  // endregion Servlet-Execution"

# Replace the entire execute region
$removeCount2 = $execEnd - $execDocStart + 1
$lines.RemoveRange($execDocStart, $removeCount2)
$lines.InsertRange($execDocStart, $newExec)
Write-Output "  Replaced execute() region ($removeCount2 lines) with router + 3 handlers ($($newExec.Count) lines)"

# Write back
$result = $lines -join $lf
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $result, $utf8NoBom)
Write-Output "Done. New line count: $($lines.Count)"
