package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

// !!! REMINDER — NEVER embed AI prompt / system-prompt text in Kotlin files !!!
// All prompt text belongs in the .md files under
// src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/
// (see prompts/index.json) and is loaded via PromptLoader / loadPromptWithClasspathFallback / the
// template helpers. Adding prompt strings to .kt files is forbidden — they get out of sync, go
// stale, and are never reseeded. Move any prompt text into the .md files instead.

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.Standard
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.ExternalAiHttpException
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.ImageProcessingService
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.repairAiJson
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.stripThinkTags
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.util.UUID
import javax.persistence.EntityManager
import org.slf4j.LoggerFactory

/**
 * Unified AI assistant for FORMCYCLE â€” combines the form-structure editor (AIFormAssistant) and
 * the workflow creator (AIWorkflowAssistant) into a single two-phase servlet.
 *
 * Phase 1 â€” Intent classification: The servlet makes a short AI call to classify the user's
 * prompt as "form", "workflow", or "both". It returns
 * `{"status":"need_data","intent":"form|workflow|both"}` so the frontend knows which data to
 * collect before sending phase 2.
 *
 * Phase 2 â€” Execution: The frontend resends the prompt with `phase=2`, `intent=<value>`, and the
 * necessary context:
 * - `persist` â€” full IPersistJson string (required when intent is "form" or "both")
 * - `currentStandards` â€” CSV of currently active standard configurations (optional, for
 *   "form"/"both")
 * - `formElements` â€” JSON array of form elements (required when intent is "workflow" or "both")
 * - `workflowVersionId` â€” numeric ID of the active WorkflowVersion (required when intent is
 *   "workflow" or "both") The servlet runs the form-modification AI and/or the workflow-creation AI
 *   in sequence, then returns a combined JSON response:
 *   `{"intent":"...","formJson":{...},"standards":"...","workflowMessage":"..."}` (keys present
 *   only as applicable). `standards` is the updated CSV for `codbi-prop-standards` with
 *   Holistic.Cleave.* configs auto-managed based on field datatypes present in the modified form.
 *
 * Actions dispatched via the `X-Action` request header:
 * - **`Models`** (GET): returns the list of available AI models.
 * - **`Run`** (POST): unified assistant entry point.
 *
 *   GET <fc>/plugin?name=CodBi_AICodBiAssistant (X-Action: Models) POST
 *   <fc>/plugin?name=CodBi_AICodBiAssistant (X-Action: Run, X-Model: <modelId>)
 */
class AICodBiAssistant : IPluginServletAction {

  private val logger = LoggerFactory.getLogger(AICodBiAssistant::class.java)
  private val gson: Gson = GsonBuilder().create()

  /**
   * Maximum additional detail-reruns for form modification. Configurable via
   * `AI_FormAssistant_MaxFormReruns`.
   */
  private var maxFormReruns: Int = MAX_FORM_RERUNS

  /**
   * Per-specialist overrides of [maxFormReruns], keyed by lowercase specialist name. Configurable
   * via `AI_FormAssistant_MaxFormReruns_<name>`.
   */
  private val specialistMaxFormReruns = mutableMapOf<String, Int>()

  override fun getName(): String = "CodBi_AICodBiAssistant"

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    // Apply per-user CodBi element visibility for the whole request so every prompt transmitted to
    // the AI omits the elements hidden for the current user.
    return CodBiElementAccess.runForUser(currentUsername(params)) {
      // When the "Nicht installierte Elemente erstellen" feature is active, the frontend sends the
      // checked widget / node / trigger lists; the request-scoped filter then strips every prompt
      // section whose element is NOT in the checked list before it reaches the AI.
      val allowedWidgets = parseAllowedElements(params, "allowedWidgets")
      val allowedNodes = parseAllowedElements(params, "allowedNodes")
      val allowedTriggers = parseAllowedElements(params, "allowedTriggers")
      FormcycleElementFilter.runForRequest(allowedWidgets, allowedNodes, allowedTriggers) {
        val action =
            params.headerMap.entries.find { it.key.equals("X-Action", ignoreCase = true) }?.value
        when (action) {
          "Models" -> handleModels()
          "Run" -> handleRun(params)
          "AppointmentPlan" -> handleAppointmentPlan(params)
          "Status" -> handleStatus()
          "AvailableElements" -> handleAvailableElements(params)
          "Log" -> handleLog(params)
          "SensitiveCheck" -> handleSensitiveCheck(params)
          else -> jsonResponse("""{"error":"Unknown action"}""")
        }
      }
    }
  }

  /**
   * Parses an `allowed*` request parameter (JSON array or CSV) into a normalized identifier set, or
   * `null` when the parameter is absent (meaning "no restriction").
   */
  private fun parseAllowedElements(params: IPluginServletActionParams, key: String): Set<String>? {
    val raw = params.requestParameters[key]?.firstOrNull()?.trim()
    if (raw.isNullOrBlank()) return null
    return try {
      val parsed = JsonParser.parseString(raw)
      if (parsed.isJsonArray) {
        parsed.asJsonArray
            .mapNotNull { if (it.isJsonNull) null else it.asString }
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .toSet()
      } else {
        raw.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()
      }
    } catch (_: Exception) {
      raw.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()
    }
  }

  /**
   * Returns the list of all widgets / workflow nodes / workflow triggers that CodBi knows (from the
   * compact prompt tables), each annotated with whether it is installed on the current system. The
   * frontend uses this to render the "Nicht installierte Elemente erstellen" dialog (availability
   * markings + checkboxes). Called with X-Action: AvailableElements.
   */
  private fun handleAvailableElements(
      params: IPluginServletActionParams
  ): IPluginServletActionRetVal {
    val emf = CodbiEntities.entityManagerFactory
    if (emf == null) return jsonResponse("""{"error":"Database not available"}""")
    val snapshot = InstalledFormcycleElements.snapshotFor(params)
    // Diagnostic: make a detection failure visible instead of silently treating elements as either
    // all-available or all-unavailable.
    if (snapshot.widgets.isEmpty()) {
      logger.warn(
          "[AICodBiAssistant] Installed-widget detection returned no widgets — widgets fall back to 'available'")
    }
    if (snapshot.nodes.isEmpty()) {
      logger.warn(
          "[AICodBiAssistant] Installed-node detection returned no nodes — no workflow node is allowed by default")
    }
    if (snapshot.triggers.isEmpty()) {
      logger.warn(
          "[AICodBiAssistant] Installed-trigger detection returned no triggers — no workflow trigger is allowed by default")
    }
    // Installed widget names keyed by their normalized id, so the dialog can show the real widget
    // class name (e.g. "XTextField") instead of the derived prompt display name. The standard,
    // always-installed widget classes are included so the core widgets show their proper class
    // name even though they are not returned by the (plugin-only) widget registry.
    val installedWidgetNames =
        snapshot.widgets.associateBy { normalize(it) } +
            InstalledFormcycleElements.CORE_WIDGETS.associateBy { normalize(it) }
    val em = emf.createEntityManager()
    try {
      val widgets = JsonArray()
      for (r in CompactPromptLoader.loadCategoryRecords(em, "compact.formcycle_widgets")) {
        if (r.promptKey == "compact.formcycle_widgets") continue
        val id = r.promptKey.substringAfterLast('.')
        if (id.isBlank()) continue
        val o = JsonObject()
        o.addProperty("id", id)
        o.addProperty("name", installedWidgetNames[normalize(id)] ?: prettifyElementId(id))
        // Standard (built-in) widgets are ALWAYS installed and therefore always available. The
        // plugin-provided widgets are available when positively detected. Widgets stay fail-open:
        // when plugin-widget detection is empty (registry unavailable) every widget is shown as
        // available so normal form building is not blocked by a detection hiccup.
        o.addProperty(
            "available",
            InstalledFormcycleElements.isCoreWidget(id) ||
                snapshot.widgets.isEmpty() ||
                isInstalled(id, snapshot.widgets))
        widgets.add(o)
      }
      val nodes = JsonArray()
      val triggers = JsonArray()
      for (r in CompactPromptLoader.loadCategoryRecords(em, "compact.formcycle_workflow_nodes")) {
        val key = r.promptKey
        val id = key.substringAfterLast('.')
        if (id.isBlank()) continue
        if (key.contains(".trigger_types.")) {
          val o = JsonObject()
          o.addProperty("id", id)
          o.addProperty("name", r.displayName?.takeIf { it.isNotBlank() } ?: prettifyElementId(id))
          // Built-in FC_* triggers are always installed; plugin triggers are available only when
          // positively detected (fail-closed when the registry is unavailable).
          o.addProperty(
              "available",
              InstalledFormcycleElements.isCoreWorkflowType(id) ||
                  isInstalled(id, snapshot.triggers))
          triggers.add(o)
        } else if (key.contains(".node_types.")) {
          val o = JsonObject()
          o.addProperty("id", id)
          o.addProperty("name", r.displayName?.takeIf { it.isNotBlank() } ?: prettifyElementId(id))
          // Built-in FC_* nodes are always installed; plugin nodes are available only when
          // positively detected (fail-closed when the registry is unavailable).
          o.addProperty(
              "available",
              InstalledFormcycleElements.isCoreWorkflowType(id) || isInstalled(id, snapshot.nodes))
          nodes.add(o)
        }
      }
      val root = JsonObject()
      root.add("widgets", widgets)
      root.add("nodes", nodes)
      root.add("triggers", triggers)
      return jsonResponse(gson.toJson(root))
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] AvailableElements failed: {}", e.message)
      return jsonResponse("""{"error":"Failed to load available elements"}""")
    } finally {
      em.close()
    }
  }

  /** Prettifies a compact element id for display (e.g. `xtextfield` → `Xtextfield`). */
  private fun prettifyElementId(id: String): String =
      id.replace('_', ' ')
          .split(" ")
          .filter { it.isNotEmpty() }
          .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }

  /**
   * Normalizes an element identifier for availability matching (lowercase, non-alphanumeric
   * removed).
   */
  private fun normalize(id: String): String = id.trim().lowercase().replace(Regex("[^a-z0-9]"), "")

  /**
   * Whether the compact element [id] is installed on the current system. Tolerates the compact-key
   * vs. class-name identifier mismatch (compact keys embed the node/widget class name, e.g. the
   * ePayBL node's "..._paymentinitplugin"), so a fully-qualified installed class name matches its
   * compact key. When the installed set is empty (detection unavailable) every element is treated
   * as installed instead of wrongly marking everything uninstalled.
   */
  private fun isInstalled(id: String, installed: Set<String>): Boolean {
    // Fail-closed: an element is only "available" when positively detected as installed. When the
    // installed set is empty (detection unavailable) nothing is considered installed, so the switch
    // OFF default (check only available elements) never transmits a non-installed element.
    if (installed.isEmpty()) return false
    val n = normalize(id)
    if (n.isEmpty()) return false
    return installed.any { raw ->
      val i = normalize(raw)
      n == i || (raw.contains('.') && i.length >= 12 && n.endsWith(i))
    }
  }

  /** Reads the CodBi element-access + Matomo statistics plugin properties (idempotent). */
  override fun initialize(configData: IPluginInitializeData) {
    CodBiElementAccess.initialize(configData.properties)
    // Matomo statistics backend for the AI assistant (see MatomoStats). Re-read on every plugin
    // re-initialization, so configuration changes take effect on the next request.
    configData.properties
        .getProperty("AI_FormAssistant_Matomo_URL")
        ?.trim()
        ?.takeIf { it.isNotBlank() }
        ?.let { AI.matomoUrl = it }
    configData.properties
        .getProperty("AI_FormAssistant_Matomo_APIKey")
        ?.trim()
        ?.takeIf { it.isNotBlank() }
        ?.let { AI.matomoApiKey = it }
    // Maximum number of additional detail-reruns for form modification. Re-read on every plugin
    // re-initialization, so configuration changes take effect on the next request.
    configData.properties
        .getProperty("AI_FormAssistant_MaxFormReruns")
        ?.trim()
        ?.toIntOrNull()
        ?.takeIf { it >= 0 }
        ?.let { maxFormReruns = it }
    // Per-specialist overrides of the rerun budget:
    // `AI_FormAssistant_MaxFormReruns_<specialistName>`
    // (e.g. `AI_FormAssistant_MaxFormReruns_cerebras`) wins over the global
    // `AI_FormAssistant_MaxFormReruns` for that specialist model.
    specialistMaxFormReruns.clear()
    for (key in configData.properties.stringPropertyNames()) {
      if (!key.startsWith("AI_FormAssistant_MaxFormReruns_")) continue
      val specialistName = key.removePrefix("AI_FormAssistant_MaxFormReruns_").trim().lowercase()
      if (specialistName.isEmpty()) continue
      configData.properties
          .getProperty(key)
          ?.trim()
          ?.toIntOrNull()
          ?.takeIf { it >= 0 }
          ?.let { specialistMaxFormReruns[specialistName] = it }
    }
  }

  /**
   * Builds the JSON value for a message `content` field. When [imageParts] are present the content
   * becomes a vision-format array (text + one entry per image); otherwise a plain JSON string is
   * returned. Image parts are expected to already be data URIs (e.g. `data:image/png;base64,...`).
   */
  private fun buildUserContent(text: String, imageParts: List<String>): String {
    if (imageParts.isEmpty()) return gson.toJson(text)
    return buildString {
      append("[")
      append("""{"type":"text","text":${gson.toJson(text)}}""")
      for (dataUri in imageParts) {
        append(",")
        append("""{"type":"image_url","image_url":{"url":${gson.toJson(dataUri)}}}""")
      }
      append("]")
    }
  }

  // region Handlers

  private fun handleModels(): IPluginServletActionRetVal {
    val models = Standard.availableModels
    if (models.isEmpty()) {
      return jsonResponse("""{"error":"AI service not available"}""")
    }
    // Include the configured price (per 1M input/output tokens + currency) for each model so the
    // frontend can show it next to the model name in the assistant's model dropdown. Models
    // without a configured price omit these fields.
    val arr = JsonArray()
    for (m in models) {
      val o = JsonObject()
      o.addProperty("id", m.id)
      o.addProperty("label", m.label)
      val price = Standard.instance?.priceForModel(m.id)
      if (price != null) {
        price.currency?.let { o.addProperty("currency", it) }
        o.addProperty("pricePerMInput", price.pricePerMInput)
        o.addProperty("pricePerMOutput", price.pricePerMOutput)
      }
      arr.add(o)
    }
    return jsonResponse(gson.toJson(arr))
  }

  /**
   * Reports whether the CodBi prompt database is available. The frontend uses this to show an error
   * and disable the assistant inputs when the DB (which holds all AI prompt content) is unreachable
   * — without the prompts there is no point sending anything to the AI.
   */
  private fun handleStatus(): IPluginServletActionRetVal {
    val emf = CodbiEntities.entityManagerFactory
    if (emf == null) {
      return jsonResponse(
          gson.toJson(
              mapOf(
                  "status" to "error",
                  "error" to "Database not available — AI prompts cannot be loaded.")))
    }
    return try {
      val em = emf.createEntityManager()
      try {
        em.createNativeQuery("SELECT COUNT(*) FROM codbi_ai_prompt").singleResult
        jsonResponse(gson.toJson(mapOf("status" to "ok")))
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Status check failed: {}", e.message)
      jsonResponse(
          gson.toJson(
              mapOf(
                  "status" to "error",
                  "error" to "Database not available — AI prompts cannot be loaded.")))
    }
  }

  /**
   * Returns the change log of all previous AI assistant inferences (form + workflow), newest first.
   * Each entry carries the timestamp, prompt, intent, model, and the structured JSON description of
   * the applied form / workflow changes. Called with X-Action: Log.
   */
  private fun handleLog(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val emf = CodbiEntities.entityManagerFactory
    if (emf == null) return jsonResponse("""{"error":"Database not available"}""")
    // Optional X-Form-Key header: when present, only the log entries of that form are returned.
    val formKey =
        params.headerMap.entries.find { it.key.equals("X-Form-Key", ignoreCase = true) }?.value
    return jsonResponse(
        AiAssistantLog.loadLogs(emf, formKey = formKey, username = currentUsername(params)))
  }

  /**
   * Stores/removes a sensitive-element dismiss check for the current user. Called with X-Action:
   * SensitiveCheck and form parameters `entryId`, `elementName` and `checked` ("true"/"false").
   */
  private fun handleSensitiveCheck(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val emf = CodbiEntities.entityManagerFactory
    if (emf == null) return jsonResponse("""{"error":"Database not available"}""")
    val entryId = params.requestParameters["entryId"]?.firstOrNull()?.toLongOrNull()
    val elementName = params.requestParameters["elementName"]?.firstOrNull()
    val checked = params.requestParameters["checked"]?.firstOrNull()?.toBoolean() ?: false
    val username = currentUsername(params)
    if (entryId == null || elementName.isNullOrBlank() || username.isNullOrBlank()) {
      return jsonResponse("""{"ok":false}""")
    }
    val ok = AiAssistantLog.setSensitiveCheck(emf, entryId, elementName, username, checked)
    return jsonResponse(if (ok) """{"ok":true}""" else """{"ok":false}""")
  }

  /** Resolves the login name of the authenticated user, or `null` when it cannot be determined. */
  private fun currentUsername(params: IPluginServletActionParams): String? =
      try {
        // Same accessor as the Local API Doc store (StructuredDataStoreAction) — the one that
        // reliably resolves the logged-in user in the servlet action context (params.benutzer is
        // not always populated).
        params.user.userName?.trim()?.takeIf { it.isNotBlank() }
      } catch (e: Exception) {
        logger.warn("[AICodBiAssistant] Could not resolve user via params.user: {}", e.message)
        try {
          params.benutzer?.loginName?.trim()?.takeIf { it.isNotBlank() }
        } catch (e2: Exception) {
          logger.warn(
              "[AICodBiAssistant] Could not resolve user via params.benutzer: {}", e2.message)
          null
        }
      }

  /**
   * Looks up an appointment plan UUID by its human-readable name. Called with X-Action:
   * AppointmentPlan and X-Plan-Name: <name>. Queries the FORMCYCLE appointment_plan table. NOTE:
   * The table name 'appointment_plan' may differ in your FORMCYCLE version. Check your database
   * schema if the query fails.
   */
  private fun handleAppointmentPlan(
      params: IPluginServletActionParams
  ): IPluginServletActionRetVal {
    val planName =
        params.headerMap.entries
            .find { it.key.equals("X-Plan-Name", ignoreCase = true) }
            ?.value
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?: return jsonResponse("""{"error":"Missing X-Plan-Name header"}""")
    val emf =
        CodbiEntities.entityManagerFactory
            ?: return jsonResponse("""{"error":"Database not available"}""")
    return try {
      val em = emf.createEntityManager()
      try {
        val query = em.createNativeQuery("SELECT UUID FROM APPOINTMENT_TEMPLATE WHERE NAME = :name")
        query.setParameter("name", planName)
        val result = query.resultList
        if (result.isEmpty()) {
          jsonResponse(gson.toJson(mapOf("error" to "Appointment plan '$planName' not found")))
        } else {
          val uuid = result[0].toString()
          jsonResponse(gson.toJson(mapOf("uuid" to uuid, "name" to planName)))
        }
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to look up appointment plan: ${e.message}")
      // Log available tables to help identify the correct table name
      try {
        val em2 = emf.createEntityManager()
        try {
          val schemaQuery =
              em2.createNativeQuery(
                  "SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%appointment%' OR table_name ILIKE '%termin%' OR table_name ILIKE '%schedule%' ORDER BY table_name")
          val tables = schemaQuery.resultList
          logger.warn(
              "[AICodBiAssistant] Available tables matching appointment/termin/schedule: {}",
              tables)
        } finally {
          em2.close()
        }
      } catch (_: Exception) {
        // Schema query not supported by this database
      }
      jsonResponse(gson.toJson(mapOf("error" to "Query failed: ${e.message}")))
    }
  }

  /**
   * Scans the form JSON for XAppointment elements that have an "appointmentPlan" (human-readable
   * schedule name) but no "appointmentTemplate" (UUID). Resolves the name to a UUID by querying the
   * FORMCYCLE appointment_plan database table and injects the "appointmentTemplate" property.
   */
  private fun resolveAppointmentPlans(formJson: String): String {
    val emf =
        CodbiEntities.entityManagerFactory
            ?: return formJson.also {
              logger.info("[AICodBiAssistant] resolveAppointmentPlans: no EntityManagerFactory")
            }
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items =
          root.getAsJsonArray("items")
              ?: return formJson.also {
                logger.info(
                    "[AICodBiAssistant] resolveAppointmentPlans: no items array in formJson")
              }
      var changed = false
      for (i in 0 until items.size()) {
        val item = items[i].asJsonObject
        val className = item.get("className")?.asString ?: continue
        if (className != "XAppointment") continue
        val props = item.getAsJsonObject("properties") ?: continue
        if (props.has("appointmentTemplate")) {
          continue
        }
        val planName = props.get("appointmentPlan")?.asString
        if (planName == null) {
          continue
        }
        val em = emf.createEntityManager()
        try {
          val query =
              em.createNativeQuery("SELECT UUID FROM APPOINTMENT_TEMPLATE WHERE NAME = :name")
          query.setParameter("name", planName)
          val result = query.resultList
          if (result.isNotEmpty()) {
            props.addProperty("appointmentTemplate", result[0].toString())
            changed = true
          } else {
            logger.warn(
                "[AICodBiAssistant] Appointment plan '{}' not found â€” query returned no rows",
                planName)
          }
        } finally {
          em.close()
        }
      }
      if (changed) gson.toJson(root) else formJson
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to resolve appointment plans: ${e.message}")
      formJson
    }
  }

  private fun handleRun(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val modelId =
        params.headerMap.entries.find { it.key.equals("X-Model", ignoreCase = true) }?.value
            ?: return jsonResponse("""{"error":"Missing X-Model header"}""")

    // Formcycle UI language (sent by the frontend) — used to localize stored change-log text such
    // as the "earlier chat turns" context label so it matches the Formcycle UI.
    val uiLang = params.requestParameters["lang"]?.firstOrNull()?.trim()?.takeIf { it.isNotBlank() }
    val uiLocale = uiLang?.let { java.util.Locale.forLanguageTag(it) } ?: java.util.Locale.ENGLISH

    val prompt =
        params.requestParameters["prompt"]?.firstOrNull()
            ?: return jsonResponse("""{"error":"Missing prompt"}""")

    val instance = Standard.instance ?: return jsonResponse("""{"error":"AI service not ready"}""")

    val phase = params.requestParameters["phase"]?.firstOrNull() ?: "1"

    // When false, no CodBi prompts are sent to the AI in any pass — the AI only receives Formcycle
    // widgets and workflow nodes. Also disables the server-side Holistic.* standard-config
    // application (e.g. Holistic.Cleave.Date must not be applied when CodBi is off).
    val useCodbi = params.requestParameters["useCodbi"]?.firstOrNull()?.toBoolean() ?: true

    // When true, the AI asks ALL clarification questions in a single round instead of limiting
    // itself to at most 3 per round (see buildClarificationSystemPrompt).
    val askAllQuestions =
        params.requestParameters["askAllQuestions"]?.firstOrNull()?.toBoolean() ?: false

    // When true, the AI MUST name generated form fields with the Bürgerservice technical IDs
    // defined in
    // the codbi.buergerservice_naming prompt (BundID/BayernID auto-fill compatible field names).
    val useBuergerserviceNaming =
        params.requestParameters["useBuergerserviceNaming"]?.firstOrNull()?.toBoolean() ?: false

    // Collect image attachments sent as `codbi-base64:<name>` data-URL params (the same format
    // used by ai.llama.standard.qa). PDF pages are rendered to images client-side via PDF.js
    // before upload, so the backend only ever receives PNG/JPEG data URIs here.
    val imageService =
        ImageProcessingService(
            maxPixels = 3_211_264L,
            maxUploadBytes = 50L * 1024 * 1024,
            log = { level, msg ->
              when (level) {
                LogLevel.INFO -> logger.info("[AICodBiAssistant] {}", msg)
                LogLevel.WARNING -> logger.warn("[AICodBiAssistant] {}", msg)
                LogLevel.ERROR -> logger.error("[AICodBiAssistant] {}", msg)
              }
            })
    val imageFileMap = imageService.collectImageData(params)
    val imageParts = imageService.prepareImageParts(imageFileMap, null)

    // Phase 1 â€” classify intent
    if (phase == "1") {
      val (intent, classifyUsage) =
          try {
            // imageParts intentionally omitted: intent classification only needs the text prompt;
            // sending vision-format array content to text-only models causes HTTP 400 errors.
            classifyIntent(prompt, modelId, instance)
          } catch (e: ExternalAiHttpException) {
            logger.warn("[AICodBiAssistant] AI returned HTTP {}: {}", e.httpStatus, e.body)
            return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
          } catch (e: Exception) {
            logger.error("[AICodBiAssistant] Classification failed", e)
            return jsonResponse(
                """{"error":${gson.toJson("Classification failed: ${e.message}")}}""")
          }
      logger.info("[AICodBiAssistant] Classified intent as: {}", intent)
      val effectiveIntent = upgradeWorkflowIntentToBothIfAddingFormElement(prompt, intent)
      if (effectiveIntent != intent) {
        logger.info(
            "[AICodBiAssistant] Intent '{}' upgraded to '{}' — prompt asks to add a form element (e.g. a submit button) that triggers a workflow",
            intent,
            effectiveIntent)
      }
      // Report the estimated cost of the classification call (per input/output tokens) when a
      // price is configured for the selected model.
      val classifyPrice = instance.priceForModel(modelId)
      val classifyCost =
          classifyPrice?.costFor(classifyUsage.input.toLong(), classifyUsage.output.toLong())
      return jsonResponse(
          """{"status":"need_data","intent":${gson.toJson(effectiveIntent)},"tokens":${classifyUsage.total},"tokensIn":${classifyUsage.input},"tokensOut":${classifyUsage.output},"cost":${classifyCost ?: "null"},"currency":${gson.toJson(classifyPrice?.currency)}}""")
    }

    // Phase 2 â€” execute
    var intent = params.requestParameters["intent"]?.firstOrNull() ?: "both"
    val result = StringBuilder("{")
    result.append(""""intent":${gson.toJson(intent)}""")
    // For "both" intent: form elements are updated after form modification so the workflow AI
    // sees buttons/fields that were just created by the form AI (not just the pre-existing ones).
    // Safety net: when the frontend did not send the explicit `formElements` list (e.g. an older
    // frontend, or extraction failed client-side), derive it from the persist JSON so the
    // clarification AI still receives every XSelect's options as {text, value} — without them it
    // cannot resolve which value an option like "Ja" maps to and wrongly asks the user (e.g.
    // "Welcher Wert wird verwendet, wenn 'Ja' gewählt wird?").
    var latestFormElements: String? =
        params.requestParameters["formElements"]?.firstOrNull()
            ?: extractFormElementsFromJson(params.requestParameters["persist"]?.firstOrNull() ?: "")
    // Structural form context (pages, fieldsets, containers and their titles) derived from the
    // persist JSON, so the clarification AI can resolve references to existing elements (e.g. "the
    // two fieldsets on the first page") WITHOUT asking the user which elements are meant.
    val formStructureContext: String? =
        if (intent == "form" || intent == "both") {
          buildFormStructureContext(params.requestParameters["persist"]?.firstOrNull())
        } else null
    // COMPLETE form structure — the full persist JSON with EVERY detail (cssclasses, data-cb-func /
    // data-cb-* attributes, datatype, XSelect options, appointmentPlan, XButtonList action.page,
    // ...). The chat AI receives this so it can answer questions about or VERIFY the form against a
    // checklist; the condensed structure above intentionally omits classes and attributes.
    val completeFormJson: String? =
        params.requestParameters["persist"]?.firstOrNull()?.takeIf { it.isNotBlank() }
    // COMPLETE workflow structure — tasks, triggers (with their parameters) and the full node tree
    // (every node's type/name/description and customParameters) — so the chat AI can answer
    // questions about or verify the workflow with all details as well.
    val completeWorkflowJson: String? =
        params.requestParameters["workflowVersionId"]?.firstOrNull()?.toLongOrNull()?.let { wid ->
          buildWorkflowStructureContext(wid, getUserContext(params))
        }
    // Estimated tokens consumed by this run, split into input (prompts) and output (completions).
    // runTokens keeps the combined total for the frontend token counter.
    var tokensIn = 0
    var tokensOut = 0
    var runTokens = 0
    // Change-log capture: remember what was changed so the inference can be recorded in the DB.
    var persistJson: String? = null
    var resolvedFormJson: String? = null
    var workflowVersionId: Long? = null
    var workflowNodes: JsonArray? = null
    // Whole-form translation → multilingual workflow mails: the form AI signals this with the
    // structured top-level "_workflowMailLanguages" marker (see the extraction in the form block
    // below). Declared here so the multilingualize pass below (after the form block) can read it.
    var workflowMailLanguages: List<String>? = null
    // True when the FORM AI explicitly signaled a full removal: the user asked (in ANY language /
    // phrasing) to delete all elements / empty the form, and the AI emitted the top-level
    // "_removeAll":true marker. The backend then keeps the structural skeleton (page/header/footer)
    // and removes all orphaned workflow paths.
    var removeAllRequested = false
    // Technical name/key of the form being edited (explicit request param, or derived from the
    // persist JSON metadata). Used to scope the change log to the currently edited form.
    var formKey: String? =
        params.requestParameters["formKey"]?.firstOrNull()?.trim()?.takeIf { it.isNotEmpty() }

    // Multi-round clarification: give the AI a chance to ask the user for missing information
    // (multiple-choice options + free text + optional attached document). The frontend answers via
    // a popup and re-runs phase 2 carrying `clarificationHistory`, so the AI may ask again until it
    // has everything it needs. Attachments of clarification answers arrive as `codbi-base64:<name>`
    // image params, exactly like the main prompt's attachment, and are part of [imageParts].
    val clarificationHistory = parseClarificationHistory(params)
    val clarificationContext = buildClarificationContext(clarificationHistory)

    // Form chat: the AI always decides whether the user's message contains a question,
    // instructions,
    // or both (no heuristic gate — a question can be phrased in too many ways). chatMode=true marks
    // turns coming from the chat popup; those re-classify intent when they contain instructions.
    val chatTurns = parseChatHistory(params)
    val chatMode = params.requestParameters["chatMode"]?.firstOrNull()?.toBoolean() ?: false
    // The chat history (previous turns) is ALSO fed to the clarification check and the form /
    // workflow execution prompts, so references like "apply options 1, 2, 5 and 7" resolve against
    // the numbered list the AI gave in the chat popup instead of being asked again.
    val chatContext = buildChatContext(chatTurns)
    var pendingChatAnswer: String? = null
    // User context + form key are needed so the chat AI can request the current form's Matomo
    // statistics (the backend resolves the form title and queries the Matomo server configured via
    // the AI_FormAssistant_Matomo_* plugin properties).
    val userContextForChat =
        try {
          getUserContext(params)
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] Could not resolve user context for chat/statistics: {}",
              e.message)
          null
        }
    val chatAnswerResult =
        try {
          produceChatAnswer(
              prompt,
              modelId,
              instance,
              formStructureContext,
              completeFormJson,
              completeWorkflowJson,
              chatTurns,
              clarificationContext,
              formKey,
              userContextForChat)
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] Chat answer pass failed: {}", e.message)
          null
        }
    // Matomo statistics fetched during the chat pass (the AI requested them for an analysis /
    // optimisation question). They are reused by the form-modification pass below so an
    // "analyse and optimise" instruction also sees the statistics.
    val matomoStatsContext = chatAnswerResult?.matomoStatsContext
    if (chatAnswerResult != null && !chatAnswerResult.hasInstructions) {
      // Answer-only: respond to the user's question OR acknowledge a neutral message ("ok" — in any
      // phrasing, classified by the AI) WITHOUT modifying the form or workflow — a request that
      // already ran must not be re-executed.
      val chatPrice = instance.priceForModel(modelId)
      val chatCost =
          chatPrice?.costFor(
              chatAnswerResult.tokensIn.toLong(), chatAnswerResult.tokensOut.toLong())
      // The AI may classify a neutral acknowledgment with no answer text — fall back to a localized
      // "okay" so the chat shows a sensible bubble instead of nothing.
      val answerText =
          chatAnswerResult.answer.ifBlank { localize("codbi.chat.ackNeutral", uiLocale, "✅ Okay.") }
      // Structured statistics (e.g. the Matomo summary) attached to the answer so the chat bubble
      // can
      // render charts from it. null when the AI did not request statistics for this turn.
      val matomoStatsJson = parseStatsJson(chatAnswerResult.matomoStatsContext)
      return jsonResponse(
          """{"intent":${gson.toJson(intent)},"chatAnswer":${gson.toJson(answerText)},"hasQuestion":${chatAnswerResult.hasQuestion},"tokens":${chatAnswerResult.tokensIn + chatAnswerResult.tokensOut},"tokensIn":${chatAnswerResult.tokensIn},"tokensOut":${chatAnswerResult.tokensOut},"cost":${chatCost ?: "null"},"currency":${gson.toJson(chatPrice?.currency)},"matomoStats":${matomoStatsJson ?: "null"}}""")
    }
    if (chatAnswerResult != null && chatAnswerResult.hasQuestion) {
      pendingChatAnswer = chatAnswerResult.answer
    }
    // A chat turn that contains instructions must run with the correct intent (form / workflow /
    // both) — the frontend always sends "both" for chat turns, so re-classify before executing.
    if (chatMode) {
      try {
        val (reclassifiedIntent, usage) =
            classifyIntent(
                prompt,
                modelId,
                instance,
                emptyList(),
                chatContext,
                formStructureContext,
                clarificationContext)
        val effectiveReclassified =
            upgradeWorkflowIntentToBothIfAddingFormElement(prompt, reclassifiedIntent)
        intent = effectiveReclassified
        tokensIn += usage.input
        tokensOut += usage.output
        logger.info("[AICodBiAssistant] chatMode re-classified intent as: {}", intent)
      } catch (e: Exception) {
        logger.warn(
            "[AICodBiAssistant] chatMode re-classification failed; keeping intent '{}': {}",
            intent,
            e.message)
      }
    }
    if (chatAnswerResult != null &&
        !(chatAnswerResult.hasQuestion && !chatAnswerResult.hasInstructions)) {
      logger.info(
          "[AICodBiAssistant] Chat classification: hasQuestion={}, hasInstructions={} — proceeding with normal execution",
          chatAnswerResult.hasQuestion,
          chatAnswerResult.hasInstructions)
    }
    // The prior change history is NOT sent to the AI by default — it is fetched from the change log
    // only when the AI explicitly requests it (the prompt refers to earlier work, e.g. "apply the
    // same as last week" or "what another user configured"). The AI may also request the history of
    // ANOTHER form (e.g. "do the same as on form X"): it first fetches the list of all forms via
    // need_form_list, picks the best match, and then requests that form's history via
    // need_chat_history with a formKey — or asks the user which form it meant (clarification
    // popup).
    // Identify the currently open form (title + key) so the AI can tell "this form" apart from
    // ANOTHER form the user might name by title (e.g. "do the same as on form 'New Form'").
    val currentFormTitle =
        if (formKey.isNullOrBlank()) null
        else resolveCurrentFormTitle(getUserContext(params), formKey)
    var changeHistoryContext: String? = null
    var formListContext: String? = null
    var formListAttempted = false
    val historyLoadedFormKeys = mutableSetOf<String>()
    var clarification: ClarificationRequest? = null
    // Inject the workflow version's AVAILABLE ABSCHLUSSSEITEN (completion pages) into the
    // clarification prompt, so when the request needs a success/failure Abschlussseite (e.g.
    // FC_DOI_INIT successPage/failurePage) the AI offers them BY NAME as options instead of asking
    // for a target URL / free-text page identifier.
    val clarificationCompletionPages: String? =
        if (intent == "workflow" || intent == "both") {
          params.requestParameters["workflowVersionId"]?.firstOrNull()?.toLongOrNull()?.let { wid ->
            fetchCompletionPages(getUserContext(params), wid)
          }
        } else null
    logger.info(
        "[AICodBiAssistant] Clarification Abschlussseiten loaded: {} chars",
        clarificationCompletionPages?.length ?: 0)
    // Form GLOBAL variables, so the clarification AI knows they exist and does not ask whether to
    // create hidden fields for them (they are variables, referenced via [%variableName%]).
    val clarificationFormVariables =
        extractFormVariablesFromJson(params.requestParameters["persist"]?.firstOrNull())
    logger.info(
        "[AICodBiAssistant] Clarification form variables: {}", clarificationFormVariables ?: "none")
    for (round in 0 until 5) {
      val check =
          try {
            tryClarification(
                prompt,
                modelId,
                instance,
                intent,
                latestFormElements,
                formStructureContext,
                clarificationContext,
                chatContext,
                changeHistoryContext,
                formListContext,
                formKey,
                currentFormTitle,
                useCodbi,
                askAllQuestions,
                imageParts,
                clarificationCompletionPages,
                clarificationFormVariables)
          } catch (e: Exception) {
            logger.warn("[AICodBiAssistant] Clarification check failed: {}", e.message)
            null
          }
      if (check == null) {
        clarification = null
        break
      }
      if (check.needsFormList) {
        if (!formListAttempted) {
          formListAttempted = true
          formListContext = loadFormListContext(getUserContext(params), formKey)
          logger.info(
              "[AICodBiAssistant] AI requested the form list; loaded {} chars",
              formListContext?.length ?: 0)
          continue
        }
        // The AI already received the form list but still asks for it again — it could not match
        // the
        // form the user mentioned (or found no reasonable one). Fall back to asking the user which
        // form they meant, offering the known forms by title as options.
        val choice = buildFormChoiceClarification(formListContext)
        if (choice != null) {
          clarification = ClarificationRequest(listOf(choice))
          logger.info("[AICodBiAssistant] AI could not match a form; asking the user to choose")
        }
        break
      }
      if (check.needsHistory) {
        val targetKey = check.historyFormKey?.trim()?.takeIf { it.isNotEmpty() } ?: formKey
        if (targetKey.isNullOrBlank()) {
          logger.warn("[AICodBiAssistant] AI requested history but no form key is available")
          break
        }
        if (historyLoadedFormKeys.add(targetKey)) {
          val loaded = loadChangeHistoryContext(targetKey)
          logger.info(
              "[AICodBiAssistant] AI requested change history of form {}; loaded {} chars",
              targetKey,
              loaded?.length ?: 0)
          changeHistoryContext =
              if (changeHistoryContext.isNullOrBlank()) loaded
              else changeHistoryContext + "\n" + (loaded ?: "")
          continue
        }
      }
      clarification = check.questions
      break
    }
    if (clarification != null) {
      logger.info(
          "[AICodBiAssistant] AI asked {} clarification question(s): {}",
          clarification.questions.size,
          clarification.questions.joinToString(" | ") { "Q[${it.id}]: ${it.question}" })
      return jsonResponse(
          """{"intent":${gson.toJson(intent)},"clarification":${gson.toJson(clarification)},"clarificationHistory":${gson.toJson(clarificationTurnsToJson(clarificationHistory))}}""")
    }

    if (intent == "form" || intent == "both") {
      persistJson =
          params.requestParameters["persist"]?.firstOrNull()
              ?: return jsonResponse("""{"error":"Missing persist for form modification"}""")
      try {
        JsonParser.parseString(persistJson)
      } catch (_: Exception) {
        return jsonResponse("""{"error":"Invalid persist JSON"}""")
      }
      if (formKey == null) {
        formKey = AiAssistantLog.extractFormKey(persistJson)
      }
      // Pass the FULL clarification context to the form AI. How to interpret the answers (a literal
      // recipient/sender/subject is workflow-email config and must NOT become a form field, while
      // an
      // answer that tells the AI to create a form field for the address MUST result in such a
      // field)
      // is decided by the AI from the clarificationInstruction prompt text — not by a brittle
      // backend keyword filter that could never cover every phrasing.
      // Whole-form translation into SEVERAL languages at once ("translate to English and French")
      // runs as ONE language per AI pass — sequential — so no single response must carry every
      // translation (an oversized combined output truncates mid-JSON and aborts the run; observed
      // live). The languages are declared by the AI (planWholeFormTranslation, gated by a cheap
      // fallback-safe hint); each pass reuses runFormModification on the ORIGINAL persist
      // restricted
      // to ONE language, and the per-language i18n is merged into one final form. Only when >= 2
      // new
      // languages are planned does this engage; otherwise the normal single pass runs unchanged.
      val formBaseLang =
          runCatching {
                JsonParser.parseString(persistJson).asJsonObject.get("lang")?.asString?.trim()
              }
              .getOrNull() ?: "de"
      val existingFormLangs =
          (deriveWorkflowMailLanguagesFromForm(persistJson) ?: listOf(formBaseLang))
              .map { it.lowercase() }
              .toSet()
      val translationPlan =
          runCatching { planWholeFormTranslation(prompt, persistJson, modelId, instance) }
              .getOrNull() ?: Triple(false, emptyList(), TokenUsage(0, 0))
      tokensIn += translationPlan.third.input
      tokensOut += translationPlan.third.output
      runTokens = tokensIn + tokensOut
      val plannedNewLangs =
          translationPlan.second.filter {
            it.isNotBlank() &&
                it.lowercase() != formBaseLang.lowercase() &&
                it.lowercase() !in existingFormLangs
          }
      // Base-first full language list when the sequential mode engages (authoritative for the
      // workflow multilingualize pass below); null = normal single-pass flow.
      val sequentialFormLanguages: List<String>? =
          if (translationPlan.first && plannedNewLangs.size >= 2) {
            (listOf(formBaseLang) + plannedNewLangs).distinct()
          } else {
            null
          }
      if (sequentialFormLanguages != null) {
        logger.info(
            "[AICodBiAssistant] Whole-form translation executes as per-language passes (base first): {}",
            sequentialFormLanguages.joinToString(", "))
      }
      // Repeat whole-form translation: the AI said the request IS a whole-form translation, but
      // every
      // named language is ALREADY present on the (already multilingual) form — nothing new to add.
      // Running the generic full form-rebuild pass here is wasteful AND error-prone (observed live:
      // the model re-emits the whole already-multilingual form, passes the output-length budget,
      // truncates and returns invalid JSON). Treat it as a NO-OP on the form; the workflow
      // multilingualize pass below still runs (it heals FC_SWITCH ordering / verifies the
      // languages).
      val repeatTranslationNoop =
          translationPlan.first && plannedNewLangs.isEmpty() && existingFormLangs.size >= 2
      val (formJson, applicabilityReport, formTokenUsage) =
          try {
            if (sequentialFormLanguages != null) {
              runSequentialWholeFormTranslation(
                  prompt,
                  persistJson,
                  plannedNewLangs,
                  modelId,
                  instance,
                  imageParts,
                  useCodbi,
                  useBuergerserviceNaming,
                  clarificationContext,
                  chatContext,
                  changeHistoryContext,
                  matomoStatsContext)
            } else if (repeatTranslationNoop) {
              logger.info(
                  "[AICodBiAssistant] Repeat whole-form translation: every requested language is already on the form — leaving the form unchanged (workflow multilingualize still runs).")
              Triple(persistJson, null, TokenUsage(0, 0))
            } else {
              runFormModification(
                  prompt,
                  persistJson,
                  modelId,
                  instance,
                  imageParts,
                  useCodbi,
                  useBuergerserviceNaming,
                  clarificationContext,
                  chatContext,
                  changeHistoryContext,
                  matomoStatsContext)
            }
          } catch (e: ExternalAiHttpException) {
            logger.warn("[AICodBiAssistant] Form AI HTTP {}: {}", e.httpStatus, e.body)
            return jsonResponse("""{"error":${gson.toJson("Form AI error: ${e.message}")}}""")
          } catch (e: Exception) {
            logger.error("[AICodBiAssistant] Form modification failed", e)
            return jsonResponse(
                """{"error":${gson.toJson("Form modification failed: ${e.message}")}}""")
          }
      tokensIn += formTokenUsage.input
      tokensOut += formTokenUsage.output
      runTokens = tokensIn + tokensOut
      // Whole-form translation → multilingual workflow mails. When the form AI decides a change is
      // a
      // whole-form translation of a MULTILINGUAL form, it signals this with the structured
      // top-level
      // marker "_workflowMailLanguages" — an array of the language codes the form now supports,
      // base/
      // default language first (see the whole-form-translation prompt rules). The marker is
      // consumed
      // here and stripped from the emitted form so handleRun can multilingualize the existing
      // CONSUMER-facing workflow mails with an FC_SWITCH on the "[%lang%]" placeholder (see
      // runWorkflowMailMultilingualization). Like "_codbiApplicability", this is an AI-declared,
      // language-agnostic signal — never a server-side keyword guess of the request's intent.
      workflowMailLanguages =
          runCatching {
                val probe = JsonParser.parseString(formJson)
                if (!probe.isJsonObject) null
                else {
                  val marker = probe.asJsonObject.get("_workflowMailLanguages")
                  if (marker?.isJsonArray != true) null
                  else
                      marker.asJsonArray
                          .mapNotNull { el ->
                            if (el.isJsonPrimitive && el.asJsonPrimitive.isString)
                                el.asString.trim()
                            else null
                          }
                          .filter { it.isNotEmpty() }
                          .distinct()
                          .ifEmpty { null }
                }
              }
              .getOrNull()
      var effectiveFormJson = formJson
      if (workflowMailLanguages != null) {
        effectiveFormJson =
            runCatching {
                  val o = JsonParser.parseString(formJson).asJsonObject
                  o.remove("_workflowMailLanguages")
                  gson.toJson(o)
                }
                .getOrDefault(formJson)
        logger.info(
            "[AICodBiAssistant] Whole-form translation signaled workflow mail multilingualization for languages: {}",
            workflowMailLanguages.joinToString(", "))
      }
      // Structural fallback: even when the model did not emit the "_workflowMailLanguages" marker,
      // a
      // form whose widgets already carry per-language "i18n" for languages different from its base
      // "lang" is genuinely multilingual — and its workflow mails/ending pages may still lag behind
      // (e.g. a re-run of "translate to Italian" after the widgets were already translated). Derive
      // the languages from the form's own i18n (base first) so the multilingualize pass also runs
      // in
      // that case. The pass itself is a cheap no-op when there is nothing left to wrap.
      if (workflowMailLanguages == null) {
        val derived = deriveWorkflowMailLanguagesFromForm(formJson)
        if (derived != null) {
          workflowMailLanguages = derived
          logger.info(
              "[AICodBiAssistant] Derived workflow mail languages from the translated form's i18n (base first): {}",
              derived.joinToString(", "))
        }
      }
      // Sequential multi-language mode: the merged carrier only carries the FIRST pass's marker
      // (the
      // model ends each per-language pass with "_workflowMailLanguages" for just that one pass), so
      // the full base-first language list planned above is authoritative for the workflow passes.
      if (sequentialFormLanguages != null) {
        workflowMailLanguages = sequentialFormLanguages
        logger.info(
            "[AICodBiAssistant] Sequential whole-form translation workflow languages (base first): {}",
            workflowMailLanguages.joinToString(", "))
      }
      // Propagate a form-AI error response unchanged
      val formParsed = runCatching { JsonParser.parseString(effectiveFormJson) }.getOrNull()
      if (formParsed?.isJsonObject == true && formParsed.asJsonObject.has("error")) {
        return jsonResponse(effectiveFormJson)
      }
      // If the AI answered with prose instead of form JSON, stop with a clean error instead of
      // embedding the prose into the response (which the frontend would then fail to parse).
      if (formParsed == null) {
        logger.warn("[AICodBiAssistant] Form AI returned non-JSON; aborting run")
        return jsonResponse(
            """{"error":${gson.toJson("The AI did not return a valid form JSON: ${effectiveFormJson.take(300)}")}}""")
      }
      // "Remove everything" signal: the AI emits the top-level "_removeAll":true marker when the
      // user
      // asked (in ANY language / phrasing) to delete all elements / empty the form. The backend
      // then
      // removes all orphaned workflow paths. Language-agnostic because the AI decides, not a
      // keyword
      // list.
      removeAllRequested =
          runCatching {
                val o = formParsed.asJsonObject
                o.get("_removeAll")?.takeIf { it.isJsonPrimitive }?.asBoolean == true
              }
              .getOrDefault(false)
      if (removeAllRequested) {
        logger.info(
            "[AICodBiAssistant] AI signaled '_removeAll' — form content emptied (skeleton kept, workflows removed)")
      }
      // Auto-resolve appointment plan names to UUIDs for XAppointment elements, neutralize
      // destructive SQL the AI may have placed into a button's customAction (form-level injection),
      // and keep the form's pages when the AI was asked to remove widgets/workflows (not pages).
      val appointmentResolved = resolveAppointmentPlans(effectiveFormJson)
      val restoredJson =
          restorePagesUnlessRequested(
              sanitizeFormCustomActions(appointmentResolved), persistJson, prompt)
      // Final structural normalization: move any page the merge/restore steps appended AFTER the
      // footer back in front of it (otherwise pages 2 & 3 render below the footer), and copy page
      // labels from the Form.Navigator onto empty XPage headers.
      resolvedFormJson =
          runCatching {
                val obj = JsonParser.parseString(restoredJson).asJsonObject
                if (normalizeFinalFormStructure(obj)) gson.toJson(obj) else restoredJson
              }
              .getOrDefault(restoredJson)
      // Auto-repair ANY orphaned element: an element that exists in the flat "items" array with a
      // "parentid" but is missing from its container's "properties.elements" array is published but
      // never rendered by Formcycle (useless). Re-reference every such element from its container
      // so
      // the final form is structurally consistent before it is emitted.
      val orphanRepairedForm = resolvedFormJson?.let { repairOrphanedFormElements(it) }
      if (orphanRepairedForm != null) {
        resolvedFormJson = orphanRepairedForm
      }
      // The "_removeAll" marker is an instruction to the backend, not a form element — strip it
      // from
      // the emitted form JSON so it is never published.
      if (removeAllRequested && resolvedFormJson != null) {
        resolvedFormJson =
            runCatching {
                  val o = JsonParser.parseString(resolvedFormJson).asJsonObject
                  o.remove("_removeAll")
                  gson.toJson(o)
                }
                .getOrDefault(resolvedFormJson)
      }
      // NOTE: `formJson` is deliberately NOT appended here. It is emitted AFTER the workflow step
      // below, so a workflow triggered by FC_FORM_SUBMIT_BUTTON can first add a missing submit
      // button to the form JSON (see ensureSubmitButtonInForm). JSON key order is irrelevant, so
      // moving the emit does not change the response semantics.
      result.append(""","tokens":$runTokens""")
      // Auto-manage Holistic.Cleave.* standard configurations based on field types in the form.
      // Only performed when the frontend could read the current standards from the DOM
      // (key absent = standards editor not yet rendered; skip to avoid overwriting manual
      // settings).
      val currentStandardsParam = params.requestParameters["currentStandards"]
      if (useCodbi && currentStandardsParam != null) {
        val currentStandards = currentStandardsParam.firstOrNull() ?: ""
        // aiSetStandards is the full standards CSV the AI set on the previous run.
        // Absent = first run this session; the backend then treats all Cleave configs as
        // AI-controlled.
        val aiSetStandards = params.requestParameters["aiSetStandards"]?.firstOrNull()
        val updatedStandards =
            computeUpdatedStandards(
                resolvedFormJson, currentStandards, aiSetStandards, applicabilityReport)
        result.append(""","standards":${gson.toJson(updatedStandards)}""")
      }
      // For "both" intent: extract up-to-date form elements from the newly modified form JSON
      // so the workflow AI can reference newly created buttons/fields by their correct names.
      if (intent == "both") {
        latestFormElements = extractFormElementsFromJson(resolvedFormJson) ?: latestFormElements
        logger.info(
            "[AICodBiAssistant] Updated form elements for workflow AI: {}", latestFormElements)
      }
    }

    // "Delete everything": the FORM AI signaled "_removeAll" (any language) — the user asked to
    // empty/delete ALL content of the form. That orphans EVERY workflow path (lane + trigger: its
    // trigger button and the referenced form fields are gone), so remove ALL workflow paths HERE,
    // independent of the classified intent (form, both or workflow). For a full form reset the
    // workflow-creation / submit-button phases below are additionally skipped (see the
    // !removeAllRequested guards) — nothing new is built on top of an emptied form. (The structural
    // skeleton — first page, header, footer — is always kept by restorePagesUnlessRequested and
    // must NOT block this cleanup.)
    if (removeAllRequested) {
      val wfVid = params.requestParameters["workflowVersionId"]?.firstOrNull()?.toLongOrNull()
      if (wfVid != null) {
        try {
          val wfCleanup = removeAllWorkflowPaths(params, wfVid)
          if (wfCleanup.isNotBlank()) {
            logger.info("[AICodBiAssistant] Form emptied — {}", wfCleanup)
          }
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] Could not remove workflow paths after emptying the form: {}",
              e.message)
        }
      }
    }

    // Whole-form translation → multilingual workflow mails AND ending pages (Abschlussseiten). The
    // form AI signaled "_workflowMailLanguages" (or the structural i18n fallback above derived the
    // languages). When the workflow version is known, run the dedicated multilingualize passes:
    //   1. MAILS: wrap every existing CONSUMER-facing FC_EMAIL / FC_DOI_INIT node into an FC_SWITCH
    //      that branches on the "[%lang%]" placeholder (one case per form language) — the ORIGINAL
    //      mail stays on the base-language and default branches, a translated mail clone is
    // generated
    //      for every other language. Existing [%lang%] mail switches are EXTENDED with the new
    //      language cases instead of being wrapped again.
    //   2. ENDING PAGES: wrap every consumer FC_SHOW_TEMPLATE (Abschlussseite) node into an
    //      [%lang%] FC_SWITCH whose non-base cases reference the ALREADY EXISTING localized page
    //      named "<base> _CB_<LANG>" (e.g. "… _CB_EN"); when no localization exists the case falls
    //      back to the ORIGINAL page (never creates a page — server-side creation of
    // TEMPLATE_CLIENT
    //      rows is impossible from the plugin).
    // Both passes use the workflow-node API directly, NEVER create a lane/trigger/endpoint, and
    // leave
    // the form JSON itself untouched (a translation must not add form elements, so no submit-button
    // auto-ensure runs here). Their messages are combined into ONE workflowMessage.
    val mailLanguages = workflowMailLanguages
    if (mailLanguages != null && !removeAllRequested) {
      val wfVid = params.requestParameters["workflowVersionId"]?.firstOrNull()?.toLongOrNull()
      if (wfVid != null) {
        val wfMultilingualMessages = mutableListOf<String>()
        try {
          val wfMailMessage =
              runWorkflowMailMultilingualization(
                  prompt,
                  mailLanguages,
                  wfVid,
                  params,
                  modelId,
                  instance,
                  chatContext,
                  clarificationContext,
                  changeHistoryContext)
          if (wfMailMessage.isNotBlank()) {
            logger.info("[AICodBiAssistant] Workflow mail multilingualization: {}", wfMailMessage)
            wfMultilingualMessages.add(wfMailMessage)
          }
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] Workflow mail multilingualization failed: {}", e.message)
          wfMultilingualMessages.add("Mail multilingualization failed: ${e.message}")
        }
        try {
          val wfEndPageMessage =
              runEndPageMultilingualization(
                  prompt,
                  mailLanguages,
                  wfVid,
                  params,
                  modelId,
                  instance,
                  chatContext,
                  clarificationContext,
                  changeHistoryContext)
          if (wfEndPageMessage.isNotBlank()) {
            logger.info(
                "[AICodBiAssistant] Workflow ending-page multilingualization: {}", wfEndPageMessage)
            wfMultilingualMessages.add(wfEndPageMessage)
          }
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] Workflow ending-page multilingualization failed: {}", e.message)
          wfMultilingualMessages.add("Ending-page multilingualization failed: ${e.message}")
        }
        if (wfMultilingualMessages.isNotEmpty()) {
          result.append(
              ""","workflowMessage":${gson.toJson(wfMultilingualMessages.joinToString(" | "))}""")
        }
      }
    }

    // Create the submit button BEFORE the workflow AI runs, so the AI sees it in the FORM ELEMENTS
    // and sets triggerParams.buttonName itself — the trigger is then bound to that button directly
    // at generation time (the cleaner order) instead of the workflow being created with an empty
    // buttonName and the trigger being fixed up afterwards. Applies to "workflow" (uses the persist
    // the frontend always sends) and "both" (uses the freshly modified form). Skipped entirely for
    // a
    // full form reset (removeAllRequested): the workflows are removed, nothing is (re)created.
    if (!removeAllRequested && (intent == "workflow" || intent == "both")) {
      val sourceForEnsure =
          resolvedFormJson
              ?: params.requestParameters["persist"]?.firstOrNull()?.takeIf { it.isNotBlank() }
      if (sourceForEnsure != null) {
        // Ensure ANY submit button exists — the AI will pick its name (btnSenden) from the form
        // elements. "btnSenden" is only added when the form has no submit button at all.
        val ensured = ensureSubmitButtonInForm(sourceForEnsure, "")
        if (ensured != null && ensured != sourceForEnsure) {
          if (resolvedFormJson == null) {
            // Workflow-only run: keep the original form for the change-log diff.
            persistJson = sourceForEnsure
          }
          resolvedFormJson = ensured
          latestFormElements = extractFormElementsFromJson(ensured) ?: latestFormElements
          logger.info(
              "[AICodBiAssistant] Ensured submit button 'btnSenden' BEFORE the workflow AI so the trigger can bind to it")
        }
      }
    }

    if (!removeAllRequested && (intent == "workflow" || intent == "both")) {
      val workflowVersionIdStr =
          params.requestParameters["workflowVersionId"]?.firstOrNull()
              ?: return jsonResponse(
                  """{"error":"Missing workflowVersionId for workflow creation"}""")
      workflowVersionId =
          workflowVersionIdStr.toLongOrNull()
              ?: return jsonResponse("""{"error":"Invalid workflowVersionId (must be a number)"}""")

      val workflowMessage =
          try {
            val (message, nodes, workflowTokenUsage) =
                runWorkflowCreation(
                    prompt,
                    latestFormElements,
                    workflowVersionId,
                    modelId,
                    params,
                    instance,
                    imageParts,
                    clarificationContext,
                    chatContext,
                    changeHistoryContext)
            workflowNodes = nodes
            tokensIn += workflowTokenUsage.input
            tokensOut += workflowTokenUsage.output
            runTokens = tokensIn + tokensOut
            message
          } catch (e: ExternalAiHttpException) {
            logger.warn("[AICodBiAssistant] Workflow AI HTTP {}: {}", e.httpStatus, e.body)
            return jsonResponse("""{"error":${gson.toJson("Workflow AI error: ${e.message}")}}""")
          } catch (e: Exception) {
            logger.error("[AICodBiAssistant] Workflow creation failed", e)
            return jsonResponse(
                """{"error":${gson.toJson("Workflow creation failed: ${e.message}")}}""")
          }
      result.append(""","workflowMessage":${gson.toJson(workflowMessage)}""")
    }

    // A workflow triggered by the form's submit button (FC_FORM_SUBMIT_BUTTON) is only reachable
    // when the form actually HAS a submit button. The workflow AI does not inspect the form (intent
    // classification and workflow generation run on the prompt text + form elements only), so it
    // can build an FC_FORM_SUBMIT_BUTTON lane while the form has no way to submit — the user could
    // then never trigger it. When that happens, add a "Senden" submit button to the form and return
    // the updated `formJson` so the frontend publishes the form together with the workflow (the
    // frontend already handles a `formJson` + `workflowMessage` response: it publishes the form and
    // reloads the designer).
    val submitButtonName = workflowSubmitButtonName(workflowNodes)
    if (submitButtonName != null) {
      // resolvedFormJson is set for "form"/"both" runs; for a workflow-only run read the persist
      // the frontend always sends alongside workflowVersionId.
      val sourceFormJson =
          resolvedFormJson
              ?: params.requestParameters["persist"]?.firstOrNull()?.takeIf { it.isNotBlank() }
      if (sourceFormJson != null) {
        var currentForm = sourceFormJson
        // 1) Ensure the submit button exists / is reachable for FC_FORM_SUBMIT_BUTTON lanes.
        val ensuredFormJson = ensureSubmitButtonInForm(currentForm, submitButtonName)
        if (ensuredFormJson != null && ensuredFormJson != currentForm) {
          currentForm = ensuredFormJson
        }
        // 2) Auto-repair ANY orphaned element (not just the submit button): an element present in
        //    the flat "items" array but missing from its container's "properties.elements" array is
        //    published but never rendered — re-reference it so it becomes visible.
        val orphanRepaired = repairOrphanedFormElements(currentForm)
        if (orphanRepaired != null && orphanRepaired != currentForm) {
          currentForm = orphanRepaired
        }
        // 3) The workflow AI leaves `triggerParams:{}` (fires on ANY button) when the form had no
        //    submit button at generation time. Now that a concrete button is ensured, explicitly
        //    bind the FC_FORM_SUBMIT_BUTTON trigger(s) to it so the designer shows the button
        //    selected instead of "any button".
        val effectiveButtonName = if (submitButtonName.isBlank()) "btnSenden" else submitButtonName
        workflowVersionId?.let { wid ->
          bindSubmitTriggerToButton(getUserContext(params), wid, effectiveButtonName)
        }
        if (currentForm != sourceFormJson) {
          if (resolvedFormJson == null) {
            // Workflow-only run: remember the original form for the change-log diff.
            persistJson = sourceFormJson
          }
          resolvedFormJson = currentForm
          logger.info(
              "[AICodBiAssistant] Form adjusted for FC_FORM_SUBMIT_BUTTON workflow — submit button '{}' ensured and/or orphaned elements repaired",
              effectiveButtonName)
        }
      }
    }
    // Emit the (possibly adjusted) form JSON here, after the workflow step — see the NOTE above the
    // form-modification block. For "workflow"-only runs formJson is emitted ONLY when the form was
    // actually changed (submit button ensured and/or orphaned elements repaired; resolvedFormJson
    // is
    // null otherwise), so a form is never echoed back without a change.
    if (resolvedFormJson != null) {
      result.append(""","formJson":$resolvedFormJson""")
    }

    // Resolve the selected model's pricing and compute the estimated cost of this run from the
    // accumulated input/output tokens. `null` when no price is configured for the model.
    val modelPrice = instance.priceForModel(modelId)
    val runCost = modelPrice?.costFor(tokensIn.toLong(), tokensOut.toLong())
    val runCurrency = modelPrice?.currency

    // Compute the change description — used both for the change-log record and to detect whether
    // any configured "sensitive" CodBi element (AI_Log_SensitiveElements) was used by this run.
    // The guard covers "form"/"both" runs AND workflow-only runs where a missing submit button was
    // added (both persistJson and resolvedFormJson are then non-null).
    var formChanges: JsonObject? = null
    if (persistJson != null && resolvedFormJson != null) {
      formChanges = AiAssistantLog.computeFormChanges(persistJson, resolvedFormJson)
    }
    val sensitiveUsed =
        formChanges?.let { AiAssistantLog.usedSensitiveElements(it, AI.logSensitiveElements) }
            ?: emptyList()
    // Destructive SQL statements the AI generated that were blocked by the backend sanitizer. Like
    // sensitive elements, these make the frontend auto-open the change log (with an error icon) so
    // the user sees that the destructive statement was NOT persisted.
    val blockedSqlUsed =
        workflowNodes?.let { AiAssistantLog.blockedSqlNodeLabels(it) } ?: emptyList()

    result.append(
        ""","tokensIn":$tokensIn,"tokensOut":$tokensOut,"cost":${runCost ?: "null"},"currency":${gson.toJson(runCurrency)}""")
    if (sensitiveUsed.isNotEmpty()) {
      result.append(""","sensitiveElements":${gson.toJson(sensitiveUsed)}""")
    }
    if (blockedSqlUsed.isNotEmpty()) {
      result.append(""","blockedSqlElements":${gson.toJson(blockedSqlUsed)}""")
    }
    if (pendingChatAnswer != null) {
      result.append(""","hasQuestion":true,"chatAnswer":${gson.toJson(pendingChatAnswer)}""")
      // Attach the structured statistics when the AI requested them (same chart data as the
      // answer-only response above).
      parseStatsJson(matomoStatsContext)?.let { stats ->
        result.append(""","matomoStats":${gson.toJson(stats)}""")
      }
    }
    result.append("}")

    // Record the inference in the change log — every successful run keeps a DB record. For chat
    // turns that refer to numbered options from earlier chat turns (e.g. "do 2, 5 and 7"), the
    // recorded prompt also carries the chat context, so a later reader of the change log (or the
    // AI reading the change history) knows what the numbers referred to.
    val promptForLog =
        if (chatMode && !chatContext.isNullOrBlank()) {
          val contextLabel =
              localize(
                  "codbi.chat.contextLabel", uiLocale, "Earlier chat turns this request refers to:")
          "$prompt\n\n[$contextLabel:]\n$chatContext"
        } else prompt
    try {
      AiAssistantLog.recordInference(
          CodbiEntities.entityManagerFactory,
          promptForLog,
          intent,
          modelId,
          formKey,
          workflowVersionId,
          formChanges,
          workflowNodes,
          tokensIn.toLong(),
          tokensOut.toLong(),
          cost = runCost,
          currency = runCurrency,
          username = currentUsername(params),
          clarification = clarificationTurnsToJson(clarificationHistory))
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to record change log: {}", e.message)
    }

    return jsonResponse(result.toString())
  }

  // endregion Handlers

  // region Intent Classification

  /**
   * Guardrail for the intent router: when the AI classified the request as "workflow" only, but the
   * prompt explicitly asks to ADD/CREATE a form element (submit button, input field, …) that then
   * triggers a workflow automation, the change is really a "both" change — the element is a FORM
   * structure change, the automation is a WORKFLOW change. Upgrading here (phase 1) matters because
   * the frontend only sends the `persist` form data when the intent is "form"/"both"; without it
   * the button/field the user asked for would never be created.
   */
  private fun upgradeWorkflowIntentToBothIfAddingFormElement(
      prompt: String,
      intent: String
  ): String {
    if (intent != "workflow") return intent
    val match =
        Regex(
                "\\b(add|create|insert|generate|place|put)\\b.{0,40}" +
                    "\\b(submit\\s*button|button|radio\\s*button|checkbox|input\\s*field|text\\s*field|" +
                    "upload\\s*field|file\\s*upload|dropdown|select\\s*field)\\b",
                setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
            .find(prompt) ?: return intent
    // Ignore referential mentions of an existing element ("...the add button...") — only upgrade
    // when the user imperatively asks to create the element.
    val beforeVerb = prompt.substring(0, match.range.first)
    if (Regex("\\b(the|this|that|a|an)\\s+$", RegexOption.IGNORE_CASE)
        .containsMatchIn(beforeVerb)) {
      return intent
    }
    logger.info(
        "[AICodBiAssistant] Upgrading intent 'workflow' to 'both' — prompt asks to add a form element that triggers a workflow")
    return "both"
  }

  /**
   * Makes a short AI call to classify whether the user's [prompt] targets the form structure,
   * workflow automations, or both. Returns "form", "workflow", or "both". Defaults to "both" if the
   * AI response cannot be parsed or returns an unexpected value.
   */
  private fun classifyIntent(
      prompt: String,
      modelId: String,
      instance: Standard,
      imageParts: List<String> = emptyList(),
      chatContext: String? = null,
      formStructureContext: String? = null,
      clarificationContext: String? = null
  ): Pair<String, TokenUsage> {
    val baseSystemPrompt = loadClassifyIntentPrompt()
    val systemPrompt =
        baseSystemPrompt +
            renderClassifyIntentContext(
                chatContext = chatContext,
                formStructureContext = formStructureContext,
                clarificationContext = clarificationContext)

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }

    logger.debug(
        "[AICodBiAssistant] Phase-1 messages sent to AI (model={}): {}",
        modelId,
        compactJsonForLog(messagesJson))
    val rawResponse = instance.performFormAssist(modelId, messagesJson)
    // Report the estimated tokens consumed by the classification call so the frontend token
    // counter reflects every inference, not just the phase-2 modifications.
    val usage = TokenUsage(estimateTokens(messagesJson), estimateTokens(rawResponse))
    val cleaned = extractJson(stripThinkTags(rawResponse))

    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleaned, Map::class.java) as? Map<String, Any>
      val intent = obj?.get("intent") as? String
      when (intent) {
        "form",
        "workflow",
        "both" -> intent to usage
        else -> {
          logger.warn(
              "[AICodBiAssistant] Unexpected intent classification '{}' â€” defaulting to 'both'",
              intent)
          "both" to usage
        }
      }
    } catch (_: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not parse classification response '{}' â€” defaulting to 'both'",
          cleaned)
      "both" to usage
    }
  }

  /**
   * Cheap fallback-safe GATE: only decides whether it is worth asking the AI whether a whole-form
   * translation into MULTIPLE languages was requested (the actual language list and whether it is a
   * translation are decided by the AI, never by keyword parsing). When the gate returns false the
   * normal single-pass flow runs unchanged; when it returns true but the AI says "no multi-language
   * translation", the normal single-pass flow also runs unchanged.
   */
  private fun promptHintsTranslation(prompt: String): Boolean {
    val lower = prompt.lowercase()
    val hints =
        listOf(
            "translate",
            "translation",
            "translator",
            "übersetz",
            "uebersetz",
            "uber setz",
            "tradu",
            "traduire",
            "traduc",
            "vertaal",
            "vertal",
            "traduz",
            "tłumacz",
            "перевод",
            "translat",
            "language",
            "languages",
            "sprache",
            "sprachen",
            "lingua",
            "langue",
            "mehrsprach",
            "multilingual")
    return hints.any { lower.contains(it) }
  }

  /**
   * Asks the AI (model-declared, never keyword-parsed) whether the request is a whole-form
   * translation into TWO OR MORE NEW languages and which they are, in request order. Runs ONLY when
   * [promptHintsTranslation] passes (a fallback-safe gate) — for every other request this returns
   * immediately without an AI call. Returns (isMultiLanguageTranslation, newLanguageCodesInOrder,
   * usage). Never throws.
   */
  private fun planWholeFormTranslation(
      prompt: String,
      persistJson: String?,
      modelId: String,
      instance: Standard
  ): Triple<Boolean, List<String>, TokenUsage> {
    if (!promptHintsTranslation(prompt)) return Triple(false, emptyList(), TokenUsage(0, 0))
    val persistRoot =
        runCatching { JsonParser.parseString(persistJson ?: "").asJsonObject }.getOrNull()
    val baseLang = persistRoot?.get("lang")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: "de"
    val existing = deriveWorkflowMailLanguagesFromForm(persistJson ?: "") ?: listOf(baseLang)
    val system =
        "You detect whether a request asks to translate the WHOLE form into TWO OR MORE additional languages at once.\n" +
            "Current form base/default language: '$baseLang'. Languages already present (i18n): ${existing.joinToString(", ")}.\n" +
            "Reply with ONLY this JSON, nothing else:\n" +
            "{\"translationRequest\":true,\"addLanguages\":[\"<code>\",\"<code>\"]}\n" +
            "Rules:\n" +
            "- translationRequest=true when the request asks to translate the WHOLE form into one or more additional languages (e.g. \"translate to English and French\", \"ins Englische und Französische übersetzen\", \"ins Italienische übersetzen\"). It is ALSO true when those languages are ALREADY present (a repeat translation request) — then addLanguages is empty and translationRequest is still true.\n" +
            "- translationRequest=false and addLanguages=[] for everything else (partial / field-level translations, non-translation edits, etc.).\n" +
            "- addLanguages lists ONLY the NEW languages to ADD (those not yet present), in the order the request names them, using Formcycle language codes (de, en, fr, it, nl, de-CH, ...). Never include the base language '$baseLang' or a language already present; leave it empty when every named language is already present."
    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(system)}},""")
      append("""{"role":"user","content":${gson.toJson(prompt)}}""")
      append("]")
    }
    return try {
      val raw = instance.performFormAssist(modelId, messagesJson)
      val cleaned = extractJson(stripThinkTags(raw))
      val parsed = runCatching { JsonParser.parseString(cleaned) }.getOrNull()
      val langs =
          if (parsed != null && parsed.isJsonObject) {
            val arr = parsed.asJsonObject.get("addLanguages")
            if (arr?.isJsonArray == true) {
              arr.asJsonArray
                  .mapNotNull { e ->
                    if (e.isJsonPrimitive && e.asJsonPrimitive.isString) e.asString.trim() else null
                  }
                  .filter { it.isNotBlank() }
                  .distinct()
            } else emptyList()
          } else emptyList()
      val request =
          if (parsed != null && parsed.isJsonObject) {
            parsed.asJsonObject
                .get("translationRequest")
                ?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isBoolean }
                ?.asBoolean == true
          } else false
      logger.info(
          "[AICodBiAssistant] Whole-form translation plan: request={} addLanguages={}",
          request,
          langs)
      Triple(request, langs, TokenUsage(estimateTokens(messagesJson), estimateTokens(raw)))
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] planWholeFormTranslation failed: {}", e.message)
      Triple(false, emptyList(), TokenUsage(estimateTokens(messagesJson), 0))
    }
  }

  /**
   * Copies the [lang] i18n object present on [source] (its "i18n" member) into [target]'s "i18n",
   * creating it when absent and merging per-property. No other field is touched.
   */
  private fun copyLangI18n(target: JsonObject, source: JsonObject, lang: String) {
    val sI18n = source.get("i18n")?.takeIf { it.isJsonObject } ?: return
    val sLang = sI18n.asJsonObject.get(lang)?.takeIf { it.isJsonObject } ?: return
    val tI18n =
        target.get("i18n")?.takeIf { it.isJsonObject }?.asJsonObject
            ?: JsonObject().also { target.add("i18n", it) }
    val tLang =
        tI18n.get(lang)?.takeIf { it.isJsonObject }?.asJsonObject
            ?: JsonObject().also { tI18n.add(lang, it) }
    for ((key, value) in sLang.asJsonObject.entrySet()) {
      tLang.add(key, value.deepCopy())
    }
  }

  /**
   * Recursively overlays the [lang] i18n of [source] object arrays (options / buttons / any nested
   * element-like objects carrying their own "i18n") onto the positional counterparts in [target].
   */
  private fun overlayNestedI18n(target: JsonObject, source: JsonObject, lang: String) {
    for ((key, sVal) in source.entrySet()) {
      if (!sVal.isJsonArray) continue
      val tVal = target.get(key)
      if (tVal == null || !tVal.isJsonArray) continue
      val sArr = sVal.asJsonArray
      val tArr = tVal.asJsonArray
      for (i in 0 until minOf(sArr.size(), tArr.size())) {
        val se = sArr[i]
        val te = tArr[i]
        if (se != null && se.isJsonObject && te != null && te.isJsonObject) {
          copyLangI18n(te.asJsonObject, se.asJsonObject, lang)
          overlayNestedI18n(te.asJsonObject, se.asJsonObject, lang)
        }
      }
    }
  }

  /**
   * Overlays ONE element's [lang] i18n (its properties-level "i18n" AND every nested option/button
   * "i18n") from [sourceEl] onto [targetEl]. Both derive from the same base form, so matching by
   * arrays is positional and safe.
   */
  private fun overlayElementI18n(targetEl: JsonObject, sourceEl: JsonObject, lang: String) {
    val tp = targetEl.get("properties")?.takeIf { it.isJsonObject }?.asJsonObject ?: return
    val sp = sourceEl.get("properties")?.takeIf { it.isJsonObject }?.asJsonObject ?: return
    copyLangI18n(tp, sp, lang)
    overlayNestedI18n(tp, sp, lang)
  }

  /**
   * Merges a per-language form pass [passRoot] (a full form whose NEW content is the i18n for
   * [lang]) into [root] (the accumulated final form), copying ONLY that language's i18n from every
   * matching item plus any form-level i18n. Structural fields of [root] are never replaced.
   */
  private fun overlayLanguageI18n(root: JsonObject, passRoot: JsonObject, lang: String) {
    copyLangI18n(root, passRoot, lang) // form-level i18n (e.g. form title)
    val tItems = root.getAsJsonArray("items") ?: return
    val sItems = passRoot.getAsJsonArray("items") ?: return
    val tById = LinkedHashMap<String, JsonObject>()
    for (el in tItems) {
      if (el?.isJsonObject == true) {
        val o = el.asJsonObject
        val props = o.get("properties")?.takeIf { it.isJsonObject }?.asJsonObject
        val id = props?.get("id")?.takeIf { it.isJsonPrimitive }?.asString
        val name = props?.get("name")?.takeIf { it.isJsonPrimitive }?.asString
        if (!id.isNullOrBlank()) tById[id] = o
        if (!name.isNullOrBlank() && !tById.containsKey(name)) tById[name] = o
      }
    }
    for (el in sItems) {
      if (el?.isJsonObject != true) continue
      val o = el.asJsonObject
      val props = o.get("properties")?.takeIf { it.isJsonObject }?.asJsonObject
      val id = props?.get("id")?.takeIf { it.isJsonPrimitive }?.asString
      val name = props?.get("name")?.takeIf { it.isJsonPrimitive }?.asString
      val target = tById[id.orEmpty()] ?: tById[name.orEmpty()]
      if (target != null) overlayElementI18n(target, o, lang)
    }
  }

  /**
   * Whole-form translation into SEVERAL languages at once, executed ONE LANGUAGE PER AI PASS (so no
   * single response must carry every translation — an oversized combined output truncates and
   * aborts the run, observed live). Every pass reuses [runFormModification] on the ORIGINAL persist
   * but with a prompt restricted to ONE language; the per-language i18n is merged into one final
   * form. Returns the same triple as [runFormModification] (merged form JSON, applicability report,
   * total usage).
   */
  private fun runSequentialWholeFormTranslation(
      prompt: String,
      persistJson: String,
      addLanguages: List<String>,
      modelId: String,
      instance: Standard,
      imageParts: List<String>,
      useCodbi: Boolean,
      useBuergerserviceNaming: Boolean,
      clarificationContext: String?,
      chatContext: String?,
      changeHistoryContext: String?,
      matomoStatsContext: String?
  ): Triple<String, String?, TokenUsage> {
    val langs = addLanguages.filter { it.isNotBlank() }.distinct()
    var tokensIn = 0
    var tokensOut = 0
    var mergedRoot: JsonObject? = null
    var applicabilityReport: String? = null
    for ((index, lang) in langs.withIndex()) {
      val singlePrompt =
          prompt +
              "\n\nEXECUTION NOTE: your request translates the whole form into several languages. The languages are executed ONE AFTER ANOTHER. In THIS step translate the whole form ONLY into language '$lang'. Do NOT translate into any other language — ignore any other language named above (it is handled in its own step). Add the translations as Formcycle per-language i18n for '$lang' exactly as the form-translation rules require; leave the base/default language and every existing language untouched. When the form is translated into '$lang', end your JSON with the usual top-level marker for the languages you actually produced."
      val (json, applic, usage) =
          runFormModification(
              singlePrompt,
              persistJson,
              modelId,
              instance,
              imageParts,
              useCodbi,
              useBuergerserviceNaming,
              clarificationContext,
              chatContext,
              changeHistoryContext,
              matomoStatsContext)
      tokensIn += usage.input
      tokensOut += usage.output
      if (applic != null) applicabilityReport = applic
      val root = runCatching { JsonParser.parseString(json).asJsonObject }.getOrNull()
      if (root == null) {
        logger.warn(
            "[AICodBiAssistant] Sequential whole-form translation pass for '{}' returned non-JSON — aborting.",
            lang)
        return Triple(json, applicabilityReport, TokenUsage(tokensIn, tokensOut))
      }
      if (root.has("error")) {
        return Triple(json, applicabilityReport, TokenUsage(tokensIn, tokensOut))
      }
      logger.info(
          "[AICodBiAssistant] Sequential whole-form translation pass {}/{} for language '{}' completed",
          index + 1,
          langs.size,
          lang)
      if (mergedRoot == null) {
        mergedRoot = root
      } else {
        overlayLanguageI18n(mergedRoot, root, lang)
      }
    }
    val finalJson = mergedRoot?.let { gson.toJson(it) } ?: ""
    logger.info(
        "[AICodBiAssistant] Sequential whole-form translation merged {} language(s); final form {} chars",
        langs.size,
        finalJson.length)
    return Triple(finalJson, applicabilityReport, TokenUsage(tokensIn, tokensOut))
  }

  // endregion Intent Classification

  // region Form Modification

  /**
   * Runs the form-structure modification AI call and returns the merged form JSON string. The
   * [persistJson] is slimmed before sending to the AI, and the result is merged back with the
   * original (to restore stripped fields and add back AI-dropped items).
   */
  private fun runFormModification(
      prompt: String,
      persistJson: String,
      modelId: String,
      instance: Standard,
      imageParts: List<String> = emptyList(),
      useCodbi: Boolean = true,
      useBuergerserviceNaming: Boolean = false,
      clarificationContext: String? = null,
      chatContext: String? = null,
      changeHistoryContext: String? = null,
      matomoStatsContext: String? = null
  ): Triple<String, String?, TokenUsage> {
    // Rough token estimate for this run (input = prompts, output = completions), returned to the
    // frontend so the assistant can show the last inference and the current session total.
    var tokensIn = 0
    var tokensOut = 0
    // Document-parsing rules are only included when the request references an attached document.
    val hasAttachedDocument = imageParts.isNotEmpty()
    val baseSystemPrompt = buildFormSystemPrompt(useCodbi, useBuergerserviceNaming)
    val systemPrompt =
        if (hasAttachedDocument) {
          val em = CodbiEntities.entityManagerFactory?.createEntityManager()
          val docRules =
              try {
                em?.let { PromptLoader.loadDocumentParsingRules(it) }
              } finally {
                em?.close()
              }
          if (!docRules.isNullOrBlank()) {
            "$baseSystemPrompt\n\n## DOCUMENT PARSING RULES (attached document)\n\n$docRules"
          } else baseSystemPrompt
        } else baseSystemPrompt
    // The clarifying questions/answers the user already gave (multi-round clarification) are
    // intentionally NOT injected into the system prompt: putting the raw Q&A block there degraded
    // the model's build quality (it switched to a generic HTML.Text.Injector wrapper and invented
    // EP names). The answers are instead appended to the USER instruction below, so the re-run
    // reads
    // like a normal user turn and builds the complete form exactly like a run without
    // clarification.
    var effectiveSystemPrompt = systemPrompt
    if (!chatContext.isNullOrBlank()) {
      effectiveSystemPrompt +=
          "\n\n## CHAT HISTORY (previous turns in the form-chat popup — treat as authoritative " +
              "context; the user's request may refer to earlier turns, e.g. by option numbers)\n\n$chatContext"
    }
    // When the user's request refers to earlier AI runs (on this form or another), the change log
    // is delivered as raw JSON together with a schema description. The AI interprets the entries
    // itself — prompts can reference history in countless ways (time, username, form title, or
    // combined with fresh instructions), so the backend does not try to decode them in advance.
    if (!changeHistoryContext.isNullOrBlank()) {
      effectiveSystemPrompt +=
          "\n\n## PRIOR CHANGE HISTORY (JSON — interpret it using the schema below)\n\n" +
              "The user's request refers to earlier AI runs. Below is the raw change log of the " +
              "relevant form as a JSON array; each entry describes ONE earlier AI run.\n\n" +
              "CHANGE LOG SCHEMA — what each property means:\n" +
              loadChangeLogSchema() +
              "\n\n" +
              "CHANGE LOG:\n" +
              changeHistoryContext +
              "\n\nIdentify the entries the user is referring to (match by prompt text, timestamp " +
              "\"ts\", username, or the listed form/workflow changes) and APPLY the same changes to " +
              "the CURRENT form, adapting names as needed. Do NOT ask the user which changes were " +
              "requested — the change log is authoritative."
    }
    // Matomo statistics fetched during the chat pass (the AI requested them for an
    // "analyse the form" / optimisation request that also contains change instructions). Injecting
    // them here lets the form AI base its optimisations on the real usage data.
    if (!matomoStatsContext.isNullOrBlank()) {
      effectiveSystemPrompt +=
          "\n\n## MATOMO STATISTICS OF THE CURRENT FORM (use this data for the requested analysis / optimisation)\n\n" +
              matomoStatsContext
    }
    val imageHint =
        if (imageParts.isNotEmpty()) {
          val n = imageParts.size
          val intro =
              if (n == 1) "The attached image shows"
              else "The attached $n images show the $n pages of"
          val multiPageSuffix =
              if (n > 1)
                  " CRITICAL: Do NOT stop after page 1 â€” elements from image 2, 3, ... " +
                      "are just as required as those from image 1."
              else ""
          "\n\nâš  ATTACHED DOCUMENT: $intro the document to replicate. " +
              "Each image is EXACTLY ONE page â€” you MUST process ALL $n image(s) and " +
              "extract every visible element from every page. " +
              "Text fields, text areas, dropdowns, checkboxes, file uploads, labels, " +
              "section headings, and buttons on EVERY page must appear in the output." +
              multiPageSuffix
        } else ""
    val clarificationInstruction =
        if (clarificationContext.isNullOrBlank()) ""
        else
            "\n\nThe user already answered these clarification questions — treat the answers as part of the instruction and build the COMPLETE form accordingly. The answers resolve ONLY the specific questions they belong to; you must STILL create every field and wire EVERY element placeholder (EP) / CodBi functionality described in the system prompt (OpenPLZ EPs → XSelect with data-cb-func=\"html.select.injection\" + the EP in data-cb-Values; other EP output/research fields such as Date.Holidays, Data.CSV, Data.Join, Date.FromString, DOM.Query, JSON.Path, LDAP.Find, Net.URL, Sorted, Unique, F, I, V → data-cb-func=\"JSON.SET\" / \"HTML.Text.Injector\" wired as the field's value; Sys.Log.Console for console logging). NEVER emit an EP/research field as a bare plain text field without its EP wiring." +
                "\n\nCRITICAL — THE WORKFLOW IS BUILT IN A SEPARATE STEP THAT READS THE CLARIFICATION ANSWERS DIRECTLY: your job is ONLY the FORM — you do NOT store clarified workflow values (email, sender, subject, address, ...) anywhere in the form and you do NOT reference them via [%field%] (there is no such field). GENERAL RULE — EVERY NEEDED VALUE: ASK → USE LITERALLY → FORM FIELD ONLY IF REQUESTED. Whenever a node, email, notification, parameter or placeholder needs a value (recipient, sender, subject, address, URL, amount, status, connection, template, ...): (1) ASK for it when the request does not provide it and it cannot be derived — NEVER invent or fabricate a value (never a placeholder address like \"recipient@example.com\"). (2) A value the user provided or clarified is a LITERAL value: write it DIRECTLY into the node/parameter; do NOT wrap it in a form field and do NOT reference it via [%field%]. (3) ONLY when the user explicitly wants the value entered at runtime (e.g. \"Erstelle ein E-Mail-Feld für den Kunden\", \"Erstelle ein Formularfeld\", \"Der Kunde soll seine E-Mail-Adresse selbst angeben\", \"take the recipient from a field you generate\", \"E-Mail-Feld anlegen und dort eintragen\") do you create a form field for THAT ONE value (a visible input, e.g. an XTextField with datatype email) and reference it via its [%fieldName%] — in the node AND in any other reference: an email body, a condition, an element-placeholder (EP) parameter, another node's input, etc. A create-a-field request for one value does NOT turn the other literal values in the same answer into fields (e.g. \"Erstelle ein Feld für die Kundenadresse und der Betreff ist 'ZZZZ'\" → create ONLY the address field; 'ZZZZ' is the email node's literal subject). CLARIFIED EMAIL ADDRESSES ARE NODE RECIPIENTS, NOT FORM FIELDS: an email address the user gave for a notification (e.g. \"Admin@X.de\", \"Bestellabwicklung@X.com\") is the FC_EMAIL \"to\" value — do NOT create a form field for it (no \"E-Mail-Adresse Administrator\"/\"Admin E-Mail\" input) and do NOT put it into a placeholder/value; create an email input field ONLY when the user explicitly asked to create one for that exact address. ANTI-PATTERN (FORBIDDEN unless the user explicitly asked to create the field): creating fields like \"Absender\"/\"From\", \"Betreff\"/\"Subject\", \"Admin E-Mail\"/\"Admin Absender\"/\"Admin Betreff\" to hold a clarified literal value. In a PAYMENT/ORDER form the ONLY email/address field EVER justified is the CLIENT's email input — and only when the user asked for it; the admin recipient/sender/subject (e.g. \"A@X.de\", \"Absender: S@S.S\", \"Fehler in Zahlung\") are BY DEFAULT written literally into the FC_EMAIL node and are NOT turned into fields. NEVER emit a field whose placeholder/value is a literal value you already know, and NEVER reference an invented field name." +
                "\n\nTHE PRINCIPLE — NEVER CREATE A FORM FIELD FOR A LITERAL VALUE UNLESS THE USER'S PROMPT EXPLICITLY ASKS FOR A FIELD FOR THAT VALUE. A literal value the user wrote (an email address, sender, subject, address, URL, amount, status, ...) is used DIRECTLY in the workflow node/parameter — it is NOT a form field, NOT a placeholder, NOT a value in any field. Create a form field ONLY for a value the user explicitly said to create a field for (e.g. \"Erstelle ein Feld dafür\", \"Erstelle ein E-Mail-Feld für den Kunden\", \"Der Kunde gibt seine E-Mail-Adresse selbst an\") — one field per explicitly requested value (several values → several fields). If the user gives a literal email (e.g. \"2. Admin@X.de\", \"Rechnung@X.de\") without asking for a field, create NOTHING for it — no \"Admin E-Mail\"/\"Adminmail\"/\"E-Mail-Adresse Administrator\"/\"tfAdminEmail\" field. Concrete example: \"Erstelle ein Feld im Formular dafür.\" (customer receipt email) + \"2. Admin@X.de\" (admin failure, no field requested) → create ONLY the customer's email field (empty); do NOT create an admin email field. If the user ALSO asks for an admin email field, create it too. The workflow step reads the answers directly and uses the literal values in the nodes; your job is only the form." +
                "\n\nRESOLVE CROSS-ANSWER REFERENCES: an answer that refers to another answer (e.g. \"same address as 1.\", \"gleiche Adresse wie bei Frage 1\", \"wie in Antwort 1\") means USE that referenced answer's value verbatim — copy it, do not ask again and do not leave it empty." +
                "\n\nAnswers:\n$clarificationContext"
    val userContent =
        "Instruction: $prompt$imageHint$clarificationInstruction\n\nCurrent form (IPersistJson):\n${slimPersistJson(persistJson)}" +
            "\n\nREMINDER: your response MUST include a top-level \"_codbiApplicability\" field as described in the system prompt.\n" +
            "REMINDER 2: when the request is a WHOLE-FORM TRANSLATION that adds another language, your JSON MUST ALSO end with the " +
            "top-level \"_workflowMailLanguages\": [\"<baseLanguageCode>\", \"<addedLanguageCode>\", ...] marker (base language first) " +
            "and set \"_codbiApplicability.codbiVerdict\" to \"none\".\n" +
            "If the user asks to REMOVE/DELETE elements, OMIT them from \"items\" AND list their names in a " +
            "top-level \"_removedItems\": [\"elementName\", ...] array so the server removes them completely " +
            "(including any references in container \"elements\" arrays)."

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(effectiveSystemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(userContent, imageParts)}}""")
      append("]")
    }

    logger.info(
        "[AICodBiAssistant] Form data sent to AI (model={}): {}",
        modelId,
        slimPersistJson(persistJson))
    val rawResponse = instance.performFormAssist(modelId, messagesJson)
    tokensIn += estimateTokens(messagesJson)
    tokensOut += estimateTokens(rawResponse)
    var cleaned = extractJson(stripThinkTags(rawResponse))

    // Resolve the maximum detail-rerun count for the current model: a per-specialist override
    // (`AI_FormAssistant_MaxFormReruns_<name>`) wins over the global
    // `AI_FormAssistant_MaxFormReruns`.
    val effectiveMaxFormReruns =
        when {
          modelId.startsWith("ext-specialist:") ->
              specialistMaxFormReruns[modelId.removePrefix("ext-specialist:").lowercase()]
                  ?: maxFormReruns
          modelId.startsWith("specialist:") ->
              specialistMaxFormReruns[modelId.removePrefix("specialist:").lowercase()]
                  ?: maxFormReruns
          else -> maxFormReruns
        }

    fun rerunWithCodbiDetails(
        requested: List<String>,
        widgets: List<String>,
        useCodbi: Boolean = true,
        rerunCount: Int = 0
    ): String {
      // The change history (with its schema) must be carried into EVERY pass — pass-1 may only
      // answer with a need_codbi_details meta-request, and the actual form modification happens in
      // pass-2. Without it the model cannot know which changes to apply.
      val historySection =
          if (changeHistoryContext.isNullOrBlank()) ""
          else
              "\n\n## PRIOR CHANGE HISTORY (JSON — interpret it using the schema below)\n\n" +
                  "CHANGE LOG SCHEMA — what each property means:\n" +
                  loadChangeLogSchema() +
                  "\n\n" +
                  "CHANGE LOG:\n" +
                  changeHistoryContext +
                  "\n\nThis change log IS the answer to the user's request — find the matching " +
                  "entry (by prompt text, timestamp \"ts\", username, or the listed changes) and " +
                  "APPLY its changes to the current form, adapting names as needed. Never say you " +
                  "do not know which changes were requested."
      // The USER CLARIFICATION answers (e.g. "use radio buttons") and the CONTROL TYPES rule must
      // also reach pass-2 — pass-1 may only answer with a details request, while the actual widgets
      // are created here. Without them the model ignores the user's control-type choice.
      // The clarification answers are NOT injected into the pass-2 system prompt either (same
      // reason
      // as pass-1: the raw Q&A block degraded the build). They are carried in the pass-2 USER
      // content below so they read as part of the instruction.
      val clarificationSection = ""
      // The chat history must also reach EVERY rerun pass — pass-1 may only answer with a
      // need_codbi_details meta-request, while the actual changes are applied in pass-2. Without it
      // the model cannot resolve references like "apply options 1, 2, 5, 7" against the numbered
      // list the assistant gave earlier in the chat popup.
      val chatSection =
          if (chatContext.isNullOrBlank()) ""
          else
              "\n\n## CHAT HISTORY (previous turns in the form-chat popup — treat as authoritative " +
                  "context; the user's request may refer to earlier turns, e.g. by option numbers)\n\n" +
                  chatContext
      val controlTypesSection =
          "\n\n" + (loadPromptWithClasspathFallback("codbi.control_types_rules") ?: "")
      val pass1Obj =
          try {
            JsonParser.parseString(cleaned).asJsonObject
          } catch (_: Exception) {
            null
          }
      // Pass-1 may have returned a `need_codbi_details` request instead of the modified form â€”
      // such a request JSON carries no "items". Base pass-2 on the ORIGINAL form so
      // widgets/elements
      // created in pass-2 are merged back into the real form instead of being lost.
      val formBase = if (pass1Obj?.has("items") == true) cleaned else persistJson
      val baseObj =
          try {
            JsonParser.parseString(formBase).asJsonObject
          } catch (_: Exception) {
            null
          }
      val allItems = baseObj?.getAsJsonArray("items") ?: JsonArray()

      val retryMessagesJson: String

      if (requested.isEmpty() && widgets.isEmpty()) {
        // Blind rethink pass: AI previously concluded nothing applies â€” ask it to reconsider.
        // Use the full compact API reference (including parameter names) so the AI can
        // generate correct data-cb-* parameter attributes instead of inventing names.
        val rethinkSystemPrompt =
            loadCodbiRethinkPrompt() +
                historySection +
                clarificationSection +
                chatSection +
                controlTypesSection

        logger.info(
            "[AICodBiAssistant] Blind rethink pass â€” sending {} item(s) with compact CodBi reference (system-only)",
            allItems.size())
        if (allItems.size() == 0) {
          logger.warn(
              "[AICodBiAssistant] Blind rethink pass has 0 items â€” pass-1 items array may be missing or empty")
        }

        retryMessagesJson = buildString {
          append("[")
          append("""{"role":"system","content":${gson.toJson(rethinkSystemPrompt)}},""")
          val formJson = gson.toJson(mapOf("items" to allItems))
          val clarificationLine =
              if (clarificationContext.isNullOrBlank()) ""
              else
                  "\n\nUser's clarification answers (treat as part of the instruction):\n$clarificationContext"
          val userContent =
              "Original user request: $prompt$clarificationLine\n\n" +
                  "Modify the form below according to that request. If the user asked to REMOVE or " +
                  "DELETE fields/elements, honor it: drop those items from the root \"items\" array AND " +
                  "from their parent container's \"elements\" array (clear to [] for \"remove all " +
                  "fields\"). Form data: $formJson"
          append("""{"role":"user","content":${gson.toJson(userContent)}}""")
          append("]")
        }
      } else {
        // Targeted rerun: AI identified candidates but did not apply full details â€” send specific
        // elements with full TSDoc for the requested functionality IDs.
        val candidateClause = requested.joinToString(", ")
        val targetElementIds = extractConsideredElementTargets(cleaned)
        val targetItems =
            if (targetElementIds.isEmpty()) {
              allItems
            } else {
              // Expand target IDs to include:
              // 1. Child elements of targeted containers/fieldsets (e.g. targeting a fieldset for
              //    OpenPLZ.Autocomplete should also send its child text fields)
              // 2. Sibling elements of targeted items (e.g. targeting one time field for Time.Frame
              //    should also send the other time field so the AI can set cross-referencing
              // params)
              val expandedIds = targetElementIds.toMutableSet()
              // Build a map of item name -> parent container name for all items
              val parentOfItem = mutableMapOf<String, String>()
              for (item in allItems) {
                if (!item.isJsonObject) continue
                val containerName =
                    item.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
                        ?: continue
                val elements =
                    item.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements")
                        ?: continue
                for (nameEl in elements) {
                  if (nameEl.isJsonPrimitive) parentOfItem[nameEl.asString] = containerName
                }
              }
              // Build a map of container name -> list of child item names
              val childrenOf = mutableMapOf<String, List<String>>()
              for (item in allItems) {
                if (!item.isJsonObject) continue
                val containerName =
                    item.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
                        ?: continue
                val elements =
                    item.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements")
                        ?: continue
                childrenOf[containerName] =
                    elements.mapNotNull { e -> if (e.isJsonPrimitive) e.asString else null }
              }
              for (item in allItems) {
                if (!item.isJsonObject) continue
                val itemId =
                    item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString ?: continue
                val itemName =
                    item.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
                        ?: continue
                if (itemId in targetElementIds) {
                  // Step 1: Expand children of targeted containers
                  val elements =
                      item.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements")
                          ?: emptyList()
                  for (nameEl in elements) {
                    if (!nameEl.isJsonPrimitive) continue
                    val childName = nameEl.asString
                    val child =
                        allItems.firstOrNull { childItem ->
                          childItem.isJsonObject &&
                              childItem.asJsonObject
                                  .getAsJsonObject("properties")
                                  ?.get("name")
                                  ?.asString == childName
                        }
                    if (child != null) {
                      val childId =
                          child.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
                      if (childId != null) expandedIds.add(childId)
                    }
                  }
                  // Step 2: Expand siblings of targeted items (same parent)
                  val parentName = parentOfItem[itemName]
                  if (parentName != null) {
                    val siblings = childrenOf[parentName] ?: emptyList()
                    for (sibName in siblings) {
                      if (sibName == itemName) continue
                      val sib =
                          allItems.firstOrNull { sibItem ->
                            sibItem.isJsonObject &&
                                sibItem.asJsonObject
                                    .getAsJsonObject("properties")
                                    ?.get("name")
                                    ?.asString == sibName
                          }
                      if (sib != null) {
                        val sibId =
                            sib.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
                        if (sibId != null) expandedIds.add(sibId)
                      }
                    }
                  }
                }
              }
              JsonArray().also { arr ->
                for (item in allItems) {
                  if (!item.isJsonObject) continue
                  val itemId = item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
                  if (itemId != null && itemId in expandedIds) arr.add(item)
                }
              }
            }

        val applySystemPrompt =
            loadCodbiApplyPrompt(requested, widgets, useCodbi, useBuergerserviceNaming) +
                historySection +
                clarificationSection +
                chatSection +
                controlTypesSection

        val clarificationLine2 =
            if (clarificationContext.isNullOrBlank()) ""
            else
                "\n\nUser's clarification answers (treat as part of the instruction):\n$clarificationContext"
        val pass2UserContent =
            "Original user request: $prompt$clarificationLine2\n\n" +
                "Complete current form (IPersistJson):\n${slimPersistJson(formBase)}\n\n" +
                (if (candidateClause.isNotBlank())
                    "Apply these CodBi functionalities: $candidateClause\n"
                else "") +
                "Create/add any requested formcycle widgets using the EXACT JSON structures in the system prompt " +
                "(property names like \"name\", \"id\", \"label\", \"datatype\", \"fullwidth\" â€” never invent properties " +
                "such as \"displayText\" or \"technicalId\"), " +
                "nesting them into the correct container's \"elements\" array (by element name) and listing every " +
                "element as a separate item in the root \"items\" array.\n" +
                "REBUILD any formcycle widgets you created in the previous step so they exactly match the JSON " +
                "templates provided.\n" +
                "Return the COMPLETE modified form JSON with ALL items. Keep every element UNLESS the user " +
                "explicitly asked to remove/delete it. When a removal is requested, honor it fully: OMIT those " +
                "items from the root \"items\" array AND remove their names from their parent container's " +
                "\"elements\" array (e.g. clearing it to [] when the user said \"remove all fields\"). Also list " +
                "every removed element's name in a top-level \"_removedItems\": [\"elementName\", ...] array so " +
                "the server drops it completely (including any remaining references)."

        logger.info(
            "[AICodBiAssistant] Pass-2 CodBi â€” candidates: {}, targetIds: {}, sending {} item(s)",
            candidateClause,
            if (targetElementIds.isEmpty()) "<none from pass-1>"
            else targetElementIds.joinToString(", "),
            targetItems.size())
        if (targetItems.size() == 0) {
          logger.warn(
              "[AICodBiAssistant] Pass-2 has 0 items to send â€” pass-1 items array may be missing or empty")
        }

        logger.info(
            "[AICodBiAssistant] Pass-2 form elements sent to AI (model={}): {}",
            modelId,
            gson.toJson(targetItems))
        retryMessagesJson = buildString {
          append("[")
          append("""{"role":"system","content":${gson.toJson(applySystemPrompt)}},""")
          append("""{"role":"user","content":${gson.toJson(pass2UserContent)}}""")
          append("]")
        }
      }

      val retryRaw = instance.performFormAssist(modelId, retryMessagesJson)
      tokensIn += estimateTokens(retryMessagesJson)
      tokensOut += estimateTokens(retryRaw)
      val pass2Cleaned = extractJson(stripThinkTags(retryRaw))
      logger.info(
          "[AICodBiAssistant] Pass-{} raw result: {}",
          rerunCount + 2,
          compactJsonForLog(pass2Cleaned))
      // The AI may ask for even MORE details in the rerun (a second `need_codbi_details`, e.g. for
      // widget types it only names in pass-2). Loop once more with the new request so the widgets
      // the user asked for are not silently dropped. Bounded by [MAX_FORM_RERUNS] to avoid looping
      // indefinitely when the model keeps requesting details.
      if (rerunCount < effectiveMaxFormReruns) {
        val pass2Details = extractCodbiDetailsRequest(pass2Cleaned)
        if (pass2Details != null) {
          logger.info(
              "[AICodBiAssistant] Pass-{} again requested details (elements={}, widgets={}) — rerunning (pass {})",
              rerunCount + 2,
              pass2Details.elements,
              pass2Details.widgets,
              rerunCount + 3)
          return rerunWithCodbiDetails(
              pass2Details.elements, pass2Details.widgets, useCodbi, rerunCount + 1)
        }
      }
      // If the AI is STILL asking for details after the rerun budget is exhausted, the last
      // response carries no "items" and the form would be left unchanged/empty - while a workflow
      // could still be created from it. Force ONE final pass that forbids a details request and
      // requires the complete form JSON.
      if (extractCodbiDetailsRequest(pass2Cleaned) != null) {
        logger.info(
            "[AICodBiAssistant] Rerun budget exhausted but AI still requests details - forcing final complete-form pass")
        val finalSystemPrompt =
            loadCodbiApplyPrompt(emptyList(), emptyList(), useCodbi, useBuergerserviceNaming) +
                chatSection +
                "\n\n" +
                (loadPromptWithClasspathFallback("codbi.retry_form") ?: "")
        val finalUserContent =
            "Original user request: $prompt\n\n" +
                "Complete current form (IPersistJson):\n${slimPersistJson(formBase)}\n\n" +
                "Return the COMPLETE modified form JSON with ALL items now. " +
                "CRITICAL — PRESERVE EVERY EXISTING ELEMENT: every element that exists in the form " +
                "above must remain in your output, unchanged and in its original container, plus only " +
                "the additions/modifications the user requested. Never omit, drop, or remove an " +
                "existing element or functionality that the user did not explicitly ask to remove — " +
                "an omitted existing element is lost from the published form (data loss = FAIL)."
        val finalMessagesJson =
            "[{\"role\":\"system\",\"content\":${gson.toJson(finalSystemPrompt)}}," +
                "{\"role\":\"user\",\"content\":${gson.toJson(finalUserContent)}}]"
        val finalRaw = instance.performFormAssist(modelId, finalMessagesJson)
        tokensIn += estimateTokens(finalMessagesJson)
        tokensOut += estimateTokens(finalRaw)
        val finalCleaned = extractJson(stripThinkTags(finalRaw))
        logger.info(
            "[AICodBiAssistant] Final forced pass raw result: {}", compactJsonForLog(finalCleaned))
        // Only use the final result if it actually produced a form; otherwise keep the previous
        // spliced result so a bare details request is never substituted for the form.
        if (extractCodbiDetailsRequest(finalCleaned) == null) {
          return splicePass2IntoPass1(formBase, finalCleaned)
        }
        logger.warn(
            "[AICodBiAssistant] Final forced pass still returned a details request - keeping previous result")
      }
      // Splice into the form base (the original form when pass-1 was a details request) so new
      // widgets created in pass-2 are preserved in the returned form.
      return splicePass2IntoPass1(formBase, pass2Cleaned)
    }

    // Normalize _codbiApplicability before any extraction logic: the AI often puts
    // "Matomo.Tracking" in considered/applied instead of "Holistic.Matomo.Tracking"
    // (Rule 10c). Correct this server-side by replacing the ID in the raw JSON so that
    // all downstream extraction functions see the correct value.
    cleaned = normalizeMatomoTrackingInRawJson(cleaned)

    if (!useCodbi) {
      // CodBi disabled: never send any CodBi reference/details in any pass. Only rebuild Formcycle
      // widgets the AI created in pass-1 (their exact JSON templates were never requested), so they
      // are not left in a hallucinated persist structure. Otherwise keep the pass-1 result as-is.
      val createdWidgets = extractNewWidgetClassNames(cleaned, persistJson)
      if (createdWidgets.isNotEmpty()) {
        logger.info(
            "[AICodBiAssistant] CodBi disabled — pass-2 rebuilding Formcycle widgets: {}",
            createdWidgets.joinToString(", "))
        cleaned = rerunWithCodbiDetails(emptyList(), createdWidgets, useCodbi = false)
      }
    } else {
      val requestedDetails = extractCodbiDetailsRequest(cleaned)
      if (requestedDetails != null) {
        logger.info(
            "[AICodBiAssistant] AI requested CodBi details for: {} â€” rerunning with full compact API",
            requestedDetails.elements.ifEmpty { listOf("<unspecified>") }.joinToString(", "))
        if (!requestedDetails.applicabilityReport.isNullOrBlank()) {
          logger.info(
              "[AICodBiAssistant] AI CodBi applicability report (detail request): {}",
              requestedDetails.applicabilityReport)
        }
        cleaned = rerunWithCodbiDetails(requestedDetails.elements, requestedDetails.widgets)
      } else {
        // If the AI created formcycle widgets in pass-1 WITHOUT requesting their details first,
        // their
        // exact JSON templates were never provided and the AI hallucinated the persist structure.
        // Force pass-2 to include those widget templates so the widgets are rebuilt correctly.
        val createdWidgets = extractNewWidgetClassNames(cleaned, persistJson)
        if (createdWidgets.isNotEmpty()) {
          logger.info(
              "[AICodBiAssistant] Pass-1 created new formcycle widget(s) without details request â€” including templates in pass-2: {}",
              createdWidgets.joinToString(", "))
        }
        val appliedCodbi = extractAppliedCodbiIds(cleaned)
        if (appliedCodbi.isNotEmpty()) {
          logger.warn(
              "[AICodBiAssistant] AI applied CodBi functionalities without requesting details first; forcing detail rerun for: {}",
              appliedCodbi.joinToString(", "))
          cleaned = rerunWithCodbiDetails(appliedCodbi, createdWidgets)
        } else {
          val consideredCodbi = extractConsideredCodbiIds(cleaned)
          if (consideredCodbi.isNotEmpty()) {
            logger.info(
                "[AICodBiAssistant] AI identified CodBi candidates but did not escalate; forcing detail rerun for: {}",
                consideredCodbi.joinToString(", "))
            cleaned = rerunWithCodbiDetails(consideredCodbi, createdWidgets)
          } else {
            // AI returned _codbiApplicability but with an empty considered list.
            // This can happen non-deterministically even when candidates exist â€” the AI evaluates
            // the list but wrongly decides nothing applies. Always run a blind pass-2 so CodBi
            // is never silently skipped.
            val hasApplicabilityField =
                try {
                  @Suppress("UNCHECKED_CAST")
                  (gson.fromJson(cleaned, Map::class.java) as? Map<String, Any>)?.containsKey(
                      "_codbiApplicability") == true
                } catch (_: Exception) {
                  false
                }
            val reason =
                if (!hasApplicabilityField) "omitted _codbiApplicability entirely"
                else "evaluated CodBi list but found no candidates â€” forcing blind evaluation"
            // A whole-form translation declares the top-level "_workflowMailLanguages" marker
            // (model-declared, language-agnostic — like "_codbiApplicability"). A translation only
            // ADDS per-language text fields and never a CodBi element, so the blind CodBi
            // re-evaluation (which re-sends the whole large form and can exceed the model's output
            // limit) must never run for it — even when the model omitted "_codbiApplicability"
            // entirely (see the "AI omitted _codbiApplicability entirely" case below).
            val declaresWholeFormTranslation =
                rawResponse.contains("_workflowMailLanguages") ||
                    cleaned.contains("_workflowMailLanguages")
            if (declaresWholeFormTranslation ||
                jsonDeclaresNothingApplies(cleaned) ||
                rawClaimsNothingApplies(rawResponse)) {
              if (createdWidgets.isNotEmpty()) {
                // The AI declared no CodBi element applies, but it created new Formcycle widgets
                // in pass-1 whose exact JSON templates were never provided. Rebuild them via
                // pass-2 so they are not left in a hallucinated persist structure.
                logger.info(
                    "[AICodBiAssistant] AI declared nothing applies but created Formcycle widget(s) {} - rebuilding via pass-2 with templates",
                    createdWidgets.joinToString(", "))
                cleaned = rerunWithCodbiDetails(emptyList(), createdWidgets)
              } else {
                logger.info(
                    "[AICodBiAssistant] AI declared/stated no CodBi element applies â€” skipping blind reconsideration ({})",
                    reason)
              }
            } else {
              logger.info(
                  "[AICodBiAssistant] AI {} â€” triggering blind CodBi evaluation pass", reason)
              cleaned = rerunWithCodbiDetails(emptyList(), createdWidgets)
            }
          }
        }
      }
    }

    logger.debug("[AICodBiAssistant] Form AI response: {}", compactJsonForLog(cleaned))

    val (sanitizedCleaned, applicabilityReport) = extractAndStripCodbiApplicability(cleaned)
    if (!applicabilityReport.isNullOrBlank()) {
      logger.info("[AICodBiAssistant] AI CodBi applicability report: {}", applicabilityReport)
    } else {
      logger.warn("[AICodBiAssistant] AI response contains no CodBi applicability report")
    }

    return try {
      val parsed =
          try {
            JsonParser.parseString(sanitizedCleaned)
          } catch (first: Exception) {
            // The model occasionally emits malformed JSON (a stray `\"` around a value such as the
            // euro unit, or a trailing comma). Repair the common LLM slips and retry so a single
            // bad
            // token does not lose the whole build.
            val repaired = repairAiJson(sanitizedCleaned)
            if (repaired != sanitizedCleaned) {
              logger.warn(
                  "[AICodBiAssistant] AI returned invalid JSON; repaired malformed tokens ({} -> {} chars)",
                  sanitizedCleaned.length,
                  repaired.length)
            }
            try {
              JsonParser.parseString(repaired)
            } catch (_: Exception) {
              throw first
            }
          }
      warnUnknownClassNames(parsed)
      // Sanitize the AI output before it reaches the designer: fold invented standalone buttons
      // into an XButtonList and drop any item with an unknown className or missing id (such items
      // would otherwise break the designer's persist patch and never render).
      if (parsed.isJsonObject) sanitizeAiFormItems(parsed.asJsonObject)
      val sanitizedFormJson = gson.toJson(parsed)
      val restored = restoreStrippedFields(sanitizedFormJson, persistJson, prompt)
      // Apply any explicit removals the AI requested (top-level "_removedItems" names) — the AI
      // omits
      // removed elements AND lists them here so the server drops them completely.
      val finalForm =
          runCatching {
                val obj = JsonParser.parseString(restored).asJsonObject
                applyRemovedItems(obj)
                // Belt-and-suspenders: invisible email-config clone fields must not remain in the
                // form even if the model created them despite the filtered clarification context.
                dropInvisibleEmailConfigFields(obj)
                gson.toJson(obj)
              }
              .getOrDefault(restored)
      Triple(finalForm, applicabilityReport, TokenUsage(tokensIn, tokensOut))
    } catch (_: Exception) {
      logger.warn(
          "[AICodBiAssistant] Form AI returned unparseable response ({} chars): {}",
          sanitizedCleaned.length,
          compactJsonForLog(sanitizedCleaned))
      Triple(
          """{"error":"AI returned invalid JSON","raw":${gson.toJson(sanitizedCleaned)}}""",
          null,
          TokenUsage(tokensIn, tokensOut))
    }
  }

  /** Rough token estimate for a text blob (chars / 4). Used for the assistant's token counter. */
  private fun estimateTokens(text: String): Int =
      if (text.isBlank()) 0 else (text.length / 4).coerceAtLeast(1)

  private fun buildFormSystemPrompt(
      useCodbi: Boolean = true,
      useBuergerserviceNaming: Boolean = false
  ): String = buildCodbiFormSystemPrompt(useCodbi, useBuergerserviceNaming)

  private data class CodbiDetailsSignal(
      val elements: List<String>,
      val widgets: List<String>,
      val applicabilityReport: String?
  )

  private fun extractCodbiDetailsRequest(cleanedJson: String): CodbiDetailsSignal? {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any>
      if ((obj?.get("status") as? String) != "need_codbi_details") {
        return null
      }
      val arr = obj["elements"] as? List<*> ?: emptyList<Any>()
      val elements = arr.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
      val widgetsArr = obj["widgets"] as? List<*> ?: emptyList<Any>()
      val widgets = widgetsArr.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
      val report = obj["codbiApplicability"]?.let { gson.toJson(it) }
      CodbiDetailsSignal(elements = elements, widgets = widgets, applicabilityReport = report)
    } catch (_: Exception) {
      null
    }
  }

  private data class WorkflowDetailsSignal(val nodes: List<String>, val triggers: List<String>)

  /**
   * Parses a workflow-node details request from the AI's cleaned JSON response. The AI returns this
   * signal in the FIRST pass (which only contains the condensed workflow-nodes reference) when it
   * needs the exact triggerParams/nodeParams of specific triggers/nodes it intends to use:
   * `{"status":"need_workflow_node_details","nodes":["FC_EMAIL",...],"triggers":["FC_FORM_SUBMIT_BUTTON",...]}`.
   */
  private fun extractWorkflowDetailsRequest(cleanedJson: String): WorkflowDetailsSignal? {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any>
      if (obj == null) return null
      // Strict form: the prompt asks for the full {"status":"need_workflow_node_details",...}.
      if ((obj["status"] as? String) == "need_workflow_node_details") {
        val nodesArr = obj["nodes"] as? List<*> ?: emptyList<Any>()
        val nodes = nodesArr.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
        val triggersArr = obj["triggers"] as? List<*> ?: emptyList<Any>()
        val triggers = triggersArr.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
        return WorkflowDetailsSignal(nodes = nodes, triggers = triggers)
      }
      // Tolerant form — many models omit the "status" field and return only
      // {"nodes":[...],"triggers":[...]}. Treat an object as a details request when it is clearly a
      // list of node/trigger names and NOT a workflow task (a task object carries keys like
      // nodeType/triggerType/taskName/nodeParams/...).
      val looksLikeTask =
          listOf(
                  "nodeType",
                  "triggerType",
                  "taskName",
                  "taskDescription",
                  "nodeParams",
                  "triggerParams",
                  "operation",
                  "targetNodeId",
                  "chainedNodes",
                  "endpointState",
                  "endpointType",
                  "stateProperties",
                  "_childNodes",
                  "_handlerChildNodes",
                  "_cases")
              .any { obj.containsKey(it) }
      if (looksLikeTask) return null
      val nodesArr = obj["nodes"] as? List<*>
      val triggersArr = obj["triggers"] as? List<*>
      val nodes =
          nodesArr?.mapNotNull { (it as? String)?.trim() }?.filter { it.isNotEmpty() }
              ?: emptyList()
      val triggers =
          triggersArr?.mapNotNull { (it as? String)?.trim() }?.filter { it.isNotEmpty() }
              ?: emptyList()
      if (nodes.isEmpty() && triggers.isEmpty()) return null
      WorkflowDetailsSignal(nodes = nodes, triggers = triggers)
    } catch (_: Exception) {
      null
    }
  }

  /**
   * True when the workflow AI's cleaned JSON is a FORM response rather than a workflow task — i.e.
   * it echoes/describes form elements (a top-level "items" array) instead of emitting the workflow
   * automation JSON. The workflow output contract forbids an "items" array, so its presence means
   * the model got confused (e.g. after the clarification round it returns the form it just built)
   * and the run should be retried once with the strict workflow instruction.
   */
  private fun isFormShapedWorkflowResponse(cleanedJson: String): Boolean {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return false
      if (obj["items"] !is List<*>) return false
      // A workflow task may legitimately carry a "workflow"/"tasks" wrapper — those are NOT form
      // responses even if they also contain an items key.
      if (obj.containsKey("workflow") || obj.containsKey("tasks")) return false
      true
    } catch (_: Exception) {
      false
    }
  }

  /**
   * True when the workflow AI returned an empty JSON array `[]` — a degenerate non-answer that
   * would parse to zero task specs and abort the run; it should be retried once with the strict
   * workflow instruction instead.
   */
  private fun isWorkflowEmptyArray(cleanedJson: String): Boolean {
    return try {
      val el = JsonParser.parseString(cleanedJson)
      el.isJsonArray && el.asJsonArray.size() == 0
    } catch (_: Exception) {
      false
    }
  }

  /**
   * Returns true when the raw assistant response contains an explicit natural-language statement
   * that no CodBi element is applicable. The JSON-extraction normally discards such prose;
   * capturing it lets us avoid forcing a blind CodBi reconsideration pass when the model already
   * decided there is nothing to apply.
   */
  private fun rawClaimsNothingApplies(raw: String): Boolean {
    val text = raw.lowercase()
    val patterns =
        listOf(
            "no applicable",
            "nothing applies",
            "nothing to apply",
            "none apply",
            "no codbi element",
            "no codbi elements",
            "no functionality applies",
            "no element applies",
            "kein codbi element",
            "keine codbi elemente",
            "kein element anwendbar",
            "keine elemente anwendbar",
            "keine funktionalitÃ¤t anwendbar",
            "keine funktionalitaet anwendbar",
            "nichts anwendbar")
    return patterns.any { text.contains(it) }
  }

  /**
   * Minifies a JSON string to a single line for compact log output, so a pretty-printed AI
   * form/workflow response does not waste dozens of log lines. When the input cannot be parsed as
   * JSON (e.g. prose or a partially-repaired fragment) its whitespace is collapsed instead, so
   * logging never fails and never spans many lines.
   */
  private fun compactJsonForLog(json: String): String {
    if (json.isBlank()) return json
    return try {
      gson.toJson(JsonParser.parseString(json))
    } catch (_: Exception) {
      json.replace(Regex("\\s+"), " ").trim()
    }
  }

  /**
   * Returns true when the AI explicitly declared in its `_codbiApplicability` report that no CodBi
   * element is applicable (`codbiVerdict = "none"`). This is the structured, language-independent
   * signal; [rawClaimsNothingApplies] remains as a fallback for prose-only verdicts.
   */
  private fun jsonDeclaresNothingApplies(cleanedJson: String): Boolean {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return false
      @Suppress("UNCHECKED_CAST")
      val report =
          (obj["_codbiApplicability"] as? Map<*, *>)
              ?: (obj["codbiApplicability"] as? Map<*, *>)
              ?: return false
      (report["codbiVerdict"] as? String)?.equals("none", ignoreCase = true) == true
    } catch (_: Exception) {
      false
    }
  }

  /**
   * Normalizes "Matomo.Tracking" â†’ "Holistic.Matomo.Tracking" in the raw JSON string's
   * _codbiApplicability field. Called before any extraction logic so that downstream functions
   * (extractConsideredCodbiIds, extractAppliedCodbiIds, etc.) see the corrected value. The AI often
   * ignores Rule 10c and outputs "Matomo.Tracking" instead of "Holistic.Matomo.Tracking"; this
   * server-side correction ensures correct behavior.
   *
   * Only normalizes when Matomo.Tracking is NOT in the "applied" array (meaning the AI could not
   * apply it due to missing SiteID/URL parameters). If the AI successfully placed Matomo.Tracking
   * in "applied" (with proper data-cb-SiteID/data-cb-URL on form elements), it is left untouched.
   */
  private fun normalizeMatomoTrackingInRawJson(json: String): String {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(json, MutableMap::class.java) as? MutableMap<String, Any> ?: return json
      for (key in listOf("_codbiApplicability", "codbiApplicability")) {
        val report = obj[key] ?: continue
        normalizeMatomoTrackingInReport(report)
      }
      gson.toJson(obj)
    } catch (_: Exception) {
      json
    }
  }

  /**
   * If the AI placed "Matomo.Tracking" in "considered" but NOT in "applied" (meaning it identified
   * tracking as relevant but couldn't apply it due to missing SiteID/URL parameters), correct it to
   * "Holistic.Matomo.Tracking". If "Matomo.Tracking" IS in "applied", the AI successfully applied
   * it with parameters â€” leave it untouched.
   */
  @Suppress("UNCHECKED_CAST")
  private fun normalizeMatomoTrackingInReport(reportValue: Any) {
    val report = reportValue as? MutableMap<String, Any> ?: return
    val applied = report["applied"] as? MutableList<*> ?: return

    // If Matomo.Tracking is already in "applied", the AI applied it successfully â€” don't touch
    val hasMatomoInApplied =
        applied.any { entry -> (entry as? Map<*, *>)?.get("id") == "Matomo.Tracking" }
    if (hasMatomoInApplied) return

    // Matomo.Tracking was NOT applied â€” it's only in considered/skipped due to missing params.
    // Replace in "applied" (if present as object) and "considered".
    for (i in applied.indices) {
      val entry = applied[i] as? MutableMap<String, Any> ?: continue
      if (entry["id"] == "Matomo.Tracking" && entry["id"] is String) {
        entry["id"] = "Holistic.Matomo.Tracking"
      }
    }
    val considered = report["considered"] as? MutableList<*> ?: return
    for (i in considered.indices) {
      val entry = considered[i] as? MutableMap<String, Any> ?: continue
      if (entry["id"] == "Matomo.Tracking" && entry["id"] is String) {
        entry["id"] = "Holistic.Matomo.Tracking"
      }
    }
  }

  private fun extractAndStripCodbiApplicability(cleanedJson: String): Pair<String, String?> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, MutableMap::class.java) as? MutableMap<String, Any>
              ?: return cleanedJson to null
      var report: String? = null
      for (key in listOf("_codbiApplicability", "codbiApplicability")) {
        if (obj.containsKey(key)) {
          normalizeMatomoTrackingInReport(obj[key]!!)
          report = gson.toJson(obj[key])
          obj.remove(key)
          break
        }
      }
      gson.toJson(obj) to report
    } catch (_: Exception) {
      cleanedJson to null
    }
  }

  private fun extractConsideredCodbiIds(cleanedJson: String): List<String> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return emptyList()
      val report =
          (obj["_codbiApplicability"] as? Map<*, *>)
              ?: (obj["codbiApplicability"] as? Map<*, *>)
              ?: return emptyList()
      val considered = report["considered"] as? List<*> ?: return emptyList()
      considered.mapNotNull { entry ->
        when (entry) {
          is String -> entry.trim().takeIf { it.isNotEmpty() }
          is Map<*, *> -> (entry["id"] as? String)?.trim()?.takeIf { it.isNotEmpty() }
          else -> null
        }
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun extractConsideredElementTargets(cleanedJson: String): Set<String> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return emptySet()
      val report =
          (obj["_codbiApplicability"] as? Map<*, *>)
              ?: (obj["codbiApplicability"] as? Map<*, *>)
              ?: return emptySet()
      val considered = report["considered"] as? List<*> ?: return emptySet()
      considered
          .flatMap { entry ->
            when (entry) {
              is Map<*, *> ->
                  (entry["targets"] as? List<*>)?.mapNotNull {
                    (it as? String)?.trim()?.takeIf { s -> s.isNotEmpty() }
                  } ?: emptyList()
              else -> emptyList()
            }
          }
          .toSet()
    } catch (_: Exception) {
      emptySet()
    }
  }

  private fun splicePass2IntoPass1(pass1Json: String, pass2Json: String): String {
    return try {
      val pass1Obj = JsonParser.parseString(pass1Json).asJsonObject
      val pass2Obj = JsonParser.parseString(pass2Json).asJsonObject

      val modifiedById = mutableMapOf<String, JsonObject>()
      val modifiedByName = mutableMapOf<String, JsonObject>()
      pass2Obj.getAsJsonArray("items")?.forEach { item ->
        if (!item.isJsonObject) return@forEach
        val props = item.asJsonObject.getAsJsonObject("properties") ?: return@forEach
        val id = props.get("id")?.asString
        val name = props.get("name")?.asString
        if (id != null) {
          modifiedById[id] = item.asJsonObject
        } else if (name != null) {
          modifiedByName[name] = item.asJsonObject
        }
      }

      // A pass-2 that returns a single bare element (e.g. a newly created XContainer/XTextField)
      // instead of a full form: append it to the form items and reference it from the first page
      // so the created widget is preserved instead of being silently dropped.
      val pass2Items = pass2Obj.getAsJsonArray("items")
      if (pass2Items == null && pass2Obj.has("className")) {
        val items =
            pass1Obj.getAsJsonArray("items") ?: JsonArray().also { pass1Obj.add("items", it) }
        val newName = pass2Obj.getAsJsonObject("properties")?.get("name")?.asString
        items.add(pass2Obj)
        if (newName != null) {
          val firstPage =
              items
                  .firstOrNull { el ->
                    el.isJsonObject && el.asJsonObject.get("className")?.asString == "XPage"
                  }
                  ?.asJsonObject
          firstPage?.getAsJsonObject("properties")?.getAsJsonArray("elements")?.add(newName)
        }
      }

      val pass1Items = pass1Obj.getAsJsonArray("items")
      if (pass1Items != null && (modifiedById.isNotEmpty() || modifiedByName.isNotEmpty())) {
        val matchedIds = mutableSetOf<String>()
        val matchedNames = mutableSetOf<String>()
        val newItems = JsonArray()
        for (item in pass1Items) {
          if (item.isJsonObject) {
            val props = item.asJsonObject.getAsJsonObject("properties")
            val id = props?.get("id")?.asString
            val name = props?.get("name")?.asString
            val replacement =
                when {
                  id != null && id in modifiedById -> {
                    matchedIds.add(id)
                    modifiedById[id]
                  }
                  name != null && name in modifiedByName -> {
                    matchedNames.add(name)
                    modifiedByName[name]
                  }
                  else -> null
                }
            newItems.add(replacement ?: item)
          } else {
            newItems.add(item)
          }
        }
        // Append any NEW items from pass-2 that were not matched to any pass-1 item
        for ((id, item) in modifiedById) {
          if (id !in matchedIds) newItems.add(item)
        }
        for ((name, item) in modifiedByName) {
          if (name !in matchedNames) newItems.add(item)
        }
        pass1Obj.add("items", newItems)
      }

      // Honor element REMOVALS from pass-2: pass-2's container "elements" arrays are
      // authoritative. When pass-2 removed an element from a container (e.g. the user asked to
      // "remove all fields" and the page's "elements" became []), drop the now-orphaned items
      // from the merged result so removed fields are not silently re-added. Only applies when
      // pass-2 actually returned at least one container with an "elements" array (i.e. it made a
      // definitive statement about the form structure).
      val pass2ContainersWithElements = mutableSetOf<String>()
      pass2Obj.getAsJsonArray("items")?.forEach { item ->
        if (!item.isJsonObject) return@forEach
        val obj = item.asJsonObject
        val props = obj.getAsJsonObject("properties") ?: return@forEach
        val containerName = props.get("name")?.asString ?: return@forEach
        val elements = props.getAsJsonArray("elements") ?: return@forEach
        pass2ContainersWithElements.add(containerName)
      }
      if (pass2ContainersWithElements.isNotEmpty()) {
        val finalItems = pass1Obj.getAsJsonArray("items") ?: JsonArray()
        // Names that were children of a container in the ORIGINAL pass-1 form (candidates for
        // removal). Computed from the untouched pass-1 JSON, NOT the merged result — the merged
        // containers may already have had their "elements" emptied by pass-2, which would wrongly
        // make every field look like a "standalone" item that must be kept.
        val pass1ChildNames = mutableSetOf<String>()
        try {
          JsonParser.parseString(pass1Json).asJsonObject.getAsJsonArray("items")?.forEach { item ->
            if (item.isJsonObject) {
              item.asJsonObject
                  .getAsJsonObject("properties")
                  ?.getAsJsonArray("elements")
                  ?.forEach { ref -> if (ref.isJsonPrimitive) pass1ChildNames.add(ref.asString) }
            }
          }
        } catch (_: Exception) {}
        // Names still referenced by ANY container in the merged result.
        val referenced = mutableSetOf<String>()
        finalItems.forEach { item ->
          if (item.isJsonObject) {
            item.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements")?.forEach {
                ref ->
              if (ref.isJsonPrimitive) referenced.add(ref.asString)
            }
          }
        }
        // Items explicitly present in pass-2 as standalone items are always kept.
        val pass2StandaloneNames = mutableSetOf<String>()
        pass2Obj.getAsJsonArray("items")?.forEach { item ->
          if (item.isJsonObject) {
            item.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString?.let {
              pass2StandaloneNames.add(it)
            }
          }
        }
        // Keep containers, and items that are still referenced OR were never children OR are
        // standalone in pass-2. Drop only items that pass-1 listed as children but pass-2
        // removed (orphaned fields), so header/footer/standalone items are preserved.
        val filtered = JsonArray()
        finalItems.forEach { item ->
          if (item.isJsonObject) {
            val props = item.asJsonObject.getAsJsonObject("properties")
            val name = props?.get("name")?.asString
            val isContainer = props?.has("elements") == true
            val keep =
                isContainer ||
                    name == null ||
                    name !in pass1ChildNames ||
                    name in referenced ||
                    name in pass2StandaloneNames
            if (keep) filtered.add(item)
          } else {
            filtered.add(item)
          }
        }
        pass1Obj.add("items", filtered)
      }

      if (pass2Obj.has("_codbiApplicability")) {
        pass1Obj.add("_codbiApplicability", pass2Obj.get("_codbiApplicability"))
      }
      // Carry pass-2's explicit removal list so the final form drops those items — without it the
      // splice would re-add any pass-1 item that pass-2 omitted.
      if (pass2Obj.has("_removedItems")) {
        pass1Obj.add("_removedItems", pass2Obj.get("_removedItems"))
      }

      // Preserve global variables the AI set in pass-2 (e.g. standard-configuration globals such
      // as USGrade) by merging the pass-2 `variables` array into the pass-1 base by name.
      mergeFormVariables(pass1Obj, pass2Obj)

      gson.toJson(pass1Obj)
    } catch (_: Exception) {
      pass2Json // fallback: return pass-2 as-is
    }
  }

  /**
   * Deterministic safety net for the OpenPLZ.AC.SET standard: ensures the matching
   * `CodBi_OpenPLZ_AC_SET_*` CSS class is present on any XTextField that represents an address part
   * (street, building number, postal code, locality). The AI is instructed to apply these classes
   * but sometimes omits them (or pass-2 is skipped), so this guarantees they reach the designer.
   * Existing classes (e.g. "Goon") are preserved - nothing is ever removed or overridden. The
   * postal code field additionally gets the `plzDE` datatype (when none is set) so the
   * Holistic.Cleave.PLZ standard stays active.
   *
   * In addition, when a complete address group (a postal-code field AND a locality field tagged
   * with the OpenPLZ classes inside the same container) has no street field and no house-number
   * field (and no combined address field), missing `tfStrasse` + `tfHausnummer` fields are created
   * with the matching OpenPLZ classes — closing the gap where a prompt asks for
   * "PLZ/Ort/Straße/Hausnummer" German autocomplete but the generated fieldset only contains PLZ
   * and Ort.
   */
  private fun applyOpenPlzAddressClasses(resultItems: JsonArray, baseObj: JsonObject?) {
    // Pass 1 — apply OpenPLZ.AC.SET classes to existing address-part fields.
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      if (item.get("className")?.asString != "XTextField") continue
      val props = item.getAsJsonObject("properties") ?: continue
      val name = props.get("name")?.asString ?: continue
      // Split camelCase names into words (e.g. "tfPostalCode" -> [tf, postal, code]) and match the
      // address-part tokens so unrelated names (e.g. "tfReport") never match by accident.
      val words = name.split(Regex("(?=[A-Z])|[_\\s-]")).map { it.lowercase() }
      val cls =
          when {
            words.any { it in setOf("street", "strasse", "straße") } ->
                "CodBi_OpenPLZ_AC_SET_Street"
            words.any { it in setOf("building", "buildingnumber", "hausnummer", "hausnr") } ->
                "CodBi_OpenPLZ_AC_SET_BuildingNumber"
            words.any {
              it in setOf("postal", "postalcode", "postleitzahl", "plz", "zip", "zipcode")
            } -> "CodBi_OpenPLZ_AC_SET_PLZ"
            words.any { it in setOf("locality", "city", "ort", "wohnort") } ->
                "CodBi_OpenPLZ_AC_SET_Locality"
            else -> null
          }
      if (cls == null) continue
      val cssClasses =
          if (props.has("cssclasses") && props.get("cssclasses").isJsonArray)
              props.getAsJsonArray("cssclasses")
          else JsonArray().also { props.add("cssclasses", it) }
      if (cssClasses.none { it.isJsonPrimitive && it.asString == cls }) {
        cssClasses.add(cls)
        logger.info(
            "[AICodBiAssistant] Applied OpenPLZ.AC.SET CSS class '{}' to address field '{}'",
            cls,
            name)
      }
      if (cls == "CodBi_OpenPLZ_AC_SET_PLZ" && props.get("datatype")?.asString.isNullOrBlank()) {
        props.addProperty("datatype", "plzDE")
        logger.info("[AICodBiAssistant] Set datatype 'plzDE' on postal code field '{}'", name)
      }
    }
    // Pass 2 — create missing street / house-number fields for complete address groups.
    val baseTextProps = baseObj?.getAsJsonObject("XTextField")?.getAsJsonObject("properties")
    if (baseTextProps == null) return
    val childrenByParent = mutableMapOf<String, MutableSet<String>>()
    val openplzByParent = mutableMapOf<String, MutableSet<String>>()
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val parentId = props.get("parentid")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      val name = props.get("name")?.asString ?: continue
      childrenByParent.getOrPut(parentId) { mutableSetOf() }.add(name)
      props
          .get("cssclasses")
          ?.takeIf { it.isJsonArray }
          ?.asJsonArray
          ?.forEach { c ->
            if (c.isJsonPrimitive && c.asString.startsWith("CodBi_OpenPLZ_AC_SET_")) {
              openplzByParent.getOrPut(parentId) { mutableSetOf() }.add(c.asString)
            }
          }
    }
    for ((parentId, classes) in openplzByParent) {
      val hasPlz = classes.contains("CodBi_OpenPLZ_AC_SET_PLZ")
      val hasLocality = classes.contains("CodBi_OpenPLZ_AC_SET_Locality")
      if (!hasPlz || !hasLocality) continue
      val children = childrenByParent[parentId] ?: continue
      val hasStreet = children.any { it.contains(Regex("(?i)street|strasse|straße")) }
      val hasBuilding =
          children.any { it.contains(Regex("(?i)hausnummer|hausnr|buildingnumber|building")) }
      val hasAddress = children.any { it.contains(Regex("(?i)adresse|address")) }
      if (hasStreet && hasBuilding) continue
      if (hasAddress) continue
      val containerEl =
          resultItems.firstOrNull {
            it.isJsonObject &&
                it.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString == parentId
          } ?: continue
      val containerProps = containerEl.asJsonObject.getAsJsonObject("properties") ?: continue
      var elements = containerProps.getAsJsonArray("elements")
      if (elements == null) {
        val newArr = JsonArray()
        containerProps.add("elements", newArr)
        elements = newArr
      }
      if (!hasStreet) {
        createAddressField(
            resultItems,
            elements,
            baseTextProps,
            parentId,
            "tfStrasse",
            "Straße",
            "CodBi_OpenPLZ_AC_SET_Street")
      }
      if (!hasBuilding) {
        createAddressField(
            resultItems,
            elements,
            baseTextProps,
            parentId,
            "tfHausnummer",
            "Hausnummer",
            "CodBi_OpenPLZ_AC_SET_BuildingNumber")
      }
    }
  }

  /**
   * Creates a new XTextField item reusing the XTextField base template and appends it to
   * [elements]. Returns the created item, or `null` when the name is already referenced.
   */
  private fun createAddressField(
      resultItems: JsonArray,
      elements: JsonArray,
      baseTextProps: JsonObject,
      parentId: String,
      name: String,
      label: String,
      cls: String,
  ): JsonObject? {
    if (elements.any { it.isJsonPrimitive && it.asString == name }) return null
    val props = JsonObject()
    for (entry in baseTextProps.entrySet()) props.add(entry.key, entry.value.deepCopy())
    props.addProperty("name", name)
    props.addProperty("id", "xi-${name.lowercase()}")
    props.addProperty("label", label)
    props.addProperty("parentid", parentId)
    val cssClasses = JsonArray()
    cssClasses.add(cls)
    props.add("cssclasses", cssClasses)
    val item = JsonObject()
    item.addProperty("className", "XTextField")
    item.add("properties", props)
    resultItems.add(item)
    elements.add(name)
    logger.info(
        "[AICodBiAssistant] Created missing address field '{}' ({} class) in container '{}'",
        name,
        cls,
        parentId)
    return item
  }

  private fun extractAppliedCodbiIds(cleanedJson: String): List<String> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return emptyList()
      val report =
          (obj["_codbiApplicability"] as? Map<*, *>)
              ?: (obj["codbiApplicability"] as? Map<*, *>)
              ?: return emptyList()
      val applied = report["applied"] as? List<*> ?: return emptyList()
      applied.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
    } catch (_: Exception) {
      emptyList()
    }
  }

  /**
   * Detects formcycle widget classNames the AI introduced in [formJson] (pass-1 output) that were
   * NOT part of the [originalJson] form. Such widgets were created without their exact JSON
   * template (the AI never requested widget details), so pass-2 must include their templates to
   * stop the AI from hallucinating the Formcycle persist property names.
   */
  private fun extractNewWidgetClassNames(formJson: String, originalJson: String): List<String> {
    val originalNames = mutableSetOf<String>()
    try {
      JsonParser.parseString(originalJson).asJsonObject.getAsJsonArray("items")?.forEach { el ->
        if (el.isJsonObject) {
          el.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString?.let {
            originalNames.add(it)
          }
        }
      }
    } catch (_: Exception) {}
    val classNames = linkedSetOf<String>()
    try {
      JsonParser.parseString(formJson).asJsonObject.getAsJsonArray("items")?.forEach { el ->
        if (!el.isJsonObject) return@forEach
        val obj = el.asJsonObject
        val name = obj.getAsJsonObject("properties")?.get("name")?.asString
        if (name == null || name in originalNames) return@forEach
        val className = obj.get("className")?.asString
        if (className != null && className.startsWith("X")) classNames.add(className)
      }
    } catch (_: Exception) {}
    return classNames.toList()
  }

  private val KNOWN_CLASS_NAMES =
      setOf(
          "XAppointment",
          "XButtonList",
          "XBsLogin",
          "XCaptcha",
          "XReCaptcha",
          "XCheckbox",
          "XContainer",
          "XContainerInvisible",
          "XDatalistAdvanced",
          "XDefault",
          "XFieldSet",
          "XFooter",
          "XFormula",
          "XHtmlWidget",
          "XHeader",
          "XRating",
          "XImage",
          "XMap",
          "XNavigationBar",
          "XLanguageSwich",
          "XLine",
          "XPage",
          "XSelect",
          "XSignature",
          "XSpacer",
          "XSpan",
          "XTextArea",
          "XTextField",
          "XTextfieldAdvanced",
          "XUpload",
      )

  private val STRIPPED_FIELDS =
      setOf(
          "css",
          "script",
          "image",
          "images",
          "pagePreview",
          "rendered",
          "formI18n",
          "metadata",
          "base")

  private val STRIPPED_ITEM_PROPS =
      setOf(
          "script",
          "css",
          "formI18n",
          "backgroundcolor",
          "pdfImporterId",
          // "formerProps" is the designer's internal "previous properties" snapshot (used for its
          // change tracking/undo) — it is not form structure. It is large (it repeats almost every
          // property), the AI does not need it, and models tend to echo it verbatim, roughly
          // doubling every form payload (a real cause of truncated/invalid output on large forms).
          // It is stripped from the slim payload and restored from the original item on the way
          // back;
          // new items simply start without it (the designer adds its own snapshot).
          "formerProps",
          // Everything else — visibility/access control, print directives, sizing, number
          // formatting, input constraints, layout, conditional visibility, helptext, comment, and
          // the CodBi "attributes" (data-cb-*) — is intentionally KEPT in the slim JSON sent to
          // the AI so it sees the full existing configuration and preserves it when rebuilding the
          // form. Stale data-cb-* entries from a previous run are still purged from the attributes
          // array during the restore/normalization in restoreStrippedFields.
          //
          // NOTE: per-element "i18n" (properties.i18n[lang][prop] — the per-language element
          // translations) is deliberately NOT stripped here. It is removed from the slim payload in
          // slimPersistJson only (so a normal edit does not have to copy it), but the restore path
          // keeps and MERGES any "i18n" the AI emits (see mergeItemI18n) so that a "translate the
          // whole form into <language>" request can add per-language translations without losing
          // the translations of the other languages.
      )

  /**
   * Visibility/access-control properties that the AI may set on **new** items it creates. Values
   * are validated by [sanitizeVisibilityProp] before being written into the result.
   */
  private val SANITIZED_VISIBILITY_PROPS =
      setOf(
          "statusdependent",
          "readonly_statusdependent",
          "usergrouppendent",
          "readonly_usergrouppendant",
          "viewstatus",
          "viewusergroup",
          "readonly_viewstatus",
          "readonly_viewusergroup",
      )

  /**
   * Conditional-hidden properties that the AI may set on **new** items it creates. Unlike
   * [SANITIZED_VISIBILITY_PROPS], these are simple string values that can be preserved as-is
   * without validation. They control Formcycle's built-in show/hide logic:
   * - `hiddenif`: the mode/operator (e.g. "9" = hide when condition component matches)
   * - `hiddenifcomp`: the name of the component to evaluate (e.g. "cbMailForward")
   * - `hiddenifclear`: whether to clear the field's value when hidden ("true" / "false")
   *
   * These are stripped from the slim JSON to save tokens and prevent AI copy-paste from existing
   * items, but the AI may still set them on **new** items. The new-item handler in
   * [restoreStrippedFields] saves and restores them across the STRIPPED_ITEM_PROPS removal.
   */
  private val AI_HIDDEN_CONDITION_PROPS = setOf("hiddenif", "hiddenifcomp", "hiddenifclear")

  /**
   * Sanitizes a single visibility/access-control property value provided by the AI.
   * - Boolean properties (`statusdependent` etc.) must be a JSON boolean primitive.
   * - Array properties (`viewstatus` etc.) must be a JSON array of plain strings only; non-string
   *   entries are silently dropped.
   *
   * @return The sanitized [JsonElement], or `null` if the value is structurally invalid.
   */
  private fun sanitizeVisibilityProp(key: String, value: JsonElement): JsonElement? =
      when (key) {
        "statusdependent",
        "readonly_statusdependent",
        "usergrouppendent",
        "readonly_usergrouppendant" ->
            value.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isBoolean }
        "viewstatus",
        "viewusergroup",
        "readonly_viewstatus",
        "readonly_viewusergroup" -> {
          if (!value.isJsonArray) null
          else
              JsonArray().also { sanitized ->
                for (entry in value.asJsonArray) {
                  if (entry.isJsonPrimitive && entry.asJsonPrimitive.isString) {
                    sanitized.add(entry)
                  }
                }
              }
        }
        else -> null
      }

  private fun warnUnknownClassNames(element: JsonElement) {
    val items = element.takeIf { it.isJsonObject }?.asJsonObject?.getAsJsonArray("items") ?: return
    items.forEach { el ->
      if (!el.isJsonObject) return@forEach
      val className = el.asJsonObject.get("className")?.takeIf { it.isJsonPrimitive }?.asString
      if (className != null && className !in KNOWN_CLASS_NAMES) {
        logger.warn(
            "[AICodBiAssistant] AI used unknown className '{}' â€” item will not render correctly",
            className)
      }
    }
  }

  /**
   * Sanitizes the AI's final form JSON before it is returned to the designer:
   * - Standalone button-like items (the AI invents classNames such as `BUTTON`) are folded into a
   *   matching `XButtonList`'s "buttons" array, so the button actually renders and workflow
   *   triggers (FC_FORM_SUBMIT_BUTTON) can reference it by name. Without this the item has no id
   *   and no valid renderer, which breaks the designer's persist patch.
   * - Any remaining item with an unknown className or a missing/blank id is dropped (the designer
   *   would otherwise fail on it), and dangling references in container "elements" arrays are
   *   cleaned up.
   */
  private fun sanitizeAiFormItems(root: JsonObject) {
    val items = root.getAsJsonArray("items") ?: return
    // 1) Fold standalone button-like items into XButtonLists.
    val buttonLike = setOf("BUTTON", "BUTTONS", "XSUBMITBUTTON", "SUBMITBUTTON", "SUBMIT_BUTTON")
    val listItems =
        items.filter {
          it.isJsonObject && it.asJsonObject.get("className")?.asString == "XButtonList"
        }
    val toRemove = mutableListOf<JsonElement>()
    for (el in items) {
      if (!el.isJsonObject) continue
      val o = el.asJsonObject
      val cls = o.get("className")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      if (cls.uppercase() !in buttonLike) continue
      val props = o.getAsJsonObject("properties")
      val name = props?.get("name")?.takeIf { it.isJsonPrimitive }?.asString
      if (name.isNullOrBlank()) {
        toRemove.add(o)
        continue
      }
      val parentId = props?.get("parentid")?.takeIf { it.isJsonPrimitive }?.asString
      val list =
          listItems.firstOrNull { l ->
            val lp = l.asJsonObject.getAsJsonObject("properties")
            val lName = lp?.get("name")?.takeIf { it.isJsonPrimitive }?.asString
            val lParent = lp?.get("parentid")?.takeIf { it.isJsonPrimitive }?.asString
            lName != null && name.startsWith(lName) && parentId != null && lParent == parentId
          }
              ?: listItems.firstOrNull { l ->
                val lName =
                    l.asJsonObject
                        .getAsJsonObject("properties")
                        ?.get("name")
                        ?.takeIf { it.isJsonPrimitive }
                        ?.asString
                lName != null && name.startsWith(lName)
              }
              ?: listItems.firstOrNull()
      if (list == null) {
        toRemove.add(o)
        logger.warn(
            "[AICodBiAssistant] Dropping standalone button '{}' â€” no XButtonList to fold it into",
            name)
        continue
      }
      val listProps = list.asJsonObject.getAsJsonObject("properties")
      val value = props?.get("value")?.takeIf { it.isJsonPrimitive }?.asString
      val buttons =
          listProps.getAsJsonArray("buttons") ?: JsonArray().also { listProps.add("buttons", it) }
      if (buttons.none { it.isJsonObject && it.asJsonObject.get("name")?.asString == name }) {
        val btn = JsonObject()
        btn.addProperty("name", name)
        btn.addProperty("title", "")
        btn.addProperty("value", value ?: name)
        val action = JsonObject()
        action.addProperty("customAction", "")
        action.addProperty("customClassNames", "")
        action.addProperty("displayName", value ?: name)
        action.addProperty("optionId", "")
        action.addProperty("check", false)
        action.addProperty("page", "")
        action.addProperty("value", value ?: name)
        btn.add("action", action)
        buttons.add(btn)
        logger.info(
            "[AICodBiAssistant] Folded standalone button '{}' into XButtonList '{}'",
            name,
            listProps.get("name")?.takeIf { it.isJsonPrimitive }?.asString)
      }
      toRemove.add(o)
    }
    for (el in toRemove) items.remove(el)

    // 2) Drop any remaining item with an unknown className or a missing/blank id.
    val invalid = mutableListOf<JsonElement>()
    for (el in items) {
      if (!el.isJsonObject) continue
      val o = el.asJsonObject
      val cls = o.get("className")?.takeIf { it.isJsonPrimitive }?.asString
      if (cls.isNullOrBlank() || cls !in KNOWN_CLASS_NAMES) {
        invalid.add(o)
        logger.warn("[AICodBiAssistant] Dropping item with unknown className '{}'", cls)
        continue
      }
      val id = o.getAsJsonObject("properties")?.get("id")?.takeIf { it.isJsonPrimitive }?.asString
      if (id.isNullOrBlank()) {
        invalid.add(o)
        logger.warn(
            "[AICodBiAssistant] Dropping item '{}' with missing id",
            o.getAsJsonObject("properties")?.get("name")?.takeIf { it.isJsonPrimitive }?.asString)
      }
    }
    for (el in invalid) items.remove(el)

    // 3) Remove dangling references to dropped items from container "elements" arrays.
    val names =
        items
            .mapNotNull {
              it.takeIf { e -> e.isJsonObject }
                  ?.asJsonObject
                  ?.getAsJsonObject("properties")
                  ?.get("name")
                  ?.takeIf { p -> p.isJsonPrimitive }
                  ?.asString
            }
            .toSet()
    for (el in items) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val elements = props.getAsJsonArray("elements") ?: continue
      val clean = JsonArray()
      for (e in elements) {
        if (e.isJsonPrimitive && e.asString in names) clean.add(e)
      }
      props.add("elements", clean)
    }

    // 4) Normalize XSelect options: the visible dropdown text ("Auswahl") must be in the "text"
    // key. The AI sometimes emits {"value":..,"label":..} instead — copy "label" into "text" when
    // "text" is missing so the options actually display (an option without "text" renders empty).
    for (el in items) {
      if (!el.isJsonObject) continue
      val o = el.asJsonObject
      if (o.get("className")?.asString != "XSelect") continue
      val props = o.getAsJsonObject("properties") ?: continue
      val options = props.getAsJsonArray("options") ?: continue
      var changed = false
      for (opt in options) {
        if (!opt.isJsonObject) continue
        val obj = opt.asJsonObject
        if (!obj.has("text") && obj.has("label")) {
          obj.add("text", obj.get("label"))
          changed = true
        }
      }
      if (changed) {
        logger.info(
            "[AICodBiAssistant] Normalized XSelect '{}': copied label->text for options",
            props.get("name")?.asString)
      }
    }

    // 5) Normalize XCheckbox initial state: a checkbox must NOT be checked initially unless the
    // user explicitly requested it. ROOT CAUSE (verified by decompiling formcycle's XCheckbox):
    // the initial checked state is driven by the "checkedvalue" property, NOT by "value" (which is
    // not even a real XCheckbox property). renderItem does:
    //   String v = renderData.value.getSingle();
    //   if (v == null) v = getDefaultCheckedValue();   // reads "checkedvalue"
    //   if (isNotEmpty(v)) setAttribute("checked");
    // getDefaultCheckedValue() returns "1" when checkedvalue == "1" (→ box CHECKED), null when
    // checkedvalue is non-empty but != "1", and "" (empty) when checkedvalue is empty (→
    // UNCHECKED).
    // The AI frequently emits "checkedvalue":"1" (the formcycle default) for boxes the user wants
    // initially unchecked, which renders the box CHECKED. Force "checkedvalue" to "" unless the AI
    // explicitly marked a pre-checked box via a non-empty "value" (the prompt instructs the AI to
    // emit "value":"1" together with "checkedvalue":"1" ONLY for a deliberately pre-checked box).
    for (el in items) {
      if (!el.isJsonObject) continue
      val o = el.asJsonObject
      if (o.get("className")?.asString != "XCheckbox") continue
      val props = o.getAsJsonObject("properties") ?: continue
      val checkedValue = props.get("checkedvalue")?.takeIf { it.isJsonPrimitive }?.asString
      val explicitValue = props.get("value")?.takeIf { it.isJsonPrimitive }?.asString
      if (checkedValue == "1" && explicitValue.isNullOrBlank()) {
        props.addProperty("checkedvalue", "")
        logger.info(
            "[AICodBiAssistant] Normalized XCheckbox '{}': checkedvalue='' (initially unchecked)",
            props.get("name")?.asString)
      }
    }
  }

  /**
   * Applies the AI's explicit removal list (top-level `_removedItems`: array of element names) to
   * the final form JSON: drops the named items from "items" and removes every reference to them
   * from container "elements" arrays, then strips the "_removedItems" marker from the output.
   */
  private fun applyRemovedItems(root: JsonObject) {
    val removedEl = root.remove("_removedItems") ?: return
    if (!removedEl.isJsonArray) return
    val removed = mutableSetOf<String>()
    for (el in removedEl.asJsonArray) {
      if (el.isJsonPrimitive) removed.add(el.asString)
    }
    if (removed.isEmpty()) return
    val items = root.getAsJsonArray("items") ?: return
    val keep = JsonArray()
    for (item in items) {
      if (!item.isJsonObject) {
        keep.add(item)
        continue
      }
      val name = item.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
      if (name != null && name in removed) {
        logger.info("[AICodBiAssistant] Removing requested element '{}'", name)
        continue
      }
      keep.add(item)
    }
    root.add("items", keep)
    // Remove dangling references to the removed elements from every container's "elements" array.
    for (item in keep) {
      if (!item.isJsonObject) continue
      val props = item.asJsonObject.getAsJsonObject("properties") ?: continue
      val elements = props.getAsJsonArray("elements") ?: continue
      val clean = JsonArray()
      for (e in elements) {
        if (e.isJsonPrimitive && e.asString in removed) continue
        clean.add(e)
      }
      props.add("elements", clean)
    }
  }

  /**
   * Belt-and-suspenders cleanup: drops INVISIBLE XTextField/XTextArea items whose placeholder holds
   * an email address (e.g. tfEmpfaengerEmail/tfAbsenderEmail created from a clarified
   * recipient/sender). Such fields are pure workflow-email config clones — the email node already
   * carries the literal address, so the field is dead weight and, being invisible, has no user
   * purpose. A real email input the end user fills in is visible (placeholder is just a hint, and
   * its label/name is not an email value). Also removes the dangling references from every
   * container's "elements" array.
   */
  private fun dropInvisibleEmailConfigFields(root: JsonObject) {
    val items = root.getAsJsonArray("items") ?: return
    val dropped = mutableSetOf<String>()
    val keep = JsonArray()
    for (item in items) {
      if (!item.isJsonObject) {
        keep.add(item)
        continue
      }
      val obj = item.asJsonObject
      val props = obj.getAsJsonObject("properties")
      val isInvisible =
          props?.get("invisible")?.let {
            it.isJsonPrimitive && (it.asString == "1" || it.asBoolean)
          } ?: false
      val placeholder = props?.get("placeholder")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
      val isEmailPlaceholder =
          Regex("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}").containsMatchIn(placeholder)
      val className = obj.get("className")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
      val isTextField = className.startsWith("XText")
      if (isInvisible && isEmailPlaceholder && isTextField) {
        val name = props?.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
        logger.info(
            "[AICodBiAssistant] Dropping invisible email-config field '{}' (placeholder={})",
            name,
            placeholder)
        dropped.add(name)
        continue
      }
      keep.add(item)
    }
    if (dropped.isEmpty()) return
    root.add("items", keep)
    for (item in keep) {
      if (!item.isJsonObject) continue
      val props = item.asJsonObject.getAsJsonObject("properties") ?: continue
      val elements = props.getAsJsonArray("elements") ?: continue
      val clean = JsonArray()
      for (e in elements) {
        if (e.isJsonPrimitive && e.asString in dropped) continue
        clean.add(e)
      }
      props.add("elements", clean)
    }
  }

  private fun slimPersistJson(json: String): String {
    val root = JsonParser.parseString(json).asJsonObject
    for (field in STRIPPED_FIELDS) root.remove(field)
    root.getAsJsonArray("items")?.forEach { el ->
      if (!el.isJsonObject) return@forEach
      val props = el.asJsonObject.getAsJsonObject("properties") ?: return@forEach
      for (key in STRIPPED_ITEM_PROPS) props.remove(key)
      // Per-language element translations ("properties.i18n") are deliberately NOT sent to the AI:
      // they are per-language display overrides, not form structure. The AI is told the format in
      // the prompts and emits fresh "i18n" objects for "translate the whole form" requests; the
      // restore path then merges them with the originals (see mergeItemI18n), so the translations
      // of other languages are never lost. Not stripping here would also make the AI copy existing
      // translations onto elements it rebuilds.
      props.remove("i18n")
      val emptyKeys =
          props
              .entrySet()
              .filter { (_, v) ->
                (v.isJsonPrimitive && v.asString == "") ||
                    (v.isJsonArray && v.asJsonArray.size() == 0) ||
                    (v.isJsonObject && v.asJsonObject.size() == 0)
              }
              .map { it.key }
      for (key in emptyKeys) props.remove(key)
    }
    return gson.toJson(root)
  }

  /**
   * Merges the per-language element translations the AI emitted ("properties.i18n") with the
   * original item's translations. Formcycle stores per-language translations as
   * `properties.i18n[<languageCode>][<property>]` (the plain properties keep the base-language
   * text). A "translate the whole form into <language>" request makes the AI add such an "i18n"
   * object for the requested language; merging it into the ORIGINAL i18n guarantees that the
   * translations of every OTHER language (and any property the AI did not touch) are preserved
   * instead of being overwritten/dropped by the generic stripped-field restore.
   *
   * @param resultProps The AI result item's `properties` object (mutated in place).
   * @param origProps The original item's `properties` object.
   */
  private fun mergeItemI18n(resultProps: JsonObject, origProps: JsonObject) {
    val aiI18n = resultProps.get("i18n")?.takeIf { it.isJsonObject }?.asJsonObject ?: return
    val origI18nEl = origProps.get("i18n")
    val merged =
        if (origI18nEl != null && origI18nEl.isJsonObject) origI18nEl.asJsonObject.deepCopy()
        else JsonObject()
    for ((lang, langValue) in aiI18n.entrySet()) {
      if (!langValue.isJsonObject) {
        // A non-object per-language value is kept verbatim (never corrupt structure).
        merged.add(lang, langValue.deepCopy())
        continue
      }
      val langObj =
          merged.get(lang)?.takeIf { it.isJsonObject }?.asJsonObject
              ?: JsonObject().also { merged.add(lang, it) }
      for ((prop, propValue) in langValue.asJsonObject.entrySet()) {
        langObj.add(prop, propValue.deepCopy())
      }
    }
    if (merged.size() == 0) {
      resultProps.remove("i18n")
    } else {
      resultProps.add("i18n", merged)
    }
  }

  /**
   * Promotes any child element that the AI embedded as a full JSON object inside a container's
   * `properties.elements` array to the flat top-level `items` array, replacing the object with its
   * `name` reference string. FORMCYCLE expects a flat `items` list where containers/fieldsets/pages
   * reference their children by name; some models output children as nested objects, which the
   * designer would otherwise silently drop.
   */
  private fun promoteNestedElementObjects(root: JsonObject) {
    val items = root.getAsJsonArray("items") ?: return
    val knownNames = mutableSetOf<String>()
    for (el in items) {
      if (el.isJsonObject) {
        val name = el.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
        if (name != null) knownNames.add(name)
      }
    }
    val queue = ArrayDeque<JsonObject>()
    for (el in items) {
      if (el.isJsonObject) queue.addLast(el.asJsonObject)
    }
    while (queue.isNotEmpty()) {
      val container = queue.removeFirst()
      val containerProps = container.getAsJsonObject("properties") ?: continue
      val elements = containerProps.getAsJsonArray("elements") ?: continue
      val rebuilt = JsonArray()
      var changed = false
      for (ref in elements) {
        if (ref.isJsonPrimitive) {
          rebuilt.add(ref)
          continue
        }
        if (!ref.isJsonObject) {
          rebuilt.add(ref)
          continue
        }
        // A full element object inside 'elements' — promote it to the flat items list.
        val childObj = ref.asJsonObject
        val childName = childObj.getAsJsonObject("properties")?.get("name")?.asString
        changed = true
        if (childName != null) {
          if (childName !in knownNames) {
            knownNames.add(childName)
            items.add(childObj)
            queue.addLast(childObj)
          }
          rebuilt.add(childName)
        }
        // A child without a name cannot be referenced — drop the reference to keep 'elements'
        // valid.
      }
      if (changed) containerProps.add("elements", rebuilt)
    }
  }

  private fun restoreStrippedFields(aiResult: String, original: String, prompt: String): String {
    val aiObj = JsonParser.parseString(aiResult).asJsonObject
    // Some models embed newly created child elements as full JSON objects inside a container's
    // 'properties.elements' array instead of (a) adding them to the flat top-level 'items' array
    // and (b) referencing them by 'name' string. FORMCYCLE expects the flat structure, so promote
    // such nested objects before any further processing — otherwise the fields never render.
    promoteNestedElementObjects(aiObj)
    val result = JsonParser.parseString(original).asJsonObject
    val originalItems = result.getAsJsonArray("items")
    for (entry in aiObj.entrySet()) {
      if (entry.key == "variables") continue
      if (entry.key !in STRIPPED_FIELDS) {
        result.add(entry.key, entry.value)
      }
    }
    mergeFormVariables(result, aiObj)
    val resultItems: JsonArray =
        result.getAsJsonArray("items") ?: JsonArray().also { result.add("items", it) }
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      if (!item.has("className")) {
        val props = item.getAsJsonObject("properties") ?: continue
        val classNameInProps = props.get("className") ?: continue
        item.add("className", classNameInProps)
        props.remove("className")
      }
    }
    // Normalize the AI's ITEM-level "attributes" (sibling of "properties") into
    // "properties.attributes". FORMCYCLE only reads attributes from
    // properties["attributes"] as [{text: "...", value: "..."}] objects — a top-level
    // "attributes" key on an item is silently ignored by the designer (and the change
    // log). The AI sometimes emits attributes at the ITEM level instead of inside
    // "properties" (e.g. the TinyMCE functionality emits "attributes":
    // [{"text":"data-cb-func","value":"HTML.Input.TinyMCE"}]). Move them down and merge
    // with any existing properties.attributes — the AI's values win on duplicate keys.
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      val topAttrs = item.get("attributes") ?: continue
      if (!topAttrs.isJsonObject && !topAttrs.isJsonArray) continue
      val props = item.getAsJsonObject("properties") ?: continue

      // Canonicalize the AI's item-level attributes into [{text, value}] objects.
      val incoming = JsonArray()
      if (topAttrs.isJsonObject) {
        for ((key, value) in topAttrs.asJsonObject.entrySet()) {
          val obj = JsonObject()
          obj.addProperty("text", key)
          obj.add("value", value)
          incoming.add(obj)
        }
      } else {
        for (attr in topAttrs.asJsonArray) {
          if (!attr.isJsonObject) continue
          val text =
              attr.asJsonObject.get("text")?.asString
                  ?: attr.asJsonObject.get("name")?.asString
                  ?: continue
          val entry = JsonObject()
          entry.addProperty("text", text)
          entry.add("value", attr.asJsonObject.get("value") ?: JsonNull.INSTANCE)
          incoming.add(entry)
        }
      }
      if (incoming.size() == 0) {
        item.remove("attributes")
        continue
      }

      val merged = JsonArray()
      val existing = props.get("attributes")
      if (existing != null && existing.isJsonArray) {
        for (e in existing.asJsonArray) merged.add(e)
      }
      // AI values win for duplicate text keys; keep existing non-conflicting entries.
      for (entry in incoming) {
        if (!entry.isJsonObject) continue
        val text = entry.asJsonObject.get("text")?.asString ?: continue
        var replaced = false
        for (i in 0 until merged.size()) {
          val cur = merged.get(i)
          if (cur.isJsonObject) {
            val curText =
                cur.asJsonObject.get("text")?.asString ?: cur.asJsonObject.get("name")?.asString
            if (curText == text) {
              merged.set(i, entry)
              replaced = true
              break
            }
          }
        }
        if (!replaced) merged.add(entry)
      }
      props.add("attributes", merged)
      item.remove("attributes")
    }
    if (originalItems != null) {
      val originalByName =
          originalItems
              .filter { it.isJsonObject }
              .mapNotNull { el ->
                val item = el.asJsonObject
                val name =
                    item.getAsJsonObject("properties")?.get("name")?.asString
                        ?: item.get("name")?.asString
                        ?: return@mapNotNull null
                name to el
              }
              .toMap()
      val originalContainerOfItem = mutableMapOf<String, String>()
      for ((containerName, el) in originalByName) {
        val elements =
            el.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements") ?: continue
        for (ref in elements) {
          if (ref.isJsonPrimitive) originalContainerOfItem[ref.asString] = containerName
        }
      }
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val name =
            item.getAsJsonObject("properties")?.get("name")?.asString
                ?: item.get("name")?.asString
                ?: continue
        val origItem = originalByName[name]?.asJsonObject
        if (origItem == null) {
          // New item created by AI â€” validate and preserve workflow-visibility props, then
          // strip all remaining code/presentation fields.
          item.getAsJsonObject("properties")?.let { props ->
            // Extract any data-cb-* attributes from the AI's attributes object/array BEFORE
            // stripping, and promote them to direct property keys. The conversion code at the
            // end of restoreStrippedFields will convert them to the proper attributes array
            // format ([{"text":"data-cb-func","value":"html.panel"},...]).
            val attrsEl = props.get("attributes")
            if (attrsEl != null) {
              if (attrsEl.isJsonObject) {
                // AI output format: "attributes": {"data-cb-func":"html.panel", ...}
                for ((key, value) in attrsEl.asJsonObject.entrySet()) {
                  if (key.startsWith("data-cb-") && value.isJsonPrimitive) {
                    props.addProperty(key, value.asString)
                  }
                }
              } else if (attrsEl.isJsonArray) {
                // Proper array format: "attributes": [{"text":"data-cb-func","value":"html.panel"},
                // ...]
                // Also support "name" key which some AI models use instead of "text".
                for (item in attrsEl.asJsonArray) {
                  if (item.isJsonObject) {
                    val text =
                        item.asJsonObject.get("text")?.asString
                            ?: item.asJsonObject.get("name")?.asString
                    val value = item.asJsonObject.get("value")?.asString
                    if (text != null && text.startsWith("data-cb-") && value != null) {
                      props.addProperty(text, value)
                    }
                  }
                }
              }
            }
            val validatedVisibility =
                SANITIZED_VISIBILITY_PROPS.mapNotNull { key ->
                  val v = props.get(key) ?: return@mapNotNull null
                  val sanitized = sanitizeVisibilityProp(key, v) ?: return@mapNotNull null
                  key to sanitized
                }
            // Save conditional-hidden properties (hiddenif, hiddenifcomp, hiddenifclear) before
            // stripping, so they survive the STRIPPED_ITEM_PROPS removal. These are set by the
            // AI on new items (e.g. AI Chat MailAddress field with hiddenifcomp="cbMailForward").
            val hiddenConditions =
                AI_HIDDEN_CONDITION_PROPS.mapNotNull { key ->
                  val v = props.get(key) ?: return@mapNotNull null
                  if (v.isJsonPrimitive) key to v.asString else null
                }
            for (key in STRIPPED_ITEM_PROPS) props.remove(key)
            for ((key, value) in validatedVisibility) props.add(key, value)
            // Restore conditional-hidden properties that the AI set on this new item.
            for ((key, value) in hiddenConditions) {
              props.addProperty(key, value)
            }
          }
          continue
        }
        val origProps = origItem.getAsJsonObject("properties") ?: continue
        val resultProps = item.getAsJsonObject("properties") ?: continue
        // Promote any data-cb-* entries from the AI's attributes array to direct property
        // keys BEFORE restoring the original attributes (which may be empty). This mirrors
        // the promotion done for new items (see above) and handles cases where the AI
        // outputs attributes in the array format rather than as direct property keys.
        val attrsEl = resultProps.get("attributes")
        if (attrsEl != null) {
          if (attrsEl.isJsonObject) {
            for ((key, value) in attrsEl.asJsonObject.entrySet()) {
              if (key.startsWith("data-cb-") && value.isJsonPrimitive) {
                resultProps.addProperty(key, value.asString)
              }
            }
          } else if (attrsEl.isJsonArray) {
            for (item in attrsEl.asJsonArray) {
              if (item.isJsonObject) {
                // Support both {"text":"data-cb-...","value":"..."} and
                // {"name":"data-cb-...","value":"..."}
                val text =
                    item.asJsonObject.get("text")?.asString
                        ?: item.asJsonObject.get("name")?.asString
                val value = item.asJsonObject.get("value")?.asString
                if (text != null && text.startsWith("data-cb-") && value != null) {
                  resultProps.addProperty(text, value)
                }
              }
            }
          }
        }
        for (key in STRIPPED_ITEM_PROPS) {
          val v = origProps.get(key)
          if (v != null) resultProps.add(key, v) else resultProps.remove(key)
        }
        for (entry in origProps.entrySet()) {
          if (!resultProps.has(entry.key)) resultProps.add(entry.key, entry.value)
        }
        // Merge any per-language translations the AI emitted ("properties.i18n") into the
        // original item's translations so other languages and untouched properties survive a
        // "translate the whole form into <language>" request.
        mergeItemI18n(resultProps, origProps)
        // For XButtonList: restore original action for each existing button by name, since
        // action objects were stripped from slimPersistJson to prevent copy-paste errors.
        // New buttons (no matching name in original) keep the AI's generated action.
        if (item.get("className")?.asString == "XButtonList") {
          val origBtns = origProps.getAsJsonArray("buttons")
          val resultBtns = resultProps.getAsJsonArray("buttons")
          if (origBtns != null && resultBtns != null) {
            val origActionByName =
                origBtns
                    .mapNotNull { btn ->
                      if (!btn.isJsonObject) return@mapNotNull null
                      val bName = btn.asJsonObject.get("name")?.asString ?: return@mapNotNull null
                      val action = btn.asJsonObject.get("action") ?: return@mapNotNull null
                      bName to action
                    }
                    .toMap()
            for (resultBtn in resultBtns) {
              if (!resultBtn.isJsonObject) continue
              val btnObj = resultBtn.asJsonObject
              val bName = btnObj.get("name")?.asString ?: continue
              val origAction = origActionByName[bName] ?: continue // new button â€” keep AI action
              if (!btnObj.has("action")) btnObj.add("action", origAction)
            }
          }
        }
      }
      val resultItemNames = mutableSetOf<String>()
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val n =
            item.getAsJsonObject("properties")?.get("name")?.asString
                ?: item.get("name")?.asString
                ?: continue
        resultItemNames.add(n)
      }
      // Trust the AI's structural output instead of guessing intent with keyword heuristics:
      // the AI understands the user's intent (in any language) from the prompt and expresses
      // removals structurally. Only restore an original item the AI dropped when the result
      // still clearly expects it:
      //   - children: their parent container is present in the result AND still references the
      //     item in its "elements" array (an accidental omission, not a removal);
      //   - top-level scaffolding (header/footer/page): only when the AI kept at least one
      //     container, i.e. it is performing an ordinary structural edit rather than emptying
      //     the form.
      // When the AI emptied/removed an element, honor it and do NOT re-add.
      val aiKeptContainers =
          resultItems.any { candidate ->
            candidate.isJsonObject &&
                candidate.asJsonObject.getAsJsonObject("properties")?.has("elements") == true
          }
      for (el in originalItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val name =
            item.getAsJsonObject("properties")?.get("name")?.asString
                ?: item.get("name")?.asString
                ?: continue
        if (name in resultItemNames) continue
        val containerName = originalContainerOfItem[name]
        val restore =
            if (containerName != null) {
              resultItems.any { candidate ->
                candidate.isJsonObject &&
                    candidate.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString ==
                        containerName &&
                    candidate.asJsonObject
                        .getAsJsonObject("properties")
                        ?.getAsJsonArray("elements")
                        ?.any { ref -> ref.isJsonPrimitive && ref.asString == name } == true
              }
            } else {
              aiKeptContainers
            }
        if (restore) {
          resultItems.add(el)
          logger.debug("[AICodBiAssistant] Restored original item '{}' dropped by AI", name)
        } else {
          logger.info(
              "[AICodBiAssistant] Honoring removal of '{}' - not restoring (AI interpreted the prompt as a removal)",
              name)
        }
      }
      // Safety net — restore children a container/fieldset/page lost when the AI re-emitted it
      // (e.g. it kept the fieldset but emptied/omitted its 'elements' array while adding a CSS
      // class). Without this the existing fields silently vanish on ordinary modification prompts.
      // Skipped when the prompt asks for a removal/delete, so intentional removals are honored.
      val promptRequestsRemoval =
          listOf("entfern", "lösch", "entfernen", "lösche", "remove", "delete", "drop").any {
            prompt.contains(it, ignoreCase = true)
          }
      if (!promptRequestsRemoval) {
        val originalChildren = mutableMapOf<String, JsonArray>()
        val originalItemBy = mutableMapOf<String, JsonObject>()
        for (el in originalItems) {
          if (!el.isJsonObject) continue
          val item = el.asJsonObject
          val props = item.getAsJsonObject("properties") ?: continue
          val cname = props.get("name")?.asString ?: continue
          val elems = props.getAsJsonArray("elements")
          if (elems != null && elems.size() > 0) originalChildren[cname] = elems
          originalItemBy[cname] = item
        }
        val restoredRefs = mutableMapOf<String, MutableSet<String>>()
        val itemsToAdd = mutableListOf<JsonObject>()
        // Names referenced by ANY container's elements array in the result (before restoration).
        // Used to distinguish a deliberate MOVE (the item exists and is referenced by another
        // container) from an accidental drop (the item is orphaned or gone).
        val referencedResultNames = mutableSetOf<String>()
        for (el in resultItems) {
          if (!el.isJsonObject) continue
          el.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements")?.forEach { e ->
            if (e.isJsonPrimitive) referencedResultNames.add(e.asString)
          }
        }
        for (el in resultItems) {
          if (!el.isJsonObject) continue
          val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
          val cname = props.get("name")?.asString ?: continue
          val origElems = originalChildren[cname] ?: continue
          val resultElems =
              if (props.has("elements") && props.get("elements").isJsonArray)
                  props.getAsJsonArray("elements")
              else JsonArray().also { props.add("elements", it) }
          val resultNames =
              (0 until resultElems.size())
                  .mapNotNull { i ->
                    val r = resultElems.get(i)
                    if (r.isJsonPrimitive) r.asString else null
                  }
                  .toSet()
          val missing = mutableSetOf<String>()
          for (ref in origElems) {
            if (!ref.isJsonPrimitive) continue
            val childName = ref.asString
            if (childName !in resultNames) missing.add(childName)
          }
          if (missing.isEmpty()) continue
          for (childName in missing) {
            // If the child item still exists in the result AND is referenced by another container,
            // the AI deliberately MOVED it (re-parented it) — do NOT restore it to this original
            // container; the placement normalization below derives its real parent from where it
            // is actually referenced. Only restore children that were truly dropped (item gone) or
            // are orphaned in the result.
            if (childName in resultItemNames && childName in referencedResultNames) continue
            restoredRefs.getOrPut(cname) { mutableSetOf() }.add(childName)
            if (childName !in resultItemNames) {
              originalItemBy[childName]?.let { itemsToAdd.add(it) }
            }
          }
        }
        if (restoredRefs.isNotEmpty()) {
          for (el in resultItems) {
            if (!el.isJsonObject) continue
            val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
            val cname = props.get("name")?.asString ?: continue
            val missing = restoredRefs[cname] ?: continue
            val resultElems =
                if (props.has("elements") && props.get("elements").isJsonArray)
                    props.getAsJsonArray("elements")
                else JsonArray().also { props.add("elements", it) }
            for (childName in missing) {
              resultElems.add(childName)
            }
          }
          for (item in itemsToAdd) resultItems.add(item)
        }
      }
      val baseObj = result.getAsJsonObject("base")
      val itemToContainerId = mutableMapOf<String, String>()
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val containerProps = el.asJsonObject.getAsJsonObject("properties") ?: continue
        val containerId = containerProps.get("id")?.asString ?: continue
        val elements = containerProps.getAsJsonArray("elements") ?: continue
        for (ref in elements) {
          if (ref.isJsonPrimitive) itemToContainerId[ref.asString] = containerId
        }
      }
      // Normalize placement. The AI sometimes writes `parentid` as the parent's NAME (e.g.
      // "fsBKDaten" / "p1") instead of the parent's `id` (e.g. "xi-fs-bk-daten"). Formcycle's
      // `parentid` must reference the parent's `id` — a name-based parentid leaves every child
      // unattached and the form renders EMPTY even though the change log lists all widgets as
      // created. The container's `elements` array is the single source of truth: re-derive every
      // item's parentid from it (overriding the AI's value), and attach items the AI forgot to
      // reference (orphans) to a container — preferably the one the AI named in parentid (by name
      // or id), else the nearest preceding container / last fieldset or page. Original items the
      // AI deliberately detached (removed from their container's elements) are NOT re-attached —
      // the restore logic above already honored the removal.
      val attachContainerClassNames = setOf("XFieldSet", "XPage", "XContainer")
      val containerById = mutableMapOf<String, JsonObject>()
      val containerByName = mutableMapOf<String, JsonObject>()
      val indexByName =
          resultItems
              .mapIndexedNotNull { idx, el ->
                el.takeIf { it.isJsonObject }
                    ?.asJsonObject
                    ?.getAsJsonObject("properties")
                    ?.get("name")
                    ?.asString
                    ?.let { name -> name to idx }
              }
              .toMap()
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
        if (!props.has("elements")) continue
        val id = props.get("id")?.asString
        if (id != null) containerById[id] = el.asJsonObject
        val name = props.get("name")?.asString
        if (name != null) containerByName[name] = el.asJsonObject
      }
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val className = item.get("className")?.asString ?: continue
        if (className == "XPage") continue // the page is top-level — it has no parent of its own
        val props = item.getAsJsonObject("properties") ?: continue
        val name = props.get("name")?.asString ?: continue
        val isContainer = props.has("elements") // fieldset / container / header / footer
        val aiParent = props.get("parentid")?.takeIf { it.isJsonPrimitive }?.asString
        val referencedId = itemToContainerId[name]
        var parentId = referencedId
        if (parentId == null) {
          // Not referenced by any container's elements array — attach it. Prefer the container the
          // AI named in parentid (by name or id); else the nearest preceding container (a fieldset
          // goes on a page; a leaf goes on a fieldset/container/page); else the last matching
          // container. Original items the AI detached are intentionally left detached.
          val namedContainer =
              if (aiParent != null) (containerById[aiParent] ?: containerByName[aiParent]) else null
          val target =
              if (namedContainer != null) {
                namedContainer
              } else if (name in originalByName) {
                null // AI deliberately removed an original item from its container — respect it
              } else {
                (indexByName[name]?.let { idx ->
                  (idx - 1 downTo 0)
                      .asSequence()
                      .map { i -> resultItems[i] }
                      .firstOrNull { c ->
                        c.isJsonObject &&
                            c.asJsonObject.get("className")?.asString in
                                (if (isContainer) setOf("XPage") else attachContainerClassNames)
                      }
                })
                    ?: resultItems.lastOrNull {
                      it.isJsonObject &&
                          it.asJsonObject.get("className")?.asString in
                              (if (isContainer) setOf("XPage") else setOf("XFieldSet", "XPage"))
                    }
              }
          if (target != null) {
            val targetProps = target.asJsonObject.getAsJsonObject("properties")
            val targetId = targetProps?.get("id")?.asString
            var elements = targetProps?.get("elements")?.takeIf { it.isJsonArray }?.asJsonArray
            if (elements == null && targetProps != null) {
              val newArr = JsonArray()
              targetProps.add("elements", newArr)
              elements = newArr
            }
            if (elements != null && elements.none { it.isJsonPrimitive && it.asString == name }) {
              elements.add(name)
              logger.warn(
                  "[AICodBiAssistant] Auto-attached orphaned item '{}' to container '{}'",
                  name,
                  targetProps?.get("name")?.asString)
            }
            parentId = targetId
          }
        }
        // parentid must be the parent's `id` (xi-…), never its name — override the AI's value so
        // the form renders.
        if (parentId != null && props.get("parentid")?.asString != parentId) {
          props.addProperty("parentid", parentId)
        }
      }
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val name = item.getAsJsonObject("properties")?.get("name")?.asString ?: continue
        if (name in originalByName) continue
        val className = item.get("className")?.asString ?: continue
        val baseProps =
            baseObj?.getAsJsonObject(className)?.getAsJsonObject("properties") ?: continue
        val itemProps = item.getAsJsonObject("properties") ?: continue
        for (entry in baseProps.entrySet()) {
          // Deep-copy base values so mutable arrays/objects (e.g. "cssclasses") are never shared
          // by reference between every new item of the same class. Mutating a shared array would
          // leak one item's classes (or other values) onto all the other items.
          if (!itemProps.has(entry.key)) itemProps.add(entry.key, entry.value.deepCopy())
        }
        // For new XTextField date fields: always enable the datepicker calendar widget,
        // overriding any base-template default of "0".
        if (className == "XTextField" &&
            (itemProps.get("datatype")?.asString ?: "").startsWith("date")) {
          itemProps.addProperty("datepicker", "1")
        }
        val parentId = itemToContainerId[name]
        if (parentId != null && itemProps.get("parentid")?.asString != parentId) {
          itemProps.addProperty("parentid", parentId)
        }
      }
    }
    // Convert any AI-generated data-cb-* direct property keys to the proper attributes array
    // format. FORMCYCLE reads custom HTML attributes from properties["attributes"] as
    // [{text: "attr-name", value: "attr-value"}] objects, NOT as direct property keys.
    // CRITICAL: Before adding AI's fresh values, purge any stale data-cb-* entries from the
    // existing attributes array (which may have been restored from the original form with
    // stale values from a previous run). This prevents stale entries from surviving alongside
    // the AI's correct values.
    //
    // NOTE: CSS classes are NOT stored as HTML "class" attributes in the attributes array.
    // FORMCYCLE uses the dedicated "cssclasses" array property on each element
    // (e.g. "cssclasses":["CodBi_People_Name"]). The AI sets this directly as a property
    // and no conversion is needed.
    //
    // CSS classes are passed through WITHOUT any server-side validation: class names supplied by
    // the AI (e.g. custom theme classes such as "Goon", or CodBi_* classes) reach the designer
    // unchanged. AI-generated CSS *code* is never taken over â€” a "css" property / <style> content
    // is removed via STRIPPED_FIELDS / STRIPPED_ITEM_PROPS.
    // Normalize the AI's cssclasses placement: the AI sometimes writes "cssclasses" (and
    // "cssclasseswrapper") at the ITEM level (sibling of "properties") instead of inside
    // "properties". FORMCYCLE only reads properties.cssclasses, so move them down (merging with
    // any existing properties value — the AI's classes win) so they reach the designer.
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      val props = item.getAsJsonObject("properties") ?: continue
      for (key in listOf("cssclasses", "cssclasseswrapper")) {
        val topLevel = item.get(key)
        if (topLevel == null || !topLevel.isJsonArray || topLevel.asJsonArray.size() == 0) continue
        val existing = props.get(key)
        if (existing != null && existing.isJsonArray && existing.asJsonArray.size() > 0) {
          val aiSet =
              topLevel.asJsonArray
                  .mapNotNull { if (it.isJsonPrimitive) it.asString else null }
                  .toSet()
          val merged = JsonArray()
          for (e in existing.asJsonArray) {
            if (e.isJsonPrimitive && e.asString in aiSet) continue
            merged.add(e)
          }
          for (e in topLevel.asJsonArray) merged.add(e)
          props.add(key, merged)
        } else {
          props.add(key, topLevel)
        }
        item.remove(key)
      }
    }
    // Normalize the AI's "class" property into the Formcycle "cssclasses" array. The AI often
    // writes the HTML-style key "class" (a plain string, e.g. "CodBi_People_Name", possibly a
    // space-separated list) — either inside "properties" or as a sibling of it, or as a "class"
    // entry inside the attributes array — instead of the Formcycle "cssclasses" array. Without
    // this conversion the classes never reach the designer's element properties (and never
    // trigger standard auto-activation below).
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      val props = item.getAsJsonObject("properties") ?: continue
      val classCandidates = mutableListOf<JsonElement>()
      item.get("class")?.let { classCandidates.add(it) }
      props.get("class")?.let { classCandidates.add(it) }
      val attrsEl = props.get("attributes")
      if (attrsEl != null && attrsEl.isJsonArray) {
        for (attr in attrsEl.asJsonArray) {
          if (attr.isJsonObject) {
            val text =
                attr.asJsonObject.get("text")?.asString ?: attr.asJsonObject.get("name")?.asString
            if (text.equals("class", ignoreCase = true)) {
              attr.asJsonObject.get("value")?.let { classCandidates.add(it) }
            }
          }
        }
      }
      if (classCandidates.isEmpty()) continue
      val existingClasses = props.get("cssclasses")
      val cssClasses =
          if (existingClasses != null && existingClasses.isJsonArray) {
            // Copy instead of reusing the array so we never mutate a base-template array that may
            // be shared across items (see base-props merge above).
            JsonArray()
                .also { copy -> existingClasses.asJsonArray.forEach { copy.add(it) } }
                .also { props.add("cssclasses", it) }
          } else {
            JsonArray().also { props.add("cssclasses", it) }
          }
      var added = false
      for (candidate in classCandidates) {
        val names =
            when {
              candidate.isJsonArray ->
                  candidate.asJsonArray.mapNotNull {
                    it.takeIf { e -> e.isJsonPrimitive }?.asString
                  }
              candidate.isJsonPrimitive ->
                  candidate.asString.split(Regex("\\s+")).filter { it.isNotBlank() }
              else -> emptyList()
            }
        for (name in names) {
          if (cssClasses.none { it.isJsonPrimitive && it.asString == name }) {
            cssClasses.add(name)
            added = true
          }
        }
      }
      if (added) {
        logger.info(
            "[AICodBiAssistant] Normalized 'class' to 'cssclasses' on item '{}': {}",
            props.get("name")?.asString ?: "<unknown>",
            cssClasses
                .mapNotNull { it.takeIf { e -> e.isJsonPrimitive }?.asString }
                .joinToString(", "))
      }
      item.remove("class")
      props.remove("class")
    }
    // Deterministic safety net: ensure the CodBi OpenPLZ.AC.SET classes are present on any
    // address-part field (street, building number, postal code, locality). The AI is instructed to
    // apply these classes but may omit them; this guarantees they reach the designer. Existing
    // classes (e.g. "Goon") are preserved — nothing is removed or overridden.
    // NOTE: baseObj is read from the result again here (not the one declared inside the
    // `if (originalItems != null)` block above, which is out of scope at this point).
    applyOpenPlzAddressClasses(resultItems, result.getAsJsonObject("base"))
    // Holistic.* names (e.g. "Holistic.CSS.Standard", "Holistic.Matomo.Tracking", "Holistic.Media
    // .Input.Speech") are CodBi STANDARD CONFIGURATION ids, NOT per-widget CSS classes. They are
    // activated at the FORM level via the CodBi section of the form properties (the
    // codbi-prop-standards CSV). Placing them on an element's cssclasses would leave a bogus CSS
    // class on the widget, so strip them whenever the AI wrongly applied them as classes.
    stripHolisticStandardClasses(resultItems)
    // CSS class names from the AI are passed through unchanged (no whitelist/validation) — they
    // reach the designer as-is. AI-generated CSS *code* is already removed via STRIPPED_FIELDS /
    // STRIPPED_ITEM_PROPS, so only class names can ever be taken over, never code.
    val STALE_PREFIXES = listOf("data-cb-")
    // UI.Panels standard CSS classes that ALREADY apply HTML.Panel internally. When one of these is
    // present on an element, data-cb-func=html.panel is redundant and must be removed (see below).
    val panelStandardClassPrefixes = listOf("CodBi_HTML_Panel_", "CodBi_Accordion_")
    // data-cb-* parameter prefixes that belong ONLY to HTML.Panel (removed together with the
    // redundant data-cb-func=html.panel).
    val panelOnlyParamPrefixes =
        listOf(
            // data-cb-open does NOT exist for HTML.Panel — the AI sometimes invents it to express
            // "open initially"; the correct parameter is data-cb-folded.
            "data-cb-open",
            "data-cb-generateheader",
            "data-cb-autoheadertitle",
            "data-cb-autoheaderlevel",
            "data-cb-autoheadertitlesupplementsspacer",
            "data-cb-accordion",
            "data-cb-folded",
            "data-cb-scroll",
            "data-cb-scrollblock",
            "data-cb-scrolltotop",
            "data-cb-cssafterheader",
            "data-cb-cssbeforeheader",
            "data-cb-cssheaderactive",
            "data-cb-cssheaderhover",
            "data-cb-cssheaderunfolded",
            "data-cb-dcssheaderunfolded")
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      // NOTE: Print.Remove is intentionally NOT normalized server-side — the AI is taught to use
      // the CodBi_Print_Remove_* CSS classes as the standard and data-cb-func="Print.Remove" only
      // when a parameter (e.g. DocumentSelector) is required, so the AI's choice reaches the
      // designer unchanged.
      // --- Normalize panels: the UI.Panels standard CSS classes (CodBi_HTML_Panel_* /
      // CodBi_Accordion_*) ALREADY apply HTML.Panel. If the AI put BOTH a panel class AND
      // data-cb-func=html.panel on the same element, drop the redundant html.panel (and its
      // panel-only parameters) — an element uses exactly ONE of the two, never both.
      val cssArr = props.getAsJsonArray("cssclasses") ?: JsonArray()
      val hasPanelClass =
          (0 until cssArr.size()).any { i ->
            val c = cssArr.get(i)
            c.isJsonPrimitive && panelStandardClassPrefixes.any { c.asString.startsWith(it) }
          }
      if (hasPanelClass) {
        var normalizedPanel = false
        // (a) direct data-cb-* properties (the AI's common output form)
        val panelFunc = props.get("data-cb-func")?.asString
        if (panelFunc != null && panelFunc.contains("html.panel", ignoreCase = true)) {
          val remaining =
              panelFunc
                  .split(",")
                  .map { it.trim() }
                  .filterNot { it.equals("html.panel", ignoreCase = true) }
          if (remaining.isEmpty()) {
            props.remove("data-cb-func")
          } else {
            props.addProperty("data-cb-func", remaining.joinToString(","))
          }
          props.entrySet().removeIf { (key, _) ->
            panelOnlyParamPrefixes.any { key.startsWith(it) }
          }
          normalizedPanel = true
        }
        // (b) attributes-array form: [{"text":"data-cb-func","value":"html.panel"}, ...]
        val attrsArr = props.getAsJsonArray("attributes")
        if (attrsArr != null && attrsArr.size() > 0) {
          val kept = JsonArray()
          var changed = false
          for (e in attrsArr) {
            var drop = false
            if (e.isJsonObject) {
              val text = e.asJsonObject.get("text")?.asString ?: ""
              if (text.equals("data-cb-func", ignoreCase = true)) {
                val v = e.asJsonObject.get("value")?.asString ?: ""
                val remaining =
                    v.split(",")
                        .map { it.trim() }
                        .filterNot { it.equals("html.panel", ignoreCase = true) }
                if (remaining.isEmpty()) {
                  drop = true
                  changed = true
                } else {
                  if (remaining.size != v.split(",").size) changed = true
                  val neo = JsonObject()
                  neo.addProperty("text", "data-cb-func")
                  neo.addProperty("value", remaining.joinToString(","))
                  kept.add(neo)
                  continue
                }
              } else if (panelOnlyParamPrefixes.any { text.startsWith(it) }) {
                drop = true
                changed = true
              }
            }
            if (!drop) kept.add(e)
          }
          if (changed) {
            props.add("attributes", kept)
            normalizedPanel = true
          }
        }
        if (normalizedPanel) {
          logger.info(
              "[AICodBiAssistant] Removed redundant data-cb-func=html.panel (UI.Panels class present)")
        }
      }
      val attrs =
          if (props.has("attributes") && props.get("attributes").isJsonArray)
              props.getAsJsonArray("attributes")
          else null
      // Purge any stale data-cb-* entries from the existing attributes array
      // (may have been restored from the original form).
      if (attrs != null && attrs.size() > 0) {
        val filtered = JsonArray()
        for (e in attrs) {
          if (!(e.isJsonObject && e.asJsonObject.get("text")?.isJsonPrimitive == true)) {
            filtered.add(e)
          } else {
            val attrName = e.asJsonObject.get("text").asString
            if (!STALE_PREFIXES.any { attrName.startsWith(it) }) filtered.add(e)
          }
        }
        props.add("attributes", filtered)
      }

      // --- Normalize the wrong "mark as Pflichtfeld" approach: the AI sometimes "marks" a field as
      // mandatory with data-cb-func="html.setattribute" (data-cb-name="title", data-cb-toset=
      // "Pflichtfeld"). A title tooltip does NOT make a field required — Formcycle's mandatory flag
      // is the element property "required" (Constraints > Required). Convert it to "required":"1"
      // and drop the tooltip so the field is actually validated as mandatory.
      val funcLower = props.get("data-cb-func")?.asString?.lowercase()
      if (funcLower != null &&
          (funcLower.contains("html.setattribute") || funcLower.contains("html_setattribute")) &&
          props.get("data-cb-name")?.asString?.equals("title", ignoreCase = true) == true &&
          props.get("data-cb-toset")?.asString?.contains("pflichtfeld", ignoreCase = true) ==
              true) {
        props.addProperty("required", "1")
        props.remove("data-cb-func")
        props.remove("data-cb-name")
        props.remove("data-cb-toset")
        logger.info(
            "[AICodBiAssistant] Converted 'html.setattribute title=Pflichtfeld' on '{}' to required=1",
            props.get("name")?.asString)
      }

      val cbKeys = props.entrySet().filter { it.key.startsWith("data-cb-") }.map { it.key }
      if (cbKeys.isEmpty()) continue

      val cleanAttrs =
          if (props.has("attributes") && props.get("attributes").isJsonArray) {
            props.getAsJsonArray("attributes")
          } else {
            JsonArray().also { props.add("attributes", it) }
          }
      for (key in cbKeys) {
        var value = if (props.get(key)?.isJsonPrimitive == true) props.get(key).asString else null
        if (value != null) {
          // Decode common Unicode escapes that some AI models produce (e.g. \u003e â†’ >)
          value = decodeUnicodeEscapes(value)
          val attrObj = JsonObject()
          attrObj.addProperty("text", key)
          attrObj.addProperty("value", value)
          cleanAttrs.add(attrObj)
        }
        props.remove(key)
      }
    }
    // --- Ensure accordion members have a consistent initial folded state ---
    // The accordion membership classes (CodBi_Accordion_A..D) group panels so only one is open at a
    // time. Panels default to unfolded (open). When the model sets the Formcycle "open" property
    // (open=1/0) instead of the CodBi data-cb-folded attribute, map it onto data-cb-folded so the
    // accordion actually works; when no member expresses the state, default to the first member
    // open
    // and every other member folded (data-cb-folded="true").
    val accordionMembers = mutableMapOf<String, MutableList<JsonObject>>()
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val cssArr = props.getAsJsonArray("cssclasses") ?: continue
      for (i in 0 until cssArr.size()) {
        val c = cssArr.get(i)
        if (!c.isJsonPrimitive) continue
        val cls = c.asString
        for (letter in listOf("A", "B", "C", "D")) {
          if (cls == "CodBi_Accordion_$letter") {
            accordionMembers.getOrPut(letter) { mutableListOf() }.add(el.asJsonObject)
            break
          }
        }
      }
    }
    for ((letter, members) in accordionMembers) {
      if (members.isEmpty()) continue
      fun attrsOf(m: JsonObject): JsonArray {
        val p = m.getAsJsonObject("properties")
        return if (p.has("attributes") && p.get("attributes").isJsonArray)
            p.getAsJsonArray("attributes")
        else JsonArray().also { p.add("attributes", it) }
      }
      fun foldedAttrValue(m: JsonObject): Boolean? {
        for (e in attrsOf(m)) {
          if (e.isJsonObject && e.asJsonObject.get("text")?.asString == "data-cb-folded") {
            return e.asJsonObject.get("value")?.asString.equals("true", ignoreCase = true)
          }
        }
        return null
      }
      fun formOpenValue(m: JsonObject): Boolean? {
        val v = m.getAsJsonObject("properties").get("open")?.asString
        return when {
          v == null -> null
          v == "1" || v.equals("true", ignoreCase = true) -> true
          else -> false
        }
      }
      // Determine the member that should be open initially: the one the model marked open
      // (Formcycle
      // "open"=1) or explicitly not folded, otherwise the first member.
      val openMember =
          members.firstOrNull { formOpenValue(it) == true }
              ?: members.firstOrNull { foldedAttrValue(it) == false }
              ?: members.first()
      // Default every non-open member to folded (data-cb-folded="true").
      for (member in members) {
        if (member === openMember) continue
        if (foldedAttrValue(member) == null) {
          val attr = JsonObject()
          attr.addProperty("text", "data-cb-folded")
          attr.addProperty("value", "true")
          attrsOf(member).add(attr)
          logger.info(
              "[AICodBiAssistant] Added data-cb-folded=\"true\" to accordion member (CodBi_Accordion_{})",
              letter)
        }
      }
      // Ensure the open member is not folded.
      if (foldedAttrValue(openMember) == true) {
        for (e in attrsOf(openMember)) {
          if (e.isJsonObject && e.asJsonObject.get("text")?.asString == "data-cb-folded") {
            e.asJsonObject.addProperty("value", "false")
          }
        }
      }
    }
    // Normalize AI Chat MailAddress hiddenif values â€” the AI often generates
    // the wrong format. Formcycle stores the condition as:
    //   hiddenif = the MailForward checkbox's ID (e.g. "xi-cb-aichat-mailforward")
    //   hiddenifcomp = a valid Formcycle EConditionType code (0=MANDATORY, 1=EQUAL, 2=NOT_EQUAL,
    //                  3=REGEX, 4=LESS_THAN, 5=GREATER_THAN, 6=BETWEEN, 7=LESS_OR_EQUAL,
    //                  8=GREATER_OR_EQUAL, 9=EMPTY). For the AI Chat MailAddress the correct code
    // is
    //                  9 (EMPTY) - the address is hidden while the MailForward checkbox is
    // unchecked.
    //   hiddenifclear = "false" (don't clear on hide)
    // But the AI may set hiddenif="9" (mode number) and hiddenifcomp="<name>".
    // Fix these to match Formcycle's expected format.
    try {
      var mailForwardId: String? = null
      var mailForwardName: String? = null
      val mailForwardItem =
          resultItems?.firstOrNull { el ->
            el.isJsonObject &&
                el.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("cssclasses")?.any {
                  it.isJsonPrimitive && it.asString == "AI_LLAMA_CHAT_MailForward"
                } ?: false
          }
      if (mailForwardItem != null) {
        val mfProps = mailForwardItem.asJsonObject.getAsJsonObject("properties")
        if (mfProps != null) {
          mailForwardId = mfProps.get("id")?.asString
          mailForwardName = mfProps.get("name")?.asString
        }
      }
      // Normalize all AI Chat MailAddress fields in the form
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
        val cssClasses = props.getAsJsonArray("cssclasses")
        val isMailAddressField =
            cssClasses?.any { it.isJsonPrimitive && it.asString == "AI_LLAMA_CHAT_MailAddress" }
                ?: false
        if (!isMailAddressField) continue
        var changed = false
        // The MailAddress visibility is a FIXED requirement: hidden while the MailForward checkbox
        // is UNCHECKED (empty), visible once it is CHECKED. Formcycle evaluates this via the DIRECT
        // properties hiddenif (controlling element ID) + hiddenifcomp (EConditionType code; 9 =
        // EMPTY - hidden when the controlling field has no value) + hiddenifclear. Guarantee these
        // direct properties on the MailAddress item so the designer shows the condition and the
        // runtime behaves correctly, regardless of what the AI emitted (it often omits them, swaps
        // the fields, or sets hiddenifcomp=0/MANDATORY, which yields no working hide-condition).
        // Fix 1: hiddenif MUST be the MailForward checkbox's ID, not a mode number
        if (mailForwardId != null) {
          val currentHiddenIf = props.get("hiddenif")?.asString
          if (currentHiddenIf == null || currentHiddenIf != mailForwardId) {
            logger.info(
                "[AICodBiAssistant] Set hiddenif on '{}': '{}' â†’ '{}'",
                props.get("name")?.asString ?: "<unknown>",
                currentHiddenIf ?: "<missing>",
                mailForwardId)
            props.addProperty("hiddenif", mailForwardId)
            changed = true
          }
        }
        // Fix 2: hiddenifcomp MUST be "9" (EConditionType EMPTY) for the MailAddress - the only
        // code that hides the field while the MailForward checkbox is empty/unchecked.
        val currentComp =
            props.get("hiddenifcomp")?.let { if (it.isJsonPrimitive) it.asString else null }
        if (currentComp != "9") {
          logger.info(
              "[AICodBiAssistant] Set hiddenifcomp on '{}': '{}' â†’ 9 (EMPTY)",
              props.get("name")?.asString ?: "<unknown>",
              currentComp ?: "<missing>")
          props.addProperty("hiddenifcomp", "9")
          changed = true
        }
        // Fix 3: hiddenifclear MUST be "false" (preserve the field's value when hidden)
        if (props.get("hiddenifclear")?.asString?.trim()?.lowercase() != "false") {
          logger.info(
              "[AICodBiAssistant] Set hiddenifclear on '{}' to 'false'",
              props.get("name")?.asString ?: "<unknown>")
          props.addProperty("hiddenifclear", "false")
          changed = true
        }
        if (changed) {
          logger.info(
              "[AICodBiAssistant] MailAddress field '{}' normalized for Formcycle hidden condition",
              props.get("name")?.asString ?: "<unknown>")
        }
      }
      // OPTION-GATED CONTAINER — the AI often puts the hiddenif on the inner FIELD (e.g. the
      // XUpload)
      // instead of on the wrapping XContainer, leaving the empty container VISIBLE so the upload
      // keeps showing even though the condition exists. Per the CodBi rule the CONTAINER is the
      // target of conditional visibility. As a safety net, when a container holds exactly ONE child
      // and that child carries a hiddenif condition (hiddenif + hiddenifcomp + hiddenifvalue) while
      // the container has none, MOVE the condition to the container and drop it from the child.
      val itemByName = mutableMapOf<String, JsonObject>()
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val name =
            el.asJsonObject
                .getAsJsonObject("properties")
                ?.get("name")
                ?.takeIf { it.isJsonPrimitive }
                ?.asString ?: continue
        itemByName[name] = el.asJsonObject
      }
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val container = el.asJsonObject
        if (container.get("className")?.asString != "XContainer" &&
            container.get("className")?.asString != "XContainerInvisible" &&
            container.get("className")?.asString != "XFieldSet") {
          continue
        }
        val cProps = container.getAsJsonObject("properties") ?: continue
        val elements = cProps.getAsJsonArray("elements") ?: continue
        if (elements.size() != 1) continue // only single-child wrappers
        val childName = elements.get(0).takeIf { it.isJsonPrimitive }?.asString ?: continue
        val child = itemByName[childName] ?: continue
        val childProps = child.getAsJsonObject("properties") ?: continue
        val childHiddenIf = childProps.get("hiddenif")?.takeIf { it.isJsonPrimitive }?.asString
        // The child has a real hidden condition (a controlling ID) and the container has none.
        if (childHiddenIf.isNullOrBlank()) continue
        if (cProps.has("hiddenif") &&
            cProps.get("hiddenif")?.takeIf { it.isJsonPrimitive }?.asString?.isNotBlank() == true) {
          continue
        }
        // Move the FULL condition (hiddenif, hiddenifcomp, hiddenifvalue, hiddenifclear) — the
        // controlling ID, the EConditionType code AND the comparison value must travel together,
        // otherwise the container gets a condition with no value to compare against.
        for (key in setOf("hiddenif", "hiddenifcomp", "hiddenifvalue", "hiddenifclear")) {
          val v = childProps.get(key)
          if (v != null) cProps.add(key, v.deepCopy())
          childProps.remove(key)
        }
        logger.info(
            "[AICodBiAssistant] Moved hidden condition (hiddenif='{}') from leaf '{}' to wrapping container '{}'",
            childHiddenIf,
            childName,
            cProps.get("name")?.asString ?: cProps.get("id")?.asString ?: "<unknown>")
      }
    } catch (_: Exception) {
      /* non-critical â€” skip normalization on error */
    }
    return gson.toJson(result)
  }

  /**
   * Merges the AI result's top-level `variables` array into [result] by **name**. Global variables
   * are form-level entries of the form's `variables` array (each `{ "name": "...", "aliasname":
   * "...", "serveronly": false, "value": "..." }`). Entries that already exist in [result] are
   * updated in place (preserving their `id`/`idx`), new entries are appended, and entries the AI
   * did not mention are left untouched — so setting one global variable never wipes the others.
   *
   * @param result The target form JSON object (starts from the original).
   * @param aiObj The AI result object.
   */
  private fun mergeFormVariables(result: JsonObject, aiObj: JsonObject) {
    val aiVars = aiObj.get("variables")?.takeIf { it.isJsonArray }?.asJsonArray ?: return
    if (aiVars.size() == 0) return
    val resultVars =
        result.get("variables")?.takeIf { it.isJsonArray }?.asJsonArray
            ?: JsonArray().also { result.add("variables", it) }
    val byName = mutableMapOf<String, JsonObject>()
    for (el in resultVars) {
      if (!el.isJsonObject) continue
      val name = el.asJsonObject.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      byName[name] = el.asJsonObject
    }
    for (el in aiVars) {
      if (!el.isJsonObject) continue
      val aiVar = el.asJsonObject
      val name = aiVar.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      val existing = byName[name]
      if (existing != null) {
        // Update the existing entry in place — keep its id/idx, refresh name/aliasname/value.
        for ((key, value) in aiVar.entrySet()) existing.add(key, value)
      } else {
        resultVars.add(aiVar)
        byName[name] = aiVar
      }
    }
  }

  /**
   * Extracts the form's FORM / GLOBAL VARIABLES (the top-level `variables` array of the persist
   * JSON) as a compact, human-readable listing — e.g. `Form variables: Zielseite, Zielcontainer`.
   * Formcycle global variables are form-level entries `{ "name": ..., "value": ... }`; their value
   * is referenced elsewhere (form fields, workflow node params such as FC_POST_REQUEST) with the
   * same placeholder syntax as form fields: `[%variableName%]`. The workflow AI needs this so it
   * knows such variables exist and does not ask the user whether to create hidden form fields for
   * them.
   */
  private fun extractFormVariablesFromJson(formJson: String?): String? {
    if (formJson.isNullOrBlank()) return null
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val variables = root.get("variables")?.takeIf { it.isJsonArray }?.asJsonArray ?: return null
      val names = mutableListOf<String>()
      for (el in variables) {
        if (!el.isJsonObject) continue
        val name = el.asJsonObject.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
        if (name.isNotBlank()) names.add(name)
      }
      if (names.isEmpty()) null else names.joinToString(", ")
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] Failed to extract form variables from form JSON: {}", e.message)
      null
    }
  }

  /**
   * Decodes common Unicode escape sequences that some AI models produce in JSON string values. For
   * example, `\u003e` (Unicode escape for `>`) is decoded to `>`. This ensures element placeholders
   * like {BayVIS.Behoerden>bezeichnung} are not corrupted when the AI escapes the `>` character as
   * `\u003e`.
   */
  private fun decodeUnicodeEscapes(value: String): String {
    return value.replace(Regex("\\\\u([0-9a-fA-F]{4})")) { matchResult ->
      val hex = matchResult.groupValues[1]
      Integer.parseInt(hex, 16).toChar().toString()
    }
  }

  /**
   * Strips any `Holistic.*` entry from every item's `cssclasses` array. `Holistic.*` names are
   * CodBi Standard Configuration ids (e.g. `Holistic.CSS.Standard`, `Holistic.Matomo.Tracking`,
   * `Holistic.Media.Input.Speech`, `Holistic.Cleave.Date`) that are activated at the FORM level via
   * the CodBi section of the form properties (the `codbi-prop-standards` CSV). They must never be
   * placed on an element's `cssclasses`, because Formcycle would then render a bogus, non-existent
   * CSS class on the widget. See `computeUpdatedStandards` for how the actual standard activation
   * is derived (Mechanisms 1–3), which does NOT depend on these classes being present here.
   *
   * @param resultItems The flat `items` array of the form JSON to scan in place.
   */
  private fun stripHolisticStandardClasses(resultItems: JsonArray) {
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val cssClasses = props.getAsJsonArray("cssclasses") ?: continue
      var removed = false
      val kept = JsonArray()
      for (i in 0 until cssClasses.size()) {
        val c = cssClasses.get(i)
        if (c.isJsonPrimitive && c.asString.startsWith("Holistic.")) {
          removed = true
          continue
        }
        kept.add(c)
      }
      if (removed) {
        props.add("cssclasses", kept)
        logger.info(
            "[AICodBiAssistant] Stripped Holistic.* standard-config classes from '{}' (activated via codbi-prop-standards, not as widget CSS)",
            props.get("name")?.asString ?: "<unknown>")
      }
    }
  }

  /**
   * Computes which of the four auto-managed Holistic.Cleave.* configurations should be active,
   * based solely on the field datatypes present in the given form persist JSON.
   *
   * @return Map of config name â†’ `true` (should be active) / `false` (should not be active).
   */
  private fun computeCleaveConditions(formJson: String): Map<String, Boolean> {
    var hasDate = false
    var hasPhone = false
    var hasPlz = false
    var hasTime = false
    try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items = root.getAsJsonArray("items")
      if (items != null) {
        for (item in items) {
          if (!item.isJsonObject) continue
          val obj = item.asJsonObject
          if (obj.get("className")?.asString != "XTextField") continue
          val datatype = obj.getAsJsonObject("properties")?.get("datatype")?.asString ?: ""
          when {
            datatype.startsWith("date") -> hasDate = true
            datatype == "phone" -> hasPhone = true
            datatype == "plzDE" -> hasPlz = true
            datatype == "time" -> hasTime = true
          }
        }
      }
    } catch (_: Exception) {
      /* malformed JSON â€” all conditions stay false */
    }
    return linkedMapOf(
        "Holistic.Cleave.Date" to hasDate,
        "Holistic.Cleave.Phone" to hasPhone,
        "Holistic.Cleave.PLZ" to hasPlz,
        "Holistic.Cleave.Time" to hasTime)
  }

  /**
   * Maps a CSS class name (or prefix) to its owning CodBi standard configuration. Used by
   * [computeUpdatedStandards] to auto-activate standards based on which CSS classes the AI placed
   * on form elements.
   */
  private val CSS_CLASS_TO_STANDARD: List<Pair<String, String>> =
      listOf(
          // People standard (includes fotocropper and OpenPLZ select dropdown classes)
          "CodBi_People_" to "People",
          "CodBi_Fotocropper" to "People",
          "CodBi_OpenPLZ_Select_" to "People",
          // OpenPLZ.AC.SET standard (plain OpenPLZ autocomplete-set classes)
          "CodBi_OpenPLZ_AC_SET_" to "OpenPLZ.AC.SET",
          // Financial standard
          "CodBi_Currency" to "Financial",
          "CodBi_TRANS_" to "Financial",
          // Appointments standard
          "CodBi_DateFrame_" to "Appointments",
          "CodBi_TimeFrame_" to "Appointments",
          "CodBi_NoFutureDate" to "Appointments",
          "CodBi_Holidays_" to "Appointments",
          "CodBi_Date_Time_Join_" to "Appointments",
          // LDAP.Autofill standard
          "CodBi_LDAP_" to "LDAP.Autofill",
          // AI standard
          "AI_LLAMA_" to "AI",
          "AI_OCR_" to "AI",
          "CodBi_AI_OCR_" to "AI",
          // BayVIS standard
          "CodBi_BayVIS_" to "BayVIS",
          // Print.Removal standard
          "CodBi_Print_" to "Print.Removal",
          // UI.Panels standard
          "CodBi_HTML_Panel_" to "UI.Panels",
          "CodBi_Accordion_" to "UI.Panels")

  /**
   * Scans all items in the modified form JSON for CSS classes (stored in properties.cssclasses) and
   * returns the set of standard configuration names that should be activated.
   */
  private fun computeStandardsFromCssClasses(modifiedFormJson: String): Set<String> {
    val needed = mutableSetOf<String>()
    try {
      val root = JsonParser.parseString(modifiedFormJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return needed
      for (item in items) {
        if (!item.isJsonObject) continue
        val props = item.asJsonObject.getAsJsonObject("properties") ?: continue
        val cssClasses = props.getAsJsonArray("cssclasses") ?: continue
        for (cssEl in cssClasses) {
          if (!cssEl.isJsonPrimitive) continue
          val cssClass = cssEl.asString
          for ((prefixOrName, standard) in CSS_CLASS_TO_STANDARD) {
            if (cssClass == prefixOrName || cssClass.startsWith(prefixOrName)) {
              needed.add(standard)
            }
          }
        }
      }
    } catch (_: Exception) {
      /* malformed JSON â€” no standards from CSS classes */
    }
    return needed
  }

  /**
   * Computes the updated set of active CodBi standard configurations after a form modification.
   *
   * Two independent mechanisms are combined:
   * 1. **Holistic.Cleave.* auto-management** â€” activated/deactivated based on field datatypes
   *    present in the form (dates â†’ Cleave.Date, phone â†’ Cleave.Phone, etc.).
   * 2. **CSS-class-based auto-activation** â€” standards are activated when the AI placed a
   *    matching CSS class (e.g. `CodBi_People_Name`) on any form element. This ensures the standard
   *    configuration is active so its JavaScript runs at render time.
   *
   * For each Holistic.Cleave.* config the decision is:
   * - If the current active state **matches** what [aiSetStandards] records as the AI's last set
   *   value (or [aiSetStandards] is `null` = first AI run) â†’ AI is in control â†’ update to match
   *   the field types present in [modifiedFormJson].
   * - If the current active state **differs** from [aiSetStandards] â†’ the user manually overrode
   *   it since the last AI run â†’ leave it unchanged.
   *
   * Non-Cleave configurations are never removed automatically â€” they are only added when CSS
   * classes referencing them are found in the form.
   *
   * @param modifiedFormJson The form persist JSON after the AI modification.
   * @param currentStandards The current CSV value of the `codbi-prop-standards` form property.
   * @param aiSetStandards The full standards CSV the AI set on its most recent prior run, or `null`
   *   when the AI has never run before (first-run mode).
   * @return Updated CSV to be stored as `codbi-prop-standards`.
   */
  private fun computeUpdatedStandards(
      modifiedFormJson: String,
      currentStandards: String,
      aiSetStandards: String?,
      applicabilityReport: String? = null
  ): String {
    val active =
        currentStandards.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toMutableList()
    // System standard configurations (e.g. Holistic.Cleave.*) whose prompt was deactivated in the
    // Prompt Manager are never auto-applied; deactivated configs are also removed from the active
    // set. Missing records (seed not run yet) are treated as enabled.
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    val enabledHolistic =
        try {
          PromptLoader.activeSystemStandardConfigs(em)
        } finally {
          em?.close()
        }
    return try {
      // --- Mechanism 1: Holistic.Cleave.* auto-management ---
      // When aiSetStandards is null (first AI run this session), AI is in control of ALL
      // Cleave configs â€” apply the new conditions unconditionally regardless of current state.
      if (aiSetStandards == null) {
        val after = computeCleaveConditions(modifiedFormJson)
        for ((config, shouldBeAfter) in after) {
          // Respect Prompt Manager deactivation of the corresponding system prompt.
          if (config !in enabledHolistic) {
            if (config in active) {
              active.remove(config)
              logger.info(
                  "[AICodBiAssistant] Removed deactivated system standard config '{}'", config)
            }
            continue
          }
          if (shouldBeAfter && config !in active) active.add(config)
          else if (!shouldBeAfter && config in active) active.remove(config)
        }
      } else {
        val aiSet = aiSetStandards.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()
        val after = computeCleaveConditions(modifiedFormJson)
        for ((config, shouldBeAfter) in after) {
          // Respect Prompt Manager deactivation of the corresponding system prompt.
          if (config !in enabledHolistic) {
            if (config in active) {
              active.remove(config)
              logger.info(
                  "[AICodBiAssistant] Removed deactivated system standard config '{}'", config)
            }
            continue
          }
          val wasAiOn = config in aiSet
          val isActive = config in active
          // Same state as AI last set â†’ AI is still in control â†’ apply the new condition.
          // Different state â†’ user overrode it since the last AI run â†’ respect their choice.
          if (wasAiOn == isActive) {
            if (shouldBeAfter && !isActive) active.add(config)
            else if (!shouldBeAfter && isActive) active.remove(config)
          }
        }
      }
      // --- Mechanism 2: CSS-class-based auto-activation ---
      // Scan all items for cssclasses and activate the corresponding standards.
      // Non-Cleave standards are never removed â€” only added when CSS class usage is detected.
      val standardsFromCss = computeStandardsFromCssClasses(modifiedFormJson)
      for (standard in standardsFromCss) {
        if (standard !in active) {
          active.add(standard)
          logger.info(
              "[AICodBiAssistant] Auto-activated standard '{}' because matching CSS class was found in form items",
              standard)
        }
      }
      // --- Mechanism 3: Standard configurations explicitly listed by the AI in _codbiApplicability
      // ---
      // The AI can request standard activation by including the standard name in the "applied"
      // array. Known system standard configs are only honored when their prompt is active.
      if (!applicabilityReport.isNullOrBlank()) {
        try {
          val reportObj = JsonParser.parseString(applicabilityReport).asJsonObject
          val appliedArr = reportObj.getAsJsonArray("applied")
          if (appliedArr != null) {
            for (entry in appliedArr) {
              if (!entry.isJsonObject) continue
              val id = entry.asJsonObject.get("id")?.asString ?: continue
              if (id.startsWith("Holistic.") &&
                  id !in active &&
                  (id !in PromptLoader.SYSTEM_CONFIG_NAMES || id in enabledHolistic)) {
                active.add(id)
                logger.info(
                    "[AICodBiAssistant] Activated standard '{}' requested by AI in _codbiApplicability",
                    id)
              }
            }
          }
        } catch (_: Exception) {
          logger.warn(
              "[AICodBiAssistant] Failed to parse applicabilityReport for standards: {}",
              applicabilityReport.take(200))
        }
      }
      active.joinToString(",")
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to compute updated standards: {}", e.message)
      currentStandards
    }
  }

  // endregion Form Modification

  // region Workflow Creation

  /**
   * Builds a compact, human-readable structural summary of the current form from its persist JSON:
   * pages → fieldsets/containers → interactive fields and buttons, each with its `name` and a
   * friendly title (legend for fieldsets, label for fields, value for buttons). The clarification
   * AI uses this to resolve references to existing elements (e.g. "the two fieldsets on the first
   * page") WITHOUT asking the user which elements are meant. Returns null when the JSON cannot be
   * parsed or yields nothing.
   */
  private fun buildFormStructureContext(persistJson: String?): String? {
    if (persistJson.isNullOrBlank()) return null
    val stripHtml = Regex("<[^>]*>")
    val clean: (JsonElement?) -> String = { el ->
      el?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }
          ?.asString
          ?.let { stripHtml.replace(it, "").replace(Regex("\\s+"), " ").trim() } ?: ""
    }
    val truthy: (JsonElement?) -> Boolean = { el ->
      el != null &&
          !el.isJsonNull &&
          el.isJsonPrimitive &&
          (el.asString == "1" || el.asString == "true" || el.asString == "yes")
    }
    // Compact "already configured" flags for one element's properties, so the AI does not propose
    // optimizations the form already implements (required fields, conditional visibility,
    // validations, readonly).
    fun configFlags(props: JsonObject): List<String> {
      val flags = mutableListOf<String>()
      if (truthy(props.get("required")) ||
          (props.get("requiredifcomp") != null && !props.get("requiredifcomp").isJsonNull) ||
          (props.get("requiredifclear") != null && !props.get("requiredifclear").isJsonNull)) {
        flags.add("required")
      }
      // Conditional visibility / readonly / required conditions ("*if*" properties with a value).
      val conditionishPrefixes = listOf("hidden", "readonly", "required", "visible", "show")
      for (k in props.keySet().sorted()) {
        if (!k.contains("if")) continue
        if (!conditionishPrefixes.any { k.contains(it) }) continue
        val v = clean(props.get(k))
        if (v.isNotBlank()) flags.add("$k=${v.take(70)}")
      }
      // Validation / input constraints.
      for (k in listOf("regex", "validate")) {
        val v = props.get(k)
        if (v != null && !v.isJsonNull && !(v.isJsonPrimitive && v.asString.isBlank())) flags.add(k)
      }
      if (truthy(props.get("readonly"))) flags.add("readonly")
      return flags
    }
    fun titleOf(className: String, props: JsonObject): String {
      val candidates =
          when (className) {
            "XFieldSet" -> listOf("legend", "label", "title")
            "XPage",
            "XHeader",
            "XFooter",
            "XAppointment" -> listOf("label", "title")
            "XButtonList" -> emptyList()
            else -> listOf("label", "title", "text")
          }
      for (c in candidates) {
        val v = clean(props.get(c))
        if (v.isNotBlank()) return v
      }
      return ""
    }
    fun typeName(className: String): String =
        when (className) {
          "XPage" -> "Page"
          "XFieldSet" -> "FieldSet"
          "XContainer" -> "Container"
          "XContainerInvisible" -> "Invisible container"
          "XHeader" -> "Header"
          "XFooter" -> "Footer"
          "XButtonList" -> "Buttons"
          else -> className.removePrefix("X")
        }
    val lines = mutableListOf<String>()
    fun walk(items: JsonArray, indent: String) {
      for (item in items) {
        if (!item.isJsonObject) continue
        val obj = item.asJsonObject
        val className = obj.get("className")?.asString ?: continue
        val props = obj.getAsJsonObject("properties") ?: continue
        val name = clean(props.get("name"))
        if (className == "XButtonList") {
          val buttons = props.getAsJsonArray("buttons")
          if (buttons == null) continue
          for (btn in buttons) {
            if (!btn.isJsonObject) continue
            val b = btn.asJsonObject
            val bName = clean(b.get("name"))
            val bLabel = clean(b.get("value"))
            if (bName.isBlank() && bLabel.isBlank()) continue
            val shown = if (bLabel.isNotBlank()) "\"$bLabel\"" else bName
            val suffix = if (bName.isNotBlank() && shown != bName) " (name: $bName)" else ""
            lines.add("$indent- Button $shown$suffix")
          }
          continue
        }
        val title = titleOf(className, props)
        val label =
            when {
              title.isNotBlank() && name.isNotBlank() -> "\"$title\" (name: $name)"
              title.isNotBlank() -> "\"$title\""
              name.isNotBlank() -> "(name: $name)"
              else -> ""
            }
        val flags = configFlags(props)
        val flagText = if (flags.isEmpty()) "" else " [" + flags.joinToString("; ") + "]"
        lines.add("$indent- ${typeName(className)} $label$flagText".trimEnd())
        if (className in
            setOf(
                "XPage", "XFieldSet", "XContainer", "XContainerInvisible", "XHeader", "XFooter")) {
          val elements = props.getAsJsonArray("elements")
          if (elements != null && elements.size() > 0) walk(elements, "$indent  ")
        }
      }
    }
    return try {
      val root = JsonParser.parseString(persistJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return null
      walk(items, "")
      if (lines.isEmpty()) null else lines.joinToString("\n")
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not build form structure context: {}", e.message)
      null
    }
  }

  /**
   * Builds a compact list of the form's REPEATABLE (dynamic) containers and the fields they
   * contain, from the persist JSON. The workflow AI uses this to know which [%field%] placeholders
   * belong to a repeatable container — a plain placeholder only returns the FIRST row, so content
   * that must include ALL rows (e.g. an email with "the opening times") has to iterate the
   * container.
   */
  private fun buildRepeatableContainersContext(persistJson: String?): String? {
    if (persistJson.isNullOrBlank()) return null
    return try {
      val root = JsonParser.parseString(persistJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return null
      val lines = mutableListOf<String>()
      fun walk(list: JsonArray) {
        for (item in list) {
          if (!item.isJsonObject) continue
          val obj = item.asJsonObject
          val className = obj.get("className")?.asString ?: continue
          val props = obj.getAsJsonObject("properties") ?: continue
          val name = props.get("name")?.asString ?: continue
          val elements = props.getAsJsonArray("elements")
          val dynamic = props.get("dynamic")?.asString
          if (dynamic == "1" && className in setOf("XContainer", "XContainerInvisible")) {
            val childNames = mutableListOf<String>()
            if (elements != null) {
              for (ref in elements) {
                when {
                  ref.isJsonPrimitive -> childNames.add(ref.asString)
                  ref.isJsonObject -> {
                    val cn = ref.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
                    if (cn != null) childNames.add(cn)
                  }
                }
              }
            }
            lines.add("Repeatable container '$name' contains: ${childNames.joinToString(", ")}")
          }
          if (elements != null) walk(elements)
        }
      }
      walk(items)
      if (lines.isEmpty()) null else lines.joinToString("\n")
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not build repeatable containers context: {}", e.message)
      null
    }
  }

  /**
   * Extracts interactive form elements (input fields + buttons) from a form persist JSON string.
   * Returns a compact JSON array whose entries match the FormElement TypeScript interface, or null
   * if the JSON cannot be parsed. Used to give the workflow AI up-to-date context after the form AI
   * has modified the form in the "both" intent flow.
   */
  private fun extractFormElementsFromJson(formJson: String): String? {
    val interactiveClasses =
        setOf(
            "XTextField",
            "XTextArea",
            "XUpload",
            "XSelect",
            "XCheckbox",
            "XSignature",
            "XAppointment")
    val stripHtml = Regex("<[^>]*>")
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return null
      val elements = mutableListOf<Map<String, Any>>()
      for (item in items) {
        val obj = item.asJsonObject
        val className = obj.get("className")?.asString ?: continue
        val props = obj.getAsJsonObject("properties") ?: continue
        when {
          className == "XButtonList" -> {
            val buttons = props.getAsJsonArray("buttons") ?: continue
            for (btn in buttons) {
              val btnObj = btn.asJsonObject
              val name = btnObj.get("name")?.asString?.takeIf { it.isNotBlank() } ?: continue
              val el = mutableMapOf<String, Any>("technicalId" to name, "type" to "BUTTON")
              val displayText =
                  btnObj.get("value")?.asString?.let { stripHtml.replace(it, "").trim() } ?: ""
              if (displayText.isNotBlank()) el["displayText"] = displayText
              val action = btnObj.getAsJsonObject("action")
              val page = action?.get("page")?.asString ?: ""
              if (page.isNotBlank()) el["actionPage"] = page
              elements.add(el)
            }
          }
          className in interactiveClasses -> {
            val name = props.get("name")?.asString?.takeIf { it.isNotBlank() } ?: continue
            val el = mutableMapOf<String, Any>("technicalId" to name, "type" to className)
            val label = props.get("label")?.asString?.let { stripHtml.replace(it, "").trim() } ?: ""
            if (label.isNotBlank()) el["displayText"] = label
            if (props.get("required")?.asString == "1") el["required"] = true
            val placeholder = props.get("placeholder")?.asString?.trim() ?: ""
            if (placeholder.isNotBlank()) el["placeholder"] = placeholder
            if (className == "XSelect") {
              val options = props.getAsJsonArray("options")
              if (options != null && options.size() > 0) {
                val opts =
                    options.mapNotNull { opt ->
                      val o = opt.asJsonObject
                      val text =
                          o.get("text")?.asString?.let { stripHtml.replace(it, "").trim() } ?: ""
                      val value = o.get("value")?.asString ?: ""
                      if (text.isNotBlank() || value.isNotBlank())
                          mapOf("text" to text, "value" to value)
                      else null
                    }
                if (opts.isNotEmpty()) el["options"] = opts
              }
            }
            elements.add(el)
          }
        }
      }
      gson.toJson(elements)
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] Failed to extract form elements from form JSON: {}", e.message)
      null
    }
  }

  /**
   * Queries the database for available Abschlussseiten (completion pages) for the given workflow
   * version's project. Uses JPQL with FORMCYCLE entity class names first (most reliable), then
   * falls back to native SQL with schema-discovery.
   *
   * @return A compact JSON array string like `[{"name":"Standard-Fehlerseite","uuid":"..."},...]`,
   *   or `null` if the query fails.
   */
  private fun fetchCompletionPages(userContext: Any, workflowVersionId: Long): String? {
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId) ?: return null
      val project =
          workflowVersion.javaClass.getMethod("getProject").invoke(workflowVersion) ?: return null
      val projectId = project.javaClass.getMethod("getId").invoke(project) as? Long ?: return null

      val emf = CodbiEntities.entityManagerFactory ?: return null
      val em = emf.createEntityManager()
      try {
        // Try JPQL navigating from Projekt entity to discover completion pages
        val projektCollectionProperties =
            listOf(
                "p.abschlussSeiten",
                "p.completionPages",
                "p.projektAbschlussSeiten",
                "p.absclussSeiten")
        for (collectionPath in projektCollectionProperties) {
          try {
            val jpql =
                "SELECT cp FROM de.xima.fc.entities.Projekt p JOIN $collectionPath cp WHERE p.id = :pid"
            val query = em.createQuery(jpql)
            query.setParameter("pid", projectId)
            query.maxResults = 100
            @Suppress("UNCHECKED_CAST") val results = query.resultList as? List<Any> ?: continue
            if (results.isEmpty()) continue
            val pages =
                results.mapNotNull { cp ->
                  try {
                    val nameMethod = cp.javaClass.getMethod("getName")
                    val uuidMethod = cp.javaClass.getMethod("getUUIDObject")
                    val name = nameMethod.invoke(cp) as? String ?: return@mapNotNull null
                    val uuid = uuidMethod.invoke(cp) as? UUID ?: return@mapNotNull null
                    """{"name":${gson.toJson(name)},"uuid":${gson.toJson(uuid.toString())}}"""
                  } catch (_: Exception) {
                    null
                  }
                }
            if (pages.isEmpty()) continue
            val json = "[${pages.joinToString(",")}]"
            logger.debug(
                "[AICodBiAssistant] Found {} completion pages via Projekt collection '$collectionPath' for project $projectId: {}",
                pages.size,
                json)
            return json
          } catch (_: Exception) {
            continue
          }
        }

        // Strategy 2: Try JPQL with standalone entity class names
        val entityClasses =
            listOf(
                "de.xima.fc.entities.ProjectDOIData",
                "de.xima.fc.entities.CompletionPage",
                "de.xima.fc.entities.ProjektAbschlussSeite",
                "de.xima.fc.entities.AbschlussSeite",
                "de.xima.fc.entities.ProjektAbschluss",
                "de.xima.fc.entities.Abschluss")
        for (entityClass in entityClasses) {
          try {
            val countQuery = em.createQuery("SELECT COUNT(cp) FROM $entityClass cp")
            val totalCount = (countQuery.singleResult as? Number)?.toLong() ?: 0L
            if (totalCount == 0L) continue
            val fetchQuery = em.createQuery("SELECT cp FROM $entityClass cp")
            fetchQuery.maxResults = 200
            @Suppress("UNCHECKED_CAST")
            val allResults = (fetchQuery.resultList as? List<Any>) ?: continue
            if (allResults.isEmpty()) continue
            val first = allResults[0]
            val methods = first.javaClass.methods
            // Try to find the project by dynamically checking for projektId/projectId
            val filteredResults =
                if (entityClass.contains("ProjectDOIData")) {
                  val possibleProjectIdGetters = listOf("getProjektId", "getProjectId")
                  var projectIdField: java.lang.reflect.Method? = null
                  for (getterName in possibleProjectIdGetters) {
                    try {
                      projectIdField = first.javaClass.getMethod(getterName)
                      break
                    } catch (_: Exception) {}
                  }
                  if (projectIdField != null) {
                    allResults.filter { cp ->
                      try {
                        projectIdField.invoke(cp)?.toString() == projectId.toString()
                      } catch (_: Exception) {
                        false
                      }
                    }
                  } else {
                    val projectRefGetters =
                        methods.filter { m ->
                          m.name.startsWith("get") &&
                              m.parameterCount == 0 &&
                              (m.name.contains("Projekt", ignoreCase = true) ||
                                  m.name.contains("Project", ignoreCase = true))
                        }
                    if (projectRefGetters.isNotEmpty()) {
                      allResults.filter { cp ->
                        projectRefGetters.any { getter ->
                          try {
                            val ref = getter.invoke(cp)
                            if (ref == null) false
                            else
                                try {
                                  ref.javaClass.getMethod("getId").invoke(ref)?.toString() ==
                                      projectId.toString()
                                } catch (_: Exception) {
                                  ref.toString() == projectId.toString()
                                }
                          } catch (_: Exception) {
                            false
                          }
                        }
                      }
                    } else allResults
                  }
                } else {
                  try {
                    val jpql =
                        "SELECT cp FROM $entityClass cp WHERE cp.project.id = :pid OR cp.projekt.id = :pid"
                    val q = em.createQuery(jpql)
                    q.setParameter("pid", projectId)
                    q.maxResults = 100
                    @Suppress("UNCHECKED_CAST")
                    q.resultList as? List<Any> ?: continue
                  } catch (_: Exception) {
                    allResults
                  }
                }
            if (filteredResults.isEmpty()) continue
            val pages =
                filteredResults.mapNotNull { cp ->
                  try {
                    var name: String? = null
                    try {
                      name = cp.javaClass.getMethod("getName").invoke(cp) as? String
                    } catch (_: Exception) {}
                    if (name == null) {
                      try {
                        name = cp.javaClass.getMethod("getTemplateName").invoke(cp) as? String
                      } catch (_: Exception) {}
                    }
                    if (name == null) {
                      val strGetters =
                          methods.filter { m ->
                            m.returnType == String::class.java &&
                                (m.name.contains("ame", ignoreCase = true) ||
                                    m.name.contains("itle", ignoreCase = true) ||
                                    m.name.contains("ezeichnung", ignoreCase = true))
                          }
                      name = strGetters.firstOrNull()?.invoke(cp) as? String
                    }
                    val nm = name ?: return@mapNotNull null
                    val uuidObj: UUID? =
                        try {
                          cp.javaClass.getMethod("getUUIDObject").invoke(cp) as? UUID
                        } catch (_: Exception) {
                          try {
                            val uuidStr = cp.javaClass.getMethod("getUuid").invoke(cp) as? String
                            if (uuidStr != null) UUID.fromString(uuidStr) else null
                          } catch (_: Exception) {
                            try {
                              val id = cp.javaClass.getMethod("getId").invoke(cp) as? Number
                              if (id != null) UUID.nameUUIDFromBytes(id.toString().toByteArray())
                              else null
                            } catch (_: Exception) {
                              null
                            }
                          }
                        }
                    val uu = uuidObj ?: return@mapNotNull null
                    """{"name":${gson.toJson(nm)},"uuid":${gson.toJson(uu.toString())}}"""
                  } catch (_: Exception) {
                    null
                  }
                }
            if (pages.isNotEmpty()) {
              val json = "[${pages.joinToString(",")}]"
              logger.debug(
                  "[AICodBiAssistant] Found {} completion pages via JPQL entity '$entityClass' for project $projectId: {}",
                  pages.size,
                  json)
              return json
            }
          } catch (_: Exception) {
            continue
          }
        }

        // Strategy 3: Native SQL - query known tables for UUID + name pairs
        val possibleTables =
            listOf(
                "PROJECT_DOI_DATA",
                "TEMPLATE_CLIENT",
                "FORM_TEMPLATE",
                "COMPLETION_PAGE",
                "PROJEKT_ABSCHLUSS_SEITE",
                "PROJEKTABSCHLUSSSEITE",
                "PROJECT_COMPLETION_PAGE",
                "ABSCHLUSS_SEITE",
                "ABSCHLUSSSEITE",
                "FORM_COMPLETION_PAGE",
                "WORKFLOW_COMPLETION_PAGE",
                "PROJEKT_ABSCHLUSS",
                "PROJEKTABSCHLUSS")
        for (tableName in possibleTables) {
          try {
            val columnsQuery =
                em.createNativeQuery(
                    "SELECT column_name FROM information_schema.columns WHERE UPPER(table_name) = :tbl ORDER BY ordinal_position")
            columnsQuery.setParameter("tbl", tableName)
            val columns = columnsQuery.resultList
            if (columns.isEmpty()) continue
            val colNames = columns.map { it.toString().uppercase() }
            val hasName = colNames.any { it == "NAME" || it == "BEZEICHNUNG" || it == "TITLE" }
            val hasUuid = colNames.any { it == "UUID" }
            val projectCol =
                colNames.firstOrNull {
                  it == "PROJECT_ID" ||
                      it == "PROJEKT_ID" ||
                      it == "PROJEKTID" ||
                      it == "FK_PROJEKT"
                }
            val nameCol =
                when {
                  "NAME" in colNames -> "NAME"
                  "BEZEICHNUNG" in colNames -> "BEZEICHNUNG"
                  "TITLE" in colNames -> "TITLE"
                  else -> null
                }
            val sql: String
            if (hasName && hasUuid) {
              sql =
                  if (projectCol != null)
                      "SELECT UUID, $nameCol FROM $tableName WHERE $projectCol = :pid ORDER BY $nameCol"
                  else "SELECT UUID, $nameCol FROM $tableName ORDER BY $nameCol"
            } else if (!hasName && hasUuid) {
              sql =
                  if (projectCol != null) "SELECT UUID FROM $tableName WHERE $projectCol = :pid"
                  else "SELECT UUID FROM $tableName"
            } else if (!hasName) {
              sql =
                  if (projectCol != null) "SELECT * FROM $tableName WHERE $projectCol = :pid"
                  else "SELECT * FROM $tableName"
            } else {
              sql =
                  if (projectCol != null)
                      "SELECT ID, $nameCol FROM $tableName WHERE $projectCol = :pid ORDER BY $nameCol"
                  else "SELECT ID, $nameCol FROM $tableName ORDER BY $nameCol"
            }
            val query = em.createNativeQuery(sql)
            if (projectCol != null) query.setParameter("pid", projectId)
            val results = query.resultList
            if (results.isEmpty()) continue
            val pages =
                results.mapNotNull { row ->
                  try {
                    val arr = row as? Array<*>
                    if (arr != null && arr.size >= 2) {
                      if (sql.contains("SELECT UUID, $nameCol") ||
                          sql.contains("SELECT UUID, NAME")) {
                        val uuid = arr[0]?.toString() ?: return@mapNotNull null
                        val nm = arr[1]?.toString() ?: return@mapNotNull null
                        """{"name":${gson.toJson(nm)},"uuid":${gson.toJson(uuid)}}"""
                      } else if (sql.contains("SELECT ID, $nameCol") ||
                          sql.contains("SELECT ID, NAME")) {
                        val id = arr[0]?.toString() ?: return@mapNotNull null
                        val nm = arr[1]?.toString() ?: return@mapNotNull null
                        """{"name":${gson.toJson(nm)},"uuid":${gson.toJson(id)}}"""
                      } else null
                    } else null
                  } catch (_: Exception) {
                    null
                  }
                }
            if (pages.isNotEmpty()) {
              val json = "[${pages.joinToString(",")}]"
              logger.debug(
                  "[AICodBiAssistant] Found {} completion pages via native table '$tableName': {}",
                  pages.size,
                  json)
              return json
            }
          } catch (_: Exception) {
            continue
          }
        }

        logger.warn("[AICodBiAssistant] No completion-pages table found among: $possibleTables")
        null
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to fetch completion pages: ${e.message}")
      null
    }
  }

  /**
   * READ-ONLY scan of Formcycle's APIProvider service singletons for anything that looks like the
   * Abschlussseiten / template management service (name/type heuristics). Logs each candidate with
   * its class and public methods, so the REAL server service that creates Abschlussseiten can be
   * identified from the next server log and then invoked. Never writes anything.
   */
  private fun scanTemplateServices() {
    try {
      val apiClass = Class.forName("de.xima.fc.api.APIProvider")
      val fields =
          apiClass.fields.filter { f ->
            java.lang.reflect.Modifier.isStatic(f.modifiers) &&
                java.lang.reflect.Modifier.isPublic(f.modifiers)
          }
      var candidates = 0
      for (f in fields) {
        val value = runCatching { f.get(null) }.getOrNull() ?: continue
        val typeName = value.javaClass.name
        val interesting =
            f.name.contains("TEMPLATE", ignoreCase = true) ||
                f.name.contains("ABSCHLUSS", ignoreCase = true) ||
                f.name.contains("CONTENT", ignoreCase = true) ||
                typeName.contains("Template", ignoreCase = true) ||
                typeName.contains("Abschluss", ignoreCase = true)
        if (!interesting) continue
        candidates++
        val methods =
            value.javaClass.methods
                .sortedBy { it.name }
                .take(60)
                .joinToString(" | ") { m ->
                  m.name +
                      "(" +
                      m.parameterTypes.joinToString(",") { it.simpleName } +
                      "):" +
                      m.returnType.simpleName
                }
        logger.info(
            "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT TEMPLATE-SERVICE-CANDIDATE field={} class={} methods=[{}]",
            f.name,
            typeName,
            methods)
      }
      logger.info(
          "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT scanned {} APIProvider field(s), {} template-service candidate(s) found",
          fields.size,
          candidates)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] scanTemplateServices failed: {}", e.message)
    }
  }

  /**
   * Structural fallback for the multilingualize pass: scans the returned form JSON for per-widget
   * "i18n" language codes and returns "[baseLang, ...otherLangs]" (base = the top-level "lang",
   * first) when the form carries at least one non-base language. This lets the workflow mails /
   * ending pages be multilingualized into languages that are already on the WIDGETS (the workflow
   * can lag behind — e.g. a re-run of "translate to Italian" after the widgets were already
   * translated, where the model legitimately emits no "_workflowMailLanguages" marker because it
   * added no new language). Purely structural — reads the form's own i18n; never a prompt-keyword
   * guess.
   */
  private fun deriveWorkflowMailLanguagesFromForm(formJson: String): List<String>? {
    val base =
        try {
          val o = JsonParser.parseString(formJson).asJsonObject
          o.get("lang")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
        } catch (_: Exception) {
          null
        }
    val codes = LinkedHashSet<String>()
    fun scan(el: JsonElement) {
      when {
        el.isJsonObject -> {
          val o = el.asJsonObject
          val i18n = o.get("i18n")
          if (i18n?.isJsonObject == true) {
            for ((k, _) in i18n.asJsonObject.entrySet()) {
              if (!k.isBlank()) codes.add(k.trim())
            }
          }
          o.entrySet().forEach { scan(it.value) }
        }
        el.isJsonArray -> el.asJsonArray.forEach { scan(it) }
      }
    }
    try {
      scan(JsonParser.parseString(formJson))
    } catch (_: Exception) {
      return null
    }
    val nonBase = codes.filter { c -> c.isNotBlank() && base?.equals(c, ignoreCase = true) != true }
    if (nonBase.isEmpty()) return null
    val langs = listOfNotNull(base) + nonBase
    return langs.distinct().takeIf { it.size >= 2 }
  }

  /**
   * READ-ONLY diagnostic for the Abschlussseiten / ending-page feature. Logs the first table that
   * looks like the project's Abschlussseiten/template store (all columns, detected content- and
   * language-column candidates, a project-scoped sample row) and the customParameters of existing
   * FC_SHOW_TEMPLATE workflow nodes (their htmlTemplate UUID refs) for the given workflow version.
   * Used to implement per-language ending-page creation against the REAL server schema. Never
   * throws and never writes anything.
   */
  private fun introspectEndPageSchema(userContext: Any, workflowVersionId: Long) {
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val wfVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId) ?: return
      val project = wfVersion.javaClass.getMethod("getProject").invoke(wfVersion) ?: return
      val projectId = project.javaClass.getMethod("getId").invoke(project) as? Long ?: return
      val emf = CodbiEntities.entityManagerFactory ?: return
      val em = emf.createEntityManager()
      try {
        logger.info(
            "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT project={} workflowVersion={} — probing for the Abschlussseiten/template store",
            projectId,
            workflowVersionId)
        val possibleTables =
            listOf(
                "TEMPLATE_CLIENT",
                "COMPLETION_PAGE",
                "PROJEKT_ABSCHLUSS_SEITE",
                "PROJEKTABSCHLUSSSEITE",
                "PROJECT_COMPLETION_PAGE",
                "ABSCHLUSS_SEITE",
                "ABSCHLUSSSEITE",
                "FORM_COMPLETION_PAGE",
                "WORKFLOW_COMPLETION_PAGE",
                "FORM_TEMPLATE",
                "PROJECT_DOI_DATA",
                "PROJEKT_ABSCHLUSS",
                "PROJEKTABSCHLUSS")
        for (tableName in possibleTables) {
          try {
            val colsQ =
                em.createNativeQuery(
                    "SELECT column_name, data_type FROM information_schema.columns WHERE UPPER(table_name) = :tbl ORDER BY ordinal_position")
            colsQ.setParameter("tbl", tableName)
            val cols = colsQ.resultList
            if (cols.isEmpty()) continue
            val names =
                cols.mapNotNull { row ->
                  (row as? Array<*>)?.get(0)?.toString()?.uppercase()
                      ?: (row?.toString()?.uppercase())
                }
            val hasName = names.any { it == "NAME" || it == "BEZEICHNUNG" || it == "TITLE" }
            val hasId = names.any { it == "UUID" || it == "ID" }
            if (!hasName || !hasId) continue
            val colList =
                cols.joinToString(" | ") { row ->
                  (row as? Array<*>)?.joinToString(":") { c -> c?.toString() ?: "" }
                      ?: row.toString()
                }
            logger.info(
                "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT FOUND-TABLE '{}' — columns: [{}]",
                tableName,
                colList)
            val contentCandidates =
                names.filter {
                  it == "INHALT" ||
                      it == "CONTENT" ||
                      it == "HTML" ||
                      it == "HTMLCONTENT" ||
                      it == "BODY" ||
                      it == "TEXT" ||
                      it == "SOURCE" ||
                      it == "XML" ||
                      it.contains("CONTENT") ||
                      it.contains("INHALT") ||
                      it.contains("HTML") ||
                      it.contains("BODY") ||
                      it.contains("TEXT")
                }
            val languageCandidates =
                names.filter {
                  it == "LANG" ||
                      it == "LANGUAGE" ||
                      it == "LOCALE" ||
                      it.contains("SPRACH") ||
                      it.contains("LANG") ||
                      it.contains("LOCAL")
                }
            val projectCol =
                names.firstOrNull {
                  it == "PROJECT_ID" ||
                      it == "PROJEKT_ID" ||
                      it == "PROJEKTID" ||
                      it == "FK_PROJEKT"
                }
            logger.info(
                "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT TABLE '{}': projectColumn={}; contentColumnCandidates=[{}]; languageColumnCandidates=[{}]",
                tableName,
                projectCol ?: "?",
                contentCandidates.joinToString(", "),
                languageCandidates.joinToString(", "))
            // Sample a project-scoped row (first matching table is enough).
            val selected =
                (names.filter {
                      it == "NAME" ||
                          it == "BEZEICHNUNG" ||
                          it == "TITLE" ||
                          it == "UUID" ||
                          it == "ID"
                    } + contentCandidates + languageCandidates + listOfNotNull(projectCol))
                    .distinct()
            if (selected.isNotEmpty()) {
              val selectSql =
                  if (projectCol != null) {
                    "SELECT ${selected.joinToString(", ")} FROM $tableName WHERE $projectCol = :pid"
                  } else {
                    "SELECT ${selected.joinToString(", ")} FROM $tableName"
                  }
              try {
                val sampleQ = em.createNativeQuery(selectSql)
                if (projectCol != null) sampleQ.setParameter("pid", projectId)
                sampleQ.maxResults = 3
                val rows = sampleQ.resultList
                if (rows.isNotEmpty()) {
                  logger.info(
                      "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT TABLE '{}' sample row(s):",
                      tableName)
                  for (row in rows) {
                    val desc =
                        if (row is Array<*>) {
                          row.mapIndexed { i, v ->
                                "${selected.getOrNull(i) ?: "c$i"}=${truncateCell(v?.toString())}"
                              }
                              .joinToString(" | ")
                        } else {
                          truncateCell(row.toString())
                        }
                    logger.info("[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT   row: {}", desc)
                  }
                } else {
                  logger.info(
                      "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT TABLE '{}' has no rows for project {}",
                      tableName,
                      projectId)
                }
              } catch (e: Exception) {
                logger.warn(
                    "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT sample select failed on '{}': {}",
                    tableName,
                    e.message)
              }
            }
            break
          } catch (_: Exception) {
            continue
          }
        }
        // Scan Formcycle's APIProvider for the Abschlussseiten/template management service.
        try {
          scanTemplateServices()
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] Template-service scan skipped: {}", e.message)
        }
        // Existing FC_SHOW_TEMPLATE nodes of this workflow version → their htmlTemplate refs.
        try {
          val wfColQ =
              em.createNativeQuery(
                  "SELECT column_name FROM information_schema.columns WHERE UPPER(table_name) = 'WORKFLOW_NODE'")
          val wfCols = wfColQ.resultList.map { it.toString().uppercase() }
          val typeCol = wfCols.firstOrNull { it.contains("TYPE") } ?: "TYPE"
          val paramCol = wfCols.firstOrNull { it.contains("PARAM") } ?: "CUSTOM_PARAMS"
          val nodeQ =
              em.createNativeQuery(
                  "SELECT id, CAST($paramCol AS VARCHAR(8000)) FROM WORKFLOW_NODE WHERE $typeCol = 'FC_SHOW_TEMPLATE' AND $paramCol IS NOT NULL ORDER BY id")
          nodeQ.maxResults = 25
          val nodeRows = nodeQ.resultList
          logger.info(
              "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT FC_SHOW_TEMPLATE nodes in workflowVersion {} ({}):",
              workflowVersionId,
              nodeRows.size)
          for (row in nodeRows) {
            val arr = row as? Array<*>
            logger.info(
                "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT   node {} params={}",
                arr?.get(0)?.toString() ?: "?",
                truncateCell(arr?.get(1)?.toString(), 800))
          }
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT FC_SHOW_TEMPLATE scan failed: {}",
              e.message)
        }
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] CODBI-END-PAGE-INTROSPECT failed: {}", e.message)
    }
  }

  /** Truncates a raw DB cell for readable diagnostic logging. */
  private fun truncateCell(text: String?, max: Int = 500): String {
    val s = text ?: ""
    return if (s.length <= max) s else s.take(max) + "...(" + s.length + " chars)"
  }

  /**
   * Queries the database for available HTML templates for the given workflow version's project.
   * These are templates stored in TEMPLATE_CLIENT, FORM_TEMPLATE, or similar tables that can be
   * used with the FC_SHOW_TEMPLATE workflow node.
   *
   * @return A compact JSON array string like `[{"name":"Allgemeiner Fehler 2","uuid":"..."},...]`,
   *   or `null` if the query fails.
   */
  private fun fetchHtmlTemplates(userContext: Any, workflowVersionId: Long): String? {
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId) ?: return null
      val project =
          workflowVersion.javaClass.getMethod("getProject").invoke(workflowVersion) ?: return null
      val projectId = project.javaClass.getMethod("getId").invoke(project) as? Long ?: return null

      val emf = CodbiEntities.entityManagerFactory ?: return null
      val em = emf.createEntityManager()
      try {
        // Strategy 1: Try JPQL with entity class names for HTML/template entities
        val entityClasses =
            listOf(
                "de.xima.fc.entities.ClientTemplate",
                "de.xima.fc.entities.TextTemplate",
                "de.xima.fc.entities.FormTemplate",
                "de.xima.fc.entities.ProjectDOIData",
                "de.xima.fc.entities.CompletionPage",
                "de.xima.fc.entities.ProjektAbschlussSeite",
                "de.xima.fc.entities.AbschlussSeite",
                "de.xima.fc.entities.ProjektAbschluss",
                "de.xima.fc.entities.Abschluss")
        for (entityClass in entityClasses) {
          try {
            val countQuery = em.createQuery("SELECT COUNT(t) FROM $entityClass t")
            val totalCount = (countQuery.singleResult as? Number)?.toLong() ?: 0L
            if (totalCount == 0L) {
              logger.debug(
                  "[AICodBiAssistant] JPQL HTML template entity '$entityClass' has 0 total rows")
              continue
            }
            val fetchQuery = em.createQuery("SELECT t FROM $entityClass t")
            fetchQuery.maxResults = 200
            @Suppress("UNCHECKED_CAST")
            val allResults = (fetchQuery.resultList as? List<Any>) ?: continue
            if (allResults.isEmpty()) continue
            val first = allResults[0]
            val methods = first.javaClass.methods

            // Filter by project
            val projectIdGetters = listOf("getProjektId", "getProjectId")
            var projectIdGetter: java.lang.reflect.Method? = null
            for (gName in projectIdGetters) {
              try {
                projectIdGetter = first.javaClass.getMethod(gName)
                break
              } catch (_: Exception) {}
            }
            val projectRefGetters =
                methods.filter { m ->
                  m.name.startsWith("get") &&
                      m.parameterCount == 0 &&
                      (m.name.contains("Projekt", ignoreCase = true) ||
                          m.name.contains("Project", ignoreCase = true))
                }
            val filteredResults =
                if (projectIdGetter != null) {
                  allResults.filter { t ->
                    try {
                      projectIdGetter!!.invoke(t)?.toString() == projectId.toString()
                    } catch (_: Exception) {
                      false
                    }
                  }
                } else if (projectRefGetters.isNotEmpty()) {
                  allResults.filter { t ->
                    projectRefGetters.any { getter ->
                      try {
                        val ref = getter.invoke(t)
                        ref?.javaClass?.getMethod("getId")?.invoke(ref)?.toString() ==
                            projectId.toString()
                      } catch (_: Exception) {
                        false
                      }
                    }
                  }
                } else allResults

            if (filteredResults.isEmpty()) {
              logger.debug(
                  "[AICodBiAssistant] JPQL HTML template entity '$entityClass' has {} total rows, 0 for project $projectId",
                  totalCount)
              continue
            }

            val templates =
                filteredResults.mapNotNull { t ->
                  try {
                    var name: String? = null
                    try {
                      name = t.javaClass.getMethod("getName").invoke(t) as? String
                    } catch (_: Exception) {}
                    if (name == null) {
                      try {
                        name = t.javaClass.getMethod("getTemplateName").invoke(t) as? String
                      } catch (_: Exception) {}
                    }
                    if (name == null) {
                      val strGetters =
                          methods.filter { m ->
                            m.returnType == String::class.java &&
                                (m.name.contains("ame", ignoreCase = true) ||
                                    m.name.contains("itle", ignoreCase = true) ||
                                    m.name.contains("ezeichnung", ignoreCase = true))
                          }
                      name = strGetters.firstOrNull()?.invoke(t) as? String
                    }
                    val nm = name ?: return@mapNotNull null
                    val uuidObj: UUID? =
                        try {
                          t.javaClass.getMethod("getUUIDObject").invoke(t) as? UUID
                        } catch (_: Exception) {
                          try {
                            val s = t.javaClass.getMethod("getUuid").invoke(t) as? String
                            if (s != null) UUID.fromString(s) else null
                          } catch (_: Exception) {
                            null
                          }
                        }
                    val uu = uuidObj ?: return@mapNotNull null
                    """{"name":${gson.toJson(nm)},"uuid":${gson.toJson(uu.toString())}}"""
                  } catch (_: Exception) {
                    null
                  }
                }
            if (templates.isNotEmpty()) {
              val json = "[${templates.joinToString(",")}]"
              logger.info(
                  "[AICodBiAssistant] Found {} HTML templates via JPQL entity '$entityClass' for project $projectId: {}",
                  templates.size,
                  json)
              return json
            }
          } catch (e: Exception) {
            logger.debug(
                "[AICodBiAssistant] JPQL entity class '$entityClass' not available: ${e.message}")
            continue
          }
        }

        // Strategy 2: Native SQL with schema discovery for template-related tables
        val possibleTables =
            listOf(
                "TEMPLATE_CLIENT",
                "FORM_TEMPLATE",
                "TEXT_TEMPLATE",
                "CLIENT_TEMPLATE",
                "PROJECT_DOI_DATA",
                "COMPLETION_PAGE",
                "PROJEKT_ABSCHLUSS_SEITE",
                "PROJEKTABSCHLUSSSEITE",
                "PROJECT_COMPLETION_PAGE",
                "ABSCHLUSS_SEITE",
                "ABSCHLUSSSEITE",
                "FORM_COMPLETION_PAGE",
                "WORKFLOW_COMPLETION_PAGE",
                "PROJEKT_ABSCHLUSS",
                "PROJEKTABSCHLUSS")
        for (tableName in possibleTables) {
          try {
            val columnsQuery =
                em.createNativeQuery(
                    "SELECT column_name FROM information_schema.columns WHERE UPPER(table_name) = :tbl ORDER BY ordinal_position")
            columnsQuery.setParameter("tbl", tableName)
            val columns = columnsQuery.resultList
            if (columns.isEmpty()) continue
            val colNames = columns.map { it.toString().uppercase() }
            val hasName = colNames.any { it == "NAME" || it == "BEZEICHNUNG" || it == "TITLE" }
            val hasUuid = colNames.any { it == "UUID" }
            val projectCol =
                colNames.firstOrNull {
                  it == "PROJECT_ID" ||
                      it == "PROJEKT_ID" ||
                      it == "PROJEKTID" ||
                      it == "FK_PROJEKT"
                }
            val nameCol =
                when {
                  "NAME" in colNames -> "NAME"
                  "BEZEICHNUNG" in colNames -> "BEZEICHNUNG"
                  "TITLE" in colNames -> "TITLE"
                  else -> null
                }
            if (nameCol == null) continue
            val selectCol = if (hasUuid) "UUID, $nameCol" else "ID, $nameCol"
            val sql =
                if (projectCol != null)
                    "SELECT $selectCol FROM $tableName WHERE $projectCol = :pid ORDER BY $nameCol"
                else "SELECT $selectCol FROM $tableName ORDER BY $nameCol"
            val query = em.createNativeQuery(sql)
            if (projectCol != null) query.setParameter("pid", projectId)
            val results = query.resultList
            if (results.isEmpty()) continue
            val templates =
                results.mapNotNull { row ->
                  when (row) {
                    is Array<*> -> {
                      val idOrUuid = row[0]?.toString() ?: return@mapNotNull null
                      val name = row[1]?.toString() ?: return@mapNotNull null
                      """{"name":${gson.toJson(name)},"uuid":${gson.toJson(idOrUuid)}}"""
                    }
                    else -> null
                  }
                }
            val json = "[${templates.joinToString(",")}]"
            logger.info(
                "[AICodBiAssistant] Found {} HTML templates via native table '$tableName' for project $projectId: {}",
                templates.size,
                json)
            return json
          } catch (_: Exception) {
            continue
          }
        }

        logger.warn("[AICodBiAssistant] No HTML template table found")
        null
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to fetch HTML templates: ${e.message}")
      null
    }
  }

  /**
   * Fetches available inboxes (Postfach entities) for the project's client/mandant and returns them
   * as a JSON array string (e.g. [{"name":"Default inbox","uuid":"..."}...]). Returns null if the
   * inboxes cannot be loaded. Uses PostfachAPI.getAllByClient() via reflection.
   */
  private fun fetchInboxes(userContext: Any, workflowVersionId: Long): String? {
    try {
      val emf = CodbiEntities.entityManagerFactory ?: return null
      val em = emf.createEntityManager()
      try {
        val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
        val postfachApi = apiProviderClass.getField("POSTFACH").get(null)
        val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
        val ucClass = Class.forName("de.xima.fc.user.UserContext")
        val workflowVersion =
            workflowVersionApi.javaClass
                .getMethod("getById", ucClass, Long::class.javaObjectType)
                .invoke(workflowVersionApi, userContext, workflowVersionId)
        val getProjektMethod = workflowVersion.javaClass.getMethod("getProjekt")
        val projekt = getProjektMethod.invoke(workflowVersion)
        val getMandantMethod = projekt.javaClass.getMethod("getMandant")
        val mandant = getMandantMethod.invoke(projekt)
        val getAllByClientMethod =
            postfachApi.javaClass.getMethod(
                "getAllByClient", ucClass, Class.forName("de.xima.fc.entities.Mandant"))
        @Suppress("UNCHECKED_CAST")
        val postfaecher = getAllByClientMethod.invoke(postfachApi, userContext, mandant) as? List<*>
        if (postfaecher.isNullOrEmpty()) return null
        val inboxes =
            postfaecher.mapNotNull { p ->
              if (p == null) return@mapNotNull null
              try {
                val name =
                    p::class.java.getMethod("getName").invoke(p) as? String
                        ?: return@mapNotNull null
                val uuidObj =
                    p::class.java.getMethod("getUUIDObject").invoke(p) as? java.util.UUID
                        ?: return@mapNotNull null
                """{"name":${gson.toJson(name)},"uuid":${gson.toJson(uuidObj.toString())}}"""
              } catch (_: Exception) {
                null
              }
            }
        return "[${inboxes.joinToString(",")}]"
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to fetch inboxes: ${e.message}")
      return null
    }
  }

  /**
   * Queries FormCycle's plugin system for available message services (portals) that can be selected
   * as the message service for FC_SEND_FORM_RECORD_MESSAGE nodes with recipientType=INBOX_ID. Uses
   * PluginAPI.getPluginNames() to find all registered IPluginMessageService implementations.
   * Returns a JSON array of plugin names, or null if the query fails.
   */
  private fun fetchMessageServices(userContext: Any, workflowVersionId: Long): String? {
    logger.info("[AICodBiAssistant] fetchMessageServices: querying plugin message services...")
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId) ?: return null
      val project =
          workflowVersion.javaClass.getMethod("getProject").invoke(workflowVersion) ?: return null
      val mandant = project.javaClass.getMethod("getMandant").invoke(project) ?: return null
      val pluginApi = apiProviderClass.getField("PLUGINS").get(null)
      val pluginServiceClass =
          Class.forName("de.xima.fc.plugin.interfaces.form_record.message.IPluginMessageService")
      val getPluginNamesMethod =
          pluginApi.javaClass.getMethod(
              "getPluginNames",
              ucClass,
              Class.forName("de.xima.fc.entities.Mandant"),
              Class::class.java)
      @Suppress("UNCHECKED_CAST")
      val pluginNames =
          getPluginNamesMethod.invoke(pluginApi, userContext, mandant, pluginServiceClass)
              as? Set<*> ?: return null
      val names = pluginNames.mapNotNull { it?.toString()?.takeIf { n -> n.isNotBlank() } }
      logger.info(
          "[AICodBiAssistant] fetchMessageServices: found {} service(s): {}", names.size, names)
      if (names.isEmpty()) null else gson.toJson(names)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to fetch message services: ${e.message}")
      null
    }
  }

  /**
   * Queries the database for available workflow triggers (events) in the given workflow version.
   * Returns a JSON array of trigger names and UUIDs, or null if the query fails.
   */
  private fun fetchTriggers(userContext: Any, workflowVersionId: Long): String? {
    logger.info(
        "[AICodBiAssistant] fetchTriggers: querying triggers for workflowVersionId={}",
        workflowVersionId)
    val entityContextFactoryClass =
        try {
          Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] fetchTriggers: EntityContextFactory class not found: ${e.message}")
          return null
        }
    val ucClass =
        try {
          Class.forName("de.xima.fc.user.UserContext")
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] fetchTriggers: UserContext class not found: ${e.message}")
          return null
        }
    val entityContext =
        try {
          entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] fetchTriggers: newEntityContext failed: ${e.message} / cause=${e.cause?.message}")
          return null
        }
    logger.info(
        "[AICodBiAssistant] fetchTriggers: EntityContext created, class={}",
        entityContext.javaClass.name)
    return try {
      val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
      logger.info("[AICodBiAssistant] fetchTriggers: EM obtained, class={}", em.javaClass.name)
      // Use JPQL via EntityContext (FormCycle-managed EM with all entities registered).
      // Select full entity and extract properties via reflection because inherited properties
      // from AWorkflowElement (uuid, flagActive) use field access, not property access,
      // making them unresolvable in JPQL property paths.
      val jpql =
          "SELECT t FROM de.xima.fc.entities.WorkflowTrigger t " +
              "JOIN t.task wta JOIN wta.process wp JOIN wp.version wv " +
              "WHERE wv.id = :versionId"
      val query = em.javaClass.getMethod("createQuery", String::class.java).invoke(em, jpql)
      query.javaClass
          .getMethod("setParameter", String::class.java, Any::class.java)
          .invoke(query, "versionId", workflowVersionId)
      @Suppress("UNCHECKED_CAST")
      val resultList =
          query.javaClass.getMethod("getResultList").invoke(query) as? List<*> ?: emptyList<Any>()
      logger.info("[AICodBiAssistant] fetchTriggers: JPQL returned {} raw results", resultList.size)
      // Find getter methods via reflection on the first result's class
      val firstEl = resultList.firstOrNull()
      val nameGetter =
          firstEl?.javaClass?.let { cls ->
            try {
              cls.getMethod("getName")
            } catch (_: Exception) {
              null
            }
          }
      val uuidGetter =
          firstEl?.javaClass?.let { cls ->
            try {
              cls.getMethod("getUUID")
            } catch (_: Exception) {
              null
            }
          }
      val triggerList =
          resultList.mapNotNull { entity ->
            if (entity == null) return@mapNotNull null
            try {
              val name = nameGetter?.invoke(entity) as? String ?: return@mapNotNull null
              val uuidObj = uuidGetter?.invoke(entity)
              val uuid = uuidObj?.toString() ?: return@mapNotNull null
              """{"name":${gson.toJson(name)},"uuid":${gson.toJson(uuid)}}"""
            } catch (_: Exception) {
              null
            }
          }
      logger.info(
          "[AICodBiAssistant] fetchTriggers: found {} trigger(s): {}",
          triggerList.size,
          triggerList)
      if (triggerList.isEmpty()) null else "[${triggerList.joinToString(",")}]"
    } catch (e: Exception) {
      val cause = e.cause
      logger.warn(
          "[AICodBiAssistant] Failed to fetch triggers: msg='${e.message}' cause='${cause?.message}' causeType='${cause?.javaClass?.name}'")
      null
    } finally {
      runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
    }
  }

  /**
   * Runs the workflow-creation AI call and creates the workflow task in FORMCYCLE. Unlike
   * [AIWorkflowAssistant], this method does NOT use a multi-turn context protocol: the frontend
   * already supplies [formElements] in phase 2, so a single AI call suffices.
   *
   * Before calling the AI, fetches available Abschlussseiten (completion pages) from the database
   * so the system prompt can list them for FC_DOI_INIT node creation.
   */
  private fun runWorkflowCreation(
      prompt: String,
      formElements: String?,
      workflowVersionId: Long,
      modelId: String,
      params: IPluginServletActionParams,
      instance: Standard,
      imageParts: List<String> = emptyList(),
      clarificationContext: String? = null,
      chatContext: String? = null,
      changeHistoryContext: String? = null
  ): Triple<String, JsonArray, TokenUsage> {
    val userContext = getUserContext(params)
    var tokensIn = 0
    var tokensOut = 0
    val completionPagesJson = fetchCompletionPages(userContext, workflowVersionId)
    logger.debug(
        "[AICodBiAssistant] runWorkflowCreation: completionPages={}",
        completionPagesJson ?: "null (no pages found or query failed)")
    val htmlTemplatesJson = fetchHtmlTemplates(userContext, workflowVersionId)
    logger.debug(
        "[AICodBiAssistant] runWorkflowCreation: htmlTemplates={}",
        htmlTemplatesJson ?: "null (no templates found or query failed)")
    // DEBUG: Log custom_parameters of existing FC_SHOW_TEMPLATE nodes to identify the correct JSON
    // format
    try {
      val emfDebug = CodbiEntities.entityManagerFactory
      if (emfDebug != null) {
        val emDebug = emfDebug.createEntityManager()
        try {
          // Discover ALL column names of workflow_node dynamically
          val allColQuery =
              emDebug.createNativeQuery(
                  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'WORKFLOW_NODE' ORDER BY ordinal_position")
          val allCols = allColQuery.resultList
          logger.warn("[AICodBiAssistant] DEBUG: Full workflow_node schema:")
          for (col in allCols) {
            when (col) {
              is Array<*> ->
                  logger.warn("[AICodBiAssistant] DEBUG:   column: {} ({})", col[0], col[1])
            }
          }
          // Find the type column and custom_params column
          // Prefer CUSTOM_PARAMS (the actual config JSON) over CUSTOM_PARAMS_VER (version number)
          var typeCol: String? = null
          var customParamsCol: String? = null
          var customParamsVerCol: String? = null
          for (col in allCols) {
            when (col) {
              is Array<*> -> {
                val colName = col[0]?.toString()?.uppercase() ?: ""
                if (colName == "ITEM_TYPE") typeCol = col[0].toString()
                else if (colName == "CUSTOM_PARAMS") customParamsCol = col[0].toString()
                else if (colName == "CUSTOM_PARAMS_VER") customParamsVerCol = col[0].toString()
              }
            }
          }
          typeCol = typeCol ?: "ITEM_TYPE"
          customParamsCol = customParamsCol ?: "CUSTOM_PARAMS"
          logger.warn(
              "[AICodBiAssistant] DEBUG: Using typeCol='{}', customParamsCol='{}'",
              typeCol,
              customParamsCol)
          if (customParamsCol != null) {
            // Cast CLOB to VARCHAR to read the actual JSON content
            val debugQuery =
                emDebug.createNativeQuery(
                    "SELECT id, CAST($customParamsCol AS VARCHAR(10000)) FROM workflow_node WHERE $typeCol = 'FC_SHOW_TEMPLATE' AND $customParamsCol IS NOT NULL ORDER BY id DESC")
            debugQuery.maxResults = 5
            val debugResults = debugQuery.resultList
            if (debugResults.isNotEmpty()) {
              logger.warn("[AICodBiAssistant] DEBUG: Existing FC_SHOW_TEMPLATE nodes:")
              for (row in debugResults) {
                when (row) {
                  is Array<*> ->
                      logger.warn(
                          "[AICodBiAssistant] DEBUG:   node id={}, params={}", row[0], row[1])
                }
              }
            } else {
              logger.warn(
                  "[AICodBiAssistant] DEBUG: No FC_SHOW_TEMPLATE nodes found with $customParamsCol IS NOT NULL")
            }
          }
          // DEBUG: Also query FC_REDIRECT nodes to see their ITEM_NAME (node name)
          try {
            val redirectQuery =
                emDebug.createNativeQuery(
                    "SELECT id, ITEM_NAME, CAST($customParamsCol AS VARCHAR(500)) FROM workflow_node WHERE ITEM_TYPE = 'FC_REDIRECT' AND $customParamsCol IS NOT NULL ORDER BY id DESC")
            redirectQuery.maxResults = 10
            val redirectResults = redirectQuery.resultList
            if (redirectResults.isNotEmpty()) {
              logger.warn("[AICodBiAssistant] DEBUG: Existing FC_REDIRECT nodes:")
              for (row in redirectResults) {
                when (row) {
                  is Array<*> ->
                      logger.warn(
                          "[AICodBiAssistant] DEBUG:   node id={}, name='{}', params={}",
                          row[0],
                          row[1],
                          if ((row[2] as? String)?.length ?: 0 > 200) (row[2] as? String)?.take(200)
                          else row[2])
                }
              }
            } else {
              logger.warn("[AICodBiAssistant] DEBUG: No FC_REDIRECT nodes found")
            }
            // Also query SEQUENCE nodes to compare their naming
            val seqQuery =
                emDebug.createNativeQuery(
                    "SELECT id, ITEM_NAME, ITEM_TYPE FROM workflow_node WHERE ITEM_TYPE = 'SEQUENCE' ORDER BY id DESC")
            seqQuery.maxResults = 5
            val seqResults = seqQuery.resultList
            if (seqResults.isNotEmpty()) {
              logger.warn("[AICodBiAssistant] DEBUG: SEQUENCE nodes:")
              for (row in seqResults) {
                when (row) {
                  is Array<*> ->
                      logger.warn(
                          "[AICodBiAssistant] DEBUG:   node id={}, name='{}', type='{}'",
                          row[0],
                          row[1],
                          row[2])
                }
              }
            }
            // DEBUG: Query FC_DECODE_BASE64 and FC_PROVIDE_RESOURCE nodes for CUSTOM_PARAMS
            try {
              val sampleQuery =
                  emDebug.createNativeQuery(
                      "SELECT id, ITEM_TYPE, ITEM_NAME, CAST($customParamsCol AS VARCHAR(2000)) FROM workflow_node " +
                          "WHERE ITEM_TYPE IN ('FC_DECODE_BASE64', 'FC_PROVIDE_RESOURCE') AND $customParamsCol IS NOT NULL " +
                          "ORDER BY id DESC")
              sampleQuery.maxResults = 5
              val sampleResults = sampleQuery.resultList
              if (sampleResults.isNotEmpty()) {
                logger.warn(
                    "[AICodBiAssistant] DEBUG: FC_DECODE_BASE64 / FC_PROVIDE_RESOURCE nodes:")
                for (row in sampleResults) {
                  when (row) {
                    is Array<*> ->
                        logger.warn(
                            "[AICodBiAssistant] DEBUG:   node id={}, type='{}', name='{}', params={}",
                            row[0],
                            row[1],
                            row[2],
                            if ((row[3] as? String)?.length ?: 0 > 1500)
                                (row[3] as? String)?.take(1500)
                            else row[3])
                  }
                }
              } else {
                logger.warn(
                    "[AICodBiAssistant] DEBUG: No FC_DECODE_BASE64 or FC_PROVIDE_RESOURCE nodes found")
              }
            } catch (e: Exception) {
              logger.warn(
                  "[AICodBiAssistant] DEBUG FC_DECODE_BASE64/FC_PROVIDE_RESOURCE query failed: ${e.message}")
            }
            // Also query ALL nodes (any type) for the most recent 5 to see their data
            try {
              val allQuery =
                  emDebug.createNativeQuery(
                      "SELECT id, ITEM_TYPE, ITEM_NAME, CAST($customParamsCol AS VARCHAR(500)) FROM workflow_node ORDER BY id DESC")
              allQuery.maxResults = 10
              val allResults = allQuery.resultList
              if (allResults.isNotEmpty()) {
                logger.warn("[AICodBiAssistant] DEBUG: Most recent 10 nodes:")
                for (row in allResults) {
                  when (row) {
                    is Array<*> ->
                        logger.warn(
                            "[AICodBiAssistant] DEBUG:   node id={}, type='{}', name='{}', params_len={}",
                            row[0],
                            row[1],
                            row[2],
                            (row[3] as? String)?.length ?: 0)
                  }
                }
              }
            } catch (e: Exception) {
              logger.warn("[AICodBiAssistant] DEBUG all nodes query failed: ${e.message}")
            }
          } catch (e: Exception) {
            logger.warn("[AICodBiAssistant] DEBUG FC_REDIRECT query failed: ${e.message}")
          }
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] DEBUG query failed: ${e.message}")
        } finally {
          emDebug.close()
        }
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] DEBUG setup failed: ${e.message}")
    }
    // DIAGNOSTIC: dump the DECRYPTED params + version of every FC_POST_REQUEST node so we can
    // compare an AI-created node with a manually-created one.
    logPostRequestNodeStates(userContext)
    val workflowStatesJson = fetchWorkflowStates(userContext, workflowVersionId)
    logger.debug(
        "[AICodBiAssistant] runWorkflowCreation: workflowStates={}",
        workflowStatesJson ?: "null (no states found or query failed)")
    val inboxesJson = fetchInboxes(userContext, workflowVersionId)
    logger.debug(
        "[AICodBiAssistant] runWorkflowCreation: inboxes={}",
        inboxesJson ?: "null (no inboxes found or query failed)")
    val messageServicesJson = fetchMessageServices(userContext, workflowVersionId)
    logger.info(
        "[AICodBiAssistant] runWorkflowCreation: messageServices={}",
        messageServicesJson ?: "null (no services found or query failed)")
    val triggersJson = fetchTriggers(userContext, workflowVersionId)
    logger.info(
        "[AICodBiAssistant] runWorkflowCreation: triggers={}",
        triggersJson ?: "null (no triggers found or query failed)")
    // Existing workflow nodes — lets the AI reference concrete nodes (by numeric id) for
    // remove/replace operations instead of only creating new ones.
    val existingWorkflowNodes = fetchExistingWorkflowNodes(userContext, workflowVersionId)
    logger.info(
        "[AICodBiAssistant] runWorkflowCreation: existingWorkflowNodes={}",
        existingWorkflowNodes ?: "null (none found or query failed)")
    // Two-pass workflow flow:
    //   Pass-1 — the AI receives only the condensed workflow-nodes reference. If it needs the exact
    //            triggerParams/nodeParams of specific triggers/nodes it intends to use, it responds
    //            with {"status":"need_workflow_node_details","nodes":[...],"triggers":[...]}.
    //   Pass-2 — the server appends the requested node/trigger detail sections from the DB and the
    //            AI produces the final task JSON.
    var requestedNodes = emptyList<String>()
    var requestedTriggers = emptyList<String>()
    val repeatableContainers =
        buildRepeatableContainersContext(params.requestParameters["persist"]?.firstOrNull())
    // Form/global variables of the form (top-level "variables" array) — the workflow AI needs these
    // so it can reference a form variable's value with [%variableName%] and does NOT ask whether to
    // create hidden form fields for variables that already exist.
    val formVariables =
        extractFormVariablesFromJson(params.requestParameters["persist"]?.firstOrNull())
    logger.info("[AICodBiAssistant] runWorkflowCreation: formVariables={}", formVariables)
    var systemPrompt =
        buildWorkflowSystemPrompt(
            formElements,
            repeatableContainers,
            htmlTemplatesJson,
            completionPagesJson,
            workflowStatesJson,
            inboxesJson,
            messageServicesJson,
            triggersJson,
            existingWorkflowNodes,
            requestedNodes,
            requestedTriggers,
            clarificationContext,
            chatContext,
            changeHistoryContext,
            formVariables)

    var messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }
    val pass1Raw = instance.performFormAssist(modelId, messagesJson)
    tokensIn += estimateTokens(messagesJson)
    tokensOut += estimateTokens(pass1Raw)
    var cleaned = extractJson(stripThinkTags(pass1Raw))
    logger.info(
        "[AICodBiAssistant] Workflow AI pass-1 raw response: {}", compactJsonForLog(cleaned))

    val workflowDetails = extractWorkflowDetailsRequest(cleaned)
    if (workflowDetails != null) {
      requestedNodes = workflowDetails.nodes
      requestedTriggers = workflowDetails.triggers
      logger.info(
          "[AICodBiAssistant] AI requested workflow node details — nodes: {}, triggers: {} — rerunning pass-2",
          requestedNodes.joinToString(", ").ifEmpty { "<none>" },
          requestedTriggers.joinToString(", ").ifEmpty { "<none>" })
      systemPrompt =
          buildWorkflowSystemPrompt(
              formElements,
              repeatableContainers,
              htmlTemplatesJson,
              completionPagesJson,
              workflowStatesJson,
              inboxesJson,
              messageServicesJson,
              triggersJson,
              existingWorkflowNodes,
              requestedNodes,
              requestedTriggers,
              clarificationContext,
              chatContext,
              changeHistoryContext,
              formVariables)
      messagesJson = buildString {
        append("[")
        append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
        append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
        append("]")
      }
      val pass2Raw = instance.performFormAssist(modelId, messagesJson)
      tokensIn += estimateTokens(messagesJson)
      tokensOut += estimateTokens(pass2Raw)
      cleaned = extractJson(stripThinkTags(pass2Raw))
      logger.info(
          "[AICodBiAssistant] Workflow AI pass-2 raw response: {}", compactJsonForLog(cleaned))
    }

    // Replace symbolic "$ROOT" breakTarget with a safe UUID placeholder before JSON parsing
    var safeCleaned = cleaned.replace("\$ROOT", "00000000-0000-0000-0000-000000000000")

    // When the AI answered with prose instead of a JSON workflow spec (e.g. it is unsure what to
    // change because it has no context, or it keeps asking clarifying questions after the
    // clarification rounds), retry ONCE with a strict corrective instruction before surfacing a
    // readable error. This avoids the "did not return a workflow specification" failure that
    // previously aborted the run after several clarification loops.
    // Also retry when the AI echoed the FORM instead of the workflow task — after the clarification
    // round it sometimes returns the form JSON (an "items" array / no workflow task fields), or an
    // empty JSON array, which would otherwise parse to zero task specs and abort the run.
    if ((!safeCleaned.trim().startsWith("{") && !safeCleaned.trim().startsWith("[")) ||
        isFormShapedWorkflowResponse(safeCleaned) ||
        isWorkflowEmptyArray(safeCleaned)) {
      logger.warn(
          "[AICodBiAssistant] Workflow AI returned non-task response (prose, form JSON, or empty array) — retrying once with strict JSON instruction: {}",
          safeCleaned.take(300))
      val retryMessagesJson = buildString {
        append("[")
        append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
        append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}},""")
        append("""{"role":"assistant","content":${gson.toJson(cleaned)}},""")
        append(
            """{"role":"user","content":${gson.toJson(loadPromptWithClasspathFallback("codbi.retry_workflow") ?: "")}}""")
        append("]")
      }
      val retryRaw = instance.performFormAssist(modelId, retryMessagesJson)
      tokensIn += estimateTokens(retryMessagesJson)
      tokensOut += estimateTokens(retryRaw)
      val retryCleaned = extractJson(stripThinkTags(retryRaw))
      logger.info(
          "[AICodBiAssistant] Workflow AI retry raw response: {}",
          compactJsonForLog(retryCleaned).take(600))
      cleaned = retryCleaned
      safeCleaned = retryCleaned.replace("\$ROOT", "00000000-0000-0000-0000-000000000000")
      // The strict retry may answer with the VALID two-pass meta-request
      // (need_workflow_node_details) instead of the final task JSON — honor it exactly like the
      // pass-1 details request: load the requested node schemas and re-run pass-2 with them.
      val retryDetails = extractWorkflowDetailsRequest(safeCleaned)
      if (retryDetails != null) {
        requestedNodes = retryDetails.nodes
        requestedTriggers = retryDetails.triggers
        logger.info(
            "[AICodBiAssistant] Retry requested workflow node details — nodes: {}, triggers: {} — rerunning pass-2",
            requestedNodes.joinToString(", ").ifEmpty { "<none>" },
            requestedTriggers.joinToString(", ").ifEmpty { "<none>" })
        systemPrompt =
            buildWorkflowSystemPrompt(
                formElements,
                repeatableContainers,
                htmlTemplatesJson,
                completionPagesJson,
                workflowStatesJson,
                inboxesJson,
                messageServicesJson,
                triggersJson,
                existingWorkflowNodes,
                requestedNodes,
                requestedTriggers,
                clarificationContext,
                chatContext,
                changeHistoryContext,
                formVariables)
        messagesJson = buildString {
          append("[")
          append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
          append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
          append("]")
        }
        val pass2Raw = instance.performFormAssist(modelId, messagesJson)
        tokensIn += estimateTokens(messagesJson)
        tokensOut += estimateTokens(pass2Raw)
        cleaned = extractJson(stripThinkTags(pass2Raw))
        safeCleaned = cleaned.replace("\$ROOT", "00000000-0000-0000-0000-000000000000")
        logger.info(
            "[AICodBiAssistant] Workflow AI pass-2 (after retry) raw response: {}",
            safeCleaned.take(300))
      }
    }

    val trimmedCleaned = safeCleaned.trim()
    if (!trimmedCleaned.startsWith("{") && !trimmedCleaned.startsWith("[")) {
      throw Exception("The AI did not return a workflow specification: " + trimmedCleaned.take(300))
    }

    // When the AI responds with an explicit error/refusal object (e.g. "Unable to repeat the last
    // changes because no previous changes were provided"), surface that message instead of turning
    // the empty object into a fabricated default workflow task.
    val aiWorkflowError =
        runCatching {
              val probe = JsonParser.parseString(safeCleaned)
              if (probe.isJsonObject) {
                val o = probe.asJsonObject
                o.get("error")?.takeIf { it.isJsonPrimitive }?.asString
              } else {
                null
              }
            }
            .getOrNull()
    if (!aiWorkflowError.isNullOrBlank()) {
      throw Exception("AI could not create the workflow: $aiWorkflowError")
    }

    // Parse the AI response into workflow task specs. The AI may return:
    //   - a bare task object,
    //   - an array of task objects, or
    //   - a wrapper object carrying a "workflow" (or "tasks") array of task objects (the AI
    //     sometimes echoes the form items alongside the workflow, so the actual tasks live inside
    //     the wrapper — without unwrapping, all nodeParams/triggerParams would silently fall back
    //     to the WorkflowTaskSpec defaults and the task would be created without its properties).
    val taskSpecs: List<WorkflowTaskSpec> =
        try {
          // The model occasionally emits malformed JSON — most often a dropped `{` between two
          // chained node objects (which produced "Unterminated array ... chainedNodes[2]"), but
          // also a stray escaped quote or a trailing comma. Repair the common LLM slips and retry
          // so a single bad token does not lose the whole workflow build.
          var parseable = safeCleaned
          val parsed =
              try {
                JsonParser.parseString(parseable)
              } catch (first: Exception) {
                val repaired = repairAiJson(parseable)
                if (repaired != parseable) {
                  logger.warn(
                      "[AICodBiAssistant] Workflow AI returned invalid JSON; repaired malformed tokens ({} -> {} chars)",
                      parseable.length,
                      repaired.length)
                  parseable = repaired
                  try {
                    JsonParser.parseString(parseable)
                  } catch (_: Exception) {
                    throw first
                  }
                } else {
                  throw first
                }
              }
          val specs: List<WorkflowTaskSpec> =
              when {
                parsed.isJsonArray ->
                    gson.fromJson(parseable, Array<WorkflowTaskSpec>::class.java).toList()
                parsed.isJsonObject -> {
                  val obj = parsed.asJsonObject
                  val tasksArray =
                      obj.get("workflow")?.takeIf { it.isJsonArray }?.asJsonArray
                          ?: obj.get("tasks")?.takeIf { it.isJsonArray }?.asJsonArray
                  if (tasksArray != null) {
                    gson.fromJson(tasksArray, Array<WorkflowTaskSpec>::class.java).toList()
                  } else {
                    // A bare object is only treated as a task spec when it actually describes one
                    // (nodeType/triggerType/taskName/...). An object without any workflow content
                    // (e.g. the AI echoing the form, or deciding no workflow change is needed) must
                    // NOT be turned into a fabricated default FC_EMAIL task.
                    val workflowFields =
                        listOf(
                            "nodeType",
                            "nodeParams",
                            "triggerType",
                            "triggerParams",
                            "taskName",
                            "taskDescription",
                            "operation",
                            "targetNodeId",
                            "chainedNodes",
                            "endpointState",
                            "endpointType",
                            "stateProperties")
                    val describesTask = workflowFields.any { obj.has(it) }
                    if (!describesTask) {
                      emptyList()
                    } else {
                      listOf(gson.fromJson(parseable, WorkflowTaskSpec::class.java))
                    }
                  }
                }
                else -> emptyList()
              }
          logger.info("[AICodBiAssistant] Parsed {} workflow task spec(s)", specs.size)
          specs.forEachIndexed { i, spec ->
            logger.info(
                "[AICodBiAssistant] Task #{}: nodeType={}, nodeParams keys={}, triggerParams keys={}",
                i + 1,
                spec.nodeType,
                spec.nodeParams.keys,
                spec.triggerParams.keys)
          }
          specs
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] Could not parse workflow AI response: {}", safeCleaned)
          throw Exception("AI returned invalid workflow JSON: ${e.message}")
        }

    if (taskSpecs.isEmpty()) {
      logger.warn(
          "[AICodBiAssistant] Workflow AI returned no task spec ({} chars) - aborting workflow creation",
          safeCleaned.length)
      throw Exception(
          "The AI did not return a workflow specification - it described form elements instead of a " +
              "workflow task. Please rephrase the request or try again.")
    }

    // Apply the delta operations: each spec may be a create, remove or replace (see
    // WorkflowTaskSpec). createWorkflowTask is kept for backward compatibility. Error-handling
    // lanes (FC_CATCH_ERROR) whose HTTP node is already wrapped in an existing FC_EXPERIMENT are
    // folded into that experiment's handler path instead of spawning a second lane.
    val (specsToApply, foldMessages) =
        foldErrorLanesIntoExperiments(taskSpecs, existingWorkflowNodes, workflowVersionId, params)
    val results =
        specsToApply.map { spec -> applyWorkflowOperation(workflowVersionId, spec, params) }
    val combinedResult = (foldMessages + results).joinToString(" | ")
    // Safety net: remove any workflow lane (task) that now has no nodes left, so no empty lanes
    // remain after the AI removed paths.
    val laneCleanup = cleanupEmptyWorkflowTasks(userContext, workflowVersionId)
    // Mark the workflow version as invalid so FORMCYCLE reloads/revalidates its cached workflow
    // model on the next designer load. The AI writes tasks/nodes directly via the node API, which
    // bypasses the normal save flow that sets WorkflowVersion.workflowInvalid — without this the
    // designer's Workflow tab keeps showing the previous workflow after the reload until a second
    // manual reload.
    touchWorkflowVersion(userContext, workflowVersionId)
    val combinedResultFinal =
        if (laneCleanup.isBlank()) combinedResult else "$combinedResult$laneCleanup"

    // Build the workflow change log grouped per workflow path (task). Create operations record the
    // trigger, the path elements (the generated node + its chained nodes), and the status
    // (endpoint state + state properties) — all of which the AI generated. Remove/replace
    // operations record the target node (by name when known) and the server's removal result.
    // Map of existing node id -> (type, name) so remove/replace entries can name the target path.
    val existingNodeInfo: Map<String, Pair<String, String>> =
        try {
          val arr = JsonParser.parseString(existingWorkflowNodes ?: "[]").asJsonArray
          buildMap {
            for (el in arr) {
              val obj = el.asJsonObject
              val id = obj.get("id")?.asString ?: continue
              val type = obj.get("type")?.asString ?: ""
              val name = obj.get("name")?.asString ?: ""
              put(id, type to name)
            }
          }
        } catch (_: Exception) {
          emptyMap()
        }
    val nodeLog = JsonArray()
    for ((index, spec) in taskSpecs.withIndex()) {
      val path = JsonObject()
      val op = spec.operation.trim().lowercase()
      val opResult = results.getOrNull(index) ?: ""
      if (op == "remove" || op == "replace") {
        val target = spec.targetNodeId
        val targetName =
            target?.let { id ->
              existingNodeInfo[id]?.second?.trim()?.takeIf { n ->
                n.isNotEmpty() && !n.equals("SEQUENCE", ignoreCase = true)
              }
            }
        path.addProperty(
            "name",
            targetName ?: if (op == "remove") "Remove workflow path" else "Replace workflow path")
        path.addProperty("nodeType", op.uppercase())
        val params = JsonObject()
        if (!target.isNullOrBlank()) params.addProperty("targetNodeId", target)
        if (opResult.isNotBlank()) params.addProperty("result", opResult)
        path.add("params", params)
        nodeLog.add(path)
        continue
      }
      val pathName =
          spec.taskName.trim().takeIf { it.isNotEmpty() }?.let { sanitizeWorkflowName(it) }
              ?: deriveNodeName(spec)
      path.addProperty("name", pathName)

      // Trigger — the workflow trigger the AI chose for this path.
      val trigger = JsonObject()
      trigger.addProperty("type", spec.triggerType)
      trigger.add("params", gson.toJsonTree(spec.triggerParams))
      path.add("trigger", trigger)

      // Path elements — the action node the AI generated plus any chained nodes.
      val elements = JsonArray()
      val mainNode = JsonObject()
      mainNode.addProperty("name", deriveNodeName(spec))
      mainNode.addProperty("nodeType", spec.nodeType)
      mainNode.add("params", workflowLogParams(spec.nodeType, spec.nodeParams))
      elements.add(mainNode)
      spec.chainedNodes?.forEach { chainSpecMap ->
        val chainNode = JsonObject()
        val chainName =
            (chainSpecMap["taskName"] as? String)?.takeIf { it.isNotBlank() }
                ?: (chainSpecMap["nodeType"] as? String)
                ?: "chained"
        chainNode.addProperty("name", chainName)
        val chainNodeType = (chainSpecMap["nodeType"] as? String) ?: ""
        chainNode.addProperty("nodeType", chainNodeType)
        chainNode.add("params", workflowLogParams(chainNodeType, chainSpecMap["nodeParams"]))
        elements.add(chainNode)
      }
      path.add("elements", elements)

      // Status — the workflow state (endpoint) this path leads to, with its properties.
      val status = JsonObject()
      status.addProperty("endpointState", spec.endpointState)
      status.addProperty("endpointType", spec.endpointType)
      status.add("stateProperties", gson.toJsonTree(spec.stateProperties))
      path.add("status", status)

      nodeLog.add(path)
    }
    logger.info(
        "[AICodBiAssistant] Workflow created: {} task(s) â€” {}", results.size, combinedResultFinal)
    return Triple(combinedResultFinal, nodeLog, TokenUsage(tokensIn, tokensOut))
  }

  /**
   * Whole-form translation → multilingual workflow mails.
   *
   * Called from [handleRun] when the form AI signaled "_workflowMailLanguages" (a whole-form
   * translation made the form multilingual) and a workflow version is known. Runs ONE focused AI
   * call (prompt codbi.workflow_translate_instruction) that (a) picks the EXISTING consumer-facing
   * FC_EMAIL / FC_DOI_INIT nodes from the workflow structure and (b) provides the subject/body
   * translation for every non-base form language. Each chosen node is then wrapped (see
   * [multilingualizeMailNode]) into an FC_SWITCH on the "[%lang%]" placeholder — the ORIGINAL mail
   * stays on the base-language and default branches, the other branches get the translated clones.
   * No new lane/trigger/endpoint is ever created; nodes that follow the mail in the lane stay after
   * the switch, so the lane continues exactly as before.
   */
  private fun runWorkflowMailMultilingualization(
      prompt: String,
      languages: List<String>,
      workflowVersionId: Long,
      params: IPluginServletActionParams,
      modelId: String,
      instance: Standard,
      chatContext: String?,
      clarificationContext: String?,
      changeHistoryContext: String?
  ): String {
    val langs = languages.filter { it.isNotBlank() }.distinct()
    if (langs.isEmpty()) return ""
    val userContext = getUserContext(params)
    val workflowJson =
        buildWorkflowStructureContext(workflowVersionId, userContext)
            ?: run {
              logger.warn(
                  "[AICodBiAssistant] No workflow context for mail multilingualization (workflowVersion {}).",
                  workflowVersionId)
              return ""
            }
    val instruction =
        loadPromptWithClasspathFallback("codbi.workflow_translate_instruction")
            ?: run {
              logger.warn(
                  "[AICodBiAssistant] No codbi.workflow_translate_instruction prompt available — skipping mail multilingualization.")
              return ""
            }
    val baseLanguage = langs.first()

    // Condensed candidate list of TWO kinds:
    //  - "MAIL":   a plain FC_EMAIL / FC_DOI_INIT node that is NOT yet inside a [%lang%] switch ->
    //              to be WRAPPED into a new FC_SWITCH on [%lang%];
    //  - "SWITCH": an existing FC_SWITCH on [%lang%] that already carries (translated) mail
    // clone(s)
    //              -> to be EXTENDED with the missing language cases (added later, e.g. en/fr on
    // top
    //              of an earlier de/it switch).
    // Feeding the whole workflow tree invites the model to ECHO it back instead of answering the
    // small mails payload (observed live), so only these condensed candidates are sent.
    //
    // Whether a mail is consumer-facing is decided by the AI itself (a server-side filter can never
    // cover every way a mail is destined to the consumer or an internal office): the model must
    // return an explicit "toConsumer" verdict for EVERY candidate node.
    fun collectMailMeta(n: JsonObject, acc: MutableList<JsonObject>) {
      val t = n.get("type")?.asString ?: ""
      if (t == "FC_EMAIL" || t == "FC_DOI_INIT") {
        val cp = n.get("customParameters")
        val meta = JsonObject()
        meta.addProperty("type", t)
        meta.addProperty("name", n.get("name")?.asString ?: "")
        meta.addProperty("params", cp?.toString() ?: "")
        acc.add(meta)
      }
      n.get("children")
          ?.takeIf { it.isJsonArray }
          ?.asJsonArray
          ?.forEach { c -> if (c.isJsonObject) collectMailMeta(c.asJsonObject, acc) }
    }
    fun analyzeLangSwitch(o: JsonObject): JsonObject? {
      val cp = o.get("customParameters")
      val switchValue =
          if (cp != null && cp.isJsonObject) {
            cp.asJsonObject.get("switchValue")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
          } else {
            null
          }
      if (switchValue != "[%lang%]") return null
      val id = o.get("id")?.asString ?: return null
      val children = o.get("children")?.takeIf { it.isJsonArray }?.asJsonArray ?: return null
      val caseLangs = LinkedHashSet<String>()
      var defaultId: String? = null
      val mails = mutableListOf<JsonObject>()
      for (branch in children) {
        if (!branch.isJsonObject) continue
        val b = branch.asJsonObject
        val bt = b.get("type")?.asString ?: ""
        if (bt == "FC_SWITCH_CASE") {
          try {
            val bcp = b.get("customParameters")
            if (bcp != null && bcp.isJsonObject) {
              val cvs = bcp.asJsonObject.get("caseValues")
              if (cvs?.isJsonArray == true) {
                for (cv in cvs.asJsonArray) {
                  if (cv.isJsonObject) {
                    val v = cv.asJsonObject.get("caseValue")
                    val s = v?.takeIf { it.isJsonPrimitive }?.asString?.trim()
                    if (!s.isNullOrBlank()) caseLangs.add(s)
                  }
                }
              }
            }
          } catch (_: Exception) {}
          collectMailMeta(b, mails)
        } else if (bt == "FC_SWITCH_DEFAULT") {
          defaultId = b.get("id")?.asString
          collectMailMeta(b, mails)
        } else {
          collectMailMeta(b, mails)
        }
      }
      if (mails.isEmpty() && caseLangs.isEmpty()) return null
      val meta = JsonObject()
      meta.addProperty("kind", "SWITCH")
      meta.addProperty("targetNodeId", id)
      meta.addProperty("name", o.get("name")?.asString ?: "")
      val langsArr = JsonArray()
      caseLangs.forEach { langsArr.add(it) }
      meta.add("existingCaseLanguages", langsArr)
      meta.addProperty("defaultBranchId", defaultId ?: "")
      val src = mails.firstOrNull()
      meta.addProperty("sourceType", src?.get("type")?.asString ?: "FC_EMAIL")
      meta.addProperty("sourceName", src?.get("name")?.asString ?: "")
      meta.addProperty("sourceParams", src?.get("params")?.asString ?: "")
      return meta
    }
    fun collectMailCandidates(el: JsonElement, out: JsonArray) {
      if (!el.isJsonObject) return
      val o = el.asJsonObject
      val nodeType = o.get("type")?.asString ?: ""
      when (nodeType) {
        "FC_SWITCH" -> {
          val meta = analyzeLangSwitch(o)
          if (meta != null) {
            out.add(meta)
            // Its mail clones are handled by EXTENDING this switch, never re-wrapped.
            return
          }
        }
        "FC_EMAIL",
        "FC_DOI_INIT" -> {
          val id = o.get("id")?.asString ?: ""
          if (id.isNotBlank()) {
            val node = JsonObject()
            node.addProperty("kind", "MAIL")
            node.addProperty("targetNodeId", id)
            node.addProperty("name", o.get("name")?.asString ?: "")
            node.addProperty("type", nodeType)
            node.addProperty("description", o.get("description")?.asString ?: "")
            val cp = o.get("customParameters")
            if (cp != null) node.add("customParameters", cp)
            out.add(node)
          }
          return
        }
      }
      o.get("children")
          ?.takeIf { it.isJsonArray }
          ?.asJsonArray
          ?.forEach { c -> collectMailCandidates(c, out) }
      // The workflow structure nests each task's node tree under the task's "rootNode" (SEQUENCE /
      // action tree), not under a task-level "children" array — descend into it too, otherwise no
      // FC_EMAIL/FC_DOI_INIT node is ever found (observed: "no FC_EMAIL/FC_DOI_INIT node found").
      o.get("rootNode")?.takeIf { it.isJsonObject }?.let { collectMailCandidates(it, out) }
    }
    val mailCandidates = JsonArray()
    try {
      val root = JsonParser.parseString(workflowJson)
      if (root.isJsonArray) root.asJsonArray.forEach { collectMailCandidates(it, mailCandidates) }
      else if (root.isJsonObject) collectMailCandidates(root.asJsonObject, mailCandidates)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not collect workflow mail candidates: {}", e.message)
    }
    if (mailCandidates.size() == 0) {
      logger.info(
          "[AICodBiAssistant] Mail multilingualization: no consumer mail node or [%lang%] mail switch found - nothing to do.")
      return ""
    }
    val candidateIds =
        mailCandidates
            .mapNotNull { el ->
              if (el.isJsonObject) {
                el.asJsonObject.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
              } else {
                null
              }
            }
            .filter { it.isNotBlank() }
    val candidatesJson = gson.toJson(mailCandidates)
    logger.info(
        "[AICodBiAssistant] Mail multilingualization candidates ({} mail node(s)/switch(es)): {}",
        mailCandidates.size(),
        compactJsonForLog(candidatesJson).take(2000))

    val system = buildString {
      append(instruction)
      append("\n\n")
      append("FORM LANGUAGES (exact language codes; base language first): ")
      append(langs.joinToString(", "))
      append(". BASE language '")
      append(baseLanguage)
      append("' keeps the ORIGINAL mail text — provide translations ONLY for the other languages.")
      append(
          "\n\nCANDIDATE MAIL NODES (JSON) - each entry is either a plain consumer mail node (\"kind\":\"MAIL\", to be wrapped) or an ALREADY-wrapped mail switch (\"kind\":\"SWITCH\" with its \"existingCaseLanguages\"). For EACH node decide whether it is CONSUMER-facing and reply with an entry for EVERY node (see the required reply schema below):\n")
      append(candidatesJson)
      append(
          "\n\nOUTPUT RULE: reply with ONLY this JSON - one 'mails' entry per candidate node, no omissions, nothing else:\n" +
              "{\"mails\":[{\"targetNodeId\":\"<node id from CANDIDATE MAIL NODES>\",\"toConsumer\":true,\"translations\":{\"<languageCode>\":{\"subject\":\"<translated subject>\",\"body\":\"<translated HTML body>\"}}},{\"targetNodeId\":\"<node id>\",\"toConsumer\":false,\"translations\":{}}]}\n" +
              "'toConsumer' is true ONLY when the mail is sent to the CONSUMER (the person who filled the form): a DOI invitation, or an email addressed to the submitter whose content is a confirmation/invitation/receipt FOR them. It is false for internal/back-office notifications, operator error/alert mails and admin copies — even when such a mail is configured with the submitter's email field as recipient; judge by intent (who reads it and why), never by the recipient string alone.\n" +
              "Provide 'translations' ONLY for nodes with toConsumer=true (one entry per FORM LANGUAGE except the base language '$baseLanguage'); for toConsumer=false nodes 'translations' is empty {}.\n" +
              "For a candidate with \"kind\":\"SWITCH\", its existing case languages are ALREADY translated — provide 'translations' ONLY for the FORM LANGUAGES that are NOT in its \"existingCaseLanguages\" (translate from the source mail in 'sourceParams').")
    }
    val contextSuffix =
        listOfNotNull(
                chatContext?.takeIf { it.isNotBlank() }?.let { "Earlier chat turns: $it" },
                clarificationContext
                    ?.takeIf { it.isNotBlank() }
                    ?.let { "Clarification context: $it" },
                changeHistoryContext?.takeIf { it.isNotBlank() }?.let { "Change history: $it" })
            .joinToString("\n")
    val userContent =
        buildUserContent(
            buildString {
              append(prompt)
              append(
                  "\n\nClassify the workflow mail nodes (consumer-facing vs internal) and translate the consumer-facing ones for these form languages.")
              if (contextSuffix.isNotBlank()) {
                append("\n\n")
                append(contextSuffix)
              }
            },
            emptyList())
    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(system)}},""")
      append("""{"role":"user","content":${gson.toJson(userContent)}}""")
      append("]")
    }
    val raw = instance.performFormAssist(modelId, messagesJson)
    var cleaned = extractJson(stripThinkTags(raw))
    logger.info(
        "[AICodBiAssistant] Workflow mail multilingualization AI response ({} chars): {}",
        cleaned.length,
        compactJsonForLog(cleaned).take(800))
    fun parseMailTasks(text: String): JsonArray =
        try {
          val parsed = JsonParser.parseString(text)
          when {
            parsed.isJsonArray -> parsed.asJsonArray
            parsed.isJsonObject -> {
              val mails = parsed.asJsonObject.get("mails")
              if (mails?.isJsonArray == true) mails.asJsonArray else JsonArray()
            }
            else -> JsonArray()
          }
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] Could not parse mail multilingualization AI response: {}",
              text.take(500))
          JsonArray()
        }
    // The model decides which mails are consumer-facing (no server-side filter — a deterministic
    // filter can never cover every way a mail is destined to the consumer). It must return an
    // explicit "toConsumer" verdict for EVERY candidate node; only nodes marked true are wrapped.
    fun entryVerdict(obj: JsonObject): Boolean? {
      val v = obj.get("toConsumer")
      return if (v?.isJsonPrimitive == true && v.asJsonPrimitive.isBoolean) v.asBoolean else null
    }
    fun missingVerdictIds(arr: JsonArray): List<String> {
      val answered = HashSet<String>()
      for (el in arr) {
        if (!el.isJsonObject) continue
        val o = el.asJsonObject
        val id = o.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
        if (id.isNotBlank() && entryVerdict(o) != null) answered.add(id)
      }
      return candidateIds.filterNot { answered.contains(it) }
    }
    var mailTasks = parseMailTasks(cleaned)
    var missing = missingVerdictIds(mailTasks)
    if (mailTasks.size() == 0 || missing.isNotEmpty()) {
      // The model ignored the output schema or omitted verdicts for some candidates. Retry ONCE
      // with
      // a strict corrective instruction; never fail the (already successful) form translation when
      // this optional pass still yields no usable verdicts.
      logger.warn(
          "[AICodBiAssistant] Mail multilingualization reply missing toConsumer verdicts for {} candidate node(s) ({}) — retrying once with a strict schema instruction",
          missing.size,
          compactJsonForLog(cleaned).take(300))
      val retryUser = buildString {
        append("Your previous reply did not follow the required format.\n")
        append("Reply with ONLY this JSON - nothing else:\n")
        append(
            "{\"mails\":[{\"targetNodeId\":\"<node id from CANDIDATE MAIL NODES>\",\"toConsumer\":true|false,\"translations\":{}}]}\n")
        append("Provide ONE 'mails' entry for EVERY node in CANDIDATE MAIL NODES (ids: ")
        append(candidateIds.joinToString(", "))
        append(")")
        if (missing.isNotEmpty()) {
          append(" — you MISSED a verdict for: ")
          append(missing.joinToString(", "))
        }
        append(
            ".\nSet 'toConsumer'=true ONLY for mails sent to the CONSUMER (the person who filled the form): DOI invitations, or emails to the submitter whose content is a confirmation/invitation/receipt FOR them. ")
        append(
            "It is false for internal/back-office notifications, operator error/alert mails and admin copies — even when the mail is configured with the submitter's email field as recipient; judge by intent (who reads it and why), never by the recipient string alone. ")
        append(
            "Provide 'translations' (subject/body per FORM LANGUAGE) ONLY for toConsumer=true nodes, into every language except the base language '$baseLanguage'; for toConsumer=false nodes set \"translations\":{}.")
      }
      val retryMessages = buildString {
        append("[")
        append("""{"role":"system","content":${gson.toJson(system)}},""")
        append("""{"role":"user","content":${gson.toJson(retryUser)}}""")
        append("]")
      }
      val retryRaw = instance.performFormAssist(modelId, retryMessages)
      cleaned = extractJson(stripThinkTags(retryRaw))
      logger.info(
          "[AICodBiAssistant] Workflow mail multilingualization retry response ({} chars): {}",
          cleaned.length,
          compactJsonForLog(cleaned).take(800))
      mailTasks = parseMailTasks(cleaned)
      missing = missingVerdictIds(mailTasks)
    }
    if (mailTasks.size() == 0 || missing.isNotEmpty()) {
      logger.info(
          "[AICodBiAssistant] Mail multilingualization: AI did not return a toConsumer verdict for every candidate node - leaving the workflow unchanged.")
      return ""
    }
    val consumerChosen = mutableListOf<String>()
    for (el in mailTasks) {
      if (!el.isJsonObject) continue
      val o = el.asJsonObject
      if (entryVerdict(o) == true) {
        val id = o.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
        if (id.isNotBlank() && candidateIds.contains(id)) consumerChosen.add(id)
      }
    }
    if (consumerChosen.isEmpty()) {
      logger.info(
          "[AICodBiAssistant] Mail multilingualization: the AI classified no candidate as consumer-facing - leaving the workflow unchanged.")
      return ""
    }
    logger.info(
        "[AICodBiAssistant] Mail multilingualization: AI marks {} mail node(s) as consumer-facing: {}",
        consumerChosen.size,
        consumerChosen.joinToString(", "))
    fun candidateOf(id: String): JsonObject? =
        mailCandidates
            .firstOrNull { c ->
              c.isJsonObject &&
                  c.asJsonObject
                      .get("targetNodeId")
                      ?.takeIf { it.isJsonPrimitive }
                      ?.asString
                      ?.trim() == id
            }
            ?.asJsonObject
    val messages = mutableListOf<String>()
    val handledNodeIds = mutableSetOf<String>()
    for (el in mailTasks) {
      if (!el.isJsonObject) continue
      val obj = el.asJsonObject
      if (entryVerdict(obj) != true) continue
      val targetId =
          obj.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
      if (!candidateIds.contains(targetId)) continue
      if (!handledNodeIds.add(targetId)) continue
      val translations = linkedMapOf<String, JsonObject>()
      val trEl = obj.get("translations")
      if (trEl?.isJsonObject == true) {
        for ((lang, v) in trEl.asJsonObject.entrySet()) {
          if (lang.isBlank() || !v.isJsonObject) continue
          translations[lang] = v.asJsonObject
        }
      }
      if (translations.isEmpty()) continue
      val cand = candidateOf(targetId)
      val kind = cand?.get("kind")?.takeIf { it.isJsonPrimitive }?.asString ?: "MAIL"
      val result =
          if (kind == "SWITCH") {
            // Extend an ALREADY multilingual [%lang%] switch with the missing language cases
            // (e.g. add en/fr to a de/it switch) instead of wrapping it again.
            val existing =
                (cand
                        ?.get("existingCaseLanguages")
                        ?.takeIf { it.isJsonArray }
                        ?.asJsonArray
                        ?.mapNotNull { e -> e.takeIf { it.isJsonPrimitive }?.asString?.trim() }
                        ?.filter { it.isNotBlank() } ?: emptyList())
                    .toSet()
            val sourceType = cand?.get("sourceType")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
            val sourceParams =
                cand?.get("sourceParams")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
            val defaultId =
                cand?.get("defaultBranchId")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
            val addLangs = langs.filter { it != baseLanguage && it !in existing }
            extendMailSwitchNode(
                workflowVersionId,
                targetId,
                addLangs,
                translations,
                sourceType,
                sourceParams,
                defaultId,
                userContext)
          } else {
            multilingualizeMailNode(workflowVersionId, targetId, langs, translations, userContext)
          }
      if (result.isNotBlank()) messages.add(result)
    }
    if (messages.isEmpty()) return ""
    try {
      touchWorkflowVersion(userContext, workflowVersionId)
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] touchWorkflowVersion after mail multilingualization failed: {}",
          e.message)
    }
    return "Multilingualized consumer mails: " + messages.joinToString(" | ")
  }

  /**
   * Wraps ONE existing FC_EMAIL / FC_DOI_INIT node in an FC_SWITCH on the "[%lang%]" placeholder.
   *
   * The mail node is converted IN PLACE into the FC_SWITCH (it keeps its position, parent and task,
   * so the lane's continuation after it is untouched). One FC_SWITCH_CASE child is created per form
   * language — the base-language case and the trailing FC_SWITCH_DEFAULT keep the ORIGINAL mail
   * parameters verbatim, every other case gets a clone whose subject/body/senderName come from
   * [translations]. Each case/default branch contains a SEQUENCE container with one mail node,
   * mirroring how FC_SWITCH branches are created in createWorkflowTask. No new
   * lane/trigger/endpoint is created. The FC_SWITCH_DEFAULT branch is created FIRST (index 0) —
   * Formcycle requires the default as the first child or the switch is invalid; the language cases
   * follow it.
   */
  private fun multilingualizeMailNode(
      workflowVersionId: Long,
      targetNodeId: String,
      languages: List<String>,
      translations: Map<String, JsonObject>,
      userContext: Any
  ): String {
    val nodeId =
        targetNodeId.trim().toLongOrNull() ?: return "Invalid target mail node id '$targetNodeId'."
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val iTransferableEntityClass =
          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
      val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
      val getById =
          workflowNodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId)
              ?: return "WorkflowVersion $workflowVersionId not found for mail multilingualization."
      val mailNode =
          getById.invoke(workflowNodeApi, userContext, nodeId)
              ?: return "WorkflowNode $nodeId not found — nothing to multilingualize."
      val type = (mailNode.javaClass.getMethod("getType").invoke(mailNode) as? String) ?: ""
      if (type != "FC_EMAIL" && type != "FC_DOI_INIT") {
        return "Node $nodeId is '$type', not a consumer mail/DOI node — skipped."
      }
      val origName =
          ((mailNode.javaClass.getMethod("getName").invoke(mailNode) as? String)?.trim()).orEmpty()
      val origParams =
          ((mailNode.javaClass.getMethod("getCustomParameters").invoke(mailNode) as? String))
              .orEmpty()
      val task =
          mailNode.javaClass.getMethod("getTask").invoke(mailNode)
              ?: return "Node $nodeId has no task — skipped."

      // 1) Convert the mail node IN PLACE into the FC_SWITCH (keeps position/parent/task).
      val switchName = sanitizeWorkflowName("Sprache: ${origName.ifBlank { "Mail" }}")
      val switchSpec =
          WorkflowTaskSpec(
              taskName = switchName,
              nodeType = "FC_SWITCH",
              nodeParams = mapOf("switchValue" to "[%lang%]"))
      val switchParams =
          buildNodeParamsJsonWithIcon(switchSpec, workflowVersion, userContext, "FC_SWITCH")
      workflowNodeClass.getMethod("setType", String::class.java).invoke(mailNode, "FC_SWITCH")
      workflowNodeClass.getMethod("setName", String::class.java).invoke(mailNode, switchName)
      if (switchParams != null) {
        workflowNodeClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(mailNode, switchParams)
        stampCustomParamsVersion(workflowNodeClass, mailNode)
      }
      workflowNodeApi.javaClass
          .getMethod("update", ucClass, iTransferableEntityClass)
          .invoke(workflowNodeApi, userContext, mailNode)
      // Re-fetch so the new children attach to the persisted switch node.
      val switchNode =
          getById.invoke(workflowNodeApi, userContext, nodeId)
              ?: return "Could not reload converted switch node $nodeId."
      val createNode =
          workflowNodeApi.javaClass.getMethod("create", ucClass, iTransferableEntityClass)
      val langs = languages.filter { it.isNotBlank() }.distinct()
      if (langs.isEmpty()) return "No languages for node $nodeId — skipped."
      val baseLanguage = langs.first()

      // Create a mail clone node (name/type/params) as a child of the given container.
      fun createMailClone(parent: Any, mailName: String, mailParams: String): String {
        val mail = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass
            .getMethod("setName", String::class.java)
            .invoke(mail, sanitizeWorkflowName(mailName))
        workflowNodeClass.getMethod("setType", String::class.java).invoke(mail, type)
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(mail, true)
        workflowNodeClass
            .getMethod("setUUIDObject", UUID::class.java)
            .invoke(mail, UUID.randomUUID())
        if (mailParams.isNotBlank()) {
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(mail, mailParams)
          stampCustomParamsVersion(workflowNodeClass, mail)
        }
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(mail, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(mail, parent)
        val saved = createNode.invoke(workflowNodeApi, userContext, mail)
        fixParentOrderIndex(saved, parent, userContext)
        return "$type '${sanitizeWorkflowName(mailName)}'"
      }

      // Create a branch (FC_SWITCH_CASE/FC_SWITCH_DEFAULT) under the switch with a SEQUENCE
      // container
      // holding one mail clone — mirrors createWorkflowTask's FC_SWITCH branch structure.
      fun createBranch(
          branchType: String,
          branchName: String,
          branchParams: String,
          mailName: String,
          mailParams: String
      ) {
        val branch = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(branch, branchName)
        workflowNodeClass.getMethod("setType", String::class.java).invoke(branch, branchType)
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(branch, true)
        workflowNodeClass
            .getMethod("setUUIDObject", UUID::class.java)
            .invoke(branch, UUID.randomUUID())
        workflowNodeClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(branch, branchParams)
        stampCustomParamsVersion(workflowNodeClass, branch)
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(branch, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(branch, switchNode)
        val savedBranch = createNode.invoke(workflowNodeApi, userContext, branch)
        fixParentOrderIndex(savedBranch, switchNode, userContext)
        val seq = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(seq, "FcSequenceHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(seq, "SEQUENCE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(seq, true)
        workflowNodeClass
            .getMethod("setUUIDObject", UUID::class.java)
            .invoke(seq, UUID.randomUUID())
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(seq, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(seq, savedBranch)
        val savedSeq = createNode.invoke(workflowNodeApi, userContext, seq)
        fixParentOrderIndex(savedSeq, savedBranch, userContext)
        createMailClone(savedSeq, mailName, mailParams)
      }

      // 2) Children: the FC_SWITCH_DEFAULT branch FIRST (index 0) — Formcycle treats the first
      // child
      //    as the switch's default and marks the node INVALID when the default is anywhere else —
      //    then one FC_SWITCH_CASE per form language. The default + base-language case keep the
      //    ORIGINAL mail verbatim; the other cases carry the translated clones.
      var caseCount = 0
      val wrappedLanguages = mutableListOf<String>()
      createBranch(
          "FC_SWITCH_DEFAULT",
          "FcSwitchDefaultHandler",
          "{}",
          origName.ifBlank { "Mail" },
          origParams)
      for (lang in langs) {
        val caseValueJson =
            """{"caseValue":${gson.toJson(lang)},"matchCondition":"EQUAL","variableName":"C1"}"""
        val caseParams =
            """{"caseValues":[$caseValueJson],"combinationType":"OR","description":${gson.toJson("Sprache: $lang")}}"""
        val isBase = lang == baseLanguage
        val mailName =
            if (isBase) origName.ifBlank { "Mail" } else "${origName.ifBlank { "Mail" }} ($lang)"
        val mailParams =
            if (isBase) origParams
            else
                translations[lang]?.let { applyMailTranslationParams(origParams, it) } ?: origParams
        createBranch("FC_SWITCH_CASE", "FcSwitchCaseHandler", caseParams, mailName, mailParams)
        wrappedLanguages.add(lang)
        caseCount++
      }
      logger.info(
          "[AICodBiAssistant] Wrapped mail node {} into FC_SWITCH on [%lang%] — default first + {} language case(s)",
          nodeId,
          caseCount)
      return "wrapped $type '${origName.ifBlank { "Mail" }}' (#$nodeId) into FC_SWITCH on [%lang%] for " +
          wrappedLanguages.joinToString(", ")
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] multilingualizeMailNode failed for node {}: {}",
          targetNodeId,
          e.message)
      return "Mail multilingualization of node $targetNodeId failed: ${e.message}"
    }
  }

  /**
   * EXTENDS an existing FC_SWITCH on "[%lang%]" (created by an earlier multilingualize run) with
   * one new FC_SWITCH_CASE + SEQUENCE + mail clone per [addLanguages]. Each new case carries the
   * ORIGINAL (base-language) mail translated into that language ([translations]); the
   * FC_SWITCH_DEFAULT branch stays at index 0 (the FIRST child — Formcycle requires the default
   * first or the switch is invalid). This is what lets adding e.g. English+French LATER extend an
   * existing de/it consumer-mail switch instead of leaving English/French consumers on the German
   * (default) mail. Never creates a lane/trigger/ endpoint and never touches the switch's existing
   * cases.
   */
  private fun extendMailSwitchNode(
      workflowVersionId: Long,
      targetNodeId: String,
      addLanguages: List<String>,
      translations: Map<String, JsonObject>,
      sourceType: String,
      sourceParams: String,
      defaultBranchId: String,
      userContext: Any
  ): String {
    val nodeId =
        targetNodeId.trim().toLongOrNull()
            ?: return "Invalid target switch node id '$targetNodeId'."
    val addLangs = addLanguages.filter { it.isNotBlank() }.distinct()
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val iTransferableEntityClass =
          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
      val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
      val getById =
          workflowNodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      val switchNode =
          getById.invoke(workflowNodeApi, userContext, nodeId)
              ?: return "WorkflowNode $nodeId not found — nothing to extend."
      val switchType =
          (switchNode.javaClass.getMethod("getType").invoke(switchNode) as? String) ?: ""
      if (switchType != "FC_SWITCH") {
        return "Node $nodeId is '$switchType', not an FC_SWITCH — skipped."
      }
      val task =
          switchNode.javaClass.getMethod("getTask").invoke(switchNode)
              ?: return "Node $nodeId has no task — skipped."
      val baseName =
          ((switchNode.javaClass.getMethod("getName").invoke(switchNode) as? String)?.trim())
              .orEmpty()
              .ifBlank { "Mail" }
      val mailType = if (sourceType.isBlank()) "FC_EMAIL" else sourceType
      val createNode =
          workflowNodeApi.javaClass.getMethod("create", ucClass, iTransferableEntityClass)

      fun createMailClone(parent: Any, mailName: String, mailParams: String) {
        val mail = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass
            .getMethod("setName", String::class.java)
            .invoke(mail, sanitizeWorkflowName(mailName))
        workflowNodeClass.getMethod("setType", String::class.java).invoke(mail, mailType)
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(mail, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(mail, java.util.UUID.randomUUID())
        if (mailParams.isNotBlank()) {
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(mail, mailParams)
          stampCustomParamsVersion(workflowNodeClass, mail)
        }
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(mail, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(mail, parent)
        val saved = createNode.invoke(workflowNodeApi, userContext, mail)
        fixParentOrderIndex(saved, parent, userContext)
      }

      fun createCaseBranch(lang: String, mailName: String, mailParams: String) {
        val caseValueJson =
            """{"caseValue":${gson.toJson(lang)},"matchCondition":"EQUAL","variableName":"C1"}"""
        val caseParams =
            """{"caseValues":[$caseValueJson],"combinationType":"OR","description":${gson.toJson("Sprache: $lang")}}"""
        val branch = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass
            .getMethod("setName", String::class.java)
            .invoke(branch, "FcSwitchCaseHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(branch, "FC_SWITCH_CASE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(branch, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(branch, java.util.UUID.randomUUID())
        workflowNodeClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(branch, caseParams)
        stampCustomParamsVersion(workflowNodeClass, branch)
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(branch, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(branch, switchNode)
        val savedBranch = createNode.invoke(workflowNodeApi, userContext, branch)
        fixParentOrderIndex(savedBranch, switchNode, userContext)
        val seq = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(seq, "FcSequenceHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(seq, "SEQUENCE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(seq, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(seq, java.util.UUID.randomUUID())
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(seq, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(seq, savedBranch)
        val savedSeq = createNode.invoke(workflowNodeApi, userContext, seq)
        fixParentOrderIndex(savedSeq, savedBranch, userContext)
        createMailClone(savedSeq, mailName, mailParams)
      }

      val addedLangs = mutableListOf<String>()
      for (lang in addLangs) {
        val translation = translations[lang] ?: continue
        val mailParams = applyMailTranslationParams(sourceParams, translation)
        createCaseBranch(lang, "$baseName ($lang)", mailParams)
        addedLangs.add(lang)
      }
      // Formcycle requires the FC_SWITCH_DEFAULT branch at parent_order_idx 0 (the FIRST child) — a
      // switch whose default is anywhere else is INVALID. Reorder after appending the new cases
      // (no-op when the default already is first); this ALSO heals switches generated before this
      // rule, even when nothing new was added.
      ensureSwitchDefaultFirst(workflowNodeApi, ucClass, userContext, nodeId)
      if (addedLangs.isEmpty()) {
        return "" // every requested language is already present — ordering healed above
      }
      logger.info(
          "[AICodBiAssistant] Extended existing FC_SWITCH {} on [%lang%] with new language case(s): {}",
          nodeId,
          addedLangs.joinToString(", "))
      return "extended FC_SWITCH '#$nodeId' with language case(s): " + addedLangs.joinToString(", ")
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] extendMailSwitchNode failed for node {}: {}", targetNodeId, e.message)
      return "Extending switch node $targetNodeId failed: ${e.message}"
    }
  }

  // ---------------------------------------------------------------------------
  // Abschlussseiten / ending-page multilingualization (FC_SHOW_TEMPLATE nodes).
  //
  // STATUS (2026-09-06): ACTIVE in REUSE-ONLY form. Server-side CREATION of the Abschlussseiten
  // (HTTP response templates in TEMPLATE_CLIENT) proved impossible from the plugin — no JPA entity
  // maps TEMPLATE_CLIENT, its TEXTVALUE is encrypted at rest, and no Formcycle API/DAO/service that
  // creates these pages exists in the published jars nor on APIProvider (only
  // AppointmentTemplateAPI).
  // The ACTIVE pass therefore NEVER creates or edits a page: it only wraps a consumer
  // FC_SHOW_TEMPLATE
  // node into an FC_SWITCH on [%lang%] and points each non-base case at the ALREADY EXISTING
  // localized
  // page whose NAME is "<base> _CB_<LANG>" (e.g. "… _CB_EN"); a language without such a page falls
  // back to the ORIGINAL page. NAME + UUID are read plain-text from TEMPLATE_CLIENT; the encrypted
  // TEXTVALUE is never read. The active code lives further below (the reuse-only section):
  //   listClientTemplates / findLocalizedTemplate / extendEndPageSwitchNode /
  //   runEndPageMultilingualization  +  multilingualizeEndPageNode / applyEndPageTranslationParams
  // (which are called by that pass). Everything between this banner and that reuse-only section —
  // readTemplatePage, tableAnnotationName, discoverTemplateEntityClass, templateEntityClasses,
  // loadTemplateEntity, setIfPresent, copyScalarProperty, setTemplateText, setNewUuid,
  // ensureEndPageForLanguage and runEndPageMultilingualizationSuperseded — is the SUPERSEDED
  // creation-era machinery: inert, never called, kept for reference only.
  //
  // An Abschlussseite shown to the consumer is an FC_SHOW_TEMPLATE workflow node whose
  // customParameters carry an "htmlTemplate" UuidEntityRef to a server-side TEMPLATE_CLIENT row
  // (columns NAME/UUID/TEXTVALUE HTML, CLIENT_ID, no language column -> one row per language).
  // The multilingualize wrap converts a consumer FC_SHOW_TEMPLATE node into an FC_SWITCH on
  // [%lang%]; the FC_SWITCH_DEFAULT (index 0) and the base-language case keep the ORIGINAL page,
  // every other case's htmlTemplate.uuid is rewritten to the localized "_CB_<LANG>" page (or stays
  // on
  // the original when no localization exists yet).
  // ---------------------------------------------------------------------------

  /**
   * Reads the DECRYPTED page (NAME + text) of a TEMPLATE_CLIENT row by uuid via the entity API (the
   * TEXTVALUE column is stored encrypted — a raw native read yields ciphertext, so the content must
   * be read through the mapped entity's getter).
   */
  private fun readTemplatePage(userContext: Any, pageUuid: String): Pair<String, String>? {
    if (pageUuid.isBlank()) return null
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      val loaded = loadTemplateEntity(em, pageUuid) ?: return null
      val entity = loaded.first
      val name =
          runCatching { entity.javaClass.getMethod("getName").invoke(entity) as? String }
              .getOrNull() ?: ""
      var text = ""
      for (g in
          listOf(
              "getTextValue",
              "getText",
              "getValue",
              "getHtml",
              "getHtmlValue",
              "getContent",
              "getTemplateText")) {
        try {
          val gm = entity.javaClass.getMethod(g)
          if (gm.returnType == String::class.java || gm.returnType == CharSequence::class.java) {
            val v = gm.invoke(entity) as? String
            if (v != null) {
              text = v
              break
            }
          }
        } catch (_: Exception) {}
      }
      if (name.isBlank() && text.isEmpty()) return null
      return name to text
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] readTemplatePage failed for uuid {}: {}", pageUuid, e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * Returns the @Table name (case-insensitive) of an entity class via
   * javax/jakarta.persistence.Table.
   */
  private fun tableAnnotationName(javaType: Class<*>): String? {
    for (ann in javaType.annotations) {
      val ja = ann as java.lang.annotation.Annotation
      val annTypeName = ja.annotationType().name
      if (annTypeName == "javax.persistence.Table" || annTypeName == "jakarta.persistence.Table") {
        try {
          val nm = ja.annotationType().getMethod("name").invoke(ja) as? String
          if (!nm.isNullOrBlank()) return nm
        } catch (_: Exception) {}
      }
    }
    return null
  }

  /** Discovers the entity class mapped to the TEMPLATE_CLIENT table via the JPA metamodel. */
  private fun discoverTemplateEntityClass(em: Any): Class<*>? {
    return try {
      val metamodel = em.javaClass.getMethod("getMetamodel").invoke(em)
      val entities =
          metamodel.javaClass.getMethod("getEntities").invoke(metamodel) as? Collection<*>
              ?: return null
      for (et in entities) {
        if (et == null) continue
        try {
          val javaType = et.javaClass.getMethod("getJavaType").invoke(et) as? Class<*> ?: continue
          val tableName = tableAnnotationName(javaType)
          if (tableName != null && tableName.equals("TEMPLATE_CLIENT", ignoreCase = true)) {
            logger.info(
                "[AICodBiAssistant] Discovered TEMPLATE_CLIENT entity class {}", javaType.name)
            return javaType
          }
        } catch (_: Exception) {
          continue
        }
      }
      logger.warn("[AICodBiAssistant] No entity class maps to TEMPLATE_CLIENT in the metamodel")
      null
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] discoverTemplateEntityClass failed: {}", e.message)
      null
    }
  }

  /**
   * Candidate template entity classes for a TEMPLATE_CLIENT row (fallback when no metamodel match).
   */
  private fun templateEntityClasses(): List<Class<*>> {
    val names =
        listOf(
            "de.xima.fc.entities.ClientTemplate",
            "de.xima.fc.entities.TextTemplate",
            "de.xima.fc.entities.FormTemplate")
    return names.mapNotNull { n -> runCatching { Class.forName(n) }.getOrNull() }
  }

  /** Loads the entity instance of a TEMPLATE_CLIENT row by uuid via EntityManager.find. */
  private fun loadTemplateEntity(em: Any, pageUuid: String): Pair<Any, Class<*>>? {
    try {
      val idQ =
          em.javaClass
              .getMethod("createNativeQuery", String::class.java)
              .invoke(em, "SELECT ID FROM TEMPLATE_CLIENT WHERE UUID = :u") as Any
      val setP = idQ.javaClass.getMethod("setParameter", String::class.java, Any::class.java)
      setP.invoke(idQ, "u", pageUuid)
      idQ.javaClass.getMethod("setMaxResults", Int::class.javaPrimitiveType).invoke(idQ, 1)
      val rows = idQ.javaClass.getMethod("getResultList").invoke(idQ) as List<*>
      if (rows.isEmpty()) return null
      val raw = rows[0]
      val id = (if (raw is Array<*>) raw[0] else raw).toString().toLongOrNull() ?: return null
      val discovered = discoverTemplateEntityClass(em)
      val classes =
          (if (discovered != null) listOf(discovered) else emptyList<Class<*>>()) +
              templateEntityClasses()
      val find = em.javaClass.getMethod("find", Class::class.java, Any::class.java)
      for (clazz in classes.distinct()) {
        try {
          val inst = find.invoke(em, clazz, id)
          if (inst != null) {
            logger.info(
                "[AICodBiAssistant] Loaded TEMPLATE_CLIENT entity {} (uuid {})",
                clazz.name,
                pageUuid)
            return inst to clazz
          }
        } catch (_: Exception) {
          continue
        }
      }
      return null
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] loadTemplateEntity failed for uuid {}: {}", pageUuid, e.message)
      return null
    }
  }

  /** Invokes a single-arg setter when present, coercing common types. Returns true when invoked. */
  private fun setIfPresent(target: Any, setterName: String, value: Any?): Boolean {
    if (value == null) return false
    try {
      val m =
          target.javaClass.methods.firstOrNull { it.name == setterName && it.parameterCount == 1 }
              ?: return false
      val p = m.parameterTypes[0]
      val v: Any? =
          when {
            p.isInstance(value) -> value
            p == String::class.java -> value.toString()
            (p == Boolean::class.javaPrimitiveType || p == java.lang.Boolean::class.java) &&
                value is Boolean -> value
            (p == Long::class.javaPrimitiveType || p == java.lang.Long::class.java) &&
                value is Number -> value.toLong()
            (p == Integer::class.javaPrimitiveType || p == java.lang.Integer::class.java) &&
                value is Number -> value.toInt()
            else -> null
          }
      if (v != null) {
        m.invoke(target, v)
        return true
      }
    } catch (_: Exception) {}
    return false
  }

  /** Copies one scalar property (getter -> setter) between two objects when both exist. */
  private fun copyScalarProperty(src: Any, dst: Any, getterName: String, setterName: String) {
    try {
      val g =
          src.javaClass.methods.firstOrNull { it.name == getterName && it.parameterCount == 0 }
              ?: return
      val v = g.invoke(src)
      setIfPresent(dst, setterName, v)
    } catch (_: Exception) {}
  }

  /**
   * Sets the HTML content via the first matching string setter (textValue/text/value/html/content).
   */
  private fun setTemplateText(dst: Any, html: String): Boolean {
    for (setter in
        listOf("setTextValue", "setText", "setValue", "setHtml", "setHtmlValue", "setContent")) {
      try {
        if (setIfPresent(dst, setter, html)) return true
      } catch (_: Exception) {}
    }
    return false
  }

  /** Sets a fresh UUID via setUuidObject(UUID) / setUuid(UUID|String). Returns true on success. */
  private fun setNewUuid(dst: Any, uuid: java.util.UUID): Boolean {
    for (setter in listOf("setUuidObject", "setUuid")) {
      try {
        val m =
            dst.javaClass.methods.firstOrNull { it.name == setter && it.parameterCount == 1 }
                ?: continue
        val p = m.parameterTypes[0]
        if (p == java.util.UUID::class.java) {
          m.invoke(dst, uuid)
          return true
        }
        if (p == String::class.java) {
          m.invoke(dst, uuid.toString())
          return true
        }
      } catch (_: Exception) {}
    }
    return false
  }

  /**
   * Ensures a per-language Abschlussseite exists in TEMPLATE_CLIENT and returns its (uuid, name).
   * Reuses an existing page whose NAME equals [translatedName] for the same client; otherwise it
   * CLONES the base page entity (the class that maps to TEMPLATE_CLIENT) via the Formcycle entity
   * API with rollback + full logging on failure. Never throws.
   */
  private fun ensureEndPageForLanguage(
      userContext: Any,
      origUuid: String,
      baseName: String,
      translatedName: String,
      translatedHtml: String
  ): Pair<String, String>? {
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    val tx =
        try {
          em.javaClass.getMethod("getTransaction").invoke(em)
        } catch (_: Exception) {
          em.close()
          return null
        }
    try {
      val begin = tx.javaClass.getMethod("begin")
      val commit = tx.javaClass.getMethod("commit")
      val rollback = tx.javaClass.getMethod("rollback")
      val createNQ = em.javaClass.getMethod("createNativeQuery", String::class.java)
      val persist = em.javaClass.getMethod("persist", Any::class.java)
      val flush = em.javaClass.getMethod("flush")

      // Original row's CLIENT_ID (for scoping the "exists?" check and the new row).
      val clientIdQ = createNQ.invoke(em, "SELECT CLIENT_ID FROM TEMPLATE_CLIENT WHERE UUID = :u")
      clientIdQ.javaClass
          .getMethod("setParameter", String::class.java, Any::class.java)
          .invoke(clientIdQ, "u", origUuid)
      clientIdQ.javaClass
          .getMethod("setMaxResults", Int::class.javaPrimitiveType)
          .invoke(clientIdQ, 1)
      val crows = clientIdQ.javaClass.getMethod("getResultList").invoke(clientIdQ) as List<*>
      val clientId =
          if (crows.isEmpty()) null
          else {
            val raw = crows[0]
            ((if (raw is Array<*>) raw[0] else raw)?.toString())?.toLongOrNull()
          }
      logger.info(
          "[AICodBiAssistant] ensureEndPageForLanguage: origUuid={} clientId={} newName='{}'",
          origUuid,
          clientId ?: "?",
          translatedName)

      // Reuse an existing per-language page with the same name (same client) if present.
      if (clientId != null) {
        try {
          val exQ =
              createNQ.invoke(
                  em, "SELECT UUID FROM TEMPLATE_CLIENT WHERE CLIENT_ID = :c AND NAME = :n")
          val sp = exQ.javaClass.getMethod("setParameter", String::class.java, Any::class.java)
          sp.invoke(exQ, "c", clientId)
          sp.invoke(exQ, "n", translatedName)
          exQ.javaClass.getMethod("setMaxResults", Int::class.javaPrimitiveType).invoke(exQ, 1)
          val erows = exQ.javaClass.getMethod("getResultList").invoke(exQ) as List<*>
          if (erows.isNotEmpty()) {
            val raw = erows[0]
            val u = ((if (raw is Array<*>) raw[0] else raw)?.toString()).orEmpty()
            if (u.isNotBlank()) {
              logger.info(
                  "[AICodBiAssistant] ensureEndPageForLanguage: REUSED existing page '{}' uuid={}",
                  translatedName,
                  u)
              return u to translatedName
            }
          }
        } catch (_: Exception) {}
      }

      // Load the base page as an entity and clone it.
      val loaded =
          loadTemplateEntity(em, origUuid)
              ?: run {
                logger.warn(
                    "[AICodBiAssistant] ensureEndPageForLanguage: could not load base page '{}' ({}) — aborting (no DB write)",
                    baseName,
                    origUuid)
                return null
              }
      val (orig, clazz) = loaded
      begin.invoke(tx)
      try {
        val clone = clazz.getDeclaredConstructor().newInstance()
        // Copy structural/scalar fields from the original (best effort; unknown setters are
        // skipped).
        copyScalarProperty(orig, clone, "getType", "setType")
        copyScalarProperty(orig, clone, "getMsgCode", "setMsgCode")
        copyScalarProperty(orig, clone, "getDescription", "setDescription")
        copyScalarProperty(orig, clone, "getFlagSystem", "setFlagSystem")
        copyScalarProperty(orig, clone, "getFlagDeprecated", "setFlagDeprecated")
        copyScalarProperty(orig, clone, "getDeletable", "setDeletable")
        copyScalarProperty(orig, clone, "getDelable", "setDelable")
        copyScalarProperty(orig, clone, "getClient", "setClient")
        // Mandatory fields:
        val nameOk = setIfPresent(clone, "setName", translatedName)
        val textOk = setTemplateText(clone, translatedHtml)
        val uuid = java.util.UUID.randomUUID()
        val uuidOk = setNewUuid(clone, uuid)
        logger.info(
            "[AICodBiAssistant] ensureEndPageForLanguage: cloned {} -> nameOk={} textOk={} uuidOk={}",
            clazz.name,
            nameOk,
            textOk,
            uuidOk)
        if (!nameOk || !textOk || !uuidOk) {
          rollback.invoke(tx)
          logger.warn(
              "[AICodBiAssistant] ensureEndPageForLanguage: missing mandatory setter (name={} text={} uuid={}) — rolled back, nothing written",
              nameOk,
              textOk,
              uuidOk)
          return null
        }
        persist.invoke(em, clone)
        try {
          flush.invoke(em)
        } catch (_: Exception) {
          // Some mappings assign the UUID lazily on flush/commit — tolerate.
        }
        // Read back the stored uuid.
        var storedUuid: String? = null
        for (g in listOf("getUUIDObject", "getUuid")) {
          try {
            val gm = clone.javaClass.getMethod(g)
            val v = gm.invoke(clone)
            storedUuid =
                when (v) {
                  is java.util.UUID -> v.toString()
                  else -> v?.toString()
                }
            if (!storedUuid.isNullOrBlank()) break
          } catch (_: Exception) {}
        }
        commit.invoke(tx)
        val resultUuid = storedUuid ?: uuid.toString()
        logger.info(
            "[AICodBiAssistant] ensureEndPageForLanguage: CREATED page '{}' uuid={} (entity {})",
            translatedName,
            resultUuid,
            clazz.name)
        return resultUuid to translatedName
      } catch (e: Exception) {
        try {
          rollback.invoke(tx)
        } catch (_: Exception) {}
        logger.warn(
            "[AICodBiAssistant] ensureEndPageForLanguage: creation failed and was rolled back: {}",
            e.message)
        return null
      }
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] ensureEndPageForLanguage failed (orig '{}'): {}", baseName, e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * Rewrites the customParameters JSON of an FC_SHOW_TEMPLATE node so its htmlTemplate
   * UuidEntityRef points at [pageUuid]; every other parameter (including the ref's
   * entityClass/type) stays as the original. Falls back to the original params verbatim when not
   * editable JSON.
   */
  private fun applyEndPageTranslationParams(origParams: String, pageUuid: String): String {
    return try {
      val params = JsonParser.parseString(origParams).asJsonObject
      val ref = params.getAsJsonObject("htmlTemplate")
      if (ref != null) {
        ref.addProperty("uuid", pageUuid)
        ref.addProperty("id", pageUuid)
      }
      params.toString()
    } catch (_: Exception) {
      origParams
    }
  }

  /**
   * Wraps ONE FC_SHOW_TEMPLATE node (a consumer Abschlussseite) in place into an FC_SWITCH on
   * "[%lang%]" — mirrors multilingualizeMailNode. The FC_SWITCH_DEFAULT (index 0) and the base-
   * language case keep the ORIGINAL node params; every other case gets an FC_SHOW_TEMPLATE clone
   * whose htmlTemplate.uuid points at [langPages]' page for that language.
   */
  private fun multilingualizeEndPageNode(
      workflowVersionId: Long,
      targetNodeId: String,
      languages: List<String>,
      langPages: Map<String, Pair<String, String>>,
      userContext: Any
  ): String {
    val nodeId =
        targetNodeId.trim().toLongOrNull()
            ?: return "Invalid target ending-page node id '$targetNodeId'."
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val iTransferableEntityClass =
          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
      val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
      val getById =
          workflowNodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId)
              ?: return "WorkflowVersion $workflowVersionId not found for ending-page multilingualization."
      val pageNode =
          getById.invoke(workflowNodeApi, userContext, nodeId)
              ?: return "WorkflowNode $nodeId not found — nothing to multilingualize."
      val type = (pageNode.javaClass.getMethod("getType").invoke(pageNode) as? String) ?: ""
      if (type != "FC_SHOW_TEMPLATE") {
        return "Node $nodeId is '$type', not an FC_SHOW_TEMPLATE ending-page node — skipped."
      }
      val origName =
          ((pageNode.javaClass.getMethod("getName").invoke(pageNode) as? String)?.trim()).orEmpty()
      val origParams =
          ((pageNode.javaClass.getMethod("getCustomParameters").invoke(pageNode) as? String))
              .orEmpty()
      val task =
          pageNode.javaClass.getMethod("getTask").invoke(pageNode)
              ?: return "Node $nodeId has no task — skipped."

      // 1) Convert the FC_SHOW_TEMPLATE node IN PLACE into the FC_SWITCH.
      val switchName = sanitizeWorkflowName("Sprache: ${origName.ifBlank { "Endseite" }}")
      val switchSpec =
          WorkflowTaskSpec(
              taskName = switchName,
              nodeType = "FC_SWITCH",
              nodeParams = mapOf("switchValue" to "[%lang%]"))
      val switchParams =
          buildNodeParamsJsonWithIcon(switchSpec, workflowVersion, userContext, "FC_SWITCH")
      workflowNodeClass.getMethod("setType", String::class.java).invoke(pageNode, "FC_SWITCH")
      workflowNodeClass.getMethod("setName", String::class.java).invoke(pageNode, switchName)
      if (switchParams != null) {
        workflowNodeClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(pageNode, switchParams)
        stampCustomParamsVersion(workflowNodeClass, pageNode)
      }
      workflowNodeApi.javaClass
          .getMethod("update", ucClass, iTransferableEntityClass)
          .invoke(workflowNodeApi, userContext, pageNode)
      val switchNode =
          getById.invoke(workflowNodeApi, userContext, nodeId)
              ?: return "Could not reload converted switch node $nodeId."
      val createNode =
          workflowNodeApi.javaClass.getMethod("create", ucClass, iTransferableEntityClass)
      val langs = languages.filter { it.isNotBlank() }.distinct()
      if (langs.isEmpty()) return "No languages for node $nodeId — skipped."
      val baseLanguage = langs.first()

      fun createPageClone(parent: Any, pageName: String, pageParams: String): String {
        val clone = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass
            .getMethod("setName", String::class.java)
            .invoke(clone, sanitizeWorkflowName(pageName))
        workflowNodeClass.getMethod("setType", String::class.java).invoke(clone, "FC_SHOW_TEMPLATE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(clone, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(clone, java.util.UUID.randomUUID())
        if (pageParams.isNotBlank()) {
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(clone, pageParams)
          stampCustomParamsVersion(workflowNodeClass, clone)
        }
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(clone, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(clone, parent)
        val saved = createNode.invoke(workflowNodeApi, userContext, clone)
        fixParentOrderIndex(saved, parent, userContext)
        return "FC_SHOW_TEMPLATE '${sanitizeWorkflowName(pageName)}'"
      }

      fun createBranch(
          branchType: String,
          branchName: String,
          branchParams: String,
          pageName: String,
          pageParams: String
      ) {
        val branch = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(branch, branchName)
        workflowNodeClass.getMethod("setType", String::class.java).invoke(branch, branchType)
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(branch, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(branch, java.util.UUID.randomUUID())
        workflowNodeClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(branch, branchParams)
        stampCustomParamsVersion(workflowNodeClass, branch)
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(branch, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(branch, switchNode)
        val savedBranch = createNode.invoke(workflowNodeApi, userContext, branch)
        fixParentOrderIndex(savedBranch, switchNode, userContext)
        val seq = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(seq, "FcSequenceHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(seq, "SEQUENCE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(seq, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(seq, java.util.UUID.randomUUID())
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(seq, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(seq, savedBranch)
        val savedSeq = createNode.invoke(workflowNodeApi, userContext, seq)
        fixParentOrderIndex(savedSeq, savedBranch, userContext)
        createPageClone(savedSeq, pageName, pageParams)
      }

      // 2) Children: FC_SWITCH_DEFAULT FIRST (index 0 — Formcycle requires the default as the first
      //    child or the node is INVALID), then one FC_SWITCH_CASE per language. Non-base cases
      //    reference the per-language page; a language without a localization keeps the original.
      var caseCount = 0
      val wrappedLanguages = mutableListOf<String>()
      createBranch(
          "FC_SWITCH_DEFAULT",
          "FcSwitchDefaultHandler",
          "{}",
          origName.ifBlank { "Endseite" },
          origParams)
      for (lang in langs) {
        val caseValueJson =
            """{"caseValue":${gson.toJson(lang)},"matchCondition":"EQUAL","variableName":"C1"}"""
        val caseParams =
            """{"caseValues":[$caseValueJson],"combinationType":"OR","description":${gson.toJson("Sprache: $lang")}}"""
        val isBase = lang == baseLanguage
        val pageEntry = langPages[lang]
        val pageName =
            if (isBase) origName.ifBlank { "Endseite" }
            else pageEntry?.second ?: origName.ifBlank { "Endseite" }
        val pageParams =
            when {
              isBase -> origParams
              pageEntry != null -> applyEndPageTranslationParams(origParams, pageEntry.first)
              else -> origParams
            }
        createBranch("FC_SWITCH_CASE", "FcSwitchCaseHandler", caseParams, pageName, pageParams)
        wrappedLanguages.add(lang)
        caseCount++
      }
      logger.info(
          "[AICodBiAssistant] Wrapped ending-page node {} into FC_SWITCH on [%lang%] — default first + {} language case(s)",
          nodeId,
          caseCount)
      return "wrapped ending page '${origName.ifBlank { "Endseite" }}' (#$nodeId) into FC_SWITCH on [%lang%] for " +
          wrappedLanguages.joinToString(", ")
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] multilingualizeEndPageNode failed for node {}: {}",
          targetNodeId,
          e.message)
      return "Ending-page multilingualization of node $targetNodeId failed: ${e.message}"
    }
  }

  /**
   * SUPERSEDED (2026-09-06): this creation-based ending-page pass is NOT called anymore — it tried
   * to CREATE per-language TEMPLATE_CLIENT pages server-side, which is impossible from the plugin
   * (no JPA entity maps TEMPLATE_CLIENT, TEXTVALUE is encrypted at rest, no creation API exists).
   * The ACTIVE reuse-only pass is `runEndPageMultilingualization` below (wraps into an [%lang%]
   * FC_SWITCH and references ALREADY EXISTING localized pages named "<base> _CB_<LANG>"; falls back
   * to the original page when no localization exists). This function is kept inert for reference
   * only.
   */
  private fun runEndPageMultilingualizationSuperseded(
      prompt: String,
      languages: List<String>,
      workflowVersionId: Long,
      params: IPluginServletActionParams,
      modelId: String,
      instance: Standard,
      chatContext: String?,
      clarificationContext: String?,
      changeHistoryContext: String?
  ): String {
    val langs = languages.filter { it.isNotBlank() }.distinct()
    if (langs.size < 2) return ""
    val userContext = getUserContext(params)
    val workflowJson =
        buildWorkflowStructureContext(workflowVersionId, userContext)
            ?: run {
              logger.warn(
                  "[AICodBiAssistant] No workflow context for ending-page multilingualization (workflowVersion {}).",
                  workflowVersionId)
              return ""
            }
    val baseLanguage = langs.first()

    fun collectEndPageCandidates(el: JsonElement, out: JsonArray) {
      if (!el.isJsonObject) return
      val o = el.asJsonObject
      val nodeType = o.get("type")?.asString ?: ""
      if (nodeType == "FC_SHOW_TEMPLATE") {
        val id = o.get("id")?.asString ?: ""
        if (id.isNotBlank()) {
          var pageUuid: String? = null
          var pageName: String? = null
          var pageContent: String? = null
          try {
            val cp = o.get("customParameters")
            if (cp != null && cp.isJsonObject) {
              val ref = cp.asJsonObject.getAsJsonObject("htmlTemplate")
              if (ref != null) {
                pageUuid =
                    ref.get("uuid")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
                        ?: ref.get("id")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
              }
            }
          } catch (_: Exception) {}
          if (!pageUuid.isNullOrBlank()) {
            try {
              val page = readTemplatePage(userContext, pageUuid)
              if (page != null) {
                pageName = page.first
                pageContent = page.second
              }
            } catch (_: Exception) {}
          }
          val node = JsonObject()
          node.addProperty("targetNodeId", id)
          node.addProperty("name", o.get("name")?.asString ?: "")
          node.addProperty("type", nodeType)
          node.addProperty("pageUuid", pageUuid ?: "")
          node.addProperty("pageName", pageName ?: (o.get("name")?.asString ?: ""))
          if (!pageContent.isNullOrBlank()) {
            node.addProperty(
                "pageContent",
                if (pageContent.length > 12000) pageContent.take(12000) + "...[truncated]"
                else pageContent)
          }
          out.add(node)
        }
      }
      o.get("children")
          ?.takeIf { it.isJsonArray }
          ?.asJsonArray
          ?.forEach { c -> collectEndPageCandidates(c, out) }
      o.get("rootNode")?.takeIf { it.isJsonObject }?.let { collectEndPageCandidates(it, out) }
    }
    val candidates = JsonArray()
    try {
      val root = JsonParser.parseString(workflowJson)
      if (root.isJsonArray) root.asJsonArray.forEach { collectEndPageCandidates(it, candidates) }
      else if (root.isJsonObject) collectEndPageCandidates(root.asJsonObject, candidates)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not collect ending-page candidates: {}", e.message)
    }
    if (candidates.size() == 0) {
      logger.info(
          "[AICodBiAssistant] Ending-page multilingualization: no FC_SHOW_TEMPLATE node found - nothing to wrap.")
      return ""
    }
    val candidateIds =
        candidates
            .mapNotNull { el ->
              if (el.isJsonObject) {
                el.asJsonObject.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
              } else null
            }
            .filter { it.isNotBlank() }
    val candidatesJson = gson.toJson(candidates)
    logger.info(
        "[AICodBiAssistant] Ending-page multilingualization candidates ({} node(s)): {}",
        candidates.size(),
        compactJsonForLog(candidatesJson).take(1200))

    val system = buildString {
      append("You are the ENDING-PAGE (Abschlussseite) part of a whole-form translation. ")
      append(
          "A whole-form translation just added languages to a form. The form's workflows show the consumer an ending page (Abschlussseite) after submit; this page must be shown in the language the consumer used. ")
      append(
          "Formcycle resolves that language through the workflow placeholder [%lang%]. The workflow shows an ending page with an FC_SHOW_TEMPLATE node that references a server-side Abschlussseite (TEMPLATE_CLIENT) by UUID. ")
      append("\n\nFORM LANGUAGES (base language first): ")
      append(langs.joinToString(", "))
      append(". The base language '")
      append(baseLanguage)
      append("' keeps the ORIGINAL page; provide translations ONLY for the other languages.")
      append(
          "\n\nENDING-PAGE NODES (JSON) - each is one FC_SHOW_TEMPLATE that shows the given page (pageName/pageContent is the page's current text). Decide for EACH node whether it is CONSUMER-facing (the page is shown to the person who filled the form, i.e. the node sits on a path the consumer reaches) and reply with an entry for EVERY node:\n")
      append(candidatesJson)
      append(
          "\n\nOUTPUT RULE: reply with ONLY this JSON - one 'pages' entry per node, no omissions:\n")
      append(
          "{\"pages\":[{\"targetNodeId\":\"<id from ENDING-PAGE NODES>\",\"toConsumer\":true,\"translations\":{\"<languageCode>\":{\"content\":\"<translated page HTML, placeholders [%...%]/[%$...%] kept verbatim>\"}}},{\"targetNodeId\":\"<id>\",\"toConsumer\":false,\"translations\":{}}]}\n")
      append(
          "The page is internal (toConsumer=false) when it is shown to employees/operators only (e.g. an internal processing/error page inside a back-office lane) even if it is a 'success' page; judge by WHO sees it. Translate the pageContent faithfully into each non-base FORM LANGUAGE and keep the HTML structure and every placeholder unchanged.")
    }
    val contextSuffix =
        listOfNotNull(
                chatContext?.takeIf { it.isNotBlank() }?.let { "Earlier chat turns: $it" },
                clarificationContext
                    ?.takeIf { it.isNotBlank() }
                    ?.let { "Clarification context: $it" },
                changeHistoryContext?.takeIf { it.isNotBlank() }?.let { "Change history: $it" })
            .joinToString("\n")
    val userContent =
        buildUserContent(
            buildString {
              append(prompt)
              append(
                  "\n\nClassify the workflow ending-page nodes (consumer-facing vs internal) and translate the consumer-facing ones for these form languages.")
              if (contextSuffix.isNotBlank()) {
                append("\n\n")
                append(contextSuffix)
              }
            },
            emptyList())
    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(system)}},""")
      append("""{"role":"user","content":${gson.toJson(userContent)}}""")
      append("]")
    }
    val raw = instance.performFormAssist(modelId, messagesJson)
    var cleaned = extractJson(stripThinkTags(raw))
    logger.info(
        "[AICodBiAssistant] Ending-page multilingualization AI response ({} chars): {}",
        cleaned.length,
        compactJsonForLog(cleaned).take(1000))
    fun parseEntries(text: String): JsonArray =
        try {
          val parsed = JsonParser.parseString(text)
          when {
            parsed.isJsonArray -> parsed.asJsonArray
            parsed.isJsonObject -> {
              val pages = parsed.asJsonObject.get("pages")
              if (pages?.isJsonArray == true) pages.asJsonArray else JsonArray()
            }
            else -> JsonArray()
          }
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] Could not parse ending-page multilingualization AI response: {}",
              text.take(500))
          JsonArray()
        }
    fun entryVerdict(obj: JsonObject): Boolean? {
      val v = obj.get("toConsumer")
      return if (v?.isJsonPrimitive == true && v.asJsonPrimitive.isBoolean) v.asBoolean else null
    }
    fun missingVerdictIds(arr: JsonArray): List<String> {
      val answered = HashSet<String>()
      for (el in arr) {
        if (!el.isJsonObject) continue
        val o = el.asJsonObject
        val id = o.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
        if (id.isNotBlank() && entryVerdict(o) != null) answered.add(id)
      }
      return candidateIds.filterNot { answered.contains(it) }
    }
    var entries = parseEntries(cleaned)
    var missing = missingVerdictIds(entries)
    if (entries.size() == 0 || missing.isNotEmpty()) {
      logger.warn(
          "[AICodBiAssistant] Ending-page reply missing verdicts for {} candidate node(s) — retrying once",
          missing.size)
      val retryUser = buildString {
        append("Your previous reply did not follow the required format.\n")
        append("Reply with ONLY this JSON - nothing else:\n")
        append(
            "{\"pages\":[{\"targetNodeId\":\"<id from ENDING-PAGE NODES>\",\"toConsumer\":true|false,\"translations\":{}}]}\n")
        append("Provide ONE 'pages' entry for EVERY node in ENDING-PAGE NODES (ids: ")
        append(candidateIds.joinToString(", "))
        append(")")
        if (missing.isNotEmpty()) {
          append(" — you MISSED a verdict for: ")
          append(missing.joinToString(", "))
        }
        append(
            ".\nSet 'toConsumer'=true only for pages shown to the CONSUMER (the person who filled the form). For consumer pages provide 'translations' with 'content' (translated page HTML) per non-base language; for internal pages set \"translations\":{}.")
      }
      val retryMessages = buildString {
        append("[")
        append("""{"role":"system","content":${gson.toJson(system)}},""")
        append("""{"role":"user","content":${gson.toJson(retryUser)}}""")
        append("]")
      }
      val retryRaw = instance.performFormAssist(modelId, retryMessages)
      cleaned = extractJson(stripThinkTags(retryRaw))
      entries = parseEntries(cleaned)
      missing = missingVerdictIds(entries)
    }
    if (entries.size() == 0 || missing.isNotEmpty()) {
      logger.info(
          "[AICodBiAssistant] Ending-page multilingualization: AI did not return a verdict for every ending-page node - leaving the workflow unchanged.")
      return ""
    }
    val consumerChosen = mutableListOf<String>()
    for (el in entries) {
      if (!el.isJsonObject) continue
      val o = el.asJsonObject
      if (entryVerdict(o) == true) {
        val id = o.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
        if (candidateIds.contains(id)) consumerChosen.add(id)
      }
    }
    if (consumerChosen.isEmpty()) {
      logger.info(
          "[AICodBiAssistant] Ending-page multilingualization: the AI classified no ending page as consumer-facing - leaving the workflow unchanged.")
      return ""
    }
    logger.info(
        "[AICodBiAssistant] Ending-page multilingualization: AI marks {} ending-page node(s) as consumer-facing: {}",
        consumerChosen.size,
        consumerChosen.joinToString(", "))

    // For each chosen node: gather the base page (uuid/name) + the model's per-language content,
    // create/reuse per-language TEMPLATE_CLIENT pages, then wrap the node.
    val messages = mutableListOf<String>()
    val handled = mutableSetOf<String>()
    for (el in entries) {
      if (!el.isJsonObject) continue
      val obj = el.asJsonObject
      if (entryVerdict(obj) != true) continue
      val targetId =
          obj.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
      if (!candidateIds.contains(targetId)) continue
      if (!handled.add(targetId)) continue
      // find base page info from the candidate list
      val cand =
          candidates
              .firstOrNull { c ->
                c.isJsonObject &&
                    c.asJsonObject
                        .get("targetNodeId")
                        ?.takeIf { it.isJsonPrimitive }
                        ?.asString
                        ?.trim() == targetId
              }
              ?.asJsonObject
      val baseUuid = cand?.get("pageUuid")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
      val baseName = cand?.get("pageName")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
      val trEl = obj.get("translations")
      if (baseUuid.isBlank() || trEl?.isJsonObject != true) continue
      val langPages = linkedMapOf<String, Pair<String, String>>()
      var anyCreated = false
      for ((lang, v) in trEl.asJsonObject.entrySet()) {
        if (lang.isBlank() || lang == baseLanguage || !v.isJsonObject) continue
        val contentEl = v.asJsonObject.get("content")
        val content =
            contentEl?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString
        if (content.isNullOrBlank()) continue
        val langTag = lang.uppercase()
        val pageName = "${baseName.ifBlank { "Endseite" }} ($langTag)"
        val ensured = ensureEndPageForLanguage(userContext, baseUuid, baseName, pageName, content)
        if (ensured != null) {
          langPages[lang] = ensured
          anyCreated = true
        } else {
          logger.warn(
              "[AICodBiAssistant] Ending-page multilingualization: could not ensure page for lang '{}' of node {} — skipping that language.",
              lang,
              targetId)
        }
      }
      if (langPages.isEmpty()) continue
      val result =
          multilingualizeEndPageNode(workflowVersionId, targetId, langs, langPages, userContext)
      if (result.isNotBlank()) messages.add(result)
    }
    if (messages.isEmpty()) return ""
    try {
      touchWorkflowVersion(userContext, workflowVersionId)
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] touchWorkflowVersion after ending-page multilingualization failed: {}",
          e.message)
    }
    return "Multilingualized ending pages: " + messages.joinToString(" | ")
  }

  // ---------------------------------------------------------------------------
  // ACTIVE (2026-09-06): reuse-only Abschlussseiten multilingualization. No page is ever created or
  // edited — every consumer FC_SHOW_TEMPLATE node is wrapped into an [%lang%] FC_SWITCH whose
  // non-base
  // cases point at the ALREADY EXISTING localized page "<base> _CB_<LANG>"; a language without such
  // a
  // page falls back to the ORIGINAL page. Page NAME + UUID come from TEMPLATE_CLIENT (plain text);
  // the
  // encrypted TEXTVALUE is never read. (The creation-based helpers above this block are
  // superseded.)
  // ---------------------------------------------------------------------------

  /**
   * Lists every Abschlussseite (TEMPLATE_CLIENT row) of the workflow's owning client as (name,
   * uuid) pairs via native SQL — NAME and UUID are plain text, so the encrypted TEXTVALUE is never
   * touched. Returns null when the owning client or the table cannot be resolved (the caller then
   * safely skips the ending-page pass). Never throws.
   */
  private fun listClientTemplates(
      userContext: Any,
      workflowVersionId: Long
  ): List<Pair<String, String>>? {
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId) ?: return null
      val project =
          workflowVersion.javaClass.getMethod("getProject").invoke(workflowVersion) ?: return null
      var clientId: Long? = null
      // The Abschlussseiten are scoped by the client/mandant the workflow's project belongs to.
      for (refGetter in listOf("getClient", "getMandant")) {
        try {
          val ref = project.javaClass.getMethod(refGetter).invoke(project) ?: continue
          val id = ref.javaClass.getMethod("getId").invoke(ref) as? Number ?: continue
          clientId = id.toLong()
          break
        } catch (_: Exception) {}
      }
      if (clientId == null) {
        for (idGetter in listOf("getClientId", "getMandantId")) {
          try {
            val v = project.javaClass.getMethod(idGetter).invoke(project) as? Number
            if (v != null) {
              clientId = v.toLong()
              break
            }
          } catch (_: Exception) {}
        }
      }
      if (clientId == null) {
        logger.warn(
            "[AICodBiAssistant] Ending-page: could not resolve the client id of the workflow's project (workflowVersion {}) — skipping.",
            workflowVersionId)
        return null
      }
      val createNQ = em.javaClass.getMethod("createNativeQuery", String::class.java)
      val colsQ =
          createNQ.invoke(
              em,
              "SELECT column_name FROM information_schema.columns WHERE UPPER(table_name) = 'TEMPLATE_CLIENT'")
      val cols =
          (colsQ.javaClass.getMethod("getResultList").invoke(colsQ) as? List<*>)
              ?.map { it.toString().uppercase() }
              ?.toSet() ?: return null
      if (!cols.contains("UUID") || !cols.contains("NAME")) {
        logger.warn(
            "[AICodBiAssistant] Ending-page: TEMPLATE_CLIENT has no readable UUID/NAME columns — skipping.")
        return null
      }
      val clientCol =
          when {
            "CLIENT_ID" in cols -> "CLIENT_ID"
            "MANDANT_ID" in cols -> "MANDANT_ID"
            else -> null
          }
      if (clientCol == null) {
        logger.warn(
            "[AICodBiAssistant] Ending-page: TEMPLATE_CLIENT has no CLIENT_ID/MANDANT_ID column — skipping.")
        return null
      }
      val deprecatedFilter = if ("FLAG_DEPRECATED" in cols) " AND FLAG_DEPRECATED = 0" else ""
      val sql =
          "SELECT UUID, NAME FROM TEMPLATE_CLIENT WHERE $clientCol = $clientId$deprecatedFilter ORDER BY NAME"
      val q = createNQ.invoke(em, sql)
      val rows = (q.javaClass.getMethod("getResultList").invoke(q) as? List<*>) ?: emptyList<Any>()
      val out = mutableListOf<Pair<String, String>>()
      for (row in rows) {
        val arr = row as? Array<*>
        if (arr == null || arr.size < 2) continue
        val uuid = arr[0]?.toString()?.trim().orEmpty()
        val name = arr[1]?.toString()?.trim().orEmpty()
        if (uuid.isNotBlank() && name.isNotBlank()) out.add(name to uuid)
      }
      logger.info(
          "[AICodBiAssistant] Ending-page: {} Abschlussseite(s) of client {} — sample: {}",
          out.size,
          clientId,
          out.take(15).joinToString(" | ") { "'${it.first}' -> ${it.second}" })
      return out
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] listClientTemplates failed: {}", e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * Finds the EXISTING localized Abschlussseite for [baseName] + [langCode] among the enumerated
   * [templates] using the confirmed naming convention: the localized page NAME = the base page's
   * NAME plus the marker "_CB_<LANG>" (language code UPPERCASED, region hyphen kept, e.g. base
   * "Formular versendet" -> "Formular versendet _CB_EN", de-CH -> "_CB_DE-CH"). The marker must be
   * a whole token, so "de" never matches a "_CB_DE-CH" page when an exact "_CB_DE" page exists.
   * Returns (name, uuid) or null when no localization exists (the caller then falls back to the
   * ORIGINAL page).
   */
  private fun findLocalizedTemplate(
      baseName: String,
      langCode: String,
      templates: List<Pair<String, String>>
  ): Pair<String, String>? {
    val base = baseName.trim()
    if (base.isBlank() || langCode.isBlank() || templates.isEmpty()) return null
    val marker = "_CB_" + langCode.trim().uppercase()
    val lowerMarker = marker.lowercase()
    val canonicalSpace = "$base $marker".lowercase()
    val canonicalNone = "$base$marker".lowercase()
    val candidates =
        templates.filter { (name, _) ->
          val n = name.trim()
          if (!n.startsWith(base, ignoreCase = true)) return@filter false
          val lower = n.lowercase()
          if (lower == canonicalSpace || lower == canonicalNone) return@filter true
          if (!lower.contains(lowerMarker)) return@filter false
          val idx = lower.indexOf(lowerMarker)
          val beforeOk = idx == 0 || n[idx - 1] == ' ' || n[idx - 1] == '_'
          val afterOk = idx + marker.length >= n.length || n[idx + marker.length] == ' '
          beforeOk && afterOk
        }
    if (candidates.isEmpty()) return null
    val exact =
        candidates.firstOrNull { (name, _) ->
          name.trim().equals(canonicalSpace, ignoreCase = true)
        }
            ?: candidates.firstOrNull { (name, _) ->
              name.trim().equals(canonicalNone, ignoreCase = true)
            }
    val chosen = exact ?: candidates.minByOrNull { it.first.length }
    logger.info(
        "[AICodBiAssistant] Ending-page: localization for base '{}' / marker '{}' -> '{}' ({})",
        base,
        marker,
        chosen?.first,
        chosen?.second)
    return chosen
  }

  /**
   * EXTENDS an already multilingual [%lang%] ending-page FC_SWITCH with the missing language cases
   * (added later, e.g. fr on top of an existing de/en ending-page wrap) — mirror of
   * extendMailSwitchNode, but the per-branch action is an FC_SHOW_TEMPLATE clone whose
   * htmlTemplate.uuid points at [langPages]' localized page for that language, or stays on the
   * ORIGINAL page ([sourceParams]) when no localization exists yet. Keeps the FC_SWITCH_DEFAULT at
   * index 0 (the FIRST child — Formcycle requires the default first or the switch is invalid).
   */
  private fun extendEndPageSwitchNode(
      workflowVersionId: Long,
      targetNodeId: String,
      addLanguages: List<String>,
      langPages: Map<String, Pair<String, String>>,
      sourceParams: String,
      defaultBranchId: String,
      userContext: Any
  ): String {
    val nodeId =
        targetNodeId.trim().toLongOrNull()
            ?: return "Invalid target ending-page switch node id '$targetNodeId'."
    val addLangs = addLanguages.filter { it.isNotBlank() }.distinct()
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val iTransferableEntityClass =
          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
      val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
      val getById =
          workflowNodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      val switchNode =
          getById.invoke(workflowNodeApi, userContext, nodeId)
              ?: return "WorkflowNode $nodeId not found — nothing to extend."
      val switchType =
          (switchNode.javaClass.getMethod("getType").invoke(switchNode) as? String) ?: ""
      if (switchType != "FC_SWITCH") {
        return "Node $nodeId is '$switchType', not an FC_SWITCH — skipped."
      }
      val task =
          switchNode.javaClass.getMethod("getTask").invoke(switchNode)
              ?: return "Node $nodeId has no task — skipped."
      val baseName =
          ((switchNode.javaClass.getMethod("getName").invoke(switchNode) as? String)?.trim())
              .orEmpty()
              .ifBlank { "Endseite" }
      val createNode =
          workflowNodeApi.javaClass.getMethod("create", ucClass, iTransferableEntityClass)

      fun createPageClone(parent: Any, pageName: String, pageParams: String) {
        val clone = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass
            .getMethod("setName", String::class.java)
            .invoke(clone, sanitizeWorkflowName(pageName))
        workflowNodeClass.getMethod("setType", String::class.java).invoke(clone, "FC_SHOW_TEMPLATE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(clone, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(clone, java.util.UUID.randomUUID())
        if (pageParams.isNotBlank()) {
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(clone, pageParams)
          stampCustomParamsVersion(workflowNodeClass, clone)
        }
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(clone, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(clone, parent)
        val saved = createNode.invoke(workflowNodeApi, userContext, clone)
        fixParentOrderIndex(saved, parent, userContext)
      }

      fun createCaseBranch(lang: String, pageName: String, pageParams: String) {
        val caseValueJson =
            """{"caseValue":${gson.toJson(lang)},"matchCondition":"EQUAL","variableName":"C1"}"""
        val caseParams =
            """{"caseValues":[$caseValueJson],"combinationType":"OR","description":${gson.toJson("Sprache: $lang")}}"""
        val branch = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass
            .getMethod("setName", String::class.java)
            .invoke(branch, "FcSwitchCaseHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(branch, "FC_SWITCH_CASE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(branch, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(branch, java.util.UUID.randomUUID())
        workflowNodeClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(branch, caseParams)
        stampCustomParamsVersion(workflowNodeClass, branch)
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(branch, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(branch, switchNode)
        val savedBranch = createNode.invoke(workflowNodeApi, userContext, branch)
        fixParentOrderIndex(savedBranch, switchNode, userContext)
        val seq = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(seq, "FcSequenceHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(seq, "SEQUENCE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(seq, true)
        workflowNodeClass
            .getMethod("setUUIDObject", java.util.UUID::class.java)
            .invoke(seq, java.util.UUID.randomUUID())
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(seq, task)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(seq, savedBranch)
        val savedSeq = createNode.invoke(workflowNodeApi, userContext, seq)
        fixParentOrderIndex(savedSeq, savedBranch, userContext)
        createPageClone(savedSeq, pageName, pageParams)
      }

      val addedLangs = mutableListOf<String>()
      for (lang in addLangs) {
        val localized = langPages[lang]
        val pageName = localized?.second ?: "$baseName ($lang)"
        val pageParams =
            if (localized != null) applyEndPageTranslationParams(sourceParams, localized.first)
            else sourceParams
        createCaseBranch(lang, pageName, pageParams)
        addedLangs.add(lang)
      }
      // Formcycle requires the FC_SWITCH_DEFAULT branch at parent_order_idx 0 (the FIRST child) — a
      // switch whose default is anywhere else is INVALID. Reorder after appending the new cases
      // (no-op when the default already is first); this ALSO heals switches generated before this
      // rule, even when nothing new was added.
      ensureSwitchDefaultFirst(workflowNodeApi, ucClass, userContext, nodeId)
      if (addedLangs.isEmpty()) {
        return "" // every requested language is already present — ordering healed above
      }
      logger.info(
          "[AICodBiAssistant] Extended existing ending-page FC_SWITCH {} on [%lang%] with new language case(s): {}",
          nodeId,
          addedLangs.joinToString(", "))
      return "extended ending-page FC_SWITCH '#$nodeId' with language case(s): " +
          addedLangs.joinToString(", ")
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] extendEndPageSwitchNode failed for node {}: {}",
          targetNodeId,
          e.message)
      return "Extending ending-page switch node $targetNodeId failed: ${e.message}"
    }
  }

  /**
   * AI-driven, REUSE-ONLY multilingualize pass for Abschlussseiten (FC_SHOW_TEMPLATE ending-page
   * nodes). Mirrors runWorkflowMailMultilingualization: a condensed candidate list of every
   * FC_SHOW_TEMPLATE node (kind "PAGE", to wrap) plus every already-[%lang%]-wrapped ending-page
   * switch (kind "SWITCH", to extend) is sent — NEVER the whole tree; the model returns a
   * toConsumer verdict for EVERY candidate (verdict only — no page content is generated or
   * invented). The per-language localized page is resolved DETERMINISTICALLY by the backend from
   * the client's TEMPLATE_CLIENT rows using the "<base> _CB_<LANG>" naming convention; a language
   * without a localization falls back to the ORIGINAL page. No page is ever created. Never fails
   * the already-successful form translation.
   */
  private fun runEndPageMultilingualization(
      prompt: String,
      languages: List<String>,
      workflowVersionId: Long,
      params: IPluginServletActionParams,
      modelId: String,
      instance: Standard,
      chatContext: String?,
      clarificationContext: String?,
      changeHistoryContext: String?
  ): String {
    val langs = languages.filter { it.isNotBlank() }.distinct()
    if (langs.size < 2) return ""
    val userContext = getUserContext(params)
    val templates = listClientTemplates(userContext, workflowVersionId)
    if (templates.isNullOrEmpty()) {
      logger.info(
          "[AICodBiAssistant] Ending-page multilingualization: no Abschlussseite could be listed for the workflow's client - nothing to do.")
      return ""
    }
    val workflowJson =
        buildWorkflowStructureContext(workflowVersionId, userContext)
            ?: run {
              logger.warn(
                  "[AICodBiAssistant] No workflow context for ending-page multilingualization (workflowVersion {}).",
                  workflowVersionId)
              return ""
            }
    val baseLanguage = langs.first()
    val nameByUuid = templates.associate { it.second to it.first }

    // Condensed candidate list of TWO kinds:
    //  - "PAGE":   a plain FC_SHOW_TEMPLATE ending-page node (to be WRAPPED into a new [%lang%]
    //              switch);
    //  - "SWITCH": an existing [%lang%] ending-page switch (its clones are EXTENDED, never
    // re-wrapped).
    // The model decides consumer-facing per candidate; the backend resolves the per-language page.
    fun collectPageMeta(n: JsonObject, acc: MutableList<JsonObject>) {
      val t = n.get("type")?.asString ?: ""
      if (t == "FC_SHOW_TEMPLATE") {
        val cp = n.get("customParameters")
        val meta = JsonObject()
        meta.addProperty("type", t)
        meta.addProperty("name", n.get("name")?.asString ?: "")
        meta.addProperty("params", cp?.toString() ?: "")
        acc.add(meta)
      }
      n.get("children")
          ?.takeIf { it.isJsonArray }
          ?.asJsonArray
          ?.forEach { c -> if (c.isJsonObject) collectPageMeta(c.asJsonObject, acc) }
    }
    fun pageRefUuid(o: JsonObject): String? {
      return try {
        val cp = o.get("customParameters")
        if (cp != null && cp.isJsonObject) {
          val ref = cp.asJsonObject.getAsJsonObject("htmlTemplate")
          if (ref != null) {
            ref.get("uuid")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
                ?: ref.get("id")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
          } else {
            null
          }
        } else {
          null
        }
      } catch (_: Exception) {
        null
      }
    }
    fun pageMetaUuid(p: JsonObject): String {
      val params = p.get("params")?.asString ?: return ""
      return try {
        JsonParser.parseString(params)
            .asJsonObject
            .getAsJsonObject("htmlTemplate")
            .get("uuid")
            ?.takeIf { it.isJsonPrimitive }
            ?.asString
            ?.trim()
            .orEmpty()
      } catch (_: Exception) {
        ""
      }
    }
    fun analyzePageLangSwitch(o: JsonObject): JsonObject? {
      val cp = o.get("customParameters")
      val switchValue =
          if (cp != null && cp.isJsonObject) {
            cp.asJsonObject.get("switchValue")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
          } else {
            null
          }
      if (switchValue != "[%lang%]") return null
      val id = o.get("id")?.asString ?: return null
      val children = o.get("children")?.takeIf { it.isJsonArray }?.asJsonArray ?: return null
      val caseLangs = LinkedHashSet<String>()
      var defaultId: String? = null
      val pages = mutableListOf<JsonObject>()
      for (branch in children) {
        if (!branch.isJsonObject) continue
        val b = branch.asJsonObject
        val bt = b.get("type")?.asString ?: ""
        if (bt == "FC_SWITCH_CASE") {
          try {
            val bcp = b.get("customParameters")
            if (bcp != null && bcp.isJsonObject) {
              val cvs = bcp.asJsonObject.get("caseValues")
              if (cvs?.isJsonArray == true) {
                for (cv in cvs.asJsonArray) {
                  if (cv.isJsonObject) {
                    val v = cv.asJsonObject.get("caseValue")
                    val s = v?.takeIf { it.isJsonPrimitive }?.asString?.trim()
                    if (!s.isNullOrBlank()) caseLangs.add(s)
                  }
                }
              }
            }
          } catch (_: Exception) {}
          collectPageMeta(b, pages)
        } else if (bt == "FC_SWITCH_DEFAULT") {
          defaultId = b.get("id")?.asString
          collectPageMeta(b, pages)
        } else {
          collectPageMeta(b, pages)
        }
      }
      // Only an existing [%lang%] switch that actually carries ending-page clones is a SWITCH
      // candidate (a [%lang%] MAIL switch is handled by the mail pass and ignored here).
      if (pages.isEmpty()) return null
      // Prefer the ORIGINAL page clone (no "_CB_" marker in its resolved name) as the source; the
      // base-language case references the original page, so its params are reused for new clones.
      val pagesWithMeta =
          pages.mapNotNull { p ->
            val u = pageMetaUuid(p)
            if (u.isBlank()) null else Triple(p, u, nameByUuid[u])
          }
      val originalLike =
          pagesWithMeta.firstOrNull { (_, _, nm) ->
            nm == null || !nm.contains("_CB_", ignoreCase = true)
          }
      val src = originalLike?.first ?: pages.first()
      val srcParams = src.get("params")?.asString ?: ""
      val srcUuid = pageMetaUuid(src)
      val meta = JsonObject()
      meta.addProperty("kind", "SWITCH")
      meta.addProperty("targetNodeId", id)
      meta.addProperty("name", o.get("name")?.asString ?: "")
      val langsArr = JsonArray()
      caseLangs.forEach { langsArr.add(it) }
      meta.add("existingCaseLanguages", langsArr)
      meta.addProperty("defaultBranchId", defaultId ?: "")
      meta.addProperty("sourceParams", srcParams)
      meta.addProperty("pageUuid", srcUuid)
      meta.addProperty("pageName", nameByUuid[srcUuid] ?: (src.get("name")?.asString ?: ""))
      return meta
    }
    fun collectCandidates(el: JsonElement, out: JsonArray) {
      if (!el.isJsonObject) return
      val o = el.asJsonObject
      val nodeType = o.get("type")?.asString ?: ""
      when (nodeType) {
        "FC_SWITCH" -> {
          val meta = analyzePageLangSwitch(o)
          if (meta != null) out.add(meta)
          // Never descend into a handled [%lang%] switch: mail clones belong to the mail pass and
          // ending-page clones here are extended, never re-wrapped.
          return
        }
        "FC_SHOW_TEMPLATE" -> {
          val id = o.get("id")?.asString ?: ""
          val pageUuid = pageRefUuid(o)
          if (id.isNotBlank() && !pageUuid.isNullOrBlank()) {
            val node = JsonObject()
            node.addProperty("kind", "PAGE")
            node.addProperty("targetNodeId", id)
            node.addProperty("name", o.get("name")?.asString ?: "")
            node.addProperty("type", nodeType)
            node.addProperty("pageUuid", pageUuid)
            node.addProperty("pageName", nameByUuid[pageUuid] ?: (o.get("name")?.asString ?: ""))
            node.addProperty("description", o.get("description")?.asString ?: "")
            val cp = o.get("customParameters")
            if (cp != null) node.add("customParameters", cp)
            out.add(node)
          }
          return
        }
      }
      o.get("children")
          ?.takeIf { it.isJsonArray }
          ?.asJsonArray
          ?.forEach { c -> collectCandidates(c, out) }
      o.get("rootNode")?.takeIf { it.isJsonObject }?.let { collectCandidates(it, out) }
    }
    val candidates = JsonArray()
    try {
      val root = JsonParser.parseString(workflowJson)
      if (root.isJsonArray) root.asJsonArray.forEach { collectCandidates(it, candidates) }
      else if (root.isJsonObject) collectCandidates(root.asJsonObject, candidates)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not collect ending-page candidates: {}", e.message)
    }
    if (candidates.size() == 0) {
      logger.info(
          "[AICodBiAssistant] Ending-page multilingualization: no consumer ending-page (FC_SHOW_TEMPLATE) node or [%lang%] ending-page switch found - nothing to do.")
      return ""
    }
    val candidateIds =
        candidates
            .mapNotNull { el ->
              if (el.isJsonObject) {
                el.asJsonObject.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
              } else {
                null
              }
            }
            .filter { it.isNotBlank() }
    val candidatesJson = gson.toJson(candidates)
    logger.info(
        "[AICodBiAssistant] Ending-page multilingualization candidates ({} node(s)/switch(es)): {}",
        candidates.size(),
        compactJsonForLog(candidatesJson).take(2000))

    val system = buildString {
      append(
          "You are the ENDING-PAGE (Abschlussseite) part of a whole-form translation. A whole-form translation just added languages to a form. ")
      append(
          "The form's workflows show the consumer an ending page (Abschlussseite) after submit; this page must be shown in the language the consumer used. Formcycle resolves that language through the workflow placeholder [%lang%]. ")
      append(
          "An ending page is shown by an FC_SHOW_TEMPLATE workflow node that references a server-side Abschlussseite (TEMPLATE_CLIENT) by UUID. A per-language Abschlussseite may already exist on the server — its NAME carries the marker '_CB_<LANG>' (e.g. 'Abschlussseite _CB_EN'); when it does not exist yet, the ORIGINAL page is shown for that language. ")
      append("You NEVER translate or invent page content and you NEVER create pages.")
      append("\n\nFORM LANGUAGES (base language first): ")
      append(langs.joinToString(", "))
      append(". The base language '")
      append(baseLanguage)
      append("' keeps the ORIGINAL page.")
      append(
          "\n\nENDING-PAGE NODES (JSON) - each entry is one candidate: \"kind\":\"PAGE\" is a plain FC_SHOW_TEMPLATE ending-page node (to be wrapped into a [%lang%] switch), \"kind\":\"SWITCH\" is an already-multilingual [%lang%] ending-page switch that must only be EXTENDED for the FORM LANGUAGES missing from its \"existingCaseLanguages\". Decide for EACH entry whether it is CONSUMER-facing (the page is shown to the person who filled the form, i.e. the node sits on a path the consumer reaches) and reply with an entry for EVERY node:\n")
      append(candidatesJson)
      append(
          "\n\nOUTPUT RULE: reply with ONLY this JSON - one 'pages' entry per node, no omissions, nothing else:\n")
      append(
          "{\"pages\":[{\"targetNodeId\":\"<id from ENDING-PAGE NODES>\",\"toConsumer\":true},{\"targetNodeId\":\"<id>\",\"toConsumer\":false}]}\n")
      append(
          "The page is internal (toConsumer=false) when it is shown to employees/operators only (e.g. an internal processing/error page inside a back-office lane) even if it looks like a 'success' page; judge by WHO sees it. You do NOT provide translations or page content.")
    }
    val contextSuffix =
        listOfNotNull(
                chatContext?.takeIf { it.isNotBlank() }?.let { "Earlier chat turns: $it" },
                clarificationContext
                    ?.takeIf { it.isNotBlank() }
                    ?.let { "Clarification context: $it" },
                changeHistoryContext?.takeIf { it.isNotBlank() }?.let { "Change history: $it" })
            .joinToString("\n")
    val userContent =
        buildUserContent(
            buildString {
              append(prompt)
              append(
                  "\n\nClassify the workflow ending-page nodes (consumer-facing vs internal) so they can be shown per language.")
              if (contextSuffix.isNotBlank()) {
                append("\n\n")
                append(contextSuffix)
              }
            },
            emptyList())
    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(system)}},""")
      append("""{"role":"user","content":${gson.toJson(userContent)}}""")
      append("]")
    }
    val raw = instance.performFormAssist(modelId, messagesJson)
    var cleaned = extractJson(stripThinkTags(raw))
    logger.info(
        "[AICodBiAssistant] Ending-page multilingualization AI response ({} chars): {}",
        cleaned.length,
        compactJsonForLog(cleaned).take(1000))
    fun parseEntries(text: String): JsonArray =
        try {
          val parsed = JsonParser.parseString(text)
          when {
            parsed.isJsonArray -> parsed.asJsonArray
            parsed.isJsonObject -> {
              val pages = parsed.asJsonObject.get("pages")
              if (pages?.isJsonArray == true) pages.asJsonArray else JsonArray()
            }
            else -> JsonArray()
          }
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] Could not parse ending-page multilingualization AI response: {}",
              text.take(500))
          JsonArray()
        }
    fun entryVerdict(obj: JsonObject): Boolean? {
      val v = obj.get("toConsumer")
      return if (v?.isJsonPrimitive == true && v.asJsonPrimitive.isBoolean) v.asBoolean else null
    }
    fun missingVerdictIds(arr: JsonArray): List<String> {
      val answered = HashSet<String>()
      for (el in arr) {
        if (!el.isJsonObject) continue
        val o = el.asJsonObject
        val id = o.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
        if (id.isNotBlank() && entryVerdict(o) != null) answered.add(id)
      }
      return candidateIds.filterNot { answered.contains(it) }
    }
    var entries = parseEntries(cleaned)
    var missing = missingVerdictIds(entries)
    if (entries.size() == 0 || missing.isNotEmpty()) {
      logger.warn(
          "[AICodBiAssistant] Ending-page reply missing toConsumer verdicts for {} candidate node(s) ({}) — retrying once with a strict schema instruction",
          missing.size,
          compactJsonForLog(cleaned).take(300))
      val retryUser = buildString {
        append("Your previous reply did not follow the required format.\n")
        append("Reply with ONLY this JSON - nothing else:\n")
        append(
            "{\"pages\":[{\"targetNodeId\":\"<id from ENDING-PAGE NODES>\",\"toConsumer\":true|false}]}\n")
        append("Provide ONE 'pages' entry for EVERY node in ENDING-PAGE NODES (ids: ")
        append(candidateIds.joinToString(", "))
        append(")")
        if (missing.isNotEmpty()) {
          append(" — you MISSED a verdict for: ")
          append(missing.joinToString(", "))
        }
        append(
            ".\nSet 'toConsumer'=true only for pages shown to the CONSUMER (the person who filled the form); false for internal pages shown to employees/operators only.")
      }
      val retryMessages = buildString {
        append("[")
        append("""{"role":"system","content":${gson.toJson(system)}},""")
        append("""{"role":"user","content":${gson.toJson(retryUser)}}""")
        append("]")
      }
      val retryRaw = instance.performFormAssist(modelId, retryMessages)
      cleaned = extractJson(stripThinkTags(retryRaw))
      logger.info(
          "[AICodBiAssistant] Ending-page multilingualization retry response ({} chars): {}",
          cleaned.length,
          compactJsonForLog(cleaned).take(1000))
      entries = parseEntries(cleaned)
      missing = missingVerdictIds(entries)
    }
    if (entries.size() == 0 || missing.isNotEmpty()) {
      logger.info(
          "[AICodBiAssistant] Ending-page multilingualization: AI did not return a verdict for every ending-page node - leaving the workflow unchanged.")
      return ""
    }
    val consumerChosen = mutableListOf<String>()
    for (el in entries) {
      if (!el.isJsonObject) continue
      val o = el.asJsonObject
      if (entryVerdict(o) == true) {
        val id = o.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
        if (id.isNotBlank() && candidateIds.contains(id)) consumerChosen.add(id)
      }
    }
    if (consumerChosen.isEmpty()) {
      logger.info(
          "[AICodBiAssistant] Ending-page multilingualization: the AI classified no ending page as consumer-facing - leaving the workflow unchanged.")
      return ""
    }
    logger.info(
        "[AICodBiAssistant] Ending-page multilingualization: AI marks {} ending-page node(s) as consumer-facing: {}",
        consumerChosen.size,
        consumerChosen.joinToString(", "))
    fun candidateOf(id: String): JsonObject? =
        candidates
            .firstOrNull { c ->
              c.isJsonObject &&
                  c.asJsonObject
                      .get("targetNodeId")
                      ?.takeIf { it.isJsonPrimitive }
                      ?.asString
                      ?.trim() == id
            }
            ?.asJsonObject
    val messages = mutableListOf<String>()
    val handledNodeIds = mutableSetOf<String>()
    for (el in entries) {
      if (!el.isJsonObject) continue
      val obj = el.asJsonObject
      if (entryVerdict(obj) != true) continue
      val targetId =
          obj.get("targetNodeId")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
      if (!candidateIds.contains(targetId)) continue
      if (!handledNodeIds.add(targetId)) continue
      val cand = candidateOf(targetId) ?: continue
      val kind = cand.get("kind")?.takeIf { it.isJsonPrimitive }?.asString ?: "PAGE"
      val pageName = cand.get("pageName")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
      // Deterministically resolve the EXISTING localized page ("<base> _CB_<LANG>") for every
      // non-base language; a language without a localization gets NO langPages entry and therefore
      // falls back to the ORIGINAL page (never created).
      val langPages = linkedMapOf<String, Pair<String, String>>()
      for (lang in langs) {
        if (lang.isBlank() || lang == baseLanguage) continue
        val found = findLocalizedTemplate(pageName, lang, templates)
        if (found != null) langPages[lang] = found.second to found.first // (uuid, name)
      }
      val result =
          if (kind == "SWITCH") {
            val existing =
                (cand
                        .get("existingCaseLanguages")
                        ?.takeIf { it.isJsonArray }
                        ?.asJsonArray
                        ?.mapNotNull { e -> e.takeIf { it.isJsonPrimitive }?.asString?.trim() }
                        ?.filter { it.isNotBlank() } ?: emptyList())
                    .toSet()
            val sourceParams =
                cand.get("sourceParams")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
            val defaultId =
                cand.get("defaultBranchId")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
            val addLangs = langs.filter { it != baseLanguage && it !in existing }
            extendEndPageSwitchNode(
                workflowVersionId,
                targetId,
                addLangs,
                langPages,
                sourceParams,
                defaultId,
                userContext)
          } else {
            multilingualizeEndPageNode(workflowVersionId, targetId, langs, langPages, userContext)
          }
      if (result.isNotBlank()) messages.add(result)
    }
    if (messages.isEmpty()) return ""
    try {
      touchWorkflowVersion(userContext, workflowVersionId)
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] touchWorkflowVersion after ending-page multilingualization failed: {}",
          e.message)
    }
    return "Multilingualized ending pages: " + messages.joinToString(" | ")
  }

  /**
   * Returns the mail node's customParameters JSON with subject/body/senderName replaced by the AI
   * translation, keeping every other parameter (to/from/attachments, DOI successPage/failurePage,
   * placeholders) byte-for-byte. Falls back to the original params verbatim when the stored params
   * are not editable JSON.
   */
  private fun applyMailTranslationParams(origParams: String, translation: JsonObject): String {
    val params =
        try {
          JsonParser.parseString(origParams).asJsonObject
        } catch (_: Exception) {
          return origParams
        }
    translation
        .get("subject")
        ?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }
        ?.let { params.addProperty("subject", it.asString) }
    translation
        .get("body")
        ?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }
        ?.let { params.addProperty("body", it.asString) }
    val sender = translation.get("senderName")
    if (sender != null) {
      if (sender.isJsonPrimitive && sender.asJsonPrimitive.isString) {
        params.addProperty("senderName", sender.asString)
      } else if (sender.isJsonNull) {
        params.remove("senderName")
      }
    }
    return params.toString()
  }

  /**
   * Builds the system prompt for the workflow-creation AI call, fully DB-driven. Loads
   * `formcycle.general` plus either the condensed workflow-nodes reference (pass-1, when
   * [requestedNodes]/[requestedTriggers] are empty) or the requested node/trigger detail sections
   * from the detailed DB (pass-2, when the AI requested them). Dynamic context (form elements,
   * completion pages, templates, inboxes, message services, triggers, workflow states) is injected
   * at runtime and is NOT part of the static prompt content.
   */
  private fun buildWorkflowSystemPrompt(
      formContext: String?,
      repeatableContainers: String? = null,
      htmlTemplates: String? = null,
      completionPages: String? = null,
      workflowStates: String? = null,
      inboxes: String? = null,
      messageServices: String? = null,
      triggers: String? = null,
      existingWorkflowNodes: String? = null,
      requestedNodes: List<String> = emptyList(),
      requestedTriggers: List<String> = emptyList(),
      clarificationContext: String? = null,
      chatContext: String? = null,
      changeHistoryContext: String? = null,
      formVariables: String? = null
  ): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return loadPromptWithClasspathFallback("codbi.fallback_workflow") ?: ""
    try {
      val fc = PromptLoader.loadCategory(em, "formcycle")
      val general = fc["formcycle.general"] ?: ""
      val pass2 = requestedNodes.isNotEmpty() || requestedTriggers.isNotEmpty()
      val workflowReference =
          if (pass2) {
            PromptLoader.buildWorkflowNodeDetails(em, requestedNodes, requestedTriggers)
          } else {
            PromptLoader.buildWorkflowNodesCondensed(em)
          }
      // "Nicht installierte Elemente erstellen": the template embeds hard-coded, node-specific
      // instruction blocks (e.g. the AKDB ePayBL payment block); strip those whose node is not
      // allowed so the AI is never told to create a node that is filtered out of the references.
      val workflowTemplate =
          FormcycleElementFilter.scrubNodeProse(loadWorkflowTaskInstruction() ?: "")
      if (workflowTemplate.isBlank()) {
        return loadPromptWithClasspathFallback("codbi.fallback_workflow") ?: ""
      }
      return renderWorkflowSystemPrompt(
          workflowTemplate,
          general = general,
          workflowReference = workflowReference,
          pass2 = pass2,
          formContext = formContext,
          repeatableContainers = repeatableContainers,
          completionPages = completionPages,
          htmlTemplates = htmlTemplates,
          inboxes = inboxes,
          messageServices = messageServices,
          triggers = triggers,
          workflowStates = workflowStates,
          existingWorkflowNodes = existingWorkflowNodes,
          clarificationContext = clarificationContext,
          chatContext = chatContext,
          changeHistoryContext = changeHistoryContext,
          changeLogSchema = loadChangeLogSchema(),
          formVariables = formVariables)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to build workflow system prompt", e)
      return loadPromptWithClasspathFallback("codbi.fallback_workflow") ?: ""
    } finally {
      em?.close()
    }
  }

  /**
   * Compact JSON list of the existing workflow nodes (numeric id, type, name, parentId) of the
   * given workflow version, so the AI can reference concrete nodes for remove/replace operations.
   * Nodes with an empty `parentId` are root nodes — removing one removes the whole workflow path.
   *
   * Runs JPQL against FORMCYCLE's own persistence context (via EntityContext) — the CodBi plugin's
   * EntityManagerFactory only knows CodBi's tables, not FormCycle's entities.
   */
  private fun fetchExistingWorkflowNodes(userContext: Any, workflowVersionId: Long): String? {
    val em = formcycleEntityManager(userContext) ?: return null
    return try {
      val jpql =
          "SELECT n.id, n.type, n.name, n.parent.id FROM de.xima.fc.entities.WorkflowNode n " +
              "JOIN n.task wta JOIN wta.process wp JOIN wp.version wv " +
              "WHERE wv.id = :vid ORDER BY n.id"
      val results = runJpqlOn(em, jpql, "vid", workflowVersionId)
      if (results.isEmpty()) return null
      val arr = com.google.gson.JsonArray()
      for (row in results) {
        val cols = row as? Array<*> ?: continue
        if (cols.size < 3) continue
        val id = cols[0]?.toString()?.takeIf { it.isNotBlank() } ?: continue
        val obj = com.google.gson.JsonObject()
        obj.addProperty("id", id)
        obj.addProperty("type", cols[1]?.toString() ?: "")
        obj.addProperty("name", cols[2]?.toString() ?: "")
        if (cols.size >= 4) obj.addProperty("parentId", cols[3]?.toString() ?: "")
        arr.add(obj)
      }
      if (arr.size() == 0) null else gson.toJson(arr)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] fetchExistingWorkflowNodes failed: ${e.message}")
      null
    }
  }

  /**
   * Serializes the COMPLETE workflow (tasks → triggers with their parameters → the full node tree
   * with every node's type/name/description and customParameters) as JSON, so the chat AI can
   * answer questions about or verify the workflow with ALL details. Returns null when the workflow
   * cannot be read (the chat then simply lacks the workflow section).
   */
  private fun buildWorkflowStructureContext(workflowVersionId: Long, userContext: Any): String? {
    val em = formcycleEntityManager(userContext) ?: return null
    return try {
      val taskRows =
          runJpqlOn(
              em,
              "SELECT t.id, t.name, t.description, t.trigger.type, t.trigger.customParameters, " +
                  "t.rootNode.id FROM de.xima.fc.entities.WorkflowTask t JOIN t.process wp " +
                  "JOIN wp.version wv WHERE wv.id = :vid",
              "vid",
              workflowVersionId)
      if (taskRows.isNullOrEmpty()) return null
      val nodeRows =
          runJpqlOn(
              em,
              "SELECT n.id, n.type, n.name, n.description, n.customParameters, n.parent.id " +
                  "FROM de.xima.fc.entities.WorkflowNode n JOIN n.task wta JOIN wta.process wp " +
                  "JOIN wp.version wv WHERE wv.id = :vid ORDER BY n.id",
              "vid",
              workflowVersionId)
      val nodesById = LinkedHashMap<String, JsonObject>()
      val childrenByParent = HashMap<String, MutableList<String>>()
      for (row in nodeRows) {
        val cols = row as? Array<*> ?: continue
        if (cols.size < 6) continue
        val id = cols[0]?.toString() ?: continue
        val node = JsonObject()
        node.addProperty("id", id)
        node.addProperty("type", cols[1]?.toString() ?: "")
        node.addProperty("name", cols[2]?.toString() ?: "")
        node.addProperty("description", cols[3]?.toString() ?: "")
        val custom = cols[4]?.toString()
        if (!custom.isNullOrBlank()) {
          try {
            node.add("customParameters", JsonParser.parseString(custom))
          } catch (_: Exception) {
            node.addProperty("customParameters", custom)
          }
        }
        val parentId = cols[5]?.toString()
        if (parentId != null && parentId.isNotBlank()) {
          childrenByParent.getOrPut(parentId) { mutableListOf() }.add(id)
        }
        nodesById[id] = node
      }
      for ((parentId, childIds) in childrenByParent) {
        val parent = nodesById[parentId] ?: continue
        val arr = JsonArray()
        for (cid in childIds) {
          nodesById[cid]?.let { arr.add(it) }
        }
        parent.add("children", arr)
      }
      val list = JsonArray()
      for (row in taskRows) {
        val cols = row as? Array<*> ?: continue
        if (cols.size < 6) continue
        val t = JsonObject()
        t.addProperty("name", cols[1]?.toString() ?: "")
        t.addProperty("description", cols[2]?.toString() ?: "")
        val tr = JsonObject()
        tr.addProperty("type", cols[3]?.toString() ?: "")
        val triggerCustom = cols[4]?.toString()
        if (!triggerCustom.isNullOrBlank()) {
          try {
            tr.add("customParameters", JsonParser.parseString(triggerCustom))
          } catch (_: Exception) {
            tr.addProperty("customParameters", triggerCustom)
          }
        }
        t.add("trigger", tr)
        val rootNodeId = cols[5]?.toString()
        if (!rootNodeId.isNullOrBlank()) {
          nodesById[rootNodeId]?.let { t.add("rootNode", it) }
        }
        list.add(t)
      }
      gson.toJson(list)
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] buildWorkflowStructureContext failed for workflowVersion {}: {}",
          workflowVersionId,
          e.message)
      null
    } finally {
      (em as? AutoCloseable)?.close()
    }
  }

  /**
   * Deletes the workflow node with the given numeric [nodeId] together with its entire descendant
   * subtree, using FORMCYCLE's entity API via reflection (the same pattern as
   * [createWorkflowTask]). When the deleted node is the root node of a WorkflowTask (i.e. the whole
   * path is removed), the owning task and its trigger are deleted too, so no orphaned path remains.
   */
  private fun removeWorkflowNode(nodeId: String, params: IPluginServletActionParams): String {
    val rootId = nodeId.trim().toLongOrNull() ?: return "Invalid target node id '$nodeId'."
    val userContext = getUserContext(params)
    val em = formcycleEntityManager(userContext)
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val workflowTaskApi = apiProviderClass.getField("WORKFLOW_TASK_API").get(null)
      val workflowTriggerApi = apiProviderClass.getField("WORKFLOW_TRIGGER_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val iTransferableEntityClass =
          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
      val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
      val workflowTriggerClass = Class.forName("de.xima.fc.entities.WorkflowTrigger")

      // Load the target node and its owning task. task/rootNode/trigger are @ManyToOne => EAGER,
      // so navigating them on the returned entity is safe (no lazy-loading).
      val getByIdNodeMethod =
          workflowNodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      val node =
          getByIdNodeMethod.invoke(workflowNodeApi, userContext, rootId)
              ?: return "WorkflowNode $rootId not found — nothing to remove."

      val getTaskMethod = workflowNodeClass.getMethod("getTask")
      val task =
          try {
            getTaskMethod.invoke(node)
          } catch (_: Exception) {
            null
          }
      var taskId: Long? = null
      try {
        taskId = (task?.javaClass?.getMethod("getId")?.invoke(task) as? Number)?.toLong()
      } catch (_: Exception) {}
      // Fallback to the scalar JPQL lookup when entity navigation fails.
      if (taskId == null) taskId = workflowTaskIdOfNode(em, rootId)

      // Detect whether this node is the root node of its task (i.e. the whole path is removed)
      // and remember the trigger id for cleanup. Entity navigation first, scalar JPQL fallback.
      var wholePath = false
      var triggerId: Long? = null
      if (taskId != null) {
        try {
          val taskRootNode = task?.javaClass?.getMethod("getRootNode")?.invoke(task)
          val taskRootId =
              (taskRootNode?.javaClass?.getMethod("getId")?.invoke(taskRootNode) as? Number)
                  ?.toLong()
          wholePath = taskRootId == rootId
          val trigger = task?.javaClass?.getMethod("getTrigger")?.invoke(task)
          triggerId = (trigger?.javaClass?.getMethod("getId")?.invoke(trigger) as? Number)?.toLong()
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] removeWorkflowNode: could not resolve task root/trigger: {}",
              e.message)
          try {
            wholePath = workflowTaskRootNodeId(em, taskId) == rootId
          } catch (_: Exception) {}
          try {
            triggerId = workflowTaskTriggerId(em, taskId)
          } catch (_: Exception) {}
        }
      }

      // Collect the node and all descendants (children first) as (id, type, name) refs so the
      // removed path can be described by name in the result message / change log.
      val getNodeTypeMethod = workflowNodeClass.getMethod("getType")
      val getNodeNameMethod = workflowNodeClass.getMethod("getName")
      val rootType =
          try {
            getNodeTypeMethod.invoke(node) as? String
          } catch (_: Exception) {
            ""
          }
      val rootName =
          try {
            getNodeNameMethod.invoke(node) as? String
          } catch (_: Exception) {
            ""
          }
      val refsToDelete = mutableListOf<Array<Any>>()
      val refQueue = ArrayDeque<Array<Any>>()
      refQueue.add(arrayOf(rootId, rootType ?: "", rootName ?: ""))
      while (refQueue.isNotEmpty()) {
        val ref = refQueue.removeFirst()
        refsToDelete.add(ref)
        val pid = (ref[0] as? Number)?.toLong() ?: continue
        for (childRef in childWorkflowNodeRefs(em, pid)) refQueue.add(childRef)
      }
      val idsToDelete = refsToDelete.map { (it[0] as Number).toLong() }

      // For a whole-path removal, detach the task from its root node and trigger first so the
      // node deletion is not blocked by the task's foreign keys.
      if (wholePath && taskId != null) {
        try {
          val getByIdTaskMethod =
              workflowTaskApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
          val taskEntity = getByIdTaskMethod.invoke(workflowTaskApi, userContext, taskId)
          if (taskEntity != null) {
            workflowTaskClass
                .getMethod("setRootNode", workflowNodeClass)
                .invoke(taskEntity, *arrayOfNulls<Any>(1))
            workflowTaskClass
                .getMethod("setTrigger", workflowTriggerClass)
                .invoke(taskEntity, *arrayOfNulls<Any>(1))
            val updateMethod =
                workflowTaskApi.javaClass.getMethod("update", ucClass, iTransferableEntityClass)
            updateMethod.invoke(workflowTaskApi, userContext, taskEntity)
          }
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] removeWorkflowNode: could not detach task root/trigger: {}",
              e.message)
        }
      }

      // Delete the nodes bottom-up through the entity API (handles @OrderColumn cleanup).
      val deleteByIdMethod =
          workflowNodeApi.javaClass.getMethod("deleteById", ucClass, Long::class.javaObjectType)
      var deleted = 0
      for (id in idsToDelete.reversed()) {
        try {
          deleteByIdMethod.invoke(workflowNodeApi, userContext, id)
          deleted++
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] removeWorkflowNode: delete failed for id={}: {}",
              id,
              e.cause?.message ?: e.message)
        }
      }

      // Clean up the now-empty path: delete the trigger and then the task.
      var cleanup = ""
      if (wholePath && taskId != null && deleted > 0) {
        try {
          if (triggerId != null) {
            val deleteTriggerMethod =
                workflowTriggerApi.javaClass.getMethod(
                    "deleteById", ucClass, Long::class.javaObjectType)
            deleteTriggerMethod.invoke(workflowTriggerApi, userContext, triggerId)
          }
          val deleteTaskMethod =
              workflowTaskApi.javaClass.getMethod("deleteById", ucClass, Long::class.javaObjectType)
          deleteTaskMethod.invoke(workflowTaskApi, userContext, taskId)
          cleanup = " Removed the workflow path (task + trigger)."
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] removeWorkflowNode: task/trigger cleanup failed: {}", e.message)
        }
      }

      // Describe the removed path by its non-SEQUENCE node names (e.g. the action nodes).
      val pathLabel =
          refsToDelete
              .mapNotNull { ref ->
                val type = (ref[1] as? String) ?: ""
                val name = (ref[2] as? String)?.trim()?.takeIf { it.isNotEmpty() }
                when {
                  type == "SEQUENCE" -> null
                  name != null -> "$name ($type)"
                  else -> null
                }
              }
              .takeIf { it.isNotEmpty() }
              ?.joinToString(" → ") ?: "path #$rootId"
      return if (deleted > 0)
          "Removed workflow path #$rootId: $pathLabel — ${idsToDelete.size} node(s) incl. descendants.$cleanup"
      else "Could not remove workflow node #$rootId."
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] removeWorkflowNode failed: {}", e.message)
      return "Could not remove workflow node #$rootId: ${e.message}"
    }
  }

  /**
   * Removes EVERY workflow path (task lane + its trigger + the full node tree) of the given
   * workflow version. Used when the form is emptied ("Lösche alle Elemente" / "delete all
   * elements"): every lane becomes orphaned because its trigger button and referenced form fields
   * are gone. Mirrors the deletion pattern of [removeWorkflowNode] (detach task from root node +
   * trigger, delete nodes bottom-up via the entity API, then delete trigger + task) but iterates
   * over ALL tasks of the version.
   */
  private fun removeAllWorkflowPaths(
      params: IPluginServletActionParams,
      workflowVersionId: Long
  ): String {
    val userContext = getUserContext(params)
    val em = formcycleEntityManager(userContext) ?: return ""
    val rows =
        runJpqlOn(
            em,
            "SELECT t.id FROM de.xima.fc.entities.WorkflowTask t " +
                "JOIN t.process wp JOIN wp.version wv WHERE wv.id = :vid",
            "vid",
            workflowVersionId)
    val taskIds = rows.mapNotNull { (it as? Number)?.toLong() }
    if (taskIds.isEmpty()) return ""
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val workflowTaskApi = apiProviderClass.getField("WORKFLOW_TASK_API").get(null)
      val workflowTriggerApi = apiProviderClass.getField("WORKFLOW_TRIGGER_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val iTransferableEntityClass =
          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
      val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
      val workflowTriggerClass = Class.forName("de.xima.fc.entities.WorkflowTrigger")
      val getByIdTaskMethod =
          workflowTaskApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      val updateTaskMethod =
          workflowTaskApi.javaClass.getMethod("update", ucClass, iTransferableEntityClass)
      val deleteNodeMethod =
          workflowNodeApi.javaClass.getMethod("deleteById", ucClass, Long::class.javaObjectType)
      val deleteTriggerMethod =
          workflowTriggerApi.javaClass.getMethod("deleteById", ucClass, Long::class.javaObjectType)
      val deleteTaskMethod =
          workflowTaskApi.javaClass.getMethod("deleteById", ucClass, Long::class.javaObjectType)

      var removed = 0
      for (taskId in taskIds) {
        try {
          var triggerId: Long? = null
          try {
            triggerId = workflowTaskTriggerId(em, taskId)
          } catch (_: Exception) {}
          // Collect the whole node tree of the task (root + descendants).
          val idsToDelete = mutableListOf<Long>()
          val rootNodeId =
              try {
                workflowTaskRootNodeId(em, taskId)
              } catch (_: Exception) {
                null
              }
          if (rootNodeId != null) {
            val queue = ArrayDeque<Long>()
            queue.add(rootNodeId)
            while (queue.isNotEmpty()) {
              val pid = queue.removeFirst()
              idsToDelete.add(pid)
              for (childRef in childWorkflowNodeRefs(em, pid)) {
                (childRef[0] as? Number)?.toLong()?.let { queue.add(it) }
              }
            }
          }
          // Detach the task from its root node + trigger so node deletion is not blocked by FKs.
          try {
            val taskEntity =
                getByIdTaskMethod.invoke(workflowTaskApi, userContext, taskId) ?: continue
            workflowTaskClass
                .getMethod("setRootNode", workflowNodeClass)
                .invoke(taskEntity, *arrayOfNulls<Any>(1))
            workflowTaskClass
                .getMethod("setTrigger", workflowTriggerClass)
                .invoke(taskEntity, *arrayOfNulls<Any>(1))
            updateTaskMethod.invoke(workflowTaskApi, userContext, taskEntity)
          } catch (e: Exception) {
            logger.warn(
                "[AICodBiAssistant] removeAllWorkflowPaths: detach failed for task {}: {}",
                taskId,
                e.message)
          }
          // Delete the nodes bottom-up.
          for (id in idsToDelete.reversed()) {
            try {
              deleteNodeMethod.invoke(workflowNodeApi, userContext, id)
            } catch (e: Exception) {
              logger.warn(
                  "[AICodBiAssistant] removeAllWorkflowPaths: node delete failed id={}: {}",
                  id,
                  e.message)
            }
          }
          // Delete the trigger and then the task.
          if (triggerId != null) {
            try {
              deleteTriggerMethod.invoke(workflowTriggerApi, userContext, triggerId)
            } catch (_: Exception) {}
          }
          try {
            deleteTaskMethod.invoke(workflowTaskApi, userContext, taskId)
            removed++
          } catch (e: Exception) {
            logger.warn(
                "[AICodBiAssistant] removeAllWorkflowPaths: task delete failed {}: {}",
                taskId,
                e.message)
          }
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] removeAllWorkflowPaths: task {} failed: {}", taskId, e.message)
        }
      }
      if (removed > 0) {
        touchWorkflowVersion(userContext, workflowVersionId)
        logger.info(
            "[AICodBiAssistant] removeAllWorkflowPaths: removed {} workflow path(s) after form empty",
            removed)
        " Removed all $removed workflow path(s) (the form was emptied)."
      } else {
        ""
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] removeAllWorkflowPaths failed: {}", e.message)
      ""
    }
  }

  /**
   * Obtains a FORMCYCLE-managed EntityManager (via EntityContextFactory) that has all FormCycle
   * entities registered — the CodBi plugin's own EntityManagerFactory does NOT know them.
   */
  private fun formcycleEntityManager(userContext: Any): Any? {
    return try {
      val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      entityContext.javaClass.getMethod("getEm").invoke(entityContext)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] formcycleEntityManager failed: {}", e.message)
      null
    }
  }

  /** Runs a JPQL query on a FORMCYCLE-managed EntityManager and returns the raw result list. */
  private fun runJpqlOn(em: Any?, jpql: String, paramName: String?, paramValue: Any?): List<*> {
    if (em == null) return emptyList<Any>()
    return try {
      val query = em.javaClass.getMethod("createQuery", String::class.java).invoke(em, jpql)
      if (paramName != null) {
        query.javaClass
            .getMethod("setParameter", String::class.java, Any::class.java)
            .invoke(query, paramName, paramValue)
      }
      @Suppress("UNCHECKED_CAST")
      (query.javaClass.getMethod("getResultList").invoke(query) as? List<*>) ?: emptyList<Any>()
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] runJpqlOn failed: {}", e.message)
      emptyList<Any>()
    }
  }

  /** Returns the (id, type, name) triples of the direct child nodes of the given workflow node. */
  private fun childWorkflowNodeRefs(em: Any?, parentId: Long): List<Array<Any>> {
    val rows =
        runJpqlOn(
            em,
            "SELECT n.id, n.type, n.name FROM de.xima.fc.entities.WorkflowNode n " +
                "WHERE n.parent.id = :pid",
            "pid",
            parentId)
    val result = mutableListOf<Array<Any>>()
    for (row in rows) {
      val cols = row as? Array<*> ?: continue
      if (cols.size < 3) continue
      val id = (cols[0] as? Number)?.toLong() ?: continue
      result.add(arrayOf(id, cols[1]?.toString() ?: "", cols[2]?.toString() ?: ""))
    }
    return result
  }

  /** Returns the owning WorkflowTask id of a node, or null when the node has no task. */
  private fun workflowTaskIdOfNode(em: Any?, nodeId: Long): Long? {
    val rows =
        runJpqlOn(
            em,
            "SELECT n.task.id FROM de.xima.fc.entities.WorkflowNode n WHERE n.id = :nid",
            "nid",
            nodeId)
    return (rows.firstOrNull() as? Number)?.toLong()
  }

  /** Returns the root node id of a workflow task, or null when the task has no root node. */
  private fun workflowTaskRootNodeId(em: Any?, taskId: Long): Long? {
    val rows =
        runJpqlOn(
            em,
            "SELECT t.rootNode.id FROM de.xima.fc.entities.WorkflowTask t WHERE t.id = :tid",
            "tid",
            taskId)
    return (rows.firstOrNull() as? Number)?.toLong()
  }

  /** Returns the trigger id of a workflow task, or null when the task has no trigger. */
  private fun workflowTaskTriggerId(em: Any?, taskId: Long): Long? {
    val rows =
        runJpqlOn(
            em,
            "SELECT t.trigger.id FROM de.xima.fc.entities.WorkflowTask t WHERE t.id = :tid",
            "tid",
            taskId)
    return (rows.firstOrNull() as? Number)?.toLong()
  }

  /**
   * Safety net: deletes every workflow task (lane) in the given workflow version that no longer has
   * any workflow nodes, together with its trigger. Guarantees that removing paths never leaves
   * empty lanes behind, even when the AI targeted individual nodes instead of root nodes.
   */
  private fun cleanupEmptyWorkflowTasks(userContext: Any, workflowVersionId: Long): String {
    val em = formcycleEntityManager(userContext) ?: return ""
    val rows =
        runJpqlOn(
            em,
            "SELECT t.id FROM de.xima.fc.entities.WorkflowTask t " +
                "JOIN t.process wp JOIN wp.version wv " +
                "WHERE wv.id = :vid AND NOT EXISTS " +
                "(SELECT n FROM de.xima.fc.entities.WorkflowNode n WHERE n.task.id = t.id)",
            "vid",
            workflowVersionId)
    if (rows.isEmpty()) return ""
    val taskIds = rows.mapNotNull { (it as? Number)?.toLong() }
    if (taskIds.isEmpty()) return ""
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowTaskApi = apiProviderClass.getField("WORKFLOW_TASK_API").get(null)
      val workflowTriggerApi = apiProviderClass.getField("WORKFLOW_TRIGGER_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val iTransferableEntityClass =
          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
      val workflowTriggerClass = Class.forName("de.xima.fc.entities.WorkflowTrigger")
      val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")

      var removed = 0
      for (taskId in taskIds) {
        try {
          val getByIdTaskMethod =
              workflowTaskApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
          val task = getByIdTaskMethod.invoke(workflowTaskApi, userContext, taskId) ?: continue
          var triggerId: Long? = null
          try {
            val trigger = task.javaClass.getMethod("getTrigger").invoke(task)
            triggerId =
                (trigger?.javaClass?.getMethod("getId")?.invoke(trigger) as? Number)?.toLong()
          } catch (_: Exception) {}
          workflowTaskClass
              .getMethod("setRootNode", workflowNodeClass)
              .invoke(task, *arrayOfNulls<Any>(1))
          workflowTaskClass
              .getMethod("setTrigger", workflowTriggerClass)
              .invoke(task, *arrayOfNulls<Any>(1))
          workflowTaskApi.javaClass
              .getMethod("update", ucClass, iTransferableEntityClass)
              .invoke(workflowTaskApi, userContext, task)
          if (triggerId != null) {
            workflowTriggerApi.javaClass
                .getMethod("deleteById", ucClass, Long::class.javaObjectType)
                .invoke(workflowTriggerApi, userContext, triggerId)
          }
          workflowTaskApi.javaClass
              .getMethod("deleteById", ucClass, Long::class.javaObjectType)
              .invoke(workflowTaskApi, userContext, taskId)
          removed++
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] cleanupEmptyWorkflowTasks: failed for taskId={}: {}",
              taskId,
              e.cause?.message ?: e.message)
        }
      }
      if (removed > 0) {
        logger.info(
            "[AICodBiAssistant] cleanupEmptyWorkflowTasks: removed {} empty lane(s): {}",
            removed,
            taskIds)
        " Removed $removed empty workflow lane(s)."
      } else {
        ""
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] cleanupEmptyWorkflowTasks failed: {}", e.message)
      ""
    }
  }

  /**
   * Marks the given WorkflowVersion as workflow-invalid after the AI wrote workflow tasks/nodes
   * directly via the node/task API. The normal designer save flow sets
   * WorkflowVersion.workflowInvalid (ATTR_VERSION_WORKFLOW_INVALID) whenever the workflow is edited
   * — that flag is what makes FORMCYCLE reload/revalidate its cached workflow model when the
   * designer's Workflow tab loads. Because the AI bypasses that save flow, the flag never gets set
   * and the Workflow tab can keep showing the previous (cached) workflow after the page reload
   * until a second manual reload.
   */
  private fun touchWorkflowVersion(userContext: Any, workflowVersionId: Long) {
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId) ?: return
      workflowVersion.javaClass
          .getMethod("setWorkflowInvalid", Boolean::class.javaPrimitiveType)
          .invoke(workflowVersion, true)
      val updateMethod =
          workflowVersionApi.javaClass.getMethod(
              "update",
              ucClass,
              Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity"))
      updateMethod.invoke(workflowVersionApi, userContext, workflowVersion)
      logger.info(
          "[AICodBiAssistant] Marked WorkflowVersion {} as invalid (workflow model will reload)",
          workflowVersionId)
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not mark WorkflowVersion {} as invalid: {}",
          workflowVersionId,
          e.message)
    }
  }

  /**
   * Replaces an existing workflow node for the "replace" operation.
   *
   * When the target is a node INSIDE a workflow path, it is updated IN PLACE (its type, name and
   * parameters are replaced, but the node keeps its current workflow path and trigger) — the user
   * asked to change an existing node, so no new/empty workflow path may be created. When the target
   * is a ROOT node (one whole workflow path), the whole path is replaced: the old path is removed
   * and a new task is created from the spec.
   */
  private fun replaceWorkflowNode(
      workflowVersionId: Long,
      nodeId: String,
      spec: WorkflowTaskSpec,
      params: IPluginServletActionParams
  ): String {
    val targetId = nodeId.trim().toLongOrNull() ?: return "Invalid target node id '$nodeId'."
    val userContext = getUserContext(params)
    val em = formcycleEntityManager(userContext)
    try {
      val taskId = workflowTaskIdOfNode(em, targetId)
      if (taskId != null && workflowTaskRootNodeId(em, taskId) == targetId) {
        // Whole-path replacement (the target is a ROOT node) — keep the previous remove + create
        // new task behaviour so a whole path can be swapped out.
        val removed = removeWorkflowNode(nodeId, params)
        val created = createWorkflowTask(workflowVersionId, spec, params)
        return "$removed | $created"
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] replaceWorkflowNode: root detection failed: {}", e.message)
    }
    // Non-root node: update it in place, keeping its path.
    return replaceWorkflowNodeInPlace(workflowVersionId, targetId, spec, userContext)
  }

  /**
   * Updates an existing workflow node IN PLACE (same task/path) for the "replace" operation. The
   * node's type, name and custom parameters are replaced but it keeps its current workflow path and
   * trigger, so no new/empty workflow path appears.
   */
  private fun replaceWorkflowNodeInPlace(
      workflowVersionId: Long,
      nodeId: Long,
      spec: WorkflowTaskSpec,
      userContext: Any
  ): String {
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val iTransferableEntityClass =
          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")

      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId)
              ?: return "WorkflowVersion $workflowVersionId not found."
      val node =
          workflowNodeApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowNodeApi, userContext, nodeId)
              ?: return "WorkflowNode $nodeId not found — nothing to replace."

      // A "replace" may carry chainedNodes (top-level or embedded in nodeParams — a common AI
      // inconsistency). This is the taught pattern for adding error handling INTO an existing
      // workflow path (e.g. an FC_EXPERIMENT handler SEQUENCE) without creating a second lane. It
      // is interpreted as "replace this node with the chained nodes at the same level": the target
      // is converted IN PLACE into the FIRST chained node, and the remaining chained nodes are
      // created as SIBLINGS right after it under the same parent — no extra SEQUENCE wrapper is
      // created, so the designer shows a normal sequence without extra connection knobs.
      val chainedNodes =
          (spec.chainedNodes ?: (spec.nodeParams["chainedNodes"] as? List<Map<String, Any>>))
              ?.ifEmpty { null }
      if (chainedNodes != null) {
        val replaced = mutableListOf<String>()
        val firstSpec =
            chainedNodes.firstOrNull()?.let { cs ->
              gson.fromJson(gson.toJson(cs), WorkflowTaskSpec::class.java)
            }
        if (firstSpec != null) {
          val firstName = deriveNodeName(firstSpec)
          workflowNodeClass
              .getMethod("setType", String::class.java)
              .invoke(node, firstSpec.nodeType)
          if (firstName.isNotBlank()) {
            workflowNodeClass.getMethod("setName", String::class.java).invoke(node, firstName)
          }
          val firstParams =
              buildNodeParamsJsonWithIcon(
                  firstSpec, workflowVersion, userContext, firstSpec.nodeType)
          if (firstParams != null) {
            workflowNodeClass
                .getMethod("setCustomParameters", String::class.java)
                .invoke(node, firstParams)
            stampCustomParamsVersion(workflowNodeClass, node)
          }
          workflowNodeApi.javaClass
              .getMethod("update", ucClass, iTransferableEntityClass)
              .invoke(workflowNodeApi, userContext, node)
          replaced.add("${firstSpec.nodeType} '${sanitizeWorkflowName(firstName)}'")
        }
        val restSpecs =
            chainedNodes.drop(1).map { cs ->
              gson.fromJson(gson.toJson(cs), WorkflowTaskSpec::class.java)
            }
        if (restSpecs.isNotEmpty()) {
          val parent =
              try {
                node.javaClass.getMethod("getParent").invoke(node)
              } catch (_: Exception) {
                null
              }
          val parentTask =
              if (parent == null) null
              else
                  try {
                    parent.javaClass.getMethod("getTask").invoke(parent)
                  } catch (_: Exception) {
                    null
                  }
          if (parent != null && parentTask != null) {
            replaced.addAll(
                createChildNodesUnderExisting(
                    parent, parentTask, workflowVersion, userContext, restSpecs))
          } else {
            logger.warn(
                "[AICodBiAssistant] replaceWithChainedNodes: no parent/task for node {} — chained nodes beyond the first were not created",
                nodeId)
          }
        }
        if (replaced.isEmpty()) return "Replace of node $nodeId produced no chained nodes."
        logger.info(
            "[AICodBiAssistant] Replaced node {} with chained nodes (no extra SEQUENCE): {}",
            nodeId,
            replaced.joinToString(", "))
        return "Replaced node $nodeId with ${replaced.joinToString(", ")} (kept its workflow path)"
      }

      val newName = deriveNodeName(spec)
      val nodeParamsJson =
          buildNodeParamsJsonWithIcon(spec, workflowVersion, userContext, spec.nodeType)
      if (!spec.nodeType.isNullOrBlank()) {
        workflowNodeClass.getMethod("setType", String::class.java).invoke(node, spec.nodeType)
      }
      if (newName.isNotBlank()) {
        workflowNodeClass.getMethod("setName", String::class.java).invoke(node, newName)
      }
      if (nodeParamsJson != null) {
        workflowNodeClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(node, nodeParamsJson)
        stampCustomParamsVersion(workflowNodeClass, node)
      }
      workflowNodeApi.javaClass
          .getMethod("update", ucClass, iTransferableEntityClass)
          .invoke(workflowNodeApi, userContext, node)
      logger.info(
          "[AICodBiAssistant] Replaced node {} in place: type='{}', name='{}' (kept existing path)",
          nodeId,
          spec.nodeType,
          newName)
      return "Replaced node $nodeId in place (kept its workflow path)"
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] replaceWorkflowNodeInPlace failed: {}", e.message)
      return "Replace failed: ${e.message}"
    }
  }

  /** Dispatches a workflow delta operation: create (default), remove or replace. */
  private fun applyWorkflowOperation(
      workflowVersionId: Long,
      spec: WorkflowTaskSpec,
      params: IPluginServletActionParams
  ): String {
    logger.info(
        "[AICodBiAssistant] applyWorkflowOperation: operation={}, nodeType={}, targetNodeId={}",
        spec.operation,
        spec.nodeType,
        spec.targetNodeId)
    return when (spec.operation.trim().lowercase()) {
      "remove" -> {
        val target = spec.targetNodeId
        if (target.isNullOrBlank()) "Remove operation requires a 'targetNodeId'."
        else removeWorkflowNode(target, params)
      }
      "replace" -> {
        val target = spec.targetNodeId
        if (target.isNullOrBlank()) "Replace operation requires a 'targetNodeId'."
        else replaceWorkflowNode(workflowVersionId, target, spec, params)
      }
      else -> createWorkflowTask(workflowVersionId, spec, params)
    }
  }

  /**
   * Creates one or more workflow ACTION nodes as direct children of an existing node. Used to fold
   * an AI error-mail lane (trigger FC_CATCH_ERROR) into an existing FC_EXPERIMENT's handler
   * SEQUENCE. The new nodes inherit the parent's task, so no new lane/trigger is created.
   */
  private fun insertNodesUnderExistingParent(
      userContext: Any,
      workflowVersionId: Long,
      parentNodeId: Long,
      nodeSpecs: List<WorkflowTaskSpec>
  ): String {
    try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val getNodeById =
          workflowNodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      val parentNode =
          getNodeById.invoke(workflowNodeApi, userContext, parentNodeId)
              ?: return "Cannot insert error nodes: handler node $parentNodeId not found."
      val parentTask =
          try {
            parentNode.javaClass.getMethod("getTask").invoke(parentNode)
          } catch (_: Exception) {
            null
          } ?: return "Cannot insert error nodes: no task for handler node $parentNodeId."
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod("getById", ucClass, Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId)
              ?: return "Cannot insert error nodes: WorkflowVersion $workflowVersionId not found."
      val created =
          createChildNodesUnderExisting(
              parentNode, parentTask, workflowVersion, userContext, nodeSpecs)
      if (created.isEmpty()) return "No insertable error nodes in the FC_CATCH_ERROR lane."
      logger.info(
          "[AICodBiAssistant] Inserted into FC_EXPERIMENT handler path {}: {}",
          parentNodeId,
          created.joinToString(", "))
      return "Inserted error handling into the existing FC_EXPERIMENT handler path (no new lane): " +
          created.joinToString(", ")
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] insertNodesUnderExistingParent failed: {}", e.message)
      return "Could not insert into FC_EXPERIMENT handler path: ${e.message}"
    }
  }

  /**
   * Creates the given action node specs as direct children of an existing parent workflow node,
   * inheriting the parent's task (so no new lane/trigger is created). Terminal/endpoint node types
   * (FC_RETURN, FC_CHANGE_STATE, ...) are skipped because the surrounding path already ends at its
   * endpoint. Returns the created node descriptions.
   */
  private fun createChildNodesUnderExisting(
      parentNode: Any,
      parentTask: Any,
      workflowVersion: Any,
      userContext: Any,
      nodeSpecs: List<WorkflowTaskSpec>
  ): List<String> {
    val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
    val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
    val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
    val iTransferableEntityClass =
        Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
    val createNodeMethod =
        workflowNodeApi.javaClass.getMethod("create", ucClass, iTransferableEntityClass)
    val terminalTypes =
        setOf("FC_RETURN", "FC_CHANGE_STATE", "FC_DELETE_FORM_RECORD", "FC_QUEUE_TASK")
    val created = mutableListOf<String>()
    for (spec in nodeSpecs) {
      val type = spec.nodeType ?: continue
      if (type.isBlank() || type in terminalTypes) continue
      val node = workflowNodeClass.getDeclaredConstructor().newInstance()
      val name = deriveNodeName(spec)
      workflowNodeClass.getMethod("setName", String::class.java).invoke(node, name)
      workflowNodeClass.getMethod("setType", String::class.java).invoke(node, type)
      workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(node, true)
      workflowNodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(node, UUID.randomUUID())
      val nodeParamsJson = buildNodeParamsJsonWithIcon(spec, workflowVersion, userContext, type)
      if (nodeParamsJson != null) {
        workflowNodeClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(node, nodeParamsJson)
        stampCustomParamsVersion(workflowNodeClass, node)
      }
      workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(node, parentTask)
      workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(node, parentNode)
      val saved = createNodeMethod.invoke(workflowNodeApi, userContext, node)
      fixParentOrderIndex(saved, parentNode, userContext)
      created.add("$type '${sanitizeWorkflowName(name)}'")
    }
    return created
  }

  /**
   * Re-routes AI error-handling lanes (trigger FC_CATCH_ERROR) into an existing FC_EXPERIMENT's
   * handler path when the HTTP/action node the user wants error handling for is already wrapped in
   * such an experiment. Keeps ONE lane/trigger instead of adding a second, separately-triggered
   * path. Falls back to the original specs when no suitable experiment exists.
   */
  private fun foldErrorLanesIntoExperiments(
      specs: List<WorkflowTaskSpec>,
      existingWorkflowNodesJson: String?,
      workflowVersionId: Long,
      params: IPluginServletActionParams
  ): Pair<List<WorkflowTaskSpec>, List<String>> {
    val toFold =
        specs.filter { spec ->
          val creating =
              spec.operation.isBlank() || spec.operation.equals("create", ignoreCase = true)
          creating && spec.triggerType.equals("FC_CATCH_ERROR", ignoreCase = true)
        }
    if (toFold.isEmpty()) return specs to emptyList()
    val handlerSequenceId =
        findExperimentHandlerSequenceId(existingWorkflowNodesJson) ?: return specs to emptyList()
    val userContext = getUserContext(params)
    val remaining = specs.filter { spec -> toFold.none { it === spec } }
    val messages =
        toFold.map { spec ->
          val nodesToInsert =
              listOf(spec) +
                  (spec.chainedNodes?.map { cs ->
                    gson.fromJson(gson.toJson(cs), WorkflowTaskSpec::class.java)
                  } ?: emptyList())
          insertNodesUnderExistingParent(
              userContext, workflowVersionId, handlerSequenceId, nodesToInsert)
        }
    return remaining to messages
  }

  /**
   * Stamps a workflow element's custom-parameters version exactly like formcycle's own node
   * builders do. The value MUST equal the current formcycle node-handler version ("8.5.3" — the
   * formcycle release version, verified via the persisted customParamsVer='8.5.3' on a manually
   * created FC_POST_REQUEST node and its decrypted "$version":"8.5.3"). Without this,
   * WorkflowCustomParametersHelper.updateCustomParams() sees a mismatching version on every load
   * and runs the node handler's updateCustomParams() migration — for FC_POST_REQUEST that
   * re-derives httpRequestType and resets "CUSTOM" to the DYNAMIC default ("Automatisch gemäß
   * Inhalt"). Matching formcycle's "8.5.3" makes the version check pass so the migration is
   * skipped.
   */
  private fun stampCustomParamsVersion(cls: Class<*>, element: Any) {
    try {
      cls.getMethod("setCustomParametersVersion", String::class.java).invoke(element, "8.5.3")
      val name =
          try {
            element.javaClass.getMethod("getName").invoke(element) as? String
          } catch (_: Exception) {
            null
          }
      logger.info(
          "[AICodBiAssistant] Stamped customParametersVersion='8.5.3' on {} '{}'",
          cls.simpleName,
          name ?: "?")
    } catch (_: Exception) {
      logger.debug("[AICodBiAssistant] No setCustomParametersVersion on {}", cls.simpleName)
    }
  }

  /**
   * DIAGNOSTIC: logs the DECRYPTED custom parameters and the customParametersVersion of every
   * FC_POST_REQUEST node (AI-created AND manually-created) via the entity API, so an AI-created
   * node can be compared with a manually-created one to find why the designer shows "Automatisch
   * gemäß Inhalt" (DYNAMIC) although the persisted httpRequestType is "CUSTOM".
   */
  private fun logPostRequestNodeStates(userContext: Any) {
    try {
      val em = formcycleEntityManager(userContext) ?: return
      val rows =
          runJpqlOn(
              em,
              "SELECT n.id FROM de.xima.fc.entities.WorkflowNode n WHERE n.type = 'FC_POST_REQUEST'",
              null,
              null)
      if (rows.isEmpty()) return
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val getByIdMethod =
          workflowNodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      for (row in rows) {
        val id = (row as? Number)?.toLong() ?: continue
        try {
          val node = getByIdMethod.invoke(workflowNodeApi, userContext, id) ?: continue
          val name = node.javaClass.getMethod("getName").invoke(node) as? String
          val ver = node.javaClass.getMethod("getCustomParametersVersion").invoke(node) as? String
          val params = node.javaClass.getMethod("getCustomParameters").invoke(node) as? String
          logger.info(
              "[AICodBiAssistant] DIAG FC_POST_REQUEST id={} name='{}' customParamsVer='{}' customParams={}",
              id,
              name,
              ver,
              params)
        } catch (e: Exception) {
          logger.warn(
              "[AICodBiAssistant] DIAG: could not read FC_POST_REQUEST node {}: {}", id, e.message)
        }
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] DIAG logPostRequestNodeStates failed: {}", e.message)
    }
  }

  /**
   * Creates a new workflow task in the active WorkflowVersion of the given project using
   * FORMCYCLE's entity API via reflection. (Mirrors AIWorkflowAssistant.createWorkflowTask.)
   */
  private fun createWorkflowTask(
      workflowVersionId: Long,
      spec: WorkflowTaskSpec,
      params: IPluginServletActionParams
  ): String {
    val userContext = getUserContext(params)
    val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")

    val workflowVersionApiField = apiProviderClass.getField("WORKFLOW_VERSION_API")
    val workflowVersionApi = workflowVersionApiField.get(null)
    val getByIdMethod =
        workflowVersionApi.javaClass.getMethod(
            "getById", Class.forName("de.xima.fc.user.UserContext"), Long::class.javaObjectType)
    val workflowVersion =
        getByIdMethod.invoke(workflowVersionApi, userContext, workflowVersionId)
            ?: return "WorkflowVersion $workflowVersionId not found."

    val getMainProcessMethod = workflowVersion.javaClass.getMethod("getMainProcess")
    val mainProcess =
        getMainProcessMethod.invoke(workflowVersion)
            ?: throw IllegalStateException("WorkflowVersion $workflowVersionId has no mainProcess")

    val workflowTriggerClass = Class.forName("de.xima.fc.entities.WorkflowTrigger")
    val trigger = workflowTriggerClass.getDeclaredConstructor().newInstance()
    workflowTriggerClass.getMethod("setName", String::class.java).invoke(trigger, spec.triggerType)
    workflowTriggerClass.getMethod("setType", String::class.java).invoke(trigger, spec.triggerType)
    workflowTriggerClass.getMethod("setActive", Boolean::class.java).invoke(trigger, true)
    workflowTriggerClass
        .getMethod("setUUIDObject", UUID::class.java)
        .invoke(trigger, UUID.randomUUID())
    val triggerParamsJson = buildTriggerParamsJsonWithIcon(spec, workflowVersion, userContext)
    if (triggerParamsJson != null) {
      workflowTriggerClass
          .getMethod("setCustomParameters", String::class.java)
          .invoke(trigger, triggerParamsJson)
      stampCustomParamsVersion(workflowTriggerClass, trigger)
    }

    val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
    val rootNode = workflowNodeClass.getDeclaredConstructor().newInstance()
    workflowNodeClass.getMethod("setName", String::class.java).invoke(rootNode, "SEQUENCE")
    workflowNodeClass.getMethod("setType", String::class.java).invoke(rootNode, "SEQUENCE")
    workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(rootNode, true)
    workflowNodeClass
        .getMethod("setUUIDObject", UUID::class.java)
        .invoke(rootNode, UUID.randomUUID())

    val actionNode = workflowNodeClass.getDeclaredConstructor().newInstance()
    val actionNodeName = deriveNodeName(spec)
    logger.info(
        "[AICodBiAssistant] Creating actionNode: type={}, setting name='{}' (taskName='{}', nodeType='{}', derived='{}')",
        spec.nodeType,
        actionNodeName,
        spec.taskName,
        spec.nodeType,
        actionNodeName)
    workflowNodeClass.getMethod("setName", String::class.java).invoke(actionNode, actionNodeName)
    val nodeDescription = spec.taskDescription ?: ""
    if (nodeDescription.isNotBlank()) {
      try {
        workflowNodeClass
            .getMethod("setDescription", String::class.java)
            .invoke(actionNode, nodeDescription)
      } catch (_: Exception) {
        logger.warn(
            "[AICodBiAssistant] WorkflowNode has no setDescription method: {}", nodeDescription)
      }
    }
    workflowNodeClass.getMethod("setType", String::class.java).invoke(actionNode, spec.nodeType)
    workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(actionNode, true)
    workflowNodeClass
        .getMethod("setUUIDObject", UUID::class.java)
        .invoke(actionNode, UUID.randomUUID())
    val nodeParamsJson =
        buildNodeParamsJsonWithIcon(spec, workflowVersion, userContext, spec.nodeType)
    if (nodeParamsJson != null) {
      logger.info(
          "[AICodBiAssistant] Setting custom_params for nodeType={}: {}",
          spec.nodeType,
          nodeParamsJson)
      workflowNodeClass
          .getMethod("setCustomParameters", String::class.java)
          .invoke(actionNode, nodeParamsJson)
      stampCustomParamsVersion(workflowNodeClass, actionNode)
    }

    val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
    val task = workflowTaskClass.getDeclaredConstructor().newInstance()
    workflowTaskClass
        .getMethod("setName", String::class.java)
        .invoke(task, sanitizeWorkflowName(spec.taskName).ifBlank { "AI-generated task" })
    workflowTaskClass
        .getMethod("setDescription", String::class.java)
        .invoke(task, spec.taskDescription ?: "")
    workflowTaskClass.getMethod("setUUIDObject", UUID::class.java).invoke(task, UUID.randomUUID())
    workflowTaskClass
        .getMethod("setProcess", Class.forName("de.xima.fc.entities.WorkflowProcess"))
        .invoke(task, mainProcess)

    val workflowTaskApiField = apiProviderClass.getField("WORKFLOW_TASK_API")
    val workflowTaskApi = workflowTaskApiField.get(null)
    val workflowTriggerApiField = apiProviderClass.getField("WORKFLOW_TRIGGER_API")
    val workflowTriggerApi = workflowTriggerApiField.get(null)
    val workflowNodeApiField = apiProviderClass.getField("WORKFLOW_NODE_API")
    val workflowNodeApi = workflowNodeApiField.get(null)

    val iTransferableEntityClass =
        Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
    val userContextClass = Class.forName("de.xima.fc.user.UserContext")
    val updateMethod =
        workflowTaskApi.javaClass.getMethod("update", userContextClass, iTransferableEntityClass)
    val createTaskMethod =
        workflowTaskApi.javaClass.getMethod("create", userContextClass, iTransferableEntityClass)
    val createTriggerMethod =
        workflowTriggerApi.javaClass.getMethod("create", userContextClass, iTransferableEntityClass)
    val createNodeMethod =
        workflowNodeApi.javaClass.getMethod("create", userContextClass, iTransferableEntityClass)

    val savedTask = createTaskMethod.invoke(workflowTaskApi, userContext, task)

    workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(rootNode, savedTask)
    val savedRootNode = createNodeMethod.invoke(workflowNodeApi, userContext, rootNode)

    workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(actionNode, savedTask)
    workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(actionNode, savedRootNode)
    val savedActionNode = createNodeMethod.invoke(workflowNodeApi, userContext, actionNode)

    // DEBUG: Verify the node name was persisted correctly
    try {
      val savedNodeName =
          savedActionNode.javaClass.getMethod("getName").invoke(savedActionNode) as? String
      val savedNodeType =
          savedActionNode.javaClass.getMethod("getType").invoke(savedActionNode) as? String
      logger.info(
          "[AICodBiAssistant] POST-PERSIST actionNode: id={}, type='{}', name='{}' (expected='{}')",
          savedActionNode.javaClass.getMethod("getId").invoke(savedActionNode),
          savedNodeType,
          savedNodeName,
          actionNodeName)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] POST-PERSIST name verification failed: {}", e.message)
    }
    fixParentOrderIndex(savedActionNode, savedRootNode, userContext)
    // Recursively create child nodes for conditional/loop nodes that have _childNodes.
    // Handles unlimited nesting depth (e.g., FC_FOR_EACH_LOOP â†’ FC_WHILE_LOOP â†’
    // FC_MULTIPLE_CONDITION â†’ FC_BREAK / FC_CONTINUE and beyond).
    // Pattern: for each conditional/loop node with _childNodes, create a SEQUENCE wrapper
    // as its YES-branch child, place action nodes inside it, then recurse into each.
    // Capture the top-level loop node UUID for symbolic breakTarget resolution
    val rootLoopUuid =
        savedActionNode.javaClass.getMethod("getUuid").invoke(savedActionNode) as? java.util.UUID
    fun processBranchChildren(
        parentSpec: WorkflowTaskSpec,
        savedParentNode: Any,
        childSpecList: List<Map<String, Any>>,
        depth: Int
    ) {
      val indent = "  ".repeat(depth)
      logger.info(
          "[AICodBiAssistant]{} Processing branch children (depth={}) for nodeType={}",
          indent,
          depth,
          parentSpec.nodeType)
      for ((idx, specMap) in childSpecList.withIndex()) {
        val childSpec = gson.fromJson(gson.toJson(specMap), WorkflowTaskSpec::class.java)
        val childNodeName = deriveNodeName(childSpec)
        val childNode = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(childNode, childNodeName)
        workflowNodeClass
            .getMethod("setType", String::class.java)
            .invoke(childNode, childSpec.nodeType)
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(childNode, true)
        workflowNodeClass
            .getMethod("setUUIDObject", UUID::class.java)
            .invoke(childNode, UUID.randomUUID())
        val childParamsJson =
            buildNodeParamsJsonWithIcon(childSpec, workflowVersion, userContext, childSpec.nodeType)
        if (childParamsJson != null) {
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(childNode, childParamsJson)
          stampCustomParamsVersion(workflowNodeClass, childNode)
        }
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(childNode, savedTask)
        workflowNodeClass
            .getMethod("setParent", workflowNodeClass)
            .invoke(childNode, savedParentNode)
        val savedChildNode = createNodeMethod.invoke(workflowNodeApi, userContext, childNode)
        fixParentOrderIndex(savedChildNode, savedParentNode, userContext)
        // Resolve symbolic breakTarget for FC_BREAK nodes
        if (childSpec.nodeType == "FC_BREAK") {
          val breakTarget = childSpec.nodeParams["breakTarget"] as? String
          if ((breakTarget == "\$ROOT" || breakTarget == "00000000-0000-0000-0000-000000000000") &&
              rootLoopUuid != null) {
            // Resolve "$ROOT" or placeholder UUID to the top-level loop node's UUID
            // Format: NodeKey as object with uuid field - FastJSON expects {"uuid":"..."}
            val resolvedJson =
                """{"name":${gson.toJson(childNodeName)},"description":"","breakTarget":{"uuid":${gson.toJson(rootLoopUuid.toString())}}}"""
            // Update the in-memory object
            workflowNodeClass
                .getMethod("setCustomParameters", String::class.java)
                .invoke(savedChildNode, resolvedJson)
            stampCustomParamsVersion(workflowNodeClass, savedChildNode)
            // Persist the change to database - use update API to ensure it's saved
            try {
              val updateNodeMethod =
                  workflowNodeApi.javaClass.getMethod(
                      "update", userContextClass, iTransferableEntityClass)
              updateNodeMethod.invoke(workflowNodeApi, userContext, savedChildNode)
            } catch (e: Exception) {
              logger.warn(
                  "[AICodBiAssistant]{} Could not persist breakTarget update: {}",
                  indent,
                  e.message)
            }
            logger.info(
                "[AICodBiAssistant]{} Resolved breakTarget -> uuid={} for FC_BREAK, json={}",
                indent,
                rootLoopUuid,
                resolvedJson)
          }
        }
        // Resolve symbolic continueTarget for FC_CONTINUE nodes
        if (childSpec.nodeType == "FC_CONTINUE") {
          val continueTarget = childSpec.nodeParams["continueTarget"] as? String
          if ((continueTarget == "\$ROOT" ||
              continueTarget == "00000000-0000-0000-0000-000000000000") && rootLoopUuid != null) {
            // Resolve "$ROOT" or placeholder UUID to the top-level loop node's UUID
            val resolvedJson =
                """{"name":${gson.toJson(childNodeName)},"description":"","continueTarget":{"uuid":${gson.toJson(rootLoopUuid.toString())}}}"""
            // Update the in-memory object
            workflowNodeClass
                .getMethod("setCustomParameters", String::class.java)
                .invoke(savedChildNode, resolvedJson)
            stampCustomParamsVersion(workflowNodeClass, savedChildNode)
            // Persist the change to database
            try {
              val updateNodeMethod =
                  workflowNodeApi.javaClass.getMethod(
                      "update", userContextClass, iTransferableEntityClass)
              updateNodeMethod.invoke(workflowNodeApi, userContext, savedChildNode)
            } catch (e: Exception) {
              logger.warn(
                  "[AICodBiAssistant]{} Could not persist continueTarget update: {}",
                  indent,
                  e.message)
            }
            logger.info(
                "[AICodBiAssistant]{} Resolved continueTarget -> uuid={} for FC_CONTINUE, json={}",
                indent,
                rootLoopUuid,
                resolvedJson)
          }
        }
        logger.info(
            "[AICodBiAssistant]{} Created node #{} type={} name='{}' (depth={})",
            indent,
            idx,
            childSpec.nodeType,
            childNodeName,
            depth)
        // Recurse: if this child has its own _childNodes, create a SEQUENCE wrapper
        // and process them at the next depth level
        @Suppress("UNCHECKED_CAST")
        val nestedChildNodes =
            (childSpec.nodeParams["_childNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
        if (nestedChildNodes != null &&
            (childSpec.nodeType == "de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin" ||
                childSpec.nodeType == "FC_MULTIPLE_CONDITION" ||
                childSpec.nodeType == "FC_FOR_EACH_LOOP" ||
                childSpec.nodeType == "FC_WHILE_LOOP" ||
                childSpec.nodeType == "FC_DO_UNTIL_LOOP" ||
                childSpec.nodeType == "FC_WITH_FORM_ELEMENT_CONTEXT")) {
          logger.info(
              "[AICodBiAssistant]{} Nesting deeper: creating SEQUENCE for nodeType={}",
              indent,
              childSpec.nodeType)
          val nestedSeq = workflowNodeClass.getDeclaredConstructor().newInstance()
          workflowNodeClass
              .getMethod("setName", String::class.java)
              .invoke(nestedSeq, "FcSequenceHandler")
          workflowNodeClass.getMethod("setType", String::class.java).invoke(nestedSeq, "SEQUENCE")
          workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(nestedSeq, true)
          workflowNodeClass
              .getMethod("setUUIDObject", UUID::class.java)
              .invoke(nestedSeq, UUID.randomUUID())
          workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(nestedSeq, savedTask)
          workflowNodeClass
              .getMethod("setParent", workflowNodeClass)
              .invoke(nestedSeq, savedChildNode)
          trySetParentOrderIndex(workflowNodeClass, nestedSeq, 0)
          val savedNestedSeq = createNodeMethod.invoke(workflowNodeApi, userContext, nestedSeq)
          verifyChildIndex(savedNestedSeq, savedChildNode, 0, userContext)
          logger.info(
              "[AICodBiAssistant]{} Created SEQUENCE id={} (depth={})",
              indent,
              savedNestedSeq.javaClass.getMethod("getId").invoke(savedNestedSeq),
              depth)
          processBranchChildren(childSpec, savedNestedSeq, nestedChildNodes, depth + 1)
        }
      }
    }
    @Suppress("UNCHECKED_CAST")
    val topLevelChildNodes =
        (spec.nodeParams["_childNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
    if (topLevelChildNodes != null &&
        (spec.nodeType == "de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin" ||
            spec.nodeType == "FC_MULTIPLE_CONDITION" ||
            spec.nodeType == "FC_FOR_EACH_LOOP" ||
            spec.nodeType == "FC_WHILE_LOOP" ||
            spec.nodeType == "FC_DO_UNTIL_LOOP" ||
            spec.nodeType == "FC_WITH_FORM_ELEMENT_CONTEXT")) {
      logger.info(
          "[AICodBiAssistant] Creating YES-branch SEQUENCE wrapper for nodeType={}", spec.nodeType)
      val branchSequence = workflowNodeClass.getDeclaredConstructor().newInstance()
      workflowNodeClass
          .getMethod("setName", String::class.java)
          .invoke(branchSequence, "FcSequenceHandler")
      workflowNodeClass.getMethod("setType", String::class.java).invoke(branchSequence, "SEQUENCE")
      workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(branchSequence, true)
      workflowNodeClass
          .getMethod("setUUIDObject", UUID::class.java)
          .invoke(branchSequence, UUID.randomUUID())
      workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(branchSequence, savedTask)
      workflowNodeClass
          .getMethod("setParent", workflowNodeClass)
          .invoke(branchSequence, savedActionNode)
      trySetParentOrderIndex(workflowNodeClass, branchSequence, 0)
      val savedBranchSeq = createNodeMethod.invoke(workflowNodeApi, userContext, branchSequence)
      verifyChildIndex(savedBranchSeq, savedActionNode, 0, userContext)
      logger.info(
          "[AICodBiAssistant] Created YES-branch SEQUENCE wrapper id={}",
          savedBranchSeq.javaClass.getMethod("getId").invoke(savedBranchSeq))
      processBranchChildren(spec, savedBranchSeq, topLevelChildNodes, 1)
      // Add endpoint inside the YES-branch SEQUENCE only when the endpoint type is neither
      // FC_CHANGE_STATE (the default) nor FC_RETURN. For the default FC_CHANGE_STATE case,
      // the endpoint is created as a sibling of the condition node by the outer endpoint logic,
      // so it applies regardless of which branch was taken. The conditional node is a branching
      // node: its YES branch executes the child actions, but the lane continues below it.
      val effectiveEndpointType = spec.endpointType.ifBlank { "FC_CHANGE_STATE" }
      if (effectiveEndpointType != "FC_CHANGE_STATE" && effectiveEndpointType != "FC_RETURN") {
        // FC_CHANGE_STATE: Resolve state UUID and create endpoint
        val stateName = spec.endpointState.ifBlank { "Received" }
        var endpointStateUuid: Any? = null
        try {
          endpointStateUuid = resolveStateUuid(userContext, workflowVersion, stateName)
        } catch (_: Exception) {}
        val endpointNode = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass
            .getMethod("setName", String::class.java)
            .invoke(endpointNode, effectiveEndpointType)
        workflowNodeClass
            .getMethod("setType", String::class.java)
            .invoke(endpointNode, effectiveEndpointType)
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(endpointNode, true)
        workflowNodeClass
            .getMethod("setUUIDObject", UUID::class.java)
            .invoke(endpointNode, UUID.randomUUID())
        if (endpointStateUuid != null) {
          val uuidStr = endpointStateUuid.toString()
          val epJson =
              """{"targetState":{"uuid":${gson.toJson(uuidStr)},"entityClass":"de.xima.fc.entities.WorkflowState"}}"""
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(endpointNode, epJson)
          stampCustomParamsVersion(workflowNodeClass, endpointNode)
        }
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(endpointNode, savedTask)
        workflowNodeClass
            .getMethod("setParent", workflowNodeClass)
            .invoke(endpointNode, savedBranchSeq)
        val savedEp = createNodeMethod.invoke(workflowNodeApi, userContext, endpointNode)
        fixParentOrderIndex(savedEp, savedBranchSeq, userContext)
        logger.info(
            "[AICodBiAssistant] Created endpoint '{}' inside YES-branch SEQUENCE", stateName)
      }
    }

    // 9c-2. FC_SWITCH handler: creates a multi-branch switch/case structure.
    // Structure: FC_SWITCH â†’ FC_SWITCH_DEFAULT (index 0, else path) + FC_SWITCH_CASE (index 1+,
    // conditions)
    // Each branch contains a SEQUENCE child (FcSwitchCaseHandler) with the actual action nodes.
    @Suppress("UNCHECKED_CAST")
    if (spec.nodeType == "FC_SWITCH") {
      val cases = (spec.nodeParams["_cases"] as? List<Map<String, Any>>)?.ifEmpty { null }
      val defaultChildNodes =
          (spec.nodeParams["_defaultChildNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
      // Helper: create a SEQUENCE action container under a parent branch node
      val createActionSeq: (Any, List<Map<String, Any>>?) -> Unit = { parent, childNodesList ->
        val seq = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(seq, "FcSequenceHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(seq, "SEQUENCE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(seq, true)
        workflowNodeClass
            .getMethod("setUUIDObject", UUID::class.java)
            .invoke(seq, UUID.randomUUID())
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(seq, savedTask)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(seq, parent)
        val savedSeq = createNodeMethod.invoke(workflowNodeApi, userContext, seq)
        fixParentOrderIndex(savedSeq, parent, userContext)
        logger.info(
            "[AICodBiAssistant] Created SEQUENCE container under {}",
            parent.javaClass.getMethod("getType").invoke(parent))
        if (childNodesList != null) {
          for ((_, childSpecMap) in childNodesList.withIndex()) {
            val childSpec = gson.fromJson(gson.toJson(childSpecMap), WorkflowTaskSpec::class.java)
            val childNodeName = deriveNodeName(childSpec)
            val childNode = workflowNodeClass.getDeclaredConstructor().newInstance()
            workflowNodeClass
                .getMethod("setName", String::class.java)
                .invoke(childNode, childNodeName)
            workflowNodeClass
                .getMethod("setType", String::class.java)
                .invoke(childNode, childSpec.nodeType)
            workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(childNode, true)
            workflowNodeClass
                .getMethod("setUUIDObject", UUID::class.java)
                .invoke(childNode, UUID.randomUUID())
            val childParamsJson =
                buildNodeParamsJsonWithIcon(
                    childSpec, workflowVersion, userContext, childSpec.nodeType)
            if (childParamsJson != null) {
              workflowNodeClass
                  .getMethod("setCustomParameters", String::class.java)
                  .invoke(childNode, childParamsJson)
              stampCustomParamsVersion(workflowNodeClass, childNode)
            }
            workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(childNode, savedTask)
            workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(childNode, savedSeq)
            val savedChildNode = createNodeMethod.invoke(workflowNodeApi, userContext, childNode)
            fixParentOrderIndex(savedChildNode, savedSeq, userContext)
          }
        }
      }
      // Step 1: Default branch first (index 0) â€” FC_SWITCH_DEFAULT, no conditions
      // Always create a default branch when there are cases, even without _defaultChildNodes.
      if (defaultChildNodes != null || cases != null) {
        val defNode = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass
            .getMethod("setName", String::class.java)
            .invoke(defNode, "FcSwitchDefaultHandler")
        workflowNodeClass
            .getMethod("setType", String::class.java)
            .invoke(defNode, "FC_SWITCH_DEFAULT")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(defNode, true)
        workflowNodeClass
            .getMethod("setUUIDObject", UUID::class.java)
            .invoke(defNode, UUID.randomUUID())
        workflowNodeClass.getMethod("setCustomParameters", String::class.java).invoke(defNode, "{}")
        stampCustomParamsVersion(workflowNodeClass, defNode)
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(defNode, savedTask)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(defNode, savedActionNode)
        val savedDefNode = createNodeMethod.invoke(workflowNodeApi, userContext, defNode)
        fixParentOrderIndex(savedDefNode, savedActionNode, userContext)
        logger.info("[AICodBiAssistant] Created SWITCH DEFAULT branch")
        createActionSeq(savedDefNode, defaultChildNodes)
      }
      // Step 2: Case branches second (index 1+) â€” FC_SWITCH_CASE with conditions
      if (cases != null) {
        for ((caseIdx, caseSpec) in cases.withIndex()) {
          val caseValues =
              (caseSpec["caseValues"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
          val caseCombinationType = caseSpec["combinationType"] as? String ?: "OR"
          val caseCustomExpression = caseSpec["customExpression"] as? String ?: ""
          val caseDescription = caseSpec["description"] as? String ?: ""
          @Suppress("UNCHECKED_CAST")
          val caseChildNodes =
              (caseSpec["_childNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
          val caseNode = workflowNodeClass.getDeclaredConstructor().newInstance()
          workflowNodeClass
              .getMethod("setName", String::class.java)
              .invoke(caseNode, "FcSwitchCaseHandler")
          workflowNodeClass
              .getMethod("setType", String::class.java)
              .invoke(caseNode, "FC_SWITCH_CASE")
          workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(caseNode, true)
          workflowNodeClass
              .getMethod("setUUIDObject", UUID::class.java)
              .invoke(caseNode, UUID.randomUUID())
          val caseValuesJson =
              caseValues.joinToString(",", "[", "]") { v ->
                """{"caseValue":${gson.toJson(v)},"matchCondition":"EQUAL","variableName":"C${caseValues.indexOf(v) + 1}"}"""
              }
          val caseCustomExprJson =
              if (caseCombinationType == "CUSTOM" && caseCustomExpression.isNotBlank()) {
                ""","customExpression":${gson.toJson(caseCustomExpression)}"""
              } else ""
          val caseParamsJson =
              """{"caseValues":$caseValuesJson,"combinationType":${gson.toJson(caseCombinationType)},"description":${gson.toJson(caseDescription)}$caseCustomExprJson}"""
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(caseNode, caseParamsJson)
          stampCustomParamsVersion(workflowNodeClass, caseNode)
          workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(caseNode, savedTask)
          workflowNodeClass
              .getMethod("setParent", workflowNodeClass)
              .invoke(caseNode, savedActionNode)
          val savedCaseNode = createNodeMethod.invoke(workflowNodeApi, userContext, caseNode)
          fixParentOrderIndex(savedCaseNode, savedActionNode, userContext)
          logger.info("[AICodBiAssistant] Created SWITCH CASE #{} values={}", caseIdx, caseValues)
          createActionSeq(savedCaseNode, caseChildNodes)
        }
      }
      // Endpoint for switch node is handled inside each branch's SEQUENCE.
      // Do NOT return early â€” let execution continue to the trigger creation,
      // task update, and proc_order_idx fix below.
    }

    // 9c-3. FC_EXPERIMENT handler: creates try-catch-finally structure.
    // Structure: FC_EXPERIMENT (CHILD_BODY=index 0, CHILD_FINALIZER=index 1, CHILD_HANDLER=index 2)
    // Each child type is a SEQUENCE containing the respective action nodes.
    @Suppress("UNCHECKED_CAST")
    if (spec.nodeType == "FC_EXPERIMENT") {
      val bodyNodes = (spec.nodeParams["_childNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
      val handlerNodes =
          (spec.nodeParams["_handlerChildNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
      val finalizerNodes =
          (spec.nodeParams["_finalizerChildNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
      // Helper: create a SEQUENCE child at a specific parent_order_idx
      val createChildSeq: (Int, String, List<Map<String, Any>>?) -> Unit =
          { orderIdx, roleName, nodeList ->
            if (nodeList != null) {
              val seq = workflowNodeClass.getDeclaredConstructor().newInstance()
              workflowNodeClass
                  .getMethod("setName", String::class.java)
                  .invoke(seq, "FcExperiment${roleName}Handler")
              workflowNodeClass.getMethod("setType", String::class.java).invoke(seq, "SEQUENCE")
              workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(seq, true)
              workflowNodeClass
                  .getMethod("setUUIDObject", UUID::class.java)
                  .invoke(seq, UUID.randomUUID())
              workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(seq, savedTask)
              workflowNodeClass
                  .getMethod("setParent", workflowNodeClass)
                  .invoke(seq, savedActionNode)
              trySetParentOrderIndex(workflowNodeClass, seq, orderIdx)
              val savedSeq = createNodeMethod.invoke(workflowNodeApi, userContext, seq)
              verifyChildIndex(savedSeq, savedActionNode, orderIdx, userContext)
              logger.info(
                  "[AICodBiAssistant] Created FC_EXPERIMENT {} SEQUENCE at idx={}",
                  roleName,
                  orderIdx)
              // Create the action nodes inside this SEQUENCE
              for ((_, specMap) in nodeList.withIndex()) {
                val childSpec = gson.fromJson(gson.toJson(specMap), WorkflowTaskSpec::class.java)
                val childNodeName = deriveNodeName(childSpec)
                val childNode = workflowNodeClass.getDeclaredConstructor().newInstance()
                workflowNodeClass
                    .getMethod("setName", String::class.java)
                    .invoke(childNode, childNodeName)
                workflowNodeClass
                    .getMethod("setType", String::class.java)
                    .invoke(childNode, childSpec.nodeType)
                workflowNodeClass
                    .getMethod("setActive", Boolean::class.java)
                    .invoke(childNode, true)
                workflowNodeClass
                    .getMethod("setUUIDObject", UUID::class.java)
                    .invoke(childNode, UUID.randomUUID())
                val childParamsJson =
                    buildNodeParamsJsonWithIcon(
                        childSpec, workflowVersion, userContext, childSpec.nodeType)
                if (childParamsJson != null) {
                  workflowNodeClass
                      .getMethod("setCustomParameters", String::class.java)
                      .invoke(childNode, childParamsJson)
                  stampCustomParamsVersion(workflowNodeClass, childNode)
                }
                workflowNodeClass
                    .getMethod("setTask", workflowTaskClass)
                    .invoke(childNode, savedTask)
                workflowNodeClass
                    .getMethod("setParent", workflowNodeClass)
                    .invoke(childNode, savedSeq)
                val savedChildNode =
                    createNodeMethod.invoke(workflowNodeApi, userContext, childNode)
                fixParentOrderIndex(savedChildNode, savedSeq, userContext)
              }
            }
          }
      // Create children in order: BODY(0), FINALIZER(1), HANDLER(2)
      createChildSeq(0, "Body", bodyNodes)
      createChildSeq(1, "Finalizer", finalizerNodes)
      createChildSeq(2, "Handler", handlerNodes)
    }

    // Formcycle renders a workflow lane as ONE main line with EXACTLY ONE endpoint (Endpunkt) and
    // that endpoint must be the LAST node. Node types that transition the record to a terminal
    // state — FC_CHANGE_STATE, FC_RETURN, FC_DELETE_FORM_RECORD, FC_QUEUE_TASK — are rendered with
    // an endpoint marker, so placing any of them in the MIDDLE of a lane breaks the lane: Formcycle
    // treats the first such node as the endpoint and greys out / disconnects everything after it.
    // The AI frequently emits a state change (FC_CHANGE_STATE) as an ordinary chained node AND a
    // separate endpoint (endpointState/endpointType) — exactly the invalid double-endpoint seen in
    // practice. Reorder the chained nodes so the terminal node is always LAST (and only ONE
    // terminal node remains); the trailing terminal node then serves as the lane's single endpoint
    // and the endpoint-creation logic below (which already skips a trailing FC_CHANGE_STATE /
    // FC_RETURN / FC_DELETE_FORM_RECORD / FC_QUEUE_TASK) does not append a duplicate.
    // Node types that consume `_childNodes` with a STRUCTURED meaning (condition/loop branches,
    // switch cases, try-catch-finally) — their `_childNodes` are created as branch children by the
    // code above, never as sequential lane nodes.
    val mainNodeHasStructuredChildren = spec.nodeType in NODE_TYPES_WITH_STRUCTURED_CHILDREN
    // Sequential action nodes the AI sometimes places INSIDE the MAIN node's params instead of the
    // top-level "chainedNodes" — under either the "_childNodes" or the "chainedNodes" key (a common
    // model inconsistency, e.g. FC_LOG_ENTRY → FC_EMAIL). For non-branch nodes these are ordinary
    // follow-up actions and must become REAL lane nodes — otherwise they are silently dropped (only
    // branch/loop/switch/experiment nodes interpret "_childNodes" structurally).
    @Suppress("UNCHECKED_CAST")
    val embeddedChildNodes =
        if (mainNodeHasStructuredChildren) null
        else (spec.nodeParams["_childNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
    @Suppress("UNCHECKED_CAST")
    val embeddedChainedNodes =
        if (mainNodeHasStructuredChildren) null
        else (spec.nodeParams["chainedNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
    val embeddedSequentialNodes: List<Map<String, Any>>? =
        when {
          embeddedChildNodes != null && embeddedChainedNodes != null ->
              embeddedChildNodes + embeddedChainedNodes
          embeddedChildNodes != null -> embeddedChildNodes
          else -> embeddedChainedNodes
        }
    val mergedChainedNodes =
        if (embeddedSequentialNodes == null) spec.chainedNodes
        else (embeddedSequentialNodes + (spec.chainedNodes ?: emptyList())).ifEmpty { null }
    val orderedChainedNodes = reorderChainedNodesForSingleEndpoint(mergedChainedNodes)
    // Process chained nodes (sequential actions in the same task)
    if (orderedChainedNodes != null && orderedChainedNodes.isNotEmpty()) {
      var prevNodeUuid = actionNode.javaClass.getMethod("getUUIDObject").invoke(actionNode) as UUID
      var prevTaskUuid = task.javaClass.getMethod("getUUIDObject").invoke(task) as UUID
      for ((chainIdx, chainSpecMap) in orderedChainedNodes.withIndex()) {
        val chainSpec = gson.fromJson(gson.toJson(chainSpecMap), WorkflowTaskSpec::class.java)
        val chainNode = workflowNodeClass.getDeclaredConstructor().newInstance()
        val chainNodeName = deriveNodeName(chainSpec)
        workflowNodeClass.getMethod("setName", String::class.java).invoke(chainNode, chainNodeName)
        workflowNodeClass
            .getMethod("setType", String::class.java)
            .invoke(chainNode, chainSpec.nodeType)
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(chainNode, true)
        val chainNodeUuidVal = UUID.randomUUID()
        workflowNodeClass
            .getMethod("setUUIDObject", UUID::class.java)
            .invoke(chainNode, chainNodeUuidVal)
        val resolvedParams =
            chainSpec.nodeParams.mapValues { (_, v) ->
              when (v) {
                "%prev%",
                "%sourceNodeUuid%" -> prevNodeUuid.toString()
                "%sourceTaskUuid%" -> prevTaskUuid.toString()
                else -> v
              }
            } +
                mapOf(
                    "_resolvedNodeUuid" to prevNodeUuid.toString(),
                    "_resolvedTaskUuid" to prevTaskUuid.toString())
        val chainSpecWithUuids = chainSpec.copy(nodeParams = resolvedParams)
        val chainParamsJson =
            buildNodeParamsJsonWithIcon(
                chainSpecWithUuids, workflowVersion, userContext, chainSpecWithUuids.nodeType)
        if (chainParamsJson != null) {
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(chainNode, chainParamsJson)
          stampCustomParamsVersion(workflowNodeClass, chainNode)
        }
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(chainNode, savedTask)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(chainNode, savedRootNode)
        val savedChainNode = createNodeMethod.invoke(workflowNodeApi, userContext, chainNode)
        fixParentOrderIndex(savedChainNode, savedRootNode, userContext)
        // Recursively create child nodes for chained conditional/loop nodes that have
        // _childNodes (e.g. an FC_FOR_EACH_LOOP in the JSON-build pattern). Without this,
        // the chained loop node would be created EMPTY and its per-iteration children would
        // be silently dropped, so the loop would do nothing.
        @Suppress("UNCHECKED_CAST")
        val chainChildNodes =
            (chainSpec.nodeParams["_childNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
        if (chainChildNodes != null &&
            (chainSpec.nodeType == "de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin" ||
                chainSpec.nodeType == "FC_MULTIPLE_CONDITION" ||
                chainSpec.nodeType == "FC_FOR_EACH_LOOP" ||
                chainSpec.nodeType == "FC_WHILE_LOOP" ||
                chainSpec.nodeType == "FC_DO_UNTIL_LOOP" ||
                chainSpec.nodeType == "FC_WITH_FORM_ELEMENT_CONTEXT")) {
          logger.info(
              "[AICodBiAssistant] Creating SEQUENCE wrapper for chained nodeType={}",
              chainSpec.nodeType)
          val chainSeq = workflowNodeClass.getDeclaredConstructor().newInstance()
          workflowNodeClass
              .getMethod("setName", String::class.java)
              .invoke(chainSeq, "FcSequenceHandler")
          workflowNodeClass.getMethod("setType", String::class.java).invoke(chainSeq, "SEQUENCE")
          workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(chainSeq, true)
          workflowNodeClass
              .getMethod("setUUIDObject", UUID::class.java)
              .invoke(chainSeq, UUID.randomUUID())
          workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(chainSeq, savedTask)
          workflowNodeClass
              .getMethod("setParent", workflowNodeClass)
              .invoke(chainSeq, savedChainNode)
          trySetParentOrderIndex(workflowNodeClass, chainSeq, 0)
          val savedChainSeq = createNodeMethod.invoke(workflowNodeApi, userContext, chainSeq)
          verifyChildIndex(savedChainSeq, savedChainNode, 0, userContext)
          logger.info(
              "[AICodBiAssistant] Created SEQUENCE id={} for chained nodeType={}",
              savedChainSeq.javaClass.getMethod("getId").invoke(savedChainSeq),
              chainSpec.nodeType)
          processBranchChildren(chainSpec, savedChainSeq, chainChildNodes, 1)
        }
        prevNodeUuid = chainNodeUuidVal
      }
    }

    // Determine the last action node in the lane (check chained nodes, fallback to main node).
    // Uses the reordered chain so a terminal node (FC_CHANGE_STATE / FC_RETURN / ...) that was
    // moved to the end correctly suppresses the separate endpoint node below.
    val lastNodeType =
        orderedChainedNodes?.lastOrNull()?.get("nodeType") as? String ?: spec.nodeType
    // Endpoint node: every workflow lane requires a final endpoint (Endpunkt) that
    // sets the form record to its terminal status (FC_CHANGE_STATE) or simply ends
    // the process (FC_RETURN). Skip when:
    // - the last action is a state change (it already serves as the endpoint), or
    // - the record is deleted (no status to transition to after deletion), or
    // - the action is a conditional node with _childNodes that already has an endpoint
    //   inside the YES branch (for non-default endpoint types).
    val isNonDefaultEndpointInYesBranch =
        topLevelChildNodes != null &&
            spec.endpointType.ifBlank { "FC_CHANGE_STATE" } != "FC_CHANGE_STATE" &&
            spec.endpointType != "FC_RETURN"
    // "FC_RETURN" with a non-empty endpointState is a contradiction (FC_RETURN ends the process
    // WITHOUT a state transition, so the requested status would never be set). The user's intent is
    // the status change ("… beenden, MIT dem Status X"), so normalize it to FC_CHANGE_STATE — the
    // status transition then becomes the lane's endpoint.
    val effectiveEndpointType =
        if (spec.endpointType == "FC_RETURN" && spec.endpointState.isNotBlank()) "FC_CHANGE_STATE"
        else spec.endpointType.ifBlank { "FC_CHANGE_STATE" }
    if (lastNodeType != "FC_CHANGE_STATE" &&
        lastNodeType != "FC_DELETE_FORM_RECORD" &&
        lastNodeType != "FC_QUEUE_TASK" &&
        lastNodeType != "FC_RETURN" &&
        !isNonDefaultEndpointInYesBranch) {
      val endpointNode = workflowNodeClass.getDeclaredConstructor().newInstance()
      workflowNodeClass
          .getMethod("setName", String::class.java)
          .invoke(endpointNode, effectiveEndpointType)
      workflowNodeClass
          .getMethod("setType", String::class.java)
          .invoke(endpointNode, effectiveEndpointType)
      workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(endpointNode, true)
      workflowNodeClass
          .getMethod("setUUIDObject", UUID::class.java)
          .invoke(endpointNode, UUID.randomUUID())

      // FC_RETURN is a terminal node that ends the workflow process without a state transition.
      // It does NOT need a target state â€” just create the node and attach it to the task.
      if (effectiveEndpointType == "FC_RETURN") {
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(endpointNode, savedTask)
        workflowNodeClass
            .getMethod("setParent", workflowNodeClass)
            .invoke(endpointNode, savedRootNode)
        val savedEndpointNode = createNodeMethod.invoke(workflowNodeApi, userContext, endpointNode)
        fixParentOrderIndex(savedEndpointNode, savedRootNode, userContext)
        logger.info(
            "[AICodBiAssistant] Created FC_RETURN endpoint node (process ends without state change)")
      } else {
        // FC_CHANGE_STATE: Resolve the state UUID and create the endpoint with target state
        val stateName = spec.endpointState.ifBlank { "Received" }
        var endpointStateUuid = resolveStateUuid(userContext, workflowVersion, stateName)

        // Apply optional state properties to the resolved or newly created state
        if (spec.stateProperties.isNotEmpty()) {
          try {
            val workflowStateClass = Class.forName("de.xima.fc.entities.WorkflowState")
            val stateApi = apiProviderClass.getField("WORKFLOW_STATE_API").get(null)

            val stateObject: Any
            if (endpointStateUuid == null) {
              // State doesn't exist â€” create a new one
              val newState = workflowStateClass.getDeclaredConstructor().newInstance()
              workflowStateClass
                  .getMethod("setName", String::class.java)
                  .invoke(newState, stateName)
              workflowStateClass
                  .getMethod("setUUIDObject", UUID::class.java)
                  .invoke(newState, UUID.randomUUID())
              workflowStateClass
                  .getMethod("setVersion", Class.forName("de.xima.fc.entities.WorkflowVersion"))
                  .invoke(newState, workflowVersion)

              // Set orderIndex
              val existingStates = loadWorkflowStates(userContext, workflowVersion)
              var maxOrder = -1
              for (st in existingStates) {
                try {
                  val idx = st.javaClass.getMethod("getOrderIndex").invoke(st) as? Int
                  if (idx != null && idx > maxOrder) maxOrder = idx
                } catch (_: Exception) {}
              }
              workflowStateClass
                  .getMethod("setOrderIndex", Int::class.java)
                  .invoke(newState, maxOrder + 1)
              stateObject = newState
            } else {
              // State already exists â€” find it by UUID via the state list, then fetch by ID
              val allStates = loadWorkflowStates(userContext, workflowVersion)
              val matchedState =
                  allStates.firstOrNull { st ->
                    try {
                      st.javaClass.getMethod("getUUIDObject").invoke(st) == endpointStateUuid
                    } catch (_: Exception) {
                      false
                    }
                  }
              val stateId =
                  matchedState?.javaClass?.getMethod("getId")?.invoke(matchedState) as? Long
              stateObject =
                  if (stateId != null) {
                    stateApi.javaClass
                        .getMethod("getById", userContextClass, java.lang.Long::class.java)
                        .invoke(stateApi, userContext, stateId)
                  } else throw Exception("Could not find existing state by UUID")
            }

            // Apply state properties
            for ((propName, propValue) in spec.stateProperties) {
              val setterName = "set${propName.replaceFirstChar { it.uppercase() }}"
              try {
                val setter =
                    workflowStateClass.methods.firstOrNull { m ->
                      m.name.equals(setterName, ignoreCase = true) && m.parameterCount == 1
                    }
                if (setter != null) {
                  val arg =
                      when (setter.parameterTypes[0]) {
                        Boolean::class.java,
                        java.lang.Boolean::class.java ->
                            when (propValue) {
                              is Boolean -> propValue
                              is String -> propValue.toBoolean()
                              else -> propValue.toString().toBoolean()
                            }
                        Int::class.java,
                        Integer::class.java ->
                            when (propValue) {
                              is Number -> propValue.toInt()
                              else -> propValue.toString().toIntOrNull() ?: 0
                            }
                        String::class.java -> propValue.toString()
                        else -> propValue
                      }
                  setter.invoke(stateObject, arg)
                  logger.info("[AICodBiAssistant] Set state property '{}' = {}", setterName, arg)
                }
              } catch (e: Exception) {
                logger.warn(
                    "[AICodBiAssistant] Failed to set state property '{}': {}",
                    setterName,
                    e.message)
              }
            }

            // Handle allowAuthenticatedUser â€” requires creating a
            // WorkflowStateAuthenticatorConfig
            // with EAuthClientType.FORM (FormCycle's internal user authentication).
            // This is NOT a simple boolean on the entity; it requires an authenticator config
            // entry.
            if (spec.stateProperties["allowAuthenticatedUser"] == true) {
              try {
                val authConfigClass =
                    Class.forName("de.xima.fc.entities.WorkflowStateAuthenticatorConfig")
                val eAuthClientTypeClass = Class.forName("de.xima.fc.mdl.enums.EAuthClientType")
                val formType = eAuthClientTypeClass.getField("FORM").get(null)

                val authConfig = authConfigClass.getDeclaredConstructor().newInstance()
                authConfigClass
                    .getMethod("setWorkflowState", workflowStateClass)
                    .invoke(authConfig, stateObject)
                authConfigClass
                    .getMethod("setAuthenticatorType", eAuthClientTypeClass)
                    .invoke(authConfig, formType)

                // For a newly created state (plain POJO), addAuthenticatorConfig works directly.
                // For an existing state (Hibernate proxy), the lazy authenticatorConfigs
                // collection cannot be accessed outside a session. Use GenericAPI.create() to
                // persist the config as a standalone entity instead.
                if (endpointStateUuid == null) {
                  // New state â€” add via entity method
                  workflowStateClass
                      .getMethod("addAuthenticatorConfig", authConfigClass)
                      .invoke(stateObject, authConfig)
                } else {
                  // Existing state (Hibernate proxy) â€” persist config directly via GenericAPI
                  val genericApi = apiProviderClass.getField("GENERIC").get(null)
                  genericApi.javaClass
                      .getMethod(
                          "create",
                          Class::class.java,
                          userContextClass,
                          Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity"))
                      .invoke(genericApi, authConfigClass, userContext, authConfig)
                }

                logger.info(
                    "[AICodBiAssistant] Created FORM authenticator config for allowAuthenticatedUser")
              } catch (e: Exception) {
                val causeMsg =
                    if (e is java.lang.reflect.InvocationTargetException && e.cause != null) {
                      "${e.cause!!::class.simpleName}: ${e.cause!!.message}"
                    } else {
                      "${e::class.simpleName}: ${e.message}"
                    }
                logger.warn(
                    "[AICodBiAssistant] Failed to create authenticator config for allowAuthenticatedUser: {}",
                    causeMsg)
              }
            }

            if (endpointStateUuid == null) {
              // Save the newly created state
              val savedState =
                  stateApi.javaClass
                      .getMethod("create", userContextClass, iTransferableEntityClass)
                      .invoke(stateApi, userContext, stateObject)
              endpointStateUuid =
                  savedState.javaClass.getMethod("getUUIDObject").invoke(savedState) as? UUID
              logger.info(
                  "[AICodBiAssistant] Created new workflow state '{}' with UUID {}",
                  stateName,
                  endpointStateUuid)
            } else {
              // Update the existing state
              stateApi.javaClass
                  .getMethod("update", userContextClass, iTransferableEntityClass)
                  .invoke(stateApi, userContext, stateObject)
              logger.info(
                  "[AICodBiAssistant] Updated existing workflow state '{}' properties", stateName)
            }
          } catch (e: Exception) {
            logger.warn(
                "[AICodBiAssistant] Failed to update/create workflow state '{}': {}",
                stateName,
                e.message)
            if (endpointStateUuid == null)
                endpointStateUuid = resolveFirstStateUuid(userContext, workflowVersion)
          }
        } else if (endpointStateUuid == null) {
          // No properties to set, but state doesn't exist â€” create minimal state
          try {
            val workflowStateClass = Class.forName("de.xima.fc.entities.WorkflowState")
            val stateApi = apiProviderClass.getField("WORKFLOW_STATE_API").get(null)
            val newState = workflowStateClass.getDeclaredConstructor().newInstance()
            workflowStateClass.getMethod("setName", String::class.java).invoke(newState, stateName)
            workflowStateClass
                .getMethod("setUUIDObject", UUID::class.java)
                .invoke(newState, UUID.randomUUID())
            workflowStateClass
                .getMethod("setVersion", Class.forName("de.xima.fc.entities.WorkflowVersion"))
                .invoke(newState, workflowVersion)
            val existingStates = loadWorkflowStates(userContext, workflowVersion)
            var maxOrder = -1
            for (st in existingStates) {
              try {
                val idx = st.javaClass.getMethod("getOrderIndex").invoke(st) as? Int
                if (idx != null && idx > maxOrder) maxOrder = idx
              } catch (_: Exception) {}
            }
            workflowStateClass
                .getMethod("setOrderIndex", Int::class.java)
                .invoke(newState, maxOrder + 1)
            val savedState =
                stateApi.javaClass
                    .getMethod("create", userContextClass, iTransferableEntityClass)
                    .invoke(stateApi, userContext, newState)
            endpointStateUuid =
                savedState.javaClass.getMethod("getUUIDObject").invoke(savedState) as? UUID
            logger.info(
                "[AICodBiAssistant] Created new workflow state '{}' with UUID {}",
                stateName,
                endpointStateUuid)
          } catch (e: Exception) {
            logger.warn(
                "[AICodBiAssistant] Failed to create workflow state '{}': {}", stateName, e.message)
            endpointStateUuid = resolveFirstStateUuid(userContext, workflowVersion)
          }
        }
        logger.debug(
            "[AICodBiAssistant] Endpoint state: requested='{}', resolvedUuid={}",
            stateName,
            endpointStateUuid?.toString() ?: "null")

        if (endpointStateUuid != null) {
          val endpointParamsJson =
              """{"targetState":{"uuid":${gson.toJson(endpointStateUuid.toString())},"entityClass":"de.xima.fc.entities.WorkflowState"}}"""
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(endpointNode, endpointParamsJson)
          stampCustomParamsVersion(workflowNodeClass, endpointNode)
          workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(endpointNode, savedTask)
          workflowNodeClass
              .getMethod("setParent", workflowNodeClass)
              .invoke(endpointNode, savedRootNode)
          val savedEndpointNode =
              createNodeMethod.invoke(workflowNodeApi, userContext, endpointNode)
          fixParentOrderIndex(savedEndpointNode, savedRootNode, userContext)
        } else {
          logger.warn("[AICodBiAssistant] Skipping endpoint node: no workflow states found")
        }
      }
    }

    workflowTriggerClass.getMethod("setTask", workflowTaskClass).invoke(trigger, savedTask)
    val savedTrigger = createTriggerMethod.invoke(workflowTriggerApi, userContext, trigger)

    workflowTaskClass.getMethod("setTrigger", workflowTriggerClass).invoke(savedTask, savedTrigger)
    workflowTaskClass.getMethod("setRootNode", workflowNodeClass).invoke(savedTask, savedRootNode)
    updateMethod.invoke(workflowTaskApi, userContext, savedTask)

    fixProcOrderIndex(savedTask, mainProcess, userContext)

    logger.info(
        "[AICodBiAssistant] Created workflow task '{}' (trigger={}, node={}) for workflowVersion {}",
        spec.taskName,
        spec.triggerType,
        spec.nodeType,
        workflowVersionId)

    return "Workflow task '${spec.taskName}' created: ${spec.triggerType} â†’ ${spec.nodeType}"
  }

  /**
   * Node types that Formcycle renders with an endpoint marker on the lane's main line. Formcycle
   * allows EXACTLY ONE such endpoint per lane and it must be the LAST node; a mid-line endpoint
   * greys out and disconnects every node after it.
   */
  private val TERMINAL_WORKFLOW_NODE_TYPES =
      setOf("FC_CHANGE_STATE", "FC_RETURN", "FC_DELETE_FORM_RECORD", "FC_QUEUE_TASK")

  /**
   * Node types whose `_childNodes` have a STRUCTURED meaning (condition/loop branches, switch
   * cases, try-catch-finally) and are therefore created as real branch children — NOT as sequential
   * lane nodes. For every other node type, `_childNodes` is treated as an ordinary list of
   * follow-up actions (see [createWorkflowTask]).
   */
  private val NODE_TYPES_WITH_STRUCTURED_CHILDREN =
      setOf(
          "de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin",
          "FC_MULTIPLE_CONDITION",
          "FC_FOR_EACH_LOOP",
          "FC_WHILE_LOOP",
          "FC_DO_UNTIL_LOOP",
          "FC_WITH_FORM_ELEMENT_CONTEXT",
          "FC_SWITCH",
          "FC_EXPERIMENT")

  /**
   * Normalizes the AI's chained node order so a lane contains exactly ONE terminal endpoint node
   * and it is the LAST node. See [createWorkflowTask] for why this is required. Non-terminal nodes
   * keep their relative order and come first; among the terminal nodes only the last one is kept
   * (the final status transition wins, so multiple stacked endpoint markers are collapsed into a
   * single one). Returns the reordered list, or the original input when no reordering is needed.
   */
  private fun reorderChainedNodesForSingleEndpoint(
      chainedNodes: List<Map<String, Any>>?
  ): List<Map<String, Any>>? {
    if (chainedNodes == null || chainedNodes.isEmpty()) return chainedNodes
    val terminal = mutableListOf<Map<String, Any>>()
    val regular = mutableListOf<Map<String, Any>>()
    for (node in chainedNodes) {
      val type = (node["nodeType"] as? String)?.uppercase() ?: ""
      if (type in TERMINAL_WORKFLOW_NODE_TYPES) terminal.add(node) else regular.add(node)
    }
    if (terminal.isEmpty()) return chainedNodes
    // Keep only the LAST terminal node: it becomes the lane's single endpoint. Earlier terminal
    // nodes would stack a second endpoint marker onto the lane and break it the same way a
    // mid-line endpoint does.
    val singleTerminal = listOf(terminal.last())
    val reordered = regular + singleTerminal
    if (reordered != chainedNodes) {
      val droppedTypes =
          terminal.dropLast(1).joinToString(", ") { n -> (n["nodeType"] as? String) ?: "?" }
      logger.info(
          "[AICodBiAssistant] Reordered chained nodes for a single endpoint: {} terminal node(s) moved to the end{} (lane must end with exactly one endpoint)",
          terminal.size,
          if (droppedTypes.isBlank()) ""
          else "; dropped redundant earlier terminal node(s): $droppedTypes")
    }
    return reordered
  }

  /**
   * Returns the name of the submit button that must exist for the workflow(s) the AI just created
   * to be reachable, or `null` when no lane is triggered by the form's submit button. Uses the
   * trigger's explicit `buttonName` when the AI specified one (so that exact button is ensured),
   * otherwise `""` which means "ensure ANY submit button exists" (an FC_FORM_SUBMIT_BUTTON trigger
   * with an empty buttonName fires on any submit button).
   */
  private fun workflowSubmitButtonName(workflowNodes: JsonArray?): String? {
    if (workflowNodes == null) return null
    var hasSubmitTrigger = false
    var explicitName: String? = null
    for (el in workflowNodes) {
      if (!el.isJsonObject) continue
      val trigger = el.asJsonObject.getAsJsonObject("trigger") ?: continue
      if (trigger.get("type")?.asString != "FC_FORM_SUBMIT_BUTTON") continue
      hasSubmitTrigger = true
      val params = trigger.get("params")?.takeIf { it.isJsonObject }?.asJsonObject
      val name = params?.get("buttonName")?.takeIf { it.isJsonPrimitive }?.asString
      if (!name.isNullOrBlank() && explicitName == null) explicitName = name
    }
    return if (hasSubmitTrigger) (explicitName ?: "") else null
  }

  /**
   * Ensures the given Formcycle persist JSON contains a submit button that satisfies
   * [requestedName]: when non-blank, a submit button with EXACTLY that technical name must exist;
   * when blank, any submit button is sufficient. A submit button is an XButtonList entry whose
   * `action.page` equals `"submit"`.
   * - When the requirement is already met, returns `null` (no change).
   * - When a same-named button exists but is not a submit button, it is upgraded in place
   *   (`action.page="submit"`), so a named trigger becomes reachable without a duplicate name.
   * - Otherwise the submit button is appended to an existing XButtonList, or — when the form has no
   *   XButtonList at all — a new XButtonList holding the submit button is created on the last page.
   *
   * Returns the modified form JSON, or `null` when nothing changed / the JSON could not be parsed.
   */
  private fun ensureSubmitButtonInForm(formJson: String, requestedName: String): String? {
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return null
      var firstListProps: JsonObject? = null

      // Pass 1: already submittable? Remember the first XButtonList; upgrade a same-named
      // non-submit button in place; repair an existing submit button that is present in the flat
      // "items" array but NOT referenced by its container's "properties.elements" array (such an
      // orphaned button is published but never rendered by Formcycle).
      for (el in items) {
        if (!el.isJsonObject) continue
        if (el.asJsonObject.get("className")?.asString != "XButtonList") continue
        val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
        if (firstListProps == null) firstListProps = props
        val buttons = props.getAsJsonArray("buttons") ?: continue
        for (btn in buttons) {
          if (!btn.isJsonObject) continue
          val btnObj = btn.asJsonObject
          val action = btnObj.getAsJsonObject("action")
          val page = action?.get("page")?.takeIf { it.isJsonPrimitive }?.asString
          val name = btnObj.get("name")?.takeIf { it.isJsonPrimitive }?.asString
          val isSubmit = page.equals("submit", ignoreCase = true)
          if (isSubmit && (requestedName.isBlank() || name == requestedName)) {
            val parentId = props.get("parentid")?.takeIf { it.isJsonPrimitive }?.asString
            val repaired =
                referenceButtonInContainer(
                    items, parentId, name ?: requestedName.ifBlank { "btnSenden" })
            if (repaired) {
              logger.info(
                  "[AICodBiAssistant] Repaired orphaned submit button '{}' — added it to its container's properties.elements",
                  name ?: requestedName)
              return gson.toJson(root)
            }
            return null
          }
          // A same-named button exists but is NOT a submit button -> upgrade it in place.
          if (requestedName.isNotBlank() && name == requestedName && !isSubmit && action != null) {
            action.addProperty("page", "submit")
            if ((action.get("value")?.takeIf { it.isJsonPrimitive }?.asString ?: "").isBlank()) {
              action.addProperty("value", "Senden")
            }
            if ((btnObj.get("value")?.takeIf { it.isJsonPrimitive }?.asString ?: "").isBlank()) {
              btnObj.addProperty("value", "Senden")
            }
            logger.info(
                "[AICodBiAssistant] Upgraded existing button '{}' to submit (action.page='submit')",
                requestedName)
            return gson.toJson(root)
          }
        }
      }

      // Pass 2: no matching submit button — build one and add it.
      val buttonName = requestedName.ifBlank { "btnSenden" }
      val btn = JsonObject()
      btn.addProperty("name", buttonName)
      btn.addProperty("title", "")
      btn.addProperty("value", "Senden")
      val action = JsonObject()
      action.addProperty("customAction", "")
      action.addProperty("customClassNames", "")
      action.addProperty("displayName", "Senden")
      action.addProperty("optionId", "")
      action.addProperty("check", false)
      action.addProperty("page", "submit")
      action.addProperty("value", "Senden")
      btn.add("action", action)

      val targetProps = firstListProps
      if (targetProps != null) {
        // Append to an existing XButtonList (keeps the correct parentid / page structure).
        val buttons =
            targetProps.getAsJsonArray("buttons")
                ?: JsonArray().also { targetProps.add("buttons", it) }
        if (buttons.none {
          it.isJsonObject && it.asJsonObject.get("name")?.asString == buttonName
        }) {
          buttons.add(btn)
        }
        logger.info(
            "[AICodBiAssistant] Added submit button '{}' to existing XButtonList '{}'",
            buttonName,
            targetProps.get("name")?.asString ?: "<unnamed>")
      } else {
        // No XButtonList at all -> create a new one on the last page of the form.
        val pageId = findLastPageId(items)
        val props = JsonObject()
        props.addProperty("name", buttonName)
        props.addProperty("id", uniqueFormItemId(items, "xi-${buttonName.lowercase()}"))
        props.addProperty("title", "")
        props.addProperty("label", "")
        if (pageId != null) props.addProperty("parentid", pageId)
        val buttons = JsonArray()
        buttons.add(btn)
        props.add("buttons", buttons)
        val newItem = JsonObject()
        newItem.addProperty("className", "XButtonList")
        newItem.add("properties", props)
        items.add(newItem)
        // Formcycle renders a child element only when its container lists it in the container's
        // "properties.elements" array (parentid alone is NOT enough). Add the new button's name to
        // the target page's "elements" array so it actually appears on that page.
        if (pageId != null) {
          for (el in items) {
            if (!el.isJsonObject) continue
            if (el.asJsonObject.get("className")?.asString != "XPage") continue
            val pageProps = el.asJsonObject.getAsJsonObject("properties") ?: continue
            val id = pageProps.get("id")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
            if (id != pageId) continue
            val pageElements =
                pageProps.getAsJsonArray("elements")
                    ?: JsonArray().also { pageProps.add("elements", it) }
            if (pageElements.none { it.isJsonPrimitive && it.asString == buttonName }) {
              pageElements.add(buttonName)
            }
            break
          }
        }
        logger.info(
            "[AICodBiAssistant] Created new XButtonList '{}' with submit button (parentid={}, page elements={})",
            buttonName,
            pageId ?: "<none>",
            if (pageId != null) "referenced" else "no page found")
      }
      gson.toJson(root)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] ensureSubmitButtonInForm failed: {}", e.message)
      null
    }
  }

  /** Returns the `id` of the last XPage in the form (the natural place for the submit button). */
  private fun findLastPageId(items: JsonArray): String? {
    var lastPageId: String? = null
    for (el in items) {
      if (!el.isJsonObject) continue
      if (el.asJsonObject.get("className")?.asString != "XPage") continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val id = props.get("id")?.takeIf { it.isJsonPrimitive }?.asString
      if (!id.isNullOrBlank()) lastPageId = id
    }
    return lastPageId
  }

  /**
   * Ensures the container whose `id` equals [parentId] lists [buttonName] in its
   * `properties.elements` array. Formcycle renders a child element ONLY when its container
   * references it there — a button that exists in the flat `items` array but is missing from its
   * page's `elements` array is published but never rendered (orphaned). Returns `true` when the
   * reference was missing and has been added (the form must be re-serialized), `false` when it was
   * already present, the parent could not be found, or [parentId] is blank.
   */
  private fun referenceButtonInContainer(
      items: JsonArray,
      parentId: String?,
      buttonName: String
  ): Boolean {
    if (parentId.isNullOrBlank() || buttonName.isBlank()) return false
    for (el in items) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val id = props.get("id")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      if (id != parentId) continue
      val elements =
          props.getAsJsonArray("elements") ?: JsonArray().also { props.add("elements", it) }
      if (elements.none { it.isJsonPrimitive && it.asString == buttonName }) {
        elements.add(buttonName)
        logger.info(
            "[AICodBiAssistant] Referenced submit button '{}' from container '{}' (properties.elements)",
            buttonName,
            parentId)
        return true
      }
      return false
    }
    return false
  }

  /**
   * Auto-repairs orphaned form elements. Formcycle renders a child element ONLY when its container
   * lists it in the container's `properties.elements` array. An element that exists in the flat
   * `items` array with a `parentid` but is missing from that array is published but never rendered
   * — completely useless. This scans every container (XPage, XFieldSet, XContainer,
   * XContainerInvisible, XHeader, XFooter), then re-adds the `name` of every child item that
   * references one of them as its parent but is not listed. Returns the re-serialized form when at
   * least one orphan was repaired, otherwise `null`.
   */
  private fun repairOrphanedFormElements(formJson: String): String? {
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return null
      val containerClasses =
          setOf("XPage", "XFieldSet", "XContainer", "XContainerInvisible", "XHeader", "XFooter")
      // Container id -> (its properties, className), so children can be re-referenced in one pass.
      val containerById = mutableMapOf<String, Pair<JsonObject, String>>()
      for (el in items) {
        if (!el.isJsonObject) continue
        val obj = el.asJsonObject
        val cls = obj.get("className")?.asString ?: continue
        if (cls !in containerClasses) continue
        val props = obj.getAsJsonObject("properties") ?: continue
        val id = props.get("id")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
        containerById[id] = props to cls
      }
      var changed = false
      for (el in items) {
        if (!el.isJsonObject) continue
        val obj = el.asJsonObject
        val cls = obj.get("className")?.asString ?: continue
        if (cls in containerClasses) continue
        val props = obj.getAsJsonObject("properties") ?: continue
        val name = props.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
        val parentId = props.get("parentid")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
        val (parentProps, _) = containerById[parentId] ?: continue
        val elements =
            parentProps.getAsJsonArray("elements")
                ?: JsonArray().also { parentProps.add("elements", it) }
        if (elements.none { it.isJsonPrimitive && it.asString == name }) {
          elements.add(name)
          changed = true
          logger.info(
              "[AICodBiAssistant] Repaired orphaned element '{}' (className={}) — added it to container '{}' properties.elements",
              name,
              cls,
              parentId)
        }
      }
      if (changed) gson.toJson(root) else null
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] repairOrphanedFormElements failed: {}", e.message)
      null
    }
  }

  /**
   * Last-resort email body used when the AI left the FC_EMAIL body (and message) empty. Picks a
   * short confirmation text in the subject's language (the AI should normally derive a proper body
   * itself; this only guarantees the email node is never blank).
   */
  private fun defaultEmailBody(subject: String): String {
    val german =
        subject.contains('ä') ||
            subject.contains('ö') ||
            subject.contains('ü') ||
            subject.contains('ß') ||
            Regex("(?i)(eingang|bestätig|bestätigung|empfangen|antwort|vielen|dank|ihr)")
                .containsMatchIn(subject)
    val text =
        if (german) "Ihr Formular wurde erfolgreich übermittelt."
        else "Your form has been submitted successfully."
    logger.info(
        "[AICodBiAssistant] FC_EMAIL body was empty — derived default body ('{}', subject='{}')",
        text,
        subject)
    return "<p>$text</p>"
  }

  /**
   * Binds every `FC_FORM_SUBMIT_BUTTON` trigger of [workflowVersionId] that currently has an EMPTY
   * `buttonName` to [buttonName]. When the AI leaves `triggerParams:{}` (fires on any submit
   * button) but the backend then ensures a concrete submit button (`btnSenden`), the trigger is
   * explicitly "selected" to that button so the designer shows it bound. Triggers that already name
   * a specific button are left untouched. Best-effort (reflection-based); failures are only logged.
   */
  private fun bindSubmitTriggerToButton(
      userContext: Any,
      workflowVersionId: Long,
      buttonName: String
  ) {
    if (buttonName.isBlank()) return
    try {
      val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      try {
        val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
        val jpql =
            "SELECT t FROM de.xima.fc.entities.WorkflowTrigger t " +
                "JOIN t.task wta JOIN wta.process wp JOIN wp.version wv " +
                "WHERE wv.id = :versionId"
        val query = em.javaClass.getMethod("createQuery", String::class.java).invoke(em, jpql)
        query.javaClass
            .getMethod("setParameter", String::class.java, Any::class.java)
            .invoke(query, "versionId", workflowVersionId)
        @Suppress("UNCHECKED_CAST")
        val resultList =
            query.javaClass.getMethod("getResultList").invoke(query) as? List<*> ?: emptyList<Any>()
        val workflowTriggerClass = Class.forName("de.xima.fc.entities.WorkflowTrigger")
        val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
        val workflowTriggerApi = apiProviderClass.getField("WORKFLOW_TRIGGER_API").get(null)
        val updateMethod =
            workflowTriggerApi.javaClass.getMethod(
                "update",
                ucClass,
                Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity"))
        var updated = 0
        for (entity in resultList) {
          if (entity == null) continue
          val type =
              runCatching { entity.javaClass.getMethod("getType").invoke(entity) as? String }
                  .getOrNull()
          if (type != "FC_FORM_SUBMIT_BUTTON") continue
          val paramsStr =
              runCatching {
                    entity.javaClass.getMethod("getCustomParameters").invoke(entity) as? String
                  }
                  .getOrElse {
                    runCatching {
                          entity.javaClass.getMethod("getCustomParams").invoke(entity) as? String
                        }
                        .getOrNull()
                  } ?: "{}"
          val params =
              runCatching { JsonParser.parseString(paramsStr).asJsonObject }.getOrNull()
                  ?: JsonObject()
          val current = params.get("buttonName")?.takeIf { it.isJsonPrimitive }?.asString
          if (!current.isNullOrBlank()) continue // already bound to a specific button
          params.addProperty("buttonName", buttonName)
          val newJson = params.toString()
          workflowTriggerClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(entity, newJson)
          stampCustomParamsVersion(workflowTriggerClass, entity)
          updateMethod.invoke(workflowTriggerApi, userContext, entity)
          updated++
          logger.info(
              "[AICodBiAssistant] Bound FC_FORM_SUBMIT_BUTTON trigger (type={}) to submit button '{}'",
              type,
              buttonName)
        }
        logger.info(
            "[AICodBiAssistant] bindSubmitTriggerToButton: updated {} trigger(s) to button '{}'",
            updated,
            buttonName)
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] bindSubmitTriggerToButton failed: {}", e.message)
    }
  }

  /**
   * Returns [baseId] when no existing item uses it, otherwise a numeric-suffixed unique variant.
   */
  private fun uniqueFormItemId(items: JsonArray, baseId: String): String {
    val used = mutableSetOf<String>()
    for (el in items) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val id = props.get("id")?.takeIf { it.isJsonPrimitive }?.asString
      if (!id.isNullOrBlank()) used.add(id)
    }
    if (baseId !in used) return baseId
    var i = 2
    while ("$baseId-$i" in used) i++
    return "$baseId-$i"
  }

  private fun fixProcOrderIndex(savedTask: Any, mainProcess: Any, userContext: Any) {
    val taskId =
        savedTask.javaClass.getMethod("getId").invoke(savedTask) as? Long
            ?: run {
              logger.warn("[AICodBiAssistant] fixProcOrderIndex: task has no ID yet")
              return
            }
    val processId =
        mainProcess.javaClass.getMethod("getId").invoke(mainProcess) as? Long
            ?: run {
              logger.warn("[AICodBiAssistant] fixProcOrderIndex: mainProcess has no ID")
              return
            }

    val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val entityContext =
        entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)

    val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
    val tx = em.javaClass.getMethod("getTransaction").invoke(em)
    tx.javaClass.getMethod("begin").invoke(tx)
    try {
      // Step 1: Fix all existing tasks with NULL proc_order_idx for this process
      val nullTasksSql =
          "SELECT id FROM workflow_task WHERE process_id = $processId AND proc_order_idx IS NULL ORDER BY id"
      val nullTasksQ =
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, nullTasksSql)
      @Suppress("UNCHECKED_CAST")
      val nullIds =
          (nullTasksQ.javaClass.getMethod("getResultList").invoke(nullTasksQ) as List<*>)
              .mapNotNull { (it as? Number)?.toLong() }

      if (nullIds.isNotEmpty()) {
        val maxSql =
            "SELECT COALESCE(MAX(proc_order_idx), -1) FROM workflow_task WHERE process_id = $processId AND proc_order_idx IS NOT NULL"
        val maxQ =
            em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, maxSql)
        var repairIdx =
            ((maxQ.javaClass.getMethod("getSingleResult").invoke(maxQ) as? Number)?.toInt() ?: -1) +
                1
        for (nullId in nullIds) {
          val fixSql = "UPDATE workflow_task SET proc_order_idx = $repairIdx WHERE id = $nullId"
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, fixSql).let {
            it.javaClass.getMethod("executeUpdate").invoke(it)
          }
          logger.info(
              "[AICodBiAssistant] Repaired NULL proc_order_idx = {} for task id={}",
              repairIdx,
              nullId)
          repairIdx++
        }
      }

      // Step 2: Assign proc_order_idx to the newly created task (if not already set above)
      val checkSql = "SELECT proc_order_idx FROM workflow_task WHERE id = $taskId"
      val checkQ =
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, checkSql)
      val alreadySet =
          (checkQ.javaClass.getMethod("getSingleResult").invoke(checkQ) as? Number) != null
      if (!alreadySet) {
        val selectSql =
            "SELECT COALESCE(MAX(proc_order_idx), -1) + 1 FROM workflow_task WHERE process_id = $processId"
        val selectQ =
            em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, selectSql)
        val nextIdx =
            (selectQ.javaClass.getMethod("getSingleResult").invoke(selectQ) as? Number)?.toInt()
                ?: 0
        val updateSql = "UPDATE workflow_task SET proc_order_idx = $nextIdx WHERE id = $taskId"
        em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, updateSql).let {
          it.javaClass.getMethod("executeUpdate").invoke(it)
        }
        logger.info("[AICodBiAssistant] Set proc_order_idx = {} for task id={}", nextIdx, taskId)
      }

      tx.javaClass.getMethod("commit").invoke(tx)
      logger.info("[AICodBiAssistant] proc_order_idx fix complete for process id={}", processId)
    } catch (e: Exception) {
      runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
      logger.warn("[AICodBiAssistant] Failed to fix proc_order_idx for task $taskId", e)
    } finally {
      runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
    }
  }

  private fun fixParentOrderIndex(actionNode: Any, parentNode: Any, userContext: Any) {
    val nodeId =
        actionNode.javaClass.getMethod("getId").invoke(actionNode) as? Long
            ?: run {
              logger.warn("[AICodBiAssistant] fixParentOrderIndex: action node has no ID yet")
              return
            }
    val parentId =
        parentNode.javaClass.getMethod("getId").invoke(parentNode) as? Long
            ?: run {
              logger.warn("[AICodBiAssistant] fixParentOrderIndex: parent node has no ID")
              return
            }

    val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val entityContext =
        entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)

    val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
    val tx = em.javaClass.getMethod("getTransaction").invoke(em)
    tx.javaClass.getMethod("begin").invoke(tx)
    try {
      // Step 1: Fix all existing nodes with NULL parent_order_idx under this parent
      val nullNodesSql =
          "SELECT id FROM workflow_node WHERE parent_id = $parentId AND parent_order_idx IS NULL ORDER BY id"
      val nullNodesQ =
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, nullNodesSql)
      @Suppress("UNCHECKED_CAST")
      val nullIds =
          (nullNodesQ.javaClass.getMethod("getResultList").invoke(nullNodesQ) as List<*>)
              .mapNotNull { (it as? Number)?.toLong() }

      if (nullIds.isNotEmpty()) {
        val maxSql =
            "SELECT COALESCE(MAX(parent_order_idx), -1) FROM workflow_node WHERE parent_id = $parentId AND parent_order_idx IS NOT NULL"
        val maxQ =
            em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, maxSql)
        var repairIdx =
            ((maxQ.javaClass.getMethod("getSingleResult").invoke(maxQ) as? Number)?.toInt() ?: -1) +
                1
        for (nullId in nullIds) {
          val fixSql = "UPDATE workflow_node SET parent_order_idx = $repairIdx WHERE id = $nullId"
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, fixSql).let {
            it.javaClass.getMethod("executeUpdate").invoke(it)
          }
          logger.info(
              "[AICodBiAssistant] Repaired NULL parent_order_idx = {} for node id={}",
              repairIdx,
              nullId)
          repairIdx++
        }
      }

      // Step 2: Assign parent_order_idx to the newly created node (if not already set above)
      val checkSql = "SELECT parent_order_idx FROM workflow_node WHERE id = $nodeId"
      val checkQ =
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, checkSql)
      val alreadySet =
          (checkQ.javaClass.getMethod("getSingleResult").invoke(checkQ) as? Number) != null
      if (!alreadySet) {
        val selectSql =
            "SELECT COALESCE(MAX(parent_order_idx), -1) + 1 FROM workflow_node WHERE parent_id = $parentId"
        val selectQ =
            em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, selectSql)
        val nextIdx =
            (selectQ.javaClass.getMethod("getSingleResult").invoke(selectQ) as? Number)?.toInt()
                ?: 0
        val updateSql = "UPDATE workflow_node SET parent_order_idx = $nextIdx WHERE id = $nodeId"
        em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, updateSql).let {
          it.javaClass.getMethod("executeUpdate").invoke(it)
        }
        logger.info(
            "[AICodBiAssistant] Set parent_order_idx = {} for action node id={}", nextIdx, nodeId)
      }

      tx.javaClass.getMethod("commit").invoke(tx)
      logger.info(
          "[AICodBiAssistant] parent_order_idx fix complete for parent node id={}", parentId)
    } catch (e: Exception) {
      runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
      logger.warn("[AICodBiAssistant] Failed to fix parent_order_idx for node $nodeId", e)
    } finally {
      runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
    }
  }

  /**
   * Forces [childNode] (persisted under [parentNode]) to have [childIndex] as its
   * `parent_order_idx`. This is needed for condition/branching nodes (e.g. CheckTrustLevelPlugin)
   * which use `parent_order_idx` to distinguish YES branch (consequentChildIndex=0) from NO branch
   * (alternateChildIndex=1). All children on the SAME branch share the same index value.
   */
  private fun forceChildIndex(childNode: Any, parentNode: Any, childIndex: Int, userContext: Any) {
    val nodeId =
        childNode.javaClass.getMethod("getId").invoke(childNode) as? Long
            ?: run {
              logger.warn("[AICodBiAssistant] forceChildIndex: child node has no ID yet")
              return
            }
    val parentId =
        parentNode.javaClass.getMethod("getId").invoke(parentNode) as? Long
            ?: run {
              logger.warn("[AICodBiAssistant] forceChildIndex: parent node has no ID")
              return
            }
    val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val entityContext =
        entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
    val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
    val tx = em.javaClass.getMethod("getTransaction").invoke(em)
    tx.javaClass.getMethod("begin").invoke(tx)
    try {
      val sql = "UPDATE workflow_node SET parent_order_idx = $childIndex WHERE id = $nodeId"
      em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, sql).let {
        it.javaClass.getMethod("executeUpdate").invoke(it)
      }
      logger.info(
          "[AICodBiAssistant] Force-set parent_order_idx = {} for child node id={} under parent id={}",
          childIndex,
          nodeId,
          parentId)
      tx.javaClass.getMethod("commit").invoke(tx)
    } catch (e: Exception) {
      runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
      logger.warn("[AICodBiAssistant] Failed to force parent_order_idx for node $nodeId", e)
    } finally {
      runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
    }
  }

  /**
   * Formcycle requires an FC_SWITCH's FC_SWITCH_DEFAULT branch at parent_order_idx 0 (the FIRST
   * child); a switch whose default is anywhere else is INVALID. Reorders the direct children of the
   * switch node with id [switchNodeId] so the default branch is first, keeping every other child in
   * its current relative order (no-op when the default already is the first child, or when the
   * switch has no default). Used after appending new language cases AND to heal switches generated
   * before this rule (also when nothing new is added).
   */
  private fun ensureSwitchDefaultFirst(
      workflowNodeApi: Any,
      ucClass: Class<*>,
      userContext: Any,
      switchNodeId: Long
  ) {
    try {
      val getById =
          workflowNodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
      val switchNode = getById.invoke(workflowNodeApi, userContext, switchNodeId) ?: return
      val emf = CodbiEntities.entityManagerFactory ?: return
      val em = emf.createEntityManager()
      try {
        val createNQ = em.javaClass.getMethod("createNativeQuery", String::class.java)
        val q =
            createNQ.invoke(
                em,
                "SELECT ID, TYPE FROM workflow_node WHERE parent_id = $switchNodeId ORDER BY parent_order_idx ASC, ID ASC")
        val rows = (q.javaClass.getMethod("getResultList").invoke(q) as? List<*>) ?: return
        val items = mutableListOf<Pair<Long, String>>()
        for (row in rows) {
          val arr = row as? Array<*>
          if (arr == null || arr.size < 2) continue
          val id = arr[0]?.toString()?.toLongOrNull() ?: continue
          val type = arr[1]?.toString() ?: ""
          if (id > 0) items.add(id to type)
        }
        val defIndex = items.indexOfFirst { it.second == "FC_SWITCH_DEFAULT" }
        if (defIndex <= 0) return // no default branch, or it already is the first child
        val defaultEntry = items[defIndex]
        val ordered = listOf(defaultEntry) + items.filterIndexed { index, _ -> index != defIndex }
        for ((newIndex, entry) in ordered.withIndex()) {
          val node = getById.invoke(workflowNodeApi, userContext, entry.first) ?: continue
          forceChildIndex(node, switchNode, newIndex, userContext)
        }
        logger.info(
            "[AICodBiAssistant] Reordered FC_SWITCH {} children: FC_SWITCH_DEFAULT is now at index 0",
            switchNodeId)
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] ensureSwitchDefaultFirst failed for switch {}: {}",
          switchNodeId,
          e.message)
    }
  }

  /**
   * Tries to set [parentOrderIndex] on the given [node] entity BEFORE it is persisted, so Hibernate
   * tracks the value properly. This avoids stale lockingVersion issues with WorkflowVersionStager
   * that can occur when using direct SQL UPDATEs.
   *
   * Silently does nothing if the entity lacks a setter (fallback handled by caller).
   */
  private fun trySetParentOrderIndex(nodeClass: Class<*>, node: Any, parentOrderIndex: Int) {
    try {
      nodeClass.getMethod("setParentOrderIndex", Int::class.java).invoke(node, parentOrderIndex)
    } catch (_: NoSuchMethodException) {
      try {
        nodeClass.getMethod("setParentOrderIdx", Int::class.java).invoke(node, parentOrderIndex)
      } catch (_: NoSuchMethodException) {
        // Entity has no setter â€” caller must use forceChildIndex fallback
      }
    }
  }

  /**
   * Verifies that [childNode] (persisted under [parentNode]) has the expected [childIndex] for its
   * `parent_order_idx`. If not (e.g. no setter was available on the entity), falls back to
   * [forceChildIndex] with a direct SQL UPDATE.
   */
  private fun verifyChildIndex(childNode: Any, parentNode: Any, childIndex: Int, userContext: Any) {
    try {
      val actualIdx = childNode.javaClass.getMethod("getParentOrderIndex").invoke(childNode) as? Int
      if (actualIdx == null || actualIdx != childIndex) {
        forceChildIndex(childNode, parentNode, childIndex, userContext)
      }
    } catch (_: Exception) {
      forceChildIndex(childNode, parentNode, childIndex, userContext)
    }
  }

  private fun getUserContext(params: IPluginServletActionParams): Any {
    val benutzerMethod = params.javaClass.getMethod("getBenutzer")
    val benutzer =
        benutzerMethod.invoke(params)
            ?: throw IllegalStateException("No authenticated user in request")
    val factoryClass = Class.forName("de.xima.fc.user.UserContextFactory")
    val benutzerClass = Class.forName("de.xima.fc.entities.Benutzer")
    val forBenutzerMethod = factoryClass.getMethod("forBenutzer", benutzerClass)
    return forBenutzerMethod.invoke(null, benutzer)
        ?: throw IllegalStateException("UserContextFactory.forBenutzer returned null")
  }

  private fun buildTriggerParamsJson(
      spec: WorkflowTaskSpec,
      workflowVersion: Any? = null,
      userContext: Any? = null
  ): String? {
    return when (spec.triggerType) {
      "FC_FORM_SUBMIT_BUTTON" -> {
        val buttonName = spec.triggerParams["buttonName"] as? String ?: ""
        """{"buttonName":${gson.toJson(buttonName)}}"""
      }
      "FC_STATE_TIMER" -> {
        var days = (spec.triggerParams["durationDays"] as? Number)?.toLong() ?: 0L
        var hours = (spec.triggerParams["durationHours"] as? Number)?.toInt() ?: 0
        var minutes = (spec.triggerParams["durationMinutes"] as? Number)?.toInt() ?: 0
        // If the prompt does not specify a delay, default to 1 minute â€”
        // all-zero duration (0d 0h 0m) is invalid for the FC_STATE_TIMER trigger.
        if (days == 0L && hours == 0 && minutes == 0) {
          minutes = 1
        }
        // Resolve applicableStateNames (human-readable state names from the AI) to
        // applicableStates (List<UuidEntityRef> with UUIDs) for the "After change to state" field.
        @Suppress("UNCHECKED_CAST")
        val stateNames =
            (spec.triggerParams["applicableStateNames"] as? List<*>)?.filterIsInstance<String>()
                ?: emptyList()
        val statesJson =
            if (stateNames.isNotEmpty() && workflowVersion != null && userContext != null) {
              stateNames.mapNotNull { name ->
                val uuid = resolveStateUuid(userContext, workflowVersion, name)
                if (uuid != null) {
                  """{"uuid":${gson.toJson(uuid.toString())},"entityClass":"de.xima.fc.entities.WorkflowState"}"""
                } else null
              }
            } else emptyList<String>()
        val statesArrayJson = "[${statesJson.joinToString(",")}]"
        """{"applicableStates":$statesArrayJson,"durationDays":$days,"durationHours":$hours,"durationMinutes":$minutes,"durationSeconds":0}"""
      }
      "FC_TIME_POINT" -> {
        // Format required by Formcycle's FastJson for FcTimePointProps:
        //   Mode FIXED:
        //     timePointType: "FIXED"
        //     timePointFixed.fireDateTime:
        // {"year":N,"month":N,"day":N,"hour":N,"minute":N,"second":N,"nano":N}
        //     timePointFixed.zoneId: "Europe/Berlin" (string)
        //   Mode EXPRESSION_WITH_FORMAT:
        //     timePointType: "EXPRESSION_WITH_FORMAT"
        //     timePointExpressionWithFormat.dateTimeTemplate: "[%technicalId%]"
        //     timePointExpressionWithFormat.dateTimeFormat: "dd.MM.yyyy"
        //     timePointExpressionWithFormat.operation: "PLUS"|"MINUS"
        //     timePointExpressionWithFormat.offsetDuration: "1"
        //     timePointExpressionWithFormat.durationUnit:
        // "DAYS"|"HOURS"|"MINUTES"|"WEEKS"|"MONTHS"|"YEARS"
        //   Shared:
        //     fireWhenInPast: boolean
        //     allowedStates: [] (empty list)
        val timePointType = spec.triggerParams["timePointType"] as? String ?: "FIXED"
        val fireWhenInPast = spec.triggerParams["fireWhenInPast"] as? Boolean ?: false
        when (timePointType) {
          "EXPRESSION_WITH_FORMAT" -> {
            val dateTimeTemplate = spec.triggerParams["dateTimeTemplate"] as? String ?: ""
            val dateTimeFormat = spec.triggerParams["dateTimeFormat"] as? String ?: "dd.MM.yyyy"
            val operation = spec.triggerParams["operation"] as? String ?: "PLUS"
            val offsetDuration = spec.triggerParams["offsetDuration"] as? String ?: "0"
            val durationUnit = spec.triggerParams["durationUnit"] as? String ?: "DAYS"
            """{"timePointType":"EXPRESSION_WITH_FORMAT","timePointExpressionWithFormat":{"dateTimeTemplate":${gson.toJson(dateTimeTemplate)},"dateTimeFormat":${gson.toJson(dateTimeFormat)},"operation":${gson.toJson(operation)},"offsetDuration":${gson.toJson(offsetDuration)},"durationUnit":${gson.toJson(durationUnit)}},"fireWhenInPast":$fireWhenInPast,"allowedStates":[]}"""
          }
          else -> { // FIXED (default)
            val fixedDateTimeStr = spec.triggerParams["fixedDateTime"] as? String
            if (fixedDateTimeStr != null) {
              val zdt =
                  try {
                    java.time.ZonedDateTime.parse(fixedDateTimeStr)
                  } catch (_: Exception) {
                    try {
                      val odt = java.time.OffsetDateTime.parse(fixedDateTimeStr)
                      odt.toZonedDateTime()
                    } catch (_: Exception) {
                      try {
                        val ldt = java.time.LocalDateTime.parse(fixedDateTimeStr)
                        ldt.atZone(java.time.ZoneId.systemDefault())
                      } catch (_: Exception) {
                        null
                      }
                    }
                  }
              if (zdt != null) {
                val ldt = zdt.toLocalDateTime()
                val zoneId = zdt.zone.id
                """{"timePointType":"FIXED","timePointFixed":{"fireDateTime":{"year":${ldt.year},"month":${ldt.monthValue},"day":${ldt.dayOfMonth},"hour":${ldt.hour},"minute":${ldt.minute},"second":${ldt.second},"nano":${ldt.nano}},"zoneId":${gson.toJson(zoneId)}},"fireWhenInPast":$fireWhenInPast,"allowedStates":[]}"""
              } else {
                """{"fireWhenInPast":$fireWhenInPast,"allowedStates":[]}"""
              }
            } else {
              """{"fireWhenInPast":$fireWhenInPast,"allowedStates":[]}"""
            }
          }
        }
      }
      "FC_CATCH_ERROR" -> {
        @Suppress("UNCHECKED_CAST") val errorCode = spec.triggerParams["errorCode"] as? String ?: ""
        @Suppress("UNCHECKED_CAST")
        val errorCodeMatchType = spec.triggerParams["errorCodeMatchType"] as? String ?: ""
        @Suppress("UNCHECKED_CAST") val nodeName = spec.triggerParams["nodeName"] as? String ?: ""
        @Suppress("UNCHECKED_CAST")
        val nodeNameMatchType = spec.triggerParams["nodeNameMatchType"] as? String ?: ""
        @Suppress("UNCHECKED_CAST") val nodeType = spec.triggerParams["nodeType"] as? String ?: ""
        @Suppress("UNCHECKED_CAST")
        val nodeTypeMatchType = spec.triggerParams["nodeTypeMatchType"] as? String ?: ""
        val fields = mutableListOf<String>()
        if (errorCode.isNotBlank()) {
          fields.add(""""errorCode":${gson.toJson(errorCode)}""")
          if (errorCodeMatchType.isNotBlank()) {
            fields.add(""""errorCodeMatchType":${gson.toJson(errorCodeMatchType)}""")
          }
        }
        if (nodeName.isNotBlank()) {
          fields.add(""""nodeName":${gson.toJson(nodeName)}""")
          if (nodeNameMatchType.isNotBlank()) {
            fields.add(""""nodeNameMatchType":${gson.toJson(nodeNameMatchType)}""")
          }
        }
        if (nodeType.isNotBlank()) {
          fields.add(""""nodeType":${gson.toJson(nodeType)}""")
          if (nodeTypeMatchType.isNotBlank()) {
            fields.add(""""nodeTypeMatchType":${gson.toJson(nodeTypeMatchType)}""")
          }
        }
        if (fields.isEmpty()) "{}" else fields.joinToString(",", "{", "}")
      }
      else -> "{}" // FC_MANUAL, FC_DOI_VERIFIED and others use empty params
    }
  }

  /**
   * Resolves the default GUI icon (an IGuiIcon) of the given workflow element type ([enumClassName]
   * must be `de.xima.fc.mdl.enums.EWorkflowNodeType` or
   * `de.xima.fc.mdl.enums.EWorkflowTriggerType`) and serializes it as the JSON object the flowchart
   * editor expects inside the element's customParameters. The editor's icon renderer consumes
   * `{styleClass, value}` (see flowchart.min.js: it renders `<span className=styleClass>{value}
   * </span>`), so we emit exactly that shape. Returns null when the type has no icon (unknown type,
   * or an empty/blank icon).
   */
  private fun resolveWorkflowElementIconJson(
      enumClassName: String,
      kind: String,
      elementLabel: String
  ): String? {
    if (kind.isBlank()) return null
    return try {
      val enumClass = Class.forName(enumClassName)
      val forKindOrNull = enumClass.getMethod("forKindOrNull", String::class.java)
      val enumValue = forKindOrNull.invoke(null, kind) ?: return null
      val icon = enumValue.javaClass.getMethod("getDefaultIcon").invoke(enumValue) ?: return null
      val styleClass =
          try {
            icon.javaClass.getMethod("getStyleClass").invoke(icon) as? String
          } catch (_: Exception) {
            null
          } ?: ""
      val value =
          try {
            icon.javaClass.getMethod("getValue").invoke(icon) as? String
          } catch (_: Exception) {
            null
          } ?: ""
      if (styleClass.isBlank() && value.isBlank()) return null
      logger.info(
          "[AICodBiAssistant] {} icon for '{}': styleClass='{}' value='{}'",
          elementLabel,
          kind,
          styleClass,
          value)
      """{"styleClass":${gson.toJson(styleClass)},"value":${gson.toJson(value)},"style":""}"""
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not resolve {} icon for '{}': {}",
          elementLabel.lowercase(),
          kind,
          e.message)
      null
    }
  }

  /**
   * Resolves the default icon JSON of a workflow node type (see [resolveWorkflowElementIconJson]).
   */
  private fun resolveNodeIconJson(nodeType: String): String? =
      resolveWorkflowElementIconJson("de.xima.fc.mdl.enums.EWorkflowNodeType", nodeType, "Node")

  /**
   * Resolves the default icon JSON of a workflow trigger type (see
   * [resolveWorkflowElementIconJson]).
   */
  private fun resolveTriggerIconJson(triggerType: String): String? =
      resolveWorkflowElementIconJson(
          "de.xima.fc.mdl.enums.EWorkflowTriggerType", triggerType, "Trigger")

  /**
   * Builds the node's CUSTOM_PARAMS JSON and additionally embeds the per-type default icon under
   * the `icon` key, so the workflow editor renders the node's icon on the left. AI-created nodes
   * get the same icon as a node of that type created manually in the designer
   * (EWorkflowNodeType.defaultIcon).
   */
  private fun buildNodeParamsJsonWithIcon(
      spec: WorkflowTaskSpec,
      workflowVersion: Any?,
      userContext: Any?,
      nodeType: String = spec.nodeType
  ): String? {
    val base = buildNodeParamsJson(spec, workflowVersion, userContext) ?: return null
    return try {
      val obj = gson.fromJson(base, JsonObject::class.java)
      // Match formcycle's own node serialization: stamp the params-schema version key so
      // WorkflowCustomParametersHelper.updateCustomParams() (which checks "$version" in the params
      // JSON) skips the node-handler migration — for FC_POST_REQUEST that migration would otherwise
      // re-derive httpRequestType to DYNAMIC ("Automatisch gemäß Inhalt") instead of keeping
      // "CUSTOM". "8.5.3" is the current formcycle node-handler version (verified from a manually
      // created node's decrypted "$version":"8.5.3"); it MUST match the formcycle release version.
      // The entity-level customParametersVersion="8.5.3" (stampCustomParamsVersion) covers the
      // entity-based path; this covers the JSON-based path. The runtime ignores the extra
      // "$version" key (fastjson maps only the FcHttpRequestProps fields).
      obj.addProperty("\$version", "8.5.3")
      resolveNodeIconJson(nodeType)?.let { obj.add("icon", JsonParser.parseString(it)) }
      obj.toString()
    } catch (_: Exception) {
      base
    }
  }

  /**
   * Builds the trigger's CUSTOM_PARAMS JSON and additionally embeds the per-type default icon under
   * the `icon` key, so the workflow editor renders the trigger's icon on the left. AI-created
   * triggers get the same icon as a trigger of that type created manually in the designer
   * (EWorkflowTriggerType.defaultIcon).
   */
  private fun buildTriggerParamsJsonWithIcon(
      spec: WorkflowTaskSpec,
      workflowVersion: Any?,
      userContext: Any?
  ): String? {
    val base = buildTriggerParamsJson(spec, workflowVersion, userContext) ?: return null
    return try {
      val obj = gson.fromJson(base, JsonObject::class.java)
      // Same params-schema version stamp as the nodes (see buildNodeParamsJsonWithIcon).
      obj.addProperty("\$version", "8.5.3")
      resolveTriggerIconJson(spec.triggerType)?.let { obj.add("icon", JsonParser.parseString(it)) }
      obj.toString()
    } catch (_: Exception) {
      base
    }
  }

  /** Result of sanitizing an AI-generated SQL statement. */
  private data class SqlSanitizeResult(
      val blocked: Boolean,
      val blockedReasons: List<String>,
      val sanitized: String
  )

  /**
   * Destructive DDL keywords that are blocked in AI-generated FC_SQL_STATEMENT queries. Matching is
   * case-insensitive and word-boundary based, so e.g. "DROP" matches but a word like "droppable"
   * does not.
   */
  private val DESTRUCTIVE_SQL_KEYWORDS =
      listOf("DROP", "TRUNCATE", "ALTER", "CREATE", "RENAME", "GRANT", "REVOKE")

  /**
   * Sanitizes an AI-generated SQL statement before it is persisted into an FC_SQL_STATEMENT node.
   *
   * Destructive DDL (see [DESTRUCTIVE_SQL_KEYWORDS]) and multi-statement batches (semicolon
   * separated statements — a classic injection vector) are **blocked**: the returned
   * [SqlSanitizeResult.sanitized] then carries a placeholder text instead of the original
   * statement, so no destructive SQL ever reaches the database. Non-destructive single statements
   * pass through unchanged. Comments are stripped before analysis so keywords cannot be smuggled
   * past the check.
   */
  private fun sanitizeSqlQuery(sql: String): SqlSanitizeResult {
    val original = sql.trim()
    if (original.isBlank()) {
      return SqlSanitizeResult(blocked = false, blockedReasons = emptyList(), sanitized = sql)
    }
    // Normalize for analysis: strip line/block comments and collapse whitespace.
    val normalized =
        original
            .replace(Regex("--[^\n]*"), " ")
            .replace(Regex("/\\*.*?\\*/", RegexOption.DOT_MATCHES_ALL), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
    val lower = normalized.lowercase()
    val foundKeywords =
        DESTRUCTIVE_SQL_KEYWORDS.filter { kw ->
          Regex("\\b${kw.lowercase()}\\b").containsMatchIn(lower)
        }
    // Multi-statement batches: a ';' followed by more content (a single trailing ';' is harmless).
    val body = normalized.removeSuffix(";").trim()
    val multiStatement = body.contains(';') && body.substringAfterLast(';').trim().isNotEmpty()
    if (foundKeywords.isEmpty() && !multiStatement) {
      return SqlSanitizeResult(blocked = false, blockedReasons = emptyList(), sanitized = original)
    }
    val reasons = foundKeywords + if (multiStatement) listOf("MULTI-STATEMENT") else emptyList()
    val placeholder =
        "< DESTRUCTIVE SQL STATEMENT BLOCKED BY CODBI (NO ${reasons.joinToString(", ")} allowed)>"
    return SqlSanitizeResult(blocked = true, blockedReasons = reasons, sanitized = placeholder)
  }

  /**
   * Walks the AI-produced form JSON and neutralizes destructive SQL the AI may have placed into a
   * button's `action.customAction` (e.g. an XButtonList submit button whose custom action is "DROP
   * TABLE ..."). The FC_SQL_STATEMENT sanitizer only covers workflow nodes; form-level injection
   * via a button custom action must be caught here too. Blocked custom actions are emptied so the
   * button stays valid and renders.
   */
  private fun sanitizeFormCustomActions(formJson: String): String {
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items = root.get("items")?.takeIf { it.isJsonArray }?.asJsonArray ?: return formJson
      var changed = false
      for (item in items) {
        if (!item.isJsonObject) continue
        val props =
            item.asJsonObject.get("properties")?.takeIf { it.isJsonObject }?.asJsonObject
                ?: continue
        val buttons = props.get("buttons")?.takeIf { it.isJsonArray }?.asJsonArray ?: continue
        for (btn in buttons) {
          if (!btn.isJsonObject) continue
          val action =
              btn.asJsonObject.get("action")?.takeIf { it.isJsonObject }?.asJsonObject ?: continue
          val customAction =
              action.get("customAction")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
          if (customAction.isBlank()) continue
          val result = sanitizeSqlQuery(customAction)
          if (result.blocked) {
            action.addProperty("customAction", "")
            changed = true
            logger.warn(
                "[AICodBiAssistant] Blocked destructive SQL in form button customAction: '{}'",
                customAction)
          }
        }
      }
      if (changed) root.toString() else formJson
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] sanitizeFormCustomActions failed: {}", e.message)
      formJson
    }
  }

  /**
   * Guardrail for the form AI: the STRUCTURAL SKELETON of a form — the first page (XPage), the
   * header (XHeader) and the footer (XFooter) — must ALWAYS be present, even when everything else
   * is removed ("Lösche alle Elemente"). The model occasionally drops them together with the
   * widgets. This re-inserts any XPage / XHeader / XFooter that existed before but is missing from
   * the AI's output (pages as empty pages, header/footer as-is) — UNLESS the prompt explicitly asks
   * to remove/delete pages.
   */
  private fun restorePagesUnlessRequested(
      formJson: String,
      beforeJson: String?,
      prompt: String
  ): String {
    if (beforeJson.isNullOrBlank()) return formJson
    val wantsPageRemoval =
        Regex(
                "\\b(remove|delete|entfernen|loeschen|löschen)\\b[^.!?]{0,40}\\b(page|seiten?)\\b",
                RegexOption.IGNORE_CASE)
            .containsMatchIn(prompt) ||
            Regex(
                    "\\b(page|seiten?)\\b[^.!?]{0,40}\\b(remove|delete|entfernen|loeschen|löschen)\\b",
                    RegexOption.IGNORE_CASE)
                .containsMatchIn(prompt)
    if (wantsPageRemoval) return formJson
    return try {
      val before = JsonParser.parseString(beforeJson).asJsonObject
      val after = JsonParser.parseString(formJson).asJsonObject
      val beforeItems =
          before.get("items")?.takeIf { it.isJsonArray }?.asJsonArray ?: return formJson
      val afterItems = after.get("items")?.takeIf { it.isJsonArray }?.asJsonArray ?: return formJson
      val structural = setOf("XPage", "XHeader", "XFooter")
      val afterNames = mutableSetOf<String>()
      for (el in afterItems) {
        if (el.isJsonObject && el.asJsonObject.get("className")?.asString in structural) {
          el.asJsonObject.get("properties")?.asJsonObject?.get("name")?.asString?.let {
            afterNames.add(it)
          }
        }
      }
      var changed = false
      for (item in beforeItems) {
        if (!item.isJsonObject) continue
        val cls = item.asJsonObject.get("className")?.asString ?: continue
        if (cls !in structural) continue
        val props =
            item.asJsonObject.get("properties")?.takeIf { it.isJsonObject }?.asJsonObject
                ?: continue
        val itemName = props.get("name")?.asString ?: continue
        if (itemName in afterNames) continue
        val restored = item.asJsonObject.deepCopy()
        // The skeleton shells are re-inserted EMPTY — any elements they contained (logo, links,
        // widgets inside the header/footer/page) were removed along with everything else and must
        // not be resurrected.
        restored.get("properties")?.asJsonObject?.remove("elements")
        restored.get("properties")?.asJsonObject?.add("elements", JsonArray())
        afterItems.add(restored)
        changed = true
        logger.info(
            "[AICodBiAssistant] Restored {} '{}' the AI dropped (structural skeleton is always kept)",
            cls,
            itemName)
      }
      if (changed) after.toString() else formJson
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] restorePagesUnlessRequested failed: {}", e.message)
      formJson
    }
  }

  /**
   * Final structural normalization applied to the form JSON right before it is returned to the
   * designer (both the plain form and the "both" intents):
   * 1. Page ordering — Formcycle renders the pages in `items` order and the footer after all pages.
   *    The pass-2 splice / field-restore steps append newly created pages AFTER the restored
   *    XFooter (e.g. `[header, page1, footer, page2, page3, ...]`), which makes the designer render
   *    pages 2 & 3 below the footer. All XPage items are moved back in front of the XFooter,
   *    preserving their relative order.
   * 2. Page labels — when a page has no header/title but the XNavigationBar ("Form.Navigator")
   *    lists that page with a text label, the label is copied onto the XPage's `header` so every
   *    page is titled in the designer even when the model forgot to set it.
   *
   * @return true when the JSON was modified (so the caller re-serializes it).
   */
  private fun normalizeFinalFormStructure(root: JsonObject): Boolean {
    val reordered = movePagesBeforeFooter(root)
    val treeOrdered = reorderItemsByTreeOrder(root)
    val labeled = applyPageLabelsFromNavigator(root)
    val checked = ensureNextPageValidation(root)
    return reordered || treeOrdered || labeled || checked
  }

  /**
   * Moves every XPage item in front of the XFooter. Returns true when the `items` array changed.
   */
  private fun movePagesBeforeFooter(root: JsonObject): Boolean {
    val items = root.getAsJsonArray("items") ?: return false
    var firstFooter = -1
    var lastPage = -1
    for (i in 0 until items.size()) {
      if (!items.get(i).isJsonObject) continue
      when (items.get(i).asJsonObject.get("className")?.asString) {
        "XFooter" -> if (firstFooter < 0) firstFooter = i
        "XPage" -> lastPage = i
      }
    }
    // No footer, or no page is placed after a footer — the order is already correct.
    if (firstFooter < 0 || lastPage <= firstFooter) return false
    val reordered = JsonArray()
    var footersInserted = false
    for (i in 0 until items.size()) {
      val el = items.get(i)
      if (el.isJsonObject &&
          el.asJsonObject.get("className")?.asString == "XFooter" &&
          i <= lastPage) {
        // This footer sits before/among the pages — drop it here, re-insert after the last page.
        continue
      }
      reordered.add(el)
      if (i == lastPage && !footersInserted) {
        footersInserted = true
        for (j in 0 until items.size()) {
          val f = items.get(j)
          if (j <= lastPage &&
              f.isJsonObject &&
              f.asJsonObject.get("className")?.asString == "XFooter") {
            reordered.add(f)
          }
        }
      }
    }
    root.add("items", reordered)
    logger.info("[AICodBiAssistant] Reordered items so all pages render in front of the footer")
    return true
  }

  /**
   * Reorders the flat `items` array into depth-first tree order so that every container's children
   * appear in the same relative order as the container's `properties.elements` array.
   *
   * WHY: Formcycle's designer renders a container's children in the order the items appear in the
   * flat `items` array — the `elements` array alone does not move them (see
   * [movePagesBeforeFooter], which reorders `items` so pages render in front of the footer). The
   * AI, however, APPENDS newly created widgets (e.g. intro/description XSpans) at the END of the
   * `items` array even when it correctly inserts their name at POSITION 0 of a fieldset's
   * `elements` array. Result: the description renders at the BOTTOM of the fieldset in the designer
   * despite the intended "before the first element" placement. Reordering the `items` array into
   * tree order makes the designer show exactly what the `elements` arrays specify (description
   * first, existing fields in their original relative order).
   *
   * Root items (pages, header, footer, standalone items) keep their current relative order; only
   * the position of their descendants is derived from the containers' `elements` arrays. Returns
   * true when the `items` array changed.
   */
  private fun reorderItemsByTreeOrder(root: JsonObject): Boolean {
    val items = root.getAsJsonArray("items") ?: return false
    val itemByName = mutableMapOf<String, JsonObject>()
    val childrenOf = mutableMapOf<String, List<String>>() // container name -> ordered child names
    val childNames = mutableSetOf<String>()
    for (el in items) {
      if (!el.isJsonObject) continue
      val obj = el.asJsonObject
      val props = obj.getAsJsonObject("properties") ?: continue
      val name = props.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      itemByName[name] = obj
      val elements = props.get("elements")?.takeIf { it.isJsonArray }?.asJsonArray
      if (elements != null) {
        val names = elements.mapNotNull { e -> if (e.isJsonPrimitive) e.asString else null }
        childrenOf[name] = names
        childNames.addAll(names)
      }
    }
    // Root items are those not referenced as a child by any container (plus any item without a
    // name). They keep their current relative order.
    val roots = mutableListOf<JsonObject>()
    for (el in items) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties")
      val name = props?.get("name")?.takeIf { it.isJsonPrimitive }?.asString
      if (name == null || name !in childNames) roots.add(el.asJsonObject)
    }
    val consumed = java.util.IdentityHashMap<JsonObject, Boolean>()
    val reordered = JsonArray()
    fun emitItem(item: JsonObject) {
      if (consumed.containsKey(item))
          return // already emitted (guards against duplicate refs/cycles)
      consumed[item] = true
      reordered.add(item)
      val props = item.getAsJsonObject("properties") ?: return
      val name = props.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: return
      for (childName in childrenOf[name] ?: emptyList()) {
        itemByName[childName]?.let { emitItem(it) }
      }
    }
    for (rootItem in roots) emitItem(rootItem)
    // Safety net: append any item that was not reached through the tree (unreachable / not a root)
    // in its original order, so no item is ever dropped.
    for (el in items) {
      if (el.isJsonObject) {
        val obj = el.asJsonObject
        if (!consumed.containsKey(obj)) {
          reordered.add(obj)
          consumed[obj] = true
        }
      } else {
        reordered.add(el)
      }
    }
    if (reordered.size() == items.size()) {
      var same = true
      for (i in 0 until items.size()) {
        if (items.get(i) !== reordered.get(i)) {
          same = false
          break
        }
      }
      if (same) return false
    }
    root.add("items", reordered)
    logger.info(
        "[AICodBiAssistant] Reordered items into tree order so intro/description elements render in their elements-array position")
    return true
  }

  /**
   * Copies page labels from the XNavigationBar ("Form.Navigator") options onto XPage items whose
   * `header` is empty, so multi-page forms created by the AI are titled. Returns true when any page
   * header was set.
   */
  private fun applyPageLabelsFromNavigator(root: JsonObject): Boolean {
    val items = root.getAsJsonArray("items") ?: return false
    val navLabels = mutableMapOf<String, String>() // page name -> label
    for (el in items) {
      if (!el.isJsonObject) continue
      if (el.asJsonObject.get("className")?.asString != "XNavigationBar") continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val options = props.getAsJsonArray("options") ?: continue
      for (opt in options) {
        if (!opt.isJsonObject) continue
        val text = opt.asJsonObject.get("text")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
        val value = opt.asJsonObject.get("value")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
        if (!text.isNullOrEmpty() && !value.isNullOrEmpty()) navLabels[value] = text
      }
    }
    if (navLabels.isEmpty()) return false
    var changed = false
    for (el in items) {
      if (!el.isJsonObject) continue
      if (el.asJsonObject.get("className")?.asString != "XPage") continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val name = props.get("name")?.takeIf { it.isJsonPrimitive }?.asString?.trim() ?: continue
      val label = navLabels[name] ?: continue
      val current = props.get("header")?.takeIf { it.isJsonPrimitive }?.asString?.trim().orEmpty()
      if (current.isEmpty()) {
        props.addProperty("header", label)
        changed = true
      }
    }
    if (changed) {
      logger.info(
          "[AICodBiAssistant] Applied page label(s) from the Form.Navigator to empty page headers")
    }
    return changed
  }

  /**
   * Safety net for multi-page forms: a "Weiter" / next-page button (action.page="next") must
   * validate the current page's fields before navigating (action.check=true) when that page
   * contains a field that can be invalid — a REQUIRED field, a datatype-validated field, or a field
   * tagged with a CodBi functionality/class that validates input (e.g. a CSS class starting with
   * "CodBi_", such as CodBi_People_Name, or a data-cb-func attribute). The AI sometimes generates a
   * plain "next page" without the check; this upgrades it to "next page + check" so the user cannot
   * advance with invalid input (e.g. a CodBi_People_Name field holding "Hans-"). Returns true when
   * any button action was changed.
   */
  private fun ensureNextPageValidation(root: JsonObject): Boolean {
    val items = root.getAsJsonArray("items") ?: return false
    val itemByName = mutableMapOf<String, JsonObject>()
    for (el in items) {
      if (!el.isJsonObject) continue
      val name = el.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString ?: continue
      itemByName[name] = el.asJsonObject
    }
    val nestedContainers = setOf("XFieldSet", "XContainer", "XContainerInvisible")
    // For every page, collect the transitive set of element names on it (children of nested
    // containers included), and map each element back to its page.
    val pageElements = mutableMapOf<String, MutableSet<String>>()
    val pageOfItem = mutableMapOf<String, String>()
    for (el in items) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      if (item.get("className")?.asString != "XPage") continue
      val props = item.getAsJsonObject("properties") ?: continue
      val pageName = props.get("name")?.asString ?: continue
      val names = mutableSetOf<String>()
      val queue = ArrayDeque<String>()
      props.getAsJsonArray("elements")?.forEach { ref ->
        if (ref.isJsonPrimitive) queue.addLast(ref.asString)
      }
      while (queue.isNotEmpty()) {
        val childName = queue.removeFirst()
        if (!names.add(childName)) continue
        val child = itemByName[childName] ?: continue
        if (child.get("className")?.asString in nestedContainers) {
          child.getAsJsonObject("properties")?.getAsJsonArray("elements")?.forEach { ref ->
            if (ref.isJsonPrimitive) queue.addLast(ref.asString)
          }
        }
      }
      pageElements[pageName] = names
      for (n in names) pageOfItem[n] = pageName
    }
    var changed = false
    for (el in items) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      if (item.get("className")?.asString != "XButtonList") continue
      val props = item.getAsJsonObject("properties") ?: continue
      val buttons = props.getAsJsonArray("buttons") ?: continue
      val buttonListName = props.get("name")?.asString ?: continue
      val pageName = pageOfItem[buttonListName] ?: continue
      val pageFields = pageElements[pageName] ?: continue
      for (btn in buttons) {
        if (!btn.isJsonObject) continue
        val btnObj = btn.asJsonObject
        val action = btnObj.getAsJsonObject("action") ?: continue
        if (action.get("page")?.asString != "next") continue
        val check = action.get("check")?.takeIf { it.isJsonPrimitive }?.asString
        if (check == "true" || check == "1") continue
        if (!pageCanInvalidate(pageFields, itemByName)) continue
        action.addProperty("check", true)
        changed = true
        logger.info(
            "[AICodBiAssistant] Upgraded 'Weiter' button '{}' to next page + check (page '{}' contains fields that can invalidate)",
            btnObj.get("name")?.asString ?: buttonListName,
            pageName)
      }
    }
    return changed
  }

  /**
   * Whether any input field in [elementNames] can invalidate: it is required, has a datatype, is
   * tagged with a CodBi validation class, or carries a Date.* data-cb-func functionality. Layout
   * containers/chrome are ignored.
   */
  private fun pageCanInvalidate(
      elementNames: Set<String>,
      itemByName: Map<String, JsonObject>
  ): Boolean {
    val layoutClassNames =
        setOf(
            "XPage",
            "XHeader",
            "XFooter",
            "XFieldSet",
            "XContainer",
            "XContainerInvisible",
            "XSpan",
            "XLine",
            "XButtonList",
            "XNavigationBar",
            "XAppointment",
            "XImage",
            "XFormula",
            "XHtml")
    // CodBi classes that are purely layout/display/print/autocomplete and never invalidate input.
    val nonValidatingCodbiPrefixes =
        listOf(
            "CodBi_Print_",
            "CodBi_HTML_",
            "CodBi_Accordion_",
            "CodBi_OpenPLZ_",
            "CodBi_DQ_",
            "CodBi_Table_",
            "CodBi_AI_",
            "CodBi_Style_",
            "CodBi_Map_",
            "CodBi_OpenStreetMap_",
            "CodBi_Tagging_",
            "CodBi_Calendar_",
            "CodBi_Flex_")
    for (name in elementNames) {
      val item = itemByName[name] ?: continue
      val className = item.get("className")?.asString
      if (className in layoutClassNames) continue
      val props = item.getAsJsonObject("properties") ?: continue
      // Required field.
      if (isTruthy(props.get("required"))) return true
      // Datatype-validated field (dateDE, email, ...).
      val datatype = props.get("datatype")?.takeIf { it.isJsonPrimitive }?.asString.orEmpty()
      if (datatype.isNotBlank()) return true
      // CodBi validation class (e.g. CodBi_People_Name).
      val cssClasses = props.getAsJsonArray("cssclasses")
      if (cssClasses != null) {
        for (c in cssClasses) {
          if (!c.isJsonPrimitive) continue
          val cls = c.asString
          if (cls.startsWith("CodBi_") && nonValidatingCodbiPrefixes.none { cls.startsWith(it) }) {
            return true
          }
        }
      }
      // data-cb-func date validation functionality (Date.Min, Date.NoWeekends, Date.Frame, ...).
      val attrs = props.getAsJsonArray("attributes")
      if (attrs != null) {
        for (a in attrs) {
          if (!a.isJsonObject) continue
          val text = a.asJsonObject.get("text")?.asString ?: continue
          val value = a.asJsonObject.get("value")?.asString.orEmpty()
          if (text.startsWith("data-cb-func") && value.startsWith("Date.")) return true
        }
      }
    }
    return false
  }

  /** True for "1"/"true"/"yes" JSON primitives. */
  private fun isTruthy(el: JsonElement?): Boolean =
      el != null &&
          !el.isJsonNull &&
          el.isJsonPrimitive &&
          (el.asString == "1" || el.asString == "true" || el.asString == "yes")

  /**
   * Builds the workflow-change-log params object for one node, adding a `blockedSql` flag (+ the
   * blocking reasons and the sanitized query) when the node is an FC_SQL_STATEMENT whose statement
   * was blocked by [sanitizeSqlQuery]. The change-log frontend uses these flags to render an error
   * icon/message and to auto-open the log.
   */
  private fun workflowLogParams(nodeType: String?, nodeParams: Any?): JsonObject {
    val obj =
        (gson
            .toJsonTree(nodeParams ?: emptyMap<String, Any>())
            .takeIf { it.isJsonObject }
            ?.asJsonObject) ?: JsonObject()
    if (nodeType != "FC_SQL_STATEMENT") return obj
    val rawMap = nodeParams as? Map<*, *>
    val sql = rawMap?.get("sql") as? String ?: rawMap?.get("query") as? String ?: ""
    val result = sanitizeSqlQuery(sql)
    if (result.blocked) {
      obj.addProperty("blockedSql", true)
      obj.add("blockedSqlReasons", gson.toJsonTree(result.blockedReasons))
      obj.addProperty("sql", result.sanitized)
    }
    return obj
  }

  private fun buildNodeParamsJson(
      spec: WorkflowTaskSpec,
      workflowVersion: Any? = null,
      userContext: Any? = null
  ): String? {
    val nodeName = deriveNodeName(spec)
    val nodeDescription = spec.taskDescription ?: ""
    return when (spec.nodeType) {
      "FC_EMAIL" -> {
        val to = spec.nodeParams["to"] as? String ?: ""
        val subject = spec.nodeParams["subject"] as? String ?: ""
        // Some models emit the mail body under "message" instead of "body" — accept both, and as a
        // last resort derive a sensible default body so the email node is never left empty.
        val body =
            (spec.nodeParams["body"] as? String)?.takeIf { it.isNotBlank() }
                ?: (spec.nodeParams["message"] as? String)?.takeIf { it.isNotBlank() }
                ?: defaultEmailBody(subject)
        val from = spec.nodeParams["from"] as? String ?: ""
        val senderName = spec.nodeParams["senderName"] as? String ?: ""
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        @Suppress("UNCHECKED_CAST")
        val attachments =
            (spec.nodeParams["attachments"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
        val bodyFormatType = "HTML"
        val toJson = if (to.isNotBlank()) "[${gson.toJson(to)}]" else "[]"
        val multiFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ""","multiFile":{"resources":[{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}],"attachmentFilter":[]}"""
            } else if (attachments.isNotEmpty()) {
              val resourcesJson =
                  attachments.joinToString(",") { id ->
                    """{"type":"UPLOAD","identifier":${gson.toJson(id)}}"""
                  }
              ""","multiFile":{"resources":[$resourcesJson],"attachmentFilter":[]}"""
            } else ""
        """{"name":${gson.toJson(nodeName)},"to":$toJson,"cc":[],"bcc":[],"subject":${gson.toJson(subject)},"body":${gson.toJson(body)},"plainBody":${gson.toJson(body)},"bodyFormatType":${gson.toJson(bodyFormatType)},"from":${gson.toJson(from)},"senderName":${gson.toJson(senderName)}$multiFileJson}"""
      }
      "FC_DOI_INIT" -> {
        // The AI often emits the recipient/sender under "recipient"/"sender" instead of "to"/"from"
        // — accept both.
        val to =
            (spec.nodeParams["to"] as? String)?.takeIf { it.isNotBlank() }
                ?: (spec.nodeParams["recipient"] as? String)
                ?: ""
        val subject = spec.nodeParams["subject"] as? String ?: ""
        // Accept "body"/"message"; as a last resort derive a short default so the invitation text
        // is never empty.
        val body =
            (spec.nodeParams["body"] as? String)?.takeIf { it.isNotBlank() }
                ?: (spec.nodeParams["message"] as? String)?.takeIf { it.isNotBlank() }
                ?: defaultEmailBody(subject)
        val from =
            (spec.nodeParams["from"] as? String)?.takeIf { it.isNotBlank() }
                ?: (spec.nodeParams["sender"] as? String)
                ?: ""
        val senderName = spec.nodeParams["senderName"] as? String ?: ""
        val successPage = spec.nodeParams["successPage"] as? String ?: ""
        val failurePage = spec.nodeParams["failurePage"] as? String ?: ""
        val toJson = if (to.isNotBlank()) "[${gson.toJson(to)}]" else "[]"
        logger.info(
            "[AICodBiAssistant] buildNodeParams FC_DOI_INIT: successPage='{}', failurePage='{}', workflowVersion=null?{}, userContext=null?{}",
            successPage,
            failurePage,
            workflowVersion == null,
            userContext == null)
        val successPageJson =
            if (successPage.isNotBlank() && workflowVersion != null && userContext != null) {
              val uuid = resolveCompletionPageUuid(userContext, workflowVersion, successPage)
              if (uuid != null) {
                val uuidStr = uuid.toString()
                ""","doiSuccessTemplate":{"entityClass":"TextTemplate","id":${gson.toJson(uuidStr)},"type":"TextTemplate","uuid":${gson.toJson(uuidStr)}}"""
              } else ""","doiSuccessTemplate":null"""
            } else ""","doiSuccessTemplate":null"""
        val failurePageJson =
            if (failurePage.isNotBlank() && workflowVersion != null && userContext != null) {
              val uuid = resolveCompletionPageUuid(userContext, workflowVersion, failurePage)
              logger.info(
                  "[AICodBiAssistant] buildNodeParams FC_DOI_INIT: resolveCompletionPageUuid('{}') returned {}",
                  failurePage,
                  uuid?.toString() ?: "null")
              if (uuid != null) {
                val uuidStr = uuid.toString()
                ""","doiFailTemplate":{"entityClass":"TextTemplate","id":${gson.toJson(uuidStr)},"type":"TextTemplate","uuid":${gson.toJson(uuidStr)}}"""
              } else ""","doiFailTemplate":null"""
            } else {
              logger.info(
                  "[AICodBiAssistant] buildNodeParams FC_DOI_INIT: SKIPPING doiFailTemplate â€” failurePage blank={}, workflowVersion null={}, userContext null={}",
                  failurePage.isBlank(),
                  workflowVersion == null,
                  userContext == null)
              ""","doiFailTemplate":null"""
            }
        val resultJson =
            """{"name":${gson.toJson(nodeName)},"to":$toJson,"from":${gson.toJson(from)},"senderName":${gson.toJson(senderName)},"subject":${gson.toJson(subject)},"body":${gson.toJson(body)},"plainBody":${gson.toJson(body)},"bodyFormatType":"HTML"$successPageJson$failurePageJson}"""
        logger.info("[AICodBiAssistant] buildNodeParams FC_DOI_INIT: final JSON={}", resultJson)
        resultJson
      }
      "FC_CHANGE_STATE" -> {
        val stateName = spec.nodeParams["stateName"] as? String ?: ""
        val stateUuid =
            if (workflowVersion != null && userContext != null)
                resolveStateUuid(userContext, workflowVersion, stateName)
            else null
        if (stateUuid != null) {
          """{"name":${gson.toJson(nodeName)},"targetState":{"uuid":${gson.toJson(stateUuid.toString())},"entityClass":"de.xima.fc.entities.WorkflowState"}}"""
        } else {
          """{"name":${gson.toJson(nodeName)},"targetState":null}"""
        }
      }
      "FC_POST_REQUEST" -> {
        val url = spec.nodeParams["url"] as? String ?: ""
        val method = (spec.nodeParams["method"] as? String ?: "POST").uppercase()
        val body = spec.nodeParams["body"] as? String ?: ""
        val contentType = (spec.nodeParams["contentType"] as? String ?: "JSON").uppercase()
        @Suppress("UNCHECKED_CAST")
        val headers =
            (spec.nodeParams["headers"] as? List<*>)?.filterIsInstance<Map<*, *>>()?.mapNotNull { h
              ->
              val name = h["name"] as? String ?: return@mapNotNull null
              val value = h["value"] as? String ?: ""
              """{"name":${gson.toJson(name)},"value":${gson.toJson(value)}}"""
            } ?: emptyList()
        val headersJson = "[${headers.joinToString(",")}]"
        // Named request parameters the user specified for the POST/form-data body. The AI emits
        // them
        // as {"name":...,"value":...} (the Formcycle placeholder syntax [%var%] is used to
        // reference
        // form fields AND form/global variables, e.g. "Seite" -> "[%Zielseite%]").
        @Suppress("UNCHECKED_CAST")
        val requestParameters =
            (spec.nodeParams["requestParameters"] as? List<*>)
                ?.filterIsInstance<Map<*, *>>()
                ?.mapNotNull { p ->
                  val name = p["name"] as? String ?: return@mapNotNull null
                  val value = p["value"] as? String ?: ""
                  """{"name":${gson.toJson(name)},"value":${gson.toJson(value)},"deletable":true,"required":false,"nameEditable":true,"valueEditable":true}"""
                } ?: emptyList()
        val requestParametersJson = "[${requestParameters.joinToString(",")}]"
        // Map contentType to httpRequestType enum:
        //   CUSTOM â€“ for JSON/PLAIN_TEXT/XML (body provided as customBodyContent)
        //   FORM_DATA â€“ for FORM_DATA (key-value pairs in requestParameters)
        //   URL â€“ for GET/DELETE/HEAD/OPTIONS OR when no body content is specified
        val asResponsePage = spec.nodeParams["asResponsePage"] as? Boolean ?: false
        val treat4xxAsNormal = spec.nodeParams["treat4xxAsNormal"] as? Boolean ?: false
        val treat5xxAsNormal = spec.nodeParams["treat5xxAsNormal"] as? Boolean ?: false
        // The formcycle HTTP request node is MODE-EXCLUSIVE: it sends EITHER named request
        // parameters (httpRequestType FORM_DATA) OR a raw body (httpRequestType CUSTOM), never
        // both.
        // When the AI provided BOTH a "body" AND "requestParameters", one of them would be silently
        // dropped depending on the derived mode — surface that here instead of losing data
        // silently.
        if (body.isNotBlank() && requestParameters.isNotEmpty()) {
          logger.warn(
              "[AICodBiAssistant] buildNodeParams FC_HTTP_REQUEST: AI provided BOTH 'body' and 'requestParameters' — " +
                  "the formcycle HTTP request node cannot send both simultaneously (mode is FORM_DATA or CUSTOM, not both). " +
                  "The '{}' mode will be used; the other input is dropped. The clarification prompt instructs the AI to " +
                  "ask the user whether the parameters should be sent as HTTP headers instead.",
              if (contentType == "FORM_DATA") "FORM_DATA" else "CUSTOM")
        }
        val httpRequestType =
            when {
              method == "GET" || method == "DELETE" || method == "HEAD" || method == "OPTIONS" ->
                  "URL"
              contentType == "FORM_DATA" || requestParameters.isNotEmpty() -> "FORM_DATA"
              body.isBlank() -> "URL" // POST with no body content â†’ use URL type
              else -> "CUSTOM" // JSON, PLAIN_TEXT, XML â†’ custom body content
            }
        val nodeParamsJson =
            if (httpRequestType == "FORM_DATA") {
              """{"name":${gson.toJson(nodeName)},"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"FORM_DATA","sendAllFormValues":false,"requestParameters":$requestParametersJson,"headerParameters":$headersJson,"allowInvalidCertificates":false,"asResponsePage":$asResponsePage,"treat4xxAsNormal":$treat4xxAsNormal,"treat5xxAsNormal":$treat5xxAsNormal}"""
            } else if (httpRequestType == "URL") {
              """{"name":${gson.toJson(nodeName)},"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"URL","sendAllFormValues":false,"headerParameters":$headersJson,"allowInvalidCertificates":false,"asResponsePage":$asResponsePage,"treat4xxAsNormal":$treat4xxAsNormal,"treat5xxAsNormal":$treat5xxAsNormal}"""
            } else {
              """{"name":${gson.toJson(nodeName)},"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"CUSTOM","customBodyContent":${gson.toJson(body)},"customBodyContentType":${gson.toJson(contentType)},"headerParameters":$headersJson,"allowInvalidCertificates":false,"asResponsePage":$asResponsePage,"treat4xxAsNormal":$treat4xxAsNormal,"treat5xxAsNormal":$treat5xxAsNormal}"""
            }
        logger.info(
            "[AICodBiAssistant] buildNodeParams FC_HTTP_REQUEST: url='{}', httpVerb='{}', httpRequestType='{}', params={}",
            url,
            method,
            httpRequestType,
            nodeParamsJson)
        nodeParamsJson
      }
      "FC_CHANGE_FORM_VALUE" -> {
        @Suppress("UNCHECKED_CAST")
        val formValues =
            (spec.nodeParams["formValues"] as? List<*>)
                ?.filterIsInstance<Map<*, *>>()
                ?.mapNotNull { fv ->
                  val name = fv["name"] as? String ?: return@mapNotNull null
                  val value = fv["value"] as? String ?: ""
                  """{"name":${gson.toJson(name)},"value":${gson.toJson(value)}}"""
                } ?: emptyList()
        """{"name":${gson.toJson(nodeName)},"formValues":[${formValues.joinToString(",")}]}"""
      }
      "FC_LOG_ENTRY" -> {
        val message = spec.nodeParams["message"] as? String ?: ""
        val level = (spec.nodeParams["level"] as? String ?: "INFO").uppercase()
        """{"name":${gson.toJson(nodeName)},"comments":${gson.toJson(message)},"level":${gson.toJson(level)}}"""
      }
      "FC_REDIRECT" -> {
        val url = spec.nodeParams["url"] as? String ?: ""
        val urlTemplate = spec.nodeParams["urlTemplate"] as? String ?: ""
        @Suppress("UNCHECKED_CAST")
        val queryParams =
            (spec.nodeParams["queryParams"] as? List<*>)
                ?.filterIsInstance<Map<*, *>>()
                ?.mapNotNull { qp ->
                  val name = qp["name"] as? String ?: return@mapNotNull null
                  val value = qp["value"] as? String ?: ""
                  """{"name":${gson.toJson(name)},"value":${gson.toJson(value)},"deletable":true,"required":false,"nameEditable":true,"valueEditable":true}"""
                } ?: emptyList()
        val queryStringJson = "[${queryParams.joinToString(",")}]"
        if (urlTemplate.isNotBlank() && workflowVersion != null && userContext != null) {
          val uuid = resolveUrlTemplateUuid(userContext, workflowVersion, urlTemplate)
          logger.info(
              "[AICodBiAssistant] buildNodeParams FC_REDIRECT: urlTemplate='{}' â†’ uuid={}, queryParams={}",
              urlTemplate,
              uuid?.toString() ?: "null",
              queryStringJson)
          if (uuid != null) {
            val uuidStr = uuid.toString()
            """{"name":${gson.toJson(nodeName)},"urlManual":"","urlTemplate":{"entityClass":"TextTemplate","id":${gson.toJson(uuidStr)},"type":"TextTemplate","uuid":${gson.toJson(uuidStr)}},"queryStringValues":$queryStringJson}"""
          } else {
            """{"name":${gson.toJson(nodeName)},"urlManual":"","urlTemplate":null,"queryStringValues":$queryStringJson}"""
          }
        } else {
          """{"name":${gson.toJson(nodeName)},"urlManual":${gson.toJson(url)},"queryStringValues":$queryStringJson}"""
        }
      }
      "FC_SEND_FORM_RECORD_MESSAGE" -> {
        val message = spec.nodeParams["message"] as? String ?: ""
        val senderName = spec.nodeParams["senderName"] as? String ?: ""
        val subject = spec.nodeParams["subject"] as? String ?: ""
        val email = spec.nodeParams["email"] as? String ?: ""
        val recipientType = spec.nodeParams["recipientType"] as? String ?: ""
        val recipientEmail = spec.nodeParams["recipientEmail"] as? String ?: ""
        val recipientInboxId = spec.nodeParams["recipientInboxId"] as? String ?: ""
        val recipientMessageService = spec.nodeParams["recipientMessageService"] as? String ?: ""
        @Suppress("UNCHECKED_CAST")
        val attachmentIds =
            (spec.nodeParams["attachments"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
        val receiverJson =
            when (recipientType.uppercase()) {
              "LATEST_SUBMITTER" -> ""","receiver":{"type":"LATEST_SUBMITTER"}"""
              "INITIAL_SUBMITTER" -> ""","receiver":{"type":"INITIAL_SUBMITTER"}"""
              "EMAIL" -> ""","receiver":{"type":"EMAIL","email":${gson.toJson(recipientEmail)}}"""
              "INBOX_ID" ->
                  ""","receiver":{"type":"INBOX_ID","inboxId":${gson.toJson(recipientInboxId)},"messageService":${gson.toJson(recipientMessageService)}}"""
              else -> ""
            }
        val attachmentsJson =
            if (attachmentIds.isNotEmpty()) {
              val resourcesJson =
                  attachmentIds.joinToString(",") { id ->
                    """{"type":"UPLOAD","identifier":${gson.toJson(id)}}"""
                  }
              ""","attachments":{"resources":[$resourcesJson],"attachmentFilter":[]}"""
            } else ""
        """{"name":${gson.toJson(nodeName)},"messageContent":${gson.toJson(message)},"senderName":${gson.toJson(senderName)},"subject":${gson.toJson(subject)},"email":${gson.toJson(email)}$receiverJson$attachmentsJson}"""
      }
      "FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS" -> {
        val changeType = (spec.nodeParams["changeType"] as? String ?: "OPEN").uppercase()
        val recipientType = spec.nodeParams["recipientType"] as? String ?: ""
        val recipientEmail = spec.nodeParams["recipientEmail"] as? String ?: ""
        val recipientInboxId = spec.nodeParams["recipientInboxId"] as? String ?: ""
        val recipientMessageService = spec.nodeParams["recipientMessageService"] as? String ?: ""
        val changeTypeJson = if (changeType == "CLOSE") "CLOSE" else "OPEN"
        val targetChatUserJson =
            when (recipientType.uppercase()) {
              "LATEST_SUBMITTER" -> ""","targetChatUser":{"type":"LATEST_SUBMITTER"}"""
              "INITIAL_SUBMITTER" -> ""","targetChatUser":{"type":"INITIAL_SUBMITTER"}"""
              "EMAIL" ->
                  ""","targetChatUser":{"type":"EMAIL","email":${gson.toJson(recipientEmail)}}"""
              "INBOX_ID" ->
                  ""","targetChatUser":{"type":"INBOX_ID","inboxId":${gson.toJson(recipientInboxId)},"messageService":${gson.toJson(recipientMessageService)}}"""
              else -> ""
            }
        """{"name":${gson.toJson(nodeName)},"changeType":"$changeTypeJson"$targetChatUserJson}"""
      }
      "FC_CREATE_TEXT_FILE" -> {
        val fileName = spec.nodeParams["fileName"] as? String ?: "output.txt"
        val fileContent = spec.nodeParams["fileContent"] as? String ?: ""
        val contentType = (spec.nodeParams["contentType"] as? String ?: "PLAIN_TEXT").uppercase()
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"fileName":${gson.toJson(fileName)},"fileContent":${gson.toJson(fileContent)},"contentType":${gson.toJson(contentType)}}"""
      }
      "FC_WRITE_FORM_RECORD_ATTRIBUTES" -> {
        @Suppress("UNCHECKED_CAST")
        val attributes =
            (spec.nodeParams["attributes"] as? List<*>)
                ?.filterIsInstance<Map<*, *>>()
                ?.mapNotNull { a ->
                  val name = a["name"] as? String ?: return@mapNotNull null
                  val value = a["value"] as? String ?: ""
                  """{"name":${gson.toJson(name)},"value":${gson.toJson(value)}}"""
                } ?: emptyList()
        val writeAttributesToForm = spec.nodeParams["writeAttributesToForm"] as? Boolean ?: false
        logger.info(
            "[AICodBiAssistant] buildNodeParams FC_WRITE_FORM_RECORD_ATTRIBUTES: {} attributes, writeAttributesToForm={}",
            attributes.size,
            writeAttributesToForm)
        """{"name":${gson.toJson(nodeName)},"customAttributes":[${attributes.joinToString(",")}],"writeAttributesToForm":$writeAttributesToForm}"""
      }
      "FC_PROVIDE_RESOURCE" -> {
        val exportName = spec.nodeParams["exportName"] as? String ?: ""
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}},"exportName":${gson.toJson(exportName)},"fileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION"}},"exportName":${gson.toJson(exportName)},"fileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
        }
      }
      "FC_ENCODE_BASE64" -> {
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}},"attachmentFilter":[]}"""
        } else {
          val fileName = spec.nodeParams["file"] as? String ?: ""
          val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
          if (fileUuid != null) {
            val uuidStr = fileUuid.toString()
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"resource":{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}},"attachmentFilter":[]}}"""
          } else {
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"searchFilename":${gson.toJson(fileName)},"attachmentFilter":["FORM_UPLOAD"]}}"""
          }
        }
      }
      "FC_DECODE_BASE64" -> {
        val base64 = spec.nodeParams["base64"] as? String ?: ""
        val exportName = spec.nodeParams["exportName"] as? String ?: ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"base64":${gson.toJson(base64)},"decodedFileProvision":{"attachToFormRecord":true,"attachmentAccessibleToEndUser":true},"exportName":${gson.toJson(exportName)}}"""
      }
      "FC_RETURN_FILE" -> {
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        val forceDownload = spec.nodeParams["forceDownload"] as? Boolean ?: true
        val deleteAfter = spec.nodeParams["deleteFileAfterDownload"] as? Boolean ?: false
        if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}],"attachmentFilter":[]},"forceDownload":$forceDownload,"deleteFileAfterDownload":$deleteAfter}"""
        } else {
          val fileName = spec.nodeParams["fileName"] as? String ?: ""
          val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
          if (fileUuid != null) {
            val uuidStr = fileUuid.toString()
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"forceDownload":$forceDownload,"deleteFileAfterDownload":$deleteAfter}"""
          } else {
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"forceDownload":$forceDownload,"deleteFileAfterDownload":$deleteAfter}"""
          }
        }
      }
      "FC_PROCESS_LOG_PDF" -> {
        val fileName = spec.nodeParams["fileName"] as? String ?: "prozess-meldungen.pdf"
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"fileName":${gson.toJson(fileName)},"logFileProvision":{"attachToFormRecord":true,"attachmentAccessibleToEndUser":true}}"""
      }
      "FC_EXPORT_FORM_RECORD_CHATS" -> {
        val exportName = spec.nodeParams["fileName"] as? String ?: "konversation.pdf"
        val attachToRecord = spec.nodeParams["attachToFormRecord"] as? Boolean ?: true
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"exportName":${gson.toJson(exportName)},"chatsFileProvision":{"attachToFormRecord":$attachToRecord,"attachmentAccessibleToEndUser":true}}"""
      }
      "FC_SHOW_TEMPLATE" -> {
        val templateName = spec.nodeParams["htmlTemplate"] as? String ?: ""
        logger.info(
            "[AICodBiAssistant] buildNodeParams FC_SHOW_TEMPLATE: htmlTemplate='{}', workflowVersion=null?{}, userContext=null?{}",
            templateName,
            workflowVersion == null,
            userContext == null)
        if (templateName.isNotBlank() && workflowVersion != null && userContext != null) {
          val uuid = resolveHtmlTemplateUuid(userContext, workflowVersion, templateName)
          logger.info(
              "[AICodBiAssistant] buildNodeParams FC_SHOW_TEMPLATE: resolveHtmlTemplateUuid('{}') returned {}",
              templateName,
              uuid?.toString() ?: "null")
          if (uuid != null) {
            val uuidStr = uuid.toString()
            // Match the exact pattern from doiFailTemplate: entityClass + id + type + uuid
            val result =
                """{"name":${gson.toJson(nodeName)},"htmlTemplate":{"entityClass":"TextTemplate","id":${gson.toJson(uuidStr)},"type":"TextTemplate","uuid":${gson.toJson(uuidStr)}}}"""
            logger.info(
                "[AICodBiAssistant] buildNodeParams FC_SHOW_TEMPLATE: FINAL JSON = {}", result)
            result
          } else {
            val result = """{"name":${gson.toJson(nodeName)},"htmlTemplate":null}"""
            logger.warn(
                "[AICodBiAssistant] buildNodeParams FC_SHOW_TEMPLATE: UUID was null, returning {}",
                result)
            result
          }
        } else {
          logger.info(
              "[AICodBiAssistant] buildNodeParams FC_SHOW_TEMPLATE: SKIPPING htmlTemplate â€” templateName blank={}, workflowVersion null={}, userContext null={}",
              templateName.isBlank(),
              workflowVersion == null,
              userContext == null)
          val result = """{"name":${gson.toJson(nodeName)},"htmlTemplate":null}"""
          result
        }
      }
      "FC_FILL_PDF" -> {
        val exportName = spec.nodeParams["exportName"] as? String ?: "filled.pdf"
        val flatten = spec.nodeParams["flatten"] as? Boolean ?: true
        val usedFont = spec.nodeParams["usedFont"] as? String ?: ""
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        val singleFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ""","singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}}"""
            } else {
              val fileName = spec.nodeParams["file"] as? String ?: ""
              val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
              if (fileUuid != null) {
                val uuidStr = fileUuid.toString()
                ""","singleFile":{"resource":{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}},"attachmentFilter":[]}"""
              } else if (fileName.isNotBlank()) {
                ""","singleFile":{"searchFilename":${gson.toJson(fileName)},"attachmentFilter":["FORM_UPLOAD"]}"""
              } else ""
            }
        val usedFontJson =
            if (usedFont.isNotBlank()) ""","usedFont":${gson.toJson(usedFont)}""" else ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"exportName":${gson.toJson(exportName)},"flatten":$flatten$usedFontJson$singleFileJson,"pdfFileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
      }
      "FC_FILL_WORD" -> {
        val exportName = spec.nodeParams["exportName"] as? String ?: "filled.docx"
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        val singleFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ""","singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}}"""
            } else {
              val fileName = spec.nodeParams["file"] as? String ?: ""
              val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
              if (fileUuid != null) {
                val uuidStr = fileUuid.toString()
                ""","singleFile":{"resource":{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}},"attachmentFilter":[]}"""
              } else if (fileName.isNotBlank()) {
                ""","singleFile":{"searchFilename":${gson.toJson(fileName)},"attachmentFilter":["FORM_UPLOAD"]}"""
              } else ""
            }
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"exportName":${gson.toJson(exportName)}$singleFileJson,"wordFileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
      }
      "FC_COMPRESS_AS_ZIP" -> {
        val compressedFileName = spec.nodeParams["compressedFileName"] as? String ?: "archive.zip"
        val namingScheme =
            (spec.nodeParams["namingScheme"] as? String ?: "FLAT_FILE_NAME_ONLY").uppercase()
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        val multiFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ""","multiFile":{"resources":[{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}],"attachmentFilter":[]}"""
            } else {
              @Suppress("UNCHECKED_CAST")
              val files =
                  (spec.nodeParams["files"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
              if (files.isNotEmpty()) {
                val resourcesJson =
                    files.joinToString(",") { f ->
                      """{"type":"UPLOAD","identifier":${gson.toJson(f)}}"""
                    }
                ""","multiFile":{"resources":[$resourcesJson],"attachmentFilter":[]}"""
              } else ""
            }
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"compressedFileName":${gson.toJson(compressedFileName)},"namingScheme":${gson.toJson(namingScheme)}$multiFileJson,"compressedFileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
      }
      "FC_SAVE_TO_FILE_SYSTEM" -> {
        val exportDirectory = spec.nodeParams["exportDirectory"] as? String ?: ""
        val allowPathInPlaceholder = exportDirectory.isNotBlank()
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        val multiFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ""","multiFile":{"resources":[{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}],"attachmentFilter":[]}"""
            } else {
              @Suppress("UNCHECKED_CAST")
              val files =
                  (spec.nodeParams["files"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
              if (files.isNotEmpty()) {
                val resourcesJson =
                    files.joinToString(",") { f ->
                      """{"type":"UPLOAD","identifier":${gson.toJson(f)}}"""
                    }
                ""","multiFile":{"resources":[$resourcesJson],"attachmentFilter":[]}"""
              } else ""
            }
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"exportDirectory":${gson.toJson(exportDirectory)},"allowPathInPlaceholder":$allowPathInPlaceholder$multiFileJson}"""
      }
      "FC_SAVE_TO_WEBDAV" -> {
        val path = spec.nodeParams["path"] as? String ?: ""
        val allowPathInPlaceholder = path.isNotBlank()
        val webdavConnection = spec.nodeParams["webdavConnection"] as? String ?: ""
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        val multiFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ""","multiFile":{"resources":[{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":${gson.toJson(nodeUuid)},"taskUuid":${gson.toJson(taskUuid)}}}],"attachmentFilter":[]}"""
            } else {
              @Suppress("UNCHECKED_CAST")
              val files =
                  (spec.nodeParams["files"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
              if (files.isNotEmpty()) {
                val resourcesJson =
                    files.joinToString(",") { f ->
                      """{"type":"UPLOAD","identifier":${gson.toJson(f)}}"""
                    }
                ""","multiFile":{"resources":[$resourcesJson],"attachmentFilter":[]}"""
              } else ""
            }
        val connJson =
            if (webdavConnection.isNotBlank())
                ""","webdavConnection":${gson.toJson(webdavConnection)}"""
            else ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"path":${gson.toJson(path)},"allowPathInPlaceholder":$allowPathInPlaceholder$connJson$multiFileJson}"""
      }
      "FC_COUNTER" -> {
        val counterName = spec.nodeParams["counterName"] as? String ?: ""
        val action = (spec.nodeParams["action"] as? String ?: "COUNT_UP").uppercase()
        val step = spec.nodeParams["step"] as? String ?: "1"
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"counterRef":{"nameRef":${gson.toJson(counterName)},"refType":"NAME_VALUE"},"actionType":${gson.toJson(action)},"step":${gson.toJson(step)}}"""
      }
      "FC_CHANGE_FORM_AVAILABILITY" -> {
        val changeType = (spec.nodeParams["changeType"] as? String ?: "SET_OFFLINE").uppercase()
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"changeType":${gson.toJson(changeType)}}"""
      }
      "de.xima.fc.plugin.fc_plugin_create_record.plugin.CreateRecordNodePlugin" -> {
        val projectName = spec.nodeParams["projectName"] as? String ?: ""
        val stateName = spec.nodeParams["stateName"] as? String ?: ""
        val copyAll = spec.nodeParams["copyAll"] as? Boolean ?: false
        @Suppress("UNCHECKED_CAST")
        val elementsToCopy =
            (spec.nodeParams["elementsToCopy"] as? List<*>)
                ?.filterIsInstance<Map<*, *>>()
                ?.mapNotNull { m ->
                  val name = m["name"] as? String ?: return@mapNotNull null
                  val value = m["value"] as? String ?: ""
                  """{"name":${gson.toJson(name)},"value":${gson.toJson(value)},"deletable":true,"nameEditable":true,"valueEditable":true,"required":false}"""
                } ?: emptyList()
        val elementsToCopyJson =
            if (elementsToCopy.isNotEmpty())
                ""","elementsToCopy":[${elementsToCopy.joinToString(",")}]"""
            else ""
        @Suppress("UNCHECKED_CAST")
        val files =
            (spec.nodeParams["files"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
        val multiFileJson =
            if (files.isNotEmpty()) {
              val resourcesJson =
                  files.joinToString(",") { f ->
                    """{"type":"UPLOAD","identifier":${gson.toJson(f)}}"""
                  }
              ""","otherAttachments":{"resources":[$resourcesJson],"attachmentFilter":[]},"copyOtherAttachments":true"""
            } else ""
        // Resolve project UUID via native SQL (H2 uppercases unquoted identifiers)
        var projectUuid: UUID? = null
        if (projectName.isNotBlank() && userContext != null) {
          try {
            val entityContextFactoryClass =
                Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
            val ucClass = Class.forName("de.xima.fc.user.UserContext")
            val entityContext =
                entityContextFactoryClass
                    .getMethod("newEntityContext", ucClass)
                    .invoke(null, userContext)
            val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
            val q =
                em.javaClass
                    .getMethod("createNativeQuery", String::class.java)
                    .invoke(em, "SELECT UUID FROM PROJEKT WHERE LOWER(NAME) = LOWER(?1)")
            q.javaClass
                .getMethod("setParameter", Int::class.java, Any::class.java)
                .invoke(q, 1, projectName)
            @Suppress("UNCHECKED_CAST")
            val results = q.javaClass.getMethod("getResultList").invoke(q) as List<*>
            if (results.isNotEmpty()) {
              val raw = results[0]?.toString()
              if (raw != null) projectUuid = UUID.fromString(raw)
            }
            entityContext.javaClass.getMethod("close").invoke(entityContext)
          } catch (e: Exception) {
            val causeMsg =
                if (e is java.lang.reflect.InvocationTargetException && e.cause != null) {
                  "${e.cause!!::class.simpleName}: ${e.cause!!.message}"
                } else {
                  "${e::class.simpleName}: ${e.message ?: "null"}"
                }
            logger.warn(
                "[AICodBiAssistant] Could not resolve project UUID for '{}': {}",
                projectName,
                causeMsg)
          }
        }
        val projectJson =
            if (projectUuid != null)
                ""","project":{"uuid":${gson.toJson(projectUuid.toString())},"entityClass":"de.xima.fc.entities.Projekt"}"""
            else ""
        // Resolve state UUID via native SQL
        var stateUuid: UUID? = null
        if (stateName.isNotBlank() && projectUuid != null && userContext != null) {
          try {
            val entityContextFactoryClass =
                Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
            val ucClass = Class.forName("de.xima.fc.user.UserContext")
            val entityContext =
                entityContextFactoryClass
                    .getMethod("newEntityContext", ucClass)
                    .invoke(null, userContext)
            val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
            val q =
                em.javaClass
                    .getMethod("createNativeQuery", String::class.java)
                    .invoke(
                        em,
                        "SELECT ws.UUID FROM WORKFLOW_STATE ws " +
                            "JOIN WORKFLOW_VERSION wv ON ws.VERSION_ID = wv.ID " +
                            "JOIN PROJEKT p ON wv.PROJECT_ID = p.ID OR wv.PROJEKT_ID = p.ID " +
                            "WHERE p.UUID = ?1 AND LOWER(ws.NAME) = LOWER(?2)")
            q.javaClass
                .getMethod("setParameter", Int::class.java, Any::class.java)
                .invoke(q, 1, projectUuid.toString())
            q.javaClass
                .getMethod("setParameter", Int::class.java, Any::class.java)
                .invoke(q, 2, stateName)
            @Suppress("UNCHECKED_CAST")
            val results = q.javaClass.getMethod("getResultList").invoke(q) as List<*>
            if (results.isNotEmpty()) {
              val raw = results[0]?.toString()
              if (raw != null) stateUuid = UUID.fromString(raw)
            }
            entityContext.javaClass.getMethod("close").invoke(entityContext)
          } catch (e: Exception) {
            val causeMsg =
                if (e is java.lang.reflect.InvocationTargetException && e.cause != null) {
                  "${e.cause!!::class.simpleName}: ${e.cause!!.message}"
                } else {
                  "${e::class.simpleName}: ${e.message ?: "null"}"
                }
            logger.warn(
                "[AICodBiAssistant] Could not resolve state UUID for '{}': {}", stateName, causeMsg)
          }
        }
        val stateJson =
            if (stateUuid != null)
                ""","stateNewRecord":{"uuid":${gson.toJson(stateUuid.toString())},"entityClass":"de.xima.fc.entities.WorkflowState"}"""
            else ""
        val pluginResult =
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"copyValues":true,"copyAll":$copyAll$projectJson$stateJson$elementsToCopyJson$multiFileJson}"""
        logger.info(
            "[AICodBiAssistant] CreateRecordNodePlugin JSON: projectName='{}', stateName='{}', projectUuid={}, stateUuid={}, result_len={}",
            projectName,
            stateName,
            projectUuid,
            stateUuid,
            pluginResult.length)
        pluginResult
      }
      "FC_DELETE_ATTACHMENT" -> {
        @Suppress("UNCHECKED_CAST")
        val attachments =
            (spec.nodeParams["attachments"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
        val resultJson =
            if (attachments.isNotEmpty()) {
              // Use attachmentsToDelete with MultiAttachment structure (decompiled from
              // FcDeleteAttachmentProps)
              // Property key must be "attachmentsToDelete" matching the field in
              // FcDeleteAttachmentProps class
              val attachmentItemsJson =
                  attachments.joinToString(",") { id ->
                    """{"type":"UPLOAD","identifier":${gson.toJson(id)}}"""
                  }
              val json =
                  """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"attachmentsToDelete":{"attachments":[$attachmentItemsJson]}}"""
              logger.info(
                  "[AICodBiAssistant] FC_DELETE_ATTACHMENT generated (attachmentsToDelete): {}",
                  json)
              json
            } else {
              """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
            }
        // Query existing FC_DELETE_ATTACHMENT nodes for structure reference
        try {
          val emfDecrypt = CodbiEntities.entityManagerFactory
          if (emfDecrypt != null) {
            val emDecrypt = emfDecrypt.createEntityManager()
            try {
              // Query all FC_DELETE_ATTACHMENT nodes (including manually configured) with full
              // columns
              val decryptQuery =
                  emDecrypt.createNativeQuery(
                      "SELECT id, ITEM_NAME, CAST(CUSTOM_PARAMS AS VARCHAR(3000)), CUSTOM_PARAMS_VER FROM workflow_node " +
                          "WHERE ITEM_TYPE = 'FC_DELETE_ATTACHMENT' AND CUSTOM_PARAMS IS NOT NULL " +
                          "ORDER BY id DESC")
              decryptQuery.maxResults = 5
              val decryptResults = decryptQuery.resultList
              for (row in decryptResults) {
                if (row is Array<*> && row.size >= 4) {
                  val nodeId = row[0]?.toString() ?: ""
                  val nodeName = row[1]?.toString() ?: ""
                  val rawParams = row[2]?.toString() ?: ""
                  val paramsVer = row[3]?.toString() ?: ""
                  // Check if params look like plain JSON (start with {) or encrypted (Base64)
                  val isEncrypted = rawParams.isNotEmpty() && !rawParams.trimStart().startsWith("{")
                  logger.info(
                      "[AICodBiAssistant] FC_DELETE_ATTACHMENT REF node id={}, name='{}', ver='{}', encrypted={}, params_preview={}",
                      nodeId,
                      nodeName,
                      paramsVer,
                      isEncrypted,
                      if (rawParams.length > 100) rawParams.take(100) + "..." else rawParams)
                }
              }
            } finally {
              emDecrypt.close()
            }
          }
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] FC_DELETE_ATTACHMENT ref query failed: ${e.message}")
        }
        resultJson
      }
      "FC_MOVE_FORM_RECORD_TO_INBOX" -> {
        @Suppress("UNCHECKED_CAST") val inboxName = spec.nodeParams["inboxName"] as? String ?: ""
        val targetType = spec.nodeParams["targetType"] as? String ?: ""
        if (inboxName.isNotBlank()) {
          val json =
              if (targetType == "COMPUTED_INBOX_NAME") {
                // AI explicitly wants runtime name lookup â€” use COMPUTED_INBOX_NAME
                """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"targetType":"COMPUTED_INBOX_NAME","inboxName":${gson.toJson(inboxName)}}"""
              } else {
                // Default: try to resolve inbox UUID via PostfachAPI
                var inboxUuid: String? = null
                if (workflowVersion != null && userContext != null) {
                  try {
                    val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
                    val postfachApi = apiProviderClass.getField("POSTFACH").get(null)
                    val getByMandantAndNameMethod =
                        postfachApi.javaClass.getMethod(
                            "getByMandantAndName",
                            Class.forName("de.xima.fc.user.UserContext"),
                            Class.forName("de.xima.fc.entities.Mandant"),
                            String::class.java)
                    val getProjektMethod = workflowVersion.javaClass.getMethod("getProjekt")
                    val projekt = getProjektMethod.invoke(workflowVersion)
                    val getMandantMethod = projekt.javaClass.getMethod("getMandant")
                    val mandant = getMandantMethod.invoke(projekt)
                    val postfach =
                        getByMandantAndNameMethod.invoke(
                            postfachApi, userContext, mandant, inboxName)
                    if (postfach != null) {
                      val getUUIDObjectMethod = postfach.javaClass.getMethod("getUUIDObject")
                      val uuidObj = getUUIDObjectMethod.invoke(postfach) as? java.util.UUID
                      if (uuidObj != null) {
                        inboxUuid = uuidObj.toString()
                        logger.info(
                            "[AICodBiAssistant] FC_MOVE_FORM_RECORD_TO_INBOX resolved inbox '{}' to UUID: {}",
                            inboxName,
                            inboxUuid)
                      }
                    } else {
                      logger.warn(
                          "[AICodBiAssistant] FC_MOVE_FORM_RECORD_TO_INBOX inbox '{}' not found by name",
                          inboxName)
                    }
                  } catch (e: Exception) {
                    logger.warn(
                        "[AICodBiAssistant] FC_MOVE_FORM_RECORD_TO_INBOX could not resolve inbox UUID: {}",
                        e.message)
                  }
                }
                if (inboxUuid != null) {
                  """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"targetType":"STATIC_INBOX","inboxReference":{"uuid":${gson.toJson(inboxUuid)},"entityClass":"de.xima.fc.entities.Postfach"}}"""
                } else {
                  """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"targetType":"COMPUTED_INBOX_NAME","inboxName":${gson.toJson(inboxName)}}"""
                }
              }
          logger.info("[AICodBiAssistant] FC_MOVE_FORM_RECORD_TO_INBOX generated: {}", json)
          json
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
        }
      }
      "FC_SET_FORM_RECORD_PASSWORD" -> {
        val targetType = spec.nodeParams["targetType"] as? String ?: ""
        if (targetType == "GENERATED_PASSWORD") {
          val generatedLength = spec.nodeParams["generatedLength"] as? Number ?: 10
          val policyRuleLowercase = spec.nodeParams["policyRuleLowercase"] as? Boolean ?: true
          val policyRuleUppercase = spec.nodeParams["policyRuleUppercase"] as? Boolean ?: true
          val policyRuleDigit = spec.nodeParams["policyRuleDigit"] as? Boolean ?: true
          val policyRuleSymbol = spec.nodeParams["policyRuleSymbol"] as? Boolean ?: true
          val policyRuleAlphabetical =
              spec.nodeParams["policyRuleAlphabetical"] as? Boolean ?: false
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"targetType":"GENERATED_PASSWORD","generatedLength":${generatedLength.toInt()},"policyRuleLowercase":$policyRuleLowercase,"policyRuleUppercase":$policyRuleUppercase,"policyRuleDigit":$policyRuleDigit,"policyRuleSymbol":$policyRuleSymbol,"policyRuleAlphabetical":$policyRuleAlphabetical}"""
        } else {
          val inputPassword =
              spec.nodeParams["inputPassword"] as? String
                  ?: spec.nodeParams["password"] as? String
                  ?: ""
          if (inputPassword.isNotBlank()) {
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"targetType":"MANUALLY_ENTERED_PASSWORD","inputPassword":${gson.toJson(inputPassword)}}"""
          } else {
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"targetType":"MANUALLY_ENTERED_PASSWORD","inputPassword":""}"""
          }
        }
      }
      "FC_QUEUE_TASK" -> {
        val eventName = spec.nodeParams["eventName"] as? String ?: ""
        val triggerUuid = spec.nodeParams["triggerUuid"] as? String ?: ""
        val uuid =
            if (triggerUuid.isNotBlank()) triggerUuid
            else java.util.UUID.nameUUIDFromBytes(eventName.toByteArray()).toString()
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"triggerToInvoke":{"uuid":"$uuid","taskUuid":""},"addToEnd":true}"""
      }
      "FC_THROW_EXCEPTION" -> {
        val errorMessage = spec.nodeParams["errorMessage"] as? String ?: ""
        val errorType =
            spec.nodeParams["errorType"] as? String ?: spec.nodeParams["errorCode"] as? String ?: ""
        val errorData = spec.nodeParams["errorData"] as? String ?: ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"errorMessage":${gson.toJson(errorMessage)},"errorType":${gson.toJson(errorType)},"errorData":${gson.toJson(errorData)}}"""
      }
      "FC_MULTIPLE_CONDITION" -> {
        // FC_MULTIPLE_CONDITION checks whether a form field value meets a condition.
        // The AI provides: fieldTechnicalId, comparator, compareValue.
        // _childNodes is handled separately in createWorkflowTask and must be excluded.
        // Schema based on decompiled BaseMultipleConditionProps + SingleCondition:
        //   combinationType: AND | OR | CUSTOM
        //   conditions: [{ matchCondition: EQUAL|NOT_EQUAL|CONTAINS|..., matchOperandLhs:
        // "[%techId%]", matchOperandRhs: "value", variableName: "" }]
        //   customExpression: "(C1 OR C2) AND C3" (when combinationType=CUSTOM)
        // matchOperandLhs uses [%technicalId%] notation to reference form fields.
        // EMatchCondition constants: EMPTY, NOT_EMPTY, EQUAL, NOT_EQUAL, CONTAINS,
        //   NOT_CONTAINS, GREATER, GREATER_THAN_OR_EQUAL, LESSER, LESS_THAN_OR_EQUAL,
        //   STARTS_WITH, NOT_STARTS_WITH, ENDS_WITH, NOT_ENDS_WITH, REGEX_MATCH, NOT_REGEX_MATCH
        val fieldTechnicalId = spec.nodeParams["fieldTechnicalId"] as? String ?: ""
        val comparator = spec.nodeParams["comparator"] as? String ?: "EQUAL"
        val compareValue = spec.nodeParams["compareValue"] as? String ?: ""
        val combinationType = spec.nodeParams["combinationType"] as? String ?: "AND"
        val customExpression = spec.nodeParams["customExpression"] as? String ?: ""
        // Wrap field technicalId in Formcycle placeholder notation
        val lhsRef = if (fieldTechnicalId.isNotBlank()) "[%$fieldTechnicalId%]" else ""
        // Build the condition entries array; single condition is the common case.
        // For multiple conditions, the AI can provide them in a "conditions" array.
        @Suppress("UNCHECKED_CAST")
        val conditions =
            (spec.nodeParams["conditions"] as? List<Map<String, Any>>)?.ifEmpty { null }
        val conditionsJson =
            if (conditions != null) {
              // Multiple conditions provided by AI.
              // variableName MUST be a simple single-word identifier (no spaces, no special chars)
              // because it is used as the variable reference in custom expressions like "(C1 OR C2)
              // AND C3".
              // Index-based naming (C1, C2, C3...) ensures unique, valid identifiers.
              conditions
                  .mapIndexed { idx, cond ->
                    val condFieldId = (cond["fieldTechnicalId"] as? String ?: fieldTechnicalId)
                    val condComparator = (cond["comparator"] as? String ?: comparator)
                    val condValue = (cond["compareValue"] as? String ?: "")
                    val condLhs = if (condFieldId.isNotBlank()) "[%$condFieldId%]" else ""
                    val variableName =
                        (cond["variableName"] as? String)?.takeIf { it.isNotBlank() }
                            ?: "C${idx + 1}"
                    """{"matchCondition":${gson.toJson(condComparator)},"matchOperandLhs":${gson.toJson(condLhs)},"matchOperandRhs":${gson.toJson(condValue)},"variableName":${gson.toJson(variableName)}}"""
                  }
                  .joinToString(",", "[", "]")
            } else {
              // Single condition from top-level params.
              // variableName MUST be a simple single-word identifier (no spaces).
              val variableName = spec.nodeParams["conditionVariableName"] as? String ?: "C1"
              """[{"matchCondition":${gson.toJson(comparator)},"matchOperandLhs":${gson.toJson(lhsRef)},"matchOperandRhs":${gson.toJson(compareValue)},"variableName":${gson.toJson(variableName)}}]"""
            }
        // Auto-derive sensible branch labels from the condition when AI doesn't provide them.
        // For single condition: "tf1 equals A" / "Not: tf1 equals A"
        // For multiple conditions: combine condition descriptions with "and"|"or" or use
        // expression.
        val compLabel = { raw: String ->
          when (raw.uppercase()) {
            "EMPTY" -> "is empty"
            "NOT_EMPTY" -> "is not empty"
            "EQUAL" -> "equals"
            "NOT_EQUAL" -> "not equals"
            "CONTAINS" -> "contains"
            "NOT_CONTAINS" -> "does not contain"
            "GREATER" -> "greater than"
            "GREATER_THAN_OR_EQUAL" -> "â‰¥"
            "LESSER" -> "less than"
            "LESS_THAN_OR_EQUAL" -> "â‰¤"
            "STARTS_WITH" -> "starts with"
            "NOT_STARTS_WITH" -> "does not start with"
            "ENDS_WITH" -> "ends with"
            "NOT_ENDS_WITH" -> "does not end with"
            "REGEX_MATCH" -> "matches"
            "NOT_REGEX_MATCH" -> "does not match"
            else -> raw.lowercase()
          }
        }
        val describeCond = { fieldId: String, comp: String, val_: String ->
          if (fieldId.isBlank()) ""
          else {
            val cl = compLabel(comp)
            val vs = if (val_.isNotBlank()) " $val_" else ""
            "$fieldId $cl$vs"
          }
        }
        val conditionDesc =
            if (conditions != null && conditions.isNotEmpty()) {
              // Multiple conditions â€” build a combined description
              val descs =
                  conditions
                      .mapIndexed { _, cond ->
                        val cf = (cond["fieldTechnicalId"] as? String ?: "")
                        val cc = (cond["comparator"] as? String ?: "EQUAL")
                        val cv = (cond["compareValue"] as? String ?: "")
                        describeCond(cf, cc, cv)
                      }
                      .filter { it.isNotBlank() }
              when (combinationType.uppercase()) {
                "AND" -> descs.joinToString(" and ")
                "OR" -> descs.joinToString(" or ")
                "CUSTOM" -> {
                  if (customExpression.isNotBlank()) "Expr: $customExpression"
                  else descs.joinToString(", ")
                }
                else -> descs.joinToString(", ")
              }
            } else {
              describeCond(fieldTechnicalId, comparator, compareValue)
            }
        val defaultLabelYes = if (conditionDesc.isNotBlank()) conditionDesc else "Yes"
        val defaultLabelNo = if (conditionDesc.isNotBlank()) "Not: $conditionDesc" else "No"
        val labelYes = spec.nodeParams["labelYes"] as? String ?: defaultLabelYes
        val labelNo = spec.nodeParams["labelNo"] as? String ?: defaultLabelNo
        val customExprJson =
            if (combinationType == "CUSTOM" && customExpression.isNotBlank()) {
              ""","customExpression":${gson.toJson(customExpression)}"""
            } else ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"labelYes":${gson.toJson(labelYes)},"labelNo":${gson.toJson(labelNo)},"combinationType":${gson.toJson(combinationType)},"conditions":$conditionsJson$customExprJson}"""
      }
      "FC_SWITCH" -> {
        // FC_SWITCH switches execution based on the value of a form field.
        // CUSTOM_PARAMS stores FcSwitchProps: {"switchValue":"[%techId%]","description":"..."}
        // _cases and _defaultChildNodes are handled separately in createWorkflowTask.
        val switchValue = spec.nodeParams["switchValue"] as? String ?: ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"switchValue":${gson.toJson(switchValue)}}"""
      }
      "FC_FOR_EACH_LOOP" -> {
        // FC_FOR_EACH_LOOP iterates over items and executes child nodes for each.
        // CUSTOM_PARAMS stores FcForEachLoopProps with sourceProps determining the item source.
        // The AI provides: fieldTechnicalId (for form field sources), csvString/delimiter (for
        // character-separated values), _childNodes.
        val sourceType =
            (spec.nodeParams["sourceType"] as? String ?: "FORM_FIELD_REPETITIONS").uppercase()
        val formFieldName =
            spec.nodeParams["fieldTechnicalId"] as? String
                ?: spec.nodeParams["formFieldName"] as? String
                ?: ""
        when (sourceType) {
          "CHARACTER_SEPARATED_VALUES" -> {
            // CHARACTER_SEPARATED_VALUES: iterate over values separated by a delimiter char.
            // Schema: ListItemSourcePropsCharacterSeparatedValues extends
            // AListItemSourcePropsCsvFormat
            // csvString can be a literal or [%fieldName%] placeholder referencing the form field.
            val csvString =
                spec.nodeParams["csvString"] as? String
                    ?: if (formFieldName.isNotBlank()) "[%$formFieldName%]" else ""
            val delimiter = (spec.nodeParams["delimiter"] as? String)?.ifBlank { "," } ?: ","
            val trim = (spec.nodeParams["trim"] as? String)?.lowercase() ?: "true"
            val filterEmpty = (spec.nodeParams["filterEmpty"] as? String)?.lowercase() ?: "true"
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"sourceProps":{"type":"characterSeparatedValues","csvString":${gson.toJson(csvString)},"delimiter":${gson.toJson(delimiter)},"trim":$trim,"filterEmpty":$filterEmpty,"treatLineBreaksAsDelimiter":false}}"""
          }
          else -> {
            // Default: FORM_FIELD_REPETITIONS â€” iterate over rows of a repeatable container.
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"sourceProps":{"type":"formFieldRepetitions","formFieldName":${gson.toJson(formFieldName)}}}"""
          }
        }
      }
      "FC_WHILE_LOOP" -> {
        // FC_WHILE_LOOP repeatedly executes child actions while a condition is true.
        // Uses the SAME condition schema as FC_MULTIPLE_CONDITION (combinationType + conditions
        // array
        // with matchCondition/matchOperandLhs/matchOperandRhs/variableName), but NO
        // labelYes/labelNo
        // because while-loops do not have YES/NO branches â€” they just loop or exit.
        val fieldTechnicalId = spec.nodeParams["fieldTechnicalId"] as? String ?: ""
        val comparator = spec.nodeParams["comparator"] as? String ?: "EQUAL"
        val compareValue = spec.nodeParams["compareValue"] as? String ?: ""
        val combinationType = spec.nodeParams["combinationType"] as? String ?: "AND"
        val customExpression = spec.nodeParams["customExpression"] as? String ?: ""
        val lhsRef = if (fieldTechnicalId.isNotBlank()) "[%$fieldTechnicalId%]" else ""
        @Suppress("UNCHECKED_CAST")
        val conditions =
            (spec.nodeParams["conditions"] as? List<Map<String, Any>>)?.ifEmpty { null }
        val conditionsJson =
            if (conditions != null) {
              conditions
                  .mapIndexed { idx, cond ->
                    val condFieldId = (cond["fieldTechnicalId"] as? String ?: fieldTechnicalId)
                    val condComparator = (cond["comparator"] as? String ?: comparator)
                    val condValue = (cond["compareValue"] as? String ?: "")
                    val condLhs = if (condFieldId.isNotBlank()) "[%$condFieldId%]" else ""
                    val variableName =
                        (cond["variableName"] as? String)?.takeIf { it.isNotBlank() }
                            ?: "C${idx + 1}"
                    """{"matchCondition":${gson.toJson(condComparator)},"matchOperandLhs":${gson.toJson(condLhs)},"matchOperandRhs":${gson.toJson(condValue)},"variableName":${gson.toJson(variableName)}}"""
                  }
                  .joinToString(",", "[", "]")
            } else {
              val variableName = spec.nodeParams["conditionVariableName"] as? String ?: "C1"
              """[{"matchCondition":${gson.toJson(comparator)},"matchOperandLhs":${gson.toJson(lhsRef)},"matchOperandRhs":${gson.toJson(compareValue)},"variableName":${gson.toJson(variableName)}}]"""
            }
        val customExprJson =
            if (combinationType == "CUSTOM" && customExpression.isNotBlank()) {
              ""","customExpression":${gson.toJson(customExpression)}"""
            } else ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"combinationType":${gson.toJson(combinationType)},"conditions":$conditionsJson$customExprJson}"""
      }
      "FC_DO_UNTIL_LOOP" -> {
        // FC_DO_UNTIL_LOOP executes child actions FIRST, then checks condition (post-check).
        // Uses the SAME condition schema as FC_WHILE_LOOP.
        val fieldTechnicalId = spec.nodeParams["fieldTechnicalId"] as? String ?: ""
        val comparator = spec.nodeParams["comparator"] as? String ?: "EQUAL"
        val compareValue = spec.nodeParams["compareValue"] as? String ?: ""
        val combinationType = spec.nodeParams["combinationType"] as? String ?: "AND"
        val customExpression = spec.nodeParams["customExpression"] as? String ?: ""
        val lhsRef = if (fieldTechnicalId.isNotBlank()) "[%$fieldTechnicalId%]" else ""
        @Suppress("UNCHECKED_CAST")
        val conditions =
            (spec.nodeParams["conditions"] as? List<Map<String, Any>>)?.ifEmpty { null }
        val conditionsJson =
            if (conditions != null) {
              conditions
                  .mapIndexed { idx, cond ->
                    val condFieldId = (cond["fieldTechnicalId"] as? String ?: fieldTechnicalId)
                    val condComparator = (cond["comparator"] as? String ?: comparator)
                    val condValue = (cond["compareValue"] as? String ?: "")
                    val condLhs = if (condFieldId.isNotBlank()) "[%$condFieldId%]" else ""
                    val variableName =
                        (cond["variableName"] as? String)?.takeIf { it.isNotBlank() }
                            ?: "C${idx + 1}"
                    """{"matchCondition":${gson.toJson(condComparator)},"matchOperandLhs":${gson.toJson(condLhs)},"matchOperandRhs":${gson.toJson(condValue)},"variableName":${gson.toJson(variableName)}}"""
                  }
                  .joinToString(",", "[", "]")
            } else {
              val variableName = spec.nodeParams["conditionVariableName"] as? String ?: "C1"
              """[{"matchCondition":${gson.toJson(comparator)},"matchOperandLhs":${gson.toJson(lhsRef)},"matchOperandRhs":${gson.toJson(compareValue)},"variableName":${gson.toJson(variableName)}}]"""
            }
        val customExprJson =
            if (combinationType == "CUSTOM" && customExpression.isNotBlank()) {
              ""","customExpression":${gson.toJson(customExpression)}"""
            } else ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"combinationType":${gson.toJson(combinationType)},"conditions":$conditionsJson$customExprJson}"""
      }
      "FC_SET_SAVED_FLAG",
      "FC_DELETE_FORM_RECORD",
      "FC_EMPTY",
      "FC_EXPERIMENT" -> {
        // These nodes do not have CUSTOM_PARAMS or are handled at a higher level.
        // FC_EMPTY: no-op, no params needed.
        // FC_EXPERIMENT: handled by createWorkflowTask (builds the try-catch-finally structure).
        // FC_SET_SAVED_FLAG: simple flag, no params needed.
        // FC_DELETE_FORM_RECORD: simple delete, no params needed.
        null
      }
      "FC_BREAK" -> {
        // FC_BREAK breaks out of a loop. By default (no breakTarget) it breaks the nearest
        // parent loop. Optionally, breakTarget can specify a NodeKey (uuid) of a different loop.
        val breakTarget = spec.nodeParams["breakTarget"] as? String
        if (!breakTarget.isNullOrBlank()) {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"breakTarget":{"uuid":${gson.toJson(breakTarget)}}}"""
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
        }
      }
      "FC_WITH_FORM_ELEMENT_CONTEXT" -> {
        // FC_WITH_FORM_ELEMENT_CONTEXT: scoping/container node.
        // CUSTOM_PARAMS stores FcWithFormElementContextProps with fieldValues and repetitions.
        // The _childNodes are handled separately in createWorkflowTask.
        val fieldValues = spec.nodeParams["fieldValues"] as? List<Map<String, Any>>
        val repetitions = spec.nodeParams["repetitions"] as? List<Map<String, Any>>
        val fieldValuesJson =
            if (fieldValues != null && fieldValues.isNotEmpty()) {
              fieldValues
                  .map { fv ->
                    val name = fv["name"] as? String ?: ""
                    val value = fv["value"] as? String ?: ""
                    """{"name":${gson.toJson(name)},"value":${gson.toJson(value)}}"""
                  }
                  .joinToString(",", "[", "]")
            } else "[]"
        val repetitionsJson =
            if (repetitions != null && repetitions.isNotEmpty()) {
              repetitions
                  .map { rep ->
                    val name = rep["name"] as? String ?: ""
                    val value = rep["value"] as? String ?: ""
                    """{"name":${gson.toJson(name)},"value":${gson.toJson(value)}}"""
                  }
                  .joinToString(",", "[", "]")
            } else "[]"
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"fieldValues":$fieldValuesJson,"repetitions":$repetitionsJson}"""
      }
      "FC_CONTINUE" -> {
        // FC_CONTINUE skips the rest of the current iteration and continues with the next
        // iteration of a loop. By default (no continueTarget) it continues the nearest
        // parent loop. Optionally, continueTarget can specify a NodeKey (uuid) of a different
        // loop (analogous to breakTarget for FC_BREAK).
        val continueTarget = spec.nodeParams["continueTarget"] as? String
        if (!continueTarget.isNullOrBlank()) {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"continueTarget":{"uuid":${gson.toJson(continueTarget)}}}"""
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
        }
      }
      "de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin" -> {
        // The CheckTrustLevelProps class has:
        //   trustLevels: List<ETrustLevel>  (NOT a single string!)
        //   dataSuffix: String
        // ETrustLevel enum values: USER_LOGIN, LOW, CERTIFICATE, EPA, UNKNOWN
        // Map the AI's trustLevel param to the correct enum value.
        val rawLevel = (spec.nodeParams["trustLevel"] as? String ?: "").lowercase()
        val mappedLevel =
            when {
              rawLevel.contains("elster") ||
                  rawLevel == "substantial" ||
                  rawLevel == "substanziell" ||
                  rawLevel == "erheblich" -> "CERTIFICATE"
              rawLevel.contains("eid") ||
                  rawLevel.contains("ausweis") ||
                  rawLevel == "hoch" ||
                  rawLevel == "high" -> "EPA"
              rawLevel.contains("fink") || rawLevel == "niedrig" || rawLevel == "low" -> "LOW"
              rawLevel == "user_login" ||
                  rawLevel == "normal" ||
                  rawLevel.contains("benutzer") ||
                  rawLevel.contains("passwort") -> "USER_LOGIN"
              rawLevel == "ohne" || rawLevel == "none" || rawLevel == "unknown" -> "UNKNOWN"
              rawLevel.isNotBlank() -> rawLevel.uppercase()
              else -> "USER_LOGIN"
            }
        // ETrustLevel is an enum; Jackson serializes it as its constant name (e.g. "CERTIFICATE").
        // The property trustLevels is List<ETrustLevel>, so we need a JSON array of enum names.
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"trustLevels":[${gson.toJson(mappedLevel)}],"dataSuffix":""}"""
      }
      "FC_SQL_STATEMENT" -> {
        // FC_SQL_STATEMENT runs a SQL statement against a configured database connection.
        // CUSTOM_PARAMS stores FcSqlStatementProps:
        //   databaseConnection: UuidEntityRef ->
        // {"uuid":"<uuid>","entityClass":"de.xima.fc.entities.DatenbankZugriff"}
        //   query: String (the SQL text — the property shown in the node editor)
        //   queryParameters: List<Setting<String>>
        //   useClientDatabaseQuery: boolean
        // The AI provides nodeParams: {"connection":"<connection name>","sql":"<SQL text>"}.
        val connectionName = spec.nodeParams["connection"] as? String ?: ""
        val rawQuery =
            spec.nodeParams["sql"] as? String ?: spec.nodeParams["query"] as? String ?: ""
        // Block destructive DDL / multi-statement SQL before it is persisted: the effective query
        // becomes a placeholder and the node is flagged, so no destructive statement reaches the
        // DB.
        val sanitizedSql = sanitizeSqlQuery(rawQuery)
        val query = sanitizedSql.sanitized
        val connectionUuid =
            if (connectionName.isNotBlank() && workflowVersion != null)
                resolveDatabaseConnectionUuid(workflowVersion, connectionName)
            else null
        val connectionJson =
            if (connectionUuid != null) {
              """{"uuid":${gson.toJson(connectionUuid.toString())},"entityClass":"de.xima.fc.entities.DatenbankZugriff"}"""
            } else "null"
        val blockedJson =
            if (sanitizedSql.blocked) {
              ""","codbiSqlBlocked":true,"codbiSqlBlockedReasons":${gson.toJson(sanitizedSql.blockedReasons)}"""
            } else ""
        logger.info(
            "[AICodBiAssistant] buildNodeParams FC_SQL_STATEMENT: connection='{}' resolved={} query='{}' blocked={}",
            connectionName,
            connectionUuid != null,
            query,
            sanitizedSql.blocked)
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"databaseConnection":$connectionJson,"query":${gson.toJson(query)},"queryParameters":[],"useClientDatabaseQuery":false$blockedJson}"""
      }
      "de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin" -> {
        // AKDB E-Payment (ePayBL) — initializes a payment for the current form record and
        // redirects the user to the configured PayPage. CUSTOM_PARAMS deserializes into
        // de.xima.akdb.epay.logic.model.epayment.node.EPayBLActionNodeProps (ePayBL >= 5.x),
        // so the AI nodeParams use the SAME property names (Jackson camelCase).
        //   paymentClient: { connection:
        // {"uuid":"...","entityClass":"de.xima.fc.entities.DatenbankZugriff"},
        //                    clientNumber, bewirtschafterNumber, haushaltsstelle, objectNumber,
        //                    kennzeichenMahnverfahren, duePeriod }
        //   customerData: { salutation, firstname, lastname, email, companyName }
        //   orderConfig: { orderItemDefs[]: { id, itemNumber, description, amount, documentNumber,
        //                haushaltsstelle, objectNumber, href, formElementName, isRequired,
        //                defaultQuantity, quantity, bookingText, taxRate } }
        //   address: { useAddress, zipCode, location, street, houseNumber, country, postbox }
        //   bankAccount: { useBankAccount, bic, iban, owner }
        //   dueDate, payPageBookingText, baseUrl: String; preventPayPageRedirect: boolean
        val ePayParams = spec.nodeParams
        fun ePayObj(key: String): String {
          val raw = ePayParams[key]
          return if (raw != null) gson.toJson(raw) else "null"
        }
        fun ePayStr(key: String): String = gson.toJson(ePayParams[key] as? String ?: "")
        fun ePayBool(key: String): String = gson.toJson((ePayParams[key] as? Boolean) ?: false)
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"paymentClient":${ePayObj("paymentClient")},"preventPayPageRedirect":${ePayBool("preventPayPageRedirect")},"dueDate":${ePayStr("dueDate")},"payPageBookingText":${ePayStr("payPageBookingText")},"baseUrl":${ePayStr("baseUrl")},"customerData":${ePayObj("customerData")},"orderConfig":${ePayObj("orderConfig")},"address":${ePayObj("address")},"bankAccount":${ePayObj("bankAccount")}}"""
      }
      "de.xima.akdb.postbox.plugin.node.PostboxPlugin" -> {
        // AKDB BayernID Postbox — sends a message (and optional attachments) to the citizen's
        // BayernID Postbox. CUSTOM_PARAMS deserializes into
        // de.xima.akdb.postbox.model.node.PostboxProps, so the AI nodeParams use the SAME
        // property names (Jackson camelCase).
        //   akdbClient: { service, client }
        //   message: { subject, body }
        //   id: String (recipient Postbox id), idFromFormRecordAttr: boolean
        //   link, suffixBkData: String, trustLevelAccess: boolean, attachments: (resource list)
        val postboxParams = spec.nodeParams
        fun postboxObj(key: String): String {
          val raw = postboxParams[key]
          return if (raw != null) gson.toJson(raw) else "null"
        }
        fun postboxStr(key: String): String = gson.toJson(postboxParams[key] as? String ?: "")
        fun postboxBool(key: String): String =
            gson.toJson((postboxParams[key] as? Boolean) ?: false)
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"attachments":${postboxObj("attachments")},"akdbClient":${postboxObj("akdbClient")},"id":${postboxStr("id")},"idFromFormRecordAttr":${postboxBool("idFromFormRecordAttr")},"link":${postboxStr("link")},"message":${postboxObj("message")},"suffixBkData":${postboxStr("suffixBkData")},"trustLevelAccess":${postboxBool("trustLevelAccess")}}"""
      }
      "de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin" -> {
        // CMIS (fc-plugin-cmis) — creates/updates an object (document/folder) in a CMIS repository.
        // CUSTOM_PARAMS deserializes into de.xima.fc.fc_plugin_cmis.model.CmisNodeProps.
        //   connection: CmisConnection object; multiFile: files to upload
        //   objectName, folderPath, objectType (e.g. "Document"), objectTypeId,
        //   properties: [{"name":"...","value":"..."}], dateTimeFormat: "yyyy-MM-dd" style
        //   flags: useExistingFolder, createUnfilingObject, addVersionNumber, activateVersioning,
        //          updateProperties, findObjectsById, useNoFileExtension
        val cmisParams = spec.nodeParams
        fun cmisObj(key: String): String {
          val raw = cmisParams[key]
          return if (raw != null) gson.toJson(raw) else "null"
        }
        fun cmisStr(key: String): String = gson.toJson(cmisParams[key] as? String ?: "")
        fun cmisBool(key: String): String = gson.toJson((cmisParams[key] as? Boolean) ?: false)
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"connection":${cmisObj("connection")},"multiFile":${cmisObj("multiFile")},"objectName":${cmisStr("objectName")},"objectType":${cmisStr("objectType")},"objectTypeId":${cmisStr("objectTypeId")},"properties":${cmisObj("properties")},"folderPath":${cmisStr("folderPath")},"useExistingFolder":${cmisBool("useExistingFolder")},"createUnfilingObject":${cmisBool("createUnfilingObject")},"addVersionNumber":${cmisBool("addVersionNumber")},"activateVersioning":${cmisBool("activateVersioning")},"updateProperties":${cmisBool("updateProperties")},"findObjectsById":${cmisBool("findObjectsById")},"useNoFileExtension":${cmisBool("useNoFileExtension")},"dateTimeFormat":${cmisStr("dateTimeFormat")}}"""
      }
      "de.xima.fc.fc_plugin_cmis.plugin.CmisQueryActionPlugin" -> {
        // CMIS (fc-plugin-cmis) — runs a CMISQL query against a CMIS repository.
        // CUSTOM_PARAMS deserializes into de.xima.fc.fc_plugin_cmis.model.CmisQueryNodeProps.
        val cmisQueryParams = spec.nodeParams
        fun cmisQObj(key: String): String {
          val raw = cmisQueryParams[key]
          return if (raw != null) gson.toJson(raw) else "null"
        }
        fun cmisQStr(key: String): String = gson.toJson(cmisQueryParams[key] as? String ?: "")
        fun cmisQInt(key: String): String =
            gson.toJson((cmisQueryParams[key] as? Number)?.toInt() ?: 0)
        fun cmisQBool(key: String): String =
            gson.toJson((cmisQueryParams[key] as? Boolean) ?: false)
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"connection":${cmisQObj("connection")},"query":${cmisQStr("query")},"maxHits":${cmisQInt("maxHits")},"includeAllVersions":${cmisQBool("includeAllVersions")}}"""
      }
      "de.xima.regisafe.plugin.node.UploadDocumentPlugin" -> {
        // RegiSafe (plugin-bundle-regisafe) — uploads files as a document into the RegiSafe DMS.
        // CUSTOM_PARAMS deserializes into de.xima.regisafe.model.node.UploadDocumentProps.
        //   files: files to upload; documentId: target document id
        //   serviceConfig: {"serviceUrl":"...","loginId":"...","pwd":"...","apiId":"..."}
        //   metadata: [{"name":"...","value":"...","formElementName":"...","dynamic":false}]
        val regiParams = spec.nodeParams
        fun regiObj(key: String): String {
          val raw = regiParams[key]
          return if (raw != null) gson.toJson(raw) else "null"
        }
        fun regiStr(key: String): String = gson.toJson(regiParams[key] as? String ?: "")
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"files":${regiObj("files")},"metadata":${regiObj("metadata")},"serviceConfig":${regiObj("serviceConfig")},"documentId":${regiStr("documentId")}}"""
      }
      else -> """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
    }
  }

  /**
   * Fetches the available workflow states for a given workflow version and returns them as a JSON
   * string array of state names (e.g. `["Received", "Abgesendet", ...]`). Returns null if the
   * states cannot be loaded.
   */
  private fun fetchWorkflowStates(userContext: Any, workflowVersionId: Long): String? {
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val workflowVersionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
      val workflowVersion =
          workflowVersionApi.javaClass
              .getMethod(
                  "getById",
                  Class.forName("de.xima.fc.user.UserContext"),
                  Long::class.javaObjectType)
              .invoke(workflowVersionApi, userContext, workflowVersionId) ?: return null
      val states = loadWorkflowStates(userContext, workflowVersion)
      if (states.isEmpty()) return null
      val names =
          states.mapNotNull { state ->
            try {
              state.javaClass.getMethod("getName").invoke(state) as? String
            } catch (_: Exception) {
              null
            }
          }
      gson.toJson(names)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not fetch workflow states: {}", e.message)
      null
    }
  }

  private fun loadWorkflowStates(userContext: Any, workflowVersion: Any): List<Any> {
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val stateApi = apiProviderClass.getField("WORKFLOW_STATE_API").get(null)
      val workflowVersionClass = Class.forName("de.xima.fc.entities.WorkflowVersion")
      val userContextClass = Class.forName("de.xima.fc.user.UserContext")
      @Suppress("UNCHECKED_CAST")
      stateApi.javaClass
          .getMethod("getAllByWorkflowVersion", userContextClass, workflowVersionClass)
          .invoke(stateApi, userContext, workflowVersion) as? List<Any> ?: emptyList()
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not load workflow states: {}", e.message)
      emptyList()
    }
  }

  private fun resolveStateUuid(userContext: Any, workflowVersion: Any, stateName: String): UUID? {
    if (stateName.isBlank()) return null
    return try {
      val states = loadWorkflowStates(userContext, workflowVersion)
      val firstState = states.firstOrNull() ?: return null
      val getNameMethod = firstState.javaClass.getMethod("getName")
      val getUuidMethod = firstState.javaClass.getMethod("getUUIDObject")
      states
          .firstOrNull { state ->
            (getNameMethod.invoke(state) as? String)?.equals(stateName, ignoreCase = true) == true
          }
          ?.let { state -> getUuidMethod.invoke(state) as? UUID }
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not resolve state UUID for '{}': {}", stateName, e.message)
      null
    }
  }

  private fun resolveFirstStateUuid(userContext: Any, workflowVersion: Any): UUID? {
    return try {
      val states = loadWorkflowStates(userContext, workflowVersion)
      val firstState = states.firstOrNull() ?: return null
      firstState.javaClass.getMethod("getUUIDObject").invoke(firstState) as? UUID
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not resolve first state UUID: {}", e.message)
      null
    }
  }

  /**
   * Resolves the UUID of a completion page (Abschlussseite) by its name. Uses JPQL with known
   * FORMCYCLE entity class names first, then falls back to native SQL with schema discovery.
   */
  private fun resolveCompletionPageUuid(
      userContext: Any,
      workflowVersion: Any,
      pageName: String
  ): UUID? {
    if (pageName.isBlank()) return null
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      val project =
          workflowVersion.javaClass.getMethod("getProject").invoke(workflowVersion) ?: return null
      val projectId = project.javaClass.getMethod("getId").invoke(project) as? Long ?: return null

      // Strategy 1: Try JPQL navigating from Projekt entity (collection property)
      val projektCollectionProperties =
          listOf(
              "p.abschlussSeiten",
              "p.completionPages",
              "p.projektAbschlussSeiten",
              "p.absclussSeiten")
      for (collectionPath in projektCollectionProperties) {
        try {
          val jpql =
              "SELECT cp FROM de.xima.fc.entities.Projekt p JOIN $collectionPath cp WHERE p.id = :pid AND cp.name = :name"
          val query = em.createQuery(jpql)
          query.setParameter("pid", projectId)
          query.setParameter("name", pageName)
          val results = query.resultList
          if (results.isNotEmpty()) {
            val cp = results[0] ?: continue
            val uuid = cp.javaClass.getMethod("getUUIDObject").invoke(cp) as? UUID
            if (uuid != null) {
              logger.info(
                  "[AICodBiAssistant] Resolved completion page '{}' to UUID {} via Projekt collection '$collectionPath'",
                  pageName,
                  uuid)
              return uuid
            }
          }
        } catch (_: Exception) {
          continue
        }
      }

      // Strategy 2: Try JPQL with known entity class names
      val entityClasses =
          listOf(
              "de.xima.fc.entities.ProjectDOIData",
              "de.xima.fc.entities.CompletionPage",
              "de.xima.fc.entities.ProjektAbschlussSeite",
              "de.xima.fc.entities.AbschlussSeite",
              "de.xima.fc.entities.ProjektAbschluss",
              "de.xima.fc.entities.Abschluss")
      for (entityClass in entityClasses) {
        try {
          // First check if entity is mapped by trying COUNT query
          val countQuery = em.createQuery("SELECT COUNT(cp) FROM $entityClass cp")
          val totalCount = (countQuery.singleResult as? Number)?.toLong() ?: continue
          if (totalCount == 0L) continue

          // Fetch all and filter programmatically - avoids property path issues
          val fetchQuery = em.createQuery("SELECT cp FROM $entityClass cp")
          fetchQuery.maxResults = 200
          @Suppress("UNCHECKED_CAST")
          val allResults = (fetchQuery.resultList as? List<Any>) ?: continue
          val methods =
              if (allResults.isNotEmpty()) allResults[0].javaClass.methods else emptyArray()
          val getters =
              methods.filter { m ->
                m.name.startsWith("get") && m.parameterCount == 0 && m.name != "getClass"
              }

          // Determine name field - try getName first, then look for alternatives
          val nameGetter =
              getters.firstOrNull { it.name == "getName" }
                  ?: getters.firstOrNull {
                    it.name.contains("ame", ignoreCase = true) &&
                        it.returnType == String::class.java
                  }
                  ?: getters.firstOrNull {
                    it.name.contains("itle", ignoreCase = true) &&
                        it.returnType == String::class.java
                  }

          // Determine UUID field
          val uuidGetter =
              getters.firstOrNull { it.name == "getUUIDObject" }
                  ?: getters.firstOrNull {
                    it.name == "getUuid" && it.returnType == String::class.java
                  }

          if (nameGetter == null || uuidGetter == null) continue

          // Determine project filtering
          val projectIdGetters = listOf("getProjektId", "getProjectId")
          var projectIdGetter: java.lang.reflect.Method? = null
          for (gName in projectIdGetters) {
            try {
              projectIdGetter = allResults[0].javaClass.getMethod(gName)
              break
            } catch (_: Exception) {}
          }

          // Try object reference getters for project
          val projectRefGetters =
              getters.filter { m ->
                !m.name.startsWith("getC") &&
                    (m.name.contains("Projekt", ignoreCase = true) ||
                        m.name.contains("Project", ignoreCase = true)) &&
                    m.returnType != String::class.java
              }

          for (cp in allResults) {
            try {
              val cpName = nameGetter.invoke(cp) as? String ?: continue
              if (!cpName.equals(pageName, ignoreCase = true)) continue

              // Check project membership
              val matchesProject =
                  if (projectIdGetter != null) {
                    try {
                      projectIdGetter.invoke(cp)?.toString() == projectId.toString()
                    } catch (_: Exception) {
                      false
                    }
                  } else if (projectRefGetters.isNotEmpty()) {
                    projectRefGetters.any { getter ->
                      try {
                        val ref = getter.invoke(cp)
                        ref?.javaClass?.getMethod("getId")?.invoke(ref)?.toString() ==
                            projectId.toString()
                      } catch (_: Exception) {
                        false
                      }
                    }
                  } else {
                    // Can't filter by project - return first name match
                    true
                  }

              if (!matchesProject) continue

              val uuid =
                  if (uuidGetter.name == "getUUIDObject") uuidGetter.invoke(cp) as? UUID
                  else
                      try {
                        UUID.fromString(uuidGetter.invoke(cp) as? String ?: "")
                      } catch (_: Exception) {
                        null
                      }

              if (uuid != null) {
                logger.info(
                    "[AICodBiAssistant] Resolved completion page '{}' to UUID {} via JPQL entity '{}'",
                    pageName,
                    uuid,
                    entityClass)
                return uuid
              }
            } catch (_: Exception) {
              continue
            }
          }
        } catch (_: Exception) {
          continue
        }
      }

      // Strategy 3: Native SQL with schema discovery (expanded table names)
      val possibleTables =
          listOf(
              "TEMPLATE_CLIENT",
              "FORM_TEMPLATE",
              "PROJECT_DOI_DATA",
              "COMPLETION_PAGE",
              "PROJEKT_ABSCHLUSS_SEITE",
              "PROJEKTABSCHLUSSSEITE",
              "PROJECT_COMPLETION_PAGE",
              "ABSCHLUSS_SEITE",
              "ABSCHLUSSSEITE",
              "FORM_COMPLETION_PAGE",
              "WORKFLOW_COMPLETION_PAGE",
              "PROJEKT_ABSCHLUSS",
              "PROJEKTABSCHLUSS")
      for (tableName in possibleTables) {
        try {
          val nameColQuery =
              em.createNativeQuery(
                  "SELECT column_name FROM information_schema.columns WHERE table_name = :tbl AND (column_name IN ('NAME', 'BEZEICHNUNG', 'TITLE', 'UUID')) ORDER BY ordinal_position")
          nameColQuery.setParameter("tbl", tableName)
          val cols = nameColQuery.resultList.map { it.toString().uppercase() }
          if (cols.isEmpty()) continue
          val hasUuidCol = "UUID" in cols
          val nameCol =
              when {
                "NAME" in cols -> "NAME"
                "BEZEICHNUNG" in cols -> "BEZEICHNUNG"
                "TITLE" in cols -> "TITLE"
                else -> continue
              }
          val idCol = if (hasUuidCol) "UUID" else "ID"
          // Discover the correct project column name dynamically
          val projectColQuery =
              em.createNativeQuery(
                  "SELECT column_name FROM information_schema.columns WHERE table_name = :tbl AND (column_name = 'PROJECT_ID' OR column_name = 'PROJEKT_ID' OR column_name = 'PROJEKTID' OR column_name = 'FK_PROJEKT') ORDER BY ordinal_position")
          projectColQuery.setParameter("tbl", tableName)
          val pcols = projectColQuery.resultList
          val projectCol = if (pcols.isNotEmpty()) pcols[0].toString() else null
          val sql =
              if (projectCol != null)
                  "SELECT $idCol FROM $tableName WHERE $nameCol = :name AND $projectCol = :pid"
              else "SELECT $idCol FROM $tableName WHERE $nameCol = :name"
          val query = em.createNativeQuery(sql)
          query.setParameter("name", pageName)
          if (projectCol != null) query.setParameter("pid", projectId)
          val results = query.resultList
          if (results.isNotEmpty()) {
            val raw = results[0].toString()
            return try {
              UUID.fromString(raw)
            } catch (_: Exception) {
              UUID.nameUUIDFromBytes(raw.toByteArray())
            }
          }
        } catch (_: Exception) {
          continue
        }
      }
      logger.warn(
          "[AICodBiAssistant] Completion page '{}' not found in any table for project $projectId",
          pageName)
      return null
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not resolve completion page UUID for '{}': {}",
          pageName,
          e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * Resolves the UUID of an HTML template by its name. Queries the same set of template-related
   * tables as [fetchHtmlTemplates], using JPQL first then native SQL with schema discovery.
   */
  private fun resolveHtmlTemplateUuid(
      userContext: Any,
      workflowVersion: Any,
      templateName: String
  ): UUID? {
    if (templateName.isBlank()) return null
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      val project =
          workflowVersion.javaClass.getMethod("getProject").invoke(workflowVersion) ?: return null
      val projectId = project.javaClass.getMethod("getId").invoke(project) as? Long ?: return null

      // Strategy 1: Try JPQL with known entity class names
      val entityClasses =
          listOf(
              "de.xima.fc.entities.ClientTemplate",
              "de.xima.fc.entities.TextTemplate",
              "de.xima.fc.entities.FormTemplate",
              "de.xima.fc.entities.ProjectDOIData",
              "de.xima.fc.entities.CompletionPage",
              "de.xima.fc.entities.ProjektAbschlussSeite",
              "de.xima.fc.entities.AbschlussSeite",
              "de.xima.fc.entities.ProjektAbschluss",
              "de.xima.fc.entities.Abschluss")
      for (entityClass in entityClasses) {
        try {
          val jpql =
              "SELECT t FROM $entityClass t WHERE t.name = :name AND (t.project.id = :pid OR t.projekt.id = :pid)"
          val query = em.createQuery(jpql)
          query.setParameter("name", templateName)
          query.setParameter("pid", projectId)
          val results = query.resultList
          if (results.isNotEmpty()) {
            val t = results[0] ?: continue
            val uuid =
                try {
                  t.javaClass.getMethod("getUUIDObject").invoke(t) as? UUID
                } catch (_: Exception) {
                  try {
                    val s = t.javaClass.getMethod("getUuid").invoke(t) as? String
                    if (s != null) UUID.fromString(s) else null
                  } catch (_: Exception) {
                    null
                  }
                }
            if (uuid != null) {
              logger.info(
                  "[AICodBiAssistant] Resolved HTML template '{}' to UUID {} via JPQL entity '{}'",
                  templateName,
                  uuid,
                  entityClass)
              return uuid
            }
          }
        } catch (_: Exception) {
          continue
        }
      }

      // Strategy 2: Try JPQL navigating from Projekt entity (collection property)
      val projektCollectionProperties =
          listOf(
              "p.abschlussSeiten",
              "p.completionPages",
              "p.projektAbschlussSeiten",
              "p.absclussSeiten")
      for (collectionPath in projektCollectionProperties) {
        try {
          val jpql =
              "SELECT cp FROM de.xima.fc.entities.Projekt p JOIN $collectionPath cp WHERE p.id = :pid AND cp.name = :name"
          val query = em.createQuery(jpql)
          query.setParameter("pid", projectId)
          query.setParameter("name", templateName)
          val results = query.resultList
          if (results.isNotEmpty()) {
            val cp = results[0] ?: continue
            val uuid = cp.javaClass.getMethod("getUUIDObject").invoke(cp) as? UUID
            if (uuid != null) {
              logger.info(
                  "[AICodBiAssistant] Resolved HTML template '{}' to UUID {} via Projekt collection '$collectionPath'",
                  templateName,
                  uuid)
              return uuid
            }
          }
        } catch (_: Exception) {
          continue
        }
      }

      // Strategy 3: Native SQL with schema discovery
      val possibleTables =
          listOf(
              "TEMPLATE_CLIENT",
              "FORM_TEMPLATE",
              "TEXT_TEMPLATE",
              "CLIENT_TEMPLATE",
              "PROJECT_DOI_DATA",
              "COMPLETION_PAGE",
              "PROJEKT_ABSCHLUSS_SEITE",
              "PROJEKTABSCHLUSSSEITE",
              "PROJECT_COMPLETION_PAGE",
              "ABSCHLUSS_SEITE",
              "ABSCHLUSSSEITE",
              "FORM_COMPLETION_PAGE",
              "WORKFLOW_COMPLETION_PAGE",
              "PROJEKT_ABSCHLUSS",
              "PROJEKTABSCHLUSS")
      for (tableName in possibleTables) {
        try {
          val nameColQuery =
              em.createNativeQuery(
                  "SELECT column_name FROM information_schema.columns WHERE table_name = :tbl AND (column_name IN ('NAME', 'BEZEICHNUNG', 'TITLE', 'UUID')) ORDER BY ordinal_position")
          nameColQuery.setParameter("tbl", tableName)
          val cols = nameColQuery.resultList.map { it.toString().uppercase() }
          if (cols.isEmpty()) continue
          val hasUuidCol = "UUID" in cols
          val nameCol =
              when {
                "NAME" in cols -> "NAME"
                "BEZEICHNUNG" in cols -> "BEZEICHNUNG"
                "TITLE" in cols -> "TITLE"
                else -> continue
              }
          val idCol = if (hasUuidCol) "UUID" else "ID"
          val projectColQuery =
              em.createNativeQuery(
                  "SELECT column_name FROM information_schema.columns WHERE table_name = :tbl AND (column_name = 'PROJECT_ID' OR column_name = 'PROJEKT_ID' OR column_name = 'PROJEKTID' OR column_name = 'FK_PROJEKT') ORDER BY ordinal_position")
          projectColQuery.setParameter("tbl", tableName)
          val pcols = projectColQuery.resultList
          val projectCol = if (pcols.isNotEmpty()) pcols[0].toString() else null
          val sql =
              if (projectCol != null)
                  "SELECT $idCol FROM $tableName WHERE $nameCol = :name AND $projectCol = :pid"
              else "SELECT $idCol FROM $tableName WHERE $nameCol = :name"
          val query = em.createNativeQuery(sql)
          query.setParameter("name", templateName)
          if (projectCol != null) query.setParameter("pid", projectId)
          val results = query.resultList
          if (results.isNotEmpty()) {
            val raw = results[0].toString()
            return try {
              UUID.fromString(raw)
            } catch (_: Exception) {
              UUID.nameUUIDFromBytes(raw.toByteArray())
            }
          }
        } catch (_: Exception) {
          continue
        }
      }

      logger.warn(
          "[AICodBiAssistant] HTML template '{}' not found in any table for project $projectId",
          templateName)
      return null
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not resolve HTML template UUID for '{}': {}",
          templateName,
          e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * Fetches available URL templates (same source as HTML templates â€” the TEMPLATE_CLIENT table).
   * URL templates are named URLs stored in the system that can be referenced by FC_REDIRECT nodes.
   */
  private fun fetchUrlTemplates(userContext: Any, workflowVersionId: Long): String? =
      fetchHtmlTemplates(userContext, workflowVersionId)

  /** Resolves the UUID of a URL template by its name. */
  private fun resolveUrlTemplateUuid(
      userContext: Any,
      workflowVersion: Any,
      templateName: String
  ): UUID? = resolveHtmlTemplateUuid(userContext, workflowVersion, templateName)

  // endregion Workflow Creation

  // region JSON Utilities

  private fun extractJson(text: String): String {
    val start = text.indexOfFirst { it == '{' || it == '[' }
    if (start < 0) return text
    val opener = text[start]
    val closer = if (opener == '{') '}' else ']'
    var depth = 0
    var inString = false
    var escape = false
    for (i in start until text.length) {
      val c = text[i]
      if (escape) {
        escape = false
        continue
      }
      if (c == '\\' && inString) {
        escape = true
        continue
      }
      if (c == '"') {
        inString = !inString
        continue
      }
      if (!inString) {
        if (c == opener) depth++
        else if (c == closer) {
          depth--
          if (depth == 0) return text.substring(start, i + 1)
        }
      }
    }
    return text.substring(start)
  }

  private fun jsonResponse(json: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.JSON, json))

  // endregion JSON Utilities

  /**
   * Resolves a database connection (DatenbankZugriff / ZUGRIFF_DB) by its display name to its UUID.
   * Used to populate FcSqlStatementProps.databaseConnection (a UuidEntityRef) for FC_SQL_STATEMENT.
   * The lookup is scoped to the workflow version's client/mandant when determinable. Returns null
   * if the connection cannot be found.
   */
  private fun resolveDatabaseConnectionUuid(workflowVersion: Any?, connectionName: String): UUID? {
    if (connectionName.isBlank()) return null
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      var mandantId: Long? = null
      try {
        val project = workflowVersion?.javaClass?.getMethod("getProject")?.invoke(workflowVersion)
        val mandant = project?.javaClass?.getMethod("getMandant")?.invoke(project)
        mandantId = mandant?.javaClass?.getMethod("getId")?.invoke(mandant) as? Long
      } catch (_: Exception) {
        mandantId = null
      }
      // Strategy 1: JPQL against the DatenbankZugriff entity (scoped to the client when known)
      try {
        val jpql =
            if (mandantId != null)
                "SELECT c FROM de.xima.fc.entities.DatenbankZugriff c WHERE c.name = :name AND c.mandant.id = :mid"
            else "SELECT c FROM de.xima.fc.entities.DatenbankZugriff c WHERE c.name = :name"
        val query = em.createQuery(jpql)
        query.setParameter("name", connectionName)
        if (mandantId != null) query.setParameter("mid", mandantId)
        val results = query.resultList
        if (results.isNotEmpty()) {
          val conn = results[0] ?: return null
          val uuid = conn.javaClass.getMethod("getUUIDObject").invoke(conn) as? UUID
          if (uuid != null) {
            logger.info(
                "[AICodBiAssistant] Resolved database connection '{}' to UUID {} via JPQL",
                connectionName,
                uuid)
            return uuid
          }
        }
      } catch (_: Exception) {
        // fall through to native SQL
      }
      // Strategy 2: Native SQL against ZUGRIFF_DB with schema discovery
      try {
        val nameColQuery =
            em.createNativeQuery(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'ZUGRIFF_DB' AND (column_name IN ('NAME', 'BEZEICHNUNG')) ORDER BY ordinal_position")
        val cols = nameColQuery.resultList.map { it.toString().uppercase() }
        val nameCol =
            when {
              "NAME" in cols -> "NAME"
              "BEZEICHNUNG" in cols -> "BEZEICHNUNG"
              else -> return null
            }
        val clientColQuery =
            em.createNativeQuery(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'ZUGRIFF_DB' AND (column_name IN ('CLIENT_ID', 'MANDANT_ID', 'MANDANTID', 'FK_MANDANT')) ORDER BY ordinal_position")
        val ccols = clientColQuery.resultList
        val clientCol = if (ccols.isNotEmpty()) ccols[0].toString() else null
        val sql =
            if (clientCol != null && mandantId != null)
                "SELECT UUID FROM ZUGRIFF_DB WHERE $nameCol = :name AND $clientCol = :mid"
            else "SELECT UUID FROM ZUGRIFF_DB WHERE $nameCol = :name"
        val query = em.createNativeQuery(sql)
        query.setParameter("name", connectionName)
        if (clientCol != null && mandantId != null) query.setParameter("mid", mandantId)
        val results = query.resultList
        if (results.isNotEmpty()) {
          val raw = results[0].toString()
          val uuid =
              try {
                UUID.fromString(raw)
              } catch (_: Exception) {
                null
              }
          if (uuid != null) {
            logger.info(
                "[AICodBiAssistant] Resolved database connection '{}' to UUID {} via native SQL",
                connectionName,
                uuid)
            return uuid
          }
        }
      } catch (_: Exception) {
        logger.warn(
            "[AICodBiAssistant] Could not resolve database connection '{}' (native SQL failed)",
            connectionName)
      }
    } finally {
      em.close()
    }
    logger.warn("[AICodBiAssistant] Database connection '{}' not found", connectionName)
    return null
  }

  /**
   * Resolves the UUID of a project-level file resource by its filename. Queries the
   * RESOURCE_PROJECT table to find a file matching the given name for the workflow version's
   * project. Returns null if the file is not found.
   */
  private fun resolveProjectFileUuid(
      userContext: Any?,
      workflowVersion: Any?,
      fileName: String
  ): UUID? {
    if (fileName.isBlank() || workflowVersion == null || userContext == null) return null
    return try {
      val project =
          workflowVersion.javaClass.getMethod("getProject").invoke(workflowVersion) ?: return null
      val projectId = project.javaClass.getMethod("getId").invoke(project) as? Long ?: return null
      val emf = CodbiEntities.entityManagerFactory ?: return null
      val em = emf.createEntityManager()
      try {
        // Try RESOURCE_PROJECT table (project-level file resources â€” form's file management
        // section)
        // Try schema discovery first: find tables with project_id + name columns
        var foundUuid: UUID? = null
        val schemaTables = mutableListOf<String>()
        try {
          val schemaQuery =
              em.createNativeQuery(
                  "SELECT LOWER(table_name), LOWER(column_name) FROM information_schema.columns " +
                      "WHERE LOWER(table_name) LIKE '%resource%' OR LOWER(table_name) LIKE '%file%' " +
                      "ORDER BY table_name, ordinal_position")
          val schemaRows = schemaQuery.resultList
          val tableCols = mutableMapOf<String, MutableList<String>>()
          for (row in schemaRows) {
            if (row is Array<*>) {
              val t = row[0]?.toString() ?: continue
              val col = row[1]?.toString() ?: continue
              tableCols.getOrPut(t) { mutableListOf() }.add(col)
            }
          }
          // DEBUG: Log all discovered table schemas for file resource debugging
          for ((tbl, cols) in tableCols) {
            logger.warn(
                "[AICodBiAssistant] DEBUG resolveProjectFileUuid: table='{}' columns={}",
                tbl,
                cols.joinToString(", "))
          }
          // Fallback: log ALL tables matching resource/file patterns even without expected columns
          logger.warn(
              "[AICodBiAssistant] DEBUG resolveProjectFileUuid: discovered {} resource/file tables",
              tableCols.size)
          for ((tbl, cols) in tableCols) {
            val hasProjId =
                cols.any { it == "project_id" || it == "projekt_id" || it == "fk_projekt" }
            val hasName =
                cols.any {
                  it == "name" || it == "filename" || it == "bezeichnung" || it == "dateiname"
                }
            val idCol =
                when {
                  "uuid" in cols -> "uuid"
                  "id" in cols -> "id"
                  else -> null
                }
            val nameCol =
                when {
                  "name" in cols -> "name"
                  "filename" in cols -> "filename"
                  "bezeichnung" in cols -> "bezeichnung"
                  "dateiname" in cols -> "dateiname"
                  else -> null
                }
            val projCol =
                when {
                  "project_id" in cols -> "project_id"
                  "projekt_id" in cols -> "projekt_id"
                  "fk_projekt" in cols -> "fk_projekt"
                  else -> null
                }
            if (hasProjId && nameCol != null && idCol != null && projCol != null) {
              schemaTables.add(tbl)
              try {
                val sql = "SELECT $idCol FROM $tbl WHERE $projCol = ?1 AND $nameCol = ?2"
                val q = em.createNativeQuery(sql)
                q.setParameter(1, projectId)
                q.setParameter(2, fileName)
                val results = q.resultList
                if (results.isNotEmpty()) {
                  val idStr = results[0]?.toString() ?: continue
                  foundUuid =
                      try {
                        UUID.fromString(idStr)
                      } catch (_: Exception) {
                        if (idCol == "id") UUID.nameUUIDFromBytes(idStr.toByteArray()) else null
                      }
                  if (foundUuid != null) break
                }
              } catch (_: Exception) {
                continue
              }
            }
          }
        } catch (_: Exception) {}
        if (foundUuid != null) return foundUuid
        // Fallback: table registry + query combinations
        val nameCols = listOf("name", "filename", "bezeichnung", "dateiname")
        val projCols = listOf("project_id", "projekt_id", "fk_projekt")
        val tableNames =
            if (schemaTables.isNotEmpty()) schemaTables
            else
                listOf(
                    "RESOURCE_PROJECT",
                    "FILE_RESOURCE_PROJECT",
                    "FILE_PROJECT",
                    "PROJEKTRESSOURCE",
                    "PROJEKT_RESSOURCE",
                    "PROJECT_RESOURCE",
                    "RESSOURCE_PROJEKT",
                    "RESOURCE_PROJECT",
                    "PROJEKT_DATEI")
        for (tableName in tableNames) {
          for (nameCol in nameCols) {
            for (projCol in projCols) {
              for (idCol in listOf("uuid", "id")) {
                try {
                  val sql = "SELECT $idCol FROM $tableName WHERE $projCol = ?1 AND $nameCol = ?2"
                  val q = em.createNativeQuery(sql)
                  q.setParameter(1, projectId)
                  q.setParameter(2, fileName)
                  val results = q.resultList
                  if (results.isNotEmpty()) {
                    val idStr = results[0]?.toString() ?: continue
                    return try {
                      UUID.fromString(idStr)
                    } catch (_: Exception) {
                      if (idCol == "id") UUID.nameUUIDFromBytes(idStr.toByteArray()) else null
                    }
                  }
                } catch (_: Exception) {
                  continue
                }
              }
            }
          }
        }
        null
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not resolve project file UUID for '$fileName': ${e.message}")
      null
    }
  }

  /**
   * Derives a meaningful node name from the workflow spec when the AI's taskName is blank or
   * generic. Uses the nodeType and key nodeParams to generate a human-readable description. The
   * result is sanitized to only allow characters valid for FORMCYCLE node names.
   */
  private fun deriveNodeName(spec: WorkflowTaskSpec): String {
    val raw = spec.taskName.trim()
    if (raw.isNotBlank() && !raw.equals("AI-generated task", ignoreCase = true)) {
      return sanitizeWorkflowName(raw)
    }
    val result =
        when (spec.nodeType) {
          "FC_RETURN_FILE" -> {
            val fileName = spec.nodeParams["fileName"] as? String
            if (!fileName.isNullOrBlank()) "Download ${fileName.take(40)}"
            else "Return file to browser"
          }
          "FC_CREATE_TEXT_FILE" -> {
            val content = spec.nodeParams["fileContent"] as? String
            val fileName = spec.nodeParams["fileName"] as? String
            when {
              !content.isNullOrBlank() -> "Create ${content.take(20)} text file"
              !fileName.isNullOrBlank() -> "Create $fileName"
              else -> "Create text file"
            }
          }
          "FC_EMAIL" -> {
            val subject = spec.nodeParams["subject"] as? String
            if (!subject.isNullOrBlank()) "Send email ${subject.take(40)}" else "Send email"
          }
          "FC_POST_REQUEST" -> {
            val url = spec.nodeParams["url"] as? String
            if (!url.isNullOrBlank()) "POST to ${url.take(40)}" else "Send HTTP request"
          }
          "FC_REDIRECT" -> {
            val url = spec.nodeParams["url"] as? String
            val tmpl = spec.nodeParams["urlTemplate"] as? String
            when {
              !tmpl.isNullOrBlank() -> "Redirect to template $tmpl"
              !url.isNullOrBlank() -> "Redirect to ${url.take(40)}"
              else -> "Redirect user"
            }
          }
          "FC_CHANGE_STATE" -> {
            val state = spec.nodeParams["stateName"] as? String
            if (!state.isNullOrBlank()) "Set status to $state" else "Change form state"
          }
          "FC_LOG_ENTRY" -> {
            val message = spec.nodeParams["message"] as? String
            if (!message.isNullOrBlank()) "Log ${message.take(30)}" else "Write log entry"
          }
          "FC_SHOW_TEMPLATE" -> {
            val template = spec.nodeParams["htmlTemplate"] as? String
            if (!template.isNullOrBlank()) "Show $template" else "Show template"
          }
          "FC_DOI_INIT" -> "Send DOI email"
          "FC_CHANGE_FORM_VALUE" -> "Set form field values"
          "FC_SEND_FORM_RECORD_MESSAGE" -> "Send record message"
          "FC_SET_SAVED_FLAG" -> "Mark record as saved"
          "FC_DELETE_FORM_RECORD" -> "Delete form record"
          "FC_DELETE_ATTACHMENT" -> "Delete attachment"
          "de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin" ->
              "Check authentication trust level"
          "FC_COUNTER" -> "Increment counter"
          "FC_PROMPT_QUERY" -> "Prompt user query"
          "FC_COMPRESS_AS_ZIP" -> "Compress as ZIP"
          "FC_FILL_PDF" -> "Fill PDF"
          "FC_FILL_WORD" -> "Fill Word document"
          "FC_SAVE_TO_FILE_SYSTEM" -> "Save to file system"
          "FC_SAVE_TO_WEBDAV" -> "Save to WebDAV"
          "FC_EXPORT_TO_XML" -> "Export to XML"
          "FC_EXPORT_TO_PERSISTENCE" -> "Export to persistence"
          "FC_LDAP_QUERY" -> "LDAP query"
          "FC_ENCODE_BASE64" -> "Encode Base64"
          "FC_DECODE_BASE64" -> "Decode Base64"
          "FC_MOVE_FORM_RECORD_TO_INBOX" -> "Move record to inbox"
          "FC_CHANGE_FORM_AVAILABILITY" -> "Change form availability"
          "FC_CHANGE_FORM_RECORD_ACTIVENESS" -> "Toggle record activeness"
          "FC_SET_FORM_RECORD_PASSWORD" -> "Set record password"
          "FC_COPY_FORM_RECORD" -> "Copy form record"
          "FC_EXPERIMENT" -> "Experiment (try-catch-finally)"
          "FC_FOR_EACH_LOOP" -> "For each loop"
          "FC_WITH_FORM_ELEMENT_CONTEXT" -> "With form element context"
          "FC_WHILE_LOOP" -> "While loop"
          "FC_DO_UNTIL_LOOP" -> "Do until loop"
          "FC_SWITCH" -> "Switch condition"
          "FC_MULTIPLE_CONDITION" -> "Multiple condition"
          "FC_PROCESS_LOG_PDF" -> "Generate process log PDF"
          "FC_FILL_PDF" -> "Fill PDF template"
          "FC_FILL_WORD" -> "Fill Word template"
          "FC_COMPRESS_AS_ZIP" -> "Compress as ZIP"
          "FC_SAVE_TO_FILE_SYSTEM" -> "Save to file system"
          "FC_SAVE_TO_WEBDAV" -> "Save to WebDAV"
          "FC_THROW_EXCEPTION" -> "Throw exception"
          "FC_BREAK" -> "Break out of loop"
          "FC_CONTINUE" -> "Continue to next iteration"
          "FC_EMPTY" -> "Empty placeholder"
          else -> spec.nodeType
        }
    return sanitizeWorkflowName(result).ifBlank { spec.nodeType }
  }

  /**
   * Sanitizes a workflow task / node / action name so it only contains characters FORMCYCLE accepts
   * for names. Formcycle rejects names containing e.g. dots ('.'), slashes or other punctuation —
   * the error message is: "Der Name darf nur Zahlen, Buchstaben sowie Leerzeichen, Bindestriche
   * (-), runde Klammern sowie Unterstriche (_) enthalten." AI-generated names frequently embed URLs
   * or hostnames (e.g. "HTTP-Request an intranet.stadtverwaltung.loc senden"), whose dots would
   * make the persisted workflow invalid, so every AI-provided taskName must be sanitized here
   * before it is written to the WorkflowTask / WorkflowNode.
   */
  private fun sanitizeWorkflowName(name: String): String =
      // \p{L} = any Unicode letter (keeps German umlauts ä/ö/ü/ß and other European letters),
      // \p{N} = any Unicode digit. Formcycle accepts letters/numbers/spaces/hyphens/parentheses/
      // underscores and rejects punctuation like dots, slashes, colons etc.
      name.replace(Regex("[^\\p{L}\\p{N} _\\-()]"), "").trim()

  // region Data Classes

  /** Estimated token usage of one or more AI calls: input (prompt) vs. output (completion). */
  private data class TokenUsage(val input: Int, val output: Int) {
    val total: Int
      get() = input + output
  }

  private data class WorkflowTaskSpec(
      val taskName: String = "",
      val taskDescription: String? = null,
      val triggerType: String = "FC_FORM_SUBMIT_BUTTON",
      val triggerParams: Map<String, Any> = emptyMap(),
      val nodeType: String = "FC_EMAIL",
      val nodeParams: Map<String, Any> = emptyMap(),
      val chainedNodes: List<Map<String, Any>>? = null,
      val endpointState: String = "",
      val endpointType: String = "FC_CHANGE_STATE",
      val stateProperties: Map<String, Any> = emptyMap(),
      // Delta-operation support: the AI returns a small array of operations instead of the whole
      // workflow. Defaults to "create" so existing behaviour is unchanged when the field is absent.
      val operation: String = "create",
      /** For "remove"/"replace": numeric database id of the existing workflow node to act on. */
      val targetNodeId: String? = null
  )

  // endregion Data Classes

  /**
   * Loads the CodBi form system prompt from the database. Combines formcycle.general,
   * formcycle.widgets, and all codbi.* categories.
   */
  /**
   * Loads a prompt from the DB (via [PromptLoader.loadPrompt]) with a classpath `.md` fallback for
   * when the database is unavailable (or the prompt is not seeded yet). Placeholders are resolved.
   * Returns `null` only when the prompt exists nowhere.
   */
  private fun loadPromptWithClasspathFallback(key: String): String? {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em != null) {
      try {
        val db = PromptLoader.loadPrompt(em, key)
        if (db != null) return PromptLoader.resolvePlaceholders(db)
      } catch (e: Exception) {
        logger.warn("[AICodBiAssistant] Failed to load prompt '{}': {}", key, e.message)
      } finally {
        em.close()
      }
    }
    return PromptLoader.loadPromptFromClasspath(key)?.let { PromptLoader.resolvePlaceholders(it) }
  }

  /**
   * Loads the change-log schema description (bundled `.md` / DB) used to decode earlier AI runs.
   */
  private fun loadChangeLogSchema(): String =
      loadPromptWithClasspathFallback("codbi.change_log_schema") ?: ""

  private fun buildCodbiFormSystemPrompt(
      useCodbi: Boolean = true,
      useBuergerserviceNaming: Boolean = false
  ): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return loadPromptWithClasspathFallback("codbi.fallback_form_system") ?: ""
    try {
      val fc = PromptLoader.loadCategory(em, "formcycle")
      val cb = if (useCodbi) PromptLoader.loadCategory(em, "codbi") else emptyMap()
      val taskInstruction = loadPromptWithClasspathFallback("codbi.form_task_instruction") ?: ""
      // Pass-1 uses ONLY the condensed references (element/widget names + purposes) plus the
      // general rules. The parameter-complete sections (codbi.standard_configurations /
      // codbi.functionalities / codbi.element_placeholders) are intentionally NOT included here:
      // codbi-general.md tells the AI to request the exact JSON templates for exactly the
      // elements/widgets it needs, and the server returns only those in pass-2. Sending the full
      // detailed sections here would roughly double the token usage per request without changing
      // the outcome (the AI requests details regardless).
      val buergerserviceNamingPart =
          if (useCodbi && useBuergerserviceNaming)
              "\n" + (cb["codbi.buergerservice_naming"] ?: "") + "\n"
          else ""
      val codbiPart =
          if (useCodbi) {
            "\n" + (cb["codbi.general"] ?: "") + "\n" + "{{CODBI_ELEMENTS_SECTION}}"
          } else {
            ""
          }
      return PromptLoader.resolvePlaceholders(
          taskInstruction +
              "\n\n" +
              (loadPromptWithClasspathFallback("codbi.form_structure_rules") ?: "") +
              "\n\n" +
              (fc["formcycle.general"] ?: "") +
              "\n\n" +
              "{{FORMCYCLE_WIDGETS_SECTION}}" +
              codbiPart +
              buergerserviceNamingPart)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to load form system prompt", e)
      return loadPromptWithClasspathFallback("codbi.fallback_form_system") ?: ""
    } finally {
      em?.close()
    }
  }

  /**
   * Loads the intent classification prompt from the database. [PromptLoader.loadPrompt] auto-seeds
   * the prompt if it's not yet in the DB.
   */
  private fun loadClassifyIntentPrompt(): String {
    try {
      val em = CodbiEntities.entityManagerFactory?.createEntityManager()
      if (em != null) {
        try {
          val dbPrompt = PromptLoader.loadPrompt(em, "codbi.classify_intent")
          // "Nicht installierte Elemente erstellen": drop hard-coded node-specific blocks (e.g. the
          // ePayBL payment-form intent rule) whose node is not allowed on this system.
          if (dbPrompt != null) {
            return FormcycleElementFilter.scrubNodeProse(PromptLoader.resolvePlaceholders(dbPrompt))
          }
        } finally {
          em.close()
        }
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to load classify intent prompt", e)
    }
    return FormcycleElementFilter.scrubNodeProse(
        loadPromptWithClasspathFallback("codbi.fallback_classify_intent") ?: "")
  }

  /** Loads the CodBi rethink (blind pass) prompt from the database. */
  private fun loadCodbiRethinkPrompt(): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return loadPromptWithClasspathFallback("codbi.fallback_rethink") ?: ""
    try {
      val categories = PromptLoader.loadCategory(em, "codbi")
      val fc = PromptLoader.loadCategory(em, "formcycle")
      val taskInstruction = loadPromptWithClasspathFallback("codbi.rethink_instruction") ?: ""
      // The detailed standards/functionalities are included in the DB-driven
      // {{CODBI_FULL_SECTION}},
      // so only the general rules, the widgets reference, and the full section are sent here.
      return PromptLoader.resolvePlaceholders(
          taskInstruction +
              (categories["codbi.general"] ?: "") +
              "\n" +
              FormcycleElementFilter.scrubWidgetSections(fc["formcycle.widgets"] ?: "") +
              "\n" +
              "{{CODBI_FULL_SECTION}}")
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to load rethink prompt", e)
      return loadPromptWithClasspathFallback("codbi.fallback_rethink") ?: ""
    } finally {
      em?.close()
    }
  }

  /**
   * Loads the CodBi apply (pass-2) prompt from the database. When [requestedIds] is non-empty, only
   * the details (parameters/TSDoc) of those specific elements are appended instead of the whole
   * full API reference. When [requestedIds] is empty but [widgetIds] is non-empty (the AI asked
   * only for widget templates), the condensed elements list is appended instead of the full API
   * reference; the full reference is only sent for a pure blind reconsideration (both lists empty).
   * When [widgetIds] is non-empty, only the requested formcycle widget sections are appended
   * instead of the full widget reference.
   */
  private fun loadCodbiApplyPrompt(
      requestedIds: List<String> = emptyList(),
      widgetIds: List<String> = emptyList(),
      useCodbi: Boolean = true,
      useBuergerserviceNaming: Boolean = false
  ): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return loadPromptWithClasspathFallback("codbi.fallback_apply") ?: ""
    try {
      val widgetPart = buildWidgetDetailsSection(em, widgetIds)
      if (!useCodbi) {
        // CodBi disabled: the pass-2 prompt contains only the Formcycle widget templates so the AI
        // can rebuild the widgets it created — no CodBi reference/details are sent at all.
        return widgetPart
      }
      val categories = PromptLoader.loadCategory(em, "codbi")
      // Only the cross-cutting general rules form the base — the detailed standard/functionality/
      // EP sections are redundant with the targeted details below (or the full reference in the
      // blind case) and would roughly double the token usage when duplicated here.
      val base = CodBiElementAccess.scrub(categories["codbi.general"] ?: "")
      // Cross-cutting Formcycle rules (form structure, repeatable containers, server variables,
      // element identifiers) MUST be carried into every rerun — the AI drops a repeatable
      // container otherwise, because the REPEATABLE CONTAINERS rule lives in formcycle.general and
      // this apply prompt is what replaces the full system prompt on pass-2/3/4 reruns.
      val fc = PromptLoader.loadCategory(em, "formcycle")
      val formcycleGeneral = fc["formcycle.general"] ?: ""
      // The Bürger-Services canonical field naming MUST also be carried into pass-2 — the model
      // actually builds the form in this apply pass, and without it the canonical tfAntragsteller*
      // /
      // tfOrg* IDs (and the fsBKOrgDaten ELSTER organisation fields) are lost.
      val buergerserviceNaming =
          if (useBuergerserviceNaming) categories["codbi.buergerservice_naming"] ?: "" else ""
      val codbiPart =
          when {
            requestedIds.isNotEmpty() -> {
              val details = CodbiCapabilities.buildFullSectionFor(requestedIds)
              // Fall back to the full reference when none of the requested IDs could be resolved.
              if (details.isBlank()) PromptLoader.resolvePlaceholders("{{CODBI_FULL_SECTION}}")
              else
              // The COMPLETE condensed EP/functionality name list MUST accompany the requested
              // details: the model builds the form in THIS (pass-2) call, whose context is a
              // fresh conversation that no longer contains the pass-1 prompt with the full
              // listing. Without the name list the model invents EP names (e.g.
              // Data.PlaceListStartingWithAn, Data.CantonsSwitzerland) for anything it did not
              // explicitly request details for in pass-1.
              details +
                      "\n\n## COMPLETE ELEMENT PLACEHOLDER / FUNCTIONALITY / STANDARD CONFIGURATION " +
                      "REFERENCE (authoritative EP names + usage — use EXACTLY these names, never invent names)\n" +
                      PromptLoader.resolvePlaceholders("{{CODBI_ELEMENTS_SECTION}}")
            }
            // The AI asked ONLY for widget templates (elements list empty): give it the condensed
            // element list (names + purposes) plus the widget templates — NOT the full API
            // reference.
            widgetIds.isNotEmpty() -> PromptLoader.resolvePlaceholders("{{CODBI_ELEMENTS_SECTION}}")
            // Pure blind reconsideration: provide the complete reference.
            else -> PromptLoader.resolvePlaceholders("{{CODBI_FULL_SECTION}}")
          }
      return (loadPromptWithClasspathFallback("codbi.form_structure_rules") ?: "") +
          "\n\n" +
          formcycleGeneral +
          "\n\n" +
          base +
          "\n\n" +
          codbiPart +
          (if (buergerserviceNaming.isNotBlank()) "\n\n" + buergerserviceNaming else "") +
          "\n\n" +
          widgetPart
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to load apply prompt", e)
      return loadPromptWithClasspathFallback("codbi.fallback_apply") ?: ""
    } finally {
      em?.close()
    }
  }

  /**
   * Builds the formcycle widget details section for the pass-2 rerun. When [widgetIds] is
   * non-empty, only the requested widgets' sections (from `formcycle.widgets.<name>`) are appended;
   * otherwise the full widget reference is included as a fallback.
   */
  private fun buildWidgetDetailsSection(em: EntityManager, widgetIds: List<String>): String {
    if (widgetIds.isEmpty()) {
      // Full-widget fallback — scrub out widgets not allowed for the current request.
      return FormcycleElementFilter.scrubWidgetSections(
          PromptLoader.loadCategory(em, "formcycle")["formcycle.widgets"] ?: "")
    }
    val all = PromptLoader.loadSectionMap(em, "formcycle.widgets.")
    val sb = StringBuilder("\nFORMCYCLE WIDGET DETAILS (requested)\n")
    for (id in widgetIds) {
      // "Nicht installierte Elemente erstellen": skip requested widgets not in the allowed set.
      if (!FormcycleElementFilter.isWidgetAllowed(id)) continue
      val norm =
          id.trim().lowercase().replace(Regex("[^a-z0-9]"), "_").replace(Regex("_+"), "_").trim('_')
      if (norm.isEmpty()) continue
      val content =
          all["formcycle.widgets.$norm"]
              ?: all.entries
                  .firstOrNull { (k, _) -> k.removePrefix("formcycle.widgets.").startsWith(norm) }
                  ?.value
              ?: continue
      sb.append("\n## ").append(id.trim()).append("\n").append(content).append("\n")
    }
    return sb.toString().trimEnd()
  }

  // region Clarification

  /** One clarifying question the AI asks the user (multiple-choice + optional free text). */
  private data class ClarificationQuestion(
      val id: String = "",
      val question: String = "",
      val options: List<String> = emptyList(),
      val allowFreeText: Boolean = true,
      val multiSelect: Boolean = false
  )

  /**
   * One answered clarification round: the question, the user's answer and an optional attachment.
   */
  private data class ClarificationTurn(
      val question: String = "",
      val answer: String = "",
      val attachmentName: String? = null
  )

  /** A `need_clarification` request produced by the AI. */
  private data class ClarificationRequest(val questions: List<ClarificationQuestion> = emptyList())

  /**
   * Reads the `clarificationHistory` request param (JSON array of {question, answer,
   * attachmentName}).
   */
  private fun parseClarificationHistory(
      params: IPluginServletActionParams
  ): List<ClarificationTurn> {
    val raw = params.requestParameters["clarificationHistory"]?.firstOrNull() ?: return emptyList()
    return try {
      val arr = JsonParser.parseString(raw).asJsonArray
      val turns = mutableListOf<ClarificationTurn>()
      for (el in arr) {
        if (!el.isJsonObject) continue
        val o = el.asJsonObject
        val question = o.get("question")?.asString ?: ""
        val answer = o.get("answer")?.asString ?: ""
        val attachment = o.get("attachmentName")?.asString
        turns.add(ClarificationTurn(question, answer, attachment))
      }
      if (turns.isNotEmpty()) {
        logger.info(
            "[AICodBiAssistant] User answered {} clarification question(s): {}",
            turns.size,
            turns.joinToString(" | ") {
              "Q: ${it.question}  A: ${if (it.answer.isBlank()) "<blank>" else it.answer}"
            })
      }
      turns
    } catch (_: Exception) {
      emptyList()
    }
  }

  /** Parses a `need_clarification` JSON response into a [ClarificationRequest], or null. */
  private fun parseClarificationRequest(cleaned: String): ClarificationRequest? {
    return try {
      val obj = JsonParser.parseString(cleaned).asJsonObject
      if (obj.get("status")?.asString != "need_clarification") return null
      val qs = obj.getAsJsonArray("questions") ?: return null
      if (qs.size() == 0) return null
      val questions = mutableListOf<ClarificationQuestion>()
      for (el in qs) {
        if (!el.isJsonObject) continue
        val q = el.asJsonObject
        val question = q.get("question")?.asString?.takeIf { it.isNotBlank() } ?: continue
        val id = q.get("id")?.asString?.takeIf { it.isNotBlank() } ?: "q${questions.size + 1}"
        val options =
            q.getAsJsonArray("options")?.mapNotNull {
              it.takeIf { x -> x.isJsonPrimitive }?.asString?.takeIf { s -> s.isNotBlank() }
            } ?: emptyList()
        val allowFree = q.get("allowFreeText")?.asBoolean ?: true
        val multiSelect = q.get("multiSelect")?.asBoolean ?: false
        questions.add(ClarificationQuestion(id, question, options, allowFree, multiSelect))
      }
      if (questions.isEmpty()) null else ClarificationRequest(questions)
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Formats the answered clarification turns as readable text for the AI system prompts. When an
   * answer delegates the decision to the AI or declines to answer, it is explicitly marked as
   * RESOLVED so downstream prompts treat it as answered and never re-ask.
   */
  private fun buildClarificationContext(history: List<ClarificationTurn>): String {
    if (history.isEmpty()) return ""
    val sb = StringBuilder()
    for ((i, turn) in history.withIndex()) {
      val answer = turn.answer.trim()
      sb.append("${i + 1}. Question: ").append(turn.question).append("\n")
      if (answer.isBlank()) {
        sb.append("   Answer: (no text given by user)")
      } else if (isDelegatedOrRefusedAnswer(answer)) {
        sb.append("   Answer: ").append(answer)
        sb.append(
            "\n   → USER DELEGATED/DECLINED — treat this question as RESOLVED; you decide a sensible default and never ask it again.")
      } else {
        sb.append("   Answer: ").append(answer)
      }
      if (!turn.attachmentName.isNullOrBlank()) {
        sb.append(" (attached document: ").append(turn.attachmentName).append(")")
      }
      sb.append("\n")
    }
    return sb.toString().trim()
  }

  /** True when a clarification answer delegates the decision or declines to answer. */
  private fun isDelegatedOrRefusedAnswer(answer: String): Boolean {
    val lower = answer.lowercase()
    val delegates =
        listOf(
            "you decide",
            "you can decide",
            "your choice",
            "your decision",
            "you choose",
            "whatever you think",
            "whatever you find best",
            "up to you",
            "as you see fit",
            "entscheide du",
            "du entscheidest",
            "egal",
            "wie du willst",
            "ihnen überlassen",
            "their choice",
            "does not matter",
            "do not care",
            "don't care",
            "kannst du entscheiden")
    val refuses =
        listOf(
            "i don't want to answer",
            "i dont want to answer",
            "no answer",
            "not answering",
            "skip it",
            "skip this",
            "keine angabe",
            "will ich nicht beantworten",
            "übergehe",
            "don't want to answer",
            "nicht beantworten",
            "lasse ich offen",
            "leave it open",
            "sonstiges",
            "keine ahnung",
            "i don't know")
    return delegates.any { lower.contains(it) } || refuses.any { lower.contains(it) }
  }

  /** Converts the answered clarification turns into a JSON array for the change log. */
  private fun clarificationTurnsToJson(turns: List<ClarificationTurn>): JsonArray {
    val arr = JsonArray()
    for (t in turns) {
      val o = JsonObject()
      o.addProperty("question", t.question)
      o.addProperty("answer", t.answer)
      if (!t.attachmentName.isNullOrBlank()) o.addProperty("attachmentName", t.attachmentName)
      arr.add(o)
    }
    return arr
  }

  /** Result of one clarification/history check round. */
  private data class ClarificationCheck(
      val questions: ClarificationRequest? = null,
      val needsHistory: Boolean = false,
      val needsFormList: Boolean = false,
      /** Form key the AI asked to load the change history for (null/blank = the current form). */
      val historyFormKey: String? = null
  )

  /** Builds the system prompt for the dedicated clarification/history check. */
  private fun buildClarificationSystemPrompt(
      prompt: String,
      intent: String,
      formElements: String?,
      formStructureContext: String?,
      clarificationContext: String,
      chatContext: String,
      changeHistoryContext: String?,
      formListContext: String?,
      currentFormKey: String?,
      currentFormTitle: String?,
      useCodbi: Boolean,
      askAllQuestions: Boolean,
      completionPages: String? = null,
      formVariables: String? = null
  ): String {
    val action =
        when (intent) {
          "form" -> "modify the form"
          "workflow" -> "create or modify a workflow"
          else -> "modify the form and create/modify a workflow"
        }
    // When "ask all at once" is enabled, the AI gathers EVERY clarification question it has in a
    // single round instead of limiting itself to at most 3 questions per round.
    val questionCountRule =
        if (askAllQuestions) {
          "- Ask ALL questions you have at once in this single round — do not split them across " +
              "rounds and do not hold any back. Only ask what is genuinely missing. Each question " +
              "needs a unique \"id\".\n"
        } else {
          "- Ask at most 3 questions per round; each question needs a unique \"id\".\n"
        }
    // PRIMARY SOURCE: the clarification prompt comes from the .md file (codbi-clarification.md,
    // seeded as codbi.clarification) — loaded from the DB or, while the seed hasn't run, directly
    // from the bundled .md on the classpath. No prompt text is embedded in the backend; if neither
    // source is available an empty system prompt is returned.
    loadClarificationTemplate()?.let { template ->
      val currentlyOpenForm =
          if (!currentFormKey.isNullOrBlank() || !currentFormTitle.isNullOrBlank()) {
            "\nCURRENTLY OPEN FORM: title=${gson.toJson(currentFormTitle ?: "")}, " +
                "key=${gson.toJson(currentFormKey ?: "")} — this is the form the user is editing " +
                "right now. When the user names a DIFFERENT form by its title, treat it as another form.\n"
          } else ""
      val formElementsBlock =
          if (!formElements.isNullOrBlank()) "\nFORM ELEMENTS available: $formElements\n" else ""
      val formStructureBlock =
          if (!formStructureContext.isNullOrBlank()) {
            "\nCURRENT FORM STRUCTURE (pages, fieldsets, containers and their titles/names — use it " +
                "to resolve references to existing elements like \"the two fieldsets on the first " +
                "page\"):\n" +
                formStructureContext +
                "\n"
          } else ""
      val clarificationHistoryBlock =
          if (clarificationContext.isNotBlank()) {
            "\nQUESTIONS THE USER ALREADY ANSWERED (treat these as authoritative). " +
                "NEVER re-ask a question whose answer is already given above, and NEVER ask the same " +
                "question twice. Use the provided answers and respond with " +
                "{\"status\":\"NO_CLARIFICATION\"} unless a genuinely NEW, still-unanswered question " +
                "remains:\n" +
                clarificationContext +
                "\n"
          } else ""
      val chatHistoryBlock =
          if (chatContext.isNotBlank()) {
            "\nCHAT HISTORY (previous turns in the form-chat popup — treat as authoritative context):\n" +
                "The user's current message may refer to earlier chat turns (e.g. \"apply options 1, 2, 5 and 7\"). " +
                "Resolve such references from this history BEFORE asking the user anything.\n" +
                chatContext +
                "\n"
          } else ""
      val changeHistoryBlock =
          if (!changeHistoryContext.isNullOrBlank()) {
            "\nPRIOR CHANGE HISTORY (JSON — interpret it using the schema below)\n" +
                "The change log below is a JSON array of earlier AI runs; each entry describes ONE earlier run.\n\n" +
                "CHANGE LOG SCHEMA — what each property means:\n" +
                loadChangeLogSchema() +
                "\n\n" +
                "CHANGE LOG:\n" +
                changeHistoryContext +
                "\n\nIdentify the entry/entries the user's request refers to and determine whether you still need information from the user.\n"
          } else ""
      val formListBlock =
          if (!formListContext.isNullOrBlank()) {
            "\nAVAILABLE FORMS ON THE SERVER (each entry has \"id\", \"key\" = the technical identifier to pass in need_chat_history, " +
                "\"name\"/\"title\" = the form's TITLE as users refer to it, and \"current\": true marks the form being edited right now):\n" +
                formListContext +
                "\n" +
                "You now HAVE the form list — never respond {\"status\":\"need_form_list\"} again. " +
                "Pick the form whose title best matches the user's request and respond ONLY with " +
                "{\"status\":\"need_chat_history\",\"formKey\":\"<that form's key>\"} — or, if no form reasonably matches, " +
                "ask the user which form they meant via need_clarification.\n"
          } else ""
      val changeHistoryStatus =
          if (changeHistoryContext.isNullOrBlank()) {
            "\nThe change history is NOT shown by default. If the user's request refers to earlier AI runs / prior work on " +
                "THIS form (e.g. \"apply the same functionalities as a week ago\", \"like before\", \"what was configured earlier\", " +
                "\"what another user prompted\"), fetch it first: respond ONLY with {\"status\":\"need_chat_history\"} (current form) " +
                "or {\"status\":\"need_chat_history\",\"formKey\":\"<key>\"} (another form).\n"
          } else {
            "\nYou ALREADY have the PRIOR CHANGE HISTORY above (with the schema). Do NOT request the change history again — " +
                "interpret it and decide whether you still need information from the user.\n"
          }
      val completionPagesBlock =
          if (!completionPages.isNullOrBlank()) {
            "\nAVAILABLE ABSCHLUSSSEITEN (completion pages) for this workflow — when the request needs a success/failure " +
                "Abschlussseite (e.g. FC_DOI_INIT successPage/failurePage, FC_SHOW_TEMPLATE), ask the user to PICK ONE BY " +
                "NAME from this list (offer the names as multiple-choice options). NEVER ask for a target URL/\"Ziel-URL\" " +
                "and NEVER ask for a free-text page identifier:\n" +
                completionPages +
                "\n"
          } else ""
      val formVariablesBlock =
          if (!formVariables.isNullOrBlank()) {
            "\nFORM GLOBAL VARIABLES (Formularvariablen) exist on this form (NOT form fields): $formVariables. " +
                "These are referenced at runtime with [%variableName%]. NEVER ask whether they exist / are to be created, " +
                "and NEVER offer to create hidden form fields for them — use the [%variableName%] placeholder directly.\n"
          } else ""
      return template
          .replace("{{ACTION}}", action)
          .replace("{{USER_REQUEST}}", gson.toJson(prompt))
          .replace("{{QUESTION_COUNT_RULE}}", questionCountRule)
          .replace("{{CURRENTLY_OPEN_FORM}}", currentlyOpenForm)
          .replace("{{FORM_ELEMENTS}}", formElementsBlock)
          .replace("{{FORM_STRUCTURE}}", formStructureBlock)
          .replace("{{CLARIFICATION_HISTORY}}", clarificationHistoryBlock)
          .replace("{{CHAT_HISTORY}}", chatHistoryBlock)
          .replace("{{CHANGE_HISTORY_BLOCK}}", changeHistoryBlock)
          .replace("{{FORM_LIST_BLOCK}}", formListBlock)
          .replace("{{CHANGE_HISTORY_STATUS}}", changeHistoryStatus) +
          completionPagesBlock +
          formVariablesBlock
    }
    // No prompt text is embedded in the backend: the clarification prompt is sourced exclusively
    // from
    // the bundled codbi-clarification.md (-> codbi.clarification) via loadClarificationTemplate()
    // above.
    // If neither the DB nor the classpath copy is available, return an empty system prompt.
    return ""
  }

  /**
   * Loads the clarification system-prompt template — first from the DB (seeded from
   * `codbi-clarification.md` as `codbi.clarification`), and while the seed hasn't run yet, directly
   * from the bundled `.md` on the classpath. Returns null only if neither is available — no prompt
   * text is embedded in the backend. Keeps the clarification prompt sourced from the .md files.
   */
  private fun loadClarificationTemplate(): String? {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em != null) {
      try {
        val fromDb = PromptLoader.loadCategory(em, "codbi")["codbi.clarification"]
        // "Nicht installierte Elemente erstellen": drop hard-coded ePayBL clarification blocks
        // whose
        // node is not allowed (the payment/notification-matrix questions must not reach the AI).
        if (!fromDb.isNullOrBlank()) return FormcycleElementFilter.scrubNodeProse(fromDb)
      } catch (_: Exception) {} finally {
        try {
          em.close()
        } catch (_: Exception) {}
      }
    }
    return runCatching {
          AICodBiAssistant::class
              .java
              .classLoader
              .getResourceAsStream(
                  "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md")
              ?.bufferedReader(Charsets.UTF_8)
              ?.use { it.readText() }
              ?.trim()
        }
        .getOrNull()
        ?.let { FormcycleElementFilter.scrubNodeProse(it) }
  }

  /**
   * Loads the workflow task-instruction template — first from the DB (seeded from
   * `codbi-workflow-task-instruction.md` as `codbi.workflow_task_instruction`), and while the seed
   * hasn't run yet, directly from the bundled `.md` on the classpath. No prompt text is embedded in
   * the backend.
   */
  private fun loadWorkflowTaskInstruction(): String? {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em != null) {
      try {
        val fromDb = PromptLoader.loadCategory(em, "codbi")["codbi.workflow_task_instruction"]
        if (!fromDb.isNullOrBlank()) return fromDb
      } catch (_: Exception) {} finally {
        try {
          em.close()
        } catch (_: Exception) {}
      }
    }
    return runCatching {
          AICodBiAssistant::class
              .java
              .classLoader
              .getResourceAsStream(
                  "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-workflow-task-instruction.md")
              ?.bufferedReader(Charsets.UTF_8)
              ?.use { it.readText() }
              ?.trim()
        }
        .getOrNull()
  }

  /**
   * Renders the workflow task-instruction template by filling its conditional `{{BEGIN_*}} …
   * {{END_*}}` sections. A section is kept (with its `{{*_DATA}}` placeholder replaced) when the
   * data is non-blank, and dropped entirely when the data is absent. Always-present sections
   * (SCOPE, PDF GENERATION, OUTPUT CONTRACT) stay untouched. No prompt text lives in the backend.
   */
  private fun renderWorkflowSystemPrompt(
      template: String,
      general: String,
      workflowReference: String,
      pass2: Boolean,
      formContext: String?,
      repeatableContainers: String?,
      completionPages: String?,
      htmlTemplates: String?,
      inboxes: String?,
      messageServices: String?,
      triggers: String?,
      workflowStates: String?,
      existingWorkflowNodes: String?,
      clarificationContext: String?,
      chatContext: String?,
      changeHistoryContext: String?,
      changeLogSchema: String,
      formVariables: String? = null
  ): String {
    var out =
        template
            .replace("{{GENERAL}}", general)
            .replace("{{WORKFLOW_REFERENCE}}", workflowReference)
    // Conditional sections: drop the whole {{BEGIN_*}}…{{END_*}} block when data is blank.
    out = applyWorkflowSection(out, "WORKFLOW_DETAILS_REQUEST", if (pass2) null else " ")
    // The NEED_FORM_DATA block instructs the AI to ask for the form element list — only meaningful
    // when no form context is available. In the whole-form/"both" flow the form elements are always
    // passed along, so the block (and its "respond ONLY with need_form_data" mandate) must be
    // removed — otherwise the workflow AI returns {"need":"form_data"} and the run aborts even
    // though the elements are right there in the prompt.
    out =
        applyWorkflowSection(out, "NEED_FORM_DATA", if (formContext.isNullOrBlank()) " " else null)
    out = applyWorkflowSection(out, "FORM_ELEMENTS", formContext)
    out = applyWorkflowSection(out, "FORM_VARIABLES", formVariables)
    out = applyWorkflowSection(out, "REPEATABLE_CONTAINERS", repeatableContainers)
    out = applyWorkflowSection(out, "COMPLETION_PAGES", completionPages)
    out = applyWorkflowSection(out, "HTML_TEMPLATES", htmlTemplates)
    out = applyWorkflowSection(out, "URL_TEMPLATES", htmlTemplates)
    out = applyWorkflowSection(out, "INBOXES", inboxes)
    out = applyWorkflowSection(out, "MESSAGE_SERVICES", messageServices)
    out = applyWorkflowSection(out, "TRIGGERS", triggers)
    out = applyWorkflowSection(out, "WORKFLOW_STATES", workflowStates)
    out = applyWorkflowSection(out, "EXISTING_WORKFLOW_NODES", existingWorkflowNodes)
    out = applyWorkflowSection(out, "USER_CLARIFICATION", clarificationContext)
    out = applyWorkflowSection(out, "CHAT_HISTORY", chatContext)
    out =
        applyWorkflowSection(
            out,
            "PRIOR_CHANGE_HISTORY",
            changeHistoryContext,
            mapOf("{{CHANGE_LOG_SCHEMA}}" to changeLogSchema))
    return out
  }

  /** Keeps or drops one `{{BEGIN_name}}…{{END_name}}` section of a template. */
  private fun applyWorkflowSection(
      template: String,
      name: String,
      data: String?,
      extraReplacements: Map<String, String> = emptyMap()
  ): String {
    val begin = "{{BEGIN_$name}}"
    val end = "{{END_$name}}"
    val startIdx = template.indexOf(begin)
    if (startIdx < 0) return template
    val endIdx = template.indexOf(end, startIdx)
    if (endIdx < 0) return template
    val afterEnd = endIdx + end.length
    if (data.isNullOrBlank()) {
      return template.removeRange(startIdx, afterEnd)
    }
    var body = template.substring(startIdx + begin.length, endIdx)
    body = body.replace("{{${name}_DATA}}", data)
    for ((ph, value) in extraReplacements) body = body.replace(ph, value)
    return template.replaceRange(startIdx, afterEnd, body)
  }

  /**
   * Loads the classify-intent context template — first from the DB (seeded from
   * `codbi-classify-intent-context.md` as `codbi.classify_intent_context`), and while the seed
   * hasn't run yet, directly from the bundled `.md` on the classpath. No prompt text is embedded in
   * the backend.
   */
  private fun loadClassifyIntentContextTemplate(): String? {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em != null) {
      try {
        val fromDb = PromptLoader.loadCategory(em, "codbi")["codbi.classify_intent_context"]
        if (!fromDb.isNullOrBlank()) return fromDb
      } catch (_: Exception) {} finally {
        try {
          em.close()
        } catch (_: Exception) {}
      }
    }
    return runCatching {
          AICodBiAssistant::class
              .java
              .classLoader
              .getResourceAsStream(
                  "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-classify-intent-context.md")
              ?.bufferedReader(Charsets.UTF_8)
              ?.use { it.readText() }
              ?.trim()
        }
        .getOrNull()
  }

  /**
   * Renders the classify-intent context template by filling its conditional `{{BEGIN_*}} …
   * {{END_*}}` sections with the runtime chat/form/clarification context. Sections with no data are
   * dropped. No prompt text lives in the backend.
   */
  private fun renderClassifyIntentContext(
      chatContext: String?,
      formStructureContext: String?,
      clarificationContext: String?
  ): String {
    val template = loadClassifyIntentContextTemplate() ?: return ""
    var out = template
    out = applyWorkflowSection(out, "CHAT_HISTORY", chatContext)
    out = applyWorkflowSection(out, "FORM_STRUCTURE", formStructureContext)
    out = applyWorkflowSection(out, "CLARIFICATION", clarificationContext)
    return out
  }

  /**
   * Loads the chat-context template — first from the DB (seeded from `codbi-chat-context.md` as
   * `codbi.chat_context`), and while the seed hasn't run yet, directly from the bundled `.md` on
   * the classpath. No prompt text is embedded in the backend.
   */
  private fun loadChatContextTemplate(): String? {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em != null) {
      try {
        val fromDb = PromptLoader.loadCategory(em, "codbi")["codbi.chat_context"]
        if (!fromDb.isNullOrBlank()) return fromDb
      } catch (_: Exception) {} finally {
        try {
          em.close()
        } catch (_: Exception) {}
      }
    }
    return runCatching {
          AICodBiAssistant::class
              .java
              .classLoader
              .getResourceAsStream(
                  "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-context.md")
              ?.bufferedReader(Charsets.UTF_8)
              ?.use { it.readText() }
              ?.trim()
        }
        .getOrNull()
  }

  /**
   * Renders the chat-context template by filling its conditional `{{BEGIN_*}} … {{END_*}}` sections
   * with the runtime form/workflow/chat/clarification context. Sections with no data are dropped.
   * No prompt text lives in the backend.
   */
  private fun renderChatContext(
      formStructureContext: String?,
      completeFormJson: String?,
      completeWorkflowJson: String?,
      chatContext: String,
      clarificationContext: String
  ): String {
    val template = loadChatContextTemplate() ?: return ""
    var out = template
    out = applyWorkflowSection(out, "FORM_STRUCTURE", formStructureContext)
    out = applyWorkflowSection(out, "COMPLETE_FORM", completeFormJson)
    out = applyWorkflowSection(out, "COMPLETE_WORKFLOW", completeWorkflowJson)
    out = applyWorkflowSection(out, "CHAT_HISTORY", chatContext.takeIf { it.isNotBlank() })
    out =
        applyWorkflowSection(out, "CLARIFICATION", clarificationContext.takeIf { it.isNotBlank() })
    return out
  }

  /** Parses a `need_chat_history` response into (wanted, optional form key for another form). */
  private fun parseHistoryRequest(cleaned: String): Pair<Boolean, String?> {
    return try {
      val obj = JsonParser.parseString(cleaned).asJsonObject
      val status = obj.get("status")?.asString
      val formKey = obj.get("formKey")?.takeIf { it.isJsonPrimitive }?.asString
      Pair(status == "need_chat_history", formKey)
    } catch (_: Exception) {
      Pair(false, null)
    }
  }

  private fun isNeedFormListRequest(cleaned: String): Boolean {
    return try {
      JsonParser.parseString(cleaned).asJsonObject.get("status")?.asString == "need_form_list"
    } catch (_: Exception) {
      false
    }
  }

  /** Loads the prior change history for the given form for AI context injection. */
  private fun loadChangeHistoryContext(formKey: String?): String? {
    if (formKey.isNullOrBlank()) return null
    return AiAssistantLog.loadChangeHistoryForAi(CodbiEntities.entityManagerFactory, formKey)
  }

  /** Loads the list of all forms (projects) on the server as JSON for AI context injection. */
  private fun loadFormListContext(userContext: Any, formKey: String?): String? =
      fetchAllForms(userContext, formKey)

  /**
   * Builds a "which form did you mean?" clarification from the loaded form list, used as a safety
   * net when the AI cannot match the form the user mentioned. Offers the forms by TITLE as
   * multiple-choice options (free text still allowed).
   */
  private fun buildFormChoiceClarification(formListJson: String?): ClarificationQuestion? {
    if (formListJson.isNullOrBlank()) return null
    return try {
      val arr = JsonParser.parseString(formListJson).asJsonArray
      val options =
          arr.mapNotNull { el ->
            if (!el.isJsonObject) return@mapNotNull null
            val name = el.asJsonObject.get("name")?.takeIf { it.isJsonPrimitive }?.asString
            name?.trim()?.takeIf { it.isNotBlank() }?.take(80)
          }
      if (options.isEmpty()) return null
      ClarificationQuestion(
          id = "form-choice",
          question =
              "Which form did you mean? The assistant could not clearly identify the form you " +
                  "mentioned. Choose the form whose earlier changes should be applied here, or type " +
                  "its name.",
          options = options,
          allowFreeText = true)
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Resolves the TITLE of the currently open form (from its `project-<id>` key) so the AI can tell
   * "this form" apart from other forms the user might name.
   */
  private fun resolveCurrentFormTitle(userContext: Any, formKey: String?): String? {
    val id = formKey?.trim()?.removePrefix("project-")?.toLongOrNull() ?: return null
    return try {
      val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      try {
        val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
        val q =
            em.javaClass
                .getMethod("createQuery", String::class.java)
                .invoke(em, "SELECT p FROM de.xima.fc.entities.Projekt p WHERE p.id = :pid")
        q.javaClass
            .getMethod("setParameter", String::class.java, Any::class.java)
            .invoke(q, "pid", id)
        @Suppress("UNCHECKED_CAST")
        val rows = q.javaClass.getMethod("getResultList").invoke(q) as? List<*> ?: emptyList<Any>()
        rows.firstOrNull()?.let { extractProjectName(it) }
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] resolveCurrentFormTitle failed: {}", e.message)
      null
    }
  }

  /**
   * Enumerates all FORMCYCLE forms (projects) of the current client via JPQL on the
   * FormCycle-managed EntityManager, returning
   * `[{"id":<id>,"key":"project-<id>","name":"<name>","current":bool}]`. The Hibernate mandant
   * filter of the user's session scopes the query to the current client.
   */
  private fun fetchAllForms(userContext: Any, formKey: String? = null): String? {
    return try {
      val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      try {
        val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
        // Formcycle's project entity is the German "Projekt" (table PROJEKT), not "Project".
        val jpql = "SELECT p FROM de.xima.fc.entities.Projekt p ORDER BY p.id"
        val query = em.javaClass.getMethod("createQuery", String::class.java).invoke(em, jpql)
        @Suppress("UNCHECKED_CAST")
        val rows =
            query.javaClass.getMethod("getResultList").invoke(query) as? List<*> ?: emptyList<Any>()
        val arr = JsonArray()
        for (row in rows) {
          if (row == null) continue
          try {
            val idNumber = row.javaClass.getMethod("getId").invoke(row) as? Number ?: continue
            val id = idNumber.toLong()
            val title = extractProjectName(row) ?: "Form $id"
            val o = JsonObject()
            o.addProperty("id", id)
            o.addProperty("key", "project-$id")
            // "name" and "title" both carry the form's TITLE — users refer to forms by title.
            o.addProperty("name", title)
            o.addProperty("title", title)
            o.addProperty("current", "project-$id" == formKey)
            arr.add(o)
          } catch (_: Exception) {
            // skip unreadable row
          }
        }
        logger.info("[AICodBiAssistant] fetchAllForms: found {} form(s)", arr.size())
        if (arr.size() == 0) null else gson.toJson(arr)
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (e: Exception) {
      logger.warn(
          "[AICodBiAssistant] fetchAllForms failed: msg='${e.message}' cause='${e.cause?.message}'")
      null
    }
  }

  /**
   * Best-effort extraction of a project's human-readable TITLE via reflection. Formcycle's
   * `Projekt` entity exposes the title as `getTitel()` (German) — the same value that appears as
   * `XFC_METADATA.currentProject.title` in the designer — with `getName()` and the localized
   * `getDisplayName(Locale)` as fallbacks.
   */
  private fun extractProjectName(project: Any): String? {
    // 1) getTitel() — the form title users see in the designer (maps to XFC_METADATA.title).
    for (getter in listOf("getTitel", "getName")) {
      try {
        val v = project.javaClass.getMethod(getter).invoke(project) as? String
        if (!v.isNullOrBlank()) return v
      } catch (_: Exception) {}
    }
    // 2) getDisplayName(Locale) — localized display name.
    try {
      val v =
          project.javaClass
              .getMethod("getDisplayName", java.util.Locale::class.java)
              .invoke(project, java.util.Locale.getDefault()) as? String
      if (!v.isNullOrBlank()) return v
    } catch (_: Exception) {}
    // 3) Fallback: any String-returning no-arg getter whose name contains "name"/"titel".
    return project.javaClass.methods
        .firstOrNull {
          it.parameterCount == 0 &&
              it.returnType == String::class.java &&
              (it.name.contains("Name", ignoreCase = true) ||
                  it.name.contains("Titel", ignoreCase = true))
        }
        ?.let { m -> runCatching { m.invoke(project) as? String }.getOrNull() }
        ?.takeIf { it.isNotBlank() }
  }

  /**
   * Makes a dedicated AI call asking whether it needs more information from the user and/or the
   * prior change history. Returns questions when the AI asks, a [ClarificationCheck] with
   * [ClarificationCheck.needsHistory] when it wants the change history, or null when it is ready.
   */
  private fun tryClarification(
      prompt: String,
      modelId: String,
      instance: Standard,
      intent: String,
      formElements: String?,
      formStructureContext: String?,
      clarificationContext: String,
      chatContext: String,
      changeHistoryContext: String?,
      formListContext: String?,
      formKey: String?,
      currentFormTitle: String?,
      useCodbi: Boolean,
      askAllQuestions: Boolean,
      imageParts: List<String>,
      completionPages: String? = null,
      formVariables: String? = null
  ): ClarificationCheck? {
    val system =
        buildClarificationSystemPrompt(
            prompt,
            intent,
            formElements,
            formStructureContext,
            clarificationContext,
            chatContext,
            changeHistoryContext,
            formListContext,
            formKey,
            currentFormTitle,
            useCodbi,
            askAllQuestions,
            completionPages,
            formVariables)
    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(system)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }
    val raw = instance.performFormAssist(modelId, messagesJson)
    val cleaned = extractJson(stripThinkTags(raw)).trim()
    logger.info("[AICodBiAssistant] Clarification check response: {}", compactJsonForLog(cleaned))
    if (cleaned.isBlank() || cleaned.equals("NO_CLARIFICATION", ignoreCase = true)) return null
    if (isNeedFormListRequest(cleaned)) return ClarificationCheck(needsFormList = true)
    val (wantsHistory, historyFormKey) = parseHistoryRequest(cleaned)
    if (wantsHistory) {
      return ClarificationCheck(needsHistory = true, historyFormKey = historyFormKey)
    }
    return ClarificationCheck(questions = parseClarificationRequest(cleaned))
  }

  // endregion Clarification

  // region Form Chat

  /** One prior chat turn exchanged in the form-chat popup. */
  private data class ChatTurn(val user: String, val assistant: String)

  /**
   * Result of the AI's classification of a chat/run prompt: question and/or instructions + answer.
   *
   * [matomoStatsContext] carries the current form's Matomo statistics when the AI requested them
   * during the chat pass (see [produceChatAnswer]) — it is reused by the form-modification pass so
   * an "analyse and optimise" instruction also sees the statistics.
   */
  private data class ChatAnswer(
      val hasQuestion: Boolean,
      val hasInstructions: Boolean,
      val answer: String,
      val tokensIn: Int = 0,
      val tokensOut: Int = 0,
      val matomoStatsContext: String? = null
  )

  /** Reads the `chatHistory` request param (JSON array of {user, assistant} turns). */
  private fun parseChatHistory(params: IPluginServletActionParams): List<ChatTurn> {
    val raw = params.requestParameters["chatHistory"]?.firstOrNull() ?: return emptyList()
    return try {
      val arr = JsonParser.parseString(raw).asJsonArray
      val turns = mutableListOf<ChatTurn>()
      for (el in arr) {
        if (!el.isJsonObject) continue
        val o = el.asJsonObject
        val user = o.get("user")?.asString?.trim() ?: ""
        val assistant = o.get("assistant")?.asString?.trim() ?: ""
        if (user.isNotBlank() || assistant.isNotBlank()) turns.add(ChatTurn(user, assistant))
      }
      turns
    } catch (_: Exception) {
      emptyList()
    }
  }

  /**
   * Formats the chat history turns as readable text for AI system prompts. Produces numbered
   * "User:" / "Assistant:" lines so the AI can resolve references like "apply options 1, 2, 5, 7"
   * against the list the assistant gave earlier in the chat popup.
   */
  private fun buildChatContext(chatTurns: List<ChatTurn>): String {
    if (chatTurns.isEmpty()) return ""
    val sb = StringBuilder()
    // The numbered options the user refers to (e.g. "do 1, 2, 5 and 7") may have been listed by the
    // assistant SEVERAL turns earlier in this history — the whole conversation is always sent, so
    // search all assistant messages for the numbered list before asking or deciding anything.
    sb.append((loadPromptWithClasspathFallback("codbi.chat_context_note") ?: "").trimEnd())
    sb.append("\n")
    for ((i, t) in chatTurns.withIndex()) {
      if (t.user.isNotBlank()) sb.append("${i + 1}. User: ${t.user}\n")
      if (t.assistant.isNotBlank()) sb.append("   Assistant: ${t.assistant}\n")
    }
    return sb.toString().trim()
  }

  /**
   * Asks the AI whether the user's message contains a question and/or instructions, and produces
   * the answer text when a question is present. Runs on EVERY run — the AI decides authoritatively
   * (there is no heuristic gate). Returns null on failure.
   */
  private fun produceChatAnswer(
      prompt: String,
      modelId: String,
      instance: Standard,
      formStructureContext: String?,
      completeFormJson: String?,
      completeWorkflowJson: String?,
      chatTurns: List<ChatTurn>,
      clarificationContext: String,
      formKey: String?,
      userContext: Any?
  ): ChatAnswer? {
    // Matomo statistics of the current form. When the AI requests them
    // ({"status":"need_matomo_stats"}), they are fetched ONCE from the Matomo server (plugin
    // properties AI_FormAssistant_Matomo_URL / AI_FormAssistant_Matomo_APIKey) and injected into
    // the
    // next round's system prompt. When the properties are not configured, the injected context
    // tells
    // the AI to inform the user that the administrator has to define them.
    var matomoStatsContext: String? = null
    var statsFetched = false
    var tokensIn = 0
    var tokensOut = 0

    fun runCall(system: String): String {
      val messagesJson = buildString {
        append("[")
        append("""{"role":"system","content":${gson.toJson(system)}},""")
        append("""{"role":"user","content":${gson.toJson(prompt)}}""")
        append("]")
      }
      val raw = instance.performFormAssist(modelId, messagesJson)
      tokensIn += estimateTokens(messagesJson)
      tokensOut += estimateTokens(raw)
      return raw
    }

    fun buildSystem(): String = buildString {
      append(loadPromptWithClasspathFallback("codbi.chat_system_prompt") ?: "")
      // The FORM STATISTICS (MATOMO) rule is only transmitted when the Matomo plugin properties
      // (AI_FormAssistant_Matomo_URL / AI_FormAssistant_Matomo_APIKey) are configured. When they
      // are
      // not configured, the not-configured prompt tells the AI to inform the user — instead of the
      // AI replying {"status":"need_matomo_stats"} (which could never be fulfilled).
      val matomoPromptKey =
          if (MatomoStats.isConfigured()) "codbi.chat_matomo_configured"
          else "codbi.chat_matomo_not_configured"
      loadPromptWithClasspathFallback(matomoPromptKey)
          ?.takeIf { it.isNotBlank() }
          ?.let { append("\n\n").append(it.trim()) }
      // Tell the AI today's date so date-relative statistics questions ("gestern", "diese Woche
      // Montag", "Montag bis heute") can be resolved to concrete dates and weekdays are correct.
      append(
          "\n\nToday's date is ${java.time.LocalDate.now()} " +
              "(${java.time.LocalDate.now().dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)}).")
      append(
          renderChatContext(
              formStructureContext,
              completeFormJson,
              completeWorkflowJson,
              buildChatContext(chatTurns),
              clarificationContext))
      if (!matomoStatsContext.isNullOrBlank()) {
        append("\n\n## MATOMO STATISTICS OF THE CURRENT FORM\n\n").append(matomoStatsContext)
      }
    }

    return try {
      var currentSystem = buildSystem()
      // Up to two rounds: round 1 without statistics; when the AI requests them, round 2 carries
      // the statistics in the system prompt. Each round performs the normal first call + strict
      // retry so the original behavior is preserved for every non-statistics turn.
      for (round in 0 until 2) {
        currentSystem = buildSystem()
        val raw = runCall(currentSystem)
        val cleaned = extractJson(stripThinkTags(raw)).trim()
        val statsRequest = parseMatomoStatsRequest(cleaned)
        if (statsRequest != null) {
          if (!statsFetched) {
            statsFetched = true
            // Safety net: when the AI's signal carries no period/date (e.g. an older installed
            // prompt that only knows {"status":"need_matomo_stats"}), infer the period from the
            // user's question so "yesterday" / "this week" queries still return the right slice.
            val effectiveRequest = inferMatomoPeriod(prompt, statsRequest)
            val focusedRequest = inferMatomoFocus(prompt, effectiveRequest)
            matomoStatsContext =
                fetchMatomoStatsContext(
                    formKey,
                    userContext,
                    focusedRequest.period,
                    focusedRequest.date,
                    focusedRequest.dateTo,
                    focusedRequest.focus)
            logger.info(
                "[AICodBiAssistant] AI requested Matomo statistics (period={}, date={} -> effective {}); context length={}",
                statsRequest.period,
                statsRequest.date,
                effectiveRequest.period,
                matomoStatsContext?.length ?: 0)
            continue
          }
          // Statistics were already provided but the model still asks — fall through to the normal
          // envelope parsing / strict retry below so the run does not loop forever.
        }
        parseChatAnswerRaw(raw, currentSystem)?.let { answer ->
          return answer.copy(
              tokensIn = tokensIn, tokensOut = tokensOut, matomoStatsContext = matomoStatsContext)
        }
        // The first response was not the structured envelope — retry once with a strict instruction
        // so the model emits ONLY the raw JSON object.
        val strictSystem =
            currentSystem + "\n\n" + (loadPromptWithClasspathFallback("codbi.retry_chat") ?: "")
        val retryRaw = runCall(strictSystem)
        parseChatAnswerRaw(retryRaw, strictSystem)?.let { answer ->
          return answer.copy(
              tokensIn = tokensIn, tokensOut = tokensOut, matomoStatsContext = matomoStatsContext)
        }
        break
      }
      // Last resort: classification failed. Use a minimal question heuristic so a question still
      // receives an answer-only response instead of being misrouted to the form AI.
      val looksLikeQuestion =
          prompt.contains("?") ||
              QUESTION_STARTERS.any { prompt.trimStart().startsWith(it, ignoreCase = true) }
      logger.warn(
          "[AICodBiAssistant] Chat classification failed twice; heuristic fallback (question={})",
          looksLikeQuestion)
      ChatAnswer(
          hasQuestion = looksLikeQuestion,
          hasInstructions = !looksLikeQuestion,
          answer =
              if (looksLikeQuestion)
                  "Ich konnte deine Frage nicht zuordnen. Bitte formuliere sie um."
              else "",
          tokensIn = tokensIn,
          tokensOut = tokensOut,
          matomoStatsContext = matomoStatsContext)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Chat answer pass failed: {}", e.message)
      null
    }
  }

  /**
   * Parses a structured chat-answer response, or null when it is not the expected JSON envelope.
   *
   * A response that carries a `"status"` field (e.g. `{"status":"need_matomo_stats"}`) is a backend
   * SIGNAL, not a chat answer — it is rejected here so it cannot be misread as an empty envelope
   * (which would surface as a blank "Alles klar." bubble). Such responses fall through to the
   * strict envelope retry instead.
   */
  private fun parseChatAnswerRaw(raw: String, messagesJson: String): ChatAnswer? {
    return try {
      val cleaned = extractJson(stripThinkTags(raw)).trim()
      logger.debug("[AICodBiAssistant] Chat answer response: {}", compactJsonForLog(cleaned))
      val obj = JsonParser.parseString(cleaned).asJsonObject
      if (obj.has("status")) {
        logger.info("[AICodBiAssistant] Chat response is a status signal — not an answer envelope")
        return null
      }
      ChatAnswer(
          hasQuestion = obj.get("hasQuestion")?.asBoolean ?: false,
          hasInstructions = obj.get("hasInstructions")?.asBoolean ?: false,
          answer = obj.get("answer")?.asString?.trim() ?: "",
          tokensIn = estimateTokens(messagesJson),
          tokensOut = estimateTokens(raw))
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Could not parse chat answer: {}", e.message)
      null
    }
  }

  /**
   * The AI's statistics-request signal:
   * `{"status":"need_matomo_stats","period":"day"|"week"|"range"|
   * "month","date":"yesterday"|"today"|"YYYY-MM-DD","dateTo":"YYYY-MM-DD"}`.
   * `period`/`date`/`dateTo` may be null — the backend then uses sensible defaults (month + today,
   * yesterday for single-day questions, or the last 7 days for ranges).
   */
  private data class MatomoStatsRequest(
      val period: String?,
      val date: String?,
      val dateTo: String? = null,
      val focus: String? = null
  )

  /**
   * Parses the AI's JSON response into a [MatomoStatsRequest], or returns null when the response is
   * NOT a statistics signal — regular answer envelopes are unaffected. The signal is what the chat
   * system prompt teaches the AI to emit instead of a regular answer when the user asks about the
   * form's usage / statistics or asks for an optimisation analysis. The backend then fetches the
   * statistics for the requested period and re-runs the chat call with them in the system prompt.
   */
  private fun parseMatomoStatsRequest(cleaned: String): MatomoStatsRequest? {
    return try {
      val obj = JsonParser.parseString(cleaned).asJsonObject
      if (obj.get("status")?.asString != "need_matomo_stats") return null
      val period = obj.get("period")?.takeIf { it.isJsonPrimitive }?.asString
      val date = obj.get("date")?.takeIf { it.isJsonPrimitive }?.asString
      val dateTo = obj.get("dateTo")?.takeIf { it.isJsonPrimitive }?.asString
      val focus = obj.get("focus")?.takeIf { it.isJsonPrimitive }?.asString
      MatomoStatsRequest(period, date, dateTo, focus)
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Fills in a missing period/date from the user's question. The AI normally includes the period in
   * its statistics signal (taught by the bundled prompt); this is a defensive fallback for older
   * installed prompts that only emit `{"status":"need_matomo_stats"}`. When the AI already chose a
   * period, it is respected unchanged. German/English weekday names and "bis" (e.g. "Montag bis
   * heute") are resolved against today's date.
   */
  private fun inferMatomoPeriod(prompt: String, request: MatomoStatsRequest): MatomoStatsRequest {
    val text = prompt.lowercase()
    val today = java.time.LocalDate.now()
    val weekday = WEEKDAY_NAMES.firstOrNull { (name, _) -> text.contains(name) }
    // A weekday + "bis" + heute/gestern is an unambiguous date range (e.g. "von Montag bis
    // einschließlich heute"). Checked FIRST and overriding whatever the AI signaled — "week" would
    // wrongly return the last 7 days, not "this week's Monday until today".
    if (weekday != null &&
        text.contains("bis") &&
        (text.contains("heute") ||
            text.contains("today") ||
            text.contains("gestern") ||
            text.contains("yesterday"))) {
      val daysSinceStart = (today.dayOfWeek.value - weekday.second.value + 7) % 7
      val start = today.minusDays(daysSinceStart.toLong())
      val end =
          if (text.contains("gestern") || text.contains("yesterday")) today.minusDays(1) else today
      if (start.isBefore(end)) {
        return MatomoStatsRequest("range", start.toString(), end.toString())
      }
    }
    if (request.period != null) return request
    val isoDates = Regex("\\d{4}-\\d{2}-\\d{2}").findAll(text).map { it.value }.toList()
    if (isoDates.size >= 2) return MatomoStatsRequest("range", isoDates[0], isoDates[1])
    if (isoDates.size == 1) return MatomoStatsRequest("day", isoDates[0])
    if (weekday != null) {
      // A single weekday ("am Montag") -> this week's occurrence; if it lies in the future, use the
      // previous week.
      val daysSinceStart = (today.dayOfWeek.value - weekday.second.value + 7) % 7
      val start = today.minusDays(daysSinceStart.toLong())
      val single = if (start.isAfter(today)) start.minusWeeks(1) else start
      return MatomoStatsRequest("day", single.toString())
    }
    return when {
      text.contains("gestern") || text.contains("yesterday") ->
          MatomoStatsRequest("day", "yesterday")
      text.contains("heute") || text.contains("today") -> MatomoStatsRequest("day", "today")
      text.contains("woche") ||
          text.contains("week") ||
          text.contains("7 tage") ||
          text.contains("7 tagen") ||
          text.contains("sieben tag") -> MatomoStatsRequest("week", null)
      text.contains("monat") ||
          text.contains("month") ||
          text.contains("30 tage") ||
          text.contains("30 tagen") -> MatomoStatsRequest("month", null)
      else -> request
    }
  }

  /**
   * Fills in a missing focus from the user's question. Questions about ALL forms (e.g. "how often
   * were all forms called in total?", "wie oft wurden alle Formulare insgesamt aufgerufen?") set
   * focus "all_forms" so the backend omits the per-field analytics of the current form (which is
   * irrelevant noise for such questions). The AI's explicit focus wins.
   */
  private fun inferMatomoFocus(prompt: String, request: MatomoStatsRequest): MatomoStatsRequest {
    if (request.focus != null) return request
    val text = prompt.lowercase()
    val mentionsForms =
        text.contains("formular") ||
            text.contains("form ") ||
            text.contains(" forms") ||
            text.contains(" formular")
    val allForms =
        text.contains("alle formular") ||
            text.contains("all form") ||
            text.contains("alle aufrufe") ||
            text.contains("alle aufgeruf") ||
            (mentionsForms &&
                (text.contains("alle ") ||
                    text.contains("all ") ||
                    text.contains("insgesamt") ||
                    text.contains("in total")))
    return if (allForms) request.copy(focus = "all_forms") else request
  }

  /**
   * Resolves the current form's title and queries the Matomo server (plugin properties
   * `AI_FormAssistant_Matomo_URL` / `AI_FormAssistant_Matomo_APIKey`) for its statistics,
   * restricted to the requested [period] (day / week / month) and [date]. Returns a non-null text
   * for the AI: either the statistics summary, or — when the properties are not configured or the
   * query failed — an instruction telling the AI how to inform the user.
   */
  private fun fetchMatomoStatsContext(
      formKey: String?,
      userContext: Any?,
      period: String? = null,
      date: String? = null,
      dateTo: String? = null,
      focus: String? = null
  ): String? {
    val title =
        if (!formKey.isNullOrBlank() && userContext != null) {
          try {
            resolveCurrentFormTitle(userContext, formKey)
          } catch (e: Exception) {
            logger.warn(
                "[AICodBiAssistant] Could not resolve form title for Matomo statistics: {}",
                e.message)
            null
          }
        } else null
    val stats = MatomoStats.queryFormStats(title, period, date, dateTo, focus)
    if (stats != null) return stats
    return if (MatomoStats.isConfigured()) {
      "The statistics of the current form could not be retrieved from Matomo (the form was not " +
          "found in the tracking data, or the Matomo query failed). Tell the user that no " +
          "statistics are available for this form right now."
    } else {
      "The Matomo statistics are NOT available because the administrator has NOT configured the " +
          "plugin properties. Tell the user that the administrator has to define the plugin " +
          "properties \"AI_FormAssistant_Matomo_URL\" and \"AI_FormAssistant_Matomo_APIKey\" in " +
          "order for the statistics of the current form to be queried."
    }
  }

  /**
   * Parses a Matomo statistics context (a JSON string produced by [MatomoStats.queryFormStats])
   * into a [JsonObject] so the chat response can embed the structured data for the frontend charts.
   * Returns null when the context is blank or not valid JSON — the response then omits the chart
   * data.
   */
  private fun parseStatsJson(ctx: String?): JsonObject? {
    if (ctx.isNullOrBlank()) return null
    return try {
      val parsed = JsonParser.parseString(ctx)
      if (parsed.isJsonObject) parsed.asJsonObject else null
    } catch (e: Exception) {
      null
    }
  }

  // endregion Form Chat

  companion object {
    /**
     * German/English weekday names mapped to their day-of-week, used by [inferMatomoPeriod] to
     * resolve "Montag"/"Monday" to concrete dates.
     */
    private val WEEKDAY_NAMES =
        listOf(
            "montag" to java.time.DayOfWeek.MONDAY,
            "dienstag" to java.time.DayOfWeek.TUESDAY,
            "mittwoch" to java.time.DayOfWeek.WEDNESDAY,
            "donnerstag" to java.time.DayOfWeek.THURSDAY,
            "freitag" to java.time.DayOfWeek.FRIDAY,
            "samstag" to java.time.DayOfWeek.SATURDAY,
            "sonntag" to java.time.DayOfWeek.SUNDAY,
            "monday" to java.time.DayOfWeek.MONDAY,
            "tuesday" to java.time.DayOfWeek.TUESDAY,
            "wednesday" to java.time.DayOfWeek.WEDNESDAY,
            "thursday" to java.time.DayOfWeek.THURSDAY,
            "friday" to java.time.DayOfWeek.FRIDAY,
            "saturday" to java.time.DayOfWeek.SATURDAY,
            "sunday" to java.time.DayOfWeek.SUNDAY)

    /** Fallback question starters used ONLY when the AI chat classification fails (last resort). */
    private val QUESTION_STARTERS =
        listOf(
            "was ",
            "wie ",
            "welche",
            "welcher",
            "welches",
            "wer ",
            "warum",
            "wo ",
            "wann ",
            "kannst",
            "kann ",
            "ist ",
            "sind ",
            "erkläre",
            "erklär mir",
            "beschreibe",
            "nenne",
            "liste",
            "what ",
            "which",
            "how ",
            "why ",
            "where ",
            "when ",
            "can ",
            "could ",
            "is ",
            "are ",
            "explain",
            "describe",
            "list ",
            "tell me",
            "ich möchte wissen",
            "ich will wissen",
            "ich würde gerne wissen")

    /**
     * Default maximum number of additional detail-reruns after the initial form pass (overridable
     * via the plugin property `AI_FormAssistant_MaxFormReruns`). When the AI keeps answering
     * `need_codbi_details` (e.g. a small model that first asks for CodBi details, then asks again
     * for specific widget types), `rerunWithCodbiDetails` loops up to this many extra times with
     * the newly requested elements/widgets before giving up and splicing the last result.
     */
    private const val MAX_FORM_RERUNS = 2

    // All prompt texts (structure rules, control-types rules, complete-form rules, change-log
    // schema, chat context, chat system prompt, fallback prompts) live in the bundled .md files
    // (see prompts/index.json) and are loaded via PromptLoader with a classpath fallback — the
    // backend itself contains no prompt text anymore.
  }
}
