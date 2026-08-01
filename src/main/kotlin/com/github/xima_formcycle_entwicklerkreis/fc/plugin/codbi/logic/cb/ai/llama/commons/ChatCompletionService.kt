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
      overrideMaxTokens: Int? = null
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
      overrideExternalClient: ExternalAiClient? = null
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
