package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

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

    val systemPrompt = buildSystemPrompt(formContext, workflowContext, isPhase1 = phase == "1")

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
    logger.debug("[AIWorkflowAssistant] AI response (phase {}): {}", phase, cleaned)

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
          gson.fromJson(cleaned, WorkflowTaskSpec::class.java)
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
   * 2), they are embedded directly so the AI can use exact field/button names.
   */
  private fun buildSystemPrompt(
      formContext: String?,
      workflowContext: String?,
      isPhase1: Boolean
  ): String = buildString {
    append(
        "You are a FORMCYCLE workflow assistant. The user will describe a desired workflow " +
            "action in natural language. Your ONLY output must be a single JSON object that " +
            "describes the workflow task to create. No explanation, no markdown, no code fences.\n\n")
    append(
        "Output format (JSON object with exactly these keys):\n" +
            "\"{\"taskName\":\"...\", \"taskDescription\":\"...\", \"triggerType\":\"...\", \"triggerParams\":{}, \"nodeType\":\"...\", \"nodeParams\":{}, \"endpointState\":\"...\"}\"" +
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
    val triggerParamsJson = buildTriggerParamsJson(spec)
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
      val endpointStateUuid =
          resolveStateUuid(userContext, workflowVersion, spec.endpointState)
              ?: resolveFirstStateUuid(userContext, workflowVersion)
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
  private fun buildTriggerParamsJson(spec: WorkflowTaskSpec): String? {
    return when (spec.triggerType) {
      "FC_FORM_SUBMIT_BUTTON" -> {
        val buttonName = spec.triggerParams["buttonName"] as? String ?: ""
        """{"buttonName":${gson.toJson(buttonName)}}"""
      }
      else -> null // FC_MANUAL and others need no custom params
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
    return when (spec.nodeType) {
      "FC_EMAIL" -> {
        val to = spec.nodeParams["to"] as? String ?: ""
        val subject = spec.nodeParams["subject"] as? String ?: ""
        val body = spec.nodeParams["body"] as? String ?: ""
        val from = spec.nodeParams["from"] as? String ?: ""
        val senderName = spec.nodeParams["senderName"] as? String ?: ""
        // to / cc / bcc are List<String> in FcEmailProps — serialise as JSON arrays
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
      val endpointState: String = "Received"
  )

  // endregion Data Classes
}
