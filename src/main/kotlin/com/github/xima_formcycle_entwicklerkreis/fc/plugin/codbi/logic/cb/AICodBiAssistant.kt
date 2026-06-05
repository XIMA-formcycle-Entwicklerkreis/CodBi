package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
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
      val formJson =
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
      result.append(""","formJson":$formJson""")
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
        val updatedStandards = computeUpdatedStandards(formJson, currentStandards, aiSetStandards)
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
        latestFormElements = extractFormElementsFromJson(formJson) ?: latestFormElements
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
            "- \"form\": changes to the form structure (adding/removing/modifying form fields, labels, buttons, layout, etc.)\n" +
            "- \"workflow\": creating or modifying workflow automations (emails after submission, state changes, triggers, notifications, etc.)\n" +
            "- \"both\": both form structure changes AND workflow automations in the same request\n" +
            "Respond ONLY with valid JSON: {\"intent\":\"form\"} or {\"intent\":\"workflow\"} or {\"intent\":\"both\"}\n" +
            "No explanation, no markdown, no code fences."

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }

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
  ): String {
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

    logger.debug(
        "[AICodBiAssistant] Sending form AI request — system prompt: {} chars, CodBi section present: {}",
        systemPrompt.length,
        systemPrompt.contains("CODBI CANDIDATE REVIEW"))
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
                "Please reconsider carefully. Review each element's className and properties and check whether any functionality from the list below is applicable. " +
                "If a functionality applies: add data-cb-func to the element's properties (as CSV if multiple), and set any required data-cb-* attributes. " +
                "ADDITIONALLY, you MUST also set CSS classes on elements where applicable. " +
                "To set a CSS class: add a \"cssclasses\" array to the element's \"properties\" (e.g. \"cssclasses\":[\"CodBi_People_Name\"]). " +
                "RULES — TWO-OPTION RULE: CSS classes exist ONLY in the list below. For each field, pick ONE: (A) exact CSS class match exists → use it; (B) no CSS class → use data-cb-func. NEVER invent CSS class names. (a) Apply AT MOST ONE CSS class per field. (b) Only apply a class when it has an EXACT match. (c) For Time/Date frames: use CSS class when available (N=1-5); fallback to data-cb-func if all 5 used. When using a CSS class, do NOT add data-cb-func for the SAME behavior — but MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends). (d) Do NOT use CodBi_People_Alphanumeric on street names, localities, or postal codes. (e) REDUNDANCY: A CSS class replaces data-cb-func ONLY when they provide the SAME behavior. CodBi_People_PLZ (Cleave formatting) does NOT replace OpenPLZ.Autocomplete. (f) Street names and localities have no CSS class. (g) CRITICAL — OpenPLZ.Autocomplete via data-cb-func must be set on ALL address fields in a group (postal code, locality, street, building number). Never skip the postal code field.\n" +
                "   h) NUMBERING — When creating frame CSS classes (TimeFrame_N_Begin/End or DateFrame_N_Begin/End), scan existing form items for which N (1-5) are already used. Use the lowest unused N for each new pair.\n" +
                "   i) Form.Navigator AUTO-GENERATES navigation buttons — do NOT add XButtonList or manual page-navigation buttons. The functionality creates them automatically.\n" +
                "Available CSS classes:\n" +
                "=== People === CodBi_People_Name (for person names only), CodBi_People_Alphanumeric (codes/IDs only), CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ (postal codes, use alone), CodBi_People_18plus, CodBi_People_16plus, CodBi_People_BuildingNumber\n" +
                "=== Financial === CodBi_Currency, CodBi_TRANS_NTW\n" +
                "=== Appointments === CodBi_NoFutureDate, CodBi_DateFrame_N_Begin/End (N=1-5), CodBi_TimeFrame_N_Begin/End (N=1-5) — fallback to data-cb-func if all 5 pairs used\n" +
                "=== LDAP.Autofill === CodBi_LDAP_AC_*\n" +
                "=== AI === AI_LLAMA_*, AI_OCR_*\n" +
                "=== UI.Panels === CodBi_HTML_Panel_*, CodBi_Accordion_*\n" +
                "=== Print.Removal === CodBi_Print_Remove_*\n" +
                "=== BayVIS === CodBi_BayVIS_*\n" +
                "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_*\n" +
                "CRITICAL: CSS classes ONLY exist for the domains listed above. For any functionality NOT listed here (e.g. Form.Navigator, OpenPLZ.Autocomplete, Date.Min, Date.NoWeekends, HTML.Input.REGEX, HTML.CSS, etc.), there is NO CSS class — you MUST use data-cb-func. NEVER invent CSS class names.\n" +
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
                "You receive a JSON array of FORMCYCLE form element objects. Each element has a \"className\" and a \"properties\" object (which includes \"id\"). " +
                "Apply the CodBi functionalities listed below to the appropriate elements. " +
                "To apply a functionality: set data-cb-func in the element's properties as CSV (create the key if absent). " +
                "CRITICAL — ALL documented parameters MUST be set as data-cb-ParamName attributes. Do NOT skip any parameter even if it appears optional. " +
                "Use the element's property values to infer sensible parameter values: " +
                "  - For CSS-Selector parameters referencing other form elements (e.g. MaxField, MinField, DependentPLZ, DependentLocality, FocusOnAutocomplete, Target, File, Container, Updater, DocumentSelector, Field, Destination): use the target element's properties.name value prefixed with a dot '.', e.g. \".tfBisUhrzeit\" or \".tfaAdresse\". Do NOT use an ID selector (# prefix) -- IDs break in repeatable containers. " +
                "  - For string parameters (e.g. Country, MsgNotKnown): set a reasonable default based on the form context. " +
                "  - For boolean parameters (e.g. EqualityPermitted): set a reasonable default. " +
                "Set data-cb-* parameter attributes as documented. " +
                "ADDITIONALLY, you MUST also set CSS classes on elements where applicable. " +
                "To set a CSS class: add a \"cssclasses\" array to the element's \"properties\" (e.g. \"cssclasses\":[\"CodBi_People_Name\"]). " +
                "RULES — TWO-OPTION RULE: CSS classes exist ONLY in the list below. For each field, pick ONE: (A) exact CSS class match exists → use it; (B) no CSS class → use data-cb-func. NEVER invent CSS class names. (a) Apply AT MOST ONE CSS class per field. (b) Only apply when it has an EXACT match. (c) For Time/Date frames: use CSS class when available (N=1-5); fallback to data-cb-func if all 5 used. When using a CSS class, do NOT add data-cb-func for the SAME behavior — but MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends). (d) Do NOT use CodBi_People_Alphanumeric on street names, localities, or postal codes. (e) REDUNDANCY: A CSS class replaces data-cb-func ONLY for same behavior. CodBi_People_PLZ does NOT replace OpenPLZ.Autocomplete. (f) Street names and localities have no CSS class. (g) CRITICAL: OpenPLZ.Autocomplete via data-cb-func on ALL address fields including postal code. (h) NUMBERING: Scan existing items for used TimeFrame/DateFrame N values. Use unused N (1-5) for new pairs. (i) Form.Navigator AUTO-GENERATES navigation buttons — do NOT add XButtonList or manual page-navigation buttons. The functionality creates them automatically.\n" +
                "Available CSS classes:\n" +
                "=== People === CodBi_People_Name (person names only), CodBi_People_Alphanumeric (codes/IDs only), CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ (postal codes, use alone), CodBi_People_18plus, CodBi_People_16plus, CodBi_People_BuildingNumber\n" +
                "=== Financial === CodBi_Currency, CodBi_TRANS_NTW\n" +
                "=== Appointments === CodBi_NoFutureDate, CodBi_DateFrame_N_Begin/End (N=1-5), CodBi_TimeFrame_N_Begin/End (N=1-5) — fallback to data-cb-func if all 5 used\n" +
                "=== LDAP.Autofill === CodBi_LDAP_AC_*\n" +
                "=== AI === AI_LLAMA_*, AI_OCR_*\n" +
                "=== UI.Panels === CodBi_HTML_Panel_*, CodBi_Accordion_*\n" +
                "=== Print.Removal === CodBi_Print_Remove_*\n" +
                "=== BayVIS === CodBi_BayVIS_*\n" +
                "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_*\n" +
                "CRITICAL: CSS classes ONLY exist for the domains listed above. For any functionality NOT listed here (e.g. Form.Navigator, OpenPLZ.Autocomplete, Date.Min, Date.NoWeekends, HTML.Input.REGEX, HTML.CSS, etc.), there is NO CSS class — you MUST use data-cb-func. NEVER invent CSS class names.\n" +
                "IMPORTANT: PRESERVE any existing \"cssclasses\" array already set on elements from the input — only add entries or create a new array if none exists.\n" +
                "Respond ONLY with a JSON object: " +
                "{\"items\":[...same elements with modifications applied...],\"_codbiApplicability\":{\"formElementsProcessed\":4,\"codbiElementsEvaluated\":23 (replace counts)," +
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
      restoreStrippedFields(sanitizedCleaned, persistJson)
    } catch (_: Exception) {
      logger.warn("[AICodBiAssistant] Form AI returned unparseable response: {}", sanitizedCleaned)
      """{"error":"AI returned invalid JSON","raw":${gson.toJson(sanitizedCleaned)}}"""
    }
  }

  private fun buildFormSystemPrompt(): String =
      "You are a FORMCYCLE form structure assistant. You receive a partial IPersistJson object " +
          "(styling and image fields have been removed to save tokens) and a natural language " +
          "instruction. Your ONLY output must be the same partial IPersistJson — modified according " +
          "to the instruction — as a raw JSON object. No explanation, no markdown, no code fences.\n\n" +
          "CRITICAL RULES — violating any of these will corrupt the form:\n" +
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
          "   'sig' for XSignature, 'cin' for XContainerInvisible.\n" +
          "5. Valid FORMCYCLE element className values (use ONLY these exact strings):\n" +
          "   - XTextField          — single-line text input; set 'datatype' property to validate input (usdLY these exact values):\n" +
          "     \"\" plain text (default) · \"dateDE\" German date DD.MM.YYYY (preferred; shown as 'Datum (TT.MM.YYYY)' in designer) · \"date\" HTML5 native date picker · \"email\" e-mail ·\n" +
          "     \"phone\" phone number · \"url\" URL · \"time\" time HH:MM · \"number\" decimal number · \"integer\" integer ·\n" +
          "     \"posinteger\" non-negative integer · \"money\" money amount · \"posmoney\" non-negative money ·\n" +
          "     \"posmoneyOptionalComma\" non-negative money (decimal optional) · \"formattedNumber\" number with custom format config ·\n" +
          "     \"plzDE\" German ZIP code · \"ipv4\" IPv4 address · \"onlyLetterNumber\" alphanumeric · \"onlyLetterSp\" letters and spaces ·\n" +
          "     \"regexp\" custom regex (also add datatypeHint property with the regex pattern and error message)\n" +
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
          "   - XSignature          — signature pad\n" +
          "   - XAppointment        — appointment/calendar picker (do NOT use for date input fields — use XTextField with datatype=\"dateDE\" instead)\n" +
          "   - XLine               — horizontal divider; has no 'label' property\n" +
          "   - XSpacer      — empty spacer; has no 'label' property\n" +
          "   - XPage        — form page (top-level)\n" +
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
          """{"className":"XSignature","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0"}}""" +
          "\n" +
          """{"className":"XAppointment","properties":{"name":"apExample","id":"xi-ap-example","label":"Example","required":"0","fullwidth":"0"}}""" +
          "\n" +
          """{"className":"XContainerInvisible","properties":{"name":"cinExample","id":"xi-cin-example","elements":[],"fullwidth":"0"}}""" +
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
          "   e) OpenPLZ.Autocomplete — ALWAYS uses data-cb-func=OpenPLZ.Autocomplete (no CSS class exists). Must be set on ALL address fields (postal code, locality, street, building number). A People CSS class like CodBi_People_PLZ does NOT provide OpenPLZ autocomplete.\n" +
          "   f) Do NOT use CodBi_People_Alphanumeric on street names, localities, or other non-alphanumeric-code fields — it is ONLY for actual alphanumeric codes and IDs.\n" +
          "   g) REDUNDANCY RULE: When a field's datatype already triggers a Holistic.Cleave.* standard (datatype=\"phone\" → Cleave.Phone, \"plzDE\" → Cleave.PLZ, \"dateDE\"/\"time\" → Cleave.Date/Time), do NOT apply the equivalent People CSS class:\n" +
          "      - Phone fields (datatype=\"phone\"): do NOT apply CodBi_People_Phone — Holistic.Cleave.Phone handles formatting.\n" +
          "      - Postal code fields (datatype=\"plzDE\"): do NOT apply CodBi_People_PLZ — Holistic.Cleave.PLZ handles formatting.\n" +
          "      - Date fields (datatype=\"dateDE\" or \"date\"): do NOT apply CodBi_People_18plus/16plus for formatting — Cleave handles it. Age restrictions may still be added if it is specifically a date-of-birth field.\n" +
          "   h) Street names and locality/city names have no dedicated People CSS class — leave them without a CSS class.\n" +
          "   i) REPEATABLE CONTAINERS — To make an XContainer or XContainerInvisible repeatable (add dynamic rows), set \"dynamic\":\"1\" in its properties. Also set \"dynamicMinSize\" (min rows, default 1), \"dynamicMaxSize\" (max rows, default 10), \"dynamicAddText\" (add button label), \"dynamicDeleteText\" (delete button label) as needed. Example: {\"className\":\"XContainer\",\"properties\":{\"name\":\"coAdressen\",\"dynamic\":\"1\",\"dynamicMinSize\":\"1\",\"dynamicMaxSize\":\"5\",\"elements\":[\"tfName\",\"tfEmail\"]}}\n" +
          "   j) Form.Navigator AUTO-GENERATES navigation buttons — When applying data-cb-func=form.navigator to a container, do NOT add XButtonList or any manual button elements for page navigation inside it. The Form.Navigator functionality creates the navigation buttons automatically at render time. The container should be left empty (no child elements needed) or may keep existing non-navigation elements.\n" +
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
          "=== Financial === CodBi_Currency (money), CodBi_TRANS_NTW (net/tax)\n" +
          "=== Appointments === CodBi_NoFutureDate (no future dates), CodBi_DateFrame_N_Begin/End (date ranges, N=1-5), CodBi_TimeFrame_N_Begin/End (time ranges, N=1-5). When using CodBi_TimeFrame_* or CodBi_DateFrame_* classes, do NOT also add data-cb-func=time.frame or data-cb-func=date.frame — the CSS class already provides that behavior. You MAY still add data-cb-func for a DIFFERENT functionality on the same field (e.g. date.noweekends).\n" +
          "=== LDAP.Autofill === CodBi_LDAP_AC_* fields for LDAP autocomplete.\n" +
          "=== AI === AI_LLAMA_CHAT_*, AI_LLAMA_STANDARD_QA_Question, AI_LLAMA_STANDARD_TXTQA_Question, AI_LLAMA_TXTQA_Source, AI_LLAMA_QA_Exclude, AI_OCR_Receiver\n" +
          "=== UI.Panels === CodBi_HTML_Panel_*, CodBi_Accordion_A/B/C/D for panels and accordions.\n" +
          "=== Print.Removal === CodBi_Print_Remove_Tagged / Parent / PrintOnly.\n" +
          "=== BayVIS === CodBi_BayVIS_Behoerde / BehoerdeUndAnsprechpartner / Ansprechpartner / Auswahl_Behoerden.\n" +
          "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_PLZ / Locality / Street / BuildingNumber.\n" +
          "=== Holistic === CodBi_XCL_Speech, CodBi_XCL_Speech_Whisper.\n" +
          "When the instruction asks for a specific field type that matches a CSS class description above, " +
          "add the corresponding CSS class(es) following the rules above. " +
          "REMINDER: CSS classes ONLY exist for the domains listed above. For everything else, use data-cb-func. Never invent CSS class names.\n\n" +
          "CODBI CANDIDATE REVIEW — while designing the form output, scan the CODBI CORE ELEMENTS (COMPACT) list at the end of this prompt. " +
          "For each listed element, consider whether any field in this form could meaningfully benefit from it. " +
          "Examples: a begin/end time pair → Time.Frame; a begin/end date pair → Date.Frame; date field where past dates should be forbidden → Date.Min; text field needing format validation → HTML.Input.REGEX; German address flow → OpenPLZ.Autocomplete; container/navigation bar → Form.Navigator. " +
          "Do NOT apply any CodBi element in this pass — just note which ones look relevant. " +
          "Return the form JSON normally. Include a top-level \"_codbiApplicability\" field with these exact keys: " +
          "{\"formElementsProcessed\":4,\"codbiElementsEvaluated\":23 (replace 4 with actual field count; replace 23 with how many CODBI CORE ELEMENTS list entries you read)," +
          "\"considered\":[{\"id\":\"CodBi.ID\",\"targets\":[\"formElementId\", ...]}] (CodBi functionality IDs with the form element ids they could apply to),\"applied\":[],\"skipped\":[]}. " +
          "The server will handle application in a second pass if candidates are found. This metadata field is removed server-side before the form is applied." +
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

  private fun extractAndStripCodbiApplicability(cleanedJson: String): Pair<String, String?> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, MutableMap::class.java) as? MutableMap<String, Any>
              ?: return cleanedJson to null
      var report: String? = null
      for (key in listOf("_codbiApplicability", "codbiApplicability")) {
        if (obj.containsKey(key)) {
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
      pass2Obj.getAsJsonArray("items")?.forEach { item ->
        if (!item.isJsonObject) return@forEach
        val id =
            item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString ?: return@forEach
        modifiedById[id] = item.asJsonObject
      }

      val pass1Items = pass1Obj.getAsJsonArray("items")
      if (pass1Items != null && modifiedById.isNotEmpty()) {
        val newItems = JsonArray()
        for (item in pass1Items) {
          if (item.isJsonObject) {
            val id = item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
            newItems.add(if (id != null) modifiedById[id] ?: item else item)
          } else {
            newItems.add(item)
          }
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
          "XCheckbox",
          "XContainer",
          "XContainerInvisible",
          "XDefault",
          "XFieldSet",
          "XFooter",
          "XHeader",
          "XImage",
          "XLine",
          "XPage",
          "XSelect",
          "XSignature",
          "XSpacer",
          "XSpan",
          "XTextArea",
          "XTextField",
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
            val validatedVisibility =
                SANITIZED_VISIBILITY_PROPS.mapNotNull { key ->
                  val v = props.get(key) ?: return@mapNotNull null
                  val sanitized = sanitizeVisibilityProp(key, v) ?: return@mapNotNull null
                  key to sanitized
                }
            for (key in STRIPPED_ITEM_PROPS) props.remove(key)
            for ((key, value) in validatedVisibility) props.add(key, value)
          }
          continue
        }
        val origProps = origItem.getAsJsonObject("properties") ?: continue
        val resultProps = item.getAsJsonObject("properties") ?: continue
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
        val value = if (props.get(key)?.isJsonPrimitive == true) props.get(key).asString else null
        if (value != null) {
          val attrObj = JsonObject()
          attrObj.addProperty("text", key)
          attrObj.addProperty("value", value)
          cleanAttrs.add(attrObj)
        }
        props.remove(key)
      }
    }
    return gson.toJson(result)
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
          // BayVIS standard
          "CodBi_BayVIS_" to "BayVIS",
          // Print.Removal standard
          "CodBi_Print_" to "Print.Removal",
          // UI.Panels standard
          "CodBi_UI_" to "UI.Panels")

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
      aiSetStandards: String?
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
   * Runs the workflow-creation AI call and creates the workflow task in FORMCYCLE. Unlike
   * [AIWorkflowAssistant], this method does NOT use a multi-turn context protocol: the frontend
   * already supplies [formElements] in phase 2, so a single AI call suffices.
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
    val systemPrompt = buildWorkflowSystemPrompt(formElements)

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${buildUserContent(prompt, imageParts)}}""")
      append("]")
    }

    val rawResponse = instance.performFormAssist(modelId, messagesJson)
    val cleaned = extractJson(stripThinkTags(rawResponse))
    logger.debug("[AICodBiAssistant] Workflow AI response: {}", cleaned)

    val taskSpec =
        try {
          gson.fromJson(cleaned, WorkflowTaskSpec::class.java)
        } catch (e: Exception) {
          logger.warn("[AICodBiAssistant] Could not parse workflow AI response: {}", cleaned)
          throw Exception("AI returned invalid workflow JSON: ${e.message}")
        }

    return createWorkflowTask(workflowVersionId, taskSpec, params)
  }

  /**
   * Builds the system prompt for the workflow-creation AI call. When [formContext] is provided, it
   * is embedded so the AI can match field/button names. Unlike
   * [AIWorkflowAssistant.buildSystemPrompt], there is no phase-1 "signal needed" section: the
   * frontend always supplies form elements before calling this.
   */
  private fun buildWorkflowSystemPrompt(formContext: String?): String = buildString {
    append(
        "You are a FORMCYCLE workflow assistant. The user will describe a desired workflow " +
            "action in natural language. Your ONLY output must be a single JSON object that " +
            "describes the workflow task to create. No explanation, no markdown, no code fences.\n\n")
    append(
        "Output format (JSON object with exactly these keys):\n" +
            """{"taskName":"...", "taskDescription":"...", "triggerType":"...", "triggerParams":{}, "nodeType":"...", "nodeParams":{}}""" +
            "\n\n")
    append(
        "TRIGGER TYPES (use exactly one of these string values for 'triggerType'):\n" +
            "  - \"FC_FORM_SUBMIT_BUTTON\" — fires when a submit button is clicked; " +
            "triggerParams: {\"buttonName\":\"<technical name>\"} or empty {} for any button\n" +
            "  - \"FC_MANUAL\" — manual invocation (user triggered); triggerParams: {}\n" +
            "  - \"FC_STATE_TIMER\" — fires after a delay once a record enters a state; " +
            "triggerParams: {\"durationDays\":<N>,\"durationHours\":<N>,\"durationMinutes\":<N>}\n" +
            "  - \"FC_FORM_RECORD_MESSAGE_POSTED\" — fires when an internal message is posted to the record; triggerParams: {}\n" +
            "  - \"FC_CATCH_ERROR\" — fires when an error occurs in another workflow lane; triggerParams: {}\n" +
            "  - \"FC_DOI_VERIFIED\" — fires when a double opt-in email link is confirmed; triggerParams: {}\n" +
            "  - \"FC_USER_INVOCATION\" — fires when a logged-in user manually triggers it from the record detail view; triggerParams: {}\n\n")
    append(
        "NODE TYPES (use exactly one of these string values for 'nodeType'):\n" +
            "  - \"FC_EMAIL\" — sends an email; " +
            "nodeParams: {\"to\":\"<recipient address, [%fieldname%] placeholder, or empty string \\\"\\\" if no recipient is known — NEVER substitute FC_EMPTY for a missing address>\", " +
            "\"subject\":\"<subject text>\", " +
            "\"body\":\"<email body in HTML format — ALWAYS use HTML markup: use <br> for line breaks (NOT \\\\n), <p>…</p> for paragraphs, <b>…</b> for bold, <ul>/<li> for lists; use [%fieldname%] placeholders to include form field values>\", " +
            "\"from\":\"<sender address, empty if not specified>\", \"senderName\":\"<sender display name, empty if not specified>\", " +
            "\"(do NOT include bodyFormatType — it is always set to HTML automatically)\", " +
            "\"attachments\":[\"<technicalId1>\",...] (optional — technicalIds of XUpload fields whose files to attach)}\n" +
            "  - \"FC_CHANGE_STATE\" — changes the form record state; " +
            "nodeParams: {\"stateName\":\"<FORMCYCLE status name>\"}\n" +
            "  - \"FC_HTTP_REQUEST\" — sends an HTTP request (e.g. webhook); " +
            "nodeParams: {\"url\":\"<target URL>\", \"method\":\"POST|GET|PUT|DELETE|PATCH\" (default POST), " +
            "\"body\":\"<request body, supports [%placeholder%]>\", " +
            "\"contentType\":\"JSON|PLAIN_TEXT|XML|FORM_DATA\" (default JSON), " +
            "\"headers\":[{\"name\":\"<header>\",\"value\":\"<value>\"},...] (optional)}\n" +
            "  - \"FC_CHANGE_FORM_VALUE\" — sets the value of one or more form fields; " +
            "nodeParams: {\"formValues\":[{\"name\":\"<technicalId>\",\"value\":\"<new value>\"},...]}\n" +
            "  - \"FC_LOG_ENTRY\" — writes a log message to the process log; " +
            "nodeParams: {\"message\":\"<log text, supports [%placeholder%]>\", \"level\":\"INFO|WARNING|ERROR\" (default INFO)}\n" +
            "  - \"FC_REDIRECT\" — redirects the user's browser to a URL; " +
            "nodeParams: {\"url\":\"<target URL>\"}\n" +
            "  - \"FC_SET_SAVED_FLAG\" — marks the form record as saved; nodeParams: {}\n" +
            "  - \"FC_DELETE_FORM_RECORD\" — permanently deletes the current form record; nodeParams: {}\n" +
            "  - \"FC_SEND_FORM_RECORD_MESSAGE\" — sends an internal message to the record's inbox; " +
            "nodeParams: {\"message\":\"<message text, supports [%placeholder%]>\", \"senderName\":\"<optional sender name>\"}\n" +
            "  - \"FC_CREATE_TEXT_FILE\" — creates a text/JSON/XML/HTML file as an attachment; " +
            "nodeParams: {\"fileName\":\"<filename with extension>\", \"fileContent\":\"<content, supports [%placeholder%]>\", " +
            "\"contentType\":\"PLAIN_TEXT|JSON|XML|HTML\" (default PLAIN_TEXT)}\n" +
            "  - \"FC_WRITE_FORM_RECORD_ATTRIBUTES\" — writes custom key-value attributes to the record; " +
            "nodeParams: {\"attributes\":[{\"name\":\"<key>\",\"value\":\"<value>\"},...]}\n" +
            "  - \"FC_EMPTY\" — no-op placeholder node; nodeParams: {}. " +
            "WARNING: NEVER use FC_EMPTY to represent an email, state change, or any other action. " +
            "If the user requests sending an email, always use FC_EMAIL even if 'to' is unknown (set 'to' to \"\").\n\n")
    append(
        "ENDPOINT STATE (\"endpointState\" field):\n" +
            "  Every workflow lane must end with a status transition (Endpunkt).\n" +
            "  'endpointState' is the FORMCYCLE status name to set the form record to after all actions complete.\n" +
            "  Default: \"Received\" — use this unless the user specifies a different end status.\n" +
            "  Exception: if nodeType is \"FC_CHANGE_STATE\", the state change IS the endpoint; " +
            "set endpointState to the same value as nodeParams.stateName.\n\n")
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
    val triggerParamsJson = buildTriggerParamsJson(spec)
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
    workflowNodeClass.getMethod("setName", String::class.java).invoke(actionNode, spec.nodeType)
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

    fixParentOrderIndex(savedActionNode, savedRootNode, userContext)

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
      val endpointStateUuid =
          resolveStateUuid(userContext, workflowVersion, spec.endpointState)
              ?: resolveFirstStateUuid(userContext, workflowVersion)
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

  private fun buildTriggerParamsJson(spec: WorkflowTaskSpec): String? {
    return when (spec.triggerType) {
      "FC_FORM_SUBMIT_BUTTON" -> {
        val buttonName = spec.triggerParams["buttonName"] as? String ?: ""
        """{"buttonName":${gson.toJson(buttonName)}}"""
      }
      "FC_STATE_TIMER" -> {
        val days = (spec.triggerParams["durationDays"] as? Number)?.toLong() ?: 0L
        val hours = (spec.triggerParams["durationHours"] as? Number)?.toInt() ?: 0
        val minutes = (spec.triggerParams["durationMinutes"] as? Number)?.toInt() ?: 0
        """{"durationDays":$days,"durationHours":$hours,"durationMinutes":$minutes,"durationSeconds":0}"""
      }
      else -> "{}" // FC_MANUAL and others use empty params
    }
  }

  private fun buildNodeParamsJson(
      spec: WorkflowTaskSpec,
      workflowVersion: Any? = null,
      userContext: Any? = null
  ): String? {
    return when (spec.nodeType) {
      "FC_EMAIL" -> {
        val to = spec.nodeParams["to"] as? String ?: ""
        val subject = spec.nodeParams["subject"] as? String ?: ""
        val body = spec.nodeParams["body"] as? String ?: ""
        val from = spec.nodeParams["from"] as? String ?: ""
        val senderName = spec.nodeParams["senderName"] as? String ?: ""
        @Suppress("UNCHECKED_CAST")
        val attachments =
            (spec.nodeParams["attachments"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
        val bodyFormatType = "HTML"
        val toJson = if (to.isNotBlank()) "[${gson.toJson(to)}]" else "[]"
        val multiFileJson =
            if (attachments.isNotEmpty()) {
              val resourcesJson =
                  attachments.joinToString(",") { id ->
                    """{"type":"UPLOAD","identifier":${gson.toJson(id)}}"""
                  }
              ""","multiFile":{"resources":[$resourcesJson],"attachmentFilter":[]}"""
            } else ""
        """{"to":$toJson,"cc":[],"bcc":[],"subject":${gson.toJson(subject)},"body":${gson.toJson(body)},"plainBody":${gson.toJson(body)},"bodyFormatType":${gson.toJson(bodyFormatType)},"from":${gson.toJson(from)},"senderName":${gson.toJson(senderName)}$multiFileJson}"""
      }
      "FC_CHANGE_STATE" -> {
        val stateName = spec.nodeParams["stateName"] as? String ?: ""
        val stateUuid =
            if (workflowVersion != null && userContext != null)
                resolveStateUuid(userContext, workflowVersion, stateName)
            else null
        if (stateUuid != null) {
          """{"targetState":{"uuid":${gson.toJson(stateUuid.toString())},"entityClass":"de.xima.fc.entities.WorkflowState"}}"""
        } else {
          """{"targetState":null}"""
        }
      }
      "FC_HTTP_REQUEST" -> {
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
        if (contentType == "FORM_DATA") {
          """{"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"FORM_DATA","sendAllFormValues":false,"requestParameters":[],"headerParameters":$headersJson,"allowInvalidCertificates":false}"""
        } else {
          """{"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"CUSTOM","customBodyContent":${gson.toJson(body)},"customBodyContentType":${gson.toJson(contentType)},"headerParameters":$headersJson,"allowInvalidCertificates":false}"""
        }
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
        """{"formValues":[${formValues.joinToString(",")}]}"""
      }
      "FC_LOG_ENTRY" -> {
        val message = spec.nodeParams["message"] as? String ?: ""
        val level = (spec.nodeParams["level"] as? String ?: "INFO").uppercase()
        """{"comments":${gson.toJson(message)},"level":${gson.toJson(level)}}"""
      }
      "FC_REDIRECT" -> {
        val url = spec.nodeParams["url"] as? String ?: ""
        """{"urlManual":${gson.toJson(url)},"queryStringValues":[]}"""
      }
      "FC_SEND_FORM_RECORD_MESSAGE" -> {
        val message = spec.nodeParams["message"] as? String ?: ""
        val senderName = spec.nodeParams["senderName"] as? String ?: ""
        """{"messageContent":${gson.toJson(message)},"senderName":${gson.toJson(senderName)}}"""
      }
      "FC_CREATE_TEXT_FILE" -> {
        val fileName = spec.nodeParams["fileName"] as? String ?: "output.txt"
        val fileContent = spec.nodeParams["fileContent"] as? String ?: ""
        val contentType = (spec.nodeParams["contentType"] as? String ?: "PLAIN_TEXT").uppercase()
        """{"fileName":${gson.toJson(fileName)},"fileContent":${gson.toJson(fileContent)},"contentType":${gson.toJson(contentType)}}"""
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
        """{"customAttributes":[${attributes.joinToString(",")}],"writeAttributesToForm":false}"""
      }
      "FC_SET_SAVED_FLAG",
      "FC_DELETE_FORM_RECORD",
      "FC_EMPTY" -> "{}"
      else -> "{}"
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

  // region Data Classes

  private data class WorkflowTaskSpec(
      val taskName: String = "",
      val taskDescription: String? = null,
      val triggerType: String = "FC_FORM_SUBMIT_BUTTON",
      val triggerParams: Map<String, Any> = emptyMap(),
      val nodeType: String = "FC_EMAIL",
      val nodeParams: Map<String, Any> = emptyMap(),
      val endpointState: String = "Received"
  )

  // endregion Data Classes
}
