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
import org.slf4j.LoggerFactory

/**
 * Unified AI assistant for FORMCYCLE — combines the form-structure editor (AIFormAssistant) and the
 * workflow creator (AIWorkflowAssistant) into a single two-phase servlet.
 *
 * Phase 1 — Intent classification: The servlet makes a short AI call to classify the user's prompt
 * as "form", "workflow", or "both". It returns
 * `{"status":"need_data","intent":"form|workflow|both"}` so the frontend knows which data to
 * collect before sending phase 2.
 *
 * Phase 2 — Execution: The frontend resends the prompt with `phase=2`, `intent=<value>`, and the
 * necessary context:
 * - `persist` — full IPersistJson string (required when intent is "form" or "both")
 * - `currentStandards` — CSV of currently active standard configurations (optional, for
 *   "form"/"both")
 * - `formElements` — JSON array of form elements (required when intent is "workflow" or "both")
 * - `workflowVersionId` — numeric ID of the active WorkflowVersion (required when intent is
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
            "[AICodBiAssistant] Found XAppointment with appointmentPlan='{}' — resolving...",
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
                "[AICodBiAssistant] Appointment plan '{}' not found — query returned no rows",
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

    // Phase 1 — classify intent
    if (phase == "1") {
      val intent =
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
      return jsonResponse("""{"status":"need_data","intent":"$intent"}""")
    }

    // Phase 2 — execute
    val intent = params.requestParameters["intent"]?.firstOrNull() ?: "both"
    val result = StringBuilder("{")
    result.append(""""intent":${gson.toJson(intent)}""")
    // For "both" intent: form elements are updated after form modification so the workflow AI
    // sees buttons/fields that were just created by the form AI (not just the pre-existing ones).
    var latestFormElements: String? = params.requestParameters["formElements"]?.firstOrNull()

    if (intent == "form" || intent == "both") {
      val persistJson =
          params.requestParameters["persist"]?.firstOrNull()
              ?: return jsonResponse("""{"error":"Missing persist for form modification"}""")
      try {
        JsonParser.parseString(persistJson)
      } catch (_: Exception) {
        return jsonResponse("""{"error":"Invalid persist JSON"}""")
      }
      val (formJson, applicabilityReport) =
          try {
            runFormModification(prompt, persistJson, modelId, instance, imageParts)
          } catch (e: ExternalAiHttpException) {
            logger.warn("[AICodBiAssistant] Form AI HTTP {}: {}", e.httpStatus, e.body)
            return jsonResponse("""{"error":${gson.toJson("Form AI error: ${e.message}")}}""")
          } catch (e: Exception) {
            logger.error("[AICodBiAssistant] Form modification failed", e)
            return jsonResponse(
                """{"error":${gson.toJson("Form modification failed: ${e.message}")}}""")
          }
      // Propagate a form-AI error response unchanged
      val formParsed = runCatching { JsonParser.parseString(formJson) }.getOrNull()
      if (formParsed?.isJsonObject == true && formParsed.asJsonObject.has("error")) {
        return jsonResponse(formJson)
      }
      // Auto-resolve appointment plan names to UUIDs for XAppointment elements.
      val resolvedFormJson = resolveAppointmentPlans(formJson)
      result.append(""","formJson":$resolvedFormJson""")
      // Auto-manage Holistic.Cleave.* standard configurations based on field types in the form.
      // Only performed when the frontend could read the current standards from the DOM
      // (key absent = standards editor not yet rendered; skip to avoid overwriting manual
      // settings).
      val currentStandardsParam = params.requestParameters["currentStandards"]
      if (currentStandardsParam != null) {
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
  ): String {
    val systemPrompt =
        "You are a FORMCYCLE assistant router. Based on the user's request, determine what type of change is needed:\n" +
            "- \"form\": changes to the form structure (adding/removing/modifying form fields, labels, buttons, layout, etc.) OR applying CodBi functionalities (AI.OCR, HTML.Panel, Form.Navigator, Sys.Log.Console, etc.) OR activating/deactivating standard configurations (tracking, analytics, panels, autocomplete) — these are form property changes, NOT workflows.\n" +
            "- \"workflow\": creating or modifying workflow automations (emails after submission, state changes, triggers, notifications, file downloads, etc.)\n" +
            "- \"both\": both form structure changes AND workflow automations in the same request\n" +
            "Examples: \"Add an upload field that extracts document text\" → form (this adds fields and applies CodBi AI.OCR functionality, no workflow). \"Send an email when the form is submitted\" → workflow. \"Add an upload field and send its content via email after submission\" → both.\n" +
            "\"Gib in der Konsole ... aus\" / \"console output\" / \"log variable to console\" → form (Sys.Log.Console is a CodBi form functionality, NOT a workflow). \"Erstelle einen Bereich\" / \"add a panel\" → form. \"Sende eine E-Mail\" / \"send an email\" → workflow.\n" +
            "\"Datei herunterladen\" / \"file download\" / \"soll heruntergeladen werden\" when combined with \"submit\" / \"absenden\" / \"Klick\" → workflow (downloading a file on form submission is a workflow automation, NOT a form structure change).\n" +
            "Respond ONLY with valid JSON: {\"intent\":\"form\"} or {\"intent\":\"workflow\"} or {\"intent\":\"both\"}\n" +
            "No explanation, no markdown, no code fences."

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }

    logger.info(
        "[AICodBiAssistant] Phase-1 messages sent to AI (model={}): {}", modelId, messagesJson)
    val rawResponse = instance.performFormAssist(modelId, messagesJson)
    val cleaned = extractJson(stripThinkTags(rawResponse))

    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleaned, Map::class.java) as? Map<String, Any>
      val intent = obj?.get("intent") as? String
      when (intent) {
        "form",
        "workflow",
        "both" -> intent
        else -> {
          logger.warn(
              "[AICodBiAssistant] Unexpected intent classification '{}' — defaulting to 'both'",
              intent)
          "both"
        }
      }
    } catch (_: Exception) {
      logger.warn(
          "[AICodBiAssistant] Could not parse classification response '{}' — defaulting to 'both'",
          cleaned)
      "both"
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
      imageParts: List<String> = emptyList()
  ): Pair<String, String?> {
    val systemPrompt = buildFormSystemPrompt()
    val imageHint =
        if (imageParts.isNotEmpty()) {
          val n = imageParts.size
          val intro =
              if (n == 1) "The attached image shows"
              else "The attached $n images show the $n pages of"
          val multiPageSuffix =
              if (n > 1)
                  " CRITICAL: Do NOT stop after page 1 — elements from image 2, 3, ... " +
                      "are just as required as those from image 1."
              else ""
          "\n\n⚠ ATTACHED DOCUMENT: $intro the document to replicate. " +
              "Each image is EXACTLY ONE page — you MUST process ALL $n image(s) and " +
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
    var cleaned = extractJson(stripThinkTags(rawResponse))

    fun rerunWithCodbiDetails(requested: List<String>): String {
      val pass1Obj =
          try {
            JsonParser.parseString(cleaned).asJsonObject
          } catch (_: Exception) {
            null
          }
      val allItems = pass1Obj?.getAsJsonArray("items") ?: JsonArray()

      val retryMessagesJson: String

      if (requested.isEmpty()) {
        // Blind rethink pass: AI previously concluded nothing applies — ask it to reconsider.
        // Use the full compact API reference (including parameter names) so the AI can
        // generate correct data-cb-* parameter attributes instead of inventing names.
        val rethinkSystemPrompt =
            "You are a CodBi form element configurator. " +
                "Your previous evaluation of the following FORMCYCLE form elements concluded that no CodBi functionalities apply. " +
                "CRITICAL — If any element is missing an \"id\" property, you MUST add one. The 'id' is the HTML/DOM element identifier and must be unique. Convention: use the prefix 'xi-' followed by the element's name (e.g., name=\"tfVorname\" → id=\"xi-tf-Vorname\"). " +
                "CRITICAL — The 'elements' array uses 'name' values, NOT 'id' values. Example: element with name=\"tfVorname\" and id=\"xi-tf-vorname\" → add \"tfVorname\" (the name) to the container's elements array, NOT \"xi-tf-vorname\" (the id).\n" +
                "CRITICAL — When creating NEW elements, use ONLY these valid classNames: XTextField, XTextArea, XUpload, XSelect, XCheckbox, XButtonList (NOT 'XButton' — XButton does NOT exist), XSpan, XImage, XFieldSet, XContainer, XContainerInvisible, XSignature, XAppointment, XLine, XSpacer, XPage, XDatalistAdvanced, XTextfieldAdvanced, XFormula, XRating, XCaptcha, XReCaptcha, XHtmlWidget, XMap, XNavigationBar, XLanguageSwich. 'XButton' is INVALID — use XButtonList with a 'buttons' array. XTextField uses 'datatype' (NOT 'type') for input validation. EVERY element needs a 'label' property (containers/fieldsets use 'legend'). New elements MUST be listed in a container's 'elements' array by name.\n" +
                "Please reconsider carefully. Review each element's className and properties and check whether any functionality from the list below is applicable. " +
                "CRITICAL — XAppointment appointmentPlan: If the user's original request mentions \"Terminfinder für X\" (e.g., \"Terminfinder für ddd\"), you MUST add the property \"appointmentPlan\":\"X\" to the XAppointment element's properties. Example: add \"appointmentPlan\":\"ddd\" to the XAppointment.\n" +
                "If a functionality applies: add data-cb-func to the element's properties (as CSV if multiple), and set any required data-cb-* attributes. " +
                "ADDITIONALLY, you MUST also set CSS classes on elements where applicable. " +
                "To set a CSS class: add a \"cssclasses\" array to the element's \"properties\" (e.g. \"cssclasses\":[\"CodBi_People_Name\"]). " +
                "RULES — TWO-OPTION RULE: CSS classes exist ONLY in the list below. For each field, pick ONE: (A) exact CSS class match exists → use it; (B) no CSS class → use data-cb-func. NEVER invent CSS class names. (a) Apply AT MOST ONE CSS class per field. (b) Only apply a class when it has an EXACT match. (c) For Time/Date frames: use CSS class when available (N=1-5); fallback to data-cb-func if all 5 used. When using a CSS class, do NOT add data-cb-func for the SAME behavior — but MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends). (d) Do NOT use CodBi_People_Alphanumeric on street names, localities, or postal codes. (e) REDUNDANCY: A CSS class replaces data-cb-func ONLY when they provide the SAME behavior. CodBi_People_PLZ (Cleave formatting) does NOT replace OpenPLZ.Autocomplete. (f) Street names and localities have no CSS class. (g) CRITICAL — OpenPLZ.Autocomplete via data-cb-func must be set on ALL address fields in EVERY address group (postal code, locality, street, building number), regardless of which plugin/system they come from (Bürger-Services/BundID, BayernID, or custom). Never skip the postal code field. ALL required parameters (Country, TargetData, Dependent, FocusOnAutocomplete) MUST be set on each address field.\n" +
                "   h) NUMBERING — When creating frame CSS classes (TimeFrame_N_Begin/End or DateFrame_N_Begin/End), scan existing form items for which N (1-5) are already used. Use the lowest unused N for each new pair.\n" +
                "   i) Form.Navigator AUTO-GENERATES navigation buttons — CRITICAL: Create a SEPARATE XContainer (div) for the nav bar — do NOT put data-cb-func=form.navigator on XPage elements. XPage is not a div and the functionality requires HTMLDivElement. Add the container to the first page's elements array. CRITICAL — Distinguish from XNavigationBar plugin: Use data-cb-func=form.navigator ONLY when the prompt mentions \"CodBi Navbar\" or \"CodBi Navigation\". When the prompt mentions \"XIMA Navigationsleiste\", \"XIMA navbar\", \"FORMCYCLE navbar\", \"Navigationsleiste\", \"Progress Bar\", \"FC-Navbar\", or \"formcycle navigation bar\", use className=\"XNavigationBar\" instead — do NOT use data-cb-func=form.navigator.\n" +
                "   j) CRITICAL — Bürger-Services/BundID fields (all tfAntragsteller* fields) are autofilled by the authentication system. Do NOT add data-cb-func (no OpenPLZ.Autocomplete, no ldap.autocomplete). HOWEVER, CSS classes for client-side formatting (CodBi_People_Name, CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ, CodBi_People_BuildingNumber) SHOULD still be applied where they make sense — they are purely formatting and do not interfere with authentication autofill.\n" +
                "   j2) CRITICAL — Form Chatbot Plugin (XIMA Chatbot/Chat-Assistent): When the prompt says \"XIMA Chatbot\" or \"XIMA Chat-Assistent\" or similar, use the Form Chatbot Plugin — NOT ai.llama.chat. This plugin adds form-level properties (\"ChatbotEnabled\":\"true\" at the FORM root), NOT individual elements. The CodBi \"ai.llama.chat\" widget is a DIFFERENT feature that creates explicit form elements — use it only when \"CodBi KI-Chat\" is mentioned.\n" +
                "   n) CRITICAL — Common Validation Rules (fc-plugin-common-validation-rules) are NOT CodBi functionalities. Do NOT add them as data-cb-func. These are validation-only plugins applied via data-vdt attribute — they validate input, they do NOT provide CodBi EP/functionality features. If an element already has a data-vdt attribute, leave it. Never add data-cb-func for a validation rule plugin class name.\n" +
                "   j) CRITICAL — Panel CSS classes (CodBi_HTML_Panel_*) ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title. For containers that need a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader=\"true\" and data-cb-autoheadertitle. For fieldsets, panel CSS classes are fine (the legend provides the title).\n" +
                "   j2) CRITICAL — \"Standard-Panel\" prompt: When the user asks for a \"standard panel\" or \"einfaches Panel\", create an XFieldSet with cssclasses=[\"CodBi_HTML_Panel_Standard\"] and a \"legend\" property. Do NOT use XContainer.\n" +
                "   j3) CRITICAL — Panel type mapping: Standard-Panel → CodBi_HTML_Panel_Standard. Flat Panel/flaches Panel → CodBi_HTML_Panel_Flat. Minimal Panel → CodBi_HTML_Panel_Minimal. Index Panel → CodBi_HTML_Panel_Index.\n" +
                "   k) CRITICAL — HTML.Select.Favorites: When applying this functionality you MUST also add a data-cb-initialElement attribute to the XSelect's attributes array. Set its value to the value property (NOT the display text) of the FIRST option. Example: first option is {\"text\":\"Bayern\",\"value\":\"Bayern\"} → add {\"text\":\"data-cb-initialElement\",\"value\":\"Bayern\"}. This prevents the divider from being unintentionally selected.\n" +
                "   l) CRITICAL — XTextArea: ALWAYS set fullwidth=\"1\" on every XTextArea, regardless of other XTextAreas in the form.\n" +
                "Available CSS classes:\n" +
                "=== People === CodBi_People_Name (for person names only), CodBi_People_Alphanumeric (codes/IDs only), CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ (postal codes, use alone), CodBi_People_18plus, CodBi_People_16plus, CodBi_People_BuildingNumber\n" +
                "=== Financial === CodBi_Currency\n" +
                "=== Appointments === CodBi_NoFutureDate, CodBi_DateFrame_N_Begin/End (N=1-5), CodBi_TimeFrame_N_Begin/End (N=1-5) — fallback to data-cb-func if all 5 pairs used\n" +
                "=== LDAP.Autofill === CodBi_LDAP_AC_*\n" +
                "=== AI === AI_LLAMA_CHAT_Input, AI_LLAMA_CHAT_Send, AI_LLAMA_CHAT_Stop, AI_LLAMA_CHAT_Upload, AI_LLAMA_CHAT_Thinking, AI_LLAMA_CHAT_Internet, AI_LLAMA_CHAT_Location, AI_LLAMA_CHAT_MailForward, AI_LLAMA_CHAT_MailAddress, AI_LLAMA_CHAT_AlertOnFinish, AI_LLAMA_STANDARD_QA_Question, AI_LLAMA_STANDARD_TXTQA_Question (FULL name — do NOT shorten), AI_LLAMA_TXTQA_Source, AI_LLAMA_QA_Exclude, AI_OCR_Receiver\n" +
                "SPECIALIST RULE — When the prompt mentions a specialist model name, add data-cb-Specialist attribute to the AI functionality element with that name. Omit if no specialist is named.\n" +
                "AI DOCUMENT QA — For document QA elements: data-cb-func=\"ai.llama.standard.qa\" goes on the XUpload with data-cb-MaxPixelSize=\"180000\" in its attributes. Question answer fields are XTextField or XTextArea with cssclasses=[\"AI_LLAMA_STANDARD_QA_Question\"] and a data-cb-Question attribute in the attributes array whose value is the exact question text. The data-cb-Question value supports <[.FieldName]> placeholders (with leading dot) that resolve to the runtime value of another field in the same container (XContainer or XFieldSet). Example: to ask \"Was ist X?\" where X is another XTextField with name=\"tfXValue\", set data-cb-Question=\"Was ist <[.tfXValue]>?\". The upload and all question fields go inside an XContainer or XFieldSet wrapper.\n" +
                "AI TEXT QA — For text-based QA elements: data-cb-func=\"ai.llama.standard.txtqa\" goes on the FIRST source XTextField with data-cb-useinternet=\"true\" if internet search is needed. Other source fields get cssclasses=[\"AI_LLAMA_TXTQA_Source\"]. The response field gets cssclasses=[\"AI_LLAMA_STANDARD_TXTQA_Question\"] and a data-cb-Question attribute. The trigger field must NOT have AI_LLAMA_STANDARD_TXTQA_Question. All inside an XContainer or XFieldSet wrapper. No workflow generation.\n" +
                "AI CHAT WIDGET — For AI chat / KI-Chat elements: data-cb-func=\"ai.llama.chat\" goes ONLY on the chat display XTextArea — NOT on the container. Add cssclasses: AI_LLAMA_CHAT_Send to the send button, AI_LLAMA_CHAT_Stop to the stop button, AI_LLAMA_CHAT_Upload on upload, AI_LLAMA_CHAT_Thinking/Internet/Location/AlertOnFinish on checkboxes, AI_LLAMA_CHAT_MailForward on mail checkbox, AI_LLAMA_CHAT_MailAddress on email text field. On the MailAddress field also set hiddenif=\"<MailForwardCheckbox_ID>\" (set to the MailForward checkbox's id value, NOT a mode number), hiddenifcomp=0 and hiddenifclear=\"false\" as DIRECT properties (not inside attributes). Keep all items in the items array.\n" +
                "=== UI.Panels === CodBi_HTML_Panel_Standard (default), CodBi_HTML_Panel_Flat, CodBi_HTML_Panel_Index, CodBi_HTML_Panel_Minimal for panels. CodBi_HTML_Panel_NoCordion marks panels excluded from accordion. CodBi_Accordion_A/B/C/D for accordions.\n" +
                "CRITICAL — Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' property that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title. Therefore, for containers (XContainer, XContainerInvisible) that need to be a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader=\"true\" and a data-cb-autoheadertitle. If the user's prompt specifies a title, use that as the data-cb-autoheadertitle value; otherwise generate a descriptive title from the container's content (e.g. \"Geburtsdatum\" for a date-of-birth section, \"Anschrift\" for an address section).\n" +
                "CRITICAL — COLLAPSIBLE XCONTAINERS: When the user asks for a collapsible/expandable/foldable container and it is an XContainer (div), use data-cb-func=html.panel via the attributes array. ALSO set data-cb-generateheader=\"true\" and data-cb-autoheadertitle for the title (from the prompt or auto-generated). For XFieldSet (fieldset), use the CSS class CodBi_HTML_Panel_Standard instead — the legend provides the title. Only add \"data-cb-folded\":\"true\" if the user explicitly wants the panel to start collapsed.\n" +
                "ACCORDION BEHAVIOR — When the user asks for multiple collapsible sections where only ONE should be open at a time (\"nur eines gleichzeitig aufgeklappt\", \"accordion\", \"nur einer offen\", \"nur einer sichtbar\"), create a wrapper XContainer around ALL the panels. Apply data-cb-func=\"html.panel.accordion\" and data-cb-Accordion=\"<uniqueGroupName>\" (e.g. \"group1\") to the wrapper. Each inner panel gets data-cb-func=\"html.panel\" via its own attributes array or the CodBi_HTML_Panel_Standard CSS class for fieldsets, with data-cb-generateheader=\"true\" and data-cb-autoheadertitle. CRITICAL — EVERY panel MUST explicitly set data-cb-folded in its attributes array. The first panel gets data-cb-folded=\"false\" (unfolded). All subsequent panels (2nd, 3rd, ...) get data-cb-folded=\"true\" (folded). This applies to BOTH CSS-class-based XFieldSet panels AND data-cb-func-based XContainer panels. Example wrapper: {\"className\":\"XContainer\",\"properties\":{\"name\":\"coAccordion\",\"elements\":[\"fsBereich1\",\"fsBereich2\",\"fsBereich3\"],\"attributes\":[{\"text\":\"data-cb-func\",\"value\":\"html.panel.accordion\"},{\"text\":\"data-cb-Accordion\",\"value\":\"group1\"}]}}. Example unfolded first panel (data-cb-folded=\"false\"): {\"className\":\"XFieldSet\",\"properties\":{\"name\":\"fsBereich1\",\"legend\":\"Bereich 1\",\"cssclasses\":[\"CodBi_HTML_Panel_Standard\"],\"elements\":[\"tfEingabe1\"],\"attributes\":[{\"text\":\"data-cb-folded\",\"value\":\"false\"}]}}. Example folded second panel (data-cb-folded=\"true\"): {\"className\":\"XFieldSet\",\"properties\":{\"name\":\"fsBereich2\",\"legend\":\"Bereich 2\",\"cssclasses\":[\"CodBi_HTML_Panel_Standard\"],\"elements\":[\"tfEingabe2\"],\"attributes\":[{\"text\":\"data-cb-folded\",\"value\":\"true\"]}}.\n" +
                "=== Print.Removal === CodBi_Print_Remove_*\n" +
                "=== BayVIS === CodBi_BayVIS_*\n" +
                "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_*\n" +
                "CRITICAL: CSS classes ONLY exist for the domains listed above. For any functionality NOT listed here (e.g. Form.Navigator, OpenPLZ.Autocomplete, Date.Min, Date.NoWeekends, HTML.Input.REGEX, HTML.CSS, etc.), there is NO CSS class — you MUST use data-cb-func. NEVER invent CSS class names.\n" +
                "CRITICAL — FILE DOWNLOAD ON SUBMIT: When the original user request asks for a file to be downloaded when a button is clicked or the form is submitted (e.g. \"soll heruntergeladen werden\", \"file download\"), do NOT add data-cb-download or any similar custom attribute. This is NOT a CodBi functionality — it requires a workflow FC_RETURN_FILE node. Leave the form unchanged.\n" +
                "Respond ONLY with a JSON object: " +
                "{\"items\":[...all elements, modified where CodBi applies...],\"_codbiApplicability\":{\"formElementsProcessed\":N,\"codbiElementsEvaluated\":23 (replace counts)," +
                "\"considered\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...]}]," +
                "\"applied\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...]}]," +
                "\"skipped\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...],\"reason\":\"...\"}]}}. " +
                "No explanation, no markdown, no code fences.\n\n" +
                "ORIGINAL USER REQUEST: $prompt\n\n" +
                "FORM ELEMENTS:\n${gson.toJson(allItems)}" +
                CodbiCapabilities.buildFullSection()

        logger.info(
            "[AICodBiAssistant] Blind rethink pass — sending {} item(s) with compact CodBi reference (system-only)",
            allItems.size())
        if (allItems.size() == 0) {
          logger.warn(
              "[AICodBiAssistant] Blind rethink pass has 0 items — pass-1 items array may be missing or empty")
        }

        retryMessagesJson = buildString {
          append("[")
          append("""{"role":"system","content":${gson.toJson(rethinkSystemPrompt)}}""")
          append("]")
        }
      } else {
        // Targeted rerun: AI identified candidates but did not apply full details — send specific
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
            "You are a CodBi form element configurator. " +
                "You receive a JSON array of FORMCYCLE form element objects. Each element has a \"className\" and a \"properties\" object. " +
                "CRITICAL — If an element is missing an \"id\" property, you MUST add one. The 'id' is the HTML/DOM element identifier and must be unique. Convention: use the prefix 'xi-' followed by the element's name (e.g., name=\"tfVorname\" → id=\"xi-tf-Vorname\"). " +
                "CRITICAL — The 'elements' array uses 'name' values, NOT 'id' values. Example: element with name=\"tfVorname\" and id=\"xi-tf-vorname\" → add \"tfVorname\" (the name) to the container's elements array, NOT \"xi-tf-vorname\" (the id).\n" +
                "CRITICAL — When creating NEW elements, use ONLY these valid classNames: XTextField, XTextArea, XUpload, XSelect, XCheckbox, XButtonList (NOT 'XButton' — XButton does NOT exist), XSpan, XImage, XFieldSet, XContainer, XContainerInvisible, XSignature, XAppointment, XLine, XSpacer, XPage, XDatalistAdvanced, XTextfieldAdvanced, XFormula, XRating, XCaptcha, XReCaptcha, XHtmlWidget, XMap, XNavigationBar, XLanguageSwich. XTextField uses 'datatype' (NOT 'type') for input validation. EVERY element needs a 'label' property (containers/fieldsets use 'legend'). New elements MUST be listed in a container's 'elements' array by name.\n" +
                "Apply the CodBi functionalities listed below to the appropriate elements. " +
                "To apply a functionality: set data-cb-func in the element's properties as CSV (create the key if absent). " +
                "CRITICAL — All REQUIRED parameters MUST be set as data-cb-ParamName attributes. Parameters documented as 'Optional — ... Only set if ... Leave empty otherwise — do NOT invent values' should be OMITTED entirely (not set to empty, not created at all) unless the user explicitly asks for that feature. " +
                "Use the element's property values to infer sensible parameter values: " +
                "  - For CSS-Selector parameters referencing other form elements (e.g. MaxField, MinField, DependentPLZ, DependentLocality, FocusOnAutocomplete, Target, File, Container, Updater, DocumentSelector, Field, Destination): use the target element's properties.name value prefixed with a dot '.', e.g. \".tfBisUhrzeit\" or \".tfaAdresse\". Do NOT use an ID selector (# prefix) -- IDs break in repeatable containers. " +
                "  - For string parameters (e.g. Country, MsgNotKnown): set a reasonable default based on the form context. " +
                "  - For boolean parameters (e.g. EqualityPermitted): set a reasonable default. " +
                "Set data-cb-* parameter attributes as documented. " +
                "ADDITIONALLY, you MUST also set CSS classes on elements where applicable. " +
                "To set a CSS class: add a \"cssclasses\" array to the element's \"properties\" (e.g. \"cssclasses\":[\"CodBi_People_Name\"]). " +
                "RULES — TWO-OPTION RULE: CSS classes exist ONLY in the list below. For each field, pick ONE: (A) exact CSS class match exists → use it; (B) no CSS class → use data-cb-func. NEVER invent CSS class names. (a) Apply AT MOST ONE CSS class per field. (b) Only apply when it has an EXACT match. (c) For Time/Date frames: use CSS class when available (N=1-5); fallback to data-cb-func if all 5 used. When using a CSS class, do NOT add data-cb-func for the SAME behavior — but MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends). (d) Do NOT use CodBi_People_Alphanumeric on street names, localities, or postal codes. (e) REDUNDANCY: A CSS class replaces data-cb-func ONLY for same behavior. CodBi_People_PLZ does NOT replace OpenPLZ.Autocomplete. (f) Street names and localities have no CSS class. (g) CRITICAL: OpenPLZ.Autocomplete via data-cb-func on ALL address fields in EVERY address group (postal code, locality, street, building number), regardless of which plugin/system they come from (Bürger-Services/BundID, BayernID, or custom). ALL required parameters (Country, TargetData, Dependent, FocusOnAutocomplete) MUST be set on each address field. (h) NUMBERING: Scan existing items for used TimeFrame/DateFrame N values. Use unused N (1-5) for new pairs. (i) Form.Navigator AUTO-GENERATES navigation buttons — CRITICAL: Create a SEPARATE XContainer (div) for the nav bar — do NOT put data-cb-func=form.navigator on XPage elements. XPage is not a div and the functionality requires HTMLDivElement. Add the container to the first page's elements array. CRITICAL — Distinguish from XNavigationBar plugin: Use data-cb-func=form.navigator ONLY when the prompt mentions \"CodBi Navbar\" or \"CodBi Navigation\". When the prompt mentions \"XIMA Navigationsleiste\", \"XIMA navbar\", \"FORMCYCLE navbar\", \"Navigationsleiste\", \"Progress Bar\", \"FC-Navbar\", or \"formcycle navigation bar\", use className=\"XNavigationBar\" instead — do NOT use data-cb-func=form.navigator. (j) CRITICAL — Panel CSS classes (CodBi_HTML_Panel_*) ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title. For containers that need a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader=\"true\" and data-cb-autoheadertitle. For fieldsets, panel CSS classes are fine (the legend provides the title).\n" +
                "(k) CRITICAL — HTML.Select.Favorites: When applying this functionality you MUST also add a data-cb-initialElement attribute to the XSelect's attributes array. Set its value to the value property (NOT the display text) of the FIRST option. Example: first option is {\"text\":\"Bayern\",\"value\":\"Bayern\"} → add {\"text\":\"data-cb-initialElement\",\"value\":\"Bayern\"}. This prevents the divider from being unintentionally selected.\n" +
                "(l) CRITICAL — Bürger-Services/BundID fields (all tfAntragsteller* fields) are autofilled by the authentication system. Do NOT add data-cb-func (no OpenPLZ.Autocomplete, no ldap.autocomplete). HOWEVER, CSS classes for client-side formatting (CodBi_People_Name, CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ, CodBi_People_BuildingNumber) SHOULD still be applied where they make sense — they are purely formatting and do not interfere with authentication autofill.\n" +
                "(m) CRITICAL — Form Chatbot Plugin (XIMA Chatbot/Chat-Assistent): When the prompt says \"XIMA Chatbot\" or \"XIMA Chat-Assistent\" or similar, use the Form Chatbot Plugin — NOT ai.llama.chat. This plugin adds form-level properties (\"ChatbotEnabled\":\"true\" at the FORM root), NOT individual elements. The CodBi \"ai.llama.chat\" widget is a DIFFERENT feature — use it only when \"CodBi KI-Chat\" is mentioned.\n" +
                "(n) CRITICAL — Common Validation Rules (fc-plugin-common-validation-rules) are NOT CodBi functionalities. Do NOT add them as data-cb-func. These are validation-only plugins applied via data-vdt attribute only — they validate input, they do NOT provide CodBi EP/functionality features. The data-vdt attribute is already set by the form structure AI (Pass-1). If an element already has a data-vdt attribute, leave it as-is. Never add data-cb-func for a validation rule plugin class name.\n" +
                "Available CSS classes:\n" +
                "=== People === CodBi_People_Name (person names only), CodBi_People_Alphanumeric (codes/IDs only), CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ (postal codes, use alone), CodBi_People_18plus, CodBi_People_16plus, CodBi_People_BuildingNumber\n" +
                "=== Financial === CodBi_Currency\n" +
                "=== Appointments === CodBi_NoFutureDate, CodBi_DateFrame_N_Begin/End (N=1-5), CodBi_TimeFrame_N_Begin/End (N=1-5) — fallback to data-cb-func if all 5 used\n" +
                "=== LDAP.Autofill === CodBi_LDAP_AC_*\n" +
                "=== AI === AI_LLAMA_CHAT_Input, AI_LLAMA_CHAT_Send, AI_LLAMA_CHAT_Stop, AI_LLAMA_CHAT_Upload, AI_LLAMA_CHAT_Thinking, AI_LLAMA_CHAT_Internet, AI_LLAMA_CHAT_Location, AI_LLAMA_CHAT_MailForward, AI_LLAMA_CHAT_MailAddress, AI_LLAMA_CHAT_AlertOnFinish, AI_LLAMA_STANDARD_QA_Question, AI_LLAMA_STANDARD_TXTQA_Question (FULL name — do NOT shorten), AI_LLAMA_TXTQA_Source, AI_LLAMA_QA_Exclude, AI_OCR_Receiver\n" +
                "SPECIALIST RULE — When the prompt mentions a specialist model name, add data-cb-Specialist attribute to the AI functionality element with that name. Omit if no specialist is named.\n" +
                "AI DOCUMENT QA — For document QA elements: data-cb-func=\"ai.llama.standard.qa\" goes on the XUpload with data-cb-MaxPixelSize=\"180000\" in its attributes. Question answer fields are XTextField or XTextArea with cssclasses=[\"AI_LLAMA_STANDARD_QA_Question\"] and a data-cb-Question attribute in the attributes array whose value is the exact question text. The data-cb-Question value supports <[.FieldName]> placeholders (with leading dot) that resolve to the runtime value of another field in the same container (XContainer or XFieldSet). Example: to ask \"Was ist X?\" where X is another XTextField with name=\"tfXValue\", set data-cb-Question=\"Was ist <[.tfXValue]>?\". The upload and all question fields go inside an XContainer or XFieldSet wrapper.\n" +
                "AI TEXT QA — For text-based QA elements: data-cb-func=\"ai.llama.standard.txtqa\" goes on the FIRST source XTextField with data-cb-useinternet=\"true\" if internet search is needed. Other source fields get cssclasses=[\"AI_LLAMA_TXTQA_Source\"]. The response field gets cssclasses=[\"AI_LLAMA_STANDARD_TXTQA_Question\"] and a data-cb-Question attribute. The trigger field must NOT have AI_LLAMA_STANDARD_TXTQA_Question. All inside an XContainer or XFieldSet wrapper. No workflow generation.\n" +
                "AI CHAT WIDGET — For AI chat / KI-Chat elements: data-cb-func=\"ai.llama.chat\" goes ONLY on the chat display XTextArea — NOT on the container. Add cssclasses: AI_LLAMA_CHAT_Send to the send button, AI_LLAMA_CHAT_Stop to the stop button, AI_LLAMA_CHAT_Upload on upload, AI_LLAMA_CHAT_Thinking/Internet/Location/AlertOnFinish on checkboxes, AI_LLAMA_CHAT_MailForward on mail checkbox, AI_LLAMA_CHAT_MailAddress on email text field. On the MailAddress field also set hiddenif=\"<MailForwardCheckbox_ID>\" (set to the MailForward checkbox's id value, NOT a mode number), hiddenifcomp=0 and hiddenifclear=\"false\" as DIRECT properties (not inside attributes). Keep all items in the items array.\n" +
                "=== UI.Panels === CodBi_HTML_Panel_Standard (default), CodBi_HTML_Panel_Flat, CodBi_HTML_Panel_Index, CodBi_HTML_Panel_Minimal for panels. CodBi_HTML_Panel_NoCordion marks panels excluded from accordion. CodBi_Accordion_A/B/C/D for accordions.\n" +
                "CRITICAL — Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' property that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title. Therefore, for containers (XContainer, XContainerInvisible) that need to be a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader=\"true\" and a data-cb-autoheadertitle. If the user's prompt specifies a title, use that as the data-cb-autoheadertitle value; otherwise generate a descriptive title from the container's content (e.g. \"Geburtsdatum\" for a date-of-birth section, \"Anschrift\" for an address section).\n" +
                "CRITICAL — \"Standard-Panel\" prompt: When the user asks for a \"Standard-Panel\" or \"standard panel\" or \"einfaches Panel\", create an XFieldSet with cssclasses=[\"CodBi_HTML_Panel_Standard\"] and a \"legend\" property set to \"Panel\" (or a descriptive title if one is implied). Do NOT create an XContainer — panels MUST be XFieldSet. Do NOT use data-cb-func for standard panels — use the CSS class.\n" +
                "CRITICAL — Panel type to CSS class mapping: \"Standard-Panel\" or \"einfaches Panel\" → CodBi_HTML_Panel_Standard. \"Flaches Panel\" or \"Flat Panel\" → CodBi_HTML_Panel_Flat. \"Minimales Panel\" or \"Minimal Panel\" → CodBi_HTML_Panel_Minimal. \"Index-Panel\" or \"Index Panel\" → CodBi_HTML_Panel_Index. Always create XFieldSet, add the corresponding CSS class, and set a \"legend\" property.\n" +
                "CRITICAL — COLLAPSIBLE XCONTAINERS: When the user asks for a collapsible/expandable/foldable container and it is an XContainer (div), use data-cb-func=html.panel via the attributes array. ALSO set data-cb-generateheader=\"true\" and data-cb-autoheadertitle for the title (from the prompt or auto-generated). For XFieldSet (fieldset), use the CSS class CodBi_HTML_Panel_Standard instead — the legend provides the title. Only add \"data-cb-folded\":\"true\" if the user explicitly wants the panel to start collapsed.\n" +
                "=== Print.Removal === CodBi_Print_Remove_*\n" +
                "=== BayVIS === CodBi_BayVIS_*\n" +
                "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_*\n" +
                "CRITICAL: CSS classes ONLY exist for the domains listed above. For any functionality NOT listed here (e.g. Form.Navigator, OpenPLZ.Autocomplete, Date.Min, Date.NoWeekends, HTML.Input.REGEX, HTML.CSS, etc.), there is NO CSS class — you MUST use data-cb-func. NEVER invent CSS class names.\n" +
                "CRITICAL — AI.LLAMA.STD.QA: This EP queries the AI to answer a question. USE IT when the prompt asks to get/retrieve/ask/fetch information from an AI, including weather, data lookups, or any knowledge question. Param[1]=the question string. Param[2]=UseInternet (\"true\" to enable web search). CRITICAL: Unused optional params (3-8) MUST be passed as empty strings via trailing semicolons. For weather queries: \"{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }\". When the prompt asks to output the result to the console, use Sys.Log.Console with data-cb-Data set to this EP.\n" +
                "EP CHAINING — Element Placeholders (EPs) can be chained with > syntax to pass one EP's result as input to another EP. This works in ANY data-cb-* parameter that accepts EPs (e.g. data-cb-Data, data-cb-replacement, data-cb-Values, data-cb-replacements). Example: \"{ BayVIS.Ansprechpartner.Details > { V > VariableName } }\" first resolves V to get an ID, then fetches the contact details. The inner EP is always resolved first and its result becomes the parameter for the outer EP.\n" +
                "Date.Today already supports arithmetic directly — do NOT wrap it in Date.Arithmetic. Use \"{ Date.Today > +1d }\" for tomorrow, \"{ Date.Today > -1d }\" for yesterday, \"{ Date.Today > +7d }\" for a week from now. Arithmetic operations: +N d/m/y (add days/months/years), -N d/m/y (subtract). No need for nested EPs.\n" +
                "Date.FromString turns a date string into a Date object. Use it for prompts asking to convert/parse a date string. Example: \"{ Date.FromString > 01.12.1978 }\" returns a Date object for December 1st, 1978. An optional second parameter sets the format (e.g. \"DD/MM/YYYY\").\n" +
                "JSON.Path extracts a property from an object using a dotted path. It can also call methods on an object by using the method name with parentheses as the path, e.g. \"toString()\" calls the toString method. Example: \"{ JSON.Path > { Date.FromString > 01.12.1978 } ; toString() }\" creates a Date and calls toString() on it. Use JSON.Path for any prompt asking to retrieve a property or call a method on a CodBi EP result.\n" +
                "Data.Join merges the properties of multiple EP results into one object. Use Data.Join when the prompt asks to combine/join/merge/zusammen data from multiple EPs. Example: \"{ Data.Join > { BayVIS.Behoerden.Details > { BayVIS.Behoerden.ID > Amt für Digitales } ; bezeichnung } ; { BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > Amt für Digitales } ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > Amt für Digitales } } } }\" joins the authority designation with its building details into one combined object. Data.Join takes two or more EP results as semicolon-separated parameters.\n" +
                "CRITICAL — BayVIS Detail EPs expect NUMERIC IDs, not names: BayVIS.Behoerden.Details, BayVIS.Behoerden.Details.Gebaeude, BayVIS.Behoerden.Gebaeude.ID, BayVIS.Ansprechpartner.Details all take numeric IDs. The ID-resolver EPs take plain STRING names: BayVIS.Behoerden.ID (authority name like \"Amt für Digitales\"), BayVIS.Ansprechpartner.ID (contact name like \"Salvatore Callari\"). The directory EPs REQUIRE a property name parameter: BayVIS.Behoerden > bezeichnung (not bare { BayVIS.Behoerden }), BayVIS.Ansprechpartner > nachname (not bare { BayVIS.Ansprechpartner }). BayVIS.Behoerden valid property values: behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge. BayVIS.Ansprechpartner valid property values: anrede, vorname, nachname, funktion, stellenbezeichnung, email, website, zimmer, sortierreihenfolge, behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId.\n" +
                "CRITICAL — BayVIS.Behoerden.Details.Gebaeude takes TWO numeric parameters: param 1 = authority ID, param 2 = building ID. To look up building details by authority name, chain BOTH IDs: \"{ BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > Amt für Digitales } ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > Amt für Digitales } } }\" — first param resolves the authority name to its numeric ID, second param resolves the building ID for that authority. BayVIS.Behoerden.Details returns authority METADATA (name, email, type), NOT building addresses. For BUILDING details (street, PLZ, city) use BayVIS.Behoerden.Details.Gebaeude.\n" +
                "CRITICAL — BayVIS.Behoerden.Details also accepts an OPTIONAL second parameter: a property name to extract just that specific field. When the prompt asks for a particular property (e.g. \"Bezeichnung\", \"email\", \"behoerdenart\"), add it as the second parameter: \"{ BayVIS.Behoerden.Details > { BayVIS.Behoerden.ID > Amt für Digitales } ; bezeichnung }\" returns only the authority's designation. Valid property values: bezeichnungBehoerde, behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge, logo, behoerdeZuordnungen, behoerdenGebaeudeZuordnungen. Without this second param, ALL details are returned.\n" +
                "CRITICAL — F (Find) EP must be the OUTERMOST EP when filtering an array by exact property value. F takes (propertyName, exactValue, arrayToSearch). The arrayToSearch is typically a chain of EPs like Sorted > Unique > OpenPLZ. Do NOT put F inside Sorted or Unique. Correct: \"{ F > postalCode ; 91522 ; { sorted > { unique > { openplz.localities > de ; ^a.* }; name }; name } }\". WRONG: \"{ Sorted > { F > ... } }\" or \"{ JSON.Path > { F > ... } }\".\n" +
                "EXACT PROMPT PATTERN: For prompt \"Gib in der Konsole die Namen aller Städte Deutschlands die mit An anfangen sortiert nach dem Namen aus. Gib nur die Einträge aus deren postalCode-Eigenschaft den Wert 91522 haben.\" the data-cb-Data value MUST be: \"{ F > postalCode ; 91522 ; { sorted > { unique > { openplz.localities > de ; ^a.* }; name }; name } }\". The EP name is JSON.Path (with dot), NOT \"JSON Path\" (with space). The EP name is OpenPLZ.Localities (dot, case-sensitive), NOT \"OpenPlz.Localities\" or \"openplz.localities\". Use EXACT registered EP names: JSON.Path, OpenPLZ.Localities, OpenPLZ.Streets, LDAP.Find, etc.\n" +
                "CRITICAL — ALL OpenPLZ EPs (OpenPLZ, OpenPLZ.Streets, OpenPLZ.Localities, OpenPLZ.OrganizationalUnits, OpenPLZ.TextSearch) return Array<object>. Each object has properties like \"name\", \"officialKey\", \"type\", \"postalCode\", \"locality\". To extract a specific property (e.g. street names), wrap the EP in JSON.Path: \"{ JSON.Path > { OpenPLZ.Streets > de ; Karolinen ; 91522 } ; name }\". If the prompt asks for names only (e.g., \"Gib die Namen der Straßen aus\") and the same name may appear with different postal codes, deduplicate with Unique: \"{ Unique > { OpenPLZ.Streets > de ; Karolinen ; 91522 } ; name }\". CRITICAL: Never generate bare \"{ OpenPLZ.Streets > de ; Karolinen ; 91522 }\" when the prompt asks for a specific property like \"name\" or \"Namen\" — you MUST wrap in JSON.Path first. EXCEPTION: When using F (Find) for exact property filtering, F MUST be the outermost EP — do NOT wrap in JSON.Path. The F EP already returns the filtered objects and JSON.Path would break the F parameter structure.\n" +
                "CRITICAL — EP parameter values are raw strings without quotes. Write { BayVIS.Ansprechpartner.ID > Salvatore Callari } NOT { BayVIS.Ansprechpartner.ID > \"Salvatore Callari\" }. Quotes are part of the EP syntax itself (the { } braces), do NOT add extra quotes around parameter values.\n" +
                "Sys.Log.Console does NOT need an existing form element — it is a standalone functionality. When the user asks to output/print/log/show anything to the browser console (URL content, BayVIS data, CSV, global variables, DOM elements, etc.), you MUST create a NEW XContainerInvisible at the top of the first page's elements array. Set its \"name\" property (prefix \"div\"), an \"id\" property (prefix \"xi-log-\"), an empty \"elements\" array, and put data-cb-func and data-cb-Data in the \"attributes\" array as {\"text\":\"...\",\"value\":\"...\"} pairs. Example: {\"className\":\"XContainerInvisible\",\"properties\":{\"name\":\"divConsoleOutput\",\"id\":\"xi-log-1\",\"elements\":[],\"attributes\":[{\"text\":\"data-cb-func\",\"value\":\"Sys.Log.Console\"},{\"text\":\"data-cb-Data\",\"value\":\"{ Data.CSV > { Net.URL > http://... } }\"}]}}. If the prompt explicitly mentions CSV (e.g. \"als CSV\"), use Data.CSV wrapping Net.URL in data-cb-Data. If no CSV is mentioned, use Net.URL alone. For dynamic URLs from a variable: \"{ Net.URL > { V > VariableName } }\" (with or without Data.CSV wrapper per the CSV rule). For BayVIS data, chain the BayVIS EP directly in data-cb-Data. When the prompt asks to output/print/log/show a form element or DOM element to the console (e.g. \"Gib das Formular-Element .p1 in der Konsole aus\"), use the DOM.Query EP in data-cb-Data: \"{ DOM.Query > .p1 }\" — the CSS selector is the parameter passed to DOM.Query (the dot-prefixed class name from the prompt). Do NOT set data-cb-value. If the prompt additionally specifies an index (e.g. \"Element in Index 0\", \"first element\", \"zweites Element\", \"das 3. Element\"), wrap the DOM.Query in the I EP: \"{ I > 0 ; { DOM.Query > .p1 } }\" — the I EP takes the 0-based index as its first parameter and the DOM EP result as its second parameter. If the prompt asks for a property of the DOM result (e.g. \"Länge\", \"length\", \"tagName\", \"textContent\"), wrap the DOM.Query in the JSON.Path EP: \"{ JSON.Path > { DOM.Query > .p1 } ; length }\" — JSON.Path extracts the specified property (dotted path) from the DOM EP result.\n" +
                "CRITICAL: PRESERVE the element's EXISTING content properties (\"rtevalue\", \"textContent\", \"label\", \"legend\", \"placeholder\", \"value\") — do NOT modify them. The CodBi functionality will replace the placeholder text at runtime via data-cb-replacement. If you change rtevalue to contain the EP expression \"{ Data.CSV > ... }\", the user will see the literal EP text in the browser because EPs are NOT resolved in form element properties.\n" +
                "IMPORTANT: PRESERVE any existing \"cssclasses\" array already set on elements from the input — only add entries or create a new array if none exists.\n" +
                "You MAY create new elements (e.g. XContainerInvisible for Sys.Log.Console) when the prompt requires outputting data to the console, listing BayVIS data, or any other action that needs a new CodBi-tagged element. Add new elements at the top of the first page's elements array.\n" +
                "REMEMBER THE OpenPLZ JSON.Path RULE: OpenPLZ, OpenPLZ.Streets, OpenPLZ.Localities return Array<object>. When the prompt asks for a property like \"name\"/\"Namen\", you MUST wrap in JSON.Path. Example: \"{ JSON.Path > { OpenPLZ.Streets > de ; Karolinen ; 91522 } ; name }\" — NOT bare \"{ OpenPLZ.Streets > de ; Karolinen ; 91522 }\". JSON.Path is REQUIRED for property extraction.\n" +
                "Respond ONLY with a JSON object: " +
                "{\"items\":[...same elements with modifications applied, plus any new elements created...],\"_codbiApplicability\":{\"formElementsProcessed\":4,\"codbiElementsEvaluated\":23 (replace counts)," +
                "\"considered\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...]}]," +
                "\"applied\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...]}]," +
                "\"skipped\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...],\"reason\":\"...\"}]}}. " +
                "No explanation, no markdown, no code fences." +
                CodbiCapabilities.buildFullSection()

        val pass2UserContent =
            "Original user request: $prompt\n\nApply CodBi functionalities ($candidateClause) to these form elements:\n${gson.toJson(targetItems)}"

        logger.info(
            "[AICodBiAssistant] Pass-2 CodBi — candidates: {}, targetIds: {}, sending {} item(s)",
            candidateClause,
            if (targetElementIds.isEmpty()) "<none from pass-1>"
            else targetElementIds.joinToString(", "),
            targetItems.size())
        if (targetItems.size() == 0) {
          logger.warn(
              "[AICodBiAssistant] Pass-2 has 0 items to send — pass-1 items array may be missing or empty")
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
      val pass2Cleaned = extractJson(stripThinkTags(retryRaw))
      logger.info("[AICodBiAssistant] Pass-2 raw result: {}", pass2Cleaned)
      return splicePass2IntoPass1(cleaned, pass2Cleaned)
    }

    // Normalize _codbiApplicability before any extraction logic: the AI often puts
    // "Matomo.Tracking" in considered/applied instead of "Holistic.Matomo.Tracking"
    // (Rule 10c). Correct this server-side by replacing the ID in the raw JSON so that
    // all downstream extraction functions see the correct value.
    cleaned = normalizeMatomoTrackingInRawJson(cleaned)

    val requestedDetails = extractCodbiDetailsRequest(cleaned)
    if (requestedDetails != null) {
      logger.info(
          "[AICodBiAssistant] AI requested CodBi details for: {} — rerunning with full compact API",
          requestedDetails.elements.ifEmpty { listOf("<unspecified>") }.joinToString(", "))
      if (!requestedDetails.applicabilityReport.isNullOrBlank()) {
        logger.info(
            "[AICodBiAssistant] AI CodBi applicability report (detail request): {}",
            requestedDetails.applicabilityReport)
      }
      cleaned = rerunWithCodbiDetails(requestedDetails.elements)
    } else {
      val appliedCodbi = extractAppliedCodbiIds(cleaned)
      if (appliedCodbi.isNotEmpty()) {
        logger.warn(
            "[AICodBiAssistant] AI applied CodBi functionalities without requesting details first; forcing detail rerun for: {}",
            appliedCodbi.joinToString(", "))
        cleaned = rerunWithCodbiDetails(appliedCodbi)
      } else {
        val consideredCodbi = extractConsideredCodbiIds(cleaned)
        if (consideredCodbi.isNotEmpty()) {
          logger.info(
              "[AICodBiAssistant] AI identified CodBi candidates but did not escalate; forcing detail rerun for: {}",
              consideredCodbi.joinToString(", "))
          cleaned = rerunWithCodbiDetails(consideredCodbi)
        } else {
          // AI returned _codbiApplicability but with an empty considered list.
          // This can happen non-deterministically even when candidates exist — the AI evaluates
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
              else "evaluated CodBi list but found no candidates — forcing blind evaluation"
          logger.info("[AICodBiAssistant] AI {} — triggering blind CodBi evaluation pass", reason)
          cleaned = rerunWithCodbiDetails(emptyList())
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
      restored to applicabilityReport
    } catch (_: Exception) {
      logger.warn("[AICodBiAssistant] Form AI returned unparseable response: {}", sanitizedCleaned)
      ("""{"error":"AI returned invalid JSON","raw":${gson.toJson(sanitizedCleaned)}}""") to null
    }
  }

  private fun buildFormSystemPrompt(): String =
      "You are a FORMCYCLE form structure assistant. You receive a partial IPersistJson object " +
          "(styling and image fields have been removed to save tokens) and a natural language " +
          "instruction. Your ONLY output must be the same partial IPersistJson — modified according " +
          "to the instruction — as a raw JSON object. No explanation, no markdown, no code fences.\n\n" +
          "CRITICAL RULES — violating any of these will corrupt the form:\n" +
          "0. CRITICAL — XAppointment appointmentPlan: When the prompt says \"Terminfinder für X\" (e.g., \"Terminfinder für ddd\"), you MUST add the property \"appointmentPlan\":\"X\" to the XAppointment element's properties. Example: if the prompt says \"Terminfinder für ddd\", set \"appointmentPlan\":\"ddd\" on the XAppointment. The backend auto-resolves this to the UUID. NEVER omit appointmentPlan when the prompt names a specific schedule.\n" +
          "0a. CRITICAL — Date Utils plugin (dateUtil): When the prompt asks for date restrictions/constraints (e.g., \"Datum vor\", \"Datum nach\", \"nur Werktage\", \"Feiertage ausblenden\"), add these custom properties to XTextField elements with datatype=\"dateDE\" or datatype=\"date\": dateUtilBefore (date must be before), dateUtilBeforeEqual (date before or equal), dateUtilAfter (date must be after), dateUtilAfterEqual (date after or equal), dateUtilShowWeekends (\"true\" to show weekends), dateUtilShowHolidaysFor (German state code for holiday display: bw, by, be, bb, hb, hh, he, mv, ni, nw, rp, sl, sn, st, sh, th), dateUtilIncludeAssumptionOfMary (\"true\" for Bavaria only), dateUtilDisableSaturdays (\"true\"), dateUtilDisableSundays (\"true\"), dateUtilDisableHolidays (\"true\" to disable holidays). All properties use placeholder syntax like \"24.12.2025\", \"[%tf1%]\", \"[%\$DATE%]\", \"[%\$form_date_created%]+2y\", \"[%\$form_date_modified%]-18y3m5d\" for relative dates.\n" +
          "0b. CRITICAL — Bürger-Services (citizen services) form elements: When the prompt asks for \"Bürger-Services\", \"Bürgerkonto\", \"BundID\", or citizen eID form fields, use these pre-configured element names and properties. The fields are usually grouped inside an XFieldSet named \"fsBKAllDaten\" with legend \"Ihre Anmeldedaten\". PERSON fields: use XSelect name=\"selPersTyp\" for login type (radio, options: NatPers/NNatPers). XSelect name=\"selAntragstellerGeschlecht\" for gender. XSelect name=\"tfAntragstellerAnrede\" for salutation. XTextField name=\"tfAntragstellerTitel\" for academic title, name=\"tfAntragstellerVorname\" for first name, name=\"tfAntragstellerName\" for last name, name=\"tfAntragstellerZusatzname\" for last name suffix, name=\"tfAntragstellerEmail\" (datatype=\"email\") for email, name=\"tfAntragstellerGeburtsdatum\" (datatype=\"dateDE\") for birth date, name=\"tfAntragstellerGeburtsname\" for birth name, name=\"tfAntragstellerGeburtsort\" for place of birth, name=\"tfAntragstellerTelefon\" for phone. OPTIGOV EXTRA fields (optiGov plugin): name=\"tfAntragstellerMittelname\" for middle name, name=\"tfAntragstellerKuenstlername\" for artist name, name=\"tfAntragstellerDoktorgrad\" for doctorate degree, name=\"tfAntragstellerPseudonym\" for pseudonym, name=\"tfAntragstellerDeMail\" (datatype=\"email\") for DE-Mail, name=\"tfAntragstellerLand\" for country, name=\"tfAntragstellerNationalitaet\" for nationality, name=\"tfAntragstellerAusstellenderStaat\" for issuing state. ADDRESS fields: name=\"tfAntragstellerAdresse\" for street address, name=\"tfAntragstellerAuslandsAdresse\" for foreign address, name=\"tfAntragstellerPLZ\" (datatype=\"plzDE\") for postal code, name=\"tfAntragstellerOrt\" for city, name=\"tfAntragstellerAGS\" (isreadonly=\"2\") for community ID. TECHNICAL fields (readonly): name=\"tfAuthentifizierungsLevel\", name=\"tfAuthentifizierungsName\", name=\"tfDokumentTyp\", name=\"TrustLevel\" (Vertrauensniveau), name=\"PostboxId\", name=\"tfAntragsId\", name=\"IdentitaetsPruefer\", name=\"BPK2\", name=\"tfPersTyp\".\n" +
          "   CRITICAL — Bürger-Services/BundID fields (all tfAntragsteller* and technical fields) are autofilled by the authentication system AFTER login. Do NOT add data-cb-func (no OpenPLZ.Autocomplete, no ldap.autocomplete) to these fields — the Bürger-Services plugin itself maps the authentication response data. However, CSS classes for client-side formatting/validation (CodBi_People_Name on name fields, CodBi_People_Mail on email, CodBi_People_Phone on phone, CodBi_People_PLZ on postal code, CodBi_People_BuildingNumber on building number) SHOULD still be applied — these are purely formatting and do NOT interfere with authentication autofill.\n" +
          "0c. CRITICAL — XBsLogin (Bürger-Services login button): When the prompt asks for a \"BundID Login-Button\", \"Bürgerkonto Login\", or \"Authentifizierungsbutton\", create an element with className=\"XBsLogin\". Set these properties: name (e.g. \"bsLogin\"), id (e.g. \"xi-bs-login\"), bs_btn_text (button label, e.g. \"Mit BundID anmelden\"), bs_auth_ref (authenticator reference, e.g. \"BUND_ID::https://idp.bundid.de\"), bs_show_in_popup (\"true\" for popup login), bs_page_name (page after login), bs_cancel_page_name (page on cancel), bs_check_page (\"true\" to validate), bs_postbox_mandatory (\"true\" if postbox required), bs_trust_level (trust level: \"m|0\"=no restriction, \"e|3\"=certificate, \"m|3\"=certificate or ID, \"e|4\"=ID card), bs_login_method (restrict login method: comma-separated values like \"EID,ELSTER\"), bs_requested_attributes (requested SAML attributes), bs_suffix (auth data suffix), bs_hide_if_userprofile_exists (\"true\" to hide if already logged in), bs_ui_info_display_name (display name for the authenticator).\n" +
          "0d. CRITICAL — Form Chatbot Plugin (fc-plugin-form-chatbot): When the prompt asks for a \"XIMA Chatbot\", \"XIMA Chat-Assistent\", \"Chat-Assistent\", \"Chatbot\", \"KI-Chat-Assistent\" on the form level (especially when \"XIMA\" is mentioned), use the Form Chatbot Plugin — NOT the CodBi ai.llama.chat widget. This plugin adds form-level properties — NOT individual form elements. The chat bubble (toggle button + chat window) is auto-rendered by the plugin at runtime. Set these properties at the FORM level (in the form JSON root, NOT inside an element's properties): \"ChatbotEnabled\":\"true\" to activate the chat assistant. Optionally set \"ChatbotQuery\" to select a prompt query and \"ChatbotQueryParam\" to select which response property contains the answer text. Do NOT create form elements for the chat bubble — the plugin handles rendering automatically. The CodBi \"ai.llama.chat\" widget (which creates explicit XContainer, XTextArea, XButtonList, XCheckbox elements) is a DIFFERENT feature — use it only when \"CodBI KI-Chat\" or \"CodBi Chat\" is explicitly mentioned, NOT for \"XIMA Chatbot\".\n" +
          "0e. CRITICAL — DS Widget Plugin (plugin-bundle-ds-widget): When the prompt asks for a \"filterbares Textfeld\" or \"filterable text field\", create an element with className=\"XTextfieldAdvanced\". Properties: name, id, label, xtf_ds_param (datasource parameter to filter by), xtf_use_colvalue (\"true\" to use the 'col'-attribute for filtering), xtf_colnumber ('col'-attribute column number), xtf_filter_colnumber (datasource column to apply filter on). When the prompt asks for a \"filterbare Auswahl\" or \"filterable select\", create an element with className=\"XDatalistAdvanced\". Properties: name, id, label, xda_ds_param (datasource parameter to filter by), xda_use_colvalue (\"true\" to use the 'col'-attribute for filtering), xda_colnumber ('col'-attribute column number), xda_filter_colnumber (datasource column to apply filter on), xda_show_please_select (\"true\" to show a default \"please select\" option). Both widgets receive data from a datasource and can filter each other — after a filter element updates, a \"datasource-changed\" event fires for chained filtering.\n" +
          "0f. CRITICAL — XFormula Widget Plugin (fc-plugin-widget-bundle-xformula): When the prompt asks for a \"Berechnungsfeld\", \"calculation field\", \"formula field\", or \"computed field\", create an element with className=\"XFormula\". This is a read-only input whose value is auto-computed from a JavaScript formula. CRITICAL: The formula expression goes into 'xformula_value' (NOT 'value' — using 'value' is wrong and won't work). All optional properties use the 'xformula_' prefix: xformula_type (\"auto\"=determine automatically, \"text\"=always text), xformula_empty_as_zero (\"0\"=treat empty as text, \"1\"=treat as zero), xformula_index (order index). Formatting properties (only when xformula_mask=\"true\"): xformula_unit (display unit), xformula_align (\"p\"=before number, \"s\"=after number), xformula_external (\"true\" for unit outside field), xformula_external_width (unit width in px), xformula_mdec (decimal places), xformula_decimal (decimal separator), xformula_thousands (thousands separator), xformula_color_value (\"true\" to enable color change), xformula_color_pos (CSS color for positive values), xformula_color_neg (CSS color for negative values). Do NOT set datatype, readonlyif, readonlyifmode, readonlyifcomp, or readonlyifvalue on XFormula — the designer auto-removes them.\n" +
          "0g. CRITICAL — XRating Widget Plugin (fc-plugin-widget-xrating): When the prompt asks for a \"Bewertung\", \"Bewertungsfeld\", \"rating\", \"rating widget\", \"star rating\", or \"Sternebewertung\", create an element with className=\"XRating\". This is a visual rating widget with configurable icons (stars, thumbs, emoticons). Properties: name, id, label. The NUMBER of icons is determined by the 'options' array — each entry in 'options' generates one clickable icon. For example, for 20 stars, create an options array with 20 entries (values \"1\" through \"20\", texts like \"1 Star\" through \"20 Stars\"). Optional properties use the 'xrating_' prefix: xrating_icon_inactive (icon for unselected state — common values: \"ico-rating-star\", \"ico-rating-star-outline\", \"ico-rating-thumb-up\", \"ico-rating-thumb-down\", \"ico-rating-emoticon-happy\", \"ico-rating-emoticon-sad\", \"ico-rating-emoticon-neutral\"), xrating_icon_active (icon for selected state — same icon options), xrating_color_gradient (\"true\" to enable color gradient), xrating_color_start (start color in rgb() format, e.g. \"rgb(181,45,58)\" — CRITICAL: use rgb(R,G,B) format, NOT hex like \"#b52d3a\" because XRating.java only parses rgb() format), xrating_color_end (end color in rgb() format, e.g. \"rgb(85,201,55)\" — same: rgb() only, NOT hex).\n" +
          "0h. CRITICAL — CAPTCHA Plugin (fc-plugin-bundle-captcha): When the prompt asks for a \"Captcha\", \"CAPTCHA\", \"Sicherheitsabfrage\", or \"Spam-Schutz\", create an element with className=\"XCaptcha\". This shows a hard-to-read challenge text that the user must enter to prove they are human. Standard properties: name, id, label. Has built-in refresh and audio play buttons. No custom properties needed.\n" +
          "0i. CRITICAL — Google reCAPTCHA Plugin (fc-plugin-bundle-google-recaptcha): When the prompt asks for a \"Google reCaptcha\", \"reCaptcha\", or \"Google CAPTCHA\", create an element with className=\"XReCaptcha\". This integrates Google reCAPTCHA into the form. Properties: name, id, label, recaptcha_site_key (Google reCAPTCHA site key), recaptcha_secret_key (Google reCAPTCHA secret key).\n" +
          "0j. CRITICAL — XHtml Widget Plugin (fc-plugin-widget-xhtml): When the prompt asks for an \"HTML-Element\", \"HTML widget\", \"benutzerdefiniertes HTML\", or \"custom HTML element\", create an element with className=\"XHtmlWidget\". This renders custom HTML code in the form. Standard properties: name, id, label. Custom property: html_code (the HTML content to render, e.g. \"<h1>Überschrift</h1><p>Text</p>\").\n" +
          "0k. CRITICAL — XMap Widget Plugin (fc-plugin-widget-xmap): When the prompt asks for a \"Karte\", \"map\", \"Karten-Widget\", or \"Leaflet map\", create an element with className=\"XMap\". This is a Leaflet-based map widget. Key props (all 'xmap_' prefix): xmap_latitude, xmap_longitude, xmap_zoom, xmap_min_zoom/xmap_max_zoom, xmap_min_markers/xmap_max_markers, xmap_geometry_point/xmap_geometry_line/xmap_geometry_area, xmap_localize, xmap_locate_button, xmap_color_marker_point/xmap_color_marker_user/xmap_color_line/xmap_color_area_border/xmap_color_area_fill. Advanced: xmap_use_custom_map_source, xmap_custom_map_source, xmap_custom_map_source_type (\"tms\"/\"wms\"/\"wmts\"), xmap_wms_layers, xmap_wms_format, xmap_wms_version, xmap_wms_crs, xmap_use_http_settings.\n" +
          "0l. CRITICAL — XNavigationBar Plugin (fc-plugin-widget-xnavbar): When the prompt asks for a \"XIMA Navigationsleiste\", \"XIMA navbar\", \"FORMCYCLE navbar\", \"Navigationsleiste\", \"Progress Bar\", \"FC-Navbar\", \"formcycle navigation bar\", or \"FC-Navigationsleiste\", create an element with className=\"XNavigationBar\". This is the FORMCYCLE navigation bar / progress bar widget. It renders a visual step indicator bar showing all form pages. Standard properties: name, id, label. Steps are defined via the \"options\" array - each entry creates one step with \"text\" (display name) and \"value\" (page identifier). For custom step count, provide that many options (e.g. for 20 steps: 20 options). Uses custom action button types for the page navigation buttons: xnavbar_next (next page), xnavbar_next_check (next page + validation), xnavbar_prev (previous page), xnavbar_prev_check (previous page + validation). Add the XNavigationBar as a top-level item in the items array and add its name to the first page's elements array. CRITICAL — Distinguish from CodBi Form.Navigator: Use XNavigationBar (this plugin) when the prompt mentions FORMCYCLE navbar/navigationsleiste. Use CodBi Form.Navigator (data-cb-func=form.navigator on XContainer) when the prompt mentions \"CodBi Navbar\" or \"CodBi Navigation\".\n" +
          "0m. CRITICAL — XSignature Widget Plugin (fc-plugin-widget-xsignature): When the prompt asks for a \"Unterschrift\", \"signature\", \"Signaturfeld\", or \"signature pad\", use className=\"XSignature\". This plugin extends the standard XSignature with: xsignature_stroke_color (pen stroke color in hex, e.g. \"#0000ff\" for blue), xsignature_base_line_show (\"0\"=hide, \"1\"=show baseline), xsignature_base_line_color (baseline color in hex), xsignature_base_line_hide_print (\"0\"=show, \"1\"=hide baseline in print).\n" +
          "0n. CRITICAL — XLanguageSwich Plugin (fc-plugin-widget-xlangswitch): When the prompt asks for a \"Sprachauswahl\", \"Sprachwechsler\", \"language selector\", or \"Sprachauswahl-Widget\", create an element with className=\"XLanguageSwich\". Languages are defined via the \"options\" array - each entry creates one language link with \"text\" (display name, e.g. \"Deutsch\") and \"value\" (language code, e.g. \"de\"). For custom languages, provide that many options (e.g. for 4 languages: 4 options). Standard properties: name, id, label. Custom property: xlangswitch_page_redirect (\"0\"=off, \"1\"=remember current page after language switch). Add the XLanguageSwich as a top-level item in the items array and add its name to the first page's elements array.\n" +
          "0o. CRITICAL — Common Validation Rules Plugin (fc-plugin-common-validation-rules): When the prompt asks for a \"KFZ-Kennzeichen\", \"license plate\", \"Kfz-Kennzeichen\", or \"Autokennzeichen\", set datatype=\"de.xima.fc.plugin.fc-plugin-common-validation-rules.KfzDE\". For \"IBAN\": datatype=\"...IbanValidationPlugin\". For \"BIC Inland\" (domestic BIC): datatype=\"...Bic11InlandValidationPlugin\". For \"BIC Ausland\" (foreign BIC): datatype=\"...Bic8To11AuslandValidationPlugin\". For \"Geldbetrag\"/\"money amount\" with comma: datatype=\"...MoneyValidationPlugin\". For \"AHV\" (Swiss): datatype=\"...AhvNumberValidationPlugin\". For \"Datum und Uhrzeit\" (date+time): datatype=\"...DateTimeValidationPlugin\". For US date mm-dd-yyyy: datatype=\"...DateFormatUSValidationPlugin\". For UK date dd/mm/yyyy: datatype=\"...DateFormatUKValidationPlugin\". For decimal with period: datatype=\"...FloatFormatValidationPlugin\". For email without special chars before @: datatype=\"...LocalPartRFC5322MailAddressValidationPlugin\". Use the FULL path as shown — these are the exact getKey() values registered by the plugin. Do NOT add data-cb-func for these.\n" +
          "1. PRESERVE every existing item exactly as-is unless the instruction explicitly targets it. " +
          "Do NOT remove, rename, or reorder existing items.\n" +
          "2. The 'items' array is FLAT at the top level — all form elements live here, including " +
          "containers, fieldsets, and their children. Each item's unique identifier is stored in " +
          "'properties.name' (NOT as a top-level 'name' field — items have no top-level 'name'). " +
          "Containers and fieldsets reference their children via 'properties.elements', a sub-array " +
          "of child name strings (NOT the items themselves).\n" +
          "3. When ADDING new items: append them to the top-level 'items' array AND add their name " +
          "to the 'properties.elements' array of the target container/fieldset.\n" +
          "3b. MANDATORY for containers/fieldsets: When the instruction asks you to create a section/group " +
          "that CONTAINS specific input fields, you MUST create ALL child input items in the same response. " +
          "Do NOT output a container with an empty 'elements':[] when the user asked for content inside it. " +
          "Each child item must appear both in the top-level 'items' array AND by name in the container's 'elements'. " +
          "TIME RANGE example — 'a section with a start time and end time': " +
          "items = [..., {XFieldSet name=fsZeit elements=[tfVonUhrzeit,tfBisUhrzeit]}, " +
          "{XTextField name=tfVonUhrzeit datatype=time label=Von}, " +
          "{XTextField name=tfBisUhrzeit datatype=time label=Bis}]\n" +
          "4. Assign unique, descriptive values to new items' 'properties.name'. Use type-appropriate prefixes: \n" +
          "   'tf' for XTextField/XTextArea (e.g. 'tfVorname', 'tfEmail'), \n" +
          "   'fd' for XUpload (e.g. 'fdLebenslauf'), \n" +
          "   'sel' for XSelect, 'cb' for XCheckbox, 'btn' for XButtonList buttons, \n" +
          "   'sig' for XSignature, 'div' for XContainerInvisible.\n" +
          "4b. MANDATORY — EVERY generated element MUST also have a unique 'id' property. The 'id' is the HTML/DOM element identifier and must be unique within the form. Convention: use the prefix 'xi-' followed by the element name (e.g., name=\"tfVorname\" → id=\"xi-tf-Vorname\"; name=\"bsLogin\" → id=\"xi-bs-login\"; name=\"app1\" → id=\"xi-app-1\"). Do NOT reuse 'id' values — each element's id must be unique across the entire form. Without a valid unique 'id', the form will not render correctly.\n" +
          "   CRITICAL — The 'elements' array of containers/fieldsets/pages uses 'name' values, NOT 'id' values. Example: element with name=\"tfVorname\" and id=\"xi-tf-vorname\" → add \"tfVorname\" (the name) to the container's elements array, NOT \"xi-tf-vorname\" (the id). The 'elements' array is a list of child NAME strings, not ID strings.\n" +
          "5. Valid FORMCYCLE element className values (use ONLY these exact strings — do NOT invent class names like 'XButton', 'XInput', 'XText', etc.):\n" +
          "   CRITICAL — 'XButton' does NOT exist. Use XButtonList with a 'buttons' array for any button.\n" +
          "   CRITICAL — XTextField uses 'datatype' (not 'type') for input validation. The 'type' property does NOT exist on XTextField.\n" +
          "   CRITICAL — EVERY element needs a 'label' property (except containers/fieldsets which use 'legend'). Without a label, the element won't render in the designer.\n" +
          "   - XTextField          — single-line text input; set 'datatype' property to validate input (usdLY these exact values):\n" +
          "     \"\" plain text (default) · \"dateDE\" German date DD.MM.YYYY (preferred; shown as 'Datum (TT.MM.YYYY)' in designer) · \"date\" HTML5 native date picker · \"email\" e-mail ·\n" +
          "     \"phone\" phone number · \"url\" URL · \"time\" time HH:MM · \"number\" decimal number · \"integer\" integer ·\n" +
          "     \"posinteger\" non-negative integer · \"money\" money amount · \"posmoney\" non-negative money ·\n" +
          "     \"posmoneyOptionalComma\" non-negative money (decimal optional) · \"formattedNumber\" number with custom format config ·\n" +
          "     \"plzDE\" German ZIP code · \"ipv4\" IPv4 address · \"onlyLetterNumber\" alphanumeric · \"onlyLetterSp\" letters and spaces ·\n" +
          "     \"regexp\" custom regex (also add datatypeHint property with the regex pattern and error message)\n" +
          "     Common Validation Rules (fc-plugin-common-validation-rules) custom datatypes — set directly as datatype value. Use FULL getKey() path: \"de.xima.fc.plugin.fc-plugin-common-validation-rules.KfzDE\" for German license plate, \"...IbanValidationPlugin\" for IBAN, \"...Bic11InlandValidationPlugin\" for BIC (domestic), \"...Bic8To11AuslandValidationPlugin\" for BIC (foreign), \"...MoneyValidationPlugin\" for money amount, \"...AhvNumberValidationPlugin\" for Swiss AHV, \"...DateTimeValidationPlugin\" for date+time, \"...DateFormatUSValidationPlugin\" for US date, \"...DateFormatUKValidationPlugin\" for UK date, \"...FloatFormatValidationPlugin\" for decimal with period. Do NOT add data-cb-func for these.\n" +
          "   - XTextArea           — multi-line text input\n" +
          "   - XUpload             — file upload / file download field\n" +
          "   - XSelect             — dropdown / select list; use 'options' array for static items\n" +
          "   - XCheckbox           — checkbox (note: lowercase 'b')\n" +
          "   - XButtonList  — button or button group; no label; 'buttons' array contains button objects each with: " +
          "'name' (technical ID), 'value' (display text, may be HTML), 'action' object. " +
          "WARNING: action.page uses special FORMCYCLE keywords, NOT form page names: " +
          "\"submit\" = submit the form to the server (NOT a page name — do NOT replace with 'p1' or any other page); " +
          "\"previous\" = go back; any page name (e.g. \"p1\") = navigate to that page. " +
          "For a button that sends/submits the form: action.page=\"submit\", action.check=true. " +
          "For a no-action button: omit action or set action.page=\"\".\n" +
          "   - XSpan        — static text / label; text content goes in 'rtevalue', NOT 'label'\n" +
          "   - XImage       — image element\n" +
          "   - XFieldSet    — fieldset / group container; title goes in 'legend', NOT 'label'\n" +
          "   - XContainer          — generic layout container; has no 'label' property\n" +
          "   - XContainerInvisible — invisible/hidden layout container; same as XContainer but not rendered; has no 'label' property\n" +
          "   - XSignature          — signature pad (XSignature Widget Plugin); supports pen stroke color via \"xsignature_stroke_color\" (hex e.g. #0000ff for blue), baseline via \"xsignature_base_line_show\", baseline color via \"xsignature_base_line_color\", hide baseline in print via \"xsignature_base_line_hide_print\".\n" +
          "   - XAppointment        — appointment/calendar picker / Terminfinder (do NOT use for date input fields — use XTextField with datatype=\"dateDE\" instead). When the prompt says \"Terminfinder\" or \"Terminkalender\" or \"appointment picker\", create XAppointment. Properties: name (e.g. \"app1\"), id (e.g. \"xi-app-1\"), label (set to a descriptive title like \"Termin\"), dateFormat=\"dd.mm.yy\", required=\"0\", closeable=\"0\", showUntil=\"0\", showCapacity=\"0\". Display options: AlsTextfeld (set \"1\" to show as text field initially, \"0\" to always show calendar), FreiePlaetze/showCapacity (\"1\" to show available slots), Terminende (\"1\" to show end time). Gesperrt (\"1\" locked, cannot be changed). Versteckt (\"1\" hidden). Requires a Terminplan (schedule) configured in the backend Terminverwaltung. The Appointments standard config in codbi-prop-standards enables this functionality.\n" +
          "CRITICAL — When the prompt names a specific Terminplan (e.g., \"Terminfinder für ddd\"), add 'appointmentPlan' with the schedule name as value (e.g., \"appointmentPlan\":\"ddd\"). The backend automatically resolves the name to the correct UUID for 'appointmentTemplate'. You do NOT need to set 'appointmentTemplate' yourself.\n" +
          "   - XLine               — horizontal divider; has no 'label' property\n" +
          "   - XSpacer      — empty spacer; has no 'label' property\n" +
          "   - XPage        — form page (top-level)\n" +
          "   - XDatalistAdvanced — filterable select/datalist (DS Widget Plugin); properties: xda_ds_param (datasource parameter to filter by), xda_use_colvalue (\"true\" to use 'col'-attribute for filter), xda_colnumber ('col'-attribute column number), xda_filter_colnumber (datasource column to filter on), xda_show_please_select (\"true\" to show default option).\n" +
          "   - XTextfieldAdvanced — filterable text field (DS Widget Plugin); properties: xtf_ds_param (datasource parameter to filter by), xtf_use_colvalue (\"true\" to use 'col'-attribute for filter), xtf_colnumber ('col'-attribute column number), xtf_filter_colnumber (datasource column to filter on).\n" +
          "   - XFormula — calculation/formula field (XFormula Widget Plugin); read-only input whose value is auto-computed from a JavaScript formula. CRITICAL: The formula expression goes into 'xformula_value' (NOT 'value'). All properties use the 'xformula_' prefix: xformula_value (the formula, e.g. \"[%tf1%] + [%tf2%]\"), xformula_type (\"auto\" or \"text\"), xformula_empty_as_zero (\"0\"=treat empty as text, \"1\"=treat as zero), xformula_index (order index). Formatting properties (only when xformula_mask=\"true\"): xformula_unit (display unit), xformula_align (\"p\"=before number, \"s\"=after number), xformula_external (\"true\" for unit outside field), xformula_external_width (unit width in px), xformula_mdec (decimal places), xformula_decimal (decimal separator), xformula_thousands (thousands separator), xformula_color_value (\"true\" to enable color change), xformula_color_pos (CSS color for positive values), xformula_color_neg (CSS color for negative values). Do NOT set datatype, readonlyif, readonlyifmode, readonlyifcomp, or readonlyifvalue on XFormula — the plugin auto-removes them.\n" +
          "   - XRating — rating widget (XRating Widget Plugin); visual rating with icons (stars, thumbs, emoticons). Properties: xrating_icon_inactive (icon for unselected state — e.g. \"ico-rating-star\", \"ico-rating-star-outline\", \"ico-rating-thumb-up\", \"ico-rating-emoticon-happy\"), xrating_icon_active (icon for selected state — same icon options), xrating_color_gradient (\"true\" to enable color gradient), xrating_color_start (start color in rgb() format, e.g. \"rgb(181,45,58)\" — CRITICAL: use rgb(R,G,B) format, hex like \"#b52d3a\" crashes the renderer), xrating_color_end (end color in rgb() format, e.g. \"rgb(85,201,55)\" — same: rgb() only, NOT hex). The user clicks icons to set a rating value.\n" +
          "   - XCaptcha — captcha widget (CAPTCHA Plugin); displays a hard-to-read challenge text that the user must enter to prove they are human. Standard properties: name, id, label. Has built-in refresh and audio play buttons. No custom properties needed.\n" +
          "   - XReCaptcha — Google reCAPTCHA widget (reCAPTCHA Plugin); integrates Google reCAPTCHA. Properties: recaptcha_site_key (site key), recaptcha_secret_key (secret key).\n" +
          "   - XHtmlWidget — custom HTML element (XHtml Widget Plugin); renders custom HTML code. Properties: html_code (the HTML content, e.g. \"<h1>Title</h1>\").\n" +
          "   - XMap — Leaflet map widget (XMap Plugin); displays an interactive map. Properties use 'xmap_' prefix: xmap_latitude, xmap_longitude, xmap_zoom, xmap_min_zoom, xmap_max_zoom, xmap_min_markers, xmap_max_markers, xmap_geometry_point/xmap_geometry_line/xmap_geometry_area, xmap_localize, xmap_locate_button, xmap_color_marker_point, xmap_color_marker_user, xmap_color_line, xmap_color_area_border, xmap_color_area_fill. Advanced: xmap_use_custom_map_source, xmap_custom_map_source, xmap_custom_map_source_type, xmap_use_http_settings, xmap_wms_layers.\n" +
          "   - XNavigationBar — navigation bar / progress bar widget (XNavigationBar Plugin); renders a visual step indicator showing all pages. Use when the prompt mentions \"XIMA Navigationsleiste\", \"XIMA navbar\", \"FORMCYCLE navbar\", \"Navigationsleiste\", \"Progress Bar\", \"FC-Navbar\", \"formcycle navigation bar\", or \"FC-Navigationsleiste\". Standard properties: name, id, label. Steps are defined via the \"options\" array - each entry creates one step with \"text\" (display name) and \"value\" (page identifier). For custom step count, provide that many options entries (e.g. for 20 steps: 20 options). Uses custom action button types for page navigation: xnavbar_next (next page button), xnavbar_next_check (next page + validation), xnavbar_prev (previous page button), xnavbar_prev_check (previous page + validation). Add the XNavigationBar as a top-level item in the items array and add its name to the first page's elements array.\n" +
          "   - XLanguageSwich — language selector widget (XLanguageSwich Plugin); renders one or more language links for switching the form language. Languages are defined via the \"options\" array - each entry creates one language link with \"text\" (display name, e.g. \"Deutsch\") and \"value\" (language code, e.g. \"de\"). For custom languages, provide that many options (e.g. for 4 languages: 4 options). Standard properties: name, id, label. Custom property: xlangswitch_page_redirect (\"0\"=off, \"1\"=remember current page after language switch). Add the XLanguageSwich as a top-level item and its name to the first page's elements array.\n" +
          "   - XHeader      — form header\n" +
          "   - XFooter      — form footer\n" +
          "   Do NOT invent class names. Use ONLY the names listed above.\n" +
          "   NOTE: XContainerInvisible is a valid className even though it looks unusual — use it when you need a hidden container.\n" +
          "6. A 'download/upload field' in FORMCYCLE is className XUpload (NOT XFileUpload).\n" +
          "7. When creating a new item: if the form already contains an item of the same className, " +
          "copy its properties structure exactly and adapt name, id, label, and type-specific values. " +
          "If no item of that type exists yet, use the matching minimal template from ITEM TEMPLATES below.\n" +
          "8. Do NOT include 'css', 'script', 'image', 'images', 'pagePreview', 'rendered', " +
          "'formI18n', or 'metadata' fields — they are handled separately and will be merged back. " +
          "Also do NOT include any XFooter item in the items array — it is structural chrome preserved automatically.\n" +
          "9. Output ONLY valid JSON. No trailing commas. No comments.\n" +
          "10. CRITICAL — the instruction may contain BOTH form structure changes AND automation/workflow tasks. " +
          "You must still create ALL mentioned form elements (input fields, buttons, labels, etc.) — " +
          "a button is a form element regardless of what it does when clicked. " +
          "IGNORE ONLY the automation/email/notification descriptions (e.g. 'send an email when clicked', " +
          "'notify by mail', 'trigger an action on submit'). Those are handled by a separate system.\n" +
          "11. MANDATORY RULE — XButtonList submit button: For any button that submits or sends the form " +
          "(e.g. 'Absenden', 'Senden', 'Einreichen', 'Prüfen und Senden'), use EXACTLY this action: " +
          "{\"page\":\"submit\",\"check\":true,\"customAction\":\"\",\"customClassNames\":\"\",\"displayName\":\"\",\"optionId\":\"submit + check\",\"value\":\"\"}. " +
          "The string 'submit' is a FORMCYCLE server-side command — it is NOT a page name and must NEVER " +
          "be replaced with any page name you see in the form (e.g. 'p1', 'p2', etc.). " +
          "WRONG: action={\"page\":\"p1\",\"check\":true,\"optionId\":\"p1 + check\"} ← do not do this. " +
          "CORRECT: action={\"page\":\"submit\",\"check\":true,\"optionId\":\"submit + check\"} ← always use this for submit buttons.\n\n" +
          "10b. CONTAINER FOR CONDITIONALLY SHOWN FIELDS — When the prompt describes a field that should be shown or hidden based on a condition (wenn...dann..., if...then...), wrap that field in an XContainer. The container becomes the target of the conditional functionality — do NOT apply show/hide directly on the form field itself. You MUST create BOTH the container AND the child field as separate items in the top-level 'items' array, AND reference the child by name in the container's 'elements' array. Example: add XContainer coErziehungsberechtigter with elements=[\"tfNameDesErziehungsberechtigten\"] to the items array AND also add XTextField tfNameDesErziehungsberechtigten as a separate item in the same items array. Rule 3 and 3b apply — do NOT create a container with an empty elements array.\n" +
          "10b2. EXCEPTION — BundID fsBKAllDaten: When the prompt asks to show/hide BundID/Bürger-Services fields based on any condition (wenn...dann..., if...then..., checkbox, select, etc.), do NOT create a new container. The existing XFieldSet named 'fsBKAllDaten' (legend='Ihre Anmeldedaten') is already the container for all BundID fields. Instead, add the show/hide properties ('hiddenif', 'hiddenifcomp', 'hiddenifvalue') directly to the fsBKAllDaten element. Refer to the controlling element by its id. Do NOT create a new container or wrap the fields again.\n\n" +
          "10c. MATOMO TRACKING — When the prompt says \"Matomo-Tracking aktivieren\" or \"activate Matomo tracking\" without specifying a SiteID, do NOT add Matomo.Tracking functionality via data-cb-func on any element. " +
          "Do NOT include Matomo.Tracking in _codbiApplicability.considered. " +
          "Do NOT include Matomo.Tracking in _codbiApplicability.applied. " +
          "Instead, include {\"id\":\"Holistic.Matomo.Tracking\",\"targets\":[]} in _codbiApplicability.applied — the server reads this and activates the standard configuration. " +
          "Only apply Matomo.Tracking functionality with data-cb-SiteID when a SiteID IS explicitly specified in the prompt.\n\n" +
          "12. ATTACHED IMAGES: When the user message contains a '⚠ ATTACHED DOCUMENT:' notice, " +
          "one or more images are attached to this message regardless of what language the instruction is in. " +
          "Those images ARE the form or document to replicate if the prompt asks you to. " +
          "Inspect every visible element — text fields, text areas, dropdowns, checkboxes, file uploads, " +
          "section headings, labels, and buttons — and produce a FORMCYCLE element for each one. " +
          "Do NOT return an unmodified form: if the image contains fields, they MUST appear in the output.\n\n" +
          "13. MULTIPLE PAGES: When multiple images are attached, each image is EXACTLY one document page. " +
          "Create one XPage per image/page. Page 1 uses the existing 'p1' XPage; " +
          "for each additional page create a new XPage (names 'p2', 'p3', ...; ids 'xi-p-2', 'xi-p-3', ...) and add it to 'items'. " +
          "For EVERY page — including page 1 — do the following: " +
          "(a) create one form element object per visible field/heading/button in that image and add each object to the top-level 'items' array; " +
          "(b) list those element names in that page's XPage 'properties.elements' array (names only, not full objects). " +
          "Each element name must appear in ONLY ONE page's 'properties.elements' — never list the same name under two pages. " +
          "Every page MUST be non-empty: if an image shows any content, that page's elements array must contain those items. " +
          "Example output structure for a 2-page form: " +
          "top-level items = [p1-XPage({elements:[fieldA,fieldB]}), {fieldA-obj}, {fieldB-obj}, p2-XPage({elements:[fieldC,fieldD]}), {fieldC-obj}, {fieldD-obj}]. " +
          "On all non-final pages add a 'Weiter' XButtonList at the bottom: " +
          "action={\"page\":\"p2\",\"check\":true,\"customAction\":\"\",\"customClassNames\":\"\",\"displayName\":\"\",\"optionId\":\"p2 + check\",\"value\":\"\"} (substitute actual next page name). " +
          "On all non-first pages add a 'Zurück' XButtonList at the top: " +
          "action={\"page\":\"p1\",\"check\":false,\"customAction\":\"\",\"customClassNames\":\"\",\"displayName\":\"\",\"optionId\":\"p1\",\"value\":\"\"} (substitute actual previous page name). " +
          "Put the final 'Absenden' submit button on the last page.\n" +
          "14. DOCUMENT PATTERNS — these rules override Rule 12's default mapping for SPECIFIC matching elements only. " +
          "Every element that does NOT match a pattern below is STILL generated normally per Rule 12. Apply automatically:\n" +
          "   a) FILE UPLOAD OVERRIDE (applies ONLY to XCheckbox elements, never to text fields or any other type): " +
          "When a checkbox label explicitly states that a specific named file or document IS being physically attached or WILL be uploaded as a file attachment — " +
          "regardless of the label's language — do NOT generate an XCheckbox. Instead generate an XUpload field. " +
          "Do NOT apply to checkboxes about consenting, agreeing, confirming, or merely referencing a document; ONLY apply when the checkbox is literally about attaching/uploading a physical file. " +
          "ALWAYS rewrite the label to be short and action-oriented in the document's own language: " +
          "derive a '[subject] [upload-verb]' label from the checkbox text (examples: " +
          "'Downloadlink bzw. Zertifikat als Datei ist beigefügt' → 'Zertifikat hier hochladen'; " +
          "'Lebenslauf als Datei beigefügt' → 'Lebenslauf hier hochladen'; " +
          "'Certificate attached as file' → 'Upload certificate here'; " +
          "'Certificado adjunto como archivo' → 'Subir certificado aquí'). " +
          "The XUpload fully replaces the checkbox — no XCheckbox is created alongside it.\n" +
          "   UPLOAD + SEND-LATER PAIRING: When the upload-triggering checkbox (Rule 14a) appears alongside a " +
          "companion checkbox whose meaning is 'the document will be delivered later or via another channel' — " +
          "i.e. the checkbox semantically means 'will be sent by email/mail/post', 'will be provided later', " +
          "'will be submitted separately', or any equivalent in any language — " +
          "replace BOTH checkboxes as a pair as follows: " +
          "(1) Create an XSelect whose label is the subject noun and whose options are " +
          "[{\"text\":\"[upload-now wording in document language]\",\"value\":\"jetzt\"},{\"text\":\"[companion checkbox text verbatim]\",\"value\":\"nachgereicht\"}]. " +
          "(2) Directly below the XSelect, create an XUpload with the rewritten action-oriented label. " +
          "Neither original checkbox is kept as an XCheckbox. " +
          "The XUpload should only be shown when 'upload now' is selected — " +
          "this visibility condition CANNOT be expressed in the JSON and must be configured in the form designer after import; " +
          "add an XSpan with rtevalue='ℹ️ [In document language: reminder to the form author to configure the XUpload visibility condition so the upload field is only shown when the \"upload now\" option is selected].' " +
          "directly below the XUpload as a reminder.\n" +
          "   b) YES/NO CHOICE: A JA/NEIN or Ja/Nein checkbox pair, radio group, or tick-box group → " +
          "XSelect with options [{\"text\":\"JA\",\"value\":\"JA\"},{\"text\":\"NEIN\",\"value\":\"NEIN\"}].\n" +
          "   c) SIGNATURE OVERRIDE: Whenever a signature area, signature line, or closing salutation appears anywhere in the document " +
          "— regardless of position — you MUST generate an XSignature element. Triggers include: " +
          "'Unterschrift', 'Datum/Unterschrift', 'Datum, Unterschrift', 'Ort, Datum', 'Ort/Datum', " +
          "'Mit freundlichen Grüßen', 'Mit freundlichen Grüssen', 'Freundliche Grüße', " +
          "any blank underline or line labeled for signature, or any blank area following a closing salutation. " +
          "Generate: XSpan (rtevalue = the closing text) followed immediately by XSignature. " +
          "NEVER omit this — missing signatures are always a defect.\n" +
          "   d) DOCUMENT HEADER: When the attached document has a header with an organization name, " +
          "institution title, or letterhead text, update the form's existing XHeader item to show that text. " +
          "Every form already contains exactly one XHeader — do NOT add a new XHeader item. " +
          "Add an XSpan with the organization name as rtevalue to the top-level items array, " +
          "then add its name to the existing XHeader's 'properties.elements' array. " +
          "The logo image cannot be extracted from a rendered document page image — replicate visible text only.\n" +
          "   e) GROUPED SUB-FIELDS: When a field label or description specifies more than one individual data point — " +
          "either as a parenthetical list '(Name, Mailadresse, Telefon)' or after a colon 'Kontaktdaten: Name, Mailadresse, Telefon' " +
          "— do NOT create a single combined field. " +
          "Instead create an XFieldSet whose legend is the main label text (everything before the parenthetical or colon list), " +
          "and inside it one XTextField per sub-item; the sub-item text becomes that XTextField's label. " +
          "Example: 'Kontaktdaten unserer Einrichtung: (Name, Mailadresse, Telefon)' → " +
          "XFieldSet legend='Kontaktdaten unserer Einrichtung' containing XTextField label='Name', " +
          "XTextField label='Mailadresse', XTextField label='Telefon'. " +
          "This applies to any field with a comma-separated sub-item list regardless of topic (contact details, location info, document references, etc.).\n\n" +
          "17. CRITICAL — FILE DOWNLOAD ON SUBMIT: When the prompt asks to download a file when a button is clicked or when the form is submitted (e.g. \"soll heruntergeladen werden\", \"file download\", \"download xoxo.txt\"), this is a WORKFLOW automation action. " +
          "Do NOT handle it via data-cb-* attributes on the button or any form element. " +
          "Do NOT invent data-cb-download or any similar custom attribute. " +
          "Leave the form structure unchanged and report this in _codbiApplicability with an explanation that this requires a workflow FC_RETURN_FILE node, not a form change.\n\n" +
          "ITEM TEMPLATES — minimal valid structure for each className (adapt name/id/label).\n" +
          "WARNING for XButtonList template: the value 'submit' in action.page is a literal server command, " +
          "NOT a placeholder. Do NOT change it. Copy the template exactly for submit buttons.\n" +
          "15. DATE FIELDS — MANDATORY: Every field whose label refers to a date MUST have its datatype set. " +
          "NEVER leave a date field with datatype=\"\". " +
          "Use datatype=\"dateDE\" for all German-language forms (this is the DD.MM.YYYY text input, shown as 'Datum (TT.MM.YYYY)' in the designer UI — it is NOT named 'dateDE' in the UI, but that is the JSON value to use). " +
          "Use datatype=\"date\" only when an HTML5 native browser date picker is explicitly required. " +
          "Applies to fields whose label contains or means: " +
          "'Datum', 'Geburtsdatum', 'Geburtstag', 'Eintrittstermin', 'Termin', 'Abgabedatum', 'Anfangsdatum', 'Enddatum', " +
          "'date', 'birthday', 'birth date', 'start date', 'end date', 'due date', and any similar calendar-date label. " +
          "Example: label 'Geburtsdatum' → XTextField with datatype=\"dateDE\".\n" +
          "16. FORMCYCLE CONDITIONAL VISIBILITY (hiddenif) AND LOCKING (readonlyif) — These control when a field is hidden or locked based on another field's value. Set these as DIRECT properties on the element (NOT inside the attributes array). Formcycle uses the component's ID to reference the controlling field.\n" +
          "   For a SIMPLE checkbox-controlled condition (hide/lock when checkbox is CHECKED): set hiddenif=\"<checkboxID>\" (the checkbox's properties.id value) with hiddenifcomp=0 and hiddenifclear=\"false\". The same applies to readonlyif: set readonlyif=\"<checkboxID>\" with readonlyifcomp=0 and readonlyifclear=\"1\".\n" +
          "   For VALUE-BASED conditions on other fields, also set hiddenifcomp (comparison mode) and hiddenifvalue (comparison value):\n" +
          "     - hiddenifcomp=1, hiddenifvalue=\"<placeholder>\" — hide when the controlling field is NOT EMPTY (has any value). The placeholder value is ignored.\n" +
          "     - hiddenifcomp=2, hiddenifvalue=\"<exactValue>\" — hide when controlling field's value EQUALS this string.\n" +
          "     - hiddenifcomp=3, hiddenifvalue=\"<regex>\" — hide when controlling field's value MATCHES the regex pattern (e.g. \".+\" = one or more chars).\n" +
          "     - hiddenifcomp=4, hiddenifvalue=\"<number>\" — hide when controlling field's value is LESS THAN this number.\n" +
          "     - hiddenifcomp=5, hiddenifvalue=\"<number>\" — hide when controlling field's value is GREATER THAN this number.\n" +
          "     - hiddenifcomp=6, hiddenifvalue=\"<min>-<max>\" — hide when controlling field's value is WITHIN this range (e.g. \"1-10\").\n" +
          "     - hiddenifcomp=7, hiddenifvalue=\"<value>\" — hide when controlling field's value is NOT EQUAL to this.\n" +
          "     - hiddenifcomp=8, hiddenifvalue=\"<regex>\" — hide when controlling field's value does NOT MATCH the regex.\n" +
          "   hiddenifclear controls what happens to the field's value when hidden: \"false\" or 0 = preserve value, \"1\" = clear value, \"2\" = disable but keep value.\n" +
          "   The SAME modes apply to readonlyif (gesperrt wenn): readonlyifcomp values 0-8 work identically to hiddenifcomp, readonlyifvalue is the comparison value, readonlyifclear uses the same values. Example: readonlyif=\"xi-cb-1\" with no comp needed for simple checkbox-based lock.\n" +
          "   CRITICAL: The hiddenif (and readonlyif) value must be the EXACT properties.id of the controlling component — NOT a mode number and NOT the properties.name. Copy it verbatim from the controlling component's id field.\n" +
          "   Example: controlling XCheckbox id=\"xi-cb-agree\" → target gets hiddenif=\"xi-cb-agree\", hiddenifcomp=0, hiddenifclear=\"false\".\n" +
          "   Example: controlling XTextField id=\"xi-tf-age\" → target gets hiddenif=\"xi-tf-age\", hiddenifcomp=4, hiddenifvalue=\"18\", hiddenifclear=\"1\" (hide when age < 18).\n" +
          "   hiddenif, hiddenifcomp, hiddenifclear, hiddenifvalue, readonlyif, readonlyifcomp, readonlyifclear, readonlyifvalue are ALL DIRECT properties — do NOT put them inside the attributes array.\n" +
          """{"className":"XTextField","properties":{"name":"tfExample","id":"xi-tf-example","label":"Example","required":"0","readonly":"0","placeholder":"","datatype":"","fullwidth":"0"}}""" +
          "\n" +
          "   ← For DATE fields set datatype=\"dateDE\" (DD.MM.YYYY, preferred for German forms): " +
          """{"className":"XTextField","properties":{"name":"tfGeburtsdatum","id":"xi-tf-geburtsdatum","label":"Geburtsdatum","required":"0","readonly":"0","placeholder":"","datatype":"dateDE","fullwidth":"0"}}""" +
          "\n" +
          "   ← For NUMBER fields set datatype=\"formattedNumber\": " +
          """{"className":"XTextField","properties":{"name":"tfBetrag","id":"xi-tf-betrag","label":"Betrag","required":"0","readonly":"0","placeholder":"","datatype":"formattedNumber","fullwidth":"0"}}""" +
          "\n" +
          "   ← For EMAIL fields set datatype=\"email\": " +
          """{"className":"XTextField","properties":{"name":"tfEmail","id":"xi-tf-email","label":"E-Mail","required":"0","readonly":"0","placeholder":"","datatype":"email","fullwidth":"0"}}""" +
          "\n" +
          "   ← For PHONE fields set datatype=\"phone\": " +
          """{"className":"XTextField","properties":{"name":"tfTelefon","id":"xi-tf-telefon","label":"Telefon","required":"0","readonly":"0","placeholder":"","datatype":"phone","fullwidth":"0"}}""" +
          "\n" +
          "   ← For TIME fields set datatype=\"time\": " +
          """{"className":"XTextField","properties":{"name":"tfUhrzeit","id":"xi-tf-uhrzeit","label":"Uhrzeit","required":"0","readonly":"0","placeholder":"","datatype":"time","fullwidth":"0"}}""" +
          "\n" +
          "   ← For INTEGER/COUNT fields set datatype=\"integer\": " +
          """{"className":"XTextField","properties":{"name":"tfAnzahl","id":"xi-tf-anzahl","label":"Anzahl","required":"0","readonly":"0","placeholder":"","datatype":"integer","fullwidth":"0"}}""" +
          "\n" +
          "   ← For URL fields set datatype=\"url\": " +
          """{"className":"XTextField","properties":{"name":"tfUrl","id":"xi-tf-url","label":"URL","required":"0","readonly":"0","placeholder":"","datatype":"url","fullwidth":"0"}}""" +
          "\n" +
          "   ← For GERMAN ZIP CODE fields set datatype=\"plzDE\": " +
          """{"className":"XTextField","properties":{"name":"tfPlz","id":"xi-tf-plz","label":"PLZ","required":"0","readonly":"0","placeholder":"","datatype":"plzDE","fullwidth":"0"}}""" +
          "\n" +
          """{"className":"XTextArea","properties":{"name":"tfExample","id":"xi-tf-example","label":"Example","required":"0","readonly":"0","placeholder":"","fullwidth":"0","autosize":"0"}}""" +
          "\n" +
          """{"className":"XUpload","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fileextension":"","fullwidth":"0"}}""" +
          "\n" +
          """{"className":"XSelect","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fullwidth":"0","options":[]}}""" +
          "\n" +
          """{"className":"XCheckbox","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","checkboxvalue":"1","checkedvalue":""}}""" +
          "\n" +
          """{"className":"XButtonList","properties":{"name":"btlExample","id":"xi-btl-example","buttons":[{"name":"btnExample","value":"Button Text","action":{"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}}]}}""" +
          "\n" +
          "   IMPORTANT — XButtonList action.page uses fixed FORMCYCLE commands, not form page names: " +
          "\"submit\" is a server-side submit command (NOT the page named 'p1' or any other page — never replace this with a page name); " +
          "\"previous\" goes back one page; a page name (\"p1\", \"p2\", etc.) navigates to that page. " +
          "For page navigation, set both action.page and action.optionId to the target page name. " +
          "EXCEPTION to rule 7: do NOT copy action.page from existing buttons — always set it based on the button's purpose." +
          "\n" +
          """{"className":"XSpan","properties":{"name":"fdExample","id":"xi-fd-example","rtevalue":"Example text"}}""" +
          "\n" +
          """{"className":"XFieldSet","properties":{"name":"fsExample","id":"xi-fs-example","legend":"Group","elements":[],"fullwidth":"0"}}""" +
          "\n" +
          """{"className":"XContainer","properties":{"name":"coExample","id":"xi-co-example","elements":[],"fullwidth":"0"}}""" +
          "\n" +
          "   ← For COLLAPSIBLE containers (\"aus- und einklappbar\", \"auf- und zuklappbar\"): add attributes with data-cb-func=html.panel, data-cb-generateheader=\"true\" and data-cb-autoheadertitle (see COLLAPSIBLE XCONTAINERS rule below). Do NOT use panel CSS classes — they only work on XFieldSet.\n" +
          "\n" +
          """{"className":"XSignature","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0"}}""" +
          "\n" +
          """{"className":"XAppointment","properties":{"name":"apExample","id":"xi-ap-example","label":"Example","required":"0","dateFormat":"dd.mm.yy","closeable":"0","showUntil":"0","showCapacity":"0"}}""" +
          "\n" +
          """{"className":"XContainerInvisible","properties":{"name":"divExample","id":"xi-div-example","elements":[],"fullwidth":"0"}}""" +
          "\n" +
          "   ← For COLLAPSIBLE containers (\"aus- und einklappbar\", \"auf- und zuklappbar\"): add attributes with data-cb-func=html.panel, data-cb-generateheader=\"true\" and data-cb-autoheadertitle (see COLLAPSIBLE XCONTAINERS rule below). Do NOT use panel CSS classes — they only work on XFieldSet.\n" +
          "\n" +
          """{"className":"XLine","properties":{"name":"liExample","id":"xi-li-example"}}""" +
          "\n" +
          """{"className":"XSpacer","properties":{"name":"spExample","id":"xi-sp-example"}}""" +
          "\n" +
          """{"className":"XPage","properties":{"name":"p2","id":"xi-p-2","header":"","subheader":"","elements":[]}}""" +
          "\n" +
          """{"className":"XHeader","properties":{"name":"header","id":"xi-header","elements":[]}}""" +
          "\n\n" +
          "14. CSS CLASSES — You can apply CodBi CSS classes to form elements by adding a \"cssclasses\" array to the element's \"properties\". " +
          "The matching standard configuration is auto-activated server-side. " +
          "IMPORTANT — TWO-OPTION RULE:\n" +
          "CSS classes exist ONLY for the specific patterns listed below under 'Available CSS classes'. " +
          "For EVERY field you modify, you have exactly TWO options — pick ONE:\n" +
          "  OPTION A — CSS class exists in the list below → use it (e.g. CodBi_People_Name for a name field)\n" +
          "  OPTION B — No matching CSS class in the list → use data-cb-func (e.g. Form.Navigator has NO CSS class → data-cb-func=form.navigator)\n" +
          "CRITICAL: NEVER invent CSS class names. If a CSS class is not in the list below, it does NOT exist — use data-cb-func instead.\n" +
          "APPLICATION RULES:\n" +
          "   a) Apply AT MOST ONE CSS class per field — do NOT stack multiple classes on the same element.\n" +
          "   b) Only apply a CSS class when it has an EXACT match to the field's purpose. If no class matches, use data-cb-func.\n" +
          "   c) For Time/Date frame ranges: When a CodBi_TimeFrame_N_Begin/End or CodBi_DateFrame_N_Begin/End CSS class exists (N=1-5), use it. FALLBACK: If all 5 numbers are already used, use data-cb-func=time.frame (or date.frame) with data-cb-MaxField parameter. When using a frame CSS class, do NOT add data-cb-func=time.frame or data-cb-func=date.frame — that would be redundant. However, you MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends is valid — different purposes).\n" +
          "   d) NUMBERING — When creating frame CSS classes (CodBi_TimeFrame_N_Begin/End or CodBi_DateFrame_N_Begin/End), scan the existing form items for which frame numbers N (1-5) are already in use. Use the lowest unused N for each new pair. If all 5 numbers are taken, fall back to data-cb-func.\n" +
          "   e) OpenPLZ.Autocomplete — ALWAYS uses data-cb-func=OpenPLZ.Autocomplete (no CSS class exists). Must be set on ALL address fields in EVERY address group — regardless of whether the fields are from Bürger-Services/BundID (tfAntragsteller*), BayernID, or any custom address group. Any field representing a postal code, locality/city, or street address must get the full OpenPLZ.Autocomplete treatment. A People CSS class like CodBi_People_PLZ does NOT provide OpenPLZ autocomplete. ALL required parameters (Country, TargetData, Dependent, FocusOnAutocomplete) MUST be set on each address field.\n" +
          "   f) Do NOT use CodBi_People_Alphanumeric on street names, localities, or other non-alphanumeric-code fields — it is ONLY for actual alphanumeric codes and IDs.\n" +
          "   g) REDUNDANCY RULE: When a field's datatype already triggers a Holistic.Cleave.* standard (datatype=\"phone\" → Cleave.Phone, \"plzDE\" → Cleave.PLZ, \"dateDE\"/\"time\" → Cleave.Date/Time), do NOT apply the equivalent People CSS class:\n" +
          "      - Phone fields (datatype=\"phone\"): do NOT apply CodBi_People_Phone — Holistic.Cleave.Phone handles formatting.\n" +
          "      - Postal code fields (datatype=\"plzDE\"): do NOT apply CodBi_People_PLZ — Holistic.Cleave.PLZ handles formatting.\n" +
          "      - Date fields (datatype=\"dateDE\" or \"date\"): do NOT apply CodBi_People_18plus/16plus for formatting — Cleave handles it. Age restrictions may still be added if it is specifically a date-of-birth field.\n" +
          "   h) Street names and locality/city names have no dedicated People CSS class — leave them without a CSS class.\n" +
          "   i) REPEATABLE CONTAINERS — To make an XContainer or XContainerInvisible repeatable (add dynamic rows), set \"dynamic\":\"1\" in its properties. Also set \"dynamicMinSize\" (min rows, default 1), \"dynamicMaxSize\" (max rows, default 10), \"dynamicAddText\" (add button label), \"dynamicDeleteText\" (delete button label) as needed. Example: {\"className\":\"XContainer\",\"properties\":{\"name\":\"coAdressen\",\"dynamic\":\"1\",\"dynamicMinSize\":\"1\",\"dynamicMaxSize\":\"5\",\"elements\":[\"tfName\",\"tfEmail\"]}}\n" +
          "   j) Form.Navigator AUTO-GENERATES navigation buttons — CRITICAL: Create a SEPARATE XContainer (not applied to the page itself) for the navigation bar. Form.Navigator requires an HTMLDivElement (XContainer renders as a div) — do NOT put data-cb-func=form.navigator on XPage elements because XPage is not a div. Create an XContainer with name prefix 'coNav' (e.g. 'coNavBar'), add it to the top-level items array, and add its name to the first page's elements array. Set \"attributes\":[{\"text\":\"data-cb-func\",\"value\":\"form.navigator\"}] on the container. The container should be left empty (no child elements needed) — the Form.Navigator functionality creates the navigation buttons automatically at render time. The container will also be auto-selected to show/navigate the form pages. CRITICAL — Distinguish from XNavigationBar plugin: Use data-cb-func=form.navigator ONLY when the prompt mentions \"CodBi Navbar\" or \"CodBi Navigation\". When the prompt mentions \"XIMA Navigationsleiste\", \"XIMA navbar\", \"FORMCYCLE navbar\", \"Navigationsleiste\", \"Progress Bar\", \"FC-Navbar\", or \"formcycle navigation bar\", use className=\"XNavigationBar\" instead — do NOT use data-cb-func=form.navigator.\n" +
          "Example: {\"className\":\"XTextField\",\"properties\":{\"name\":\"tfVorname\",\"label\":\"Vorname\",\"cssclasses\":[\"CodBi_People_Name\"]}}.\n" +
          "Available CSS classes by standard configuration:\n\n" +
          "=== People (person-related fields) ===\n" +
          "   - CodBi_People_Name: For a person's name (Vorname, Nachname). Do NOT apply to street names or localities.\n" +
          "   - CodBi_People_Alphanumeric: ONLY for alphanumeric codes/IDs. Do NOT apply to names, streets, localities, or postal codes.\n" +
          "   - CodBi_People_Mail: For email addresses.\n" +
          "   - CodBi_People_Phone: For phone numbers.\n" +
          "   - CodBi_People_PLZ: For German postal codes. Use ALONE — do not combine with other People classes.\n" +
          "   - CodBi_People_18plus: For date-of-birth fields (min age 18).\n" +
          "   - CodBi_People_16plus: For date fields (min age 16).\n" +
          "   - CodBi_People_BuildingNumber: For building/house numbers.\n" +
          "   - CodBi_Fotocropper*: For photo cropper components (Board, Uploader, Update, ImageURL, Foto).\n" +
          "   - CodBi_OpenPLZ_Select_*: For OpenPLZ address select dropdowns.\n" +
          "=== Financial === CodBi_Currency (money)\n" +
          "=== Appointments === CodBi_NoFutureDate (no future dates), CodBi_DateFrame_N_Begin/End (date ranges, N=1-5), CodBi_TimeFrame_N_Begin/End (time ranges, N=1-5). When using CodBi_TimeFrame_* or CodBi_DateFrame_* classes, do NOT also add data-cb-func=time.frame or data-cb-func=date.frame — the CSS class already provides that behavior. You MAY still add data-cb-func for a DIFFERENT functionality on the same field (e.g. date.noweekends).\n" +
          "=== LDAP.Autofill === CodBi_LDAP_AC_* fields for LDAP autocomplete.\n" +
          "=== AI === AI_LLAMA_CHAT_Input (textarea), AI_LLAMA_CHAT_Send (button), AI_LLAMA_CHAT_Stop (button), AI_LLAMA_CHAT_Upload (upload field), AI_LLAMA_CHAT_Thinking (checkbox), AI_LLAMA_CHAT_Internet (checkbox), AI_LLAMA_CHAT_Location (checkbox), AI_LLAMA_CHAT_MailForward (checkbox), AI_LLAMA_CHAT_MailAddress (email text field), AI_LLAMA_CHAT_AlertOnFinish (checkbox), AI_LLAMA_STANDARD_QA_Question, AI_LLAMA_STANDARD_TXTQA_Question (FULL name — do NOT shorten to AI_LLAMA_TXTQA_Question), AI_LLAMA_TXTQA_Source, AI_LLAMA_QA_Exclude, AI_OCR_Receiver\n" +
          "SPECIALIST RULE — When the prompt mentions a specific specialist model (e.g. \"Verwende den Spezialisten XYZ\" or \"use the XYZ specialist\") AND an AI functionality (ai.llama.chat, ai.llama.standard.qa, ai.llama.standard.txtqa) is applied, add a data-cb-Specialist attribute to that functionality's element's attributes array with the specialist name as its value (e.g. {\"text\":\"data-cb-Specialist\",\"value\":\"XYZ\"}). If the prompt does NOT mention a specialist name, do NOT add the data-cb-Specialist attribute at all. This applies to all AI functionalities.\n" +
          "AI DOCUMENT QA — When the user asks to upload a document and answer specific questions about its content (e.g. \"Was ist der Betrag?\", \"Worum geht es hier?\", \"What is the amount?\", \"What is this about?\"), create an XUpload with data-cb-func=\"ai.llama.standard.qa\" and data-cb-MaxPixelSize=\"180000\" in its attributes. Then create one XTextField (or XTextArea for long answers) per question, each with cssclasses=[\"AI_LLAMA_STANDARD_QA_Question\"] and a data-cb-Question attribute in its attributes array whose value is the exact question text (e.g. {\"text\":\"data-cb-Question\",\"value\":\"Was ist der Betrag?\"}). The upload field and all question fields should be inside an XContainer or XFieldSet wrapper. CRITICAL: data-cb-func=\"ai.llama.standard.qa\" goes on the XUpload, NOT on the container or on the question fields.\n" +
          "AI TEXT QA (ai.llama.standard.txtqa) — When the user asks to show information about a person or entity based on text values entered in input fields (e.g. enter firstname and lastname → show relevant internet info about that person), apply data-cb-func=\"ai.llama.standard.txtqa\" on the FIRST source input field (the one whose value change triggers inference). Add data-cb-useinternet=\"true\" in its attributes if the prompt mentions internet/web/online search. All other source fields (e.g. lastname) get cssclasses=[\"AI_LLAMA_TXTQA_Source\"]. The response display field (XTextArea for longer answers) gets cssclasses=[\"AI_LLAMA_STANDARD_TXTQA_Question\"] and a data-cb-Question attribute whose value is the question inferred from the prompt. CRITICAL — The data-cb-Question value MUST include <[.FieldName]> placeholders (with leading dot) for ALL source fields whose values should be referenced. Example: if source fields are named \"tfVorname\" and \"tfNachname\", set data-cb-Question=\"Zeige alle relevanten Informationen zu <[.tfVorname]> <[.tfNachname]> im Internet.\". ALWAYS create the placeholder references with the dot prefix. CRITICAL — The field with data-cb-func=\"ai.llama.standard.txtqa\" must NOT have the AI_LLAMA_STANDARD_TXTQA_Question CSS class — that class belongs ONLY on the separate response display field. ALL form elements created for this functionality MUST be inside an XContainer or XFieldSet wrapper (create one if none exists). Do NOT generate workflow or automation — this is ONLY form structure generation.\n" +
          "   DYNAMIC PLACEHOLDERS in data-cb-Question — The question text may include <[.FieldName]> symbols that resolve to the current runtime value of another form field in the same container (XContainer or XFieldSet). Formcycle automatically assigns each element a CSS class matching its name, so the placeholder <[.tfXValue]> resolves to the value of the field named tfXValue. The dot prefix is REQUIRED — always use <[.fieldName]> format with a leading dot.\n" +
          "AI CHAT WIDGET — When the user asks for an AI chat / KI-Chat / chatbot, create: XContainer wrapper. XTextArea (chat display, ONLY element with data-cb-func=\"ai.llama.chat\", must have data-cb-MaxPixelSize=\"360000\" and data-cb-maxchatwindowheight=\"1200\" in attributes). User input: XTextArea (cssclasses=[\"AI_LLAMA_CHAT_Input\"]). Send: XButtonList with single button (cssclasses=[\"AI_LLAMA_CHAT_Send\"]). Stop: SEPARATE XButtonList with single button (cssclasses=[\"AI_LLAMA_CHAT_Stop\"]). Upload: XUpload (cssclasses=[\"AI_LLAMA_CHAT_Upload\"]). Four checkboxes: XCheckbox with cssclasses [\"AI_LLAMA_CHAT_Thinking\"], [\"AI_LLAMA_CHAT_Internet\"], [\"AI_LLAMA_CHAT_Location\"], [\"AI_LLAMA_CHAT_AlertOnFinish\"]. Mail Forwarding group: XContainer containing XCheckbox (cssclasses=[\"AI_LLAMA_CHAT_MailForward\"]) and XTextField (cssclasses=[\"AI_LLAMA_CHAT_MailAddress\"], datatype=\"email\"). On the MailAddress field, set hiddenif=\"<MailForwardCheckbox_ID>\" (set to the MailForward checkbox's id value, NOT a mode number), hiddenifcomp=0 and hiddenifclear=\"false\" so it is hidden when MailForward is unchecked and its value persists when shown again. CRITICAL: hiddenif, hiddenifcomp and hiddenifclear are DIRECT properties on the element — do NOT put them inside the attributes array. ALL elements MUST have their cssclasses array set.\n" +
          "=== UI.Panels === CodBi_HTML_Panel_Standard (default), CodBi_HTML_Panel_Flat, CodBi_HTML_Panel_Index, CodBi_HTML_Panel_Minimal for standalone panels; CodBi_Accordion_A/B/C/D for accordions. CodBi_HTML_Panel_NoCordion is a marker class for panels inside an accordion that should NOT participate in the accordion behavior.\n" +
          "CRITICAL — Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' property that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title. Therefore, for containers (XContainer, XContainerInvisible) that need to be a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader=\"true\" and a data-cb-autoheadertitle. If the user's prompt specifies a title, use that as the data-cb-autoheadertitle value; otherwise generate a descriptive title from the container's content (e.g. \"Geburtsdatum\" for a date-of-birth section, \"Anschrift\" for an address section). For nested panels use different CSS classes per level (e.g. outer on fieldset: CodBi_HTML_Panel_Standard, inner on fieldset: CodBi_HTML_Panel_Flat).\n" +
          "CRITICAL — \"Standard-Panel\" prompt: When the user asks for a \"standard panel\" or \"einfaches Panel\", create an XFieldSet with cssclasses=[\"CodBi_HTML_Panel_Standard\"] and a \"legend\" property set to \"Panel\" (or a descriptive title). Do NOT create an XContainer.\n" +
          "CRITICAL — Panel type mapping: Standard-Panel → CodBi_HTML_Panel_Standard. Flat Panel/flaches Panel → CodBi_HTML_Panel_Flat. Minimal Panel → CodBi_HTML_Panel_Minimal. Index Panel → CodBi_HTML_Panel_Index.\n" +
          "CRITICAL — COLLAPSIBLE XCONTAINERS: When the user asks for a collapsible/expandable/foldable container and it is an XContainer (div), use data-cb-func=html.panel via the attributes array. ALSO set data-cb-generateheader=\"true\" and data-cb-autoheadertitle for the title (from the prompt or auto-generated). For XFieldSet (fieldset), use the CSS class CodBi_HTML_Panel_Standard instead — the legend provides the title. Only add \"data-cb-folded\":\"true\" if the user explicitly wants the panel to start collapsed.\n" +
          "ACCORDION BEHAVIOR — When the user asks for multiple collapsible sections where only ONE should be open at a time (\"nur eines gleichzeitig aufgeklappt\", \"accordion\", \"nur einer offen\", \"nur einer sichtbar\"), create a wrapper XContainer around ALL the panels. Apply data-cb-func=\"html.panel.accordion\" and data-cb-Accordion=\"<uniqueGroupName>\" (e.g. \"group1\") to the wrapper. Each inner panel gets data-cb-func=\"html.panel\" via its own attributes array or the CodBi_HTML_Panel_Standard CSS class for fieldsets, with data-cb-generateheader=\"true\" and data-cb-autoheadertitle. CRITICAL — EVERY panel MUST explicitly set data-cb-folded in its attributes array. The first panel gets data-cb-folded=\"false\" (unfolded). All subsequent panels (2nd, 3rd, ...) get data-cb-folded=\"true\" (folded). This applies to BOTH CSS-class-based XFieldSet panels AND data-cb-func-based XContainer panels. Example wrapper: {\"className\":\"XContainer\",\"properties\":{\"name\":\"coAccordion\",\"elements\":[\"fsBereich1\",\"fsBereich2\",\"fsBereich3\"],\"attributes\":[{\"text\":\"data-cb-func\",\"value\":\"html.panel.accordion\"},{\"text\":\"data-cb-Accordion\",\"value\":\"group1\"}]}}. Example unfolded first panel (data-cb-folded=\"false\"): {\"className\":\"XFieldSet\",\"properties\":{\"name\":\"fsBereich1\",\"legend\":\"Bereich 1\",\"cssclasses\":[\"CodBi_HTML_Panel_Standard\"],\"elements\":[\"tfEingabe1\"],\"attributes\":[{\"text\":\"data-cb-folded\",\"value\":\"false\"}]}}. Example folded second panel (data-cb-folded=\"true\"): {\"className\":\"XFieldSet\",\"properties\":{\"name\":\"fsBereich2\",\"legend\":\"Bereich 2\",\"cssclasses\":[\"CodBi_HTML_Panel_Standard\"],\"elements\":[\"tfEingabe2\"],\"attributes\":[{\"text\":\"data-cb-folded\",\"value\":\"true\"]}}.\n" +
          "=== Print.Removal === CodBi_Print_Remove_Tagged / Parent / PrintOnly.\n" +
          "=== BayVIS === CodBi_BayVIS_Behoerde / BehoerdeUndAnsprechpartner / Ansprechpartner / Auswahl_Behoerden.\n" +
          "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_PLZ / Locality / Street / BuildingNumber.\n" +
          "=== Holistic === CodBi_XCL_Speech, CodBi_XCL_Speech_Whisper.\n" +
          "When the instruction asks for a specific field type that matches a CSS class description above, " +
          "add the corresponding CSS class(es) following the rules above. " +
          "REMINDER: CSS classes ONLY exist for the domains listed above. For everything else, use data-cb-func. Never invent CSS class names.\n\n" +
          "CRITICAL — AI.LLAMA.STD.QA: This EP queries an AI to answer a question. USE for weather/AI/knowledge queries. Param[1]=question, Param[2]=UseInternet (\"true\"). CRITICAL: trailing semicolons for unused params. Example: \"{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }\".\n" +
          "EP CHAINING — Element Placeholders (EPs) can be chained with > syntax to pass one EP's result as input to another EP. This works in ANY data-cb-* parameter that accepts EPs (e.g. data-cb-Data, data-cb-replacement, data-cb-Values, data-cb-replacements). Example: \"{ BayVIS.Ansprechpartner.Details > { V > VariableName } }\" first resolves V to get an ID, then fetches the contact details. The inner EP is always resolved first and its result becomes the parameter for the outer EP.\n" +
          "Date.Today already supports arithmetic directly — do NOT wrap it in Date.Arithmetic. Use \"{ Date.Today > +1d }\" for tomorrow, \"{ Date.Today > -1d }\" for yesterday. Arithmetic: +N d/m/y (add), -N d/m/y (subtract).\n" +
          "Date.FromString turns a date string into a Date object. Use Date.FromString for any prompt about converting/parsing a date string. Example: \"{ Date.FromString > 01.12.1978 }\" returns a Date object for December 1st, 1978. Optional second param sets the format.\n" +
          "JSON.Path extracts a property from an object using a dotted path. It can also call methods by using the method name with parentheses as the path (e.g. \"toString()\"). Example: \"{ JSON.Path > { Date.FromString > 01.12.1978 } ; toString() }\" creates a Date and calls toString() on it.\n" +
          "CRITICAL — BayVIS Detail EPs expect NUMERIC IDs, not names: BayVIS.Behoerden.Details, BayVIS.Behoerden.Details.Gebaeude, BayVIS.Behoerden.Gebaeude.ID, BayVIS.Ansprechpartner.Details all take numeric IDs. The ID-resolver EPs take plain STRING names: BayVIS.Behoerden.ID (authority name like \"Amt für Digitales\"), BayVIS.Ansprechpartner.ID (contact name like \"Salvatore Callari\"). The directory EPs REQUIRE a property name parameter: BayVIS.Behoerden > bezeichnung (not bare { BayVIS.Behoerden }), BayVIS.Ansprechpartner > nachname (not bare { BayVIS.Ansprechpartner }). BayVIS.Behoerden valid property values: behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge. BayVIS.Ansprechpartner valid property values: anrede, vorname, nachname, funktion, stellenbezeichnung, email, website, zimmer, sortierreihenfolge, behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId.\n" +
          "CRITICAL — BayVIS.Behoerden.Details.Gebaeude takes TWO numeric parameters: param 1 = authority ID, param 2 = building ID. To look up building details by authority name, chain BOTH IDs: \"{ BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > Amt für Digitales } ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > Amt für Digitales } } }\" — first param resolves the authority name to its numeric ID, second param resolves the building ID for that authority. BayVIS.Behoerden.Details returns authority METADATA (name, email, type), NOT building addresses. For BUILDING details (street, PLZ, city) use BayVIS.Behoerden.Details.Gebaeude.\n" +
          "CRITICAL — BayVIS.Behoerden.Details also accepts an OPTIONAL second parameter: a property name to extract just that specific field. When the prompt asks for a particular property (e.g. \"Bezeichnung\", \"email\", \"behoerdenart\"), add it as the second parameter: \"{ BayVIS.Behoerden.Details > { BayVIS.Behoerden.ID > Amt für Digitales } ; bezeichnung }\" returns only the authority's designation. Valid property values: bezeichnungBehoerde, behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge, logo, behoerdeZuordnungen, behoerdenGebaeudeZuordnungen. Without this second param, ALL details are returned.\n" +
          "CRITICAL — F (Find) EP must be the OUTERMOST EP when filtering an array by exact property value. Correct: \"{ F > postalCode ; 91522 ; { sorted > { unique > { openplz.localities > de ; ^a.* }; name }; name } }\". WRONG: \"{ Sorted > { F > ... } }\" or \"{ JSON.Path > { F > ... } }\". Do NOT wrap F in JSON.Path — F must be outermost.\n" +
          "EP NAME ACCURACY: Use EXACT registered EP names with dots: JSON.Path (NOT \"JSON Path\"), OpenPLZ.Localities, OpenPLZ.Streets, LDAP.Find (NOT \"Ldap.Find\").\n" +
          "CRITICAL — EP parameter values are raw strings without quotes. Write { BayVIS.Ansprechpartner.ID > Salvatore Callari } NOT { BayVIS.Ansprechpartner.ID > \"Salvatore Callari\" }. Quotes are part of the EP syntax itself (the { } braces), do NOT add extra quotes around parameter values.\n" +
          "CRITICAL — ALL OpenPLZ EPs (OpenPLZ, OpenPLZ.Streets, OpenPLZ.Localities, OpenPLZ.OrganizationalUnits, OpenPLZ.TextSearch) return Array<object> with properties like \"name\", \"officialKey\", \"type\", \"postalCode\", \"locality\". To extract a specific property (e.g. street names), wrap the EP in JSON.Path: \"{ JSON.Path > { OpenPLZ.Streets > de ; Karolinen ; 91522 } ; name }\". If the prompt asks for names only and duplicates may occur, deduplicate with Unique: \"{ Unique > { OpenPLZ.Streets > de ; Karolinen ; 91522 } ; name }\". Never generate bare \"{ OpenPLZ.Streets > de ; Karolinen ; 91522 }\" when the prompt asks for a specific property — MUST wrap in JSON.Path.\n" +
          "Data.Join merges the properties of multiple EP results into one object. Use Data.Join when the prompt asks to combine/join/merge/zusammen data from multiple EPs. Example: \"{ Data.Join > { BayVIS.Behoerden.Details > { BayVIS.Behoerden.ID > Amt für Digitales } ; bezeichnung } ; { BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > Amt für Digitales } ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > Amt für Digitales } } } }\" joins the authority designation with its building details into one combined object.\n\n" +
          "CODBI CANDIDATE REVIEW — while designing the form output, scan the CODBI CORE ELEMENTS (COMPACT) list at the end of this prompt. " +
          "CRITICAL — Sys.Log.Console is a STANDALONE functionality that does NOT need any existing form element. When the prompt asks to output/print/log/show anything to the browser console (URL content, CSV data, BayVIS data, global variables, DOM elements / form elements, etc.), ALWAYS include Sys.Log.Console in the considered/applied arrays even if no existing form element matches. The server will create the necessary XContainerInvisible in the application pass.\n" +
          "For each listed element, use your judgment to decide if a functionality is useful for a field or if it applies standalone (no field needed). Consider BOTH whether it could benefit AND whether it would be inappropriate (e.g. Date.NoWeekends makes sense for job appointments but NOT for birthdays). Only mark candidates that are genuinely appropriate. " +
          "Examples: a begin/end time pair → Time.Frame; a begin/end date pair → Date.Frame; text field needing format validation → HTML.Input.REGEX; German address flow → OpenPLZ.Autocomplete; container/navigation bar → Form.Navigator; input auto-capitalize words → HTML.Input.Trans.Capital; set CSS property on element → HTML.SETAttribute (Name=\"style\" ToSet=CSS value). JSON.SET fallback only on explicit user request. console output / in der Konsole ausgeben / debug logging → Sys.Log.Console. Create an XContainerInvisible (name prefix div) at the top of the first page's elements array, set data-cb-func=\"Sys.Log.Console\" and data-cb-Data to what to log (can use EPs like \"{ Date.Weekends > 01.01.2000 ; 31.12.2002 }\" for weekend dates, or \"{ Net.URL > http://... }\" to fetch and log URL content, or \"{ Data.CSV > { Net.URL > http://... } }\" only when the prompt explicitly mentions CSV, or \"{ Net.URL > { V > VariableName } }\" / \"{ Data.CSV > { Net.URL > { V > VariableName } } }\" for dynamic URLs from a variable — only wrap in Data.CSV if CSV is explicitly mentioned). For global variables use the V EP: \"{ V > VariableName }\" (e.g. \"{ V > BayVIS_WeitereAnsprechpartner }\"). When a user in any language asks to output/print/log/show a form element or DOM element to the browser console (e.g. \"Gib das Formular-Element .p1 in der Konsole aus\"), use the DOM.Query EP in data-cb-Data: \"{ DOM.Query > .p1 }\" — the CSS selector from the prompt (dot-prefixed class name) is the parameter passed to DOM.Query. Do NOT set data-cb-value. If the prompt additionally specifies an index (e.g. \"Element in Index 0\", \"first element\", \"zweites Element\", \"das 3. Element\"), wrap the DOM.Query in the I EP: \"{ I > 0 ; { DOM.Query > .p1 } }\" — the I EP takes the 0-based index as its first parameter and the DOM EP result as its second parameter. When a user in any language asks to output/print/log/show a global variable's value to the browser console → Sys.Log.Console with the V EP. When a user asks to list/retrieve BayVIS data directly (e.g. all contacts, all last names) without referencing a specific variable name, use the BayVIS EP directly: { BayVIS.Ansprechpartner > property } (e.g. { BayVIS.Ansprechpartner > nachname } for all last names). Do NOT use the V EP for BayVIS directory lookups — V is only for accessing named global variables like BayVIS_WeitereAnsprechpartner. EP CHAINING — EPs can be chained with > syntax to pass one EP's result into another. When the user asks to log details from a data EP (BayVIS.Ansprechpartner.Details, BayVIS.Behoerden.Details, etc.) that requires IDs stored in a global variable, chain them: \"{ DataEP > { V > VariableName } }\" (e.g. \"{ BayVIS.Ansprechpartner.Details > { V > BayVIS_WeitereAnsprechpartner } }\" for contact details). This keeps the functionality accessible in the designer. Do NOT create a workflow for this. Matomo tracking aktivieren / activate tracking → standard configuration activation, NOT a workflow. LDAP container → LDAP.Autocomplete.Set on the CONTAINER (XFieldSet/XContainer), LDAP.Autocomplete on each individual field inside it. Without SiteID: include ONLY \"Holistic.Matomo.Tracking\" in _codbiApplicability.applied (not \"Matomo.Tracking\" anywhere) (as {\"id\":\"Holistic.Matomo.Tracking\",\"targets\":[]}). With SiteID: apply Matomo.Tracking functionality on the form header with data-cb-SiteID and data-cb-URL. wenn...dann... / if...then... conditions → OnChange.Conditional on the trigger field. Reference=\"{ Date.Today > -18y }\" for age rules. Mode options: GT=Greater Than, GTEQ=Greater Than or Equal, LT=Lower Than, LTEQ=Lower Than or Equal, EQ=Equal, NEQ=Not Equal. LOGIC: GT means candidate date is LATER/MORE RECENT than reference (date less than 18y in past → GT). LT means candidate date is EARLIER (date more than 18y in past → LT). Target=dot-prefixed container CSS selector. Candidate=dot-prefixed field selector. DateFormat=DD.MM.YYYY for dateDE. _T_* parameters apply functionality to Target when TRUE: _T_FUNC (any functionality ID), _T_Name, _T_ToSet, etc. _F_* similar for FALSE. Show/hide example: _T_FUNC=HTML.SETAttribute _T_Name=style _T_ToSet=\"width:100%;display:block;\" _F_ToSet=\"width:100%;display:none;\". EDGE CASE: when OnChange.Conditional must show/hide a single field, wrap that field in an XContainer and target the container instead. CRITICAL: Date.Min forbids selecting past dates (input validation). OnChange.Conditional applies a functionality to a target based on a condition. WENN...DANN... anzeigen/ausblenden → use OnChange.Conditional, NOT Date.Min, NOT CodBi_People_18plus. Image cropper → Media.Image.Cropper on the prompted container. Generate SIBLINGS: CodBi_Fotocropper_Board div (height:25em), CodBi_Fotocropper_Uploader input, CodBi_Fotocropper_Update button, CodBi_Fotocropper_ImageURL input (right of button), CodBi_Fotocropper_Foto img. Board contains NO other elements. Element unsichtbar im Druck / hidden when printing → add CSS class \"CodBi_Print_Remove_Tagged\" to the element's cssclasses array. print parent (including label) → add CSS class \"CodBi_Print_Remove_Parent\". Nur im Druck sichtbar / only visible when printing → add CSS class \"CodBi_Print_Remove_PrintOnly\". " +
          "Any prompt asking to \"replace placeholders\" or \"fill in\" dynamic content from an EP (like \"{ Data.CSV > { Net.URL > ... }}\") into an element → HTML.Text.Injector on the target element. Set data-cb-replacement to the EP expression AS-IS (do NOT resolve it), data-cb-placeholder to the placeholder string verbatim (copy it character-for-character from the element's content — e.g. \"<<PH>>\", \"[[PH]]\", \"##VALUE##\", \"{{name}}\", whatever it literally is). CRITICAL: do NOT change the brackets or formatting; if the text has \"[[PH]]\" set \"[[PH]]\", not \"[%PH%]\". data-cb-property=\"innerHTML\". Keep the element's rtevalue unchanged. " +
          "Do NOT apply any CodBi functionality to elements in this pass (no data-cb-func, no CSS classes) — just note which ones look relevant in the \"considered\" array. " +
          "EXCEPTION — Standard configuration activation: if the prompt requests Matomo tracking " +
          "WITHOUT a SiteID, you MUST include {\"id\":\"Holistic.Matomo.Tracking\",\"targets\":[]} " +
          "in the \"applied\" array (this is not a functionality being applied — it is a standard configuration " +
          "name that the server reads and activates). No other entries go in \"applied\" in this pass.\n" +
          "Return the form JSON normally. Include a top-level \"_codbiApplicability\" field with these exact keys: " +
          "{\"formElementsProcessed\":4,\"codbiElementsEvaluated\":23 (replace 4 with actual field count; replace 23 with how many CODBI CORE ELEMENTS list entries you read)," +
          "\"considered\":[{\"id\":\"CodBi.ID\",\"targets\":[\"formElementId\", ...]}] (CodBi functionality IDs with the form element ids they could apply to)," +
          "\"applied\":[{\"id\":\"Holistic.Matomo.Tracking\",\"targets\":[]}] (standard configuration names ONLY — see exception above — leave empty otherwise)," +
          "\"skipped\":[]}. " +
          "The server will handle functionality application in a second pass if candidates are found. This metadata field is removed server-side before the form is applied." +
          "\n" +
          "CRITICAL — HTML.Select.Favorites: When applying this functionality you MUST also add a data-cb-initialElement attribute " +
          "to the XSelect's attributes array. Set its value to the value property (NOT the display text) of the FIRST option. " +
          "This prevents the divider from being unintentionally selected. " +
          "Example: the first option is {\"text\":\"Bayern\",\"value\":\"Bayern\"} → add {\"text\":\"data-cb-initialElement\",\"value\":\"Bayern\"} to the attributes array. " +
          "Do NOT skip this — the runtime requires it to select the correct default option.\n" +
          "\n" +
          CodbiCapabilities.buildSection()

  private data class CodbiDetailsSignal(
      val elements: List<String>,
      val applicabilityReport: String?
  )

  private fun extractCodbiDetailsRequest(cleanedJson: String): CodbiDetailsSignal? {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any>
      if ((obj?.get("status") as? String) != "need_codbi_details") {
        return null
      }
      val arr = obj["elements"] as? List<*> ?: return CodbiDetailsSignal(emptyList(), null)
      val elements = arr.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
      val report = obj["codbiApplicability"]?.let { gson.toJson(it) }
      CodbiDetailsSignal(elements = elements, applicabilityReport = report)
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Normalizes "Matomo.Tracking" → "Holistic.Matomo.Tracking" in the raw JSON string's
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
   * it with parameters — leave it untouched.
   */
  @Suppress("UNCHECKED_CAST")
  private fun normalizeMatomoTrackingInReport(reportValue: Any) {
    val report = reportValue as? MutableMap<String, Any> ?: return
    val applied = report["applied"] as? MutableList<*> ?: return

    // If Matomo.Tracking is already in "applied", the AI applied it successfully — don't touch
    val hasMatomoInApplied =
        applied.any { entry -> (entry as? Map<*, *>)?.get("id") == "Matomo.Tracking" }
    if (hasMatomoInApplied) return

    // Matomo.Tracking was NOT applied — it's only in considered/skipped due to missing params.
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
          // Attributes — stripped to prevent stale data-cb-* entries from surviving when items
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
          // Number formatting — display-only, ~15 fields per XTextField; AI doesn't need them,
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
          // Input constraints — AI creates fields from templates; defaults are fine for new items.
          "maxlength",
          "minlength",
          "mask",
          "autocomplete",
          "datepicker",
          "unitwidth",
          // Layout — AI uses item templates which have FORMCYCLE defaults.
          "labeldir",
          "labelwidth",
          "flex",
          "height",
          // Dynamic/repeatable — visible to AI so it can create repeatable containers.
          // AI can set dynamic=1 with
          // dynamicMinSize/MaxSize/AddText/DeleteText/HideButtons/Trigger.
          // Conditional visibility/readonly — AI doesn't generate these; restored for originals.
          "readonlyifclear",
          "readonlyifmode",
          "readonlyifcomp",
          "requiredifcomp",
          "hiddenifclear",
          "hiddenifcomp",
          // Workflow-status / user-group visibility — stripped from slim JSON so the AI starts
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
            "[AICodBiAssistant] AI used unknown className '{}' — item will not render correctly",
            className)
      }
    }
  }

  private fun slimPersistJson(json: String): String {
    val root = JsonParser.parseString(json).asJsonObject
    for (field in STRIPPED_FIELDS) root.remove(field)
    // Remove XFooter — structural chrome the AI must not see or modify; restored automatically
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

  private fun restoreStrippedFields(aiResult: String, original: String): String {
    val aiObj = JsonParser.parseString(aiResult).asJsonObject
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
          // New item created by AI — validate and preserve workflow-visibility props, then
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
              val origAction = origActionByName[bName] ?: continue // new button — keep AI action
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
        // Build a name→index map so we can find each orphan's position in the array.
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
    // invented (e.g. "CodBi_NavigationBar") — only classes matching known prefixes from
    // CSS_CLASS_TO_STANDARD are allowed. Non-matching classes are removed with a warning.
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
          // Decode common Unicode escapes that some AI models produce (e.g. \u003e → >)
          value = decodeUnicodeEscapes(value)
          val attrObj = JsonObject()
          attrObj.addProperty("text", key)
          attrObj.addProperty("value", value)
          cleanAttrs.add(attrObj)
        }
        props.remove(key)
      }
    }
    // Normalize AI Chat MailAddress hiddenif values — the AI often generates
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
                "[AICodBiAssistant] Normalized hiddenif on '{}': '{}' → '{}'",
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
                "[AICodBiAssistant] Normalized hiddenifcomp on '{}': '{}' → 0",
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
                "[AICodBiAssistant] Normalized hiddenifclear on '{}': '{}' → 'false'",
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
      /* non-critical — skip normalization on error */
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
   * @return Map of config name → `true` (should be active) / `false` (should not be active).
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
      /* malformed JSON — all conditions stay false */
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
      /* malformed JSON — no standards from CSS classes */
    }
    return needed
  }

  /**
   * Computes the updated set of active CodBi standard configurations after a form modification.
   *
   * Two independent mechanisms are combined:
   * 1. **Holistic.Cleave.* auto-management** — activated/deactivated based on field datatypes
   *    present in the form (dates → Cleave.Date, phone → Cleave.Phone, etc.).
   * 2. **CSS-class-based auto-activation** — standards are activated when the AI placed a matching
   *    CSS class (e.g. `CodBi_People_Name`) on any form element. This ensures the standard
   *    configuration is active so its JavaScript runs at render time.
   *
   * For each Holistic.Cleave.* config the decision is:
   * - If the current active state **matches** what [aiSetStandards] records as the AI's last set
   *   value (or [aiSetStandards] is `null` = first AI run) → AI is in control → update to match the
   *   field types present in [modifiedFormJson].
   * - If the current active state **differs** from [aiSetStandards] → the user manually overrode it
   *   since the last AI run → leave it unchanged.
   *
   * Non-Cleave configurations are never removed automatically — they are only added when CSS
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
    return try {
      // --- Mechanism 1: Holistic.Cleave.* auto-management ---
      // When aiSetStandards is null (first AI run this session), AI is in control of ALL
      // Cleave configs — apply the new conditions unconditionally regardless of current state.
      if (aiSetStandards == null) {
        val after = computeCleaveConditions(modifiedFormJson)
        for ((config, shouldBeAfter) in after) {
          if (shouldBeAfter && config !in active) active.add(config)
          else if (!shouldBeAfter && config in active) active.remove(config)
        }
      } else {
        val aiSet = aiSetStandards.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()
        val after = computeCleaveConditions(modifiedFormJson)
        for ((config, shouldBeAfter) in after) {
          val wasAiOn = config in aiSet
          val isActive = config in active
          // Same state as AI last set → AI is still in control → apply the new condition.
          // Different state → user overrode it since the last AI run → respect their choice.
          if (wasAiOn == isActive) {
            if (shouldBeAfter && !isActive) active.add(config)
            else if (!shouldBeAfter && isActive) active.remove(config)
          }
        }
      }
      // --- Mechanism 2: CSS-class-based auto-activation ---
      // Scan all items for cssclasses and activate the corresponding standards.
      // Non-Cleave standards are never removed — only added when CSS class usage is detected.
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
      // array.
      if (!applicabilityReport.isNullOrBlank()) {
        try {
          val reportObj = JsonParser.parseString(applicabilityReport).asJsonObject
          val appliedArr = reportObj.getAsJsonArray("applied")
          if (appliedArr != null) {
            for (entry in appliedArr) {
              if (!entry.isJsonObject) continue
              val id = entry.asJsonObject.get("id")?.asString ?: continue
              if (id.startsWith("Holistic.") && id !in active) {
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
    val systemPrompt =
        buildWorkflowSystemPrompt(
            formElements, htmlTemplatesJson, completionPagesJson, workflowStatesJson)

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }

    logger.info(
        "[AICodBiAssistant] Workflow AI request messages (model={}): {}", modelId, messagesJson)
    val rawResponse = instance.performFormAssist(modelId, messagesJson)
    val cleaned = extractJson(stripThinkTags(rawResponse))
    logger.info("[AICodBiAssistant] Workflow AI raw response: {}", cleaned)

    // Parse the AI response: either a single task object or an array of task objects
    val taskSpecs: List<WorkflowTaskSpec> =
        try {
          if (cleaned.trimStart().startsWith("[")) {
            // Array of task specs
            val arr = gson.fromJson(cleaned, Array<WorkflowTaskSpec>::class.java)
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
            val spec = gson.fromJson(cleaned, WorkflowTaskSpec::class.java)
            logger.info(
                "[AICodBiAssistant] Workflow task spec: nodeType={}, nodeParams keys={}",
                spec.nodeType,
                spec.nodeParams.keys)
            listOf(spec)
          }
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] Could not parse workflow AI response: {}", cleaned)
          throw Exception("AI returned invalid workflow JSON: ${e.message}")
        }

    val results = taskSpecs.map { spec -> createWorkflowTask(workflowVersionId, spec, params) }
    val combinedResult = results.joinToString(" | ")
    logger.info(
        "[AICodBiAssistant] Workflow created: {} task(s) — {}", results.size, combinedResult)
    return combinedResult
  }

  /**
   * Builds the system prompt for the workflow-creation AI call. When [formContext] is provided, it
   * is embedded so the AI can match field/button names. When [completionPages] is provided, it
   * lists available Abschlussseiten (completion pages) that the AI can select for FC_DOI_INIT
   * failure pages. When [htmlTemplates] is provided, it lists available HTML templates that the AI
   * can select for FC_SHOW_TEMPLATE node creation. Unlike [AIWorkflowAssistant.buildSystemPrompt],
   * there is no phase-1 "signal needed" section: the frontend always supplies form elements before
   * calling this.
   */
  private fun buildWorkflowSystemPrompt(
      formContext: String?,
      htmlTemplates: String? = null,
      completionPages: String? = null,
      workflowStates: String? = null
  ): String = buildString {
    append(
        "You are a FORMCYCLE workflow assistant. The user will describe a desired workflow " +
            "action in natural language. Your ONLY output must be a single JSON object that " +
            "describes the workflow task to create. No explanation, no markdown, no code fences.\n\n")
    append(
        "Output format: Output EITHER a single JSON object (for ONE workflow lane) OR an array of JSON objects (for MULTIPLE lanes).\n" +
            "  Single lane: {\"taskName\":\"...\", \"taskDescription\":\"...\", \"triggerType\":\"...\", \"triggerParams\":{}, \"nodeType\":\"...\", \"nodeParams\":{}}\n" +
            "  Multiple lanes: [{\"taskName\":\"...\", ...}, {\"taskName\":\"...\", ...}]\n" +
            "  Each object has exactly these keys: taskName, taskDescription, triggerType, triggerParams, nodeType, nodeParams, endpointState.\n" +
            "  CRITICAL — taskName is MANDATORY for EVERY node type. You MUST always set a short, meaningful AND SPECIFIC description " +
            "of the workflow action. No exceptions. Never leave taskName empty or use generic names like \"AI-generated task\".\n" +
            "  Include key details like the target URL (without http://), template name, parameter names/values, email subject, " +
            "file name, file content, or HTTP endpoint.\n" +
            "  EXAMPLES per node type:\n" +
            "    FC_REDIRECT:       \"Redirect to msn de with parameter F2 equals YOLO\" (NOT generic like \"Redirect on submit with parameter\")\n" +
            "    FC_SHOW_TEMPLATE:   \"Show Allgemeiner Fehler 2 completion page\"\n" +
            "    FC_EMAIL:           \"Send DOI email with subject Welcome\"\n" +
            "    FC_RETURN_FILE:     \"Download xoxo txt on submit\" (NOT \"File download\")\n" +
            "    FC_CREATE_TEXT_FILE: \"Create YOLO content text file on submit\" (NOT \"Create file\")\n" +
            "    FC_POST_REQUEST:    \"Send data to example com api\" (NOT \"HTTP request\")\n" +
            "    FC_CHANGE_STATE:    \"Set status to Approved\" (NOT \"Status change\")\n" +
            "    FC_LOG_ENTRY:       \"Log submission to process log\"\n" +
            "  The pattern is always: action + key details. Apply this to ANY nodeType, not just those listed.\n" +
            "  taskName CHARACTER RESTRICTIONS — only the following characters are allowed: letters (a-z, A-Z), numbers (0-9), spaces, hyphens (-), underscores (_), and parentheses (). " +
            "Characters like dots (.), equals signs (=), slashes (/), colons (:), question marks (?), ampersands (&), and all other special characters are FORBIDDEN in taskName. " +
            "If the user's prompt contains such characters, replace them with allowed alternatives (e.g. \"msn.de\" → \"msn de\", \"F2=YOLO\" → \"F2 equals YOLO\", \"http://...\" → omit the protocol).\n" +
            "  CRITICAL — Use an array ONLY when the user's request describes MULTIPLE INDEPENDENT workflows triggered by DIFFERENT events.\n" +
            "  Example of when to use an array: \"Send a DOI invitation when the form is submitted, then send a welcome email after the email is confirmed.\"\n" +
            "    → Lane 1: FC_FORM_SUBMIT_BUTTON → FC_DOI_INIT, Lane 2: FC_DOI_VERIFIED → FC_EMAIL\n" +
            "  CHAINED NODES (\"chainedNodes\" field) — For sequential actions where the second action processes the first action's output (e.g. decode Base64 then download the result), add a \"chainedNodes\" array inside a single task spec. Each entry has \"nodeType\" and \"nodeParams\". Use \"%prev%\" to reference the preceding node's UUID.\n" +
            "  CRITICAL — Do NOT use an array for setting a form record status. The status transition (\"endpointState\") is automatically\n\n")
    append(
        "TRIGGER TYPES (use exactly one of these string values for 'triggerType'):\n" +
            "  - \"FC_FORM_SUBMIT_BUTTON\" — fires when a submit button is clicked;\n" +
            "    triggerParams: {\"buttonName\":\"<technical name>\"} or {} for any button\n" +
            "  - \"FC_QUALIFIED_FORM_SUBMIT_BUTTON\" — fires when a qualified (electronic signature) submit button is clicked;\n" +
            "    triggerParams: {\"buttonName\":\"<name>\",\"qualifier\":\"<qualifier>\"}\n" +
            "  - \"FC_MANUAL\" — manual invocation (user triggered);\n" +
            "    triggerParams: {} (allowed states/groups configured in the FC designer)\n" +
            "  - \"FC_STATE_TIMER\" — fires AFTER A TIME DELAY once a record enters a specific state;\n" +
            "    THIS IS A TIME-BASED TRIGGER. It does NOT fire immediately on state change — it waits for the configured duration.\n" +
            "    CRITICAL — You MUST set 'applicableStateNames' to the state(s) to watch. Without this, the trigger has no states selected and will never fire.\n" +
            "    triggerParams: {\"applicableStateNames\":[\"StateName1\",\"StateName2\"],\"durationDays\":<N>,\"durationHours\":<N>,\"durationMinutes\":<N>}\n" +
            "    Example: \"2 Stunden nach Statusänderung auf 'Abgesendet'\" → {\"applicableStateNames\":[\"Abgesendet\"],\"durationDays\":0,\"durationHours\":2,\"durationMinutes\":0}\n" +
            "  - \"FC_TIME_POINT\" — fires at a specific date/time. Has TWO modes:\n" +
            "    Mode 1 — FIXED: fires at a fixed calendar date/time.\n" +
            "      CRITICAL — fixedDateTime MUST include both the date AND time in ISO-8601 format WITH timezone offset (e.g. \"2026-07-02T08:48:00+02:00\").\n" +
            "      If the user specifies only a time (e.g. \"um 08:48 Uhr\"), use TODAY's date and the Europe/Berlin timezone.\n" +
            "      CRITICAL — Do NOT omit the date. Do NOT omit the timezone.\n" +
            "      triggerParams: {\"timePointType\":\"FIXED\",\"fixedDateTime\":\"<ISO-8601 with offset>\",\"fireWhenInPast\":<true|false>}\n" +
            "    Mode 2 — EXPRESSION_WITH_FORMAT: fires at a date/time computed from a form field value, optionally with an offset.\n" +
            "      Use this when the user says \"X days|hours|weeks|months|years after field Y\", \"one day after the date in Start\", \"zwei Wochen nach Start\", etc.\n" +
            "      The dateTimeTemplate uses [%technicalId%] to reference a form field. The dateTimeFormat is a Java DateTimeFormatter pattern matching the field's date format (typically \"dd.MM.yyyy\" for German date fields).\n" +
            "      triggerParams: {\"timePointType\":\"EXPRESSION_WITH_FORMAT\",\"dateTimeTemplate\":\"[%technicalId%]\",\"dateTimeFormat\":\"<pattern>\",\"operation\":\"PLUS|MINUS\",\"offsetDuration\":\"<number>\",\"durationUnit\":\"DAYS|HOURS|MINUTES|SECONDS|WEEKS|MONTHS|YEARS\",\"fireWhenInPast\":<true|false>}\n" +
            "      CRITICAL — Map German time units EXACTLY to durationUnit:\n" +
            "        \"Sekunde\" / \"Sekunden\" → SECONDS\n" +
            "        \"Minute\" / \"Minuten\"   → MINUTES\n" +
            "        \"Stunde\" / \"Stunden\"   → HOURS\n" +
            "        \"Tag\" / \"Tage\"         → DAYS\n" +
            "        \"Woche\" / \"Wochen\"     → WEEKS\n" +
            "        \"Monat\" / \"Monate\"     → MONTHS\n" +
            "        \"Jahr\" / \"Jahre\"       → YEARS\n" +
            "      Examples:\n" +
            "        \"Ein Tag nach Start\"        → {\"timePointType\":\"EXPRESSION_WITH_FORMAT\",\"dateTimeTemplate\":\"[%tfStart%]\",\"dateTimeFormat\":\"dd.MM.yyyy\",\"operation\":\"PLUS\",\"offsetDuration\":\"1\",\"durationUnit\":\"DAYS\",\"fireWhenInPast\":false}\n" +
            "        \"Zwei Wochen nach Start\"    → {\"timePointType\":\"EXPRESSION_WITH_FORMAT\",\"dateTimeTemplate\":\"[%tfStart%]\",\"dateTimeFormat\":\"dd.MM.yyyy\",\"operation\":\"PLUS\",\"offsetDuration\":\"2\",\"durationUnit\":\"WEEKS\",\"fireWhenInPast\":false}\n" +
            "        \"3 Monate nach Geburtsdatum\" → {\"timePointType\":\"EXPRESSION_WITH_FORMAT\",\"dateTimeTemplate\":\"[%tfGeburtsdatum%]\",\"dateTimeFormat\":\"dd.MM.yyyy\",\"operation\":\"PLUS\",\"offsetDuration\":\"3\",\"durationUnit\":\"MONTHS\",\"fireWhenInPast\":false}\n" +
            "        \"2 Stunden nach Start\"      → {\"timePointType\":\"EXPRESSION_WITH_FORMAT\",\"dateTimeTemplate\":\"[%tfStart%]\",\"dateTimeFormat\":\"dd.MM.yyyy HH:mm\",\"operation\":\"PLUS\",\"offsetDuration\":\"2\",\"durationUnit\":\"HOURS\",\"fireWhenInPast\":false}\n" +
            "    IMPORTANT — For date-based triggers from form field values, use FC_TIME_POINT (Mode 2). Do NOT use FC_STATE_TIMER.\n" +
            "    FC_STATE_TIMER is ONLY for time delays AFTER a record enters a specific workflow state.\n" +
            "  - \"FC_FORM_RECORD_MESSAGE_POSTED\" — fires when an internal message is posted to the record;\n" +
            "    triggerParams: {\"senderContext\":[\"INTERNAL\",\"EXTERNAL\"]} (optional filter)\n" +
            "  - \"FC_FORM_RECORD_MESSAGE_UPLOAD_REQUEST_FULFILLED\" — fires when a file upload request submitted via internal message is fulfilled;\n" +
            "    triggerParams: {}\n" +
            "  - \"FC_CATCH_ERROR\" — fires when an error occurs in another workflow lane;\n" +
            "    The 'Limit to certain error' property category has these configurable filters (all optional):\n" +
            "      - \"Action Name\" (nodeName) — filter by the name of the specific action/node instance that raised the error\n" +
            "      - \"Action Name match type\" (nodeNameMatchType) — \"EXACT\"|\"CONTAINS\"|\"STARTS_WITH\"|\"ENDS_WITH\"\n" +
            "      - \"Action Type\" (nodeType) — filter by the type of action; available values: FC_EMAIL, FC_POST_REQUEST, FC_CHANGE_STATE, FC_SQL_STATEMENT, FC_DOI_INIT, FC_COUNTER, FC_EXPORT_TO_XML, FC_SAVE_TO_WEBDAV, FC_CREATE_TEXT_FILE, FC_PROMPT_QUERY, FC_SWITCH, FC_CHANGE_FORM_AVAILABILITY, FC_FOR_EACH_LOOP, FC_WRITE_FORM_RECORD_ATTR, FC_EXPORT_TO_PERSISTENCE, FC_CHANGE_FORM_VALUE, FC_SHOW_TEMPLATE, FC_FILL_PDF, FC_COMPRESS_AS_ZIP, FC_SAVE_TO_FILE_SYSTEM, FC_LDAP_QUERY, FC_ENCODE_BASE64, FC_DECODE_BASE64, FC_RETURN_FILE, FC_MOVE_FORM_RECORD_TO_INBOX, FC_WHILE_LOOP, FC_DO_UNTIL_LOOP, FC_PROCESS_LOG_PDF, FC_SET_SAVED_FLAG, FC_SET_FORM_RECORD_PASSWORD, FC_RENEW_PROCESS_ID, FC_CHANGE_FORM_RECORD_ACTIVENESS, FC_COPY_FORM_RECORD, FC_DELETE_ATTACHMENT, FC_FILL_WORD, FC_WITH_FORM_ELEMENT_CONTEXT, FC_SEND_FORM_RECORD_MESSAGE, FC_QUEUE_TASK, FC_LOG_ENTRY, FC_EXPORT_FORM_RECORD_CHATS, FC_REDIRECT, FC_MULTIPLE_CONDITION, FC_PROVIDE_RESOURCE, FC_THROW_EXCEPTION, FC_IMPORT_FORM_VALUE_FROM_XML, FC_EXPERIMENT\n" +
            "      - \"Action Type match type\" (nodeTypeMatchType) — \"EXACT\"|\"CONTAINS\"|\"STARTS_WITH\"|\"ENDS_WITH\"\n" +
            "      - \"Error Code\" (errorCode) — filter by specific error code (e.g. EMAIL_SEND_FAILED, DATABASE_ERROR, NETWORK_FAILURE)\n" +
            "      - \"Error Code match type\" (errorCodeMatchType) — \"EXACT\"|\"CONTAINS\"|\"STARTS_WITH\"|\"ENDS_WITH\"\n" +
            "    triggerParams example: {\"nodeName\":\"MeineAktion\",\"nodeNameMatchType\":\"EXACT\",\"nodeType\":\"FC_EMAIL\",\"nodeTypeMatchType\":\"EXACT\",\"errorCode\":\"EMAIL_SEND_FAILED\",\"errorCodeMatchType\":\"EXACT\"}\n" +
            "  - \"FC_DOI_VERIFIED\" — CORRECT trigger for actions after DOI email confirmation (e.g. status change, welcome email);\n" +
            "    triggerParams: {}\n" +
            "  - \"FC_INVITATION_SENT\" — fires when an invitation email (DOI) is sent;\n" +
            "    triggerParams: {}\n" +
            "  - \"FC_INVITATION_ERROR\" — fires when an invitation email (DOI) delivery fails;\n" +
            "    triggerParams: {}\n" +
            "  - \"FC_USER_INVOCATION\" — fires when a logged-in user manually triggers it from the record detail view;\n" +
            "    triggerParams: {} (allowed states/groups configured in the FC designer)\n" +
            "  IMPORTANT — There is NO \"after state change\" trigger type in FORMCYCLE.\n" +
            "  The closest equivalent is FC_STATE_TIMER with applicableStateNames set and a duration of 0 if you need it to fire immediately.\n" +
            "  However, FC_STATE_TIMER with 0 duration fires on the NEXT server tick after the state change. For DOI flows,\n" +
            "  use FC_DOI_VERIFIED as the trigger (fires when the DOI confirmation link is clicked).\n\n")
    append(
        "NODE TYPES (use exactly one of these string values for 'nodeType'):\n" +
            "  - \"FC_EMAIL\" — sends an email; " +
            "nodeParams: {\"to\":\"<recipient address, [%fieldname%] placeholder, or empty string \\\"\\\" if no recipient is known — NEVER substitute FC_EMPTY for a missing address>\", " +
            "\"subject\":\"<subject text>\", " +
            "\"body\":\"<email body in HTML format — ALWAYS use HTML markup: use <br> for line breaks (NOT \\\\n), <p>…</p> for paragraphs, <b>…</b> for bold, <ul>/<li> for lists; use [%fieldname%] placeholders to include form field values>\", " +
            "\"from\":\"<sender address, empty if not specified>\", \"senderName\":\"<sender display name, empty if not specified>\", " +
            "\"(do NOT include bodyFormatType — it is always set to HTML automatically)\", " +
            "  - \"FC_DOI_INIT\" — sends a double opt-in invitation email with DOI confirmation link; " +
            "nodeParams: {\"to\":\"<recipient address>\", \"subject\":\"<subject>\", \"body\":\"<HTML body>\", \"from\":\"<sender address>\", \"senderName\":\"<sender name>\", " +
            "\"failurePage\":\"<name of the Abschlussseite to display if the DOI verification fails — MUST be one of the AVAILABLE ABSCHLUSSSEITEN listed below>\"}. " +
            "CRITICAL — This is the CORRECT node type for double opt-in invitations, NOT FC_EMAIL. The DOI system automatically adds the confirmation link to the email. " +
            "CRITICAL — The email BODY MUST include the verification link as HTML: <a href=\"[%\$FORM_VERIFY_LINK%]\">E-Mail-Adresse bestätigen</a> (or equivalent in the user's language). " +
            "The placeholder [%\$FORM_VERIFY_LINK%] is automatically resolved by FORMCYCLE at runtime — use it exactly as shown. " +
            "Use together with trigger FC_DOI_VERIFIED.\n" +
            "\"attachments\":[\"<technicalId1>\",...] (optional — technicalIds of XUpload fields whose files to attach)}\n" +
            "  - \"FC_CHANGE_STATE\" — changes the form record state; " +
            "nodeParams: {\"stateName\":\"<FORMCYCLE status name>\"}\n" +
            "  - \"FC_POST_REQUEST\" — sends an HTTP request (e.g. webhook, REST API call). " +
            "ALL nodeParams fields are optional unless marked REQUIRED:\n" +
            "    REQUIRED: \"url\":\"<target URL — must be set to the exact URL from the user's prompt>\",\n" +
            "    \"method\":\"POST|GET|PUT|DELETE|PATCH\" (default POST),\n" +
            "    \"body\":\"<request body, supports [%placeholder%] to reference form field values>\",\n" +
            "    \"contentType\":\"JSON|PLAIN_TEXT|XML|FORM_DATA\" (default JSON),\n" +
            "    \"headers\":[{\"name\":\"<header>\",\"value\":\"<value>\"},...] (optional),\n" +
            "    \"sendAllFormValues\":<true|false> (optional, default false) — send all form field values as request parameters,\n" +
            "    \"allowInvalidCertificates\":<true|false> (optional, default false) — accept self-signed/invalid SSL certificates,\n" +
            "    \"asResponsePage\":<true|false> (optional, default false). " +
            "CRITICAL: false = HTTP runs in background, formcycle shows Abschlussseite. true = HTTP response REPLACES formcycle page. " +
            "Set true ONLY when user explicitly asks to show HTTP response to the user.\n" +
            "    \"treat4xxAsNormal\":<true|false> (optional, default false) — 4xx status codes do NOT cause workflow error. Use when user says \"400er sollen keine Fehler verursachen\", \"treat 4xx as normal\", etc.,\n" +
            "    \"treat5xxAsNormal\":<true|false> (optional, default false) — 5xx status codes do NOT cause workflow error,\n" +
            "    \"useBasicAuth\":<true|false> (optional, default false) — enable HTTP basic authentication,\n" +
            "    \"inputCharset\":\"<charset>\" (optional, default \"UTF-8\"),\n" +
            "    \"outputCharset\":\"<charset>\" (optional, default \"UTF-8\"),\n" +
            "    \"outputFileName\":\"<filename>\" (optional) — name of the output file,\n" +
            "    \"connectTimeoutSeconds\":<number> (optional, default 30),\n" +
            "    \"readTimeoutMinutes\":<number> (optional, default 5)}\n" +
            "    The httpRequestType is automatically derived from contentType: \"CUSTOM\" for JSON|PLAIN_TEXT|XML, " +
            "\"FORM_DATA\" for FORM_DATA, \"URL\" when no body is needed (GET/DELETE/OPTIONS or POST with empty body).\n" +
            "  - \"FC_CHANGE_FORM_VALUE\" — sets the value of one or more form fields; " +
            "nodeParams: {\"formValues\":[{\"name\":\"<technicalId>\",\"value\":\"<new value>\"},...]}\n" +
            "  - \"FC_LOG_ENTRY\" — writes a log message to the process log; " +
            "nodeParams: {\"message\":\"<log text, supports [%placeholder%]>\", \"level\":\"INFO|WARNING|ERROR\" (default INFO)}\n" +
            "  - \"FC_REDIRECT\" — redirects the user's browser to a URL. " +
            "Has TWO mutually exclusive modes:\n" +
            "    Mode 1 — Manual URL: set \"url\":\"<target URL>\". Use this when the prompt gives an explicit URL.\n" +
            "    Mode 2 — URL template: set \"urlTemplate\":\"<name of the URL template to use — MUST be one of the AVAILABLE URL TEMPLATES listed below>\". " +
            "Use this when the prompt says \"URL-Template\", \"URL-Vorlage\" or mentions a named template (e.g. \"X2\", \"MeineVorlage\").\n" +
            "    CRITICAL: When the prompt says \"URL-Template X2\" or similar, use Mode 2 (urlTemplate), NOT Mode 1 (url).\n" +
            "    QUERY STRING PARAMETERS (optional): If the prompt mentions URL parameters like \"Parameter F2 mit Wert YOLO\", " +
            "\"Parameter X mit Wert Y\" etc., add a \"queryParams\" array: " +
            "\"queryParams\":[{\"name\":\"F2\",\"value\":\"YOLO\"},{\"name\":\"X\",\"value\":\"Y\"}]. " +
            "These are appended as query string parameters to the redirect URL.\n" +
            "    nodeParams example: {\"urlTemplate\":\"X2\",\"queryParams\":[{\"name\":\"F2\",\"value\":\"YOLO\"}]} or {\"url\":\"https://example.com\"}\n" +
            "  - \"FC_SET_SAVED_FLAG\" — marks the form record as saved; nodeParams: {}\n" +
            "  - \"FC_DELETE_FORM_RECORD\" — permanently deletes the current form record; nodeParams: {}\n" +
            "  - \"FC_SEND_FORM_RECORD_MESSAGE\" — sends an internal message to the record's inbox; " +
            "nodeParams: {\"message\":\"<message text, supports [%placeholder%]>\", \"senderName\":\"<optional sender name>\"}\n" +
            "  - \"FC_CREATE_TEXT_FILE\" — creates a text/JSON/XML/HTML file as an attachment; " +
            "nodeParams: {\"fileName\":\"<filename with extension>\", \"fileContent\":\"<content, supports [%placeholder%]>\", " +
            "\"contentType\":\"PLAIN_TEXT|JSON|XML|HTML\" (default PLAIN_TEXT)}\n" +
            "  - \"FC_WRITE_FORM_RECORD_ATTRIBUTES\" — writes custom key-value attributes to the record; " +
            "nodeParams: {\"attributes\":[{\"name\":\"<key>\",\"value\":\"<value>\"},...]}\n" +
            "  - \"FC_RETURN_FILE\" — returns a file to the user's browser for download; " +
            "nodeParams: {\"fileName\":\"<filename, e.g. 'xoxo.txt'>\", " +
            "\"forceDownload\":<true|false> (optional, default true — forces download instead of inline display), " +
            "\"deleteFileAfterDownload\":<true|false> (optional, default false)}\n" +
            "    Use this when the user says a file should be downloaded when a button is clicked. " +
            "The file is typically found in the form's file management section (form resources/files tab). " +
            "Set 'fileName' to the exact filename as stored in the form's file section (e.g. \"xoxo.txt\").\n" +
            "  - \"FC_ENCODE_BASE64\" — encodes a file or form upload to Base64; " +
            "nodeParams: {\"file\":\"<filename from form resources, e.g. 'xoxo.txt'>\"}\n" +
            "  - \"FC_DECODE_BASE64\" — decodes a Base64-encoded file back to its original format; " +
            "nodeParams: {\"base64\":\"<base64 content>\", \"exportName\":\"<output filename, e.g. 'xoxo.txt'>\"}\n" +
            "  - \"FC_PROVIDE_RESOURCE\" — provides (downloads) a file from a preceding action node's output; " +
            "nodeParams: {\"exportName\":\"<filename for download, e.g. 'decoded.txt'>\", \"sourceNode\":\"%prev%\"}. " +
            "CRITICAL — Use as a chained node after FC_DECODE_BASE64 to make the decoded file downloadable. " +
            "The sourceNode \"%prev%\" placeholder resolves to the preceding node's UUID at creation time.\n" +
            "  - \"FC_PROCESS_LOG_PDF\" — generates a PDF from the current process log messages; " +
            "nodeParams: {\"fileName\":\"<output PDF filename, e.g. 'prozess-meldungen.pdf'>\"}. " +
            "Use this when the user wants the process log messages to be compiled into a PDF file. " +
            "The PDF is attached to the form record. For automatic download, chain an FC_PROVIDE_RESOURCE node " +
            "after this one with {\"exportName\":\"<same filename>\",\"sourceNode\":\"%prev%\"}.\n" +
            "  - \"FC_FILL_PDF\" — fills a PDF template with form data and produces a filled PDF; " +
            "nodeParams: {\"file\":\"<template filename from form resources, e.g. 'vorlage.pdf'>\", " +
            "\"exportName\":\"<output filename, e.g. 'ausgefuellt.pdf'>\", " +
            "\"flatten\":<true|false> (optional, default true)}. " +
            "When used as a chained node, the template file is taken from the preceding node's output.\n" +
            "  - \"FC_FILL_WORD\" — fills a Word template with form data and produces a filled document; " +
            "nodeParams: {\"file\":\"<template filename from form resources, e.g. 'vorlage.docx'>\", " +
            "\"exportName\":\"<output filename, e.g. 'ausgefuellt.docx'>\"}. " +
            "When used as a chained node, the template is taken from the preceding node's output.\n" +
            "  - \"FC_COMPRESS_AS_ZIP\" — compresses one or more files into a ZIP archive; " +
            "nodeParams: {\"compressedFileName\":\"<output ZIP filename, e.g. 'archive.zip'>\", " +
            "\"files\":[\"<upload field technical ID, e.g. 'upl1'>\"]}. " +
            "The 'files' array must contain the technical IDs of the form upload fields whose files should be compressed. " +
            "When used as a chained node, compresses the file from the preceding node's output.\n" +
            "  - \"FC_SAVE_TO_FILE_SYSTEM\" — saves a file to the server's file system; " +
            "nodeParams: {\"exportDirectory\":\"<target directory path, e.g. '/Test/'>\", " +
            "\"files\":[\"<upload field technical ID, e.g. 'upl1'>\"]}. " +
            "When a path is specified, allowPathInPlaceholder is automatically set to true. " +
            "The 'files' array must contain the technical IDs of the form upload fields whose files should be saved. " +
            "When used as a chained node, saves the preceding node's output file to the directory.\n" +
            "  - \"FC_SAVE_TO_WEBDAV\" — saves a file to a WebDAV server; " +
            "nodeParams: {\"path\":\"<target path on WebDAV>\", " +
            "\"files\":[\"<upload field technical ID, e.g. 'upl1'>\"]}. " +
            "When a path is specified, allowPathInPlaceholder is automatically set to true. " +
            "The 'files' array must contain the technical IDs of the form upload fields whose files should be saved. " +
            "When used as a chained node, saves the preceding node's output to the WebDAV path.\n" +
            "  - \"FC_COUNTER\" — increments or decrements a counter; " +
            "nodeParams: {\"counterName\":\"<counter name, e.g. 'XXX'>\", " +
            "\"action\":\"COUNT_UP\"|\"COUNT_DOWN\"|\"COUNT_RESET\" (default COUNT_UP), " +
            "\"step\":\"<step size, e.g. '1'>\" (optional, default \"1\")}. " +
            "Use this when the user says a counter should be incremented, decremented, or reset.\n" +
            "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; " +
            "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; " +
            "nodeParams: {\"htmlTemplate\":\"<name of the HTML template to display — MUST be one of the AVAILABLE HTML TEMPLATES listed below>\"}. " +
            "CRITICAL — The mandatory \"Template HTML\" property MUST reference an HTML template " +
            "(stored in the project's template library, e.g. TEMPLATE_CLIENT or FORM_TEMPLATE tables). " +
            "Use this when the user says a specific completion page, Abschlussseite, or error page should be displayed " +
            "after a button is clicked (e.g. \"Bei Klick auf submit, Abschlussseite 'Allgemeiner Fehler 2' anzeigen\").\n" +
            "  - \"FC_EMPTY\" — no-op placeholder node; nodeParams: {}. " +
            "WARNING: NEVER use FC_EMPTY to represent an email, state change, or any other action. " +
            "If the user requests sending an email, always use FC_EMAIL even if 'to' is unknown (set 'to' to \"\").\n\n")
    append(
        "ENDPOINT STATE (\"endpointState\" field) — CRITICAL:\n" +
            "  Every workflow lane automatically ends with a status transition (Endpunkt). The 'endpointState' field\n" +
            "  specifies the FORMCYCLE status name to set the form record to after all actions in the lane complete.\n" +
            "  DEFAULT: \"Received\" — use this unless the user specifies a different end status.\n" +
            "  CRITICAL — If the user says \"set status to <XYZ>\" or \"das Formular auf den Status <XYZ> setzen\",\n" +
            "  use EXACTLY the status name the user specified in their prompt. Do NOT pick a different status from the\n" +
            "  available list below. The user's requested status name may be new or different from existing ones.\n" +
            "  This is NOT a separate action or lane. Simply set endpointState to the user's specified status name.\n" +
            "  The status transition is automatically created as the bottommost node of the lane.\n" +
            "  Exception: if nodeType is \"FC_CHANGE_STATE\", the state change IS the endpoint; " +
            "set endpointState to the same value as nodeParams.stateName.\n" +
            "  STATE PROPERTIES (\"stateProperties\" field — optional):\n" +
            "  If the user specifies additional requirements for the endpoint state, include a 'stateProperties' object.\n" +
            "  Supported boolean properties: externalAccessPermitted, allowAccessToApplicant, allowAccessAllParticipants,\n" +
            "  allowAccessToAnonymousApplicant, allowAuthenticatedUser, formRecordDeletable, useSystemAuthentication.\n" +
            "  Example 1: \"von extern aufrufbar\" → stateProperties: {\"externalAccessPermitted\": true}\n" +
            "  Example 2: \"für alle Beteiligten aufrufbar\" → stateProperties: {\"allowAccessAllParticipants\": true}\n" +
            "  Example 3: \"für alle authentifizierten Beteiligten aufrufbar\" → stateProperties: {\"allowAccessAllParticipants\": true, \"allowAuthenticatedUser\": true}\n" +
            "  Example 4: \"Passwort XXX\" → stateProperties: {\"useSystemAuthentication\": true}\n" +
            "  NOTE: The actual form password value (e.g. \"XXX\") must be configured manually in the workflow state\n" +
            "  editor after creation — it is stored in a separate authenticator entity.\n" +
            "  IMPORTANT: \"Password\", \"Passwort\", \"Status\", and \"form status\" mentioned together with workflow\n" +
            "  configuration are workflow state properties, NOT form fields. Do NOT add them as form elements.\n" +
            "  Handle them exclusively via endpointState and stateProperties.\n\n")
    if (!workflowStates.isNullOrBlank()) {
      append(
          "AVAILABLE WORKFLOW STATES (for reference only — use the user's requested status name, not this list):\n" +
              workflowStates +
              "\n\n")
    }
    append(
        "PLACEHOLDERS: To include a form field value in email body/subject/recipient use " +
            "[%technicalId%] where 'technicalId' is taken from the FORM ELEMENTS list. " +
            "Example: [%tfEmail%] for a field whose 'technicalId' is 'tfEmail'.\n\n")
    append(
        "CRITICAL — output rules for form element identifiers:\n" +
            "  FORM ELEMENTS entries have: 'technicalId' (always), 'displayText' (visible label/text), 'type' (e.g. XTextField, BUTTON),\n" +
            "  and optionally: 'required' (boolean), 'placeholder', 'options' (for XSelect — array of {text,value}), 'actionPage' (for BUTTON — e.g. 'submit', 'submitNoCheck').\n" +
            "  'technicalId' is an ARBITRARY internal database key — it can look like anything (e.g. 'tfHurra', 'x9q', 'abc123').\n" +
            "  'displayText' is what the user sees in the browser.\n" +
            "  The user's prompt refers to 'displayText'. Find the matching element, then copy its 'technicalId' EXACTLY.\n" +
            "  NEVER use a 'displayText' value in the output. NEVER guess or invent a technicalId.\n" +
            "  Even if the 'technicalId' looks wrong or random, copy it character-for-character.\n" +
            "  Elements with type 'BUTTON' are individual clickable buttons. For triggerParams.buttonName always use\n" +
            "  the 'technicalId' of the individual BUTTON whose 'displayText' matches — never use a container's id.\n" +
            "  BUTTON entries may have 'actionPage' (e.g. 'submit', 'submitNoCheck', 'next', 'prev') — use this to\n" +
            "  identify which button submits the form when the user says 'submit button', 'Absende-Button', etc.\n" +
            "  NO-MATCH RULE: If no BUTTON in FORM ELEMENTS matches the description, use triggerParams:{} (matches any\n" +
            "  button) instead of inventing a buttonName. NEVER construct names like 'btnSubmitOnP2' or similar.\n\n")
    if (formContext != null) {
      append(
          "FORM ELEMENTS (match user descriptions via 'displayText'; always use 'technicalId' in output):\n" +
              formContext +
              "\n\n")
    }
    if (!completionPages.isNullOrBlank()) {
      append(
          "AVAILABLE ABSCHLUSSSEITEN (completion pages — pick one for failurePage when creating a FC_DOI_INIT node):\n" +
              completionPages +
              "\n\n" +
              "Select the most suitable Abschlussseite from the list above. The Abschlussseite is displayed to the user " +
              "when the Double Opt-In (DOI) email verification fails.\n" +
              "SELECTION CRITERIA (in order of priority):\n" +
              "  1. FIRST CHOICE — If any available Abschlussseite has a name that combines \"double opt-in\" (or \"doi\") " +
              "and \"failed\" / \"error\" / \"fehler\" (e.g. \"Double opt-in verification failed\"), pick that one.\n" +
              "  2. SECOND CHOICE — If no DOI-specific failure page exists, pick a generic error/failure page " +
              "(name containing \"Fehler\", \"Error\", \"Failed\", \"Allgemein\", \"Standard\").\n" +
              "  3. LAST RESORT — If neither exists, pick the most generically named page.\n" +
              "NEVER create a new page — always pick from the list above.\n\n")
    }
    if (!htmlTemplates.isNullOrBlank()) {
      append(
          "AVAILABLE HTML TEMPLATES (for htmlTemplate when creating a FC_SHOW_TEMPLATE node — pick the EXACT match to the user's request):\n" +
              htmlTemplates +
              "\n\n" +
              "The HTML template is rendered to the user when the workflow runs (e.g. after clicking a submit button). " +
              "Use this when the user says a specific completion page, Abschlussseite, error page, or template should be displayed " +
              "(e.g. \"Bei Klick auf submit, Abschlussseite 'Allgemeiner Fehler 2' anzeigen\"). " +
              "NEVER create a new template — always pick from the list above.\n\n")
    }
    if (!htmlTemplates.isNullOrBlank()) {
      // URL templates come from the same TEMPLATE_CLIENT table as HTML templates
      append(
          "AVAILABLE URL TEMPLATES (for urlTemplate when creating a FC_REDIRECT node — pick the EXACT match to the user's request):\n" +
              htmlTemplates +
              "\n\n" +
              "The URL template is a named URL stored in the system. " +
              "Use this when the user says \"URL-Template\", \"URL-Vorlage\" or mentions a named template " +
              "(e.g. \"Bei Klick auf submit, an die URL-Template X2 umleiten\"). " +
              "NEVER create a new template — always pick from the list above.\n\n")
    }
    append(
        "EXAMPLE (note: technicalId values are arbitrary — use them verbatim):\n" +
            "  FORM ELEMENTS: [{\"technicalId\":\"tfHurra\",\"displayText\":\"Mail\",\"type\":\"XTextField\"},{\"technicalId\":\"btnZwolf\",\"displayText\":\"Senden\",\"type\":\"BUTTON\",\"actionPage\":\"submit\"}]\n" +
            "  User: \"Wenn Senden geklickt wird, E-Mail an das Mail-Feld schicken.\"\n" +
            "  Step 1 — find button: user says 'Senden' → matches displayText 'Senden' → technicalId is 'btnZwolf' → use \"btnZwolf\"\n" +
            "  Step 2 — find field:  user says 'Mail-Feld' → matches displayText 'Mail'   → technicalId is 'tfHurra'  → use [%tfHurra%]\n" +
            "  Output: {\"taskName\":\"E-Mail bei Absenden\",\"taskDescription\":\"\",\"triggerType\":\"FC_FORM_SUBMIT_BUTTON\"," +
            "\"triggerParams\":{\"buttonName\":\"btnZwolf\"},\"nodeType\":\"FC_EMAIL\"," +
            "\"nodeParams\":{\"to\":\"[%tfHurra%]\",\"subject\":\"Eingang\",\"body\":\"<p>Ihr Formular wurde empfangen.</p>\"},\"endpointState\":\"Received\"}\n\n")
    append("Output ONLY valid JSON. No trailing commas. No comments.")
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

    // Endpoint node: every workflow lane requires a final FC_CHANGE_STATE (Endpunkt) that
    // sets the form record to its terminal status. Skip only when the main action IS
    // a state change (it already serves as the endpoint).
    if (spec.nodeType != "FC_CHANGE_STATE") {
      val endpointNode = workflowNodeClass.getDeclaredConstructor().newInstance()
      workflowNodeClass
          .getMethod("setName", String::class.java)
          .invoke(endpointNode, "FC_CHANGE_STATE")
      workflowNodeClass
          .getMethod("setType", String::class.java)
          .invoke(endpointNode, "FC_CHANGE_STATE")
      workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(endpointNode, true)
      workflowNodeClass
          .getMethod("setUUIDObject", UUID::class.java)
          .invoke(endpointNode, UUID.randomUUID())

      // Resolve the state UUID — either find an existing state or create a new one
      val stateName = spec.endpointState.ifBlank { "Received" }
      var endpointStateUuid = resolveStateUuid(userContext, workflowVersion, stateName)

      // Apply optional state properties to the resolved or newly created state
      if (spec.stateProperties.isNotEmpty()) {
        try {
          val workflowStateClass = Class.forName("de.xima.fc.entities.WorkflowState")
          val stateApi = apiProviderClass.getField("WORKFLOW_STATE_API").get(null)

          val stateObject: Any
          if (endpointStateUuid == null) {
            // State doesn't exist — create a new one
            val newState = workflowStateClass.getDeclaredConstructor().newInstance()
            workflowStateClass.getMethod("setName", String::class.java).invoke(newState, stateName)
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
            // State already exists — find it by UUID via the state list, then fetch by ID
            val allStates = loadWorkflowStates(userContext, workflowVersion)
            val matchedState =
                allStates.firstOrNull { st ->
                  try {
                    st.javaClass.getMethod("getUUIDObject").invoke(st) == endpointStateUuid
                  } catch (_: Exception) {
                    false
                  }
                }
            val stateId = matchedState?.javaClass?.getMethod("getId")?.invoke(matchedState) as? Long
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
                  "[AICodBiAssistant] Failed to set state property '{}': {}", setterName, e.message)
            }
          }

          // Handle allowAuthenticatedUser — requires creating a WorkflowStateAuthenticatorConfig
          // with EAuthClientType.FORM (FormCycle's internal user authentication).
          // This is NOT a simple boolean on the entity; it requires an authenticator config entry.
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
                // New state — add via entity method
                workflowStateClass
                    .getMethod("addAuthenticatorConfig", authConfigClass)
                    .invoke(stateObject, authConfig)
              } else {
                // Existing state (Hibernate proxy) — persist config directly via GenericAPI
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
        // No properties to set, but state doesn't exist — create minimal state
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
        val savedEndpointNode = createNodeMethod.invoke(workflowNodeApi, userContext, endpointNode)
        fixParentOrderIndex(savedEndpointNode, savedRootNode, userContext)
      } else {
        logger.warn("[AICodBiAssistant] Skipping endpoint node: no workflow states found")
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

    return "Workflow task '${spec.taskName}' created: ${spec.triggerType} → ${spec.nodeType}"
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
        // If the prompt does not specify a delay, default to 1 minute —
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
                  "[AICodBiAssistant] buildNodeParams FC_DOI_INIT: SKIPPING doiFailTemplate — failurePage blank={}, workflowVersion null={}, userContext null={}",
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
        //   CUSTOM – for JSON/PLAIN_TEXT/XML (body provided as customBodyContent)
        //   FORM_DATA – for FORM_DATA (key-value pairs in requestParameters)
        //   URL – for GET/DELETE/HEAD/OPTIONS OR when no body content is specified
        val asResponsePage = spec.nodeParams["asResponsePage"] as? Boolean ?: false
        val treat4xxAsNormal = spec.nodeParams["treat4xxAsNormal"] as? Boolean ?: false
        val treat5xxAsNormal = spec.nodeParams["treat5xxAsNormal"] as? Boolean ?: false
        val httpRequestType =
            when {
              method == "GET" || method == "DELETE" || method == "HEAD" || method == "OPTIONS" ->
                  "URL"
              contentType == "FORM_DATA" -> "FORM_DATA"
              body.isBlank() -> "URL" // POST with no body content → use URL type
              else -> "CUSTOM" // JSON, PLAIN_TEXT, XML → custom body content
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
              "[AICodBiAssistant] buildNodeParams FC_REDIRECT: urlTemplate='{}' → uuid={}, queryParams={}",
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
        """{"name":${gson.toJson(nodeName)},"messageContent":${gson.toJson(message)},"senderName":${gson.toJson(senderName)}}"""
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
        """{"name":${gson.toJson(nodeName)},"customAttributes":[${attributes.joinToString(",")}],"writeAttributesToForm":false}"""
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
              "[AICodBiAssistant] buildNodeParams FC_SHOW_TEMPLATE: SKIPPING htmlTemplate — templateName blank={}, workflowVersion null={}, userContext null={}",
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
      "FC_SET_SAVED_FLAG",
      "FC_DELETE_FORM_RECORD",
      "FC_EMPTY" ->
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
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
   * Fetches available URL templates (same source as HTML templates — the TEMPLATE_CLIENT table).
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
        // Try RESOURCE_PROJECT table (project-level file resources — form's file management
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
          "FC_FOR_EACH_LOOP" -> "For each loop"
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
      val endpointState: String = "Received",
      val stateProperties: Map<String, Any> = emptyMap()
  )

  // endregion Data Classes
}
