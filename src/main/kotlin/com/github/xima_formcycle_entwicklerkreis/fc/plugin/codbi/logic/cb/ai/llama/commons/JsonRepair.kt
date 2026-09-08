package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

/**
 * Repairs the common JSON slips LLMs make when emitting JSON, so a single bad token does not lose
 * an entire AI build (form or workflow). Only invoked when the initial strict parse fails. The
 * repairs are intentionally conservative — they only touch text that cannot appear in valid JSON,
 * so any well-formed payload is passed through byte-for-byte unchanged.
 *
 * The repair runs in up to three stages, each only when the previous stage left the payload
 * structurally unbalanced:
 * 1. **Token slips** (see [repairStructuralSlips]) — handles text-level slips:
 *     - a backslash-quote inside a string that actually closes the value (e.g. `"unit": \"€\"`
 *       instead of `"unit": "€"` — the model escaped the surrounding quotes of a value);
 *     - a stray `\"` outside a string (the model escaped a delimiter instead of writing a plain
 *       `"`);
 *     - a trailing comma before `}`/`]` (`"a":1,}`);
 *     - a missing opening `{` before an object element inside an array. The model frequently drops
 *       the brace when it writes several node objects back to back, e.g. it emits
 *       `"chainedNodes":[{...},"nodeType":"FC_SHOW_TEMPLATE",...}]` instead of
 *       `"chainedNodes":[{...},{"nodeType":"FC_SHOW_TEMPLATE",...}]`. Because the element starts
 *       with a `"key":` pair (not a plain string value), the missing `{` is unambiguously
 *       detectable, and the matching closing `}` is still present, so inserting the brace preserves
 *       the balance.
 * 2. **Structural recovery** (see [JsonRecoverer]) — handles slips the token pass cannot fix
 *    because they change the *nesting*. Two recurring examples:
 *     - a model ends a form with `{"items":[ ...
 *       ,{"className":"XSelect","properties":{...}},"attributes":[]}` — the item's
 *       `"attributes":[]` member is emitted AFTER the item's closing `}` (it belongs to the item,
 *       not to the array) and the enclosing `]` is dropped. The recoverer folds that single
 *       trailing member back into the preceding object.
 *     - a model drops the opening `{` of the NEXT node element inside a workflow array
 *       (`_childNodes` / `chainedNodes`), writing the node's multi-member run
 *       (`"nodeType":...,"nodeParams":{...}`) directly after the separator — e.g. the production
 *       failure `MalformedJsonException: Unterminated array ... $.nodeParams._childNodes[4]`. The
 *       recoverer distinguishes this from the folded-back trailing member by looking past the first
 *       member's value: a following `,` + another `"key":` pair means a dropped-brace node object
 *       (always multi-member) and it synthesizes the missing `{` … `}`, whereas a single trailing
 *       member right before a container closer is folded back into its object. The recoverer
 *       re-emits the payload with a tolerant parser and closes every container the model left open.
 *       It hands back a recovery only when doing so re-balances the WHOLE document into a single
 *       valid JSON value — so a payload that dropped only its trailing closer(s) (e.g. a missing
 *       root `}`) is repaired, while a payload that genuinely runs out mid-token (an unterminated
 *       string or an in-progress value, which cannot be re-balanced) is still refused so a cut-off
 *       answer fails loudly instead of silently publishing a partial form.
 *
 * @param raw The raw (already extracted) AI JSON payload.
 * @return The repaired JSON, or [raw] unchanged when no repair was necessary.
 */
internal fun repairAiJson(raw: String): String {
  if (raw.isBlank()) return raw
  // Stage 2 can fold a misplaced trailing `,"key":value` member back into the object it belongs to
  // far more cleanly when it runs on the original text (stage 1 would have already wrapped the tail
  // into a separate stub object). Try it first, but only when the payload is structurally broken.
  if (!isStructurallyBalanced(raw)) {
    val recovered = JsonRecoverer(raw).recover()
    if (recovered != null) return recovered
  }
  val pass1 = repairStructuralSlips(raw)
  // The token slips alone restore balance in the common cases — hand them through untouched.
  if (isStructurallyBalanced(pass1)) return pass1
  // Still unbalanced (e.g. the token slips fixed quotes but the nesting stayed broken): one final
  // structural pass on the cleaned text.
  val recovered2 = JsonRecoverer(pass1).recover()
  if (recovered2 != null) return recovered2
  return pass1
}

