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
import org.slf4j.LoggerFactory

/**
 * AI Form Assistant — servlet that lets the form designer ask an AI to modify the current form
 * structure.
 *
 * Actions dispatched via the `X-Action` request header:
 * - **`Models`** (GET): returns the list of available AI models as a JSON array of
 *   `[{"id":"...","label":"..."}]`.
 * - **`Run`** (POST): accepts `prompt` and `persist` form parameters, sends them to the selected
 *   model (identified by the `X-Model` header), and returns the modified `IPersistJson` as raw
 *   JSON.
 *
 * Exposes the following endpoints through FORMCYCLE's HTTP stack:
 *
 *     GET   <fc>/plugin?name=CodBi_AIFormAssistant   (X-Action: Models)
 *     POST  <fc>/plugin?name=CodBi_AIFormAssistant   (X-Action: Run, X-Model: <modelId>)
 */
class AIFormAssistant : IPluginServletAction {

  private val logger = LoggerFactory.getLogger(AIFormAssistant::class.java)
  private val gson: Gson = GsonBuilder().create()

  override fun getName(): String = "CodBi_AIFormAssistant"

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val action =
        params.headerMap.entries.find { it.key.equals("X-Action", ignoreCase = true) }?.value
    return when (action) {
      "Models" -> handleModels()
      "Run" -> handleRun(params)
      else -> jsonResponse("""{"error":"Unknown action"}""")
    }
  }

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

    val persistJson =
        params.requestParameters["persist"]?.firstOrNull()
            ?: return jsonResponse("""{"error":"Missing persist"}""")

    try {
      JsonParser.parseString(persistJson)
    } catch (_: Exception) {
      return jsonResponse("""{"error":"Invalid persist JSON"}""")
    }

    val instance = Standard.instance ?: return jsonResponse("""{"error":"AI service not ready"}""")

    val systemPrompt =
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

    val userContent =
        "Instruction: $prompt\n\nCurrent form (IPersistJson):\n${slimPersistJson(persistJson)}"

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${gson.toJson(userContent)}}""")
      append("]")
    }

    val rawResponse =
        try {
          instance.performFormAssist(modelId, messagesJson)
        } catch (e: ExternalAiHttpException) {
          logger.warn("[AIFormAssistant] External AI returned HTTP {}: {}", e.httpStatus, e.body)
          return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
        } catch (e: Exception) {
          logger.error("[AIFormAssistant] AI call failed", e)
          return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
        }

    val withoutThinkTags = stripThinkTags(rawResponse)
    val cleaned = extractJson(withoutThinkTags)

    return try {
      val parsed = JsonParser.parseString(cleaned)
      warnUnknownClassNames(parsed)
      val merged = restoreStrippedFields(cleaned, persistJson)
      jsonResponse(merged)
    } catch (_: Exception) {
      jsonResponse("""{"error":"AI returned invalid JSON","raw":${gson.toJson(cleaned)}}""")
    }
  }

  /**
   * Extracts the JSON object from an AI response that may contain explanation text, code fences
   * anywhere in the string, or leading/trailing whitespace.
   *
   * Strategy (first match wins):
   * 1. Extract the content inside a ` ```json … ``` ` or ` ``` … ``` ` fence anywhere in the text.
   * 2. Find the first `{` and its matching `}` (balanced-brace scan) and return that substring.
   * 3. Return the trimmed text as-is (lets the JSON parser produce a meaningful error).
   */
  private fun extractJson(text: String): String {
    val s = text.trim()

    // 1. Code-fence extraction (anywhere in the string, not just prefix/suffix)
    val fenceRegex = Regex("```(?:json)?\\s*\\n?([\\s\\S]*?)\\n?```")
    fenceRegex.find(s)?.groups?.get(1)?.value?.trim()?.let { candidate ->
      if (candidate.startsWith("{")) return candidate
    }

    // 2. Balanced-brace extraction — finds the outermost {...} block
    val start = s.indexOf('{')
    if (start >= 0) {
      var depth = 0
      var inString = false
      var escape = false
      for (i in start until s.length) {
        val c = s[i]
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
        if (inString) continue
        if (c == '{') depth++
        if (c == '}') {
          depth--
          if (depth == 0) return s.substring(start, i + 1)
        }
      }
    }

    // 3. Fallback — return as-is
    return s
  }

  /**
   * All class names that are valid FORMCYCLE form-item types (from `IPropertiesMap` in
   * `@de-xima/fc-form-designer`). Used to detect AI hallucinations in the returned JSON.
   */
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

  /**
   * Logs a WARN for every item in the AI response whose `className` is not in [KNOWN_CLASS_NAMES].
   */
  private fun warnUnknownClassNames(element: JsonElement) {
    val items = element.takeIf { it.isJsonObject }?.asJsonObject?.getAsJsonArray("items") ?: return
    items.forEach { el ->
      if (!el.isJsonObject) return@forEach
      val className = el.asJsonObject.get("className")?.takeIf { it.isJsonPrimitive }?.asString
      if (className != null && className !in KNOWN_CLASS_NAMES) {
        logger.warn(
            "[AIFormAssistant] AI used unknown className '{}' — item will not render correctly",
            className)
      }
    }
  }

  /**
   * Top-level fields that are large and structurally irrelevant for the AI: stylesheets, scripts,
   * base64 images, rendered HTML, page previews, per-language i18n maps, metadata, and the `base`
   * map (per-element base-property overrides that the AI never needs to read or write). They are
   * removed before sending the form to the AI and restored from the original afterwards.
   */
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

  /**
   * Item-level property keys that are always stripped from each item's `properties` object before
   * sending to the AI. These are either styling/print directives, permission conditions, or
   * per-item i18n overrides — none of which the AI needs to understand form structure.
   */
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

  /**
   * Returns a copy of [json] with [STRIPPED_FIELDS] removed and empty/default values pruned from
   * each item's `properties` object.
   */
  private fun slimPersistJson(json: String): String {
    val root = JsonParser.parseString(json).asJsonObject
    for (field in STRIPPED_FIELDS) root.remove(field)
    root.getAsJsonArray("items")?.forEach { el ->
      if (!el.isJsonObject) return@forEach
      val props = el.asJsonObject.getAsJsonObject("properties") ?: return@forEach
      // Remove known-irrelevant keys
      for (key in STRIPPED_ITEM_PROPS) props.remove(key)
      // Remove remaining empty strings, empty arrays, and empty objects
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
   * Merges the AI result back into the original form JSON. Starts from the **original** as the base
   * so that all required top-level fields (`lang`, `version`, `variables`, etc.) are always present
   * even if the AI omitted them. Then overlays every non-stripped top-level field from the AI
   * result, restores stripped item-level properties, and adds back any original items the AI
   * dropped.
   */
  private fun restoreStrippedFields(aiResult: String, original: String): String {
    val aiObj = JsonParser.parseString(aiResult).asJsonObject
    // Start from the original — preserves lang, version, variables, and all other required fields
    val result = JsonParser.parseString(original).asJsonObject
    // Save reference to original items before they may be replaced by the AI's items
    val originalItems = result.getAsJsonArray("items")
    // Overlay every non-stripped top-level field from the AI result
    for (entry in aiObj.entrySet()) {
      if (entry.key !in STRIPPED_FIELDS) {
        result.add(entry.key, entry.value)
      }
    }
    // result.items is now the AI's items array (if AI included it) or the original (if not)
    val resultItems: JsonArray =
        result.getAsJsonArray("items") ?: JsonArray().also { result.add("items", it) }
    // Fix common AI mistake: className placed inside properties instead of at top level
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
      // Build a map of itemName -> original container name, for restoring dropped element refs
      val originalContainerOfItem = mutableMapOf<String, String>()
      for ((containerName, el) in originalByName) {
        val elements =
            el.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements") ?: continue
        for (ref in elements) {
          if (ref.isJsonPrimitive) originalContainerOfItem[ref.asString] = containerName
        }
      }
      // Restore stripped item-level properties for each item the AI kept
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
        // Also restore any other keys that were pruned as empty (preserve original values)
        for (entry in origProps.entrySet()) {
          if (!resultProps.has(entry.key)) resultProps.add(entry.key, entry.value)
        }
      }
      // Add back any original items the AI dropped — AI must not remove existing items
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
          logger.debug("[AIFormAssistant] Restored original item '{}' dropped by AI", name)
          // Also restore the element reference in its original container
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
                  "[AIFormAssistant] Restored element ref '{}' in container '{}'",
                  name,
                  containerName)
            }
          }
        }
      }
      // Fill in base template properties for NEW items (not in original) and set parentid.
      // FORMCYCLE does not auto-apply base defaults at load time, so new items need all props
      // explicitly set (flex, computedwidth, labeldir, etc.) or they render as invisible.
      val baseObj = result.getAsJsonObject("base")
      // Build map: item name → parent container id (from elements arrays in resultItems)
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
        if (name in originalByName) continue // existing item — already handled above
        val className = item.get("className")?.asString ?: continue
        val baseProps =
            baseObj?.getAsJsonObject(className)?.getAsJsonObject("properties") ?: continue
        val itemProps = item.getAsJsonObject("properties") ?: continue
        // Merge base template properties that the AI omitted
        for (entry in baseProps.entrySet()) {
          if (!itemProps.has(entry.key)) itemProps.add(entry.key, entry.value)
        }
        // Set parentid from the container's elements reference
        val parentId = itemToContainerId[name]
        if (parentId != null &&
            (!itemProps.has("parentid") || itemProps.get("parentid").asString.isNullOrEmpty())) {
          itemProps.addProperty("parentid", parentId)
        }
      }
    }
    return gson.toJson(result)
  }

  private fun jsonResponse(json: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.JSON, json))
}
