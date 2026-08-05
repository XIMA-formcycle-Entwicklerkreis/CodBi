package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import javax.persistence.EntityManager
import org.slf4j.LoggerFactory

/**
 * Loads the prompts of the CodBi elements defined in the local API-Doc manager **directly** from
 * the `codbi_local_apidoc` storage (documentation JSON + code entries) and assembles them for the
 * AI (condensed / detailed sections) and for the Prompt Manager (read-only records). The local
 * API-Doc manager remains the single source of truth — the prompts are **not** duplicated into the
 * `codbi_ai_prompt` / `codbi_compact_prompt` tables.
 *
 * An element is considered **AI-capable** (and is therefore transmitted to the AI and listed in the
 * Prompt Manager) only when it has a condensed prompt, a detailed prompt **and** code.
 */
internal object LocalApiDocPrompts {

  private val logger = LoggerFactory.getLogger(LocalApiDocPrompts::class.java)
  private val gson = GsonBuilder().create()

  /** The `codbi_local_apidoc` data key holding the documentation JSON. */
  private const val DOCUMENTATION_KEY = "documentation"

  /** One AI-capable local CodBi element with its assembled prompts. */
  data class LocalElement(
      val name: String,
      val group: String,
      val detail: String,
      val condensed: String,
      val detailedPrompt: String,
      val composedDetailed: String
  )

  // region Loading

  /**
   * Loads the **AI-capable** CodBi elements defined in the local API-Doc manager. An element is
   * AI-capable only when it has a condensed prompt, a detailed prompt AND code.
   *
   * @param em The {@link EntityManager} to use.
   * @return The sorted list of AI-capable local elements (may be empty).
   */
  fun loadAiCapableElements(em: EntityManager): List<LocalElement> {
    val documentation = loadDocumentation(em) ?: return emptyList()
    val root =
        try {
          gson.fromJson(documentation, JsonObject::class.java)
        } catch (_: Exception) {
          return emptyList()
        }
    val sections =
        mapOf(
            "detFunctionalities" to
                Triple("codbi.functionalities", "functionalities", "Functionality"),
            "detElementplaceholder" to
                Triple("codbi.element_placeholders", "element_placeholders", "Elementplaceholder"),
            "detStandards" to
                Triple("codbi.standard_configurations", "standard_configurations", "Standard"))
    val result = mutableListOf<LocalElement>()
    for ((sectionKey, config) in sections) {
      val section = root.get(sectionKey)?.takeIf { it.isJsonObject }?.asJsonObject ?: continue
      for ((name, value) in section.entrySet()) {
        val element = value as? JsonObject ?: continue
        val condensed = getJsonString(element, "CondensedPrompt")?.trim() ?: ""
        val detailedPrompt = getJsonString(element, "DetailedPrompt")?.trim() ?: ""
        if (condensed.isEmpty() || detailedPrompt.isEmpty()) continue
        if (!hasCode(em, name, config.third)) continue
        result.add(
            LocalElement(
                name = name,
                group = config.second,
                detail = config.third,
                condensed = condensed,
                detailedPrompt = detailedPrompt,
                composedDetailed = composeDetailedPrompt(element)))
      }
    }
    return result.sortedBy { it.name.lowercase() }
  }

