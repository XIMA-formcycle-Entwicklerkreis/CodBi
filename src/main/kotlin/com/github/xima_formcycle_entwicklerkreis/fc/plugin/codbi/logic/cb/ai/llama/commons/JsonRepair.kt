package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

/**
 * Repairs the common JSON slips LLMs make when emitting JSON, so a single bad token does not lose
 * an entire AI build (form or workflow). Only invoked when the initial strict parse fails. The
 * repairs are intentionally conservative — they only touch text that cannot appear in valid JSON,
 * so any well-formed payload is passed through byte-for-byte unchanged.
 *
 * Currently handled:
 * - a backslash-quote inside a string that actually closes the value (e.g. `"unit": \"€\"` instead
 *   of `"unit": "€"` — the model escaped the surrounding quotes of a value);
 * - a stray `\"` outside a string (the model escaped a delimiter instead of writing a plain `"`);
 * - a trailing comma before `}`/`]` (`"a":1,}`);
 * - a missing opening `{` before an object element inside an array. The model frequently drops the
 *   brace when it writes several node objects back to back, e.g. it emits
 *   `"chainedNodes":[{...},"nodeType":"FC_SHOW_TEMPLATE",...}]` instead of
 *   `"chainedNodes":[{...},{"nodeType":"FC_SHOW_TEMPLATE",...}]`. Because the element starts with a
 *   `"key":` pair (not a plain string value), the missing `{` is unambiguously detectable, and the
 *   matching closing `}` is still present, so inserting the brace preserves the balance.
 *
 * @param raw The raw (already extracted) AI JSON payload.
 * @return The repaired JSON, or [raw] unchanged when no repair was necessary.
 */
internal fun repairAiJson(raw: String): String {
  if (raw.isBlank()) return raw
  val sb = StringBuilder(raw.length + 8)
  var inString = false
  var i = 0
  val n = raw.length
  // Nesting context: the top of the stack is the innermost open container. It is only consulted to
  // tell "we are directly inside an ARRAY", where a `"key":` token means an object lost its `{`.
  val stack = ArrayDeque<Char>()
  // True when the next token begins an element of the innermost ARRAY container (right after `[`
  // or after a kept `,` inside an array).
  var arrayElementStart = false

  fun skipWs(from: Int): Int {
    var j = from
    while (j < n && (raw[j] == ' ' || raw[j] == '\t' || raw[j] == '\r' || raw[j] == '\n')) j++
    return j
  }

  // Index just past the closing quote of the string whose opening quote sits at [from].
  fun stringEnd(from: Int): Int {
    var j = from + 1
    while (j < n) {
      if (raw[j] == '\\' && j + 1 < n) {
        j += 2
        continue
      }
      if (raw[j] == '"') return j + 1
      j++
    }
    return n
  }

  while (i < n) {
    val c = raw[i]
    if (inString) {
      if (c == '\\' && i + 1 < n) {
        val nxt = raw[i + 1]
        if (nxt == '"') {
          // A backslash-quote inside a string: if it closes a value (followed by `,`/`}`/`]`/`:`
          // or end of input), the model meant it as a plain closing quote; otherwise it is a
          // legitimate escape and stays verbatim.
          val after = skipWs(i + 2)
          val closesValue =
              after >= n ||
                  raw[after] == ',' ||
                  raw[after] == '}' ||
                  raw[after] == ']' ||
                  raw[after] == ':'
          if (closesValue) {
            sb.append('"')
            inString = false
          } else {
            sb.append(c).append(nxt)
          }
          i += 2
        } else {
          // Other escape sequences (\\n, \\u..., \\/, ...): keep verbatim.
          sb.append(c).append(nxt)
          i += 2
        }
      } else if (c == '"') {
        sb.append(c)
        inString = false
        i++
      } else {
        sb.append(c)
        i++
      }
    } else {
      when {
        c == '"' -> {
          // An array element that begins with a `"key":` pair means the model dropped the opening
          // `{` of that object (the element is an object, not a plain string value — in valid JSON
          // a string array element is only ever followed by `,` or `]`, never by `:`). Insert the
          // missing `{`; the closing `}` of the object is still present, so the balance holds.
          if (arrayElementStart && stack.isNotEmpty() && stack.last() == '[') {
            val afterKey = skipWs(stringEnd(i))
            if (afterKey < n && raw[afterKey] == ':') {
              sb.append('{')
              stack.addLast('{')
            }
          }
          sb.append(c)
          inString = true
          arrayElementStart = false
          i++
        }
        c == '\\' && i + 1 < n && raw[i + 1] == '"' -> {
          // Stray `\"` outside a string: treat it as a plain opening quote (the model escaped the
          // delimiter instead of writing a plain `"`).
          sb.append('"')
          inString = true
          arrayElementStart = false
          i += 2
        }
        c == '{' -> {
          sb.append(c)
          stack.addLast('{')
          arrayElementStart = false
          i++
        }
        c == '[' -> {
          sb.append(c)
          stack.addLast('[')
          arrayElementStart = true
          i++
        }
        c == '}' -> {
          sb.append(c)
          if (stack.isNotEmpty() && stack.last() == '{') stack.removeLast()
          arrayElementStart = false
          i++
        }
        c == ']' -> {
          sb.append(c)
          if (stack.isNotEmpty() && stack.last() == '[') stack.removeLast()
          arrayElementStart = false
          i++
        }
        c == ',' -> {
          val after = skipWs(i + 1)
          if (after < n && (raw[after] == '}' || raw[after] == ']')) {
            // Trailing comma before a closing brace/bracket: drop the comma.
            i++
          } else {
            sb.append(c)
            i++
            arrayElementStart = stack.isNotEmpty() && stack.last() == '['
          }
        }
        else -> {
          sb.append(c)
          i++
        }
      }
    }
  }
  return sb.toString()
}
