$path = "src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIFormAssistant.kt"
$lines = Get-Content -Path $path -Encoding UTF8

$rethinkReplacement = @'
        val rethinkSystemPrompt = loadCodbiRethinkPrompt()
'@

$applyReplacement = @'
        val applySystemPrompt = loadCodbiApplyPrompt()
'@

$helperMethods = @'

  /**
   * Loads the CodBi rethink (blind pass) prompt from the database.
   */
  private fun loadCodbiRethinkPrompt(): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_RETHINK_PROMPT
    try {
      val categories = PromptLoader.loadCategory(em, "codbi")
      return PromptLoader.resolvePlaceholders(
        (categories["codbi.standard_configurations"] ?: "") + "\n" +
        (categories["codbi.functionalities"] ?: "") + "\n" +
        (categories["codbi.general"] ?: "") + "\n" +
        "{{CODBI_FULL_SECTION}}"
      )
    } catch (e: Exception) {
      logger.warn("[AIFormAssistant] Failed to load rethink prompt", e)
      return FALLBACK_RETHINK_PROMPT
    } finally {
      em?.close()
    }
  }

  /**
   * Loads the CodBi apply (pass-2) prompt from the database.
   */
  private fun loadCodbiApplyPrompt(): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_APPLY_PROMPT
    try {
      val categories = PromptLoader.loadCategory(em, "codbi")
      return PromptLoader.resolvePlaceholders(
        (categories["codbi.standard_configurations"] ?: "") + "\n" +
        (categories["codbi.functionalities"] ?: "") + "\n" +
        (categories["codbi.element_placeholders"] ?: "") + "\n" +
        (categories["codbi.general"] ?: "") + "\n" +
        "{{CODBI_FULL_SECTION}}"
      )
    } catch (e: Exception) {
      logger.warn("[AIFormAssistant] Failed to load apply prompt", e)
      return FALLBACK_APPLY_PROMPT
    } finally {
      em?.close()
    }
  }

  companion object {
    private const val FALLBACK_RETHINK_PROMPT =
      "You are a CodBi form element configurator. Review the form elements and apply " +
      "relevant CodBi functionalities (data-cb-func, CSS classes)."

    private const val FALLBACK_APPLY_PROMPT =
      "You are a CodBi form element configurator. Apply the listed CodBi functionalities " +
      "to the appropriate form elements with correct data-cb-* parameters."
  }
'@

# Track changes
$changes = 0

# Replacement 1: rethinkSystemPrompt - find "val rethinkSystemPrompt =" and replace the assignment
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'val rethinkSystemPrompt =$') {
        # Find the line after the string concatenation where CodbiCapabilities.buildFullSection is called
        $endIdx = -1
        for ($j = $i + 1; $j -lt [Math]::Min($i + 300, $lines.Count); $j++) {
            if ($lines[$j] -match 'CodbiCapabilities\.buildFullSection\(\)') {
                $endIdx = $j
                break
            }
        }
        if ($endIdx -gt 0) {
            Write-Host "rethinkSystemPrompt: lines $i to $endIdx"
            $lines[$i] = $rethinkReplacement
            # Remove lines between i+1 and endIdx
            $removeCount = $endIdx - $i
            for ($r = 0; $r -lt $removeCount; $r++) {
                $lines.RemoveAt($i + 1)
            }
            $changes++
            break
        }
    }
}

# Replacement 2: applySystemPrompt - find "val applySystemPrompt ="
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'val applySystemPrompt =$') {
        $endIdx = -1
        for ($j = $i + 1; $j -lt [Math]::Min($i + 300, $lines.Count); $j++) {
            if ($lines[$j] -match 'CodbiCapabilities\.buildFullSection\(\)') {
                $endIdx = $j
                break
            }
        }
        if ($endIdx -gt 0) {
            Write-Host "applySystemPrompt: lines $i to $endIdx"
            $lines[$i] = $applyReplacement
            $removeCount = $endIdx - $i
            for ($r = 0; $r -lt $removeCount; $r++) {
                $lines.RemoveAt($i + 1)
            }
            $changes++
            break
        }
    }
}

# Now remove the old companion object (FALLBACK_FORM_SYSTEM_PROMPT) and add new helper methods
# First, find the existing companion object
$companionStart = -1
$companionEnd = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'companion object \{') {
        $companionStart = $i
    }
    if ($companionStart -ge 0 -and $lines[$i] -match '^\}') {
        $companionEnd = $i
        break
    }
}

if ($companionStart -ge 0 -and $companionEnd -ge 0) {
    Write-Host "Companion object: lines $companionStart to $companionEnd"
    # Remove the old companion object
    for ($r = 0; $r -le ($companionEnd - $companionStart); $r++) {
        $lines.RemoveAt($companionStart)
    }
    # Insert new helper methods at $companionStart
    $helperLines = $helperMethods -split "`r`n"
    for ($r = 0; $r -lt $helperLines.Count; $r++) {
        $lines.Insert($companionStart + $r, $helperLines[$r])
    }
    $changes++
}

Write-Host "Changes made: $changes"

[System.IO.File]::WriteAllLines([System.IO.Path]::GetFullPath($path), $lines)
Write-Host "Done. Total lines: $($lines.Count)"
