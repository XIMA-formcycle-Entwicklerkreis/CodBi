package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

/**
 * Loads the LLM chat system-prompt fragments from the bundled `.md` resource
 * (`prompts/codbi-llm-chat-fragments.md`, DB key `codbi.llm_chat_fragments`). No prompt text is
 * embedded in the backend — fragments are sourced from the `.md` file only. Each `## name` section
 * is exposed via [section].
 *
 * REMINDER — NEVER embed prompt/system-prompt text directly in Kotlin files. Prompt text belongs in
 * the `.md` files under `src/main/resources/.../prompts/` (see `prompts/index.json`). Adding prompt
 * strings to `.kt` files is forbidden; move them into the `.md` fragments and load them here.
 */
internal object ChatPromptFragments {

  private const val RESOURCE =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-llm-chat-fragments.md"

  @Volatile private var cache: Map<String, String>? = null

  private fun load(): Map<String, String> {
    cache?.let {
      return it
    }
    val raw =
        runCatching {
              ChatPromptFragments::class
                  .java
                  .classLoader
                  .getResourceAsStream(RESOURCE)
                  ?.bufferedReader(Charsets.UTF_8)
                  ?.use { it.readText() }
            }
            .getOrNull()
            .orEmpty()
    val map = mutableMapOf<String, String>()
    var current: String? = null
    val sb = StringBuilder()
    for (line in raw.lineSequence()) {
      if (line.startsWith("## ")) {
        current?.let { map[current] = sb.toString().trim() }
        current = line.removePrefix("## ").trim()
        sb.setLength(0)
      } else if (current != null && !line.startsWith("#")) {
        sb.append(line).append("\n")
      }
    }
    current?.let { map[current] = sb.toString().trim() }
    cache = map
    return map
  }

  /** Returns the text of the given `## name` section, or `null` when absent. */
  fun section(name: String): String? = load()[name]?.takeIf { it.isNotEmpty() }

  /** Returns the text of the given `## name` section with `{placeholder}` tokens replaced. */
  fun section(name: String, vararg replacements: Pair<String, String>): String? {
    val s = section(name) ?: return null
    var out = s
    for ((k, v) in replacements) out = out.replace("{$k}", v)
    return out
  }
}
