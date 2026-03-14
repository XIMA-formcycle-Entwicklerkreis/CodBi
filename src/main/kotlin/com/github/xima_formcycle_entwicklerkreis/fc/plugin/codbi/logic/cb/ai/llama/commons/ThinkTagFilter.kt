package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

private val THINK_BLOCK_REGEX = Regex("<think>[\\s\\S]*?</think>")

/**
 * Strips `<think>…</think>` blocks from a complete response string. Used by the non-streaming path.
 * Iteratively strips blocks so that nested tags (e.g. `<think>outer <think>inner</think>
 * rest</think>`) are fully removed.
 *
 * **Assumption:** Models do not intentionally produce nested `<think>` tags. The iterative loop is
 * a defensive measure — in normal operation a single pass suffices.
 *
 * @param text The raw model output.
 * @return The text with all think blocks removed.
 */
internal fun stripThinkTags(text: String): String {
  var result = text
  while (result.contains(THINK_BLOCK_REGEX)) {
    result = result.replace(THINK_BLOCK_REGEX, "")
  }
  return result.trim()
}

/**
 * Immutable result returned by [filterThinkTags] to avoid mutable in-out parameters.
 *
 * @property output Visible text to emit to the client.
 * @property insideThinkBlock Whether the stream is currently inside a `<think>` block.
 * @property thinkingText Reasoning text captured from inside the block.
 * @property tagBuffer Accumulated partial tag text to carry into the next call.
 */
internal data class FilterResult(
    val output: String,
    val insideThinkBlock: Boolean,
    val thinkingText: String,
    val tagBuffer: String
)

/**
 * All possible prefixes of `<think>`, used for partial-tag detection without substring allocation.
 */
private val OPEN_TAG_PREFIXES = (1..6).map { "<think>".substring(0, it) }

/**
 * All possible prefixes of `</think>`, used for partial-tag detection without substring allocation.
 */
private val CLOSE_TAG_PREFIXES = (1..7).map { "</think>".substring(0, it) }

/**
 * Incrementally filters `<think>…</think>` blocks from streaming chunks. Handles partial tags that
 * span chunk boundaries.
 *
 * **Assumption:** The model does not produce nested `<think>` tags.
 *
 * @param chunk The latest raw chunk received from the SSE stream.
 * @param previousTagBuffer Leftover partial tag text from the previous call.
 * @param insideThinkBlock Whether the stream is currently inside a `<think>` block.
 * @return A [FilterResult] containing the visible text, thinking text, updated state, and any new
 *   partial tag buffer.
 */
internal fun filterThinkTags(
    chunk: String,
    previousTagBuffer: String,
    insideThinkBlock: Boolean
): FilterResult {
  var inside = insideThinkBlock
  val output = StringBuilder()
  val thinkOutput = StringBuilder()
  var newTagBuffer = ""
  var i = 0
  val combined = previousTagBuffer + chunk

  while (i < combined.length) {
    if (inside) {
      val closeIdx = combined.indexOf("</think>", i)

      if (closeIdx == -1) {
        val remaining = combined.substring(i)

        if (remaining.length < 8 && "</think>".startsWith(remaining)) {
          newTagBuffer = remaining
        } else {
          thinkOutput.append(remaining)
        }

        break
      }

      thinkOutput.append(combined.substring(i, closeIdx))

      i = closeIdx + 8 // skip past </think>
      inside = false
    } else {
      val openIdx = combined.indexOf("<think>", i)

      if (openIdx == -1) {
        val remaining = combined.substring(i)
        val partialLen = OPEN_TAG_PREFIXES.lastOrNull { remaining.endsWith(it) }?.length ?: 0

        if (partialLen > 0) {
          output.append(remaining, 0, remaining.length - partialLen)
          newTagBuffer = remaining.substring(remaining.length - partialLen)
        } else {
          output.append(remaining)
        }

        break
      }

      output.append(combined.substring(i, openIdx))

      i = openIdx + 7 // skip past <think>
      inside = true
    }
  }

  return FilterResult(output.toString(), inside, thinkOutput.toString(), newTagBuffer)
}

/**
 * Flushes remaining state when the stream ends. If the stream was still inside a `<think>` block,
 * the leftover buffer content is returned as thinking text so the caller can log or surface it.
 *
 * @param tagBuffer Leftover partial tag text from the last [filterThinkTags] call.
 * @param insideThinkBlock Whether the stream ended inside a `<think>` block.
 * @return A [FilterResult] with any remaining text properly categorised. If the stream ended inside
 *   a think block, [FilterResult.insideThinkBlock] remains `true` so the caller can detect the
 *   incomplete block.
 */
internal fun flushThinkTagBuffer(tagBuffer: String, insideThinkBlock: Boolean): FilterResult {
  return if (insideThinkBlock) {
    FilterResult(output = "", insideThinkBlock = true, thinkingText = tagBuffer, tagBuffer = "")
  } else {
    FilterResult(output = tagBuffer, insideThinkBlock = false, thinkingText = "", tagBuffer = "")
  }
}
