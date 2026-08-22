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

  override fun getName(): String = "CodBi_AICodBiAssistant"

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    // Apply per-user CodBi element visibility for the whole request so every prompt transmitted to
    // the AI omits the elements hidden for the current user.
    return CodBiElementAccess.runForUser(currentUsername(params)) {
      val action =
          params.headerMap.entries.find { it.key.equals("X-Action", ignoreCase = true) }?.value
      when (action) {
        "Models" -> handleModels()
        "Run" -> handleRun(params)
        "AppointmentPlan" -> handleAppointmentPlan(params)
        "Status" -> handleStatus()
        "Log" -> handleLog(params)
        "SensitiveCheck" -> handleSensitiveCheck(params)
        else -> jsonResponse("""{"error":"Unknown action"}""")
      }
    }
  }

  /** Reads the CodBi element-access plugin properties (idempotent). */
  override fun initialize(configData: IPluginInitializeData) {
    CodBiElementAccess.initialize(configData.properties)
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

  /** True after the first schema dump has been logged. */
  private var schemaDumped = false

  /**
   * Scans the form JSON for XAppointment elements that have an "appointmentPlan" (human-readable
   * schedule name) but no "appointmentTemplate" (UUID). Resolves the name to a UUID by querying the
   * FORMCYCLE appointment_plan database table and injects the "appointmentTemplate" property.
   */
  private fun resolveAppointmentPlans(formJson: String): String {
    logger.info(
        "[AICodBiAssistant] resolveAppointmentPlans called with formJson length={}",
        formJson.length)
    val emf =
        CodbiEntities.entityManagerFactory
            ?: return formJson.also {
              logger.info("[AICodBiAssistant] resolveAppointmentPlans: no EntityManagerFactory")
            }
    // Dump schema info once on first call for debugging
    if (!schemaDumped) {
      schemaDumped = true
      try {
        val em = emf.createEntityManager()
        try {
          val tq =
              em.createNativeQuery(
                  "SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('information_schema', 'pg_catalog', 'mysql') ORDER BY table_name")
          logger.info("[AICodBiAssistant] All database tables: {}", tq.resultList)
          // Also dump APPOINTMENT_TEMPLATE columns
          try {
            val colQ =
                em.createNativeQuery(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = 'APPOINTMENT_TEMPLATE' ORDER BY ordinal_position")
            logger.info("[AICodBiAssistant] APPOINTMENT_TEMPLATE columns: {}", colQ.resultList)
          } catch (_: Exception) {
            logger.warn("[AICodBiAssistant] Could not query APPOINTMENT_TEMPLATE columns")
          }
          // Sample first row
          try {
            val sampleQ =
                em.createNativeQuery("SELECT * FROM APPOINTMENT_TEMPLATE FETCH FIRST 1 ROWS ONLY")
            logger.info(
                "[AICodBiAssistant] APPOINTMENT_TEMPLATE sample row: {}", sampleQ.resultList)
          } catch (_: Exception) {
            try {
              val sampleQ2 = em.createNativeQuery("SELECT * FROM APPOINTMENT_TEMPLATE LIMIT 1")
              logger.info(
                  "[AICodBiAssistant] APPOINTMENT_TEMPLATE sample row: {}", sampleQ2.resultList)
            } catch (_: Exception) {
              logger.warn("[AICodBiAssistant] Could not sample APPOINTMENT_TEMPLATE")
            }
          }
        } finally {
          em.close()
        }
      } catch (e: Exception) {
        logger.warn("[AICodBiAssistant] Failed to dump schema: ${e.message}")
      }
    }
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items =
          root.getAsJsonArray("items")
              ?: return formJson.also {
                logger.info(
                    "[AICodBiAssistant] resolveAppointmentPlans: no items array in formJson")
              }
      logger.info("[AICodBiAssistant] resolveAppointmentPlans: scanning {} items", items.size())
      var changed = false
      for (i in 0 until items.size()) {
        val item = items[i].asJsonObject
        val className = item.get("className")?.asString ?: continue
        if (className != "XAppointment") continue
        val props = item.getAsJsonObject("properties") ?: continue
        logger.info(
            "[AICodBiAssistant] resolveAppointmentPlans: found XAppointment '{}', props keys: {}",
            props.get("name")?.asString,
            props.keySet())
        if (props.has("appointmentTemplate")) {
          logger.info(
              "[AICodBiAssistant] resolveAppointmentPlans: XAppointment already has appointmentTemplate, skipping")
          continue
        }
        val planName = props.get("appointmentPlan")?.asString
        if (planName == null) {
          logger.info(
              "[AICodBiAssistant] resolveAppointmentPlans: XAppointment has no appointmentPlan, skipping")
          continue
        }
        logger.info(
            "[AICodBiAssistant] Found XAppointment with appointmentPlan='{}' â€” resolving...",
            planName)
        val em = emf.createEntityManager()
        try {
          val query =
              em.createNativeQuery("SELECT UUID FROM APPOINTMENT_TEMPLATE WHERE NAME = :name")
          query.setParameter("name", planName)
          val result = query.resultList
          if (result.isNotEmpty()) {
            props.addProperty("appointmentTemplate", result[0].toString())
            changed = true
            logger.info(
                "[AICodBiAssistant] Resolved appointment plan '{}' to UUID '{}'",
                planName,
                result[0])
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
    var latestFormElements: String? = params.requestParameters["formElements"]?.firstOrNull()
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
              clarificationContext)
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] Chat answer pass failed: {}", e.message)
          null
        }
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
      logger.info("[AICodBiAssistant] Answer-only chat turn (no form/workflow changes)")
      return jsonResponse(
          """{"intent":${gson.toJson(intent)},"chatAnswer":${gson.toJson(answerText)},"hasQuestion":${chatAnswerResult.hasQuestion},"tokens":${chatAnswerResult.tokensIn + chatAnswerResult.tokensOut},"tokensIn":${chatAnswerResult.tokensIn},"tokensOut":${chatAnswerResult.tokensOut},"cost":${chatCost ?: "null"},"currency":${gson.toJson(chatPrice?.currency)}}""")
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
                imageParts)
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
          "[AICodBiAssistant] AI requested clarification with {} question(s)",
          clarification.questions.size)
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
      val (formJson, applicabilityReport, formTokenUsage) =
          try {
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
                changeHistoryContext)
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
      // Propagate a form-AI error response unchanged
      val formParsed = runCatching { JsonParser.parseString(formJson) }.getOrNull()
      if (formParsed?.isJsonObject == true && formParsed.asJsonObject.has("error")) {
        return jsonResponse(formJson)
      }
      // If the AI answered with prose instead of form JSON, stop with a clean error instead of
      // embedding the prose into the response (which the frontend would then fail to parse).
      if (formParsed == null) {
        logger.warn("[AICodBiAssistant] Form AI returned non-JSON; aborting run")
        return jsonResponse(
            """{"error":${gson.toJson("The AI did not return a valid form JSON: ${formJson.take(300)}")}}""")
      }
      // Auto-resolve appointment plan names to UUIDs for XAppointment elements, neutralize
      // destructive SQL the AI may have placed into a button's customAction (form-level injection),
      // and keep the form's pages when the AI was asked to remove widgets/workflows (not pages).
      val appointmentResolved = resolveAppointmentPlans(formJson)
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
      result.append(""","formJson":$resolvedFormJson""")
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
        logger.info(
            "[AICodBiAssistant] Computed updated standards: current='{}', aiSet='{}', result='{}'",
            currentStandards,
            aiSetStandards,
            updatedStandards)
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

    if (intent == "workflow" || intent == "both") {
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

    // Resolve the selected model's pricing and compute the estimated cost of this run from the
    // accumulated input/output tokens. `null` when no price is configured for the model.
    val modelPrice = instance.priceForModel(modelId)
    val runCost = modelPrice?.costFor(tokensIn.toLong(), tokensOut.toLong())
    val runCurrency = modelPrice?.currency

    // Compute the change description — used both for the change-log record and to detect whether
    // any configured "sensitive" CodBi element (AI_Log_SensitiveElements) was used by this run.
    var formChanges: JsonObject? = null
    if (intent == "form" || intent == "both") {
      val before = persistJson
      val after = resolvedFormJson
      if (before != null && after != null) {
        formChanges = AiAssistantLog.computeFormChanges(before, after)
      }
    }
    val sensitiveUsed =
        formChanges?.let { AiAssistantLog.usedSensitiveElements(it, AI.logSensitiveElements) }
            ?: emptyList()
    logger.info(
        "[AICodBiAssistant] Sensitive elements used: {} (configured: {})",
        sensitiveUsed,
        AI.logSensitiveElements)
    // Destructive SQL statements the AI generated that were blocked by the backend sanitizer. Like
    // sensitive elements, these make the frontend auto-open the change log (with an error icon) so
    // the user sees that the destructive statement was NOT persisted.
    val blockedSqlUsed =
        workflowNodes?.let { AiAssistantLog.blockedSqlNodeLabels(it) } ?: emptyList()
    logger.info("[AICodBiAssistant] Blocked SQL statements: {}", blockedSqlUsed)

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

    logger.info(
        "[AICodBiAssistant] Phase-1 messages sent to AI (model={}): {}", modelId, messagesJson)
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
      changeHistoryContext: String? = null
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
            "\n\nThe user already answered these clarification questions — treat the answers as part of the instruction and build the COMPLETE form accordingly. The answers resolve ONLY the specific questions they belong to; you must STILL create every field and wire EVERY element placeholder (EP) / CodBi functionality described in the system prompt (OpenPLZ EPs → XSelect with data-cb-func=\"html.select.injection\" + the EP in data-cb-Values; other EP output/research fields such as Date.Holidays, Data.CSV, Data.Join, Date.FromString, DOM.Query, JSON.Path, LDAP.Find, Net.URL, Sorted, Unique, F, I, V → data-cb-func=\"JSON.SET\" / \"HTML.Text.Injector\" wired as the field's value; Sys.Log.Console for console logging). NEVER emit an EP/research field as a bare plain text field without its EP wiring.\n\nAnswers:\n$clarificationContext"
    val userContent =
        "Instruction: $prompt$imageHint$clarificationInstruction\n\nCurrent form (IPersistJson):\n${slimPersistJson(persistJson)}" +
            "\n\nREMINDER: your response MUST include a top-level \"_codbiApplicability\" field as described in the system prompt.\n" +
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
      logger.info("[AICodBiAssistant] Pass-{} raw result: {}", rerunCount + 2, pass2Cleaned)
      // The AI may ask for even MORE details in the rerun (a second `need_codbi_details`, e.g. for
      // widget types it only names in pass-2). Loop once more with the new request so the widgets
      // the user asked for are not silently dropped. Bounded by [MAX_FORM_RERUNS] to avoid looping
      // indefinitely when the model keeps requesting details.
      if (rerunCount < MAX_FORM_RERUNS) {
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
                "Return the COMPLETE modified form JSON with ALL items now."
        val finalMessagesJson =
            "[{\"role\":\"system\",\"content\":${gson.toJson(finalSystemPrompt)}}," +
                "{\"role\":\"user\",\"content\":${gson.toJson(finalUserContent)}}]"
        val finalRaw = instance.performFormAssist(modelId, finalMessagesJson)
        tokensIn += estimateTokens(finalMessagesJson)
        tokensOut += estimateTokens(finalRaw)
        val finalCleaned = extractJson(stripThinkTags(finalRaw))
        logger.info("[AICodBiAssistant] Final forced pass raw result: {}", finalCleaned)
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
            if (jsonDeclaresNothingApplies(cleaned) || rawClaimsNothingApplies(rawResponse)) {
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

    logger.debug("[AICodBiAssistant] Form AI response: {}", cleaned)

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
                gson.toJson(obj)
              }
              .getOrDefault(restored)
      // Log item names in the final form JSON to debug missing elements
      try {
        val root = JsonParser.parseString(finalForm).asJsonObject
        val names =
            root.getAsJsonArray("items")?.mapNotNull { el ->
              el.takeIf { it.isJsonObject }
                  ?.asJsonObject
                  ?.getAsJsonObject("properties")
                  ?.get("name")
                  ?.asString
            } ?: emptyList()
        val pageElements =
            root
                .getAsJsonArray("items")
                ?.firstOrNull {
                  it.isJsonObject && it.asJsonObject.get("className")?.asString == "XPage"
                }
                ?.asJsonObject
                ?.getAsJsonObject("properties")
                ?.getAsJsonArray("elements")
                ?.mapNotNull { it.takeIf { it.isJsonPrimitive }?.asString } ?: emptyList()
        logger.info("[AICodBiAssistant] Final form item names ({}): {}", names.size, names)
        logger.info("[AICodBiAssistant] First page elements: {}", pageElements)
      } catch (_: Exception) {}
      Triple(finalForm, applicabilityReport, TokenUsage(tokensIn, tokensOut))
    } catch (_: Exception) {
      logger.warn("[AICodBiAssistant] Form AI returned unparseable response: {}", sanitizedCleaned)
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
      if ((obj?.get("status") as? String) != "need_workflow_node_details") {
        return null
      }
      val nodesArr = obj["nodes"] as? List<*> ?: emptyList<Any>()
      val nodes = nodesArr.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
      val triggersArr = obj["triggers"] as? List<*> ?: emptyList<Any>()
      val triggers = triggersArr.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
      WorkflowDetailsSignal(nodes = nodes, triggers = triggers)
    } catch (_: Exception) {
      null
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
          "i18n",
          "viewstatus",
          "viewusergroup",
          "readonly_viewstatus",
          "readonly_viewusergroup",
          "statusdependent",
          "readonly_statusdependent",
          "usergrouppendent",
          "readonly_usergrouppendant",
          // Attributes â€” stripped to prevent stale data-cb-* entries from surviving when items
          // are restored in restoreStrippedFields. The AI always outputs fresh data-cb-* as
          // direct property keys, which are converted to the proper attributes array at the end
          // of restoreStrippedFields.
          "attributes",
          "print_hide",
          "print_size",
          "print_text_only",
          "print_break",
          "print_border",
          "backgroundcolor",
          "helptext",
          "comment",
          "pdfImporterId",
          // "rowid" is intentionally NOT stripped: it groups sibling fields into ONE row
          // (Formcycle renders a "xm-form-row" div for every distinct non-empty rowid). The AI
          // sets it on new fields to place them side by side, and existing row groupings are
          // shown to the AI as examples in the slim JSON.
          "computedwidth",
          "maxwidth",
          "minwidth",
          // Number formatting â€” display-only, ~15 fields per XTextField; AI doesn't need them,
          // restoreStrippedFields re-applies them from the original for existing items.
          "numberFormatDigitGroupMode",
          "numberFormatInlineUnitSign",
          "numberFormatDigitGroupSeparator",
          "numberFormatNegativeSign",
          "numberFormatUnitSignPlacement",
          "numberFormatDecimalPlaces",
          "numberFormatSignumSignPlacement",
          "numberFormatShowPositiveSign",
          "numberFormatEmptyMode",
          "numberFormatPositiveSign",
          "numberFormatDecimalPaddingMode",
          "numberFormatRoundingMode",
          "numberFormatLeadingZeroMode",
          "numberFormatChangeValueOnWheel",
          "numberFormatDecimalSeparator",
          // Input constraints â€” AI creates fields from templates; defaults are fine for new
          // items.
          "maxlength",
          "minlength",
          "mask",
          "autocomplete",
          "datepicker",
          "unitwidth",
          // Layout â€” AI uses item templates which have FORMCYCLE defaults.
          "labeldir",
          "labelwidth",
          "flex",
          "height",
          // Dynamic/repeatable â€” visible to AI so it can create repeatable containers.
          // AI can set dynamic=1 with
          // dynamicMinSize/MaxSize/AddText/DeleteText/HideButtons/Trigger.
          // Conditional visibility/readonly â€” AI doesn't generate these; restored for originals.
          "readonlyifclear",
          "readonlyifmode",
          "readonlyifcomp",
          "requiredifcomp",
          "hiddenifclear",
          "hiddenifcomp",
          // Workflow-status / user-group visibility â€” stripped from slim JSON so the AI starts
          // fresh (no copy-paste from existing items), but validated and re-applied for new
          // AI-created items via sanitizeVisibilityProp(). Existing items still restore from
          // the original.
          "viewstatus",
          "viewusergroup",
          "readonly_viewstatus",
          "readonly_viewusergroup",
          "statusdependent",
          "readonly_statusdependent",
          "usergrouppendent",
          "readonly_usergrouppendant",
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

  private fun slimPersistJson(json: String): String {
    val root = JsonParser.parseString(json).asJsonObject
    for (field in STRIPPED_FIELDS) root.remove(field)
    // Remove XFooter â€” structural chrome the AI must not see or modify; restored automatically
    root.getAsJsonArray("items")?.let { arr ->
      arr.firstOrNull { it.isJsonObject && it.asJsonObject.get("className")?.asString == "XFooter" }
          ?.let { arr.remove(it) }
    }
    root.getAsJsonArray("items")?.forEach { el ->
      if (!el.isJsonObject) return@forEach
      val props = el.asJsonObject.getAsJsonObject("properties") ?: return@forEach
      for (key in STRIPPED_ITEM_PROPS) props.remove(key)
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
      // Strip action objects from XButtonList buttons so the AI cannot copy existing page values
      if (el.asJsonObject.get("className")?.asString == "XButtonList") {
        props.getAsJsonArray("buttons")?.forEach { btn ->
          if (btn.isJsonObject) btn.asJsonObject.remove("action")
        }
      }
    }
    return gson.toJson(root)
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
              logger.info(
                  "[AICodBiAssistant] Preserving hidden condition '{}'='{}' on new item '{}'",
                  key,
                  value,
                  props.get("name")?.asString ?: props.get("id")?.asString ?: "<unknown>")
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
          restoredRefs.getOrPut(cname) { mutableSetOf() }.addAll(missing)
          for (childName in missing) {
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
            logger.info(
                "[AICodBiAssistant] Restored {} dropped child reference(s) of container '{}'",
                missing.size,
                cname)
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
          logger.info("[AICodBiAssistant] Normalized parentid of '{}' to '{}'", name, parentId)
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
            changeHistoryContext)

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
    logger.info("[AICodBiAssistant] Workflow AI pass-1 raw response: {}", cleaned)

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
              changeHistoryContext)
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
      logger.info("[AICodBiAssistant] Workflow AI pass-2 raw response: {}", cleaned)
    }

    // Replace symbolic "$ROOT" breakTarget with a safe UUID placeholder before JSON parsing
    var safeCleaned = cleaned.replace("\$ROOT", "00000000-0000-0000-0000-000000000000")

    // When the AI answered with prose instead of a JSON workflow spec (e.g. it is unsure what to
    // change because it has no context, or it keeps asking clarifying questions after the
    // clarification rounds), retry ONCE with a strict corrective instruction before surfacing a
    // readable error. This avoids the "did not return a workflow specification" failure that
    // previously aborted the run after several clarification loops.
    if (!safeCleaned.trim().startsWith("{") && !safeCleaned.trim().startsWith("[")) {
      logger.warn(
          "[AICodBiAssistant] Workflow AI returned prose — retrying once with strict JSON instruction: {}",
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
      logger.info("[AICodBiAssistant] Workflow AI retry raw response: {}", retryCleaned.take(300))
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
                changeHistoryContext)
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
          val parsed = JsonParser.parseString(safeCleaned)
          val specs: List<WorkflowTaskSpec> =
              when {
                parsed.isJsonArray ->
                    gson.fromJson(safeCleaned, Array<WorkflowTaskSpec>::class.java).toList()
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
                      listOf(gson.fromJson(safeCleaned, WorkflowTaskSpec::class.java))
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
    // WorkflowTaskSpec). createWorkflowTask is kept for backward compatibility.
    val results = taskSpecs.map { spec -> applyWorkflowOperation(workflowVersionId, spec, params) }
    val combinedResult = results.joinToString(" | ")
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
      val pathName = spec.taskName.trim().takeIf { it.isNotEmpty() } ?: deriveNodeName(spec)
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
      changeHistoryContext: String? = null
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
      val workflowTemplate = loadWorkflowTaskInstruction() ?: ""
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
          changeLogSchema = loadChangeLogSchema())
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
    }

    val workflowTaskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
    val task = workflowTaskClass.getDeclaredConstructor().newInstance()
    workflowTaskClass
        .getMethod("setName", String::class.java)
        .invoke(task, spec.taskName.ifBlank { "AI-generated task" })
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

    // Process chained nodes (sequential actions in the same task)
    if (spec.chainedNodes != null && spec.chainedNodes.isNotEmpty()) {
      var prevNodeUuid = actionNode.javaClass.getMethod("getUUIDObject").invoke(actionNode) as UUID
      var prevTaskUuid = task.javaClass.getMethod("getUUIDObject").invoke(task) as UUID
      for ((chainIdx, chainSpecMap) in spec.chainedNodes.withIndex()) {
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

    // Determine the last action node in the lane (check chained nodes, fallback to main node)
    val lastNodeType = spec.chainedNodes?.lastOrNull()?.get("nodeType") as? String ?: spec.nodeType
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
    val effectiveEndpointType = spec.endpointType.ifBlank { "FC_CHANGE_STATE" }
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
    val icon = resolveNodeIconJson(nodeType) ?: return base
    return try {
      val obj = gson.fromJson(base, JsonObject::class.java)
      obj.add("icon", JsonParser.parseString(icon))
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
    val icon = resolveTriggerIconJson(spec.triggerType) ?: return base
    return try {
      val obj = gson.fromJson(base, JsonObject::class.java)
      obj.add("icon", JsonParser.parseString(icon))
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
   * Guardrail for the form AI: when the AI was asked to REMOVE widgets/workflows (not pages), it
   * must not delete the form's pages (XPage elements). The model occasionally drops all pages but
   * the first while removing widgets. This re-inserts any XPage that existed before but is missing
   * from the AI's output — as an empty page (its widgets were removed) — UNLESS the prompt
   * explicitly asks to remove/delete pages.
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
      val afterPageNames = mutableSetOf<String>()
      for (el in afterItems) {
        if (el.isJsonObject && el.asJsonObject.get("className")?.asString == "XPage") {
          el.asJsonObject.get("properties")?.asJsonObject?.get("name")?.asString?.let {
            afterPageNames.add(it)
          }
        }
      }
      var changed = false
      for (page in beforeItems) {
        if (!page.isJsonObject || page.asJsonObject.get("className")?.asString != "XPage") continue
        val props =
            page.asJsonObject.get("properties")?.takeIf { it.isJsonObject }?.asJsonObject
                ?: continue
        val pageName = props.get("name")?.asString ?: continue
        if (pageName in afterPageNames) continue
        val restored = page.asJsonObject.deepCopy()
        restored.get("properties")?.asJsonObject?.remove("elements")
        restored.get("properties")?.asJsonObject?.add("elements", JsonArray())
        afterItems.add(restored)
        changed = true
        logger.info(
            "[AICodBiAssistant] Restored page '{}' the AI dropped (prompt did not ask to remove pages)",
            pageName)
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
    val labeled = applyPageLabelsFromNavigator(root)
    val checked = ensureNextPageValidation(root)
    return reordered || labeled || checked
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
        val body = spec.nodeParams["body"] as? String ?: ""
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
        val to = spec.nodeParams["to"] as? String ?: ""
        val subject = spec.nodeParams["subject"] as? String ?: ""
        val body = spec.nodeParams["body"] as? String ?: ""
        val from = spec.nodeParams["from"] as? String ?: ""
        val senderName = spec.nodeParams["senderName"] as? String ?: ""
        val failurePage = spec.nodeParams["failurePage"] as? String ?: ""
        val toJson = if (to.isNotBlank()) "[${gson.toJson(to)}]" else "[]"
        logger.info(
            "[AICodBiAssistant] buildNodeParams FC_DOI_INIT: failurePage='{}', workflowVersion=null?{}, userContext=null?{}",
            failurePage,
            workflowVersion == null,
            userContext == null)
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
            """{"name":${gson.toJson(nodeName)},"to":$toJson,"from":${gson.toJson(from)},"senderName":${gson.toJson(senderName)},"subject":${gson.toJson(subject)},"body":${gson.toJson(body)},"plainBody":${gson.toJson(body)},"bodyFormatType":"HTML"$failurePageJson}"""
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
        // Map contentType to httpRequestType enum:
        //   CUSTOM â€“ for JSON/PLAIN_TEXT/XML (body provided as customBodyContent)
        //   FORM_DATA â€“ for FORM_DATA (key-value pairs in requestParameters)
        //   URL â€“ for GET/DELETE/HEAD/OPTIONS OR when no body content is specified
        val asResponsePage = spec.nodeParams["asResponsePage"] as? Boolean ?: false
        val treat4xxAsNormal = spec.nodeParams["treat4xxAsNormal"] as? Boolean ?: false
        val treat5xxAsNormal = spec.nodeParams["treat5xxAsNormal"] as? Boolean ?: false
        val httpRequestType =
            when {
              method == "GET" || method == "DELETE" || method == "HEAD" || method == "OPTIONS" ->
                  "URL"
              contentType == "FORM_DATA" -> "FORM_DATA"
              body.isBlank() -> "URL" // POST with no body content â†’ use URL type
              else -> "CUSTOM" // JSON, PLAIN_TEXT, XML â†’ custom body content
            }
        val nodeParamsJson =
            if (httpRequestType == "FORM_DATA") {
              """{"name":${gson.toJson(nodeName)},"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"FORM_DATA","sendAllFormValues":false,"requestParameters":[],"headerParameters":$headersJson,"allowInvalidCertificates":false,"asResponsePage":$asResponsePage,"treat4xxAsNormal":$treat4xxAsNormal,"treat5xxAsNormal":$treat5xxAsNormal}"""
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

  /**
   * Repairs common malformations LLMs produce in JSON, so a single bad token does not lose the
   * whole build. Only invoked when the initial parse fails. Handles:
   * - stray `\"` used as string delimiters around a value (e.g. `"unit": \"€\"` instead of `"unit":
   *   "€"` — the model escaped the surrounding quotes of a value containing a special character);
   * - trailing commas before `}`/`]` (`"a":1,}`).
   */
  private fun repairAiJson(raw: String): String {
    if (raw.isBlank()) return raw
    val sb = StringBuilder(raw.length)
    var inString = false
    var i = 0
    val n = raw.length
    fun skipWs(from: Int): Int {
      var j = from
      while (j < n && (raw[j] == ' ' || raw[j] == '\t' || raw[j] == '\r' || raw[j] == '\n')) j++
      return j
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
        if (c == '"') {
          sb.append(c)
          inString = true
          i++
        } else if (c == '\\' && i + 1 < n && raw[i + 1] == '"') {
          // Stray `\"` outside a string: treat it as a plain opening quote (the model escaped the
          // delimiter instead of writing a plain `"`).
          sb.append('"')
          inString = true
          i += 2
        } else if (c == ',') {
          val after = skipWs(i + 1)
          if (after < n && (raw[after] == '}' || raw[after] == ']')) {
            // Trailing comma before a closing brace/bracket: drop the comma.
            i++
          } else {
            sb.append(c)
            i++
          }
        } else {
          sb.append(c)
          i++
        }
      }
    }
    return sb.toString()
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
      return raw
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
    // Sanitize: only allow letters, numbers, spaces, hyphens, underscores, parentheses
    return result.replace(Regex("[^a-zA-Z0-9 _\\-()]"), "").trim().ifBlank { spec.nodeType }
  }

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
          if (dbPrompt != null) return PromptLoader.resolvePlaceholders(dbPrompt)
        } finally {
          em.close()
        }
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to load classify intent prompt", e)
    }
    return loadPromptWithClasspathFallback("codbi.fallback_classify_intent") ?: ""
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
              (fc["formcycle.widgets"] ?: "") +
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
      return PromptLoader.loadCategory(em, "formcycle")["formcycle.widgets"] ?: ""
    }
    val all = PromptLoader.loadSectionMap(em, "formcycle.widgets.")
    val sb = StringBuilder("\nFORMCYCLE WIDGET DETAILS (requested)\n")
    for (id in widgetIds) {
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
      askAllQuestions: Boolean
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
          .replace("{{CHANGE_HISTORY_STATUS}}", changeHistoryStatus)
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
                  "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md")
              ?.bufferedReader(Charsets.UTF_8)
              ?.use { it.readText() }
              ?.trim()
        }
        .getOrNull()
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
      changeLogSchema: String
  ): String {
    var out =
        template
            .replace("{{GENERAL}}", general)
            .replace("{{WORKFLOW_REFERENCE}}", workflowReference)
    // Conditional sections: drop the whole {{BEGIN_*}}…{{END_*}} block when data is blank.
    out = applyWorkflowSection(out, "WORKFLOW_DETAILS_REQUEST", if (pass2) null else " ")
    out = applyWorkflowSection(out, "FORM_ELEMENTS", formContext)
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
      imageParts: List<String>
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
            askAllQuestions)
    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(system)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }
    val raw = instance.performFormAssist(modelId, messagesJson)
    val cleaned = extractJson(stripThinkTags(raw)).trim()
    logger.info("[AICodBiAssistant] Clarification check response: {}", cleaned)
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
   */
  private data class ChatAnswer(
      val hasQuestion: Boolean,
      val hasInstructions: Boolean,
      val answer: String,
      val tokensIn: Int = 0,
      val tokensOut: Int = 0
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
      clarificationContext: String
  ): ChatAnswer? {
    val system = buildString {
      append(loadPromptWithClasspathFallback("codbi.chat_system_prompt") ?: "")
      append(
          renderChatContext(
              formStructureContext,
              completeFormJson,
              completeWorkflowJson,
              buildChatContext(chatTurns),
              clarificationContext))
    }
    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(system)}},""")
      append("""{"role":"user","content":${gson.toJson(prompt)}}""")
      append("]")
    }
    return try {
      val firstRaw = instance.performFormAssist(modelId, messagesJson)
      parseChatAnswerRaw(firstRaw, messagesJson)?.let {
        return it
      }
      // The first response was not the structured envelope — retry once with a strict instruction
      // so
      // the model emits ONLY the raw JSON object.
      val strictSystem =
          system + "\n\n" + (loadPromptWithClasspathFallback("codbi.retry_chat") ?: "")
      val retryMessages = buildString {
        append("[")
        append("""{"role":"system","content":${gson.toJson(strictSystem)}},""")
        append("""{"role":"user","content":${gson.toJson(prompt)}}""")
        append("]")
      }
      val secondRaw = instance.performFormAssist(modelId, retryMessages)
      parseChatAnswerRaw(secondRaw, retryMessages)?.let {
        return it
      }
      // Last resort: classification failed twice. Use a minimal question heuristic so a question
      // still receives an answer-only response instead of being misrouted to the form AI.
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
          tokensIn = estimateTokens(messagesJson) + estimateTokens(retryMessages),
          tokensOut = estimateTokens(firstRaw) + estimateTokens(secondRaw))
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Chat answer pass failed: {}", e.message)
      null
    }
  }

  /**
   * Parses a structured chat-answer response, or null when it is not the expected JSON envelope.
   */
  private fun parseChatAnswerRaw(raw: String, messagesJson: String): ChatAnswer? {
    return try {
      val cleaned = extractJson(stripThinkTags(raw)).trim()
      logger.info("[AICodBiAssistant] Chat answer response: {}", cleaned)
      val obj = JsonParser.parseString(cleaned).asJsonObject
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

  // endregion Form Chat

  companion object {
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
     * Maximum number of additional detail-reruns after the initial form pass. When the AI keeps
     * answering `need_codbi_details` (e.g. a small model that first asks for CodBi details, then
     * asks again for specific widget types), `rerunWithCodbiDetails` loops up to this many extra
     * times with the newly requested elements/widgets before giving up and splicing the last
     * result.
     */
    private const val MAX_FORM_RERUNS = 2

    // All prompt texts (structure rules, control-types rules, complete-form rules, change-log
    // schema, chat context, chat system prompt, fallback prompts) live in the bundled .md files
    // (see prompts/index.json) and are loaded via PromptLoader with a classpath fallback — the
    // backend itself contains no prompt text anymore.
  }
}