  /** Loads the documentation JSON from `codbi_local_apidoc`, or `null` if unavailable. */
  private fun loadDocumentation(em: EntityManager): String? {
    return try {
      val results =
          em.createQuery(
                  "SELECT e.content FROM CodbiLocalApidoc e WHERE e.dataKey = :key",
                  String::class.java)
              .setParameter("key", DOCUMENTATION_KEY)
              .resultList
      if (results.isEmpty()) null else results[0]
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Determines whether the given element has code stored in the local API-Doc storage. Code is
   * stored separately from the documentation JSON via the `UPDATE CODE` action under the key
   * `${detail}_${element}`.
   *
   * @param em The {@link EntityManager} to use.
   * @param element The element's name (dotted path, lower case).
   * @param detail The element's type detail (e.g. `Functionality`).
   * @return **True** if a non-empty code entry exists, otherwise **false**.
   */
  private fun hasCode(em: EntityManager, element: String, detail: String): Boolean {
    return try {
      val results =
          em.createQuery(
                  "SELECT e.content FROM CodbiLocalApidoc e WHERE e.dataKey = :key",
                  String::class.java)
              .setParameter("key", "$detail" + "_" + element)
              .resultList
      if (results.isEmpty()) false else (results[0]?.trim()?.isNotEmpty() == true)
    } catch (_: Exception) {
      false
    }
  }

  /**
   * Composes the element's detailed prompt from its **DetailedPrompt** plus the detailed prompts of
   * its parameters, global parameters and CSS classes.
   *
   * @param element The element's JSON object.
   * @return The composed detailed prompt (trimmed), or an empty string if nothing is set.
   */
  private fun composeDetailedPrompt(element: JsonObject): String {
    val sb = StringBuilder()
    val detailed = getJsonString(element, "DetailedPrompt")?.trim() ?: ""
    if (detailed.isNotEmpty()) sb.append(detailed)
    appendPromptSection(sb, element, "Parameter", "ParameterPrompts", "Parameters")
    appendPromptSection(sb, element, "globals", "GlobalPrompts", "Global Variables")
    appendPromptSection(sb, element, "classes", "ClassPrompts", "CSS Classes")
    return sb.toString().trim()
  }

  /**
   * Appends a "heading:" section containing the non-blank prompts of the given collection to
   * **sb**.
   *
   * @param sb The {@link StringBuilder} to append to.
   * @param element The element's JSON object.
   * @param collectionKey The collection key (e.g. `Parameter`).
   * @param promptsKey The prompts map key (e.g. `ParameterPrompts`).
   * @param heading The human-readable section heading.
   */
  private fun appendPromptSection(
      sb: StringBuilder,
      element: JsonObject,
      collectionKey: String,
      promptsKey: String,
      heading: String
  ) {
    val collection = element.get(collectionKey)?.takeIf { it.isJsonObject }?.asJsonObject ?: return
    val prompts = element.get(promptsKey)?.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()
    val lines = mutableListOf<String>()
    for ((name, _) in collection.entrySet()) {
      val prompt = getJsonString(prompts, name)?.trim() ?: ""
      if (prompt.isNotEmpty()) lines.add("- $name: $prompt")
    }
    if (lines.isEmpty()) return
    if (sb.isNotEmpty()) sb.append("\n\n")
    sb.append(heading).append(":\n").append(lines.joinToString("\n"))
  }

  /** Reads a JSON string property, returning `null` when absent or not a JSON primitive string. */
  private fun getJsonString(jsonObject: JsonObject, key: String): String? =
      jsonObject.get(key)?.takeIf { it.isJsonPrimitive }?.asString

  /**
   * Normalizes a dotted element name to a stable prompt key segment (e.g. "AI.LLAMA.CHAT" →
   * "ai_llama_chat").
   *
   * @param name The element name.
   * @return The normalized key segment.
   */
  private fun normalizePromptKey(name: String): String =
      name.lowercase().replace(Regex("[^a-z0-9]+"), "_").replace(Regex("_+"), "_").trim('_')

  // endregion

  // region AI sections

  /** Assembles the condensed (compact) section of the local AI-capable elements for the AI. */
  fun condensedSection(em: EntityManager): String {
    val elements = loadAiCapableElements(em)
    if (elements.isEmpty()) return ""
    val sb = StringBuilder("\n\nCODBI LOCAL ELEMENTS (COMPACT)\n")
    for ((group, items) in elements.groupBy { it.group }) {
      sb.append("\n## ").append(groupLabel(group)).append("\n")
      for (e in items) {
        sb.append("\n### ").append(e.name).append("\n")
        sb.append(e.condensed).append("\n")
      }
    }
    return sb.toString().trimEnd()
  }

  /** Assembles the detailed section of the local AI-capable elements for the AI. */
  fun detailedSection(em: EntityManager): String {
    val elements = loadAiCapableElements(em)
    if (elements.isEmpty()) return ""
    val sb = StringBuilder("\n\nCODBI LOCAL ELEMENTS (DETAILED)\n")
    for ((group, items) in elements.groupBy { it.group }) {
      sb.append("\n## ").append(groupLabel(group)).append("\n")
      for (e in items) {
        sb.append("\n### ").append(e.name).append("\n")
        sb.append(e.composedDetailed).append("\n")
      }
    }
    return sb.toString().trimEnd()
  }

  /**
   * Returns the detailed sections of only the requested local elements (matched by normalized name
   * suffix), or an empty string when none of the requested IDs matched.
   *
   * @param em The {@link EntityManager} to use.
   * @param requestedIds The requested element ids/names (e.g. "AI.LLAMA.CHAT", "ai_llama_chat").
   */
  fun requestedDetails(em: EntityManager, requestedIds: List<String>): String {
    if (requestedIds.isEmpty()) return ""
    val elements = loadAiCapableElements(em)
    if (elements.isEmpty()) return ""
    val wanted = requestedIds.map { normalizePromptKey(it) }.filter { it.isNotEmpty() }.toSet()
    if (wanted.isEmpty()) return ""
    val bySuffix = elements.associate { normalizePromptKey(it.name) to it }
    val sb = StringBuilder("\n\nCODBI LOCAL REQUESTED DETAILS\n")
    var added = false
    for (norm in wanted) {
      val e = bySuffix[norm] ?: continue
      sb.append("\n## ").append(e.name).append("\n")
      sb.append(e.composedDetailed).append("\n")
      added = true
    }
    return if (added) sb.toString().trimEnd() else ""
  }

  private fun groupLabel(group: String): String =
      when (group) {
        "functionalities" -> "Functionalities"
        "element_placeholders" -> "Element Placeholders"
        "standard_configurations" -> "Standard Configurations"
        else -> group.replace('_', ' ').replaceFirstChar { it.uppercase() }
      }

  /**
   * Returns the detailed prompt keys of the local AI-capable elements (e.g.
   * `codbi.functionalities.ai_llama_chat`).
   */
  fun detailedPromptKeys(em: EntityManager): Set<String> =
      loadAiCapableElements(em).map { "codbi.${it.group}.${normalizePromptKey(it.name)}" }.toSet()

  /**
   * Returns the compact prompt keys of the local AI-capable elements (e.g.
   * `compact.elements.functionalities.ai_llama_chat`).
   */
  fun compactPromptKeys(em: EntityManager): Set<String> =
      loadAiCapableElements(em)
          .map { "compact.elements.${it.group}.${normalizePromptKey(it.name)}" }
          .toSet()

  // endregion

  // region Prompt Manager records

  /**
   * Returns the detailed prompt records of the local AI-capable elements for the Prompt Manager.
   */
  fun listDetailedRecords(em: EntityManager): List<PromptLoader.PromptRecord> {
    return loadAiCapableElements(em).map { e ->
      PromptLoader.PromptRecord(
          promptKey = "codbi.${e.group}.${normalizePromptKey(e.name)}",
          displayName = e.name,
          category = e.group,
          promptText = e.composedDetailed,
          originalText = null,
          prePrompt = null,
          postPrompt = null,
          isActive = true,
          isSystem = false,
          updateAvailable = false,
          readOnly = true)
    }
  }

  /**
   * Returns the condensed (compact) prompt records of the local AI-capable elements for the Prompt
   * Manager.
   */
  fun listCompactRecords(em: EntityManager): List<CompactPromptLoader.CompactRecord> {
    return loadAiCapableElements(em).map { e ->
      CompactPromptLoader.CompactRecord(
          promptKey = "compact.elements.${e.group}.${normalizePromptKey(e.name)}",
          displayName = e.name,
          category = e.group,
          promptText = e.condensed,
          originalText = null,
          prePrompt = null,
          postPrompt = null,
          isActive = true,
          isSystem = false,
          updateAvailable = false,
          readOnly = true)
    }
  }

  // endregion
}
