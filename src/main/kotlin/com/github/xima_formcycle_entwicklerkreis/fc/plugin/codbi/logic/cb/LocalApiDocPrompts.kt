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
      val composedDetailed: String,
      val usageHint: String = ""
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
                composedDetailed = composeDetailedPrompt(element),
                usageHint = buildUsageHint(element, name, config.second)))
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
   * Builds an auto-generated usage hint for the given local element, depending on its group:
   * - **element_placeholders**: the exact EP placeholder form (e.g. `{ pluto > Param1 ; Param2 }`),
   *   derived from the number of its parameters. Tells the AI to write the placeholder itself as
   *   the value with the exact id and NEVER invent a different id.
   * - **standard_configurations**: tells the AI that a standard configuration is applied by adding
   *   its CSS classes to the target element's `cssclasses` array and that the standard
   *   configuration's name must NEVER be used as `data-cb-func`.
   * - **functionalities**: no usage hint.
   *
   * @param element The element's JSON object.
   * @param name The element's name.
   * @param group The element's group (e.g. `element_placeholders`).
   * @return The usage hint, or an empty string.
   */
  private fun buildUsageHint(element: JsonObject, name: String, group: String): String {
    return when (group) {
      "element_placeholders" -> buildEpUsageHint(element, name)
      "standard_configurations" -> buildStandardConfigUsageHint(element, name)
      else -> ""
    }
  }

  /** Builds the EP placeholder usage hint (see [buildUsageHint]). */
  private fun buildEpUsageHint(element: JsonObject, name: String): String {
    val paramCount = element.get("Parameter")?.takeIf { it.isJsonObject }?.asJsonObject?.size() ?: 0
    val form =
        if (paramCount == 0) {
          "{ $name }"
        } else {
          val params = (1..paramCount).joinToString(" ; ") { "Param$it" }
          "{ $name > $params }"
        }
    return "This is an Element Placeholder (EP). Its ID is \"$name\". To obtain its data, write the placeholder with EXACTLY this id as the value (e.g. $form). NEVER invent a different EP id and NEVER expand it into a JSON object/array."
  }

  /** Builds the standard configuration usage hint (see [buildUsageHint]). */
  private fun buildStandardConfigUsageHint(element: JsonObject, name: String): String {
    // Holistic.* are FORM-LEVEL standard configurations: they are activated by reporting them in
    // _codbiApplicability.applied with "targets":[], which the server stores into the form's CodBi
    // section (codbi-prop-standards). They must NEVER be applied by placing a CSS class on an
    // element, and their bare id must NEVER be used as a data-cb-func or cssclasses entry.
    if (name.startsWith("Holistic.")) {
      val globals0 =
          element.get("globals")?.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()
      val globalNames0 = globals0.entrySet().map { it.key }
      val globalNote0 =
          if (globalNames0.isEmpty()) ""
          else
              " It also declares global variable(s): ${globalNames0.joinToString(", ")}. When the user sets a value for one of them, write it into the form's TOP-LEVEL \"variables\" array as {\"name\":\"<VarName>\",\"aliasname\":\"<VarName>\",\"serveronly\":false,\"value\":\"<value>\"} — never as a data-cb-* attribute."
      var exclusionNote = ""
      // The speech standards record EXCLUSION classes (they carry the "XCL" = eXCLusion prefix):
      // CodBi_XCL_Speech / CodBi_XCL_Speech_Whisper EXCLUDE a single field from the FORM-LEVEL
      // speech standard via a CSS :not() selector. They do NOT enable speech and must never be
      // placed to request speech input.
      if (name == "Holistic.Media.Input.Speech" || name == "Holistic.Media.Input.Speech.Whisper") {
        exclusionNote =
            " NOTE: the CSS classes listed on this standard (CodBi_XCL_Speech / CodBi_XCL_Speech_Whisper) are EXCLUSION classes — they REMOVE a single field from the global speech standard. To ENABLE speech-on-all-text-fields, ONLY report this standard in _codbiApplicability.applied; do NOT put any class on an element."
      }
      return "This is a CodBi Standard Configuration applied at the FORM level. To activate it, include {\"id\":\"$name\",\"targets\":[]} in the top-level _codbiApplicability \"applied\" array (empty targets). Do NOT add any CSS class to an element and do NOT set data-cb-func to \"$name\" to apply it.$exclusionNote$globalNote0"
    }
    val classes = element.get("classes")?.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()
    val classNames = classes.entrySet().map { it.key }
    val classPrompts =
        element.get("ClassPrompts")?.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()
    // List every class with its purpose so the AI can pick the one that matches the requested
    // level.
    val classList =
        if (classNames.isEmpty()) ""
        else
            " It declares the CSS class(es): " +
                classNames.joinToString("; ") { cls ->
                  val purpose =
                      getJsonString(classPrompts, cls)?.takeIf { it.isNotBlank() }
                          ?: getJsonString(classes, cls)
                          ?: ""
                  if (purpose.isNotBlank()) "\"$cls\" ($purpose)" else "\"$cls\""
                } +
                ". Choose the class whose purpose matches the requested intensity — e.g. for an \"ultra shiny\" element use the ultra class (UltraShine_X), for a plain \"shiny\" element the regular class (RegularShine). Do NOT apply the same class to all elements when the prompt requests different levels."
    val globals = element.get("globals")?.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()
    val globalNames = globals.entrySet().map { it.key }
    val globalNote =
        if (globalNames.isEmpty()) ""
        else
            " It also declares global variable(s): ${globalNames.joinToString(", ")}. When the user sets a value for one of them, write it into the form's TOP-LEVEL \"variables\" array as {\"name\":\"<VarName>\",\"aliasname\":\"<VarName>\",\"serveronly\":false,\"value\":\"<value>\"} — never as a data-cb-* attribute."
    return "This is a CodBi Standard Configuration. Apply it by adding its CSS classes to the target element's \"cssclasses\" array. NEVER set data-cb-func to the standard configuration's name \"$name\" — standard configurations are applied via their CSS classes, NOT via data-cb-func.$classList$globalNote"
  }

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

  /**
   * Returns `true` when the local element's prompts must be omitted from what is transmitted to the
   * AI for the current user (per [CodBiElementAccess]).
   */
  private fun isHiddenElement(e: LocalElement): Boolean =
      CodBiElementAccess.isHidden("codbi.${e.group}.${normalizePromptKey(e.name)}", e.name)

  /** Assembles the condensed (compact) section of the local AI-capable elements for the AI. */
  fun condensedSection(em: EntityManager): String {
    val elements = loadAiCapableElements(em).filterNot(::isHiddenElement)
    if (elements.isEmpty()) return ""
    val sb = StringBuilder("\n\nCODBI LOCAL ELEMENTS (COMPACT)\n")
    for ((group, items) in elements.groupBy { it.group }) {
      sb.append("\n## ").append(groupLabel(group)).append("\n")
      for (e in items) {
        sb.append("\n### ").append(e.name).append("\n")
        sb.append(e.condensed).append("\n")
        if (e.usageHint.isNotEmpty()) sb.append(e.usageHint).append("\n")
      }
    }
    return sb.toString().trimEnd()
  }

  /** Assembles the detailed section of the local AI-capable elements for the AI. */
  fun detailedSection(em: EntityManager): String {
    val elements = loadAiCapableElements(em).filterNot(::isHiddenElement)
    if (elements.isEmpty()) return ""
    val sb = StringBuilder("\n\nCODBI LOCAL ELEMENTS (DETAILED)\n")
    for ((group, items) in elements.groupBy { it.group }) {
      sb.append("\n## ").append(groupLabel(group)).append("\n")
      for (e in items) {
        val header =
            when (e.group) {
              "element_placeholders" -> "${e.name} (Element Placeholder)"
              "standard_configurations" -> "${e.name} (Standard Configuration)"
              else -> e.name
            }
        sb.append("\n### ").append(header).append("\n")
        sb.append(e.composedDetailed).append("\n")
        if (e.usageHint.isNotEmpty()) sb.append(e.usageHint).append("\n")
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
    val elements = loadAiCapableElements(em).filterNot(::isHiddenElement)
    if (elements.isEmpty()) return ""
    val wanted = requestedIds.map { normalizePromptKey(it) }.filter { it.isNotEmpty() }.toSet()
    if (wanted.isEmpty()) return ""
    val bySuffix = elements.associate { normalizePromptKey(it.name) to it }
    val sb = StringBuilder("\n\nCODBI LOCAL REQUESTED DETAILS\n")
    var added = false
    for (norm in wanted) {
      val e = bySuffix[norm] ?: continue
      val header =
          when (e.group) {
            "element_placeholders" -> "${e.name} (Element Placeholder)"
            "standard_configurations" -> "${e.name} (Standard Configuration)"
            else -> e.name
          }
      sb.append("\n## ").append(header).append("\n")
      sb.append(e.composedDetailed).append("\n")
      if (e.usageHint.isNotEmpty()) sb.append(e.usageHint).append("\n")
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
