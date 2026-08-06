package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.Standard
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.ExternalAiHttpException
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
import javax.persistence.EntityManager
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

    val systemPrompt = buildMainSystemPrompt()
    val userContent =
        "Instruction: $prompt\n\nCurrent form (IPersistJson):\n${slimPersistJson(persistJson)}" +
            "\n\nREMINDER: your response MUST include a top-level \"_codbiApplicability\" field as described in the system prompt."

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${gson.toJson(userContent)}}""")
      append("]")
    }

    logger.debug(
        "[AIFormAssistant] Sending form AI request — system prompt: {} chars, CodBi section present: {}",
        systemPrompt.length,
        systemPrompt.contains("CODBI CANDIDATE REVIEW"))
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
    var cleaned = extractJson(withoutThinkTags)

    fun rerunWithCodbiDetails(requested: List<String>, widgets: List<String>): String {
      val pass1Obj =
          try {
            JsonParser.parseString(cleaned).asJsonObject
          } catch (_: Exception) {
            null
          }
      // Pass-1 may have returned a `need_codbi_details` request instead of the modified form —
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
        // Blind rethink pass: AI previously concluded nothing applies — ask it to reconsider.
        // Use the full compact API reference (including parameter names) so the AI can
        // generate correct data-cb-* parameter attributes instead of inventing names.
        val rethinkSystemPrompt = loadCodbiRethinkPrompt()
        logger.info(
            "[AIFormAssistant] Blind rethink pass — sending {} item(s) with compact CodBi reference (system-only)",
            allItems.size())
        if (allItems.size() == 0) {
          logger.warn(
              "[AIFormAssistant] Blind rethink pass has 0 items — pass-1 items array may be missing or empty")
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

        val applySystemPrompt = loadCodbiApplyPrompt(requested, widgets)
        val pass2UserContent =
            "Original user request: ${gson.toJson(prompt)}\n\n" +
                "Complete current form (IPersistJson):\n${slimPersistJson(formBase)}\n\n" +
                (if (candidateClause.isNotBlank())
                    "Apply these CodBi functionalities: $candidateClause\n"
                else "") +
                "Create/add any requested formcycle widgets using the EXACT JSON structures in the system prompt " +
                "(property names like \"name\", \"id\", \"label\", \"datatype\", \"fullwidth\" — never invent properties " +
                "such as \"displayText\" or \"technicalId\"), " +
                "nesting them into the correct container's \"elements\" array (by element name) and listing every " +
                "element as a separate item in the root \"items\" array.\n" +
                "REBUILD any formcycle widgets you created in the previous step so they exactly match the JSON " +
                "templates provided.\n" +
                "Return the COMPLETE modified form JSON with ALL items — never drop existing elements."

        logger.info(
            "[AIFormAssistant] Pass-2 CodBi — candidates: {}, targetIds: {}, sending {} item(s)",
            candidateClause,
            if (targetElementIds.isEmpty()) "<none from pass-1>"
            else targetElementIds.joinToString(", "),
            targetItems.size())
        if (targetItems.size() == 0) {
          logger.warn(
              "[AIFormAssistant] Pass-2 has 0 items to send — pass-1 items array may be missing or empty")
        }

        retryMessagesJson = buildString {
          append("[")
          append("""{"role":"system","content":${gson.toJson(applySystemPrompt)}},""")
          append("""{"role":"user","content":${gson.toJson(pass2UserContent)}}""")
          append("]")
        }
      }

      val retryRaw =
          try {
            instance.performFormAssist(modelId, retryMessagesJson)
          } catch (e: ExternalAiHttpException) {
            logger.warn("[AIFormAssistant] Full-detail rerun AI HTTP {}: {}", e.httpStatus, e.body)
            throw e
          } catch (e: Exception) {
            logger.error("[AIFormAssistant] Full-detail rerun failed", e)
            throw e
          }
      val pass2Cleaned = extractJson(stripThinkTags(retryRaw))
      logger.info("[AIFormAssistant] Pass-2 raw result: {}", pass2Cleaned)
      // Splice into the form base (the original form when pass-1 was a details request) so new
      // widgets created in pass-2 are preserved in the returned form.
      return splicePass2IntoPass1(formBase, pass2Cleaned)
    }

    // Normalize _codbiApplicability before any extraction logic: the AI often puts
    // "Matomo.Tracking" in considered/applied instead of "Holistic.Matomo.Tracking"
    // (Rule 10c). Correct this server-side by replacing the ID in the raw JSON so that
    // all downstream extraction functions see the correct value.
    cleaned = normalizeMatomoTrackingInRawJson(cleaned)

    val requestedDetails = extractCodbiDetailsRequest(cleaned)
    if (requestedDetails != null) {
      logger.info(
          "[AIFormAssistant] AI requested CodBi details for: {} — rerunning with full compact API",
          requestedDetails.elements.ifEmpty { listOf("<unspecified>") }.joinToString(", "))
      if (!requestedDetails.applicabilityReport.isNullOrBlank()) {
        logger.info(
            "[AIFormAssistant] AI CodBi applicability report (detail request): {}",
            requestedDetails.applicabilityReport)
      }

      cleaned =
          try {
            rerunWithCodbiDetails(requestedDetails.elements, requestedDetails.widgets)
          } catch (e: ExternalAiHttpException) {
            return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
          } catch (e: Exception) {
            return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
          }
    } else {
      // If the AI created formcycle widgets in pass-1 WITHOUT requesting their details first, their
      // exact JSON templates were never provided and the AI hallucinated the persist structure.
      // Force pass-2 to include those widget templates so the widgets are rebuilt correctly.
      val createdWidgets = extractNewWidgetClassNames(cleaned, persistJson)
      if (createdWidgets.isNotEmpty()) {
        logger.info(
            "[AIFormAssistant] Pass-1 created new formcycle widget(s) without details request — including templates in pass-2: {}",
            createdWidgets.joinToString(", "))
      }
      val appliedCodbi = extractAppliedCodbiIds(cleaned).filterNot { it == "Matomo.Tracking" }
      if (appliedCodbi.isNotEmpty()) {
        logger.warn(
            "[AIFormAssistant] AI applied CodBi functionalities without requesting details first; forcing detail rerun for: {}",
            appliedCodbi.joinToString(", "))
        cleaned =
            try {
              rerunWithCodbiDetails(appliedCodbi, createdWidgets)
            } catch (e: ExternalAiHttpException) {
              return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
            } catch (e: Exception) {
              return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
            }
      } else {
        val consideredCodbi =
            extractConsideredCodbiIds(cleaned).filterNot { it == "Matomo.Tracking" }
        if (consideredCodbi.isNotEmpty()) {
          logger.info(
              "[AIFormAssistant] AI identified CodBi candidates but did not escalate; forcing detail rerun for: {}",
              consideredCodbi.joinToString(", "))
          cleaned =
              try {
                rerunWithCodbiDetails(consideredCodbi, createdWidgets)
              } catch (e: ExternalAiHttpException) {
                return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
              } catch (e: Exception) {
                return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
              }
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
          if (jsonDeclaresNothingApplies(cleaned) || rawClaimsNothingApplies(withoutThinkTags)) {
            logger.info(
                "[AIFormAssistant] AI declared/stated no CodBi element applies — skipping blind reconsideration ({})",
                reason)
          } else {
            logger.info("[AIFormAssistant] AI {} — triggering blind CodBi evaluation pass", reason)
            cleaned =
                try {
                  rerunWithCodbiDetails(emptyList(), createdWidgets)
                } catch (e: ExternalAiHttpException) {
                  return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
                } catch (e: Exception) {
                  return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
                }
          }
        }
      }
    }

    val (sanitizedCleaned, applicabilityReport) = extractAndStripCodbiApplicability(cleaned)
    if (!applicabilityReport.isNullOrBlank()) {
      logger.info("[AIFormAssistant] AI CodBi applicability report: {}", applicabilityReport)
    } else {
      logger.warn("[AIFormAssistant] AI response contains no CodBi applicability report")
    }

    return try {
      val parsed = JsonParser.parseString(sanitizedCleaned)
      warnUnknownClassNames(parsed)
      val merged = restoreStrippedFields(sanitizedCleaned, persistJson)
      jsonResponse(merged)
    } catch (_: Exception) {
      jsonResponse(
          """{"error":"AI returned invalid JSON","raw":${gson.toJson(sanitizedCleaned)}}""")
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
            "keine funktionalität anwendbar",
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
          "XContainerInvisible",
          "XDefault",
          "XFieldSet",
          "XFooter",
          "XHeader",
          "XImage",
          "XLine",
          "XLanguageSwich",
          "XNavigationBar",
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
          // Attributes — stripped to prevent stale data-cb-* entries from surviving when items
          // are restored in restoreStrippedFields. The AI always outputs fresh data-cb-* as
          // direct property keys, which are converted to the proper attributes array at the end
          // of restoreStrippedFields.
          "attributes",
          "print_hide",
          "print_size",
          "print_text_only",
          "print_break",
          "backgroundcolor",
          "helptext",
          "comment",
          "pdfImporterId",
          "rowid",
          "computedwidth",
          "maxwidth",
          "minwidth",
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
    // Overlay every non-stripped top-level field from the AI result. Global variables are merged
    // separately (by name) so pre-existing entries the AI did not touch are preserved.
    for (entry in aiObj.entrySet()) {
      if (entry.key == "variables") continue
      if (entry.key !in STRIPPED_FIELDS) {
        result.add(entry.key, entry.value)
      }
    }
    mergeFormVariables(result, aiObj)
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
            for (key in STRIPPED_ITEM_PROPS) props.remove(key)
            for ((key, value) in validatedVisibility) props.add(key, value)
          }
          continue
        }
        val origProps = origItem.getAsJsonObject("properties") ?: continue
        val resultProps = item.getAsJsonObject("properties") ?: continue
        // Promote any data-cb-* entries from the AI's attributes array to direct property
        // keys BEFORE restoring the original attributes (which may be empty). This mirrors
        // the promotion done for new items and handles cases where the AI outputs attributes
        // in the array format rather than as direct property keys.
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
        // Also restore any other keys that were pruned as empty (preserve original values)
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
        // For new XTextField date fields: always enable the datepicker calendar widget,
        // overriding any base-template default of "0".
        if (className == "XTextField" &&
            (itemProps.get("datatype")?.asString ?: "").startsWith("date")) {
          itemProps.addProperty("datepicker", "1")
        }
        // Set parentid from the container's elements reference
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
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val attrs =
          if (props.has("attributes") && props.get("attributes").isJsonArray)
              props.getAsJsonArray("attributes")
          else null
      // Purge any stale data-cb-* entries from the existing attributes array
      // (may have been restored from the original form). Build a filtered array by copying
      // only non-data-cb-* entries.
      if (attrs != null && attrs.size() > 0) {
        val filtered = JsonArray()
        for (e in attrs) {
          val isStaleCb =
              e.isJsonObject &&
                  e.asJsonObject.get("text")?.isJsonPrimitive == true &&
                  e.asJsonObject.get("text").asString.startsWith("data-cb-")
          if (!isStaleCb) filtered.add(e)
        }
        props.add("attributes", filtered)
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
              "[AIFormAssistant] Normalized data-cb-func=print.remove to CSS class 'CodBi_Print_Remove_Tagged'")
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
   * example, `\u003e` (Unicode escape for `>`) is decoded to `>`.
   */
  private fun decodeUnicodeEscapes(value: String): String {
    return value.replace(Regex("\\\\u([0-9a-fA-F]{4})")) { matchResult ->
      val hex = matchResult.groupValues[1]
      Integer.parseInt(hex, 16).toChar().toString()
    }
  }

  private fun splicePass2IntoPass1(pass1: String, pass2: String): String {
    // Merge pass2 modifications into pass1: replace pass1 items with pass2 versions by id,
    // add new items from pass2, and overlay pass2 top-level fields (e.g. _codbiApplicability).
    try {
      val obj1 = JsonParser.parseString(pass1).asJsonObject
      val obj2 = JsonParser.parseString(pass2).asJsonObject

      // Build a lookup of pass2 items by their id, for replacing pass1 items with updated versions
      val modifiedById = mutableMapOf<String, JsonObject>()
      val pass2Ids = mutableSetOf<String>()
      obj2.getAsJsonArray("items")?.forEach { item ->
        if (!item.isJsonObject) return@forEach
        val id =
            item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString ?: return@forEach
        pass2Ids.add(id)
        modifiedById[id] = item.asJsonObject
      }

      // A pass-2 that returns a single bare element (e.g. a newly created XContainer/XTextField)
      // instead of a full form: append it to the form items and reference it from the first page
      // so the created widget is preserved instead of being silently dropped.
      if (!obj2.has("items") && obj2.has("className")) {
        val items = obj1.getAsJsonArray("items") ?: JsonArray().also { obj1.add("items", it) }
        val newName = obj2.getAsJsonObject("properties")?.get("name")?.asString
        items.add(obj2)
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

      val pass1Items = obj1.getAsJsonArray("items")
      if (pass1Items != null && modifiedById.isNotEmpty()) {
        val newItems = JsonArray()
        val pass1Ids = mutableSetOf<String>()
        for (item in pass1Items) {
          if (item.isJsonObject) {
            val id = item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
            if (id != null) {
              pass1Ids.add(id)
              // Replace with pass2 version if modified, otherwise keep pass1 item
              newItems.add(modifiedById[id] ?: item)
            } else {
              newItems.add(item)
            }
          } else {
            newItems.add(item)
          }
        }
        // Add new items from pass2 that did not exist in pass1
        for ((id, item) in modifiedById) {
          if (id !in pass1Ids) {
            newItems.add(item)
          }
        }
        obj1.add("items", newItems)
      }

      // Merge other top-level fields from pass2 that are not present in pass1
      for ((key, value) in obj2.entrySet()) {
        if (key == "items") continue
        if (!obj1.has(key)) {
          obj1.add(key, value)
        }
      }
      // Preserve global variables the AI set in pass-2 (e.g. standard-configuration globals such
      // as USGrade) by merging the pass-2 `variables` array into the pass-1 base by name.
      mergeFormVariables(obj1, obj2)
      return gson.toJson(obj1)
    } catch (e: Exception) {
      logger.warn("[AIFormAssistant] splicePass2IntoPass1 failed: {}", e.message)
      return pass2
    }
  }

  private fun jsonResponse(json: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.JSON, json))

  /**
   * Builds the main system prompt by loading categorized sections from the database. Falls back to
   * a minimal inline prompt if the DB is unavailable.
   */
  private fun buildMainSystemPrompt(): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_FORM_SYSTEM_PROMPT
    try {
      val categories =
          PromptLoader.loadCategory(em, "formcycle") + PromptLoader.loadCategory(em, "codbi")
      val taskInstruction =
          "You receive a partial form JSON (IPersistJson) and a natural language instruction. " +
              "MODIFY the form according to the instruction and return the COMPLETE modified form JSON. " +
              "Do NOT ask for more details — the user's instruction and the form data below are sufficient.\n\n"
      // Pass-1 uses ONLY the condensed references (element/widget names + purposes) plus the
      // general rules. The parameter-complete sections (codbi.standard_configurations /
      // codbi.functionalities / codbi.element_placeholders) are intentionally NOT included here:
      // codbi-general.md tells the AI to request the exact JSON templates for exactly the
      // elements/widgets it needs, and the server returns only those in pass-2. Sending the full
      // detailed sections here would roughly double the token usage per request without changing
      // the outcome (the AI requests details regardless).
      return PromptLoader.resolvePlaceholders(
          taskInstruction +
              (categories["formcycle.general"] ?: "") +
              "\n" +
              "{{FORMCYCLE_WIDGETS_SECTION}}" +
              "\n" +
              (categories["codbi.general"] ?: "") +
              "\n" +
              "{{CODBI_ELEMENTS_SECTION}}")
    } catch (e: Exception) {
      logger.warn("[AIFormAssistant] Failed to load prompts from DB", e)
      return FALLBACK_FORM_SYSTEM_PROMPT
    } finally {
      em?.close()
    }
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
      logger.warn("[AIFormAssistant] Failed to load rethink prompt", e)
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
      widgetIds: List<String> = emptyList()
  ): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_APPLY_PROMPT
    try {
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
      val widgetPart = buildWidgetDetailsSection(em, widgetIds)
      return base + "\n\n" + codbiPart + "\n\n" + widgetPart
    } catch (e: Exception) {
      logger.warn("[AIFormAssistant] Failed to load apply prompt", e)
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
    /** Fallback system prompt used when the database is unavailable. */
    private const val FALLBACK_FORM_SYSTEM_PROMPT =
        "You are a FORMCYCLE form structure assistant. " +
            "You receive a partial IPersistJson object and a natural language instruction. " +
            "Your ONLY output must be the same partial IPersistJson â€” modified according " +
            "to the instruction â€” as a raw JSON object. No explanation, no markdown, no code fences. " +
            "Every generated element MUST carry a meaningful, human-readable 'label' describing its " +
            "purpose in the language of the user's request â€” never the generic value \"Label\" or \"Example\"."

    private const val FALLBACK_RETHINK_PROMPT =
        "You are a CodBi form element configurator. Review the form elements and apply " +
            "relevant CodBi functionalities (data-cb-func, CSS classes)."

    private const val FALLBACK_APPLY_PROMPT =
        "You are a CodBi form element configurator. Apply the listed CodBi functionalities " +
            "to the appropriate form elements with correct data-cb-* parameters."
  }
}
