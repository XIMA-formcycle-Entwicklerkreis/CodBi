package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.Standard
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.ExternalAiHttpException
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.stripThinkTags
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.util.UUID
import org.slf4j.LoggerFactory

/**
 * AI Workflow Assistant — servlet that lets the form designer ask an AI to create or modify
 * workflow strands (Ablaufpläne) for a FORMCYCLE form project.
 *
 * The AI produces a JSON description of the desired workflow action. The servlet then uses
 * FORMCYCLE's entity API (via reflection, because fc-api / fc-common are provided-scope) to persist
 * the requested workflow task into the active WorkflowVersion of the given project.
 *
 * Actions dispatched via the `X-Action` request header:
 * - **`Models`** (GET): returns the list of available AI models.
 * - **`Run`** (POST): accepts `prompt` + `projectId` + `X-Model`; calls the AI; creates workflow.
 *
 * Exposes the following endpoints through FORMCYCLE's HTTP stack:
 *
 *     GET   <fc>/plugin?name=CodBi_AIWorkflowAssistant   (X-Action: Models)
 *     POST  <fc>/plugin?name=CodBi_AIWorkflowAssistant   (X-Action: Run, X-Model: <modelId>)
 */
class AIWorkflowAssistant : IPluginServletAction {

  private val logger = LoggerFactory.getLogger(AIWorkflowAssistant::class.java)
  private val gson: Gson = GsonBuilder().create()

  override fun getName(): String = "CodBi_AIWorkflowAssistant"

  companion object {
    /**
     * Default sender address for FC_EMAIL workflow nodes. Set via plugin property
     * AI_Workflow_DefaultFromEmail.
     */
    @Volatile var defaultFromEmail: String = ""
  }

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

    val workflowVersionIdStr =
        params.requestParameters["workflowVersionId"]?.firstOrNull()
            ?: return jsonResponse("""{"error":"Missing workflowVersionId"}""")

    val workflowVersionId =
        workflowVersionIdStr.toLongOrNull()
            ?: return jsonResponse("""{"error":"Invalid workflowVersionId (must be a number)"}""")

    val instance = Standard.instance ?: return jsonResponse("""{"error":"AI service not ready"}""")

    // Multi-turn context-fetching protocol:
    //   Phase 1 — AI call with just the prompt; if the AI signals it needs form or workflow
    //             data (via {"need":"form_data"} etc.) the servlet returns a status signal to
    //             the frontend so it can show a status message and send a second request.
    //   Phase 2 — The frontend re-sends the same prompt with phase=2 and includeFormData /
    //             includeWorkflowData flags. The servlet fetches the requested context
    //             server-side, enriches the system prompt, and calls the AI a second time.
    val phase = params.requestParameters["phase"]?.firstOrNull() ?: "1"
    val wantsFormData = params.requestParameters["includeFormData"]?.firstOrNull() == "true"
    val wantsWorkflowData = params.requestParameters["includeWorkflowData"]?.firstOrNull() == "true"
    // formElements is sent directly by the frontend (from designer.getPersist()) and takes
    // priority over a server-side DB query. Falls back to fetchFormContext only when absent.
    val frontendFormElements = params.requestParameters["formElements"]?.firstOrNull()

    val formContext: String? =
        if (phase == "2" && (wantsFormData || frontendFormElements != null)) {
          when {
            !frontendFormElements.isNullOrBlank() -> {
              logger.info(
                  "[AIWorkflowAssistant] Using frontend-provided form elements for workflowVersion {}: {}",
                  workflowVersionId,
                  frontendFormElements)
              frontendFormElements
            }
            else ->
                try {
                  fetchFormContext(workflowVersionId, getUserContext(params))
                } catch (e: Exception) {
                  logger.warn("[AIWorkflowAssistant] Could not fetch form context", e)
                  null
                }
          }
        } else null

    val workflowContext: String? =
        if (phase == "2" && wantsWorkflowData) {
          try {
            fetchWorkflowContext(workflowVersionId, getUserContext(params))
          } catch (e: Exception) {
            logger.warn("[AIWorkflowAssistant] Could not fetch workflow context", e)
            null
          }
        } else null

    val userContext = getUserContext(params)
    val completionPagesJson: String? =
        try {
          fetchCompletionPages(userContext, workflowVersionId)
        } catch (e: Exception) {
          logger.warn("[AIWorkflowAssistant] Could not fetch completion pages", e)
          null
        }
    val htmlTemplatesJson: String? =
        try {
          fetchHtmlTemplates(userContext, workflowVersionId)
        } catch (e: Exception) {
          logger.warn("[AIWorkflowAssistant] Could not fetch HTML templates", e)
          null
        }
    val urlTemplatesJson: String? =
        try {
          fetchUrlTemplates(userContext, workflowVersionId)
        } catch (e: Exception) {
          logger.warn("[AIWorkflowAssistant] Could not fetch URL templates", e)
          null
        }
    logger.info(
        "[AIWorkflowAssistant] handleRun: phase={}, completionPages={}, htmlTemplates={}, urlTemplates={}",
        phase,
        completionPagesJson ?: "null (no pages found or query failed)",
        htmlTemplatesJson ?: "null (no templates found or query failed)",
        urlTemplatesJson ?: "null (no URL templates found or query failed)")

