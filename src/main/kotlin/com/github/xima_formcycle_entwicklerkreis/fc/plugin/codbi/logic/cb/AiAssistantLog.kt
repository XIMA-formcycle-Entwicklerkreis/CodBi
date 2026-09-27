package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.Standard
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.google.gson.JsonPrimitive
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

  /**
   * Change-log serializer. HTML escaping is disabled (see `AICodBiAssistant.gson`): the logged form
   * JSON, prompts and attribute values contain HTML/CSS/EP text, and `\u003c`-style escapes inflate
   * both the stored payload and the AI change-history prompt that is built from it — with no
   * information gained, since the consumer parses JSON.
   */
  private val gson: Gson = GsonBuilder().disableHtmlEscaping().create()

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
   * (completion) tokens; the total is stored in the `tokens` column. [trips] breaks that total down
   * per AI call (one JSON object per inference: phase, model, tokens in/out, cost, currency).
   * Returns `true` when the insert succeeded.
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
      clarification: JsonArray? = null,
      chatReply: String? = null,
      trips: JsonArray? = null,
      /**
       * Full resolved items/nodes of this run — see [computeAppliedItems] and the `items` column.
       */
      items: JsonObject? = null,
      /** Set when this row was re-applied from an earlier entry without an inference. */
      appliedFrom: Long? = null
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
                prompt = prompt.take(4000),
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
                clarification = clarification?.takeIf { it.size() > 0 }?.toString(),
                chatReply = chatReply,
                trips = trips?.takeIf { it.size() > 0 }?.toString(),
                items = items?.toString(),
                appliedFrom = appliedFrom))
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
          // Sensitive elements this entry actually used, recomputed from its stored FORM and
          // WORKFLOW changes against the current AI_Log_SensitiveElements configuration. The
          // configured list may hold CodBi elements, FORMCYCLE widgets (XTextField, ...) and
          // workflow node types (FC_EMAIL, FC_SQL_STATEMENT, ...). The frontend uses this to
          // auto-open the change log after a workflow-triggered reload (see
          // autoOpenIfRecentSensitive).
          runCatching {
                val used = LinkedHashSet<String>()
                entry.formChanges
                    ?.takeIf { it.isNotBlank() }
                    ?.let { text ->
                      val parsed = JsonParser.parseString(text)
                      if (parsed.isJsonObject) {
                        used.addAll(
                            usedSensitiveElements(parsed.asJsonObject, AI.logSensitiveElements))
                      }
                    }
                entry.workflowChanges
                    ?.takeIf { it.isNotBlank() }
                    ?.let { text ->
                      val parsed = JsonParser.parseString(text)
                      if (parsed.isJsonArray) {
                        used.addAll(
                            usedSensitiveWorkflowElements(
                                parsed.asJsonArray, AI.logSensitiveElements))
                      }
                    }
                used.sorted()
              }
              .getOrNull()
              ?.takeIf { it.isNotEmpty() }
              ?.let { used -> e.add("sensitiveUsed", gson.toJsonTree(used)) }
          // Destructive SQL statements blocked by the backend sanitizer in this entry's workflow
          // changes. The frontend uses this to auto-open the change log (with an error icon) after
          // a
          // workflow-triggered reload, exactly like sensitiveUsed does for sensitive elements.
          entry.workflowChanges
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                runCatching {
                      val parsed = JsonParser.parseString(text)
                      if (parsed.isJsonArray) {
                        blockedSqlNodeLabels(parsed.asJsonArray)
                      } else {
                        emptyList()
                      }
                    }
                    .getOrNull()
              }
              ?.takeIf { it.isNotEmpty() }
              ?.let { used -> e.add("blockedSqlUsed", gson.toJsonTree(used)) }
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
          // Whether this entry can be re-applied to the CURRENT form WITHOUT an inference, and
          // which
          // elements the change-log tree may offer individually. The (potentially large) item JSON
          // itself stays in the database — the `applyLogEntry` action fetches it by entry id.
          entry.items
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                runCatching { JsonParser.parseString(text).asJsonObject }
                    .getOrNull()
                    ?.let { obj ->
                      val names = JsonArray()
                      val form = obj.getAsJsonObject("form")
                      for (section in listOf("created", "changed")) {
                        form?.getAsJsonArray(section)?.forEach { el ->
                          val name =
                              el.takeIf { it.isJsonObject }
                                  ?.asJsonObject
                                  ?.get("item")
                                  ?.takeIf { it.isJsonObject }
                                  ?.asJsonObject
                                  ?.getAsJsonObject("properties")
                                  ?.get("name")
                                  ?.takeIf { it.isJsonPrimitive }
                                  ?.asString
                          if (!name.isNullOrBlank() && names.none { it.asString == name }) {
                            names.add(name)
                          }
                        }
                      }
                      // Container detection: an item is a CONTAINER when another logged item's
                      // recorded `parent` is its name. The tree adds the extra "element only"
                      // (without children) re-apply button for exactly these.
                      val parentNames = LinkedHashSet<String>()
                      for (section in listOf("created", "changed")) {
                        form?.getAsJsonArray(section)?.forEach { el ->
                          val parent =
                              el.takeIf { it.isJsonObject }
                                  ?.asJsonObject
                                  ?.get("parent")
                                  ?.takeIf { it.isJsonPrimitive }
                                  ?.asString
                          if (!parent.isNullOrBlank()) parentNames.add(parent)
                        }
                      }
                      val containerNames = JsonArray()
                      for (parent in parentNames) {
                        if (names.any { it.asString == parent }) containerNames.add(parent)
                      }
                      // The workflow paths this entry can re-create individually (each carries the
                      // full task spec in `items.workflow.nodes`). Only entries recorded with the
                      // richer payload have them; the tree offers the per-node button only for
                      // these
                      // names.
                      val workflowNames = JsonArray()
                      obj.getAsJsonObject("workflow")?.getAsJsonArray("nodes")?.forEach { el ->
                        val pwName =
                            el.takeIf { it.isJsonObject }
                                ?.asJsonObject
                                ?.get("name")
                                ?.takeIf { it.isJsonPrimitive }
                                ?.asString
                        if (!pwName.isNullOrBlank() &&
                            workflowNames.none { it.asString == pwName }) {
                          workflowNames.add(pwName)
                        }
                      }
                      e.addProperty("hasItems", true)
                      e.add("itemNames", names)
                      if (containerNames.size() > 0) e.add("containerItems", containerNames)
                      if (workflowNames.size() > 0) e.add("workflowItemNames", workflowNames)
                    }
              }
          entry.appliedFrom?.let { e.addProperty("appliedFrom", it) }
          // The AI's chat reply (only set for chat-only turns). Stored as JSON
          // {"text":"...","matomoStats":{...}} so the frontend can render the reply as Markdown
          // (and charts from the attached statistics) exactly like the chat reply buttons.
          entry.chatReply
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  val parsed = JsonParser.parseString(text)
                  if (parsed.isJsonObject) {
                    e.add("chatReply", parsed)
                  } else {
                    e.addProperty("chatReply", text)
                  }
                } catch (_: Exception) {
                  e.addProperty("chatReply", text)
                }
              }
          // Per-inference token usage of this run (one entry per AI call) so the change log can
          // show
          // WHERE the run's total input/output tokens and cost went (e.g. 2 clarification rounds +
          // pass-1 + pass-2 + a forced final pass) instead of only the run total.
          entry.trips
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  e.add("trips", JsonParser.parseString(text))
                } catch (_: Exception) {
                  e.addProperty("trips", text)
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
          o.addProperty("prompt", (entry.prompt ?: "").take(2000))
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
          entry.chatReply
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                try {
                  o.add("chatReply", JsonParser.parseString(text))
                } catch (_: Exception) {
                  o.addProperty("chatReply", text.take(400))
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

  // region Apply-from-log

  /** One item's location inside a form: its JSON plus the container name and index it sits at. */
  private data class ItemLocation(val item: JsonObject, val parent: String?, val index: Int)

  /**
   * Builds the `items` payload stored with every change-log entry: the FULL resolved items a run
   * CREATED or CHANGED (each with the container it lives in) plus the items it REMOVED, so the
   * change log can re-apply them to the CURRENT form later **without another inference**.
   *
   * [computeFormChanges] cannot serve that purpose — it keeps only names and the changed attribute
   * values, which is not enough to rebuild an element. Returns `null` when the run changed no
   * element (there is then nothing to re-apply and the column stays empty).
   *
   * ```json
   * { "form": { "created": [ { "item": { … }, "parent": "fdPersonalData", "index": 3 } ],
   *             "changed": [ … ], "removed": [ … ] } }
   * ```
   */
  fun computeAppliedItems(beforeJson: String, afterJson: String): JsonObject? {
    return try {
      val before = collectItemLocations(JsonParser.parseString(beforeJson).asJsonObject)
      val after = collectItemLocations(JsonParser.parseString(afterJson).asJsonObject)
      val created = JsonArray()
      val changed = JsonArray()
      for ((name, loc) in after) {
        val prev = before[name]
        if (prev == null) {
          // CREATED: stored WITHOUT its nested `elements` — its children are new as well and are
          // stored as their own entries, so keeping them here would double the payload AND make a
          // re-apply insert them a second time (the container already carries them).
          created.add(locationJson(loc, stripChildren = true))
        } else if (ownStateOf(prev.item) != ownStateOf(loc.item)) {
          // CHANGED: compared WITHOUT `elements`, so a page/container does not count as changed
          // just
          // because a child was added or removed (that child carries the change itself). Such an
          // item
          // keeps its nested children — its own change must travel with them.
          changed.add(locationJson(loc, stripChildren = false))
        }
      }
      val removed = JsonArray()
      for ((name, loc) in before) {
        // REMOVED: the children are gone as well and are stored individually, so no subtree is
        // needed.
        if (!after.containsKey(name)) removed.add(locationJson(loc, stripChildren = true))
      }
      if (created.size() == 0 && changed.size() == 0 && removed.size() == 0) return null
      val form = JsonObject()
      form.add("created", created)
      form.add("changed", changed)
      form.add("removed", removed)
      val out = JsonObject()
      out.add("form", form)
      out
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to compute applied items: {}", e.message)
      null
    }
  }

  /**
   * Builds the WORKFLOW half of the `items` payload stored with a change-log entry: one restorable
   * workflow node per created workflow PATH (task), each carrying the FULL [WorkflowTaskSpec] the
   * AI generated, so the change log can re-create that path later **without another inference**.
   *
   * The specs are attached to the node-log paths by `AICodBiAssistant.runWorkflowCreation` under
   * the private key `_spec` (they are not part of the change DESCRIPTION — the description holds
   * only labels). This method EXTRACTS them into the payload shape `{ "workflow": { "nodes":
   * [ { "name": "<task name>", "spec": {…} } ] } }` and, in the same pass, REMOVES the private
   * `_spec` from every path so it is neither stored in `workflow_changes` (which is returned to the
   * client and used for the tree) nor duplicated.
   *
   * Remove/replace operations carry no `_spec` and are therefore not re-appliable (there is no
   * element to "re-generate"). Returns `null` when no path carries a spec.
   */
  fun computeAppliedWorkflowItems(nodeLog: JsonArray?): JsonObject? {
    if (nodeLog == null) return null
    return try {
      val nodes = JsonArray()
      for (el in nodeLog) {
        val path = el.takeIf { it.isJsonObject }?.asJsonObject ?: continue
        val spec = path.get("_spec")?.takeIf { it.isJsonObject } ?: continue
        val name =
            path.get("name")?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
                ?: continue
        val o = JsonObject()
        o.addProperty("name", name)
        o.add("spec", spec)
        nodes.add(o)
      }
      // The private `_spec` is an internal re-apply payload only — strip it from every path (also
      // when no spec was found) so `workflow_changes` stays the lean change DESCRIPTION.
      for (el in nodeLog) {
        el.takeIf { it.isJsonObject }?.asJsonObject?.remove("_spec")
      }
      if (nodes.size() == 0) return null
      val workflow = JsonObject()
      workflow.add("nodes", nodes)
      val out = JsonObject()
      out.add("workflow", workflow)
      out
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to compute applied workflow items: {}", e.message)
      null
    }
  }

  /**
   * Combines the FORM half ([computeAppliedItems]) and the WORKFLOW half
   * ([computeAppliedWorkflowItems]) into the single `items` payload stored with a change-log entry.
   * Either half may be missing (a form-only or workflow-only run); returns `null` when both are.
   */
  fun mergeAppliedItems(form: JsonObject?, workflow: JsonObject?): JsonObject? {
    if (form == null && workflow == null) return null
    val out = JsonObject()
    form?.getAsJsonObject("form")?.let { out.add("form", it) }
    workflow?.getAsJsonObject("workflow")?.let { out.add("workflow", it) }
    return out
  }

  /**
   * The `workflowVersionId` of a change-log entry, or `null` when the row does not exist / belongs
   * to another form. Needed to re-apply a logged WORKFLOW path without an inference (the node/task
   * API works on the workflow version).
   */
  fun loadEntryWorkflowVersionId(
      emf: EntityManagerFactory?,
      entryId: Long,
      formKey: String?
  ): Long? {
    val em = emf?.createEntityManager() ?: return null
    try {
      val row = em.find(CodbiAiAssistantLog::class.java, entryId) ?: return null
      if (!formKey.isNullOrBlank() && !row.formKey.isNullOrBlank() && row.formKey != formKey) {
        return null
      }
      return row.workflowVersionId
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to load entry workflow version: {}", e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * `{ "item": …item…, "parent": "<container name>"|null, "index": n }` — see [ItemLocation].
   * [stripChildren] drops the child references (see the callers for when that is correct).
   */
  private fun locationJson(loc: ItemLocation, stripChildren: Boolean): JsonObject {
    val o = JsonObject()
    val item = loc.item.deepCopy()
    if (stripChildren) stripChildrenRefs(item)
    o.add("item", item)
    if (loc.parent != null) o.addProperty("parent", loc.parent)
    o.addProperty("index", loc.index)
    return o
  }

  /**
   * Removes a container's child references from [item] — both persist shapes: the canonical
   * `properties.elements` NAME list (the flat shape the designer stores) and the nested item-level
   * `elements` array (the AI's intermediate shape). Used for CREATED / REMOVED items: their
   * children are stored as their own entries, so carrying the references here would let a re-apply
   * insert a stale reference to a child that is (or is not) restored separately.
   */
  private fun stripChildrenRefs(item: JsonObject) {
    item.remove("elements")
    item.getAsJsonObject("properties")?.remove("elements")
  }

  /**
   * The item's OWN state — everything except its child references (see [stripChildrenRefs]). Used
   * to decide whether an item itself changed: a container/page must not look changed merely because
   * one of its children was added, removed or reordered (its child list naturally differs then).
   */
  private fun ownStateOf(item: JsonObject): JsonObject {
    val copy = item.deepCopy()
    stripChildrenRefs(copy)
    return copy
  }

  /**
   * Walks a form root and maps every element NAME to its JSON plus the container it sits in (first
   * occurrence wins — names are unique in a form). Used to diff two form states.
   *
   * BOTH persist shapes are handled, because Formcycle's designer accepts both:
   * - NESTED — a container's `properties.elements` holds the child OBJECTS (recursed into below);
   * - FLAT — the shape the assistant emits ([AICodBiAssistant]'s `reorderItemsByTreeOrder`): every
   *   element lives in the root `items` array and a container references its children by NAME in
   *   `properties.elements`. The second pass below resolves those name references, so a recorded
   *   item knows its container (and its position inside it). Without it every item would look
   *   parent-less and a re-apply would splice the object into a name list — invisible in the
   *   designer.
   */
  private fun collectItemLocations(root: JsonObject): LinkedHashMap<String, ItemLocation> {
    val out = LinkedHashMap<String, ItemLocation>()
    val items = root.getAsJsonArray("items") ?: return out
    fun nameOf(obj: JsonObject): String? =
        obj.getAsJsonObject("properties")
            ?.get("name")
            ?.takeIf { it.isJsonPrimitive }
            ?.asString
            ?.takeIf { it.isNotBlank() }
    fun walk(list: JsonArray, parent: String?) {
      var index = 0
      for (el in list) {
        val obj = el.takeIf { it.isJsonObject }?.asJsonObject
        if (obj != null) {
          val name = nameOf(obj)
          if (name != null && !out.containsKey(name)) out[name] = ItemLocation(obj, parent, index)
          obj.getAsJsonArray("elements")?.let { walk(it, name) }
        }
        index++
      }
    }
    walk(items, null)
    // FLAT shape: resolve the name references (a top-level item found above has parent == null).
    val roots = items.mapNotNull { it.takeIf { it.isJsonObject }?.asJsonObject }
    val byName = LinkedHashMap<String, JsonObject>()
    for (obj in roots) nameOf(obj)?.let { byName.putIfAbsent(it, obj) }
    for (obj in roots) {
      val container = nameOf(obj) ?: continue
      val elements = obj.getAsJsonObject("properties")?.getAsJsonArray("elements") ?: continue
      var index = 0
      for (el in elements) {
        val child = el.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
        if (child != null) {
          val childItem = byName[child]
          if (childItem != null && out[child]?.parent == null) {
            out[child] = ItemLocation(childItem, container, index)
          }
        }
        index++
      }
    }
    return out
  }

  /**
   * Loads the items a change-log entry can restore — the stored `items` payload when present, else
   * the items RECONSTRUCTED from the entry's change description ([reconstructItems]) so "repeat
   * onto form" works WITHOUT any inference for entries recorded before the column existed too.
   *
   * [formKey], when given, must match the entry's form — a restore is only ever offered for the
   * form the log panel is showing. Returns `null` for an unknown entry or one that changed no
   * element.
   */
  fun loadEntryItems(emf: EntityManagerFactory?, entryId: Long, formKey: String?): JsonObject? {
    val em = emf?.createEntityManager() ?: return null
    try {
      val row = em.find(CodbiAiAssistantLog::class.java, entryId) ?: return null
      if (!formKey.isNullOrBlank() && !row.formKey.isNullOrBlank() && row.formKey != formKey) {
        return null
      }
      row.items
          ?.takeIf { it.isNotBlank() }
          ?.let { text ->
            val parsed = JsonParser.parseString(text)
            if (parsed.isJsonObject) return parsed.asJsonObject
          }
      val changes =
          row.formChanges
              ?.takeIf { it.isNotBlank() }
              ?.let { text ->
                runCatching { JsonParser.parseString(text) }
                    .getOrNull()
                    ?.takeIf { it.isJsonObject }
                    ?.asJsonObject
              }
      return reconstructItems(changes)
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to load entry items: {}", e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * Reconstructs restorable items from a change DESCRIPTION (`form_changes`) — the only element
   * data an entry recorded before the `items` column carries.
   *
   * `attributesSet` holds every property the AI actually SET on the element (name + value + kind)
   * and `classesSet` its standard-class CSS classes, so the element is rebuildable from
   * `className` + `name` + those properties. Only what the AI did NOT set (Formcycle defaults) and
   * the nesting (the caller falls back to the last page) are unknown.
   *
   * Returns the [computeAppliedItems] shape with each entry marked `"reconstructed":true`, or
   * `null` when the description holds no element at all (pure chat / variables-only entries).
   */
  fun reconstructItems(formChanges: JsonObject?): JsonObject? {
    if (formChanges == null) return null
    return try {
      // widget -> className, for the widgets this entry CREATED.
      val created = linkedMapOf<String, String>()
      formChanges.getAsJsonArray("widgetsCreated")?.forEach { el ->
        val o = el.takeIf { it.isJsonObject }?.asJsonObject ?: return@forEach
        val n = o.get("name")?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
        if (n != null) {
          created[n] = o.get("className")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
        }
      }
      // widget -> the AI-set property entries ({name, value, kind, codbi[, params]}) and classes.
      val attrs = linkedMapOf<String, MutableList<JsonObject>>()
      val classes = linkedMapOf<String, MutableList<String>>()
      // widget -> className (both sets carry it; `widgetsCreated` is not the only source).
      val classNames = linkedMapOf<String, String>()
      val order = ArrayList<String>()
      fun track(widget: String) {
        if (!order.contains(widget)) order.add(widget)
      }
      formChanges.getAsJsonArray("attributesSet")?.forEach { el ->
        val o = el.takeIf { it.isJsonObject }?.asJsonObject ?: return@forEach
        val w =
            o.get("widget")?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
                ?: return@forEach
        track(w)
        o.get("className")
            ?.takeIf { it.isJsonPrimitive }
            ?.asString
            ?.takeIf { it.isNotBlank() }
            ?.let { classNames[w] = it }
        o.getAsJsonArray("attributes")?.forEach { a ->
          a.takeIf { it.isJsonObject }
              ?.asJsonObject
              ?.let { attrs.getOrPut(w) { mutableListOf() }.add(it) }
        }
      }
      formChanges.getAsJsonArray("classesSet")?.forEach { el ->
        val o = el.takeIf { it.isJsonObject }?.asJsonObject ?: return@forEach
        val w =
            o.get("widget")?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
                ?: return@forEach
        track(w)
        o.get("className")
            ?.takeIf { it.isJsonPrimitive }
            ?.asString
            ?.takeIf { it.isNotBlank() }
            ?.let { classNames[w] = it }
        o.getAsJsonArray("classes")?.forEach { c ->
          c.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.takeIf { it.isNotBlank() }
              ?.let { classes.getOrPut(w) { mutableListOf() }.add(it) }
        }
      }
      if (order.isEmpty()) return null

      val createdOut = JsonArray()
      val changedOut = JsonArray()
      // Document order: the created widgets first (their own order), then the changed ones.
      val allWidgets = ArrayList<String>()
      allWidgets.addAll(created.keys)
      for (w in order) if (!allWidgets.contains(w)) allWidgets.add(w)

      for (w in allWidgets) {
        // Without a className the element cannot be rebuilt at all — skip it (the entry's
        // description
        // always carries one for a created/changed widget, so this is only a safety net).
        val className = created[w] ?: classNames[w] ?: continue
        val props = JsonObject()
        props.addProperty("name", w)
        val dataCb = JsonArray()
        val funcNames = ArrayList<String>()
        for (a in attrs[w].orEmpty()) {
          val key =
              a.get("name")?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
                  ?: continue
          val kind = a.get("kind")?.takeIf { it.isJsonPrimitive }?.asString ?: "attr"
          when (kind) {
            "func" -> {
              if (key.isNotBlank()) funcNames.add(key)
              // The functionality's own data-cb-* parameters are NESTED in its `params` array (see
              // buildAttributes) — they must be re-emitted, else the reconstructed element loses
              // e.g. its datasource/field mapping.
              a.getAsJsonArray("params")?.forEach paramLoop@{ p ->
                val po = p.takeIf { it.isJsonObject }?.asJsonObject ?: return@paramLoop
                val pn =
                    po.get("name")
                        ?.takeIf { it.isJsonPrimitive }
                        ?.asString
                        ?.takeIf { it.isNotBlank() } ?: return@paramLoop
                val o = JsonObject()
                o.addProperty("text", pn)
                o.addProperty(
                    "value", po.get("value")?.takeIf { it.isJsonPrimitive }?.asString ?: "")
                dataCb.add(o)
              }
            }
            "param" -> {
              val o = JsonObject()
              o.addProperty("text", key)
              o.addProperty("value", a.get("value")?.takeIf { it.isJsonPrimitive }?.asString ?: "")
              dataCb.add(o)
            }
            else -> {
              val v = a.get("value")
              props.add(
                  key,
                  when {
                    v == null || v.isJsonNull -> JsonPrimitive("")
                    // A boolean that the AI set stays a boolean; everything else is a string in the
                    // persist JSON (e.g. "required":"1", "maxwidth":"850px").
                    v.isJsonPrimitive && v.asJsonPrimitive.isString && v.asString == "true" ->
                        JsonPrimitive(true)
                    v.isJsonPrimitive && v.asJsonPrimitive.isString && v.asString == "false" ->
                        JsonPrimitive(false)
                    v.isJsonPrimitive -> JsonPrimitive(v.asString)
                    else -> JsonParser.parseString(v.toString())
                  })
            }
          }
        }
        if (funcNames.isNotEmpty()) {
          val o = JsonObject()
          o.addProperty("text", "data-cb-func")
          o.addProperty("value", funcNames.distinct().joinToString(","))
          dataCb.add(o)
        }
        classes[w]
            ?.takeIf { it.isNotEmpty() }
            ?.let { cls ->
              val arr = JsonArray()
              cls.distinct().forEach { arr.add(it) }
              props.add("cssclasses", arr)
            }
        val item = JsonObject()
        item.addProperty("className", className)
        item.add("properties", props)
        if (dataCb.size() > 0) item.add("attributes", dataCb)
        val loc = JsonObject()
        loc.add("item", item)
        loc.addProperty("index", -1)
        loc.addProperty("reconstructed", true)
        if (created.containsKey(w)) createdOut.add(loc) else changedOut.add(loc)
      }
      if (createdOut.size() == 0 && changedOut.size() == 0) return null
      val form = JsonObject()
      form.add("created", createdOut)
      form.add("changed", changedOut)
      form.add("removed", JsonArray())
      val out = JsonObject()
      out.add("form", form)
      out.addProperty("reconstructed", true)
      out
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to reconstruct items: {}", e.message)
      null
    }
  }

  // endregion Apply-from-log

  /**
   * Extracts the labels of all workflow nodes whose change-log entry was flagged as a blocked
   * destructive SQL statement (`params.blockedSql == true`). Used by the frontend to render an
   * error icon/message and to auto-open the change log after a run generated destructive SQL.
   *
   * @param workflowChanges The workflow change description (the `nodeLog` array produced by
   *   `AICodBiAssistant.runWorkflowCreation`), each entry `{ name, trigger, elements, status }`.
   * @return The node labels (`FC_SQL_STATEMENT "<name>"`), distinct and sorted.
   */
  fun blockedSqlNodeLabels(workflowChanges: JsonArray?): List<String> {
    if (workflowChanges == null) return emptyList()
    val out = mutableSetOf<String>()
    try {
      for (path in workflowChanges) {
        if (!path.isJsonObject) continue
        val elements =
            path.asJsonObject.get("elements")?.takeIf { it.isJsonArray }?.asJsonArray ?: continue
        for (el in elements) {
          if (!el.isJsonObject) continue
          val obj = el.asJsonObject
          val params = obj.get("params")?.takeIf { it.isJsonObject }?.asJsonObject ?: continue
          if (params.get("blockedSql")?.asBoolean != true) continue
          val type = obj.get("nodeType")?.asString ?: ""
          val name = obj.get("name")?.asString ?: ""
          out.add(if (name.isBlank()) type else "$type \"$name\"")
        }
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to extract blocked SQL nodes: {}", e.message)
    }
    return out.sorted()
  }

  /**
   * Determines which of the configured **sensitive** element names ([sensitive], already
   * lowercased) were actually used in the given change description ([formChanges]). The configured
   * list may hold CodBi elements (functionalities, EPs, standard configurations/classes/globals)
   * **and FORMCYCLE widgets** (e.g. `XTextField`, `XTextArea`). Matching is case-insensitive and
   * covers:
   * - `widgetsCreated[].name` / `.className` and `widgetsRemoved[].name` / `.className`
   * - `classesSet[].widget` / `.className` and `attributesSet[].widget` / `.className` (so a
   *   configured FORMCYCLE widget matches even when the AI only wrote into an EXISTING element —
   *   e.g. potentially harmful HTML/code placed into an existing `XTextField`)
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
    val haystack = StringBuilder()
    try {
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
          val obj = el.asJsonObject
          // The entry's widget name / className too, so a configured FORMCYCLE widget (e.g.
          // "XTextField") matches whenever the AI changed that element's classes.
          obj.get("widget")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
          obj.get("className")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
          obj.getAsJsonArray("classes")?.forEach { c ->
            if (c.isJsonPrimitive) haystack.append(' ').append(c.asString)
          }
        }
      }
      formChanges.getAsJsonArray("attributesSet")?.forEach { el ->
        if (el.isJsonObject) {
          val obj = el.asJsonObject
          // Same for attribute changes: this is what makes a configured FORMCYCLE widget such as
          // "XTextField" sensitive even when the AI only wrote into an EXISTING field.
          obj.get("widget")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
          obj.get("className")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
          obj.getAsJsonArray("attributes")?.forEach { a ->
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
      // Removed widgets count too (removing a sensitive FORMCYCLE widget is a change as well).
      formChanges.getAsJsonArray("widgetsRemoved")?.forEach { el ->
        if (el.isJsonObject) {
          val obj = el.asJsonObject
          obj.get("name")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
          obj.get("className")
              ?.takeIf { it.isJsonPrimitive }
              ?.asString
              ?.let { haystack.append(' ').append(it) }
        }
      }
    } catch (e: Exception) {
      logger.warn("[AiAssistantLog] Failed to compute used sensitive elements: {}", e.message)
    }
    return sensitiveMatches(haystack.toString(), sensitive)
  }

  /**
   * Determines which of the configured **sensitive** element names ([sensitive], already
   * lowercased) were used by the given WORKFLOW change description ([workflowChanges], the
   * `nodeLog` array produced by `AICodBiAssistant.runWorkflowCreation`).
   *
   * This is what brings **FORMCYCLE workflow nodes** under the sensitive mechanism: a configured
   * node type (e.g. `FC_EMAIL`, `FC_SQL_STATEMENT`, `FC_HTTP_REQUEST`), a custom trigger type or a
   * node name is detected by scanning every node's `nodeType` / `name` plus all nested parameter
   * names and values. The change log then marks the matching node with the same red border +
   * verification checkbox as a sensitive CodBi element.
   *
   * @param workflowChanges The parsed workflow change description, or `null`.
   * @param sensitive The lowercased set of sensitive element names (from
   *   `AI.logSensitiveElements`).
   * @return The matched sensitive element names, sorted for stable output.
   */
  fun usedSensitiveWorkflowElements(
      workflowChanges: JsonArray?,
      sensitive: Set<String>
  ): List<String> {
    if (workflowChanges == null || sensitive.isEmpty()) return emptyList()
    val haystack = StringBuilder()
    try {
      collectStrings(workflowChanges, haystack)
    } catch (e: Exception) {
      logger.warn(
          "[AiAssistantLog] Failed to compute used sensitive workflow elements: {}", e.message)
    }
    return sensitiveMatches(haystack.toString(), sensitive)
  }

  /**
   * Token-based match of the configured sensitive [names] inside [text], case-insensitive and with
   * word boundaries — so "HTML" does not match inside "HTML.CSS" and "XTextField" not inside
   * "XTextFieldAdvanced".
   */
  private fun sensitiveMatches(text: String, names: Set<String>): List<String> {
    if (text.isEmpty() || names.isEmpty()) return emptyList()
    val found = mutableSetOf<String>()
    for (name in names) {
      if (Regex("(?i)(?<![A-Za-z0-9_.])${Regex.escape(name)}(?![A-Za-z0-9_.])")
          .containsMatchIn(text)) {
        found.add(name)
      }
    }
    return found.sorted()
  }

  /** Recursively appends every object member NAME and primitive VALUE of [element] to [out]. */
  private fun collectStrings(element: JsonElement, out: StringBuilder) {
    when {
      element.isJsonObject ->
          element.asJsonObject.entrySet().forEach { (key, value) ->
            out.append(' ').append(key)
            collectStrings(value, out)
          }
      element.isJsonArray -> element.asJsonArray.forEach { collectStrings(it, out) }
      element.isJsonPrimitive -> out.append(' ').append(element.asString)
    }
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
