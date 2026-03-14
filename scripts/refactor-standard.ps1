$file = "c:\Users\callari\Git\CodBi-Dev\src\main\kotlin\com\github\xima_formcycle_entwicklerkreis\fc\plugin\codbi\logic\cb\ai\llama\Standard.kt"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$lf = if ($content.Contains("`r`n")) { "`r`n" } else { "`n" }
$lines = [System.Collections.ArrayList]@($content -split "`r?`n")
Write-Output "Original line count: $($lines.Count)"

function Find-LineIndex([string]$pattern, [int]$fromLine = 0) {
    for ($i = $fromLine; $i -lt $script:lines.Count; $i++) {
        if ($script:lines[$i] -match $pattern) { return $i }
    }
    throw "Pattern not found: $pattern"
}

function Do-Replace([string]$regionName, [string]$body) {
    $startPattern = '^\s*// region ' + [regex]::Escape($regionName) + '\s*$'
    $endPattern   = '^\s*// endregion ' + [regex]::Escape($regionName) + '\s*$'
    $s = Find-LineIndex $startPattern
    $e = Find-LineIndex $endPattern
    $count = $e - $s + 1
    $script:lines.RemoveRange($s, $count)
    $newLines = ("  // region $regionName", $body, "  // endregion $regionName") -join $lf
    $insertLines = $newLines -split "`r?`n"
    $script:lines.InsertRange($s, $insertLines)
    Write-Output "  $regionName : removed $count lines, inserted $($insertLines.Count) lines"
}

# Process bottom-to-top

# 7. Chat Completion
$b = @"
  /** Delegates to [ChatCompletionService]. */
  private fun chatCompletion(
      messagesJson: String,
      enableThinking: Boolean = false,
      idSlot: Int = -1,
      maxThinkingTokens: Int? = null
  ): String =
      chatCompletionService!!.chatCompletion(messagesJson, enableThinking, idSlot, maxThinkingTokens)

  /** Delegates to [ChatCompletionService]. */
  private fun streamChatCompletion(
      messagesJson: String,
      session: StreamingSession,
      enableThinking: Boolean = false,
      idSlot: Int = -1
  ) = chatCompletionService!!.streamChatCompletion(messagesJson, session, enableThinking, idSlot)
"@
Do-Replace "Chat Completion" $b

# 6. External AI HTTP
Do-Replace "External AI HTTP" "  // Extracted to ExternalAiClient -- injected into ChatCompletionService as lambdas."

# 5. Message Building
$b = @"
  /** Delegates to [MessageBuilder]. */
  private fun buildMessages(
      question: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      searchEnabled: Boolean = true,
      enableThinking: Boolean = false,
      detectedLang: DetectedLanguage? = null,
      locationEnabled: Boolean = false,
      userLocation: String? = null
  ): String =
      messageBuilder!!.buildMessages(
          question, imageParts, chatHistory, searchEnabled, enableThinking, detectedLang,
          locationEnabled, userLocation)
"@
Do-Replace "Message Building" $b

# 4. Web Search Tool
$b = @"
  /** Delegates to [WebSearchHandler]. */
  private fun handleSearchToolCall(
      initialAnswer: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      enableThinking: Boolean,
      slotId: Int,
      detectedLang: DetectedLanguage? = null,
      userLocation: String? = null
  ): String =
      webSearchHandler!!.handleSearchToolCall(
          initialAnswer, originalQuestion, imageParts, chatHistory, enableThinking, slotId,
          detectedLang, userLocation)

  /** Delegates to [WebSearchHandler]. */
  private fun handleSearchToolCallStreaming(
      fullText: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      session: StreamingSession,
      enableThinking: Boolean,
      slotId: Int,
      detectedLang: DetectedLanguage? = null,
      userLocation: String? = null
  ) = webSearchHandler!!.handleSearchToolCallStreaming(
      fullText, originalQuestion, imageParts, chatHistory, session, enableThinking, slotId,
      detectedLang, userLocation)
"@
Do-Replace "Web Search Tool" $b

# 3. Thinking Model Server
Do-Replace "Thinking Model Server" "  // Extracted to ThinkingServerManager -- see ThinkingServerManager.kt"

# 2. Resource Monitoring
Do-Replace "Resource Monitoring" "  // Extracted to standalone ResourceMonitor class -- see ResourceMonitor.kt"

# 1. Token Streaming Infrastructure
$b = @"
  // StreamingSession is now a standalone class -- see StreamingSession.kt

  /**
   * Active streaming sessions, keyed by UUID. Cleaned up on completion or after TTL (5 min normal,
   * 10 min thinking).
   */
  private val streamingSessions = ConcurrentHashMap<String, StreamingSession>()

  /** Removes streaming sessions past their TTL: 5 min for normal, 10 min for thinking mode. */
  private fun cleanupStaleSessions() {
    val now = System.currentTimeMillis()

    streamingSessions.entries.removeIf {
      val ttl = if (it.value.enableThinking) 10 * 60 * 1000L else 5 * 60 * 1000L

      it.value.startTime + ttl < now
    }
  }
"@
Do-Replace "Token Streaming Infrastructure" $b

# Write back
$result = $lines -join $lf
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $result, $utf8NoBom)
Write-Output "Done. New line count: $($lines.Count)"
