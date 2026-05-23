package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.Standard
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.ExternalAiHttpException
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.stripThinkTags
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
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
 * - `formElements` — JSON array of form elements (required when intent is "workflow" or "both")
 * - `workflowVersionId` — numeric ID of the active WorkflowVersion (required when intent is
 *   "workflow" or "both") The servlet runs the form-modification AI and/or the workflow-creation AI
 *   in sequence, then returns a combined JSON response:
 *   `{"intent":"...","formJson":{...},"workflowMessage":"..."}` (keys present only as applicable).
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

    // Phase 1 — classify intent
    if (phase == "1") {
      val intent =
          try {
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
            runFormModification(prompt, persistJson, modelId, instance)
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
                prompt, latestFormElements, workflowVersionId, modelId, params, instance)
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
  private fun classifyIntent(prompt: String, modelId: String, instance: Standard): String {
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
      append("""{"role":"user","content":${gson.toJson(prompt)}}""")
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
      instance: Standard
  ): String {
    val systemPrompt = buildFormSystemPrompt()
    val userContent =
        "Instruction: $prompt\n\nCurrent form (IPersistJson):\n${slimPersistJson(persistJson)}"

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${gson.toJson(userContent)}}""")
      append("]")
    }

    val rawResponse = instance.performFormAssist(modelId, messagesJson)
    val cleaned = extractJson(stripThinkTags(rawResponse))
    logger.debug("[AICodBiAssistant] Form AI response: {}", cleaned)

    return try {
      val parsed = JsonParser.parseString(cleaned)
      warnUnknownClassNames(parsed)
      restoreStrippedFields(cleaned, persistJson)
    } catch (_: Exception) {
      """{"error":"AI returned invalid JSON","raw":${gson.toJson(cleaned)}}"""
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
          "4. Assign unique, descriptive values to new items' 'properties.name'. Use type-appropriate prefixes: \n" +
          "   'tf' for XTextField/XTextArea (e.g. 'tfVorname', 'tfEmail'), \n" +
          "   'fd' for XUpload (e.g. 'fdLebenslauf'), \n" +
          "   'sel' for XSelect, 'cb' for XCheckbox, 'btn' for XButtonList buttons, \n" +
          "   'sig' for XSignature.\n" +
          "5. Valid FORMCYCLE element className values (use ONLY these exact strings):\n" +
          "   - XTextField   — single-line text input\n" +
          "   - XTextArea    — multi-line text input\n" +
          "   - XUpload      — file upload / file download field\n" +
          "   - XSelect      — dropdown / select list; use 'options' array for static items\n" +
          "   - XCheckbox    — checkbox (note: lowercase 'b')\n" +
          "   - XButtonList  — button or button group; no label; 'buttons' array contains button objects each with: " +
          "'name' (technical ID), 'value' (display text, may be HTML), 'action' object; " +
          "for a form-submit button: action.page=\"submit\", action.check=true; " +
          "for no-action button: omit action or set action.page=\"\"\n" +
          "   - XSpan        — static text / label; text content goes in 'rtevalue', NOT 'label'\n" +
          "   - XImage       — image element\n" +
          "   - XFieldSet    — fieldset / group container; title goes in 'legend', NOT 'label'\n" +
          "   - XContainer   — generic layout container; has no 'label' property\n" +
          "   - XSignature   — signature pad\n" +
          "   - XAppointment — date / appointment picker\n" +
          "   - XLine        — horizontal divider; has no 'label' property\n" +
          "   - XSpacer      — empty spacer; has no 'label' property\n" +
          "   - XPage        — form page (top-level)\n" +
          "   - XHeader      — form header\n" +
          "   - XFooter      — form footer\n" +
          "   Do NOT invent class names. Use ONLY the names listed above.\n" +
          "6. A 'download/upload field' in FORMCYCLE is className XUpload (NOT XFileUpload).\n" +
          "7. When creating a new item: if the form already contains an item of the same className, " +
          "copy its properties structure exactly and adapt name, id, label, and type-specific values. " +
          "If no item of that type exists yet, use the matching minimal template from ITEM TEMPLATES below.\n" +
          "8. Do NOT include 'css', 'script', 'image', 'images', 'pagePreview', 'rendered', " +
          "'formI18n', or 'metadata' fields — they are handled separately and will be merged back.\n" +
          "9. Output ONLY valid JSON. No trailing commas. No comments.\n\n" +
          "ITEM TEMPLATES — minimal valid structure for each className (adapt name/id/label):\n" +
          """{"className":"XTextField","properties":{"name":"tfExample","id":"xi-tf-example","label":"Example","required":"0","readonly":"0","placeholder":"","datatype":"","fullwidth":"0"}}""" +
          "\n" +
          """{"className":"XTextArea","properties":{"name":"tfExample","id":"xi-tf-example","label":"Example","required":"0","readonly":"0","placeholder":"","fullwidth":"0","autosize":"0"}}""" +
          "\n" +
          """{"className":"XUpload","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fileextension":"","fullwidth":"0"}}""" +
          "\n" +
          """{"className":"XSelect","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fullwidth":"0","options":[]}}""" +
          "\n" +
          """{"className":"XCheckbox","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","checkboxvalue":"1","checkedvalue":"1"}}""" +
          "\n" +
          """{"className":"XButtonList","properties":{"name":"btlExample","id":"xi-btl-example","buttons":[{"name":"btnExample","value":"Button Text","action":{"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}}]}}""" +
          "\n" +
          """{"className":"XSpan","properties":{"name":"fdExample","id":"xi-fd-example","rtevalue":"Example text"}}""" +
          "\n" +
          """{"className":"XFieldSet","properties":{"name":"fsExample","id":"xi-fs-example","legend":"Group","elements":[],"fullwidth":"0"}}""" +
          "\n" +
          """{"className":"XContainer","properties":{"name":"coExample","id":"xi-co-example","elements":[],"fullwidth":"0"}}""" +
          "\n" +
          """{"className":"XSignature","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0"}}""" +
          "\n" +
          """{"className":"XLine","properties":{"name":"liExample","id":"xi-li-example"}}""" +
          "\n" +
          """{"className":"XSpacer","properties":{"name":"spExample","id":"xi-sp-example"}}"""

  private val KNOWN_CLASS_NAMES =
      setOf(
          "XAppointment",
          "XButtonList",
          "XCheckbox",
          "XContainer",
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
          "print_hide",
          "print_size",
          "print_text_only",
          "print_break",
          "backgroundcolor",
          "cssclasses",
          "cssclasseswrapper",
          "helptext",
          "comment",
          "attributes",
          "pdfImporterId",
          "rowid",
          "computedwidth",
          "maxwidth",
          "minwidth",
      )

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
        val origItem = originalByName[name]?.asJsonObject ?: continue
        val origProps = origItem.getAsJsonObject("properties") ?: continue
        val resultProps = item.getAsJsonObject("properties") ?: continue
        for (key in STRIPPED_ITEM_PROPS) {
          val v = origProps.get(key)
          if (v != null) resultProps.add(key, v) else resultProps.remove(key)
        }
        for (entry in origProps.entrySet()) {
          if (!resultProps.has(entry.key)) resultProps.add(entry.key, entry.value)
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
        val parentId = itemToContainerId[name]
        if (parentId != null &&
            (!itemProps.has("parentid") || itemProps.get("parentid").asString.isNullOrEmpty())) {
          itemProps.addProperty("parentid", parentId)
        }
      }
    }
    return gson.toJson(result)
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
      instance: Standard
  ): String {
    val systemPrompt = buildWorkflowSystemPrompt(formElements)

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${gson.toJson(prompt)}}""")
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
            "  - \"FC_MANUAL\" — manual invocation (user triggered); triggerParams: {}\n\n")
    append(
        "NODE TYPES (use exactly one of these string values for 'nodeType'):\n" +
            "  - \"FC_EMAIL\" — sends an email; " +
            "nodeParams: {\"to\":\"<address or [%fieldname%] placeholder>\", " +
            "\"subject\":\"<subject text>\", \"body\":\"<body text>\", " +
            "\"from\":\"<sender address, empty if not specified>\", \"senderName\":\"<sender display name, empty if not specified>\"}\n" +
            "  - \"FC_CHANGE_STATE\" — changes the form record state; " +
            "nodeParams: {\"stateName\":\"<FORMCYCLE status name>\"}\n\n")
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
            "  the 'technicalId' of the individual BUTTON whose 'displayText' matches — never use a container's id.\n\n")
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
            "\"nodeParams\":{\"to\":\"[%tfHurra%]\",\"subject\":\"Eingang\",\"body\":\"Ihr Formular wurde empfangen.\"},\"endpointState\":\"Received\"}\n\n")
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
      else -> null
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
        val toJson = if (to.isNotBlank()) "[${gson.toJson(to)}]" else "[]"
        """{"to":$toJson,"cc":[],"bcc":[],"subject":${gson.toJson(subject)},"body":${gson.toJson(body)},"bodyFormatType":"PLAIN","from":${gson.toJson(from)},"senderName":${gson.toJson(senderName)}}"""
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
      else -> null
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