/** Stage 1 — the original conservative token-level repairs (see the KDoc of [repairAiJson]). */
private fun repairStructuralSlips(raw: String): String {
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

/** True when every `{`/`[` has a matching closer (in the correct order) and no string is open. */
private fun isStructurallyBalanced(s: String): Boolean {
  val stack = ArrayDeque<Char>()
  var inString = false
  var i = 0
  val n = s.length
  while (i < n) {
    val c = s[i]
    if (inString) {
      if (c == '\\' && i + 1 < n) {
        i += 2
        continue
      }
      if (c == '"') inString = false
      i++
      continue
    }
    when (c) {
      '"' -> {
        inString = true
        i++
      }
      '{',
      '[' -> {
        stack.addLast(c)
        i++
      }
      '}' -> {
        if (stack.isEmpty() || stack.last() != '{') return false
        stack.removeLast()
        i++
      }
      ']' -> {
        if (stack.isEmpty() || stack.last() != '[') return false
        stack.removeLast()
        i++
      }
      else -> i++
    }
  }
  return !inString && stack.isEmpty()
}

private enum class RepairedKind {
  OBJECT,
  ARRAY,
  SCALAR
}

/**
 * Stage 2 — tolerant structural recovery (see the KDoc of [repairAiJson]).
 *
 * Re-emits the payload with a forgiving parser that mirrors real JSON nesting but:
 * - treats a `}`/`]` that appears while a container expects its own closer as an *implicit* close
 *   of the current container (the model dropped the closer but reused the enclosing one);
 * - treats a `,"key":value` member that appears directly inside an array right after an object
 *   element as a member of that object (the model wrote the item's trailing member after its `}`);
 * - drops stray separators and closes containers that end at end-of-input.
 *
 * [recover] returns `null` (and lets the caller keep its previous behaviour) when the payload
 * genuinely runs out of input before the ROOT container was closed with a real closer — i.e. when
 * the model output was cut off rather than merely mistyped — so truncated answers are never
 * silently "completed".
 */
private class JsonRecoverer(private val raw: String) {
  private val n = raw.length
  private val out = StringBuilder(n + 16)
  private var i = 0

  private fun skipWs() {
    while (i < n && (raw[i] == ' ' || raw[i] == '\t' || raw[i] == '\r' || raw[i] == '\n')) i++
  }

  private fun skipWsFrom(p: Int): Int {
    var j = p
    while (j < n && (raw[j] == ' ' || raw[j] == '\t' || raw[j] == '\r' || raw[j] == '\n')) j++
    return j
  }

  private fun isTokenChar(c: Char): Boolean =
      c in '0'..'9' || c in 'a'..'z' || c in 'A'..'Z' || c == '.' || c == '+' || c == '-'

  /** Index just past the closing quote of the string whose opening quote sits at [p]. */
  private fun endOfString(p: Int): Int {
    var j = p + 1
    while (j < n) {
      val c = raw[j]
      if (c == '\\' && j + 1 < n) {
        j += 2
        continue
      }
      if (c == '"') return j + 1
      j++
    }
    return n
  }

  /** Index just past the JSON value that begins at [p] (nests into containers, honors strings). */
  private fun endOfValue(p: Int): Int {
    if (p >= n) return n
    return when (raw[p]) {
      '{',
      '[' -> {
        val open = raw[p]
        val close = if (open == '{') '}' else ']'
        var depth = 0
        var inStr = false
        var j = p
        while (j < n) {
          val c = raw[j]
          if (inStr) {
            if (c == '\\' && j + 1 < n) {
              j += 2
              continue
            }
            if (c == '"') inStr = false
          } else {
            when (c) {
              '"' -> inStr = true
              open -> depth++
              close -> {
                depth--
                if (depth == 0) return j + 1
              }
            }
          }
          j++
        }
        n
      }
      '"' -> endOfString(p)
      else -> {
        var j = p
        while (j < n && isTokenChar(raw[j])) j++
        j
      }
    }
  }

  /**
   * Parses a dropped-brace object that sits as an element of the enclosing array — the model wrote
   * the node's members (`"nodeType":...,"nodeParams":{...}`) directly after a `,` but omitted its
   * opening `{` (the element key `"key":` pair cannot be a plain string array element). Emits the
   * synthesized `{` … `}` around the member run. Returns when the object's reused/real closer (`}`)
   * is consumed, or when the enclosing array's closer (`]`) is reached (the object `}` was
   * dropped).
   */
  private fun parseDroppedBraceObjectElement() {
    out.append('{')
    var first = true
    while (true) {
      skipWs()
      if (i >= n) {
        out.append('}')
        return
      }
      val c = raw[i]
      when {
        c == '}' -> {
          out.append('}')
          i++
          return
        }
        c == ']' -> {
          out.append('}')
          return
        }
        c == ',' || c == ':' -> i++ // stray separator between members
        c == '"' -> {
          if (!first) out.append(',')
          first = false
          val ke = endOfString(i)
          out.append(raw, i, ke) // verbatim quoted key
          i = ke
          skipWs()
          if (i < n && raw[i] == ':') {
            out.append(':')
            i++
          } else {
            out.append(':') // model dropped the colon — insert it
          }
          skipWs()
          parseValue()
        }
        else -> i++ // stray junk between members: skip it
      }
    }
  }

  /** Returns (kind, closedWithRealCloser). Only meaningful for the ROOT value. */
  private fun parseValue(): Pair<RepairedKind, Boolean> {
    skipWs()
    if (i >= n) {
      out.append("null")
      return RepairedKind.SCALAR to true
    }
    val c = raw[i]
    return when {
      c == '{' -> parseObject()
      c == '[' -> parseArray()
      c == '"' -> {
        val e = endOfString(i)
        out.append(raw, i, e)
        i = e
        RepairedKind.SCALAR to true
      }
      c == '\\' && i + 1 < n && raw[i + 1] == '"' -> {
        // Stray `\"` in value position: treat as the opening quote of a plain string.
        out.append('"')
        i += 2
        val e = endOfString(i)
        out.append(raw, i, e)
        i = e
        RepairedKind.SCALAR to true
      }
      isTokenChar(c) -> {
        val s = i
        while (i < n && isTokenChar(raw[i])) i++
        out.append(raw, s, i)
        RepairedKind.SCALAR to true
      }
      else -> {
        // Missing value before a separator/closer (or stray junk): emit a null placeholder. Do NOT
        // consume a structural closer so the enclosing container can still terminate normally.
        out.append("null")
        if (c != '}' && c != ']' && c != ',' && c != ':') i++
        RepairedKind.SCALAR to true
      }
    }
  }

  private fun parseObject(): Pair<RepairedKind, Boolean> {
    out.append('{')
    i++ // consume '{'
    var first = true
    while (true) {
      skipWs()
      if (i >= n) {
        out.append('}')
        return RepairedKind.OBJECT to false
      }
      val c = raw[i]
      when {
        c == '}' -> {
          out.append('}')
          i++
          return RepairedKind.OBJECT to true
        }
        c == ']' -> {
          // A `]` here closes the enclosing ARRAY, not this object — the model dropped this
          // object's `}` and reused the array's closer. Implicitly close and leave it for the
          // parent.
          out.append('}')
          return RepairedKind.OBJECT to false
        }
        c == ',' || c == ':' -> i++ // stray separator between members
        c == '"' -> {
          if (!first) out.append(',')
          first = false
          val keyEnd = endOfString(i)
          out.append(raw, i, keyEnd) // verbatim quoted key (keeps inner escapes intact)
          i = keyEnd
          skipWs()
          if (i < n && raw[i] == ':') {
            out.append(':')
            i++
          } else {
            out.append(':') // model dropped the colon — insert it
          }
          skipWs()
          parseValue()
        }
        else -> i++ // stray junk between members: skip it
      }
    }
  }

  private fun parseArray(): Pair<RepairedKind, Boolean> {
    out.append('[')
    i++ // consume '['
    var first = true
    var prevKind = RepairedKind.SCALAR
    while (true) {
      skipWs()
      if (i >= n) {
        out.append(']')
        return RepairedKind.ARRAY to false
      }
      val c = raw[i]
      when {
        c == ']' -> {
          out.append(']')
          i++
          return RepairedKind.ARRAY to true
        }
        c == '}' -> {
          // A `}` here closes the enclosing OBJECT, not this array — the model dropped this array's
          // `]` and reused the object's closer. Implicitly close and leave it for the parent.
          out.append(']')
          return RepairedKind.ARRAY to false
        }
        c == ',' || c == ':' -> i++ // stray separator between elements
        c == '"' -> {
          val keyEnd = endOfString(i)
          val afterWs = skipWsFrom(keyEnd)
          if (prevKind == RepairedKind.OBJECT && afterWs < n && raw[afterWs] == ':') {
            // Two fundamentally different slips produce the same `...}, "key":...` look here:
            //  - the model wrote an item's trailing member (e.g. `"attributes":[]`) AFTER the
            // item's
            //    closing `}` → fold it back into the preceding object element;
            //  - the model dropped the opening `{` of the NEXT node element (e.g. a workflow
            //    `_childNodes` / `chainedNodes` node), writing its members `"nodeType":...,
            //    "nodeParams":{...}` directly after the separator → it is a NEW object element that
            //    only lost its brace.
            // They are indistinguishable from the key alone, so disambiguate by what follows the
            // first member's VALUE: a `,` + another `"key":` pair means the element has more
            // members (a dropped-brace node object — always multi-member), while a container closer
            // right after a single member means a folded-back trailing member (`"attributes":[]`).
            val valIdx = skipWsFrom(afterWs + 1)
            val valueEnd = endOfValue(valIdx)
            val afterValue = skipWsFrom(valueEnd)
            val isDroppedBraceNode =
                afterValue < n &&
                    raw[afterValue] == ',' &&
                    skipWsFrom(afterValue + 1) < n &&
                    raw[skipWsFrom(afterValue + 1)] == '"'
            if (isDroppedBraceNode) {
              // New array element object that lost its opening `{` — synthesize it and parse its
              // member run as one element.
              if (!first) out.append(',')
              first = false
              parseDroppedBraceObjectElement()
              prevKind = RepairedKind.OBJECT
              continue
            }
            // Single trailing member of the preceding object element — fold it back in.
            if (out.isNotEmpty() && out[out.length - 1] == '}') {
              out.setLength(out.length - 1) // re-open the preceding object
            }
            out.append(',')
            out.append(raw, i, keyEnd) // verbatim quoted key
            i = keyEnd
            skipWs()
            if (i < n && raw[i] == ':') {
              out.append(':')
              i++
            } else {
              out.append(':')
            }
            skipWs()
            parseValue()
            out.append('}') // re-close the object, now with the member in place
            prevKind = RepairedKind.OBJECT
            continue
          }
          // A plain string element.
          if (!first) out.append(',')
          first = false
          val e = endOfString(i)
          out.append(raw, i, e)
          i = e
          prevKind = RepairedKind.SCALAR
        }
        else -> {
          // Object/array/number/boolean element — let parseValue handle it.
          if (!first) out.append(',')
          first = false
          val k = parseValue()
          prevKind = k.first
        }
      }
    }
  }

  fun recover(): String? {
    skipWs()
    if (i >= n) return null
    parseValue()
    skipWs()
    // Refuse to accept payloads that still have trailing content after the root value.
    if (i < n) return null
    val result = out.toString()
    // Accept only when the recovery re-balances the whole document into a single valid JSON value.
    // A payload that simply runs out mid-container (true truncation of an unterminated string or an
    // in-progress value) leaves an unbalanced re-emission here and is still refused, so a cut-off
    // answer is never silently "completed". But a payload that only DROPPED its trailing closer(s)
    // — e.g. a workflow spec that omitted the `{` of a node in `_childNodes` and the root `}` — is
    // fully balanced after recovery and safe to hand back, even though no literal root closer
    // existed.
    if (!isStructurallyBalanced(result)) return null
    return result
  }
}
