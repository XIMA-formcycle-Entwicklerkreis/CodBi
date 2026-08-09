package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.Standard
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import javax.persistence.EntityManager
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

  /** Empty log response: no entries and zeroed totals (used when no DB / an error occurs). */
  private const val EMPTY_LOG_RESPONSE =
      """{"entries":[],"totals":{"tokensIn":0,"tokensOut":0,"costByCurrency":{}},"sensitiveElements":[],"sensitiveChecks":[]}"""

  // region Write

  /**
   * Inserts one inference record into `codbi_ai_assistant_log`. [formKey] is the technical name/key
   * of the form the inference was run on; [formChanges] and [workflowChanges] are stored as JSON
   * text (CLOB). [tokensIn] and [tokensOut] are the estimated input (prompt) and output
   * (completion) tokens; the total is stored in the `tokens` column. Returns `true` when the insert
   * succeeded.
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
      tokensIn: Long? = null,
      tokensOut: Long? = null,
      cost: Double? = null,
      currency: String? = null,
      username: String? = null,
      clarification: JsonArray? = null
  ): Boolean {
    if (emf == null) return false
    return try {
      val em = emf.createEntityManager()
      try {
        em.transaction.begin()
        em.persist(
            CodbiAiAssistantLog(
                formKey = formKey?.take(200)?.takeIf { it.isNotBlank() },
                username = username?.take(200)?.takeIf { it.isNotBlank() },
                prompt = prompt.take(1000),
                intent = intent.take(20),
                modelId = modelId.take(100),
                tokens = (tokensIn ?: 0L) + (tokensOut ?: 0L),
                tokensIn = tokensIn,
                tokensOut = tokensOut,
                cost = cost,
                currency = currency?.take(10)?.takeIf { it.isNotBlank() },
                workflowVersionId = workflowVersionId,
                formChanges = formChanges?.toString(),
                workflowChanges = workflowChanges?.toString(),
                clarification = clarification?.takeIf { it.size() > 0 }?.toString()))
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

  /**
   * Inserts or removes the sensitive-element dismiss check for one log entry / element name / user.
   * When [checked] is `true` a row is added (the user ticked the checkbox); when `false` the
   * matching row is removed (the user unticked it). Returns `true` when the operation succeeded.
   */
  fun setSensitiveCheck(
      emf: EntityManagerFactory?,
      entryId: Long?,
      elementName: String?,
      username: String?,
      checked: Boolean
  ): Boolean {
    if (emf == null || entryId == null || elementName.isNullOrBlank() || username.isNullOrBlank()) {
      return false
    }
    return try {
      val em = emf.createEntityManager()
      try {
        em.transaction.begin()
        val q =
            em.createQuery(
                "SELECT c FROM CodbiAiLogSensitiveCheck c WHERE c.logEntryId = :id AND c.elementName = :name AND c.username = :user",
                CodbiAiLogSensitiveCheck::class.java)
        q.setParameter("id", entryId)
        q.setParameter("name", elementName)
        q.setParameter("user", username)
        val existing = (q.resultList as List<CodbiAiLogSensitiveCheck>).firstOrNull()
        if (checked) {
          if (existing == null) {
            em.persist(
                CodbiAiLogSensitiveCheck(
                    logEntryId = entryId, elementName = elementName, username = username))
          }
        } else if (existing != null) {
          em.remove(existing)
        }
        em.transaction.commit()
        true
      } catch (e: Exception) {
        if (em.transaction.isActive) {
          runCatching { em.transaction.rollback() }
        }
        logger.warn("[AiAssistantLog] Failed to set sensitive check: {}", e.message)
        false
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to set sensitive check: {}", e.message)
      false
    }
  }

  /** Loads the sensitive-check rows of [username] whose log entry is among [out]. */
  private fun loadSensitiveChecks(em: EntityManager, out: JsonArray, username: String?): JsonArray {
    val checks = JsonArray()
    if (username.isNullOrBlank()) return checks
    try {
      val entryIds =
          out.mapNotNull { el ->
            el.takeIf { it.isJsonObject }?.asJsonObject?.get("id")?.asString?.toLongOrNull()
          }
      if (entryIds.isEmpty()) return checks
      val q =
          em.createQuery(
              "SELECT c FROM CodbiAiLogSensitiveCheck c WHERE c.username = :username AND c.logEntryId IN :ids",
              CodbiAiLogSensitiveCheck::class.java)
      q.setParameter("username", username)
      q.setParameter("ids", entryIds)
      for (c in q.resultList as List<CodbiAiLogSensitiveCheck>) {
        val o = JsonObject()
        o.addProperty("entryId", c.logEntryId.toString())
        o.addProperty("elementName", c.elementName)
        o.addProperty("username", c.username ?: "")
        o.addProperty("checkedAt", c.checkedAt?.toString() ?: "")
        checks.add(o)
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to load sensitive checks: {}", e.message)
    }
    return checks
  }

  // endregion Write

  // region Read

  /**
   * Loads the most recent inference records ordered newest-first. When [formKey] is non-blank only
   * the entries of that form are returned (used by the designer change-log dialog to show the log
   * of the form currently being edited). Returns a JSON object string `{ "entries": [...],
   * "totals": { "tokensIn", "tokensOut", "costByCurrency": { "<currency>": cost } } }`. Each entry
   * has the shape `{ "id", "ts", "formKey", "prompt", "intent", "modelId", "form": {...},
   * "workflow": [...] }`. The totals are derived server-side from the summed input/output tokens
   * per model × the configured price per 1,000,000 tokens (grouped by currency), so the total cost
   * does not depend on summing stored per-entry costs.
   */
  fun loadLogs(
      emf: EntityManagerFactory?,
      formKey: String? = null,
      limit: Int = DEFAULT_LIMIT,
      username: String? = null
  ): String {
    if (emf == null) return EMPTY_LOG_RESPONSE
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
        var totalTokensIn = 0L
        var totalTokensOut = 0L
        // Summed tokens per model — used to derive the total cost from the configured price.
        val tokensByModel = mutableMapOf<String, Pair<Long, Long>>()
        for (entry in rows) {
          val tokensIn = entry.tokensIn ?: 0L
          val tokensOut = entry.tokensOut ?: 0L
          totalTokensIn += tokensIn
          totalTokensOut += tokensOut
          val model = entry.modelId ?: ""
          val prev = tokensByModel[model]
          tokensByModel[model] = (prev?.first ?: 0L) + tokensIn to (prev?.second ?: 0L) + tokensOut
          val e = JsonObject()
          e.addProperty("id", entry.id?.toString() ?: "")
          e.addProperty("ts", entry.ts?.toString() ?: "")
          e.addProperty("formKey", entry.formKey ?: "")
          e.addProperty("prompt", entry.prompt ?: "")
          e.addProperty("intent", entry.intent ?: "")
          e.addProperty("modelId", entry.modelId ?: "")
          e.addProperty("tokens", entry.tokens ?: 0)
          e.addProperty("tokensIn", entry.tokensIn ?: 0)
          e.addProperty("tokensOut", entry.tokensOut ?: 0)
          e.addProperty("cost", entry.cost ?: 0)
          e.addProperty("currency", entry.currency ?: "")
          e.addProperty("username", entry.username ?: "")
          // Sensitive elements this entry actually used, recomputed from its stored form changes
          // against the current AI_Log_SensitiveElements configuration. The frontend uses this to
          // auto-open the change log after a workflow-triggered reload (see
          // autoOpenIfRecentSensitive).
          entry.formChanges
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                runCatching {
                      val parsed = JsonParser.parseString(text)
                      if (parsed.isJsonObject) {
                        usedSensitiveElements(parsed.asJsonObject, AI.logSensitiveElements)
                      } else {
                        emptyList()
                      }
                    }
                    .getOrNull()
              }
              ?.takeIf { it.isNotEmpty() }
              ?.let { used -> e.add("sensitiveUsed", gson.toJsonTree(used)) }
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
          entry.clarification
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  e.add("clarification", JsonParser.parseString(text))
                } catch (_: Exception) {
                  e.addProperty("clarification", text)
                }
              }
          out.add(e)
        }
        // Total cost per currency derived from summed tokens per model × price per 1M (no per-entry
        // cost sums). Entries whose model has no configured price contribute no cost.
        val costByCurrency = linkedMapOf<String, Double>()
        val standard = Standard.instance
        for ((model, tokens) in tokensByModel) {
          val price = standard?.priceForModel(model) ?: continue
          val cost = price.costFor(tokens.first, tokens.second) ?: continue
          val currency = price.currency ?: continue
          costByCurrency[currency] = (costByCurrency[currency] ?: 0.0) + cost
        }
        val totals = JsonObject()
        totals.addProperty("tokensIn", totalTokensIn)
        totals.addProperty("tokensOut", totalTokensOut)
        val costObj = JsonObject()
        for ((currency, cost) in costByCurrency) {
          costObj.addProperty(currency, cost)
        }
        totals.add("costByCurrency", costObj)
        val root = JsonObject()
        root.add("entries", out)
        root.add("totals", totals)
        // The current set of configured sensitive elements (AI_Log_SensitiveElements). The frontend
        // uses this to mark every node that matches a sensitive element with an always-on red
        // border.
        // It is read fresh on every request so configuration changes take effect the next time the
        // change log is opened (the set is re-read from the plugin properties on
        // re-initialization).
        root.add("sensitiveElements", gson.toJsonTree(AI.logSensitiveElements.sorted()))
        // The sensitive-element dismiss checks made by the requesting user. The frontend uses them
        // to keep already-checked nodes unmarked for this user.
        root.add("sensitiveChecks", loadSensitiveChecks(em, out, username))
        // The requesting user's login name, so the frontend can attribute a freshly-ticked
        // sensitive
        // check to the right user immediately (without waiting for a reload).
        root.addProperty("currentUser", username ?: "")
        gson.toJson(root)
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to load inference log: {}", e.message)
      EMPTY_LOG_RESPONSE
    }
  }

  /**
   * Loads the recent change-log entries of the given form (across ALL users) as a compact JSON
   * array for AI context injection. Used only when the AI explicitly asks for the change history
   * because the user's request refers to earlier work (e.g. "apply the same as last week").
   */
  fun loadChangeHistoryForAi(
      emf: EntityManagerFactory?,
      formKey: String?,
      limit: Int = 20
  ): String? {
    // Only the entries of the current form are loaded. The frontend always resolves a non-empty
    // form key (from XFC_METADATA.currentProject.id), so a blank key means "no form context" and
    // the history is intentionally not returned (never fall back to other forms' entries).
    if (emf == null || formKey.isNullOrBlank()) return null
    return try {
      val em = emf.createEntityManager()
      try {
        val q =
            em.createQuery(
                "SELECT l FROM CodbiAiAssistantLog l WHERE l.formKey = :formKey ORDER BY l.id DESC",
                CodbiAiAssistantLog::class.java)
        q.setParameter("formKey", formKey.trim())
        q.maxResults = limit.coerceIn(1, 100)
        val rows = q.resultList as List<CodbiAiAssistantLog>
        if (rows.isEmpty()) return null
        // Deliver the change log as JSON — the AI interprets it itself, guided by a schema
        // description that is injected alongside it
        // (ts/username/prompt/form/workflow/clarification).
        val arr = JsonArray()
        for (entry in rows) {
          val o = JsonObject()
          o.addProperty("ts", entry.ts?.toString() ?: "")
          o.addProperty("username", entry.username ?: "")
          o.addProperty("intent", entry.intent ?: "")
          o.addProperty("modelId", entry.modelId ?: "")
          o.addProperty("prompt", (entry.prompt ?: "").take(600))
          entry.formChanges
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  o.add("form", JsonParser.parseString(text))
                } catch (_: Exception) {
                  o.addProperty("form", text.take(800))
                }
              }
          entry.workflowChanges
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  o.add("workflow", JsonParser.parseString(text))
                } catch (_: Exception) {
                  o.addProperty("workflow", text.take(800))
                }
              }
          entry.clarification
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  o.add("clarification", JsonParser.parseString(text))
                } catch (_: Exception) {
                  o.addProperty("clarification", text.take(400))
                }
              }
          arr.add(o)
        }
        gson.toJson(arr)
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to load change history for AI: {}", e.message)
      null
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
      // Guard against a non-object "metadata" value (some AI-emitted persist JSONs write it as a
      // plain string/primitive, which would make getAsJsonObject throw a ClassCastException).
      val meta = root.get("metadata")?.takeIf { it.isJsonObject }?.asJsonObject
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
    result.add("variablesSet", computeVariablesDiff(beforeJson, afterJson))
    return result
  }

  /**
   * Determines which of the configured **sensitive** CodBi element names ([sensitive], already
   * lowercased) were actually used in the given change description ([formChanges]). Matching is
   * case-insensitive and covers:
   * - `widgetsCreated[].name` / `.className`
   * - `classesSet[].classes[]` (standard-configuration CSS classes)
   * - `attributesSet[].attributes[]` whose value contains the element name (e.g. a `data-cb-func`
   *   value, or a `data-cb-*` parameter value holding an EP placeholder like `{ pluto > ... }`)
   * - `variablesSet[].name` (global variables)
   *
   * @param formChanges The change description produced by [computeFormChanges].
   * @param sensitive The lowercased set of sensitive element names (from
   *   `AI.logSensitiveElements`).
   * @return The matched sensitive element names, sorted for stable output.
   */
  fun usedSensitiveElements(formChanges: JsonObject, sensitive: Set<String>): List<String> {
    if (sensitive.isEmpty()) return emptyList()
    val found = mutableSetOf<String>()
    try {
      val haystack = StringBuilder()
      formChanges.getAsJsonArray("widgetsCreated")?.forEach { el ->
        if (el.isJsonObject) {
          el.asJsonObject
              .get("name")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
          el.asJsonObject
              .get("className")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
        }
      }
      formChanges.getAsJsonArray("classesSet")?.forEach { el ->
        if (el.isJsonObject) {
          el.asJsonObject.getAsJsonArray("classes")?.forEach { c ->
            if (c.isJsonPrimitive) haystack.append(' ').append(c.asString)
          }
        }
      }
      formChanges.getAsJsonArray("attributesSet")?.forEach { el ->
        if (el.isJsonObject) {
          el.asJsonObject.getAsJsonArray("attributes")?.forEach { a ->
            if (a.isJsonObject) {
              val attr = a.asJsonObject
              // The attribute's NAME carries the functionality / EP id (e.g. "Sys.Log.Console"),
              // while its VALUE carries the payload. Scan both (plus the kind), so a configured
              // sensitive element matches even when only the name is present (empty value funcs).
              for (key in listOf("name", "value", "kind")) {
                attr
                    .get(key)
                    ?.takeIf { it.isJsonPrimitive }
                    ?.asString
                    ?.let { haystack.append(' ').append(it) }
              }
              // The CodBi parameters of a functionality (data-cb-*) may themselves reference a
              // sensitive element (e.g. an EP id written into a param value).
              attr.getAsJsonArray("params")?.forEach { p ->
                if (p.isJsonObject) {
                  for (key in listOf("name", "value")) {
                    p.asJsonObject
                        .get(key)
                        ?.takeIf { it.isJsonPrimitive }
                        ?.asString
                        ?.let { haystack.append(' ').append(it) }
                  }
                }
              }
            }
          }
        }
      }
      formChanges.getAsJsonArray("variablesSet")?.forEach { el ->
        if (el.isJsonObject) {
          el.asJsonObject
              .get("name")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
        }
      }
      val text = haystack.toString()
      for (name in sensitive) {
        // Token-based match (word boundaries), so "HTML" does not match inside "HTML.CSS".
        if (Regex("(?i)(?<![A-Za-z0-9_.])${Regex.escape(name)}(?![A-Za-z0-9_.])")
            .containsMatchIn(text)) {
          found.add(name)
        }
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to compute used sensitive elements: {}", e.message)
    }
    return found.sorted()
  }

  /**
   * Computes the global-variable changes between [beforeJson] and [afterJson]. Global variables
   * live in the form's top-level `variables` array. The result is a JSON array of entries, each
   * either `{ "name": "...", "value": "..." }` for a set/updated variable, or `{ "name": "...",
   * "removed": true }` for one that was removed.
   */
  private fun computeVariablesDiff(beforeJson: String, afterJson: String): JsonArray {
    val result = JsonArray()
    try {
      val before = variablesByName(JsonParser.parseString(beforeJson).asJsonObject)
      val after = variablesByName(JsonParser.parseString(afterJson).asJsonObject)
      for ((name, value) in after) {
        if (before[name] != value) {
          val entry = JsonObject()
          entry.addProperty("name", name)
          entry.addProperty("value", value ?: "")
          result.add(entry)
        }
      }
      for (name in before.keys - after.keys) {
        val entry = JsonObject()
        entry.addProperty("name", name)
        entry.addProperty("removed", true)
        result.add(entry)
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to compute variables diff: {}", e.message)
    }
    return result
  }

  /** Returns a map of the form's global variable name → its `value` (may be null). */
  private fun variablesByName(root: JsonObject): Map<String, String?> {
    val variables =
        root.get("variables")?.takeIf { it.isJsonArray }?.asJsonArray ?: return emptyMap()
    val result = mutableMapOf<String, String?>()
    for (el in variables) {
      if (!el.isJsonObject) continue
      val obj = el.asJsonObject
      val name = obj.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      val value = obj.get("value")?.takeIf { it.isJsonPrimitive }?.asString
      result[name] = value
    }
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