    val systemPrompt =
        buildSystemPrompt(
            formContext,
            workflowContext,
            isPhase1 = phase == "1",
            completionPages = completionPagesJson,
            htmlTemplates = htmlTemplatesJson,
            urlTemplates = urlTemplatesJson)

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${gson.toJson(prompt)}}""")
      append("]")
    }

    val rawResponse =
        try {
          instance.performFormAssist(modelId, messagesJson)
        } catch (e: ExternalAiHttpException) {
          logger.warn(
              "[AIWorkflowAssistant] External AI returned HTTP {}: {}", e.httpStatus, e.body)
          return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
        } catch (e: Exception) {
          logger.error("[AIWorkflowAssistant] AI call failed", e)
          return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
        }

    val cleaned = extractJson(stripThinkTags(rawResponse))
    logger.info("[AIWorkflowAssistant] AI response (phase {}): {}", phase, cleaned)

    // Phase 1 only: check if the AI is signalling that it needs more context before answering.
    if (phase == "1") {
      val needSignal = detectContextNeed(cleaned)
      if (needSignal != null) {
        logger.info("[AIWorkflowAssistant] AI requests additional context: {}", needSignal)
        return jsonResponse("""{"status":"$needSignal"}""")
      }
    }

    val taskSpec =
        try {
          gson.fromJson(cleaned, WorkflowTaskSpec::class.java).also { spec ->
            if (spec.nodeType == "FC_DOI_INIT") {
              logger.info(
                  "[AIWorkflowAssistant] DOI workflow task spec: nodeType=FC_DOI_INIT, failurePage='{}', all nodeParams keys={}",
                  spec.nodeParams["failurePage"] ?: "<NOT SET BY AI>",
                  spec.nodeParams.keys)
            } else {
              logger.info("[AIWorkflowAssistant] Workflow task spec: nodeType={}", spec.nodeType)
            }
          }
        } catch (e: Exception) {
          logger.warn("[AIWorkflowAssistant] Could not parse AI response as JSON: {}", cleaned)
          return jsonResponse("""{"error":"AI returned invalid JSON: ${gson.toJson(e.message)}"}""")
        }

    return try {
      val result = createWorkflowTask(workflowVersionId, taskSpec, params)
      jsonResponse("""{"success":true,"message":${gson.toJson(result)}}""")
    } catch (e: Exception) {
      logger.error("[AIWorkflowAssistant] Failed to create workflow task", e)
      jsonResponse("""{"error":${gson.toJson("Failed to create workflow: ${e.message}")}}""")
    }
  }

  /**
   * Builds the system prompt for the AI. When [isPhase1] is `true` and no context has been fetched
   * yet, the prompt instructs the AI to signal if it needs form or workflow data (by returning a
   * special `{"need":"..."}` JSON). When [formContext] and/or [workflowContext] are provided (phase
   * 2), they are embedded directly so the AI can use exact field/button names. When
   * [completionPages] is provided, available Abschlussseiten are listed for FC_DOI_INIT node
   * creation. When [htmlTemplates] is provided, available HTML templates are listed for
   * FC_SHOW_TEMPLATE node creation.
   */
  private fun buildSystemPrompt(
      formContext: String?,
      workflowContext: String?,
      isPhase1: Boolean,
      completionPages: String? = null,
      htmlTemplates: String? = null,
      urlTemplates: String? = null
  ): String = buildString {
    append(
        "You are a FORMCYCLE workflow assistant. The user will describe a desired workflow " +
            "action in natural language. Your ONLY output must be a single JSON object that " +
            "describes the workflow task to create. No explanation, no markdown, no code fences.\n\n")
    append(
        "Output format: Output EITHER a single JSON object (for ONE workflow lane) OR an array of JSON objects (for MULTIPLE lanes).\n" +
            "  Single lane: {\"taskName\":\"...\", \"taskDescription\":\"...\", \"triggerType\":\"...\", \"triggerParams\":{}, \"nodeType\":\"...\", \"nodeParams\":{}, \"endpointState\":\"...\"}\n" +
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
            "  Example of when to use an array: \"Beim Klick auf senden DOI-Mail verschicken, nach Bestätigung Status ändern\"\n" +
            "    → Lane 1: FC_FORM_SUBMIT_BUTTON → FC_DOI_INIT, Lane 2: FC_DOI_VERIFIED → FC_CHANGE_STATE\n" +
            "  CRITICAL — Do NOT use an array for setting a form record status. The status transition (\"endpointState\") is automatically\n" +
            "  added as the bottommost node of EVERY lane. If the user says \"set status to XYZ\", just set endpointState to \"XYZ\".\n" +
            "  A single lane can send an email AND transition to a status — both happen in ONE lane.\n\n")
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
            "nodeParams: {\"to\":\"<address or [%fieldname%] placeholder>\", " +
            "\"subject\":\"<subject text>\", \"body\":\"<body text or HTML>\", " +
            "\"from\":\"${if (defaultFromEmail.isNotEmpty()) defaultFromEmail else "<sender address — REQUIRED; use the address explicitly stated in the prompt>"}\", \"senderName\":\"<sender display name, empty if not specified>\", " +
            "\"(do NOT include bodyFormatType — it is always set to BOTH automatically)\", " +
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
            "nodeParams: {\"formValues\":[{\"name\":\"<technicalId>\",\"value\":\"<new value>\"},...]}⁠\n" +
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
            "nodeParams: {\"attributes\":[{\"name\":\"<key>\",\"value\":\"<value>\"},...]}⁠\n" +
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
            "Use COUNT_RESET when the user says a counter should be reset, zurückgesetzt, or " +
            "\"auf den Standardwert zurückgesetzt\" (reset to default value).\n" +
            "  - \"FC_CHANGE_FORM_AVAILABILITY\" — sets the form online or offline; " +
            "nodeParams: {\"changeType\":\"SET_ONLINE\"|\"SET_OFFLINE\"}. " +
            "Use this when the user says the form should go offline or online, " +
            "e.g. \"Formular offline gehen\", \"Formular online schalten\". " +
            "Do NOT use this for setting the form record status — that is endpointState.\n" +
            "  - \"de.xima.fc.plugin.fc_plugin_create_record.plugin.CreateRecordNodePlugin\" — " +
            "creates a new form record (Vorgang) in another form. " +
            "nodeParams: {\"projectName\":\"<target form name, e.g. 'CMIS Test'>\", " +
            "\"stateName\":\"<target state name for new record, e.g. 'Eingegangen'>\", " +
            "\"elementsToCopy\":[{\"name\":\"<target field ID>\",\"value\":\"<value>\"},...], " +
            "\"copyAll\":<true|false> (optional, default false — copy fields with matching names), " +
            "\"files\":[\"<upload field technical ID, e.g. 'upl1'>\"] (optional — files to transfer)}. " +
            "Use this when the user says a new form record (Vorgang) should be created " +
            "in another form with specific field values and optionally file attachments.\n" +
            "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; " +
            "nodeParams: {\"htmlTemplate\":\"<name of the HTML template to display — MUST be one of the AVAILABLE HTML TEMPLATES listed below>\"}. " +
            "CRITICAL — The mandatory \"Template HTML\" property MUST reference an HTML template " +
            "(stored in the project's template library, e.g. TEMPLATE_CLIENT or FORM_TEMPLATE tables). " +
            "Use this when the user says a specific completion page, Abschlussseite, or error page should be displayed " +
            "after a button is clicked (e.g. \"Bei Klick auf Senden, Abschlussseite 'Allgemeiner Fehler 2' anzeigen\").\n" +
            "  - \"FC_EMPTY\" — no-op placeholder node; nodeParams: {}\n\n")
    append(
        "ENDPOINT STATE (\"endpointState\" field) — CRITICAL:\n" +
            "  Every workflow lane automatically ends with a status transition (Endpunkt). The 'endpointState' field\n" +
            "  specifies the FORMCYCLE status name to set the form record to after all actions in the lane complete.\n" +
            "  DEFAULT: \"Received\" — use this unless the user specifies a different end status.\n" +
            "  CRITICAL — If the user says \"set status to <XYZ>\" or \"das Formular auf den Status <XYZ> setzen\",\n" +
            "  use EXACTLY the status name the user specified in their prompt. Do NOT pick a different status.\n" +
            "  Exception: if nodeType is \"FC_CHANGE_STATE\", the state change IS the endpoint; " +
            "set endpointState to the same value as nodeParams.stateName.\n" +
            "  STATE PROPERTIES (\"stateProperties\" field — optional):\n" +
            "  If the user specifies additional requirements for the endpoint state, include a 'stateProperties' object.\n" +
            "  Supported boolean properties: externalAccessPermitted, allowAccessToApplicant, allowAccessAllParticipants,\n" +
            "  allowAccessToAnonymousApplicant, allowAuthenticatedUser, formRecordDeletable, useSystemAuthentication.\n" +
            "  Example 1: \"von extern aufrufbar\" → stateProperties: {\"externalAccessPermitted\": true}\n" +
            "  Example 2: \"für alle Beteiligten aufrufbar\" → stateProperties: {\"allowAccessAllParticipants\": true}\n" +
            "  Example 3: \"für alle authentifizierten Beteiligten aufrufbar\" → stateProperties: {\"allowAccessAllParticipants\": true, \"allowAuthenticatedUser\": true}\n" +
            "  Example 4: \"Der Vorgang soll löschbar sein\" → stateProperties: {\"formRecordDeletable\": true}\n" +
            "  Example 5: \"Passwort XXX\" → stateProperties: {\"useSystemAuthentication\": true}\n" +
            "  NOTE: The actual form password value (e.g. \"XXX\") must be configured manually in the workflow state\n" +
            "  editor after creation — it is stored in a separate authenticator entity.\n\n")
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
    if (workflowContext != null) {
      append(
          "EXISTING WORKFLOW TASKS — for reference; avoid creating duplicates:\n" +
              workflowContext +
              "\n\n")
    }
    if (isPhase1) {
      append(
          "IMPORTANT — You do NOT yet have the form element list.\n" +
              "You MUST respond with {\"need\":\"form_data\"} UNLESS the request meets ALL of these:\n" +
              "  1. No button is mentioned (not even vaguely — e.g. 'submit button', 'Senden', 'absenden')\n" +
              "  2. No form field is mentioned (not even vaguely — e.g. 'email field', 'name field', 'E-Mail-Adresse')\n" +
              "  3. All values needed for triggerParams and nodeParams are explicitly given as exact technical identifiers\n" +
              "If ANY of these conditions is NOT met, respond ONLY with: {\"need\":\"form_data\"}\n\n")
    }
    if (!completionPages.isNullOrBlank()) {
      append(
          "AVAILABLE ABSCHLUSSSEITEN (completion pages — pick one for failurePage when creating a FC_DOI_INIT node):\n" +
              completionPages +
              "\n\n" +
              "Select the most suitable Abschlussseite from the list above based on the form/project context. " +
              "If the project has multiple pages, prefer one whose name suggests it is a generic error/failure page " +
              "(e.g. \"Fehler\", \"Error\", \"Allgemein\", \"Standard\") or create a new one with a descriptive name. " +
              "The Abschlussseite is displayed to the user when the DOI email verification fails.\n\n")
    }
    if (!htmlTemplates.isNullOrBlank()) {
      append(
          "AVAILABLE HTML TEMPLATES (for htmlTemplate when creating a FC_SHOW_TEMPLATE node — pick the EXACT match to the user's request):\n" +
              htmlTemplates +
              "\n\n" +
              "The HTML template is rendered to the user when the workflow runs (e.g. after clicking a submit button). " +
              "Use this when the user says a specific completion page, Abschlussseite, error page, or template should be displayed " +
              "(e.g. \"Bei Klick auf Senden, Abschlussseite 'Allgemeiner Fehler 2' anzeigen\"). " +
              "NEVER create a new template — always pick from the list above.\n\n")
    }
    if (!urlTemplates.isNullOrBlank()) {
      append(
          "AVAILABLE URL TEMPLATES (for urlTemplate when creating a FC_REDIRECT node — pick the EXACT match to the user's request):\n" +
              urlTemplates +
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
            "\"nodeParams\":{\"to\":\"[%tfHurra%]\",\"subject\":\"Eingang\",\"body\":\"Ihr Formular wurde empfangen.\"},\"endpointState\":\"Received\"}\n\n")
    append("Output ONLY valid JSON. No trailing commas. No comments.")
  }

  /**
   * Detects a context-need signal from the AI's cleaned JSON response. Returns the status string to
   * forward to the frontend, or `null` if no signal was found.
   */
  private fun detectContextNeed(cleanedJson: String): String? {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return null
      when (obj["need"] as? String) {
        "form_data" -> "need_form_data"
        "workflow_data" -> "need_workflow_data"
        "both" -> "need_both"
        else -> null
      }
    } catch (_: Exception) {
      null
    }
  }

  // endregion Handlers

  // region Workflow Creation via Reflection

  /**
   * Creates a new workflow task (trigger + root node) in the active WorkflowVersion of the given
   * project using FORMCYCLE's entity API via reflection.
   *
   * Reflection is required because fc-common / fc-api are provided-scope at compile time but
   * available at runtime inside FORMCYCLE's classloader.
   *
   * Entity hierarchy: WorkflowVersion (one per project / version) └─ WorkflowProcess (mainProcess)
   * └─ WorkflowTask (one per "strand") ├─ WorkflowTrigger (type + customParameters JSON) └─
   * WorkflowNode (root node; type + customParameters JSON)
   */
  private fun createWorkflowTask(
      workflowVersionId: Long,
      spec: WorkflowTaskSpec,
      params: IPluginServletActionParams
  ): String {
    // Obtain a UserContext from the current session via reflection.
    val userContext = getUserContext(params)

    // 1. Get APIProvider fields via reflection
    val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")

    // 2. Look up the WorkflowVersion directly by ID — the designer passes its workflowVersionId
    val workflowVersionApiField = apiProviderClass.getField("WORKFLOW_VERSION_API")
    val workflowVersionApi = workflowVersionApiField.get(null)
    val getByIdMethod =
        workflowVersionApi.javaClass.getMethod(
            "getById", Class.forName("de.xima.fc.user.UserContext"), Long::class.javaObjectType)
    val workflowVersion =
        getByIdMethod.invoke(workflowVersionApi, userContext, workflowVersionId)
            ?: return "WorkflowVersion $workflowVersionId not found."

    // 3. Get the mainProcess
    val getMainProcessMethod = workflowVersion.javaClass.getMethod("getMainProcess")
    val mainProcess =
        getMainProcessMethod.invoke(workflowVersion)
            ?: throw IllegalStateException("WorkflowVersion $workflowVersionId has no mainProcess")

    // 5. Create WorkflowTrigger
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

    // 6. Create root WorkflowNode — FORMCYCLE requires the root to be of type SEQUENCE.
    //    The actual action (FC_EMAIL, FC_CHANGE_STATE, …) is a *child* of the SEQUENCE node.
    //    Using the action type as root causes the flowchart designer to show
    //    "Kann Aktion der Art <type> nicht anzeigen, es wurde kein Handler gefunden".
    val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
    val rootNode = workflowNodeClass.getDeclaredConstructor().newInstance()
    workflowNodeClass.getMethod("setName", String::class.java).invoke(rootNode, "SEQUENCE")
    workflowNodeClass.getMethod("setType", String::class.java).invoke(rootNode, "SEQUENCE")
    workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(rootNode, true)
    workflowNodeClass
        .getMethod("setUUIDObject", UUID::class.java)
        .invoke(rootNode, UUID.randomUUID())
    // No customParameters for SEQUENCE — it is a pure container.

    // 6b. Create the action node (e.g. FC_EMAIL) as a child of the SEQUENCE root.
    val actionNode = workflowNodeClass.getDeclaredConstructor().newInstance()
    val actionNodeName = deriveNodeName(spec)
    logger.info(
        "[AIWorkflowAssistant] Creating actionNode: type={}, setting name='{}' (taskName='{}', nodeType='{}', derived='{}')",
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
            "[AIWorkflowAssistant] WorkflowNode has no setDescription method: {}", nodeDescription)
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

    // 7. Create WorkflowTask — do NOT set trigger/rootNode yet (circular FK dependency:
    //    WorkflowTrigger.task and WorkflowNode.task are non-nullable, so task must be persisted
    //    first. We set trigger/rootNode on the task after persisting trigger+node below).
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
    // Leave trigger/rootNode null for now — set after task is persisted

    val workflowTaskApiField = apiProviderClass.getField("WORKFLOW_TASK_API")
    val workflowTaskApi = workflowTaskApiField.get(null)
    val workflowTriggerApiField = apiProviderClass.getField("WORKFLOW_TRIGGER_API")
    val workflowTriggerApi = workflowTriggerApiField.get(null)
    val workflowNodeApiField = apiProviderClass.getField("WORKFLOW_NODE_API")
    val workflowNodeApi = workflowNodeApiField.get(null)

    // AEntityAPI<T extends ITransferableEntity>.create(UserContext, T) erases T to
    // ITransferableEntity
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

    // 8. Persist task first so it gets a DB id — trigger and node reference it via non-nullable FK
    val savedTask = createTaskMethod.invoke(workflowTaskApi, userContext, task)

    // 9. Now wire back-references (task is persisted) and persist in dependency order:
    //    rootNode (SEQUENCE) first, then actionNode (child of rootNode), then trigger.
    workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(rootNode, savedTask)
    val savedRootNode = createNodeMethod.invoke(workflowNodeApi, userContext, rootNode)

    // 9b. Action node: link to task AND to the now-persisted SEQUENCE root as parent.
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
          "[AIWorkflowAssistant] POST-PERSIST actionNode: id={}, type='{}', name='{}' (expected='{}')",
          savedActionNode.javaClass.getMethod("getId").invoke(savedActionNode),
          savedNodeType,
          savedNodeName,
          actionNodeName)
    } catch (e: Exception) {
      logger.warn("[AIWorkflowAssistant] POST-PERSIST name verification failed: {}", e.message)
    }

    // 9c. Fix parent_order_idx for the action node: Hibernate's @OrderColumn on
    //     WorkflowNode.children stays NULL when the child is inserted via API (not via
    //     collection.add()). A NULL here causes PersistentList to throw on the next load.
    fixParentOrderIndex(savedActionNode, savedRootNode, userContext)

    // 9d. Endpoint node: every workflow lane requires a final FC_CHANGE_STATE (Endpunkt) that
    //     sets the form record to its terminal status. Skip only when the main action IS
    //     a state change (it already serves as the endpoint).
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
            // Create new state
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
                logger.info("[AIWorkflowAssistant] Set state property '{}' = {}", setterName, arg)
              }
            } catch (e: Exception) {
              logger.warn(
                  "[AIWorkflowAssistant] Failed to set state property '{}': {}",
                  setterName,
                  e.message)
            }
          }

          // Handle allowAuthenticatedUser — requires creating a WorkflowStateAuthenticatorConfig
          // with EAuthClientType.FORM (FormCycle's internal user authentication).
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
                workflowStateClass
                    .getMethod("addAuthenticatorConfig", authConfigClass)
                    .invoke(stateObject, authConfig)
              } else {
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
                  "[AIWorkflowAssistant] Created FORM authenticator config for allowAuthenticatedUser")
            } catch (e: Exception) {
              val causeMsg =
                  if (e is java.lang.reflect.InvocationTargetException && e.cause != null) {
                    "${e.cause!!::class.simpleName}: ${e.cause!!.message}"
                  } else {
                    "${e::class.simpleName}: ${e.message}"
                  }
              logger.warn(
                  "[AIWorkflowAssistant] Failed to create authenticator config for allowAuthenticatedUser: {}",
                  causeMsg)
            }
          }

          if (endpointStateUuid == null) {
            val savedState =
                stateApi.javaClass
                    .getMethod("create", userContextClass, iTransferableEntityClass)
                    .invoke(stateApi, userContext, stateObject)
            endpointStateUuid =
                savedState.javaClass.getMethod("getUUIDObject").invoke(savedState) as? UUID
            logger.info(
                "[AIWorkflowAssistant] Created new workflow state '{}' with UUID {}",
                stateName,
                endpointStateUuid)
          } else {
            stateApi.javaClass
                .getMethod("update", userContextClass, iTransferableEntityClass)
                .invoke(stateApi, userContext, stateObject)
            logger.info(
                "[AIWorkflowAssistant] Updated existing workflow state '{}' properties", stateName)
          }
        } catch (e: Exception) {
          logger.warn(
              "[AIWorkflowAssistant] Failed to update/create workflow state '{}': {}",
              stateName,
              e.message)
          if (endpointStateUuid == null)
              endpointStateUuid = resolveFirstStateUuid(userContext, workflowVersion)
        }
      } else if (endpointStateUuid == null) {
        // Create minimal state without properties
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
              "[AIWorkflowAssistant] Created new workflow state '{}' with UUID {}",
              stateName,
              endpointStateUuid)
        } catch (e: Exception) {
          logger.warn(
              "[AIWorkflowAssistant] Failed to create workflow state '{}': {}",
              stateName,
              e.message)
          endpointStateUuid = resolveFirstStateUuid(userContext, workflowVersion)
        }
      }

      if (endpointStateUuid != null) {
        val endpointParamsJson =
            """{ "targetState":{"uuid":${gson.toJson(endpointStateUuid.toString())},"entityClass":"de.xima.fc.entities.WorkflowState"}}"""
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
        logger.warn("[AIWorkflowAssistant] Skipping endpoint node: no workflow states found")
      }
    }

    workflowTriggerClass.getMethod("setTask", workflowTaskClass).invoke(trigger, savedTask)
    val savedTrigger = createTriggerMethod.invoke(workflowTriggerApi, userContext, trigger)

    // 10. Update task to reference the now-persisted trigger and rootNode
    workflowTaskClass.getMethod("setTrigger", workflowTriggerClass).invoke(savedTask, savedTrigger)
    workflowTaskClass.getMethod("setRootNode", workflowNodeClass).invoke(savedTask, savedRootNode)
    updateMethod.invoke(workflowTaskApi, userContext, savedTask)

    // 11. Fix proc_order_idx: the @OrderColumn column is NULL after API-based insert.
    fixProcOrderIndex(savedTask, mainProcess, userContext)

    logger.info(
        "[AIWorkflowAssistant] Created workflow task '{}' (trigger={}, node={}) for workflowVersion {}",
        spec.taskName,
        spec.triggerType,
        spec.nodeType,
        workflowVersionId)

    return "Workflow task '${spec.taskName}' created: ${spec.triggerType} → ${spec.nodeType}"
  }

  /**
   * Sets `proc_order_idx` on the newly created `WorkflowTask` row via a native SQL UPDATE.
   *
   * The `@OrderColumn` column (`proc_order_idx`) is managed entirely by Hibernate's
   * `PersistentList` machinery. When a task is inserted through the API (not by adding it to the
   * in-memory collection), Hibernate does not set this column — it stays NULL. Hibernate then
   * throws `null index column for collection: WorkflowProcess.tasks` on the next load.
   *
   * We open a fresh `IEntityContext` (which wraps its own `EntityManager`), run two native queries
   * inside a RESOURCE_LOCAL transaction (SELECT MAX + UPDATE), and close the context. Using Long
   * IDs in inline SQL is safe: they are DB-generated numeric values, not user input.
   */
  private fun fixProcOrderIndex(savedTask: Any, mainProcess: Any, userContext: Any) {
    val taskId =
        savedTask.javaClass.getMethod("getId").invoke(savedTask) as? Long
            ?: run {
              logger.warn("[AIWorkflowAssistant] fixProcOrderIndex: task has no ID yet")
              return
            }
    val processId =
        mainProcess.javaClass.getMethod("getId").invoke(mainProcess) as? Long
            ?: run {
              logger.warn("[AIWorkflowAssistant] fixProcOrderIndex: mainProcess has no ID")
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
      // Determine the next available order index for this process
      val selectSql =
          "SELECT COALESCE(MAX(proc_order_idx), -1) + 1 FROM workflow_task WHERE process_id = $processId"
      val selectQ =
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, selectSql)
      val nextIdx =
          (selectQ.javaClass.getMethod("getSingleResult").invoke(selectQ) as? Number)?.toInt() ?: 0

      val updateSql = "UPDATE workflow_task SET proc_order_idx = $nextIdx WHERE id = $taskId"
      val updateQ =
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, updateSql)
      updateQ.javaClass.getMethod("executeUpdate").invoke(updateQ)

      tx.javaClass.getMethod("commit").invoke(tx)
      logger.info("[AIWorkflowAssistant] Set proc_order_idx = {} for task id={}", nextIdx, taskId)
    } catch (e: Exception) {
      runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
      logger.warn("[AIWorkflowAssistant] Failed to fix proc_order_idx for task $taskId", e)
    } finally {
      runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
    }
  }

  /**
   * Sets `parent_order_idx` on an action node that was inserted as a child of a SEQUENCE root node
   * via API (not via `children.add()`). Hibernate's `@OrderColumn` on `WorkflowNode.children` maps
   * to this column; a NULL value causes `PersistentList` to throw `null index column for
   * collection: WorkflowNode.children` on the next load.
   *
   * We set index 0 for the first (and usually only) child of the SEQUENCE. If the SEQUENCE already
   * has children, we use MAX + 1 so the new child is appended at the end.
   */
  private fun fixParentOrderIndex(actionNode: Any, parentNode: Any, userContext: Any) {
    val nodeId =
        actionNode.javaClass.getMethod("getId").invoke(actionNode) as? Long
            ?: run {
              logger.warn("[AIWorkflowAssistant] fixParentOrderIndex: action node has no ID yet")
              return
            }
    val parentId =
        parentNode.javaClass.getMethod("getId").invoke(parentNode) as? Long
            ?: run {
              logger.warn("[AIWorkflowAssistant] fixParentOrderIndex: parent node has no ID")
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
      val selectSql =
          "SELECT COALESCE(MAX(parent_order_idx), -1) + 1 FROM workflow_node WHERE parent_id = $parentId"
      val selectQ =
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, selectSql)
      val nextIdx =
          (selectQ.javaClass.getMethod("getSingleResult").invoke(selectQ) as? Number)?.toInt() ?: 0

      val updateSql = "UPDATE workflow_node SET parent_order_idx = $nextIdx WHERE id = $nodeId"
      val updateQ =
          em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, updateSql)
      updateQ.javaClass.getMethod("executeUpdate").invoke(updateQ)

      tx.javaClass.getMethod("commit").invoke(tx)
      logger.info(
          "[AIWorkflowAssistant] Set parent_order_idx = {} for action node id={}", nextIdx, nodeId)
    } catch (e: Exception) {
      runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
      logger.warn("[AIWorkflowAssistant] Failed to fix parent_order_idx for node $nodeId", e)
    } finally {
      runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
    }
  }

  /**
   * Fetches the active form's element list for the given [workflowVersionId] and returns a compact
   * JSON array such as `[{"name":"tfMail","label":"Mail","type":"SIMPLE"}]`.
   *
   * Uses a JPQL query within a fresh [EntityContext] to avoid Hibernate lazy-loading errors:
   * entities returned by the FORMCYCLE API are detached, so traversing lazy collections on them
   * (project → activeVersion → formElemente) throws "could not initialize proxy – no Session".
   * Opening our own EntityContext keeps the session open for the duration of the query.
   *
   * JPQL path: `WorkflowVersion.project` → `Projekt.activeVersion` → `FormVersion.formElemente`
   */
  private fun fetchFormContext(workflowVersionId: Long, userContext: Any): String? {
    val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val entityContext =
        entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
    return try {
      val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
      // Single JPQL query: navigate Projekt → (workflowVersions) → filter by wvId,
      // then take form elements only from the latest FormVersion (max ID) of that Projekt.
      // Using formVersions (all versions) instead of activeVersion because activeVersion
      // is null when the form has not yet been published.
      // JPA attribute names verified: Projekt.workflowVersions, Projekt.formVersions,
      // FormVersion.formElemente, FormVersion.projekt
      val jpql =
          "SELECT fe " +
              "FROM de.xima.fc.entities.Projekt p " +
              "JOIN p.workflowVersions wv " +
              "JOIN p.formVersions fv " +
              "JOIN fv.formElemente fe " +
              "WHERE wv.id = :wvId " +
              "AND fv.id = (SELECT MAX(fv2.id) FROM de.xima.fc.entities.FormVersion fv2 WHERE fv2.projekt = p) " +
              "ORDER BY fe.id"
      val query = em.javaClass.getMethod("createQuery", String::class.java).invoke(em, jpql)
      query.javaClass
          .getMethod("setParameter", String::class.java, Any::class.java)
          .invoke(query, "wvId", workflowVersionId)
      @Suppress("UNCHECKED_CAST")
      val elements =
          query.javaClass.getMethod("getResultList").invoke(query) as? List<Any> ?: return null
      if (elements.isEmpty()) {
        logger.info(
            "[AIWorkflowAssistant] fetchFormContext for workflowVersion {}: JPQL returned 0 elements",
            workflowVersionId)
        return "[]"
      }
      logger.info(
          "[AIWorkflowAssistant] fetchFormContext for workflowVersion {}: JPQL returned {} elements, class={}",
          workflowVersionId,
          elements.size,
          elements.first().javaClass.name)
      val getFieldName =
          try {
            elements.first().javaClass.getMethod("getFieldName")
          } catch (e: Exception) {
            logger.warn("[AIWorkflowAssistant] getFieldName not found: {}", e.message)
            null
          }
      val getAlias =
          try {
            elements.first().javaClass.getMethod("getAlias")
          } catch (e: Exception) {
            logger.warn("[AIWorkflowAssistant] getAlias not found: {}", e.message)
            null
          }
      val getTyp =
          try {
            elements.first().javaClass.getMethod("getTyp")
          } catch (e: Exception) {
            logger.warn("[AIWorkflowAssistant] getTyp not found: {}", e.message)
            null
          }
      val getIsSystem =
          try {
            elements.first().javaClass.getMethod("getIsSystem")
          } catch (e: Exception) {
            logger.warn("[AIWorkflowAssistant] getIsSystem not found: {}", e.message)
            null
          }
      elements.take(3).forEach { el ->
        val n =
            try {
              getFieldName?.invoke(el)
            } catch (e: Exception) {
              "ERR:${e.message}"
            }
        val sys =
            try {
              getIsSystem?.invoke(el)
            } catch (e: Exception) {
              "ERR:${e.message}"
            }
        logger.info("[AIWorkflowAssistant]   element: fieldName={}, isSystem={}", n, sys)
      }
      val list =
          elements.mapNotNull { el ->
            try {
              // Skip system elements (e.g. xf-action, xf-submit) — not usable as trigger buttons
              val isSystem = getIsSystem?.invoke(el) as? Boolean ?: false
              if (isSystem) return@mapNotNull null
              val name = getFieldName?.invoke(el) as? String ?: return@mapNotNull null
              val alias = getAlias?.invoke(el) as? String
              val typ = getTyp?.invoke(el)?.toString() ?: "SIMPLE"
              if (alias.isNullOrBlank()) mapOf("technicalId" to name, "type" to typ)
              else mapOf("technicalId" to name, "displayText" to alias, "type" to typ)
            } catch (_: Exception) {
              null
            }
          }
      val json = gson.toJson(list)
      logger.info(
          "[AIWorkflowAssistant] fetchFormContext for workflowVersion {}: {}",
          workflowVersionId,
          json)
      json
    } catch (e: Exception) {
      val cause = e.cause ?: e
      logger.warn(
          "[AIWorkflowAssistant] fetchFormContext failed for workflowVersion {}: {} — {}",
          workflowVersionId,
          cause.javaClass.simpleName,
          cause.message)
      null
    } finally {
      runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
    }
  }

  /**
   * Fetches a summary of the existing workflow tasks for the given [workflowVersionId] and returns
   * a compact JSON array such as `[{"name":"Confirmation
   * email","triggerType":"FC_FORM_SUBMIT_BUTTON","nodeType":"SEQUENCE"}]`.
   *
   * Reflection chain: `WorkflowVersion.getMainProcess()` → `WorkflowProcess.getTasks()` →
   * `List<WorkflowTask>.getName() + .getTrigger().getType() + .getRootNode().getType()`.
   *
   * Returns `null` on any reflection failure so the AI call degrades gracefully.
   */
  private fun fetchWorkflowContext(workflowVersionId: Long, userContext: Any): String? {
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
      val mainProcess =
          workflowVersion.javaClass.getMethod("getMainProcess").invoke(workflowVersion)
              ?: return null
      @Suppress("UNCHECKED_CAST")
      val tasks =
          mainProcess.javaClass.getMethod("getTasks").invoke(mainProcess) as? List<Any>
              ?: return null
      val list =
          tasks.mapNotNull { task ->
            try {
              val name = task.javaClass.getMethod("getName").invoke(task) as? String ?: ""
              val trigger = task.javaClass.getMethod("getTrigger").invoke(task)
              val rootNode = task.javaClass.getMethod("getRootNode").invoke(task)
              val triggerType =
                  trigger?.javaClass?.getMethod("getType")?.invoke(trigger) as? String ?: ""
              val nodeType =
                  rootNode?.javaClass?.getMethod("getType")?.invoke(rootNode) as? String ?: ""

              mapOf("name" to name, "triggerType" to triggerType, "nodeType" to nodeType)
            } catch (_: Exception) {
              null
            }
          }
      gson.toJson(list)
    } catch (e: Exception) {
      logger.warn(
          "[AIWorkflowAssistant] fetchWorkflowContext failed for workflowVersion {}: {}",
          workflowVersionId,
          e.message)
      null
    }
  }

  /**
   * Obtains a `de.xima.fc.user.UserContext` from the plugin params using reflection. FORMCYCLE
   * injects a `Benutzer` (user entity) into the params; `UserContext` can be obtained from it via
   * the `getXFcUserContext()` method available on logged-in `Benutzer`.
   */
  private fun getUserContext(params: IPluginServletActionParams): Any {
    val benutzerMethod = params.javaClass.getMethod("getBenutzer")
    val benutzer =
        benutzerMethod.invoke(params)
            ?: throw IllegalStateException("No authenticated user in request")
    // UserContextFactory.forBenutzer(Benutzer) is the correct way to build a UserContext
    val factoryClass = Class.forName("de.xima.fc.user.UserContextFactory")
    val benutzerClass = Class.forName("de.xima.fc.entities.Benutzer")
    val forBenutzerMethod = factoryClass.getMethod("forBenutzer", benutzerClass)
    return forBenutzerMethod.invoke(null, benutzer)
        ?: throw IllegalStateException("UserContextFactory.forBenutzer returned null")
  }

  // endregion Workflow Creation via Reflection

  // region Parameter JSON Builders

  /**
   * Builds the `customParameters` JSON string for a WorkflowTrigger based on the AI spec.
   *
   * Schema confirmed from `FcFormSubmitButtonProps` (fc-workflow-processor-8.3.3.jar):
   * - `FC_FORM_SUBMIT_BUTTON`: `{"buttonName": "<name>"}` — single String field. Empty string means
   *   any button fires the trigger.
   */
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

  /**
   * Builds the `customParameters` JSON string for a WorkflowNode based on the AI spec.
   *
   * Schemas confirmed from fc-workflow-processor-8.3.3.jar:
   * - `FcEmailProps`: fields are `to: List<String>`, `subject: String`, `body: String`,
   *   `bodyFormatType: EEmailBodyFormatType`, `from: String`, `senderName: String`, `cc:
   *   List<String>`, `bcc: List<String>`. Gson serialises field names directly.
   * - `FcChangeStateProps`: field is `targetState: UuidEntityRef{uuid, entityClass}`. We resolve
   *   the state UUID at runtime from WorkflowVersion.getStates().
   */
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
        val bodyFormatType = "BOTH"
        // to / cc / bcc are List<String> in FcEmailProps — serialise as JSON arrays
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
            "[AIWorkflowAssistant] buildNodeParams FC_DOI_INIT: failurePage='{}', workflowVersion=null?{}, userContext=null?{}",
            failurePage,
            workflowVersion == null,
            userContext == null)
        val failurePageJson =
            if (failurePage.isNotBlank() && workflowVersion != null && userContext != null) {
              val uuid = resolveCompletionPageUuid(userContext, workflowVersion, failurePage)
              logger.info(
                  "[AIWorkflowAssistant] buildNodeParams FC_DOI_INIT: resolveCompletionPageUuid('{}') returned {}",
                  failurePage,
                  uuid?.toString() ?: "null")
              if (uuid != null) {
                val uuidStr = uuid.toString()
                ""","doiFailTemplate":{"entityClass":"TextTemplate","id":${gson.toJson(uuidStr)},"type":"TextTemplate","uuid":${gson.toJson(uuidStr)}}"""
              } else ""","doiFailTemplate":null"""
            } else {
              logger.info(
                  "[AIWorkflowAssistant] buildNodeParams FC_DOI_INIT: SKIPPING doiFailTemplate — failurePage blank={}, workflowVersion null={}, userContext null={}",
                  failurePage.isBlank(),
                  workflowVersion == null,
                  userContext == null)
              ""","doiFailTemplate":null"""
            }
        val resultJson =
            """{"name":${gson.toJson(nodeName)},"to":$toJson,"from":${gson.toJson(from)},"senderName":${gson.toJson(senderName)},"subject":${gson.toJson(subject)},"body":${gson.toJson(body)},"plainBody":${gson.toJson(body)},"bodyFormatType":"HTML"$failurePageJson}"""
        logger.info("[AIWorkflowAssistant] buildNodeParams FC_DOI_INIT: final JSON={}", resultJson)
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
        val httpRequestType =
            when {
              method == "GET" || method == "DELETE" || method == "HEAD" || method == "OPTIONS" ->
                  "URL"
              contentType == "FORM_DATA" -> "FORM_DATA"
              body.isBlank() -> "URL" // POST with no body content → use URL type
              else -> "CUSTOM" // JSON, PLAIN_TEXT, XML → custom body content
            }
        val asResponsePage = spec.nodeParams["asResponsePage"] as? Boolean ?: false
        val treat4xxAsNormal = spec.nodeParams["treat4xxAsNormal"] as? Boolean ?: false
        val treat5xxAsNormal = spec.nodeParams["treat5xxAsNormal"] as? Boolean ?: false
        val nodeParamsJson =
            if (httpRequestType == "FORM_DATA") {
              """{"name":${gson.toJson(nodeName)},"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"FORM_DATA","sendAllFormValues":false,"requestParameters":[],"headerParameters":$headersJson,"allowInvalidCertificates":false,"asResponsePage":$asResponsePage,"treat4xxAsNormal":$treat4xxAsNormal,"treat5xxAsNormal":$treat5xxAsNormal}"""
            } else if (httpRequestType == "URL") {
              """{"name":${gson.toJson(nodeName)},"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"URL","sendAllFormValues":false,"headerParameters":$headersJson,"allowInvalidCertificates":false,"asResponsePage":$asResponsePage,"treat4xxAsNormal":$treat4xxAsNormal,"treat5xxAsNormal":$treat5xxAsNormal}"""
            } else {
              """{"name":${gson.toJson(nodeName)},"postUrl":${gson.toJson(url)},"httpVerb":${gson.toJson(method)},"httpRequestType":"CUSTOM","customBodyContent":${gson.toJson(body)},"customBodyContentType":${gson.toJson(contentType)},"headerParameters":$headersJson,"allowInvalidCertificates":false,"asResponsePage":$asResponsePage,"treat4xxAsNormal":$treat4xxAsNormal,"treat5xxAsNormal":$treat5xxAsNormal}"""
            }
        logger.info(
            "[AIWorkflowAssistant] buildNodeParams FC_HTTP_REQUEST: url='{}', httpVerb='{}', httpRequestType='{}', params={}",
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
              "[AIWorkflowAssistant] buildNodeParams FC_REDIRECT: urlTemplate='{}' → uuid={}, queryParams={}",
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
            "[AIWorkflowAssistant] buildNodeParams FC_SHOW_TEMPLATE: htmlTemplate='{}', workflowVersion=null?{}, userContext=null?{}",
            templateName,
            workflowVersion == null,
            userContext == null)
        if (templateName.isNotBlank() && workflowVersion != null && userContext != null) {
          val uuid = resolveHtmlTemplateUuid(userContext, workflowVersion, templateName)
          logger.info(
              "[AIWorkflowAssistant] buildNodeParams FC_SHOW_TEMPLATE: resolveHtmlTemplateUuid('{}') returned {}",
              templateName,
              uuid?.toString() ?: "null")
          if (uuid != null) {
            val uuidStr = uuid.toString()
            // Match the exact pattern from doiFailTemplate: entityClass + id + type + uuid
            val result =
                """{"name":${gson.toJson(nodeName)},"htmlTemplate":{"entityClass":"TextTemplate","id":${gson.toJson(uuidStr)},"type":"TextTemplate","uuid":${gson.toJson(uuidStr)}}}"""
            logger.info(
                "[AIWorkflowAssistant] buildNodeParams FC_SHOW_TEMPLATE: FINAL JSON = {}", result)
            result
          } else {
            val result = """{"name":${gson.toJson(nodeName)},"htmlTemplate":null}"""
            logger.warn(
                "[AIWorkflowAssistant] buildNodeParams FC_SHOW_TEMPLATE: UUID was null, returning {}",
                result)
            result
          }
        } else {
          logger.info(
              "[AIWorkflowAssistant] buildNodeParams FC_SHOW_TEMPLATE: SKIPPING htmlTemplate — templateName blank={}, workflowVersion null={}, userContext null={}",
              templateName.isBlank(),
              workflowVersion == null,
              userContext == null)
          """{"name":${gson.toJson(nodeName)},"htmlTemplate":null}"""
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
        val projectJson =
            if (projectName.isNotBlank())
                ""","project":{"nameRef":${gson.toJson(projectName)},"refType":"NAME_VALUE"}"""
            else ""
        val stateUuid =
            if (stateName.isNotBlank() && workflowVersion != null && userContext != null)
                resolveStateUuid(userContext, workflowVersion, stateName)
            else null
        val stateJson =
            if (stateUuid != null)
                ""","stateNewRecord":{"uuid":${gson.toJson(stateUuid.toString())},"entityClass":"de.xima.fc.entities.WorkflowState"}"""
            else if (stateName.isNotBlank())
                ""","stateNewRecord":{"nameRef":${gson.toJson(stateName)},"refType":"NAME_VALUE"}"""
            else ""
        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"copyValues":true,"copyAll":$copyAll$elementsToCopyJson$multiFileJson$stateJson}"""
      }
      "FC_SET_SAVED_FLAG",
      "FC_DELETE_FORM_RECORD",
      "FC_EMPTY" ->
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
      else -> """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
    }
  }

  /**
   * Resolves the UUID of a WorkflowState by name from the active WorkflowVersion. Uses
   * WORKFLOW_STATE_API.getAllByWorkflowVersion() to avoid lazy-loading issues.
   */
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
      logger.warn("[AIWorkflowAssistant] Could not load workflow states: {}", e.message)
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
          "[AIWorkflowAssistant] Could not resolve state UUID for '{}': {}", stateName, e.message)
      null
    }
  }

  private fun resolveFirstStateUuid(userContext: Any, workflowVersion: Any): UUID? {
    return try {
      val states = loadWorkflowStates(userContext, workflowVersion)
      val firstState = states.firstOrNull() ?: return null
      firstState.javaClass.getMethod("getUUIDObject").invoke(firstState) as? UUID
    } catch (e: Exception) {
      logger.warn("[AIWorkflowAssistant] Could not resolve first state UUID: {}", e.message)
      null
    }
  }

  /**
   * Queries the database for available Abschlussseiten (completion pages) for the given workflow
   * version's project. Uses JPQL with known FORMCYCLE entity class names first (most reliable),
   * then falls back to native SQL with schema-discovery.
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
                "SELECT cp FROM de.xima.fc.entities.Projekt p JOIN $collectionPath cp WHERE p.id = :pid"
            val query = em.createQuery(jpql)
            query.setParameter("pid", projectId)
            query.maxResults = 100
            @Suppress("UNCHECKED_CAST") val results = query.resultList as? List<Any> ?: continue
            if (results.isEmpty()) {
              logger.info(
                  "[AIWorkflowAssistant] JPQL Projekt collection '$collectionPath' exists but returned 0 pages for project $projectId")
              continue
            }
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
            logger.info(
                "[AIWorkflowAssistant] Found {} completion pages via Projekt collection '$collectionPath' for project $projectId: {}",
                pages.size,
                json)
            return json
          } catch (e: Exception) {
            logger.info(
                "[AIWorkflowAssistant] JPQL Projekt collection '$collectionPath' not available: ${e.message}")
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
            // First try a simple COUNT to verify the entity is mapped
            val countQuery = em.createQuery("SELECT COUNT(cp) FROM $entityClass cp")
            val totalCount = (countQuery.singleResult as? Number)?.toLong() ?: 0L
            if (totalCount == 0L) {
              logger.info("[AIWorkflowAssistant] JPQL entity '$entityClass' has 0 total rows")
              continue
            }
            // Fetch all and filter programmatically
            val fetchQuery = em.createQuery("SELECT cp FROM $entityClass cp")
            fetchQuery.maxResults = 200
            @Suppress("UNCHECKED_CAST")
            val allResults = (fetchQuery.resultList as? List<Any>) ?: continue
            if (allResults.isEmpty()) continue
            val first = allResults[0]
            val methods = first.javaClass.methods
            val getters =
                methods.filter { m ->
                  m.name.startsWith("get") && m.parameterCount == 0 && m.name != "getClass"
                }
            logger.info(
                "[AIWorkflowAssistant] JPQL entity '$entityClass' has {} total rows, getters: {}",
                totalCount,
                getters.map { it.name })
            // Try to filter by project - look for projektId/projectId getters
            val projectIdGetters = listOf("getProjektId", "getProjectId")
            var projectIdGetter: java.lang.reflect.Method? = null
            for (gName in projectIdGetters) {
              try {
                projectIdGetter = first.javaClass.getMethod(gName)
                break
              } catch (_: Exception) {}
            }
            val projectRefGetters =
                getters.filter { m ->
                  !m.name.startsWith("getC") &&
                      (m.name.contains("Projekt", ignoreCase = true) ||
                          m.name.contains("Project", ignoreCase = true)) &&
                      m.returnType != String::class.java
                }
            val filteredResults =
                if (projectIdGetter != null) {
                  allResults.filter { cp ->
                    try {
                      projectIdGetter!!.invoke(cp)?.toString() == projectId.toString()
                    } catch (_: Exception) {
                      false
                    }
                  }
                } else if (projectRefGetters.isNotEmpty()) {
                  allResults.filter { cp ->
                    projectRefGetters.any { getter ->
                      try {
                        val ref = getter.invoke(cp)
                        ref?.javaClass?.getMethod("getId")?.invoke(ref)?.toString() ==
                            projectId.toString()
                      } catch (_: Exception) {
                        false
                      }
                    }
                  }
                } else allResults
            if (filteredResults.isEmpty()) {
              logger.info(
                  "[AIWorkflowAssistant] JPQL entity '$entityClass' has {} total rows, 0 for project $projectId",
                  totalCount)
              continue
            }
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
                            val s = cp.javaClass.getMethod("getUuid").invoke(cp) as? String
                            if (s != null) UUID.fromString(s) else null
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
              logger.info(
                  "[AIWorkflowAssistant] Found {} completion pages via JPQL entity '$entityClass' for project $projectId: {}",
                  pages.size,
                  json)
              return json
            }
          } catch (e: Exception) {
            logger.info(
                "[AIWorkflowAssistant] JPQL entity class '$entityClass' not available: ${e.message}")
            continue
          }
        }

        // Strategy 3: Native SQL with schema discovery (expanded table names)
        val possibleTables =
            listOf(
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
            val pages =
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
            val json = "[${pages.joinToString(",")}]"
            logger.info(
                "[AIWorkflowAssistant] Found {} completion pages via native table '$tableName' for project $projectId: {}",
                pages.size,
                json)
            return json
          } catch (_: Exception) {
            continue
          }
        }

        logger.warn("[AIWorkflowAssistant] No completion-pages table found among: $possibleTables")
        try {
          val allTablesQuery =
              em.createNativeQuery(
                  "SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('information_schema', 'pg_catalog', 'mysql') ORDER BY table_name")
          val allTables = allTablesQuery.resultList
          logger.warn("[AIWorkflowAssistant] ALL database tables: {}", allTables)
          val likeTablesQuery =
              em.createNativeQuery(
                  "SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('information_schema', 'pg_catalog', 'mysql') AND (table_name ILIKE '%abschluss%' OR table_name ILIKE '%completion%' OR table_name ILIKE '%seite%' OR table_name ILIKE '%page%' OR table_name ILIKE '%vorlage%' OR table_name ILIKE '%template%' OR table_name ILIKE '%eigenschaft%' OR table_name ILIKE '%property%' OR table_name ILIKE '%config%' OR table_name ILIKE '%konfig%' OR table_name ILIKE '%doi%' OR table_name ILIKE '%doppel%') ORDER BY table_name")
          val likeTables = likeTablesQuery.resultList
          logger.warn(
              "[AIWorkflowAssistant] Tables matching page/seite/template/vorlage/property/eigenschaft/doi: {}",
              likeTables)
        } catch (_: Exception) {}
        null
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AIWorkflowAssistant] Failed to fetch completion pages: ${e.message}")
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
              logger.info(
                  "[AIWorkflowAssistant] JPQL HTML template entity '$entityClass' has 0 total rows")
              continue
            }
            val fetchQuery = em.createQuery("SELECT t FROM $entityClass t")
            fetchQuery.maxResults = 200
            @Suppress("UNCHECKED_CAST")
            val allResults = (fetchQuery.resultList as? List<Any>) ?: continue
            if (allResults.isEmpty()) continue
            val first = allResults[0]
            val methods = first.javaClass.methods

            // Filter by project — try to find a project ID getter
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
              logger.info(
                  "[AIWorkflowAssistant] JPQL HTML template entity '$entityClass' has {} total rows, 0 for project $projectId",
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
                  "[AIWorkflowAssistant] Found {} HTML templates via JPQL entity '$entityClass' for project $projectId: {}",
                  templates.size,
                  json)
              return json
            }
          } catch (e: Exception) {
            logger.info(
                "[AIWorkflowAssistant] JPQL entity class '$entityClass' not available: ${e.message}")
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
                "[AIWorkflowAssistant] Found {} HTML templates via native table '$tableName' for project $projectId: {}",
                templates.size,
                json)
            return json
          } catch (_: Exception) {
            continue
          }
        }

        logger.warn("[AIWorkflowAssistant] No HTML template table found")
        null
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn("[AIWorkflowAssistant] Failed to fetch HTML templates: ${e.message}")
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
                  "[AIWorkflowAssistant] Resolved completion page '{}' to UUID {} via Projekt collection '$collectionPath'",
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
          val jpql =
              "SELECT cp FROM $entityClass cp WHERE cp.name = :name AND (cp.project.id = :pid OR cp.projekt.id = :pid)"
          val query = em.createQuery(jpql)
          query.setParameter("name", pageName)
          query.setParameter("pid", projectId)
          val results = query.resultList
          if (results.isNotEmpty()) {
            val cp = results[0] ?: continue
            val uuid = cp.javaClass.getMethod("getUUIDObject").invoke(cp) as? UUID
            if (uuid != null) {
              logger.info(
                  "[AIWorkflowAssistant] Resolved completion page '{}' to UUID {} via JPQL entity '{}'",
                  pageName,
                  uuid,
                  entityClass)
              return uuid
            }
          }
        } catch (_: Exception) {
          continue
        }
      }

      // Strategy 3: Native SQL with schema discovery (expanded table names)
      val possibleTables =
          listOf(
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
          "[AIWorkflowAssistant] Completion page '{}' not found in any table for project $projectId",
          pageName)
      return null
    } catch (e: Exception) {
      logger.warn(
          "[AIWorkflowAssistant] Could not resolve completion page UUID for '{}': {}",
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
                  "[AIWorkflowAssistant] Resolved HTML template '{}' to UUID {} via JPQL entity '{}'",
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
                  "[AIWorkflowAssistant] Resolved HTML template '{}' to UUID {} via Projekt collection '$collectionPath'",
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
          "[AIWorkflowAssistant] HTML template '{}' not found in any table for project $projectId",
          templateName)
      return null
    } catch (e: Exception) {
      logger.warn(
          "[AIWorkflowAssistant] Could not resolve HTML template UUID for '{}': {}",
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

  /**
   * Resolves the UUID of a URL template by its name. Delegates to [resolveHtmlTemplateUuid] since
   * URL templates are stored in the same table as HTML templates.
   */
  private fun resolveUrlTemplateUuid(
      userContext: Any,
      workflowVersion: Any,
      templateName: String
  ): UUID? = resolveHtmlTemplateUuid(userContext, workflowVersion, templateName)

  // endregion Parameter JSON Builders

  // region JSON Utilities

  /**
   * Extracts the first valid JSON object or array from a string that may contain surrounding text.
   */
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
        val tableNames = listOf("RESOURCE_PROJECT", "FILE_RESOURCE_PROJECT", "FILE_PROJECT")
        for (tableName in tableNames) {
          try {
            val sql = "SELECT uuid FROM $tableName WHERE project_id = ?1 AND name = ?2"
            val query = em.createNativeQuery(sql)
            query.setParameter(1, projectId)
            query.setParameter(2, fileName)
            val results = query.resultList
            if (results.isNotEmpty()) {
              val uuidStr = results[0]?.toString() ?: continue
              return try {
                UUID.fromString(uuidStr)
              } catch (_: Exception) {
                null
              }
            }
          } catch (_: Exception) {
            continue
          }
        }
        for (tableName in tableNames) {
          try {
            val sql = "SELECT uuid FROM $tableName WHERE project_id = ?1 AND filename = ?2"
            val query = em.createNativeQuery(sql)
            query.setParameter(1, projectId)
            query.setParameter(2, fileName)
            val results = query.resultList
            if (results.isNotEmpty()) {
              val uuidStr = results[0]?.toString() ?: continue
              return try {
                UUID.fromString(uuidStr)
              } catch (_: Exception) {
                null
              }
            }
          } catch (_: Exception) {
            continue
          }
        }
        null
      } finally {
        em.close()
      }
    } catch (e: Exception) {
      logger.warn(
          "[AIWorkflowAssistant] Could not resolve project file UUID for '$fileName': ${e.message}")
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

  // endregion JSON Utilities

  // region Data Classes

  /** AI-generated specification for a workflow task. */
  private data class WorkflowTaskSpec(
      val taskName: String = "",
      val taskDescription: String? = null,
      val triggerType: String = "FC_FORM_SUBMIT_BUTTON",
      val triggerParams: Map<String, Any> = emptyMap(),
      val nodeType: String = "FC_EMAIL",
      val nodeParams: Map<String, Any> = emptyMap(),
      val endpointState: String = "Received",
      val stateProperties: Map<String, Any> = emptyMap()
  )

  // endregion Data Classes
}
