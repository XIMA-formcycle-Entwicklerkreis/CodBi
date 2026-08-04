package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import javax.persistence.EntityManagerFactory
import org.slf4j.LoggerFactory

/**
 * Persists and loads the change log of every CodBi AI assistant inference (form + workflow).
 *
 * Each successful `Run` of [AICodBiAssistant] records one row in the `codbi_ai_assistant_log` table
 * holding the timestamp, the user's prompt, the classified intent, the used model, and a structured
 * JSON description of the changes that were applied:
 * - **form** – `{ "widgetsCreated": [...], "widgetsRemoved": [...], "classesSet": [...],
 *   "attributesSet": [...] }`. The CodBi `data-cb-func` / `data-cb-*` attributes are marked with
 *   `kind: "func"` / `kind: "param"` so the UI can render them as special, unfoldable elements that
 *   reveal the CodBi parameters used by a functionality.
 * - **workflow** – `[ { "name": "...", "nodeType": "FC_EMAIL", "params": {...} }, ... ]` where each
 *   entry describes one workflow node and the parameters defined for it.
 *
 * The table schema is managed by [CodbiEntities] via
 * `db/changelog/codbi-ai-assistant-log-changelog.xml`.
 */
object AiAssistantLog {

  private val logger = LoggerFactory.getLogger(AiAssistantLog::class.java)
  private val gson: Gson = GsonBuilder().create()

  /** Property keys that are identity / structural and never rendered as user-facing attributes. */
  private val SKIP_ATTRS =
      setOf("name", "elements", "buttons", "cssclasses", "cssclasseswrapper", "action")

  /** Maximum number of log entries returned by [loadLogs]. */
  private const val DEFAULT_LIMIT = 200

  // region Write

