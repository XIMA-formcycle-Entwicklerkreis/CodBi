package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

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
import com.google.gson.JsonObject
import com.google.gson.JsonParser
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
    val action =
        params.headerMap.entries.find { it.key.equals("X-Action", ignoreCase = true) }?.value
    return when (action) {
      "Models" -> handleModels()
      "Run" -> handleRun(params)
      "AppointmentPlan" -> handleAppointmentPlan(params)
      "Status" -> handleStatus()
      else -> jsonResponse("""{"error":"Unknown action"}""")
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
    return jsonResponse(gson.toJson(models))
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

    val prompt =
        params.requestParameters["prompt"]?.firstOrNull()
            ?: return jsonResponse("""{"error":"Missing prompt"}""")

    val instance = Standard.instance ?: return jsonResponse("""{"error":"AI service not ready"}""")

    val phase = params.requestParameters["phase"]?.firstOrNull() ?: "1"

    // When false, no CodBi prompts are sent to the AI in any pass — the AI only receives Formcycle
    // widgets and workflow nodes. Also disables the server-side Holistic.* standard-config
    // application (e.g. Holistic.Cleave.Date must not be applied when CodBi is off).
    val useCodbi = params.requestParameters["useCodbi"]?.firstOrNull()?.toBoolean() ?: true

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
      val (intent, classifyTokens) =
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
      return jsonResponse("""{"status":"need_data","intent":"$intent","tokens":$classifyTokens}""")
    }

    // Phase 2 â€” execute
    val intent = params.requestParameters["intent"]?.firstOrNull() ?: "both"
    val result = StringBuilder("{")
    result.append(""""intent":${gson.toJson(intent)}""")
    // For "both" intent: form elements are updated after form modification so the workflow AI
    // sees buttons/fields that were just created by the form AI (not just the pre-existing ones).
    var latestFormElements: String? = params.requestParameters["formElements"]?.firstOrNull()
    // Estimated tokens consumed by this run (returned to the frontend for the token counter).
    var runTokens = 0

    if (intent == "form" || intent == "both") {
      val persistJson =
          params.requestParameters["persist"]?.firstOrNull()
              ?: return jsonResponse("""{"error":"Missing persist for form modification"}""")
      try {
        JsonParser.parseString(persistJson)
      } catch (_: Exception) {
        return jsonResponse("""{"error":"Invalid persist JSON"}""")
      }
      val (formJson, applicabilityReport, tokensUsed) =
          try {
            runFormModification(prompt, persistJson, modelId, instance, imageParts, useCodbi)
          } catch (e: ExternalAiHttpException) {
            logger.warn("[AICodBiAssistant] Form AI HTTP {}: {}", e.httpStatus, e.body)
            return jsonResponse("""{"error":${gson.toJson("Form AI error: ${e.message}")}}""")
          } catch (e: Exception) {
            logger.error("[AICodBiAssistant] Form modification failed", e)
            return jsonResponse(
                """{"error":${gson.toJson("Form modification failed: ${e.message}")}}""")
          }
      runTokens = tokensUsed
      // Propagate a form-AI error response unchanged
      val formParsed = runCatching { JsonParser.parseString(formJson) }.getOrNull()
      if (formParsed?.isJsonObject == true && formParsed.asJsonObject.has("error")) {
        return jsonResponse(formJson)
      }
      // Auto-resolve appointment plan names to UUIDs for XAppointment elements.
      val resolvedFormJson = resolveAppointmentPlans(formJson)
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
      val workflowVersionId =
          workflowVersionIdStr.toLongOrNull()
              ?: return jsonResponse("""{"error":"Invalid workflowVersionId (must be a number)"}""")

      val workflowMessage =
          try {
            runWorkflowCreation(
                prompt,
                latestFormElements,
                workflowVersionId,
                modelId,
                params,
                instance,
                imageParts)
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

    result.append("}")
    return jsonResponse(result.toString())
  }

  // endregion Handlers

  // region Intent Classification

  /**
   * Makes a short AI call to classify whether the user's [prompt] targets the form structure,
   * workflow automations, or both. Returns "form", "workflow", or "both". Defaults to "both" if the
   * AI response cannot be parsed or returns an unexpected value.
   */
  private fun classifyIntent(
      prompt: String,
      modelId: String,
      instance: Standard,
      imageParts: List<String> = emptyList()
  ): Pair<String, Int> {
    val systemPrompt = loadClassifyIntentPrompt()

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
    val tokens = estimateTokens(messagesJson) + estimateTokens(rawResponse)
    val cleaned = extractJson(stripThinkTags(rawResponse))

    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleaned, Map::class.java) as? Map<String, Any>
      val intent = obj?.get("intent") as? String
      when (intent) {
        "form",
        "workflow",
        "both" -> intent to tokens
        else -> {
          logger.warn(
              "[AICodBiAssistant] Unexpected intent classification '{}' â€” defaulting to 'both'",
              intent)
          "both" to tokens
        }
      }
    } catch (_: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not parse classification response '{}' â€” defaulting to 'both'",
          cleaned)
      "both" to tokens
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
      useCodbi: Boolean = true
  ): Triple<String, String?, Int> {
    // Rough token estimate for this run (prompt + completion of every inference), returned to the
    // frontend so the assistant can show the last inference and the current session total.
    var tokensUsed = 0
    // Document-parsing rules are only included when the request references an attached document.
    val hasAttachedDocument = imageParts.isNotEmpty()
    val baseSystemPrompt = buildFormSystemPrompt(useCodbi)
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
    val userContent =
        "Instruction: $prompt$imageHint\n\nCurrent form (IPersistJson):\n${slimPersistJson(persistJson)}" +
            "\n\nREMINDER: your response MUST include a top-level \"_codbiApplicability\" field as described in the system prompt."

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(userContent, imageParts)}}""")
      append("]")
    }

    logger.info(
        "[AICodBiAssistant] Form data sent to AI (model={}): {}",
        modelId,
        slimPersistJson(persistJson))
    val rawResponse = instance.performFormAssist(modelId, messagesJson)
    tokensUsed += estimateTokens(messagesJson) + estimateTokens(rawResponse)
    var cleaned = extractJson(stripThinkTags(rawResponse))

    fun rerunWithCodbiDetails(
        requested: List<String>,
        widgets: List<String>,
        useCodbi: Boolean = true
    ): String {
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
        val rethinkSystemPrompt = loadCodbiRethinkPrompt()

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
          val userContent =
              "Modify the form below according to the user request. Form data: $formJson"
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

        val applySystemPrompt = loadCodbiApplyPrompt(requested, widgets, useCodbi)

        val pass2UserContent =
            "Original user request: $prompt\n\n" +
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
                "Return the COMPLETE modified form JSON with ALL items â€” never drop existing elements."

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
      tokensUsed += estimateTokens(retryMessagesJson) + estimateTokens(retryRaw)
      val pass2Cleaned = extractJson(stripThinkTags(retryRaw))
      logger.info("[AICodBiAssistant] Pass-2 raw result: {}", pass2Cleaned)
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
              logger.info(
                  "[AICodBiAssistant] AI declared/stated no CodBi element applies â€” skipping blind reconsideration ({})",
                  reason)
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
      val parsed = JsonParser.parseString(sanitizedCleaned)
      warnUnknownClassNames(parsed)
      val restored = restoreStrippedFields(sanitizedCleaned, persistJson)
      // Log item names in the final form JSON to debug missing elements
      try {
        val root = JsonParser.parseString(restored).asJsonObject
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
      Triple(restored, applicabilityReport, tokensUsed)
    } catch (_: Exception) {
      logger.warn("[AICodBiAssistant] Form AI returned unparseable response: {}", sanitizedCleaned)
      Triple(
          """{"error":"AI returned invalid JSON","raw":${gson.toJson(sanitizedCleaned)}}""",
          null,
          tokensUsed)
    }
  }

  /** Rough token estimate for a text blob (chars / 4). Used for the assistant's token counter. */
  private fun estimateTokens(text: String): Int =
      if (text.isBlank()) 0 else (text.length / 4).coerceAtLeast(1)

  private fun buildFormSystemPrompt(useCodbi: Boolean = true): String =
      buildCodbiFormSystemPrompt(useCodbi)

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

      if (pass2Obj.has("_codbiApplicability")) {
        pass1Obj.add("_codbiApplicability", pass2Obj.get("_codbiApplicability"))
      }

      gson.toJson(pass1Obj)
    } catch (_: Exception) {
      pass2Json // fallback: return pass-2 as-is
    }
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
          "rowid",
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

  private fun restoreStrippedFields(aiResult: String, original: String): String {
    val aiObj = JsonParser.parseString(aiResult).asJsonObject
    // Some models embed newly created child elements as full JSON objects inside a container's
    // 'properties.elements' array instead of (a) adding them to the flat top-level 'items' array
    // and (b) referencing them by 'name' string. FORMCYCLE expects the flat structure, so promote
    // such nested objects before any further processing — otherwise the fields never render.
    promoteNestedElementObjects(aiObj)
    val result = JsonParser.parseString(original).asJsonObject
    val originalItems = result.getAsJsonArray("items")
    for (entry in aiObj.entrySet()) {
      if (entry.key !in STRIPPED_FIELDS) {
        result.add(entry.key, entry.value)
      }
    }
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
      for (el in originalItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val name =
            item.getAsJsonObject("properties")?.get("name")?.asString
                ?: item.get("name")?.asString
                ?: continue
        if (name !in resultItemNames) {
          resultItems.add(el)
          logger.debug("[AICodBiAssistant] Restored original item '{}' dropped by AI", name)
          val containerName = originalContainerOfItem[name]
          if (containerName != null) {
            val containerItem =
                resultItems
                    .firstOrNull {
                      it.isJsonObject &&
                          (it.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString ==
                              containerName)
                    }
                    ?.asJsonObject
            val elements = containerItem?.getAsJsonObject("properties")?.getAsJsonArray("elements")
            if (elements != null && elements.none { it.isJsonPrimitive && it.asString == name }) {
              elements.add(name)
              logger.debug(
                  "[AICodBiAssistant] Restored element ref '{}' in container '{}'",
                  name,
                  containerName)
            }
          }
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
      // Fix orphaned new items: items added by the AI to the flat `items` array but not referenced
      // in any container's `properties.elements` list. Without a container reference the FC
      // designer
      // ignores them completely. We attach orphans to the last XFieldSet (or XPage) found.
      val containerClassNames = setOf("XPage", "XFieldSet", "XContainer", "XHeader", "XFooter")
      val orphanedNames = mutableListOf<String>()
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val className = el.asJsonObject.get("className")?.asString ?: continue
        if (className in containerClassNames) continue
        val name = el.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString ?: continue
        if (name !in itemToContainerId) orphanedNames.add(name)
      }
      if (orphanedNames.isNotEmpty()) {
        logger.warn(
            "[AICodBiAssistant] {} orphaned items not in any container's elements (will auto-attach): {}",
            orphanedNames.size,
            orphanedNames)
        // Build a nameâ†’index map so we can find each orphan's position in the array.
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
        val attachContainerClassNames = setOf("XFieldSet", "XPage", "XContainer")
        // Attach each orphan to the nearest preceding container, so items generated
        // for page 2 land on p2 instead of on the last XFieldSet that belongs to page 1.
        for (name in orphanedNames) {
          val orphanIdx = indexByName[name] ?: continue
          val targetContainer =
              (orphanIdx - 1 downTo 0)
                  .asSequence()
                  .map { idx -> resultItems[idx] }
                  .firstOrNull { el ->
                    el.isJsonObject &&
                        el.asJsonObject.get("className")?.asString in attachContainerClassNames
                  }
                  // Fallback: last XFieldSet or XPage in the whole array.
                  ?: resultItems.lastOrNull {
                    it.isJsonObject &&
                        it.asJsonObject.get("className")?.asString in setOf("XFieldSet", "XPage")
                  }
          if (targetContainer == null) {
            logger.warn("[AICodBiAssistant] No container found for orphaned item '{}'", name)
            continue
          }
          val containerProps =
              targetContainer.asJsonObject.getAsJsonObject("properties") ?: continue
          val containerId = containerProps.get("id")?.asString
          var elements = containerProps.getAsJsonArray("elements")
          if (elements == null) {
            val newArr = JsonArray()
            containerProps.add("elements", newArr)
            elements = newArr
          }
          if (elements.none { it.isJsonPrimitive && it.asString == name }) {
            elements.add(name)
            if (containerId != null) itemToContainerId[name] = containerId
            logger.warn(
                "[AICodBiAssistant] Auto-attached orphaned item '{}' to container '{}'",
                name,
                containerProps.get("name")?.asString)
          }
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
          if (!itemProps.has(entry.key)) itemProps.add(entry.key, entry.value)
        }
        // For new XTextField date fields: always enable the datepicker calendar widget,
        // overriding any base-template default of "0".
        if (className == "XTextField" &&
            (itemProps.get("datatype")?.asString ?: "").startsWith("date")) {
          itemProps.addProperty("datepicker", "1")
        }
        val parentId = itemToContainerId[name]
        if (parentId != null &&
            (!itemProps.has("parentid") || itemProps.get("parentid").asString.isNullOrEmpty())) {
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
    // SERVER-SIDE CSS CLASS VALIDATION: Strip any CSS class names that the AI may have
    // invented (e.g. "CodBi_NavigationBar") â€” only classes matching known prefixes from
    // CSS_CLASS_TO_STANDARD are allowed. Non-matching classes are removed with a warning.
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
    val validCssPrefixes = CSS_CLASS_TO_STANDARD.map { it.first }.toList()
    val STALE_PREFIXES = listOf("data-cb-")
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val cssClasses = props.getAsJsonArray("cssclasses")
      if (cssClasses != null && cssClasses.size() > 0) {
        val filtered = JsonArray()
        var stripped = false
        for (cls in cssClasses) {
          if (!cls.isJsonPrimitive) {
            stripped = true
            continue
          }
          val className = cls.asString
          val isValid =
              validCssPrefixes.any { prefix -> className == prefix || className.startsWith(prefix) }
          if (isValid) {
            filtered.add(cls)
          } else {
            stripped = true
            logger.warn(
                "[AICodBiAssistant] Stripped non-existent CSS class '{}' from item '{}'",
                className,
                props.get("name")?.asString ?: "<unknown>")
          }
        }
        if (stripped) {
          if (filtered.size() > 0) {
            props.add("cssclasses", filtered)
          } else {
            props.remove("cssclasses")
          }
        }
      }
      // --- Normalize Print.Remove: if the AI applied data-cb-func=print.remove instead of the
      // CSS class (per TWO-OPTION RULE, CSS classes should be preferred when available), convert
      // it to the CodBi_Print_Remove_Tagged CSS class and remove the data-cb-func entry.
      val printRemoveFunc = props.get("data-cb-func")?.asString
      if (printRemoveFunc != null && printRemoveFunc.contains("print.remove", ignoreCase = true)) {
        val cssClasses =
            if (props.has("cssclasses") && props.get("cssclasses").isJsonArray)
                props.getAsJsonArray("cssclasses")
            else JsonArray().also { props.add("cssclasses", it) }
        var hasPrintRemoveTagged = false
        for (i in 0 until cssClasses.size()) {
          val cls = cssClasses.get(i)
          if (cls.isJsonPrimitive && cls.asString == "CodBi_Print_Remove_Tagged") {
            hasPrintRemoveTagged = true
            break
          }
        }
        if (!hasPrintRemoveTagged) {
          cssClasses.add("CodBi_Print_Remove_Tagged")
          logger.info(
              "[AICodBiAssistant] Normalized data-cb-func=print.remove to CSS class 'CodBi_Print_Remove_Tagged'")
        }
        // Remove print.remove from data-cb-func (other comma-separated funcs are preserved)
        val remaining =
            printRemoveFunc
                .split(",")
                .map { it.trim() }
                .filterNot { it.equals("print.remove", ignoreCase = true) }
        if (remaining.isEmpty()) {
          props.remove("data-cb-func")
        } else {
          props.addProperty("data-cb-func", remaining.joinToString(","))
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
    // Normalize AI Chat MailAddress hiddenif values â€” the AI often generates
    // the wrong format. Formcycle stores the condition as:
    //   hiddenif = the MailForward checkbox's ID (e.g. "xi-cb-aichat-mailforward")
    //   hiddenifcomp = 0 (no comparison value)
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
        // Fix 1: hiddenif MUST be the MailForward checkbox's ID, not a mode number
        if (mailForwardId != null) {
          val currentHiddenIf = props.get("hiddenif")?.asString
          if (currentHiddenIf != null && currentHiddenIf != mailForwardId) {
            logger.info(
                "[AICodBiAssistant] Normalized hiddenif on '{}': '{}' â†’ '{}'",
                props.get("name")?.asString ?: "<unknown>",
                currentHiddenIf,
                mailForwardId)
            props.addProperty("hiddenif", mailForwardId)
            changed = true
          }
        }
        // Fix 2: hiddenifcomp should be 0 (not a component name or "9")
        if (props.has("hiddenifcomp")) {
          val raw = props.get("hiddenifcomp")
          val rawStr = if (raw.isJsonPrimitive) raw.asString else null
          if (rawStr != null &&
              rawStr != "0" &&
              rawStr != mailForwardName &&
              rawStr != mailForwardId) {
            logger.info(
                "[AICodBiAssistant] Normalized hiddenifcomp on '{}': '{}' â†’ 0",
                props.get("name")?.asString ?: "<unknown>",
                rawStr)
            props.addProperty("hiddenifcomp", 0)
            changed = true
          }
        }
        // Fix 3: hiddenifclear should be "false" string (Formcycle format)
        if (props.has("hiddenifclear")) {
          val raw = props.get("hiddenifclear").asString.trim().lowercase()
          if (raw == "0") {
            logger.info(
                "[AICodBiAssistant] Normalized hiddenifclear on '{}': '{}' â†’ 'false'",
                props.get("name")?.asString ?: "<unknown>",
                raw)
            props.addProperty("hiddenifclear", "false")
            changed = true
          }
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
          // People standard (includes fotocropper and OpenPLZ address classes)
          "CodBi_People_" to "People",
          "CodBi_Fotocropper" to "People",
          "CodBi_OpenPLZ_" to "People",
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
      imageParts: List<String> = emptyList()
  ): String {
    val userContext = getUserContext(params)
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
    // Two-pass workflow flow:
    //   Pass-1 — the AI receives only the condensed workflow-nodes reference. If it needs the exact
    //            triggerParams/nodeParams of specific triggers/nodes it intends to use, it responds
    //            with {"status":"need_workflow_node_details","nodes":[...],"triggers":[...]}.
    //   Pass-2 — the server appends the requested node/trigger detail sections from the DB and the
    //            AI produces the final task JSON.
    var requestedNodes = emptyList<String>()
    var requestedTriggers = emptyList<String>()
    var systemPrompt =
        buildWorkflowSystemPrompt(
            formElements,
            htmlTemplatesJson,
            completionPagesJson,
            workflowStatesJson,
            inboxesJson,
            messageServicesJson,
            triggersJson,
            requestedNodes,
            requestedTriggers)

    var messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }

    var cleaned = extractJson(stripThinkTags(instance.performFormAssist(modelId, messagesJson)))
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
              htmlTemplatesJson,
              completionPagesJson,
              workflowStatesJson,
              inboxesJson,
              messageServicesJson,
              triggersJson,
              requestedNodes,
              requestedTriggers)
      messagesJson = buildString {
        append("[")
        append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
        append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
        append("]")
      }
      cleaned = extractJson(stripThinkTags(instance.performFormAssist(modelId, messagesJson)))
      logger.info("[AICodBiAssistant] Workflow AI pass-2 raw response: {}", cleaned)
    }

    // Replace symbolic "$ROOT" breakTarget with a safe UUID placeholder before JSON parsing
    val safeCleaned = cleaned.replace("\$ROOT", "00000000-0000-0000-0000-000000000000")

    // Parse the AI response: either a single task object or an array of task objects
    val taskSpecs: List<WorkflowTaskSpec> =
        try {
          if (safeCleaned.trimStart().startsWith("[")) {
            // Array of task specs
            val arr = gson.fromJson(safeCleaned, Array<WorkflowTaskSpec>::class.java)
            logger.info("[AICodBiAssistant] Parsed {} workflow task specs from array", arr.size)
            arr.forEachIndexed { i, spec ->
              logger.info(
                  "[AICodBiAssistant] Task #{}: nodeType={}, failurePage='{}'",
                  i + 1,
                  spec.nodeType,
                  if (spec.nodeType == "FC_DOI_INIT") spec.nodeParams["failurePage"] ?: "<NOT SET>"
                  else "N/A")
            }
            arr.toList()
          } else {
            // Single task spec
            val spec = gson.fromJson(safeCleaned, WorkflowTaskSpec::class.java)
            logger.info(
                "[AICodBiAssistant] Workflow task spec: nodeType={}, nodeParams keys={}",
                spec.nodeType,
                spec.nodeParams.keys)
            listOf(spec)
          }
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] Could not parse workflow AI response: {}", safeCleaned)
          throw Exception("AI returned invalid workflow JSON: ${e.message}")
        }

    val results = taskSpecs.map { spec -> createWorkflowTask(workflowVersionId, spec, params) }
    val combinedResult = results.joinToString(" | ")
    logger.info(
        "[AICodBiAssistant] Workflow created: {} task(s) â€” {}", results.size, combinedResult)
    return combinedResult
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
      htmlTemplates: String? = null,
      completionPages: String? = null,
      workflowStates: String? = null,
      inboxes: String? = null,
      messageServices: String? = null,
      triggers: String? = null,
      requestedNodes: List<String> = emptyList(),
      requestedTriggers: List<String> = emptyList()
  ): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_WORKFLOW_PROMPT
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
      return buildString {
        append(general).append("\n\n")
        append(workflowReference).append("\n\n")
        if (!pass2) {
          append(
              "WORKFLOW DETAILS REQUEST â€” You receive ONLY the condensed workflow-trigger/node list above.\n" +
                  "Before you emit the final workflow task JSON, if you need the exact triggerParams/nodeParams of any " +
                  "trigger or node type you intend to use, respond ONLY with the following JSON (nothing else):\n" +
                  "{\"status\":\"need_workflow_node_details\",\"nodes\":[\"FC_EMAIL\",\"FC_POST_REQUEST\",...],\"triggers\":[\"FC_FORM_SUBMIT_BUTTON\",...]}\n" +
                  "List EVERY trigger and node you plan to use (including condition/loop/container nodes) so none is missing. " +
                  "The server then provides the exact JSON schemas for exactly those and you continue with the final task JSON.\n\n")
        }
        if (formContext != null) {
          append(
              "FORM ELEMENTS (match user descriptions via 'displayText'; always use 'technicalId' in output):\n" +
                  formContext +
                  "\n\n")
        }
        if (!completionPages.isNullOrBlank()) {
          append(
              "AVAILABLE ABSCHLUSSSEITEN (completion pages â€” pick one for failurePage when creating a FC_DOI_INIT node):\n" +
                  completionPages +
                  "\n\n" +
                  "Select the most suitable Abschlussseite from the list above. The Abschlussseite is displayed to the user " +
                  "when the Double Opt-In (DOI) email verification fails.\n" +
                  "SELECTION CRITERIA (in order of priority):\n" +
                  "  1. FIRST CHOICE â€” If any available Abschlussseite has a name that combines \"double opt-in\" (or \"doi\") " +
                  "and \"failed\" / \"error\" / \"fehler\" (e.g. \"Double opt-in verification failed\"), pick that one.\n" +
                  "  2. SECOND CHOICE â€” If no DOI-specific failure page exists, pick a generic error/failure page " +
                  "(name containing \"Fehler\", \"Error\", \"Failed\", \"Allgemein\", \"Standard\").\n" +
                  "  3. LAST RESORT â€” If neither exists, pick the most generically named page.\n" +
                  "NEVER create a new page â€” always pick from the list above.\n\n")
        }
        if (!htmlTemplates.isNullOrBlank()) {
          append(
              "AVAILABLE HTML TEMPLATES (for htmlTemplate when creating a FC_SHOW_TEMPLATE node â€” pick the EXACT match to the user's request):\n" +
                  htmlTemplates +
                  "\n\n" +
                  "The HTML template is rendered to the user when the workflow runs (e.g. after clicking a submit button). " +
                  "Use this when the user says a specific completion page, Abschlussseite, error page, or template should be displayed " +
                  "(e.g. \"Bei Klick auf submit, Abschlussseite 'Allgemeiner Fehler 2' anzeigen\"). " +
                  "NEVER create a new template â€” always pick from the list above.\n\n")
          append(
              "AVAILABLE URL TEMPLATES (for urlTemplate when creating a FC_REDIRECT node â€” pick the EXACT match to the user's request):\n" +
                  htmlTemplates +
                  "\n\n" +
                  "The URL template is a named URL stored in the system. " +
                  "Use this when the user says \"URL-Template\", \"URL-Vorlage\" or mentions a named template " +
                  "(e.g. \"Bei Klick auf submit, an die URL-Template X2 umleiten\"). " +
                  "NEVER create a new template â€” always pick from the list above.\n\n")
        }
        if (!inboxes.isNullOrBlank()) {
          append(
              "AVAILABLE INBOXES (for inboxName when creating a FC_MOVE_FORM_RECORD_TO_INBOX node â€” pick the EXACT match to the user's request):\n" +
                  inboxes +
                  "\n\n" +
                  "CRITICAL â€” If the user explicitly provides a specific inbox name and says \"suche Ã¼ber den Namen\" " +
                  "(search by name), \"find by name\", or provides a name that is NOT in the list above, " +
                  "then use targetType:\"COMPUTED_INBOX_NAME\" with inboxName set to the EXACT name the user provided. " +
                  "Do NOT pick a different inbox from the list. " +
                  "Only use STATIC_INBOX (default) when the user mentions an inbox that EXISTS in the list above " +
                  "and does NOT instruct to search by name.\n\n")
        }
        if (!messageServices.isNullOrBlank()) {
          append(
              "AVAILABLE MESSAGE SERVICES (for 'recipientMessageService' when creating a FC_SEND_FORM_RECORD_MESSAGE node with recipientType=INBOX_ID â€” pick the EXACT match from this list):\n" +
                  messageServices +
                  "\n\n")
        }
        if (!triggers.isNullOrBlank()) {
          append(
              "AVAILABLE TRIGGERS (for 'triggerUuid' when creating a FC_QUEUE_TASK node â€” pick the EXACT uuid matching the user's requested event name):\n" +
                  triggers +
                  "\n\n")
        }
        if (workflowStates != null && workflowStates.isNotBlank()) {
          append(
              "AVAILABLE WORKFLOW STATES (for reference only â€” use the user's requested status name, not this list):\n" +
                  workflowStates +
                  "\n\n")
        }
        append("Output ONLY valid JSON. No trailing commas. No comments.")
      }
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to build workflow system prompt", e)
      return FALLBACK_WORKFLOW_PROMPT
    } finally {
      em?.close()
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
    val triggerParamsJson = buildTriggerParamsJson(spec, workflowVersion, userContext)
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
    val nodeParamsJson = buildNodeParamsJson(spec, workflowVersion, userContext)
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
        val childParamsJson = buildNodeParamsJson(childSpec, workflowVersion, userContext)
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
            (childSpec.nodeType == "de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin" ||
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
        (spec.nodeType == "de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin" ||
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
            val childParamsJson = buildNodeParamsJson(childSpec, workflowVersion, userContext)
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
                val childParamsJson = buildNodeParamsJson(childSpec, workflowVersion, userContext)
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
        val chainParamsJson = buildNodeParamsJson(chainSpecWithUuids, workflowVersion, userContext)
        if (chainParamsJson != null) {
          workflowNodeClass
              .getMethod("setCustomParameters", String::class.java)
              .invoke(chainNode, chainParamsJson)
        }
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(chainNode, savedTask)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(chainNode, savedRootNode)
        val savedChainNode = createNodeMethod.invoke(workflowNodeApi, userContext, chainNode)
        fixParentOrderIndex(savedChainNode, savedRootNode, userContext)
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
      "de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin" -> {
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
          "de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin" ->
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
      val stateProperties: Map<String, Any> = emptyMap()
  )

  // endregion Data Classes

  /**
   * Loads the CodBi form system prompt from the database. Combines formcycle.general,
   * formcycle.widgets, and all codbi.* categories.
   */
  private fun buildCodbiFormSystemPrompt(useCodbi: Boolean = true): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_FORM_SYSTEM_PROMPT
    try {
      val fc = PromptLoader.loadCategory(em, "formcycle")
      val cb = if (useCodbi) PromptLoader.loadCategory(em, "codbi") else emptyMap()
      val taskInstruction =
          "You receive a partial form JSON (IPersistJson) and a natural language instruction. " +
              "MODIFY the form according to the instruction and return the COMPLETE modified form JSON. " +
              "Do NOT ask for more details â€” the user's instruction and the form data below are sufficient.\n\n"
      // Pass-1 uses ONLY the condensed references (element/widget names + purposes) plus the
      // general rules. The parameter-complete sections (codbi.standard_configurations /
      // codbi.functionalities / codbi.element_placeholders) are intentionally NOT included here:
      // codbi-general.md tells the AI to request the exact JSON templates for exactly the
      // elements/widgets it needs, and the server returns only those in pass-2. Sending the full
      // detailed sections here would roughly double the token usage per request without changing
      // the outcome (the AI requests details regardless).
      val codbiPart =
          if (useCodbi) {
            "\n" + (cb["codbi.general"] ?: "") + "\n" + "{{CODBI_ELEMENTS_SECTION}}"
          } else {
            ""
          }
      return PromptLoader.resolvePlaceholders(
          taskInstruction +
              (fc["formcycle.general"] ?: "") +
              "\n" +
              "{{FORMCYCLE_WIDGETS_SECTION}}" +
              codbiPart)
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to load form system prompt", e)
      return FALLBACK_FORM_SYSTEM_PROMPT
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
    return FALLBACK_CLASSIFY_INTENT_PROMPT
  }

  /** Loads the CodBi rethink (blind pass) prompt from the database. */
  private fun loadCodbiRethinkPrompt(): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_RETHINK_PROMPT
    try {
      val categories = PromptLoader.loadCategory(em, "codbi")
      val fc = PromptLoader.loadCategory(em, "formcycle")
      val taskInstruction =
          "You receive a form to review for CodBi applicability. " +
              "Review the form elements below and determine which CodBi functionalities apply. " +
              "Return the form JSON with a _codbiApplicability field listing considered/applied/skipped items.\n\n"
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
      return FALLBACK_RETHINK_PROMPT
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
      useCodbi: Boolean = true
  ): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_APPLY_PROMPT
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
      val base = categories["codbi.general"] ?: ""
      val codbiPart =
          when {
            requestedIds.isNotEmpty() -> {
              val details = CodbiCapabilities.buildFullSectionFor(requestedIds)
              // Fall back to the full reference when none of the requested IDs could be resolved.
              if (details.isBlank()) PromptLoader.resolvePlaceholders("{{CODBI_FULL_SECTION}}")
              else details
            }
            // The AI asked ONLY for widget templates (elements list empty): give it the condensed
            // element list (names + purposes) plus the widget templates — NOT the full API
            // reference.
            widgetIds.isNotEmpty() -> PromptLoader.resolvePlaceholders("{{CODBI_ELEMENTS_SECTION}}")
            // Pure blind reconsideration: provide the complete reference.
            else -> PromptLoader.resolvePlaceholders("{{CODBI_FULL_SECTION}}")
          }
      return base + "\n\n" + codbiPart + "\n\n" + widgetPart
    } catch (e: Exception) {
      logger.warn("[AICodBiAssistant] Failed to load apply prompt", e)
      return FALLBACK_APPLY_PROMPT
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

  companion object {
    private const val FALLBACK_FORM_SYSTEM_PROMPT =
        "You are a FORMCYCLE form structure assistant. " +
            "You receive a partial IPersistJson object and a natural language instruction. " +
            "Your ONLY output must be the modified IPersistJson as raw JSON. " +
            "Every generated element MUST carry a meaningful, human-readable 'label' describing its " +
            "purpose in the language of the user's request — never the generic value \"Label\" or \"Example\"."

    private const val FALLBACK_CLASSIFY_INTENT_PROMPT =
        "You are a FORMCYCLE assistant router. Based on the user's request, " +
            "determine what type of change is needed: form, workflow, or both. " +
            "Respond ONLY with valid JSON: {\"intent\":\"form\"} or {\"intent\":\"workflow\"} or {\"intent\":\"both\"}"

    private const val FALLBACK_RETHINK_PROMPT =
        "You are a CodBi form element configurator. Review the form elements and apply " +
            "relevant CodBi functionalities (data-cb-func, CSS classes)."

    private const val FALLBACK_APPLY_PROMPT =
        "You are a CodBi form element configurator. Apply the listed CodBi functionalities " +
            "to the appropriate form elements with correct data-cb-* parameters."

    private const val FALLBACK_WORKFLOW_PROMPT =
        "You are a FORMCYCLE workflow assistant. The user will describe a desired workflow " +
            "action in natural language. Your ONLY output must be a single JSON object that " +
            "describes the workflow task to create. No explanation, no markdown, no code fences."
  }
}
