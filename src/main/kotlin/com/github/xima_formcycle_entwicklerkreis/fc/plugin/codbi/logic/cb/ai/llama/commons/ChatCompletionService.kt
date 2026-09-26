package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

// region Imports
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel

// endregion Imports
/**
 * Handles synchronous and streaming chat completion requests. Routes to either a local LLAMA-Server
 * (fast or thinking) or an external OpenAI-compatible API. Includes think-tag filtering, logprob
 * tracking, and repetition detection for streaming responses.
 */
internal class ChatCompletionService(
    private val serverPort: () -> Int,
    private val maxTokens: () -> Int,
    private val isExternalMode: () -> Boolean,
    private val externalUrl: () -> String?,
    private val thinkingServerReady: () -> Boolean,
    private val thinkingServerPort: () -> Int,
    private val localPost: (endpoint: String, body: String, timeoutMs: Int, port: Int) -> String,
    private val localPostStreaming:
        (
            endpoint: String,
            body: String,
            onLine: (String) -> Unit,
            shouldStop: () -> Boolean,
            timeoutMs: Int,
            port: Int) -> Unit,
    private val externalPost: ((endpoint: String, body: String, timeoutMs: Int) -> String)?,
    private val externalPostStreaming:
        ((
            endpoint: String,
            body: String,
            onLine: (String) -> Unit,
            shouldStop: () -> Boolean,
            timeoutMs: Int) -> Unit)?,
    private val injectModelField: ((String) -> String)?,
    private val log: (LogLevel, String) -> Unit,
    private val extraParamsJson: String? = null
) {
  companion object {
    /**
     * Reasoning budget requested from an EXTERNAL, reasoning-capable provider (Cerebras GPT-OSS and
     * friends). `null` (the default) sends nothing and leaves the provider's own default in place.
     *
     * Configured via the plugin property `AI_Assistant_ReasoningEffort` (read by the assistant's
     * `initialize`), which accepts `low` / `medium` / `high` to lower or raise the budget, or `off`
     * (aliases `none`, `disabled`) to ask the provider to skip the reasoning phase entirely. The
     * reasoning tokens are part of the provider's reported `completion_tokens` (the visible answer
     * is only a fraction of what is billed), so this is the lever for the output side of a run.
     * Local llama.cpp servers ignore it (their thinking budget is the `thinking` model routing
     * instead).
     */
    @Volatile var reasoningEffort: String? = null
  }

  init {
    if (isExternalMode()) {
      requireNotNull(externalPost) { "externalPost must be provided when isExternalMode() is true" }
      requireNotNull(externalPostStreaming) {
        "externalPostStreaming must be provided when isExternalMode() is true"
      }
    }
  }

  /**
   * Sends a synchronous chat completion request to the LLAMA-Server or external AI.
   *
   * @param messagesJson The JSON messages array string.
   * @param enableThinking Whether to route to the thinking server (if available).
   * @param idSlot The inference slot ID (`-1` for auto).
   * @param maxThinkingTokens Optional budget for thinking tokens.
   * @param overridePort When non-null, routes to this port (local specialist server) instead of the
   *   default main/thinking server.
   * @param overrideExternalClient When non-null, routes through this external AI client (external
   *   specialist) instead of the default routing.
   * @return The generated text response (with `<think>` tags stripped).
   */
  fun chatCompletion(
      messagesJson: String,
      enableThinking: Boolean = false,
      idSlot: Int = -1,
      maxThinkingTokens: Int? = null,
      overridePort: Int? = null,
      overrideExternalClient: ExternalAiClient? = null,
      overrideMaxTokens: Int? = null,
      // Per-call reasoning-budget override (see [reasoningEffort]). A non-null, non-`default`,
      // non-blank value wins over the companion field; `null`/`default`/blank falls back to it, so
      // every other caller (chat, workflow) keeps today's behaviour.
      reasoningEffort: String? = null,
      // The provider's OWN token counters (llama.cpp `timings`, OpenAI-compatible `usage`),
      // reported back so a caller can record the REAL consumption instead of a chars/4 estimate.
      // The third component is the share of `promptTokens` the provider served from its prompt
      // cache (see [extractUsage]) — 0 for providers that do not report caching.
      onUsage: ((promptTokens: Int, completionTokens: Int, cachedPromptTokens: Int) -> Unit)? = null
  ): String {
    val useExtSpecialist = overrideExternalClient != null
    val external = useExtSpecialist || isExternalMode()
    val useThinkingServer = !external && enableThinking && thinkingServerReady()
    val targetPort = overridePort ?: if (useThinkingServer) thinkingServerPort() else serverPort()
    val currentMaxTokens = maxTokens()
    var requestBody = buildString {
      append("{\"messages\":$messagesJson")

      // For local models, max_tokens is a hard budget. For external APIs we skip it by default so
      // the provider uses its own limit — but callers can force a value via overrideMaxTokens.
      if (!external || overrideMaxTokens != null) {
        val effectiveMaxTokens =
            overrideMaxTokens
                ?: if (enableThinking) {
                  maxThinkingTokens ?: (currentMaxTokens * 4).coerceAtLeast(4096)
                } else currentMaxTokens
        append(",\"max_tokens\":$effectiveMaxTokens")
      }

      append(",\"temperature\":${if (enableThinking) "0.7" else "0.0"}")

      if (!external) append(",\"repetition_penalty\":${if (enableThinking) "1.2" else "1.1"}")
      if (!external) append(",\"frequency_penalty\":${if (enableThinking) "0.3" else "0.5"}")
      if (!external) append(",\"presence_penalty\":${if (enableThinking) "0.6" else "0.0"}")
      append(",\"stream\":false")

      if (!external && idSlot >= 0) append(",\"id_slot\":$idSlot")

      extraParamsJson?.let { json ->
        val inner = json.drop(1).dropLast(1)
        if (inner.isNotBlank()) append(",$inner")
      }

      // Reasoning budget — only meaningful for an external, reasoning-capable provider. See
      // [reasoningEffort]: a level lowers/raises it, `off` asks the provider to skip reasoning.
      if (external) append(reasoningEffortJson(reasoningEffort))

      append("}")
    }

    if (useExtSpecialist) {
      requestBody = overrideExternalClient!!.injectModelField(requestBody)
      requestBody = overrideExternalClient!!.injectExtraParams(requestBody)
    } else if (external) {
      requestBody = injectModelField?.invoke(requestBody) ?: requestBody

      log(LogLevel.INFO, "Routing to external AI: ${externalUrl()}")
    } else if (useThinkingServer) {
      log(LogLevel.INFO, "Routing to thinking server on port ${thinkingServerPort()}")
    }

    val timeoutMs = if (enableThinking) 600_000 else 300_000
    val response =
        if (useExtSpecialist) {
          overrideExternalClient!!.post("/v1/chat/completions", requestBody, timeoutMs)
        } else if (external) {
          externalPost!!("/v1/chat/completions", requestBody, timeoutMs)
        } else {
          localPost("/v1/chat/completions", requestBody, timeoutMs, targetPort)
        }

    return try {
      val json = com.google.gson.JsonParser.parseString(response).asJsonObject
      // Report the authoritative token counts of this call when the server provides them.
      extractUsage(json)?.let { (promptTokens, completionTokens, cachedPromptTokens) ->
        onUsage?.invoke(promptTokens, completionTokens, cachedPromptTokens)
      }
      val message = json.getAsJsonArray("choices")?.get(0)?.asJsonObject?.getAsJsonObject("message")
      var raw = message?.get("content")?.takeIf { it.isJsonPrimitive }?.asString ?: response

      if (useThinkingServer || enableThinking) {
        raw = "<think>$raw"

        var result = stripThinkTags(raw)

        if (result.startsWith("<think>")) result = result.removePrefix("<think>").trimStart()

        result
      } else {
        raw
      }
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Failed to parse completion response: ${e.message}")

      response
    }
  }

  /**
   * The request-body fragment for the reasoning budget, or an empty string when nothing is
   * configured.
   *
   * [requestedEffort] is the per-call override (the assistant's dropdown / a specialist property):
   * when it is non-null and not the UI's `default` sentinel it wins, otherwise the companion field
   * [reasoningEffort] (the global plugin property) is used.
   *
   * The provider is NEVER sent a value it does not support. `low`, `medium` and `high` are the only
   * levels a GPT-OSS-style API accepts, and Cerebras answers anything else with `HTTP 400 …
   * Unsupported reasoning effort: <value>` — which aborts the whole run ("I set the reasoning to
   * none and got an exception"). So the whole "off" family (`off`, `none`, `disabled`, `false`,
   * `aus`, `min`, …) and every other unknown value are coerced to the LOWEST supported level `low`,
   * with a warning so the misconfiguration stays visible. A provider that really offers a "no
   * reasoning at all" switch is configured EXPLICITLY through its extra-parameters property (e.g.
   * `…_ExtraParams_<name>={"disable_reasoning":true}`), which this method does not touch.
   */
  private fun reasoningEffortJson(requestedEffort: String?): String {
    val requested =
        requestedEffort?.trim()?.lowercase()?.takeIf { it.isNotEmpty() && it != "default" }
    val effort =
        requested ?: reasoningEffort?.trim()?.lowercase()?.takeIf { it.isNotEmpty() } ?: return ""
    return when (effort) {
      "low",
      "medium",
      "high" -> ",\"reasoning_effort\":\"$effort\""
      else -> {
        log(
            LogLevel.WARNING,
            "Reasoning effort '$effort' is not supported by the provider — sending the lowest " +
                "level 'low' instead (supported: low, medium, high)")
        ",\"reasoning_effort\":\"low\""
      }
    }
  }

  /**
   * Reads the token counts the SERVER itself reports for a completion, or null when it reports
   * none.
   *
   * Supported shapes: llama.cpp's `timings` (`prompt_n`/`predicted_n`, older builds
   * `tokens_evaluated`/`tokens_predicted`) and the OpenAI-compatible `usage`
   * (`prompt_tokens`/`completion_tokens`, Anthropic-style `input_tokens`/`output_tokens`). These
   * numbers are the only reliable source for the assistant's token counter: the chars/4 estimate
   * under-counts JSON/HTML-heavy prompts noticeably.
   *
   * The third component is how many prompt tokens the provider served from its OWN prompt cache and
   * therefore did not re-bill at the full input price. Providers report this in different places,
   * so both the nested OpenAI/Cerebras shape (`usage.prompt_tokens_details.cached_tokens`) and the
   * flat shapes (Anthropic `cache_read_input_tokens`, DeepSeek `prompt_cache_hit_tokens`) are read.
   * It stays 0 for providers without prompt caching and for llama.cpp's `timings` (which has no
   * such concept).
   */
  private fun extractUsage(json: com.google.gson.JsonObject): Triple<Int, Int, Int>? {
    fun intOf(obj: com.google.gson.JsonObject?, vararg keys: String): Int {
      if (obj == null) return 0
      for (key in keys) {
        val value = obj.get(key)?.takeIf { it.isJsonPrimitive } ?: continue
        val n = runCatching { value.asInt }.getOrDefault(0)
        if (n > 0) return n
      }
      return 0
    }

    /** Cached prompt tokens of a provider `usage` object; 0 when the provider reports none. */
    fun cachedOf(usage: com.google.gson.JsonObject): Int {
      val nested =
          usage
              .get("prompt_tokens_details")
              ?.takeIf { it.isJsonObject }
              ?.asJsonObject
              ?.let { intOf(it, "cached_tokens") } ?: 0
      if (nested > 0) return nested
      return intOf(usage, "cached_tokens", "cache_read_input_tokens", "prompt_cache_hit_tokens")
    }

    json
        .get("usage")
        ?.takeIf { it.isJsonObject }
        ?.asJsonObject
        ?.let { usage ->
          val promptTokens = intOf(usage, "prompt_tokens", "input_tokens")
          val completionTokens = intOf(usage, "completion_tokens", "output_tokens")
          if (promptTokens > 0 || completionTokens > 0) {
            return Triple(promptTokens, completionTokens, cachedOf(usage))
          }
        }
    json
        .get("timings")
        ?.takeIf { it.isJsonObject }
        ?.asJsonObject
        ?.let { timings ->
          val promptTokens = intOf(timings, "prompt_n", "tokens_evaluated")
          val completionTokens = intOf(timings, "predicted_n", "tokens_predicted")
          if (promptTokens > 0 || completionTokens > 0) {
            return Triple(promptTokens, completionTokens, 0)
          }
        }
    return null
  }

  /**
   * Sends a streaming chat completion request. Text chunks are appended to the [session] as they
   * arrive via Server-Sent Events (SSE). Handles `<think>` tag filtering, logprob tracking, and
   * repetition detection.
   *
   * @param messagesJson The JSON messages array string.
   * @param session The [StreamingSession] to populate with chunks.
   * @param enableThinking Whether to route to the thinking server.
   * @param idSlot The inference slot ID (`-1` for auto).
   * @param overridePort When non-null, routes to this port (local specialist server) instead of\n *
   *   the default main/thinking server.
   * @param overrideExternalClient When non-null, routes through this external AI client (external
   *   specialist) instead of the default routing.
   */
  fun streamChatCompletion(
      messagesJson: String,
      session: StreamingSession,
      enableThinking: Boolean = false,
      idSlot: Int = -1,
      overridePort: Int? = null,
      overrideExternalClient: ExternalAiClient? = null,
      // Per-call reasoning-budget override (see [reasoningEffort]); `null`/`default`/blank falls
      // back
      // to the companion field.
      reasoningEffort: String? = null,
      // Streaming providers report their counters in the FINAL chunk (llama.cpp: `timings`,
      // OpenAI-compatible: `usage`) — reported back so a caller can record the real consumption.
      // The third component is the provider's cached-prompt-token counter (0 when it reports none).
      onUsage: ((promptTokens: Int, completionTokens: Int, cachedPromptTokens: Int) -> Unit)? = null
  ) {
    val useExtSpecialist = overrideExternalClient != null
    val external = useExtSpecialist || isExternalMode()
    val useThinkingServer = !external && enableThinking && thinkingServerReady()
    val targetPort = overridePort ?: if (useThinkingServer) thinkingServerPort() else serverPort()
    val currentMaxTokens = maxTokens()
    var insideThinkBlock = enableThinking
    var tagBuffer = ""
    val reasoningAccum = StringBuilder()
    val answerAccum = StringBuilder()
    var repetitionDetected = false
    var requestBody = buildString {
      append("{\"messages\":$messagesJson")
      // max_tokens is a local-model budget — external APIs manage their own token limits
      if (!external) {
        val effectiveMaxTokens =
            if (enableThinking) (currentMaxTokens * 4).coerceAtLeast(4096) else currentMaxTokens
        append(",\"max_tokens\":$effectiveMaxTokens")
      }

      append(",\"temperature\":${if (enableThinking) "0.7" else "0.6"}")

      if (!external) append(",\"repetition_penalty\":${if (enableThinking) "1.2" else "1.1"}")
      if (!external) append(",\"frequency_penalty\":${if (enableThinking) "0.3" else "0.5"}")
      if (!external) append(",\"presence_penalty\":${if (enableThinking) "0.6" else "0.0"}")
      append(",\"stream\":true")
      if (!external) append(",\"logprobs\":true")

      if (!external && idSlot >= 0) append(",\"id_slot\":$idSlot")

      extraParamsJson?.let { json ->
        val inner = json.drop(1).dropLast(1)
        if (inner.isNotBlank()) append(",$inner")
      }

      // Reasoning budget of the streaming call (see [reasoningEffort]) — the chat popup goes
      // through
      // this path, the build passes through the synchronous one above.
      if (external) append(reasoningEffortJson(reasoningEffort))

      append("}")
    }

    if (useExtSpecialist) {
      requestBody = overrideExternalClient!!.injectModelField(requestBody)
      requestBody = overrideExternalClient!!.injectExtraParams(requestBody)
    } else if (external) {
      requestBody = injectModelField?.invoke(requestBody) ?: requestBody

      log(LogLevel.INFO, "Routing stream to external AI: ${externalUrl()}")
    } else if (useThinkingServer) {
      log(LogLevel.INFO, "Routing stream to thinking server on port ${thinkingServerPort()}")
    }

    val streamFn: ((String) -> Unit, () -> Boolean, Int) -> Unit =
        if (useExtSpecialist) {
          { onLine, shouldStopFn, timeout ->
            overrideExternalClient!!.postStreaming(
                "/v1/chat/completions", requestBody, onLine, shouldStopFn, timeout)
          }
        } else if (external) {
          { onLine, shouldStopFn, timeout ->
            externalPostStreaming!!(
                "/v1/chat/completions", requestBody, onLine, shouldStopFn, timeout)
          }
        } else {
          { onLine, shouldStopFn, timeout ->
            localPostStreaming(
                "/v1/chat/completions", requestBody, onLine, shouldStopFn, timeout, targetPort)
          }
        }

    streamFn(
        { data ->
          try {
            val parsed = com.google.gson.JsonParser.parseString(data)
            if (!parsed.isJsonObject) {
              log(
                  LogLevel.WARNING,
                  "SSE chunk processing error: not a JSON object (${data.take(80)})")
              return@streamFn
            }
            val json = parsed.asJsonObject
            // Collect the token counters when the stream carries them (usually the last chunk).
            extractUsage(json)?.let { (promptTokens, completionTokens, cachedPromptTokens) ->
              onUsage?.invoke(promptTokens, completionTokens, cachedPromptTokens)
            }
            val delta =
                json.getAsJsonArray("choices")?.get(0)?.asJsonObject?.getAsJsonObject("delta")

            if (delta != null && session.thinkingIsEmpty() && session.textSize() < 3) {
              log(LogLevel.INFO, "SSE delta keys: ${delta.keySet()}")
            }

            val content = delta?.get("content")?.takeIf { it.isJsonPrimitive }?.asString

            if (content != null) {
              val filtered = filterThinkTags(content, tagBuffer, insideThinkBlock)

              insideThinkBlock = filtered.insideThinkBlock
              tagBuffer = filtered.tagBuffer

              val cleanText = filtered.output
              val thinkText = filtered.thinkingText

              if (cleanText.isNotEmpty()) {
                session.addText(cleanText)
                if (!repetitionDetected) {
                  answerAccum.append(cleanText)

                  if (answerAccum.length > 400) {
                    val text = answerAccum.toString()
                    val tail = text.takeLast(80)
                    val searchIn = text.substring(0, text.length - 80)

                    if (searchIn.contains(tail)) {
                      repetitionDetected = true

                      val firstOccurrence = searchIn.indexOf(tail)
                      val trimPoint = firstOccurrence + tail.length

                      session.replaceText(text.substring(0, trimPoint))
                      log(
                          LogLevel.INFO,
                          "Answer repetition detected after ${answerAccum.length} chars, trimming output")
                    }
                  }
                }
              }

              if (thinkText.isNotEmpty()) {
                session.addThinking(thinkText)
                if (insideThinkBlock && !repetitionDetected) {
                  reasoningAccum.append(thinkText)

                  if (reasoningAccum.length > 500) {
                    val text = reasoningAccum.toString()
                    val tail = text.takeLast(500)
                    val searchIn = text.substring(0, text.length - 500)

                    if (searchIn.contains(tail)) {
                      repetitionDetected = true
                      insideThinkBlock = false
                      session.addThinking("\n[Reasoning truncated \u2014 repetition detected]")
                      log(
                          LogLevel.INFO,
                          "Repetition detected (exact n-gram) in reasoning after ${reasoningAccum.length} chars")
                    }

                    if (!repetitionDetected && text.length > 2000) {
                      val sentences = text.split(Regex("""[.!?\n]\s*""")).filter { it.length > 20 }
                      val starts = sentences.map { it.take(30).lowercase().trim() }
                      val mostCommon = starts.groupingBy { it }.eachCount().maxByOrNull { it.value }

                      if (mostCommon != null && mostCommon.value >= 1000) {
                        repetitionDetected = true
                        insideThinkBlock = false
                        session.addThinking(
                            "\n[Reasoning truncated \u2014 repetitive pattern detected]")
                        log(
                            LogLevel.INFO,
                            "Repetition detected (sentence pattern) in reasoning after ${reasoningAccum.length} chars")
                      }
                    }
                  }
                }
              }
            }
            val reasoning = delta?.get("reasoning_content")?.takeIf { it.isJsonPrimitive }?.asString

            if (reasoning != null && reasoning.isNotEmpty()) {
              session.addThinking(reasoning)

              if (!repetitionDetected) {
                reasoningAccum.append(reasoning)

                if (reasoningAccum.length > 500) {
                  val text = reasoningAccum.toString()
                  val tail = text.takeLast(500)
                  val searchIn = text.substring(0, text.length - 500)

                  if (searchIn.contains(tail)) {
                    repetitionDetected = true
                    insideThinkBlock = false
                    session.addThinking("\n[Reasoning truncated \u2014 repetition detected]")
                    log(
                        LogLevel.INFO,
                        "Repetition detected in reasoning_content after ${reasoningAccum.length} chars")
                  }

                  if (!repetitionDetected && text.length > 2000) {
                    val sentences = text.split(Regex("""[.!?\n]\s*""")).filter { it.length > 20 }
                    val starts = sentences.map { it.take(30).lowercase().trim() }
                    val mostCommon = starts.groupingBy { it }.eachCount().maxByOrNull { it.value }

                    if (mostCommon != null && mostCommon.value >= 1000) {
                      repetitionDetected = true
                      insideThinkBlock = false
                      session.addThinking(
                          "\n[Reasoning truncated \u2014 repetitive pattern detected]")
                      log(
                          LogLevel.INFO,
                          "Repetition detected (sentence pattern) in reasoning_content after ${reasoningAccum.length} chars")
                    }
                  }
                }
              }
            }

            val choice = json.getAsJsonArray("choices")?.get(0)?.asJsonObject
            val lpContent = choice?.getAsJsonObject("logprobs")?.getAsJsonArray("content")

            if (lpContent != null && lpContent.size() > 0) {
              session.logprobsAvailable = true

              for (lpEntry in lpContent) {
                val obj = lpEntry.asJsonObject
                val tok = obj.get("token")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
                val lp = obj.get("logprob")?.takeIf { it.isJsonPrimitive }?.asDouble ?: continue

                if (!insideThinkBlock) {
                  session.addLogprob(tok, lp)

                  if (!repetitionDetected && session.logprobsSize() > 60) {
                    val tail = session.logprobsTail(20)

                    if (tail.all { it.second > -0.05 }) {
                      val tailText = tail.joinToString("") { it.first }
                      val fullText = session.currentText()
                      val prefixEnd = fullText.length - tailText.length

                      if (prefixEnd > 0 && fullText.substring(0, prefixEnd).contains(tailText)) {
                        session.logprobRepetitionDetected = true
                        repetitionDetected = true

                        log(
                            LogLevel.INFO,
                            "Logprob-based repetition detected: 20 tokens all > -0.05 logprob on repeated content")
                      }
                    }
                  }
                }
              }
            }
          } catch (e: Exception) {
            log(LogLevel.WARNING, "SSE chunk processing error: ${e.message}")
          }
        },
        { session.stopRequested || repetitionDetected },
        if (enableThinking) 600_000 else 300_000)

    val flushed = flushThinkTagBuffer(tagBuffer, insideThinkBlock)
    if (flushed.output.isNotEmpty()) session.addText(flushed.output)
    if (flushed.thinkingText.isNotEmpty()) session.addThinking(flushed.thinkingText)
    if (flushed.insideThinkBlock) {
      log(
          LogLevel.WARNING,
          "Stream ended with unclosed <think> block — reasoning content may be incomplete")
    }
  }
}