  /**
   * Inserts one inference record into `codbi_ai_assistant_log`. [formKey] is the technical name/key
   * of the form the inference was run on; [formChanges] and [workflowChanges] are stored as JSON
   * text (CLOB). Returns `true` when the insert succeeded.
   */
  fun recordInference(
      emf: EntityManagerFactory?,
      prompt: String,
      intent: String,
      modelId: String,
      formKey: String?,
      workflowVersionId: Long?,
      formChanges: JsonObject?,
      workflowChanges: JsonArray?,
      tokensUsed: Long? = null
  ): Boolean {
    if (emf == null) return false
    return try {
      val em = emf.createEntityManager()
      try {
        em.transaction.begin()
        em.persist(
            CodbiAiAssistantLog(
                formKey = formKey?.take(200)?.takeIf { it.isNotBlank() },
                prompt = prompt.take(1000),
                intent = intent.take(20),
                modelId = modelId.take(100),
                tokens = tokensUsed,
                workflowVersionId = workflowVersionId,
                formChanges = formChanges?.toString(),
                workflowChanges = workflowChanges?.toString()))
        em.transaction.commit()
        true
      } catch (e: Exception) {
        if (em.transaction.isActive) {
          runCatching { em.transaction.rollback() }
        }
        logger.warn("[AiAssistantLog] Failed to record inference: {}", e.message)
        false
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to record inference: {}", e.message)
      false
    }
  }

  // endregion Write

  // region Read

  /**
   * Loads the most recent inference records ordered newest-first. When [formKey] is non-blank only
   * the entries of that form are returned (used by the designer change-log dialog to show the log
   * of the form currently being edited). Returns a JSON array string; each entry has the shape `{
   * "id", "ts", "formKey", "prompt", "intent", "modelId", "form": {...}, "workflow": [...] }`.
   */
  fun loadLogs(
      emf: EntityManagerFactory?,
      formKey: String? = null,
      limit: Int = DEFAULT_LIMIT
  ): String {
    if (emf == null) return "[]"
    return try {
      val em = emf.createEntityManager()
      try {
        val filter = formKey?.trim()?.takeIf { it.isNotEmpty() }
        val jpql =
            if (filter == null) {
              "SELECT l FROM CodbiAiAssistantLog l ORDER BY l.id DESC"
            } else {
              "SELECT l FROM CodbiAiAssistantLog l WHERE l.formKey = :formKey ORDER BY l.id DESC"
            }
        val query = em.createQuery(jpql, CodbiAiAssistantLog::class.java)
        if (filter != null) query.setParameter("formKey", filter)
        query.maxResults = limit.coerceIn(1, 500)
        val rows = query.resultList as List<CodbiAiAssistantLog>
        val out = JsonArray()
        for (entry in rows) {
          val e = JsonObject()
          e.addProperty("id", entry.id?.toString() ?: "")
          e.addProperty("ts", entry.ts?.toString() ?: "")
          e.addProperty("formKey", entry.formKey ?: "")
          e.addProperty("prompt", entry.prompt ?: "")
          e.addProperty("intent", entry.intent ?: "")
          e.addProperty("modelId", entry.modelId ?: "")
          e.addProperty("tokens", entry.tokens ?: 0)
          entry.formChanges
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  e.add("form", JsonParser.parseString(text))
                } catch (_: Exception) {
                  e.addProperty("form", text)
                }
              }
          entry.workflowChanges
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  e.add("workflow", JsonParser.parseString(text))
                } catch (_: Exception) {
                  e.addProperty("workflow", text)
                }
              }
          out.add(e)
        }
        gson.toJson(out)
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to load inference log: {}", e.message)
      "[]"
    }
  }

  /**
   * Best-effort extraction of the form's technical name/key from a form persist JSON. Checks the
   * `metadata` object first (Formcycle stores the form identity there), then a few root-level
   * candidates. Returns `null` when nothing is found or the JSON cannot be parsed.
   */
  fun extractFormKey(persistJson: String?): String? {
    if (persistJson.isNullOrBlank()) return null
    return try {
      val root = JsonParser.parseString(persistJson).asJsonObject
      val candidates = mutableListOf<String>()
      val meta = root.getAsJsonObject("metadata")
      if (meta != null) {
        for (key in listOf("name", "key", "formKey", "technicalName")) {
          meta
              .get(key)
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.takeIf { it.isNotBlank() }
              ?.let { candidates.add(it) }
        }
      }
      for (key in listOf("name", "key", "formKey")) {
        root
            .get(key)
            ?.takeIf { it.isJsonPrimitive }
            ?.asString
            ?.takeIf { it.isNotBlank() }
            ?.let { candidates.add(it) }
      }
      candidates.firstOrNull()?.take(200)
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to extract form key: {}", e.message)
      null
    }
  }

  // endregion Read

  // region Form diff

  /**
   * Computes a structured description of the changes between [beforeJson] (the persist JSON the
   * frontend sent before the AI ran) and [afterJson] (the modified form JSON returned by the AI).
   *
   * Result shape:
   * ```
   * {
   *   "widgetsCreated": [ { "name": "...", "className": "XTextField" } ],
   *   "widgetsRemoved": [ ... ],
   *   "classesSet": [ { "widget": "...", "className": "...", "classes": ["CodBi_..."] } ],
   *   "attributesSet": [
   *     {
   *       "widget": "...",
   *       "className": "...",
   *       "attributes": [
   *         { "name": "label", "value": "...", "kind": "attr", "codbi": false },
   *         { "name": "data-cb-func", "value": "HTML.CSS", "kind": "func", "codbi": true,
   *           "params": [ { "name": "data-cb-color", "value": "red", "kind": "param", "codbi": true } ] }
   *       ]
   *     }
   *   ]
   * }
   * ```
   */
  fun computeFormChanges(beforeJson: String, afterJson: String): JsonObject {
    val result = JsonObject()
    val widgetsCreated = JsonArray()
    val widgetsRemoved = JsonArray()
    val classesSet = JsonArray()
    val attributesSet = JsonArray()
    try {
      val before = JsonParser.parseString(beforeJson).asJsonObject
      val after = JsonParser.parseString(afterJson).asJsonObject
      val beforeWidgets = collectWidgets(before)
      val afterWidgets = collectWidgets(after)

      val beforeNames = beforeWidgets.keys
      val afterNames = afterWidgets.keys

      for (name in afterNames - beforeNames) {
        afterWidgets[name]?.let { widgetsCreated.add(widgetSummary(it)) }
      }
      for (name in beforeNames - afterNames) {
        beforeWidgets[name]?.let { widgetsRemoved.add(widgetSummary(it)) }
      }
      for (name in afterNames.intersect(beforeNames)) {
        val afterItem = afterWidgets[name] ?: continue
        val beforeItem = beforeWidgets[name] ?: continue
        val afterProps = propsOf(afterItem)
        val beforeProps = propsOf(beforeItem)

        val addedClasses = cssClassesOf(afterProps) - cssClassesOf(beforeProps)
        if (addedClasses.isNotEmpty()) {
          val entry = JsonObject()
          entry.addProperty("widget", name)
          entry.addProperty("className", classNameOf(afterItem))
          entry.add("classes", gson.toJsonTree(addedClasses.sorted()))
          classesSet.add(entry)
        }

        val changedKeys = mutableListOf<String>()
        for ((key, value) in afterProps.entrySet()) {
          if (key.lowercase() in SKIP_ATTRS) continue
          val beforeValue = beforeProps.get(key)
          if (beforeValue == null || beforeValue != value) {
            changedKeys.add(key)
          }
        }
        if (changedKeys.isNotEmpty()) {
          val entry = JsonObject()
          entry.addProperty("widget", name)
          entry.addProperty("className", classNameOf(afterItem))
          entry.add("attributes", buildAttributes(changedKeys, afterProps))
          attributesSet.add(entry)
        }
      }

      val base = after.get("base")?.takeIf { it.isJsonObject }?.asJsonObject
      // Newly created widgets also contribute their classes and attributes so the log is complete.
      for (name in afterNames - beforeNames) {
        val afterItem = afterWidgets[name] ?: continue
        val afterProps = propsOf(afterItem)
        val className = classNameOf(afterItem)
        val allClasses = cssClassesOf(afterProps)
        if (allClasses.isNotEmpty()) {
          val entry = JsonObject()
          entry.addProperty("widget", name)
          entry.addProperty("className", className)
          entry.add("classes", gson.toJsonTree(allClasses.sorted()))
          classesSet.add(entry)
        }
        // Only report the attributes the AI actually set: compare every property against the
        // widget class's base template defaults, so Formcycle's automatic defaults (maxwidth,
        // computedwidth, viewstatus, ...) are not shown as if the AI had set them.
        val baseTemplate = base?.get(className)?.takeIf { it.isJsonObject }?.asJsonObject
        val baseProps = baseTemplate?.get("properties")?.takeIf { it.isJsonObject }?.asJsonObject
        val aiSetKeys =
            afterProps
                .entrySet()
                .map { it.key }
                .filter { key ->
                  if (key.lowercase() in SKIP_ATTRS) return@filter false
                  val baseVal = baseProps?.get(key)
                  baseVal == null || baseVal != afterProps.get(key)
                }
        if (aiSetKeys.isNotEmpty()) {
          val entry = JsonObject()
          entry.addProperty("widget", name)
          entry.addProperty("className", className)
          entry.add("attributes", buildAttributes(aiSetKeys, afterProps))
          attributesSet.add(entry)
        }
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to compute form changes: {}", e.message)
    }
    result.add("widgetsCreated", widgetsCreated)
    result.add("widgetsRemoved", widgetsRemoved)
    result.add("classesSet", classesSet)
    result.add("attributesSet", attributesSet)
    return result
  }

  /**
   * Recursively collects every widget of a form persist JSON into a map keyed by its technical name
   * (`properties.name`, or the button `name` for [XButtonList] entries).
   */
  private fun collectWidgets(root: JsonObject): Map<String, JsonObject> {
    val map = linkedMapOf<String, JsonObject>()
    fun walk(items: JsonArray?) {
      if (items == null) return
      for (el in items) {
        if (!el.isJsonObject) continue
        val obj = el.asJsonObject
        val className = classNameOf(obj)
        val props = propsOf(obj)
        if (className == "XButtonList") {
          props.getAsJsonArray("buttons")?.forEach { btn ->
            if (btn.isJsonObject) {
              val btnObj = btn.asJsonObject
              val btnName =
                  btnObj.get("name")?.asString?.takeIf { it.isNotBlank() } ?: return@forEach
              map[btnName] = btnObj
            }
          }
        }
        val name = props.get("name")?.asString?.takeIf { it.isNotBlank() }
        if (name != null) map[name] = obj
        walk(props.getAsJsonArray("elements"))
      }
    }
    walk(root.getAsJsonArray("items"))
    return map
  }

  private fun widgetSummary(item: JsonObject): JsonObject {
    val props = propsOf(item)
    val summary = JsonObject()
    val name =
        props.get("name")?.asString?.takeIf { it.isNotBlank() }
            ?: item.get("name")?.asString
            ?: "unnamed"
    summary.addProperty("name", name)
    summary.addProperty("className", classNameOf(item))
    return summary
  }

  private fun propsOf(item: JsonObject): JsonObject {
    val nested = item.getAsJsonObject("properties")
    return nested ?: item
  }

  private fun classNameOf(item: JsonObject): String {
    val cls = item.get("className")?.asString
    if (!cls.isNullOrBlank()) return cls
    // XButtonList buttons are stored as bare objects without a className.
    return "BUTTON"
  }

  private fun cssClassesOf(props: JsonObject): Set<String> {
    val arr = props.getAsJsonArray("cssclasses") ?: return emptySet()
    return arr.mapNotNull { el ->
          el.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
        }
        .toSet()
  }

  /**
   * Builds the `attributes` array for one widget. The CodBi attributes `data-cb-func` (kind `func`)
   * and `data-cb-*` (kind `param`) are flagged as special. Every functionality listed in
   * `data-cb-func` becomes its own `func` entry whose `params` contain only the `data-cb-*`
   * parameters that belong to that functionality (resolved via the CodBi details-index); a
   * parameter that belongs to several functionalities is repeated under each of them.
   *
   * The data-cb attributes are read from BOTH the widget's direct `data-cb-*` property keys and its
   * normalized `attributes` array (the `[{"text":"data-cb-*","value":"..."}]` form produced by
   * `restoreStrippedFields`), so the raw "attributes" array is never shown as a single opaque
   * entry.
   */
  private fun buildAttributes(changedKeys: List<String>, afterProps: JsonObject): JsonArray {
    val funcValues = mutableListOf<String>()
    val paramValues = LinkedHashMap<String, JsonElement>()
    val regularValues = LinkedHashMap<String, JsonElement>()
    val changed = changedKeys.map { it.lowercase() }.toSet()

    for ((key, value) in afterProps.entrySet()) {
      val lower = key.lowercase()
      if (lower == "attributes") {
        // The normalized data-cb attributes array: [{"text":"data-cb-*","value":"..."}, ...]
        if (value.isJsonArray) {
          for (el in value.asJsonArray) {
            if (!el.isJsonObject) continue
            val obj = el.asJsonObject
            val text = obj.get("text")?.asString ?: obj.get("name")?.asString ?: continue
            val v = obj.get("value") ?: JsonNull.INSTANCE
            val tl = text.lowercase()
            when {
              tl == "data-cb-func" -> funcValues.add(valueToString(v))
              tl.startsWith("data-cb-") -> paramValues.putIfAbsent(text, v)
              else -> regularValues.putIfAbsent(text, v)
            }
          }
        }
        continue
      }
      if (lower !in changed) continue
      if (lower == "data-cb-func") {
        funcValues.add(valueToString(value))
      } else if (lower.startsWith("data-cb-")) {
        paramValues.putIfAbsent(key, value)
      } else {
        regularValues.putIfAbsent(key, value)
      }
    }

    val attrs = JsonArray()

    // Functionality → allowed parameter-name index (from the CodBi details index). Each
    // functionality node lists ONLY the data-cb-* parameters that belong to it; a parameter that
    // belongs to several functionalities is repeated under each of them.
    val paramIndex = CodbiCapabilities.functionalityParamsIndex()
    val aliasIndex = CodbiCapabilities.functionalityAliases()

    val funcNames =
        funcValues.flatMap { it.split(",").map { it.trim() } }.filter { it.isNotEmpty() }.distinct()

    if (funcNames.isNotEmpty()) {
      // Resolve each applied functionality to its canonical parameter-name set (empty when the
      // functionality is not known to the index — then no filtering is applied).
      val funcAllowed = LinkedHashMap<String, Set<String>>()
      for (funcName in funcNames) {
        funcAllowed[funcName] =
            canonicalFunctionalityId(funcName, paramIndex, aliasIndex)?.let { paramIndex[it] }
                ?: emptySet()
      }
      val anyKnown = funcAllowed.values.any { it.isNotEmpty() }

      for ((funcName, allowed) in funcAllowed) {
        val entry = JsonObject()
        entry.addProperty("name", funcName)
        entry.addProperty("value", "")
        entry.addProperty("kind", "func")
        entry.addProperty("codbi", true)
        val funcParams = JsonArray()
        for ((name, value) in paramValues) {
          val pkey = name.removePrefix("data-cb-").lowercase()
          val owned = pkey in allowed
          // A parameter that belongs to NO applied functionality is still listed (fallback) so no
          // information is lost.
          val orphan = !anyKnown || funcAllowed.values.none { pkey in it }
          if (owned || orphan) funcParams.add(buildParamEntry(name, value))
        }
        if (funcParams.size() > 0) entry.add("params", funcParams)
        attrs.add(entry)
      }
    } else if (paramValues.isNotEmpty()) {
      // data-cb-* parameters without any data-cb-func — still show them.
      for ((name, value) in paramValues) attrs.add(buildParamEntry(name, value))
    }

    for ((name, value) in regularValues.toSortedMap()) {
      val entry = JsonObject()
      entry.addProperty("name", name)
      entry.addProperty("value", valueToString(value))
      entry.addProperty("kind", "attr")
      entry.addProperty("codbi", false)
      attrs.add(entry)
    }
    return attrs
  }

  /** Resolves a `data-cb-func` value (case-insensitive, alias-aware) to its canonical CodBi ID. */
  private fun canonicalFunctionalityId(
      funcName: String,
      paramIndex: Map<String, Set<String>>,
      aliasIndex: Map<String, String>
  ): String? {
    if (funcName in paramIndex) return funcName
    aliasIndex[funcName.lowercase()]?.let {
      return it
    }
    return paramIndex.keys.firstOrNull { it.equals(funcName, ignoreCase = true) }
  }

  /** Builds a single `data-cb-*` parameter entry (kind `param`, CodBi). */
  private fun buildParamEntry(name: String, value: JsonElement): JsonObject {
    val entry = JsonObject()
    entry.addProperty("name", name)
    entry.addProperty("value", valueToString(value))
    entry.addProperty("kind", "param")
    entry.addProperty("codbi", true)
    return entry
  }

  private fun valueToString(el: JsonElement?): String {
    if (el == null || el.isJsonNull) return ""
    return if (el.isJsonPrimitive) el.asString else el.toString()
  }

  // endregion Form diff
}
