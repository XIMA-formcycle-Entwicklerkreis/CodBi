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

    /** Fallback prompt used when the database is unavailable. */
    private const val FALLBACK_WORKFLOW_PROMPT =
        "You are a FORMCYCLE workflow assistant. The user will describe a desired workflow " +
            "action in natural language. Your ONLY output must be a single JSON object that " +
            "describes the workflow task to create. No explanation, no markdown, no code fences."
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
    val inboxesJson: String? =
        try {
          fetchInboxes(userContext, workflowVersionId)
        } catch (e: Exception) {
          logger.warn("[AIWorkflowAssistant] Could not fetch inboxes", e)
          null
        }
    logger.info(
        "[AIWorkflowAssistant] handleRun: phase={}, completionPages={}, htmlTemplates={}, urlTemplates={}, inboxes={}",
        phase,
        completionPagesJson ?: "null (no pages found or query failed)",
        htmlTemplatesJson ?: "null (no templates found or query failed)",
        urlTemplatesJson ?: "null (no URL templates found or query failed)",
        inboxesJson ?: "null (no inboxes found or query failed)")

    val systemPrompt =
        buildSystemPrompt(
            formContext,
            workflowContext,
            isPhase1 = phase == "1",
            completionPages = completionPagesJson,
            htmlTemplates = htmlTemplatesJson,
            urlTemplates = urlTemplatesJson,
            inboxes = inboxesJson)

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
    val safeCleaned = cleaned.replace("\$ROOT", "00000000-0000-0000-0000-000000000000")
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
          gson.fromJson(safeCleaned, WorkflowTaskSpec::class.java).also { spec ->
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
          logger.warn("[AIWorkflowAssistant] Could not parse AI response as JSON: {}", safeCleaned)
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
      urlTemplates: String? = null,
      inboxes: String? = null
  ): String = buildString {
    // Load static prompt sections from database
    val dbPrompt = loadWorkflowPrompt()
    append(dbPrompt)

    // Dynamic context (injected at runtime)
    if (formContext != null) {
      append(
          "FORM ELEMENTS (match user descriptions via 'displayText'; always use 'technicalId' in output):\n" +
              formContext +
              "\n\n")
    }
    if (workflowContext != null) {
      append(
          "EXISTING WORKFLOW TASKS â€” for reference; avoid creating duplicates:\n" +
              workflowContext +
              "\n\n")
    }
    if (isPhase1) {
      append(
          "IMPORTANT â€” You do NOT yet have the form element list.\n" +
              "You MUST respond with {\"need\":\"form_data\"} UNLESS the request meets ALL of these:\n" +
              "  1. No button is mentioned (not even vaguely â€” e.g. 'submit button', 'Senden', 'absenden')\n" +
              "  2. No form field is mentioned (not even vaguely â€” e.g. 'email field', 'name field', 'E-Mail-Adresse')\n" +
              "  3. All values needed for triggerParams and nodeParams are explicitly given as exact technical identifiers\n" +
              "If ANY of these conditions is NOT met, respond ONLY with: {\"need\":\"form_data\"}\n\n")
    }
    if (!completionPages.isNullOrBlank()) {
      append(
          "AVAILABLE ABSCHLUSSSEITEN (completion pages â€” pick one for failurePage when creating a FC_DOI_INIT node):\n" +
              completionPages +
              "\n\n")
    }
    if (!htmlTemplates.isNullOrBlank()) {
      append(
          "AVAILABLE HTML TEMPLATES (for htmlTemplate when creating a FC_SHOW_TEMPLATE node):\n" +
              htmlTemplates +
              "\n\n")
    }
    if (!urlTemplates.isNullOrBlank()) {
      append(
          "AVAILABLE URL TEMPLATES (for urlTemplate when creating a FC_REDIRECT node):\n" +
              urlTemplates +
              "\n\n")
    }
    if (!inboxes.isNullOrBlank()) {
      append(
          "AVAILABLE INBOXES (for inboxName when creating a FC_MOVE_FORM_RECORD_TO_INBOX node):\n" +
              inboxes +
              "\n\n")
    }
    append("Output ONLY valid JSON. No trailing commas. No comments.")
  }

  /**
   * Loads the workflow system prompt from the database (formcycle.general +
   * formcycle.workflow_nodes). Falls back to a minimal prompt if the DB is unavailable.
   */
  private fun loadWorkflowPrompt(): String {
    val em = CodbiEntities.entityManagerFactory?.createEntityManager()
    if (em == null) return FALLBACK_WORKFLOW_PROMPT
    try {
      val categories = PromptLoader.loadCategory(em, "formcycle")
      return PromptLoader.resolvePlaceholders(
          (categories["formcycle.general"] ?: "") +
              "\n" +
              (categories["formcycle.workflow_nodes"] ?: ""))
    } catch (e: Exception) {
      logger.warn("[AIWorkflowAssistant] Failed to load prompts from DB", e)
      return FALLBACK_WORKFLOW_PROMPT
    } finally {
      em?.close()
    }
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

    // 9c-1. Recursively create child nodes for conditional/loop nodes that have _childNodes.
    // Handles unlimited nesting depth (e.g., FC_FOR_EACH_LOOP → FC_WHILE_LOOP →
    // FC_MULTIPLE_CONDITION → FC_BREAK / FC_CONTINUE and beyond).
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
          "[AIWorkflowAssistant]{} Processing branch children (depth={}) for nodeType={}",
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
            val resolvedJson =
                """{"name":${gson.toJson(childNodeName)},"description":"","breakTarget":{"uuid":${gson.toJson(rootLoopUuid.toString())}}}"""
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
                  "[AIWorkflowAssistant]{} Could not persist breakTarget update: {}",
                  indent,
                  e.message)
            }
            logger.info(
                "[AIWorkflowAssistant]{} Resolved breakTarget -> uuid={} for FC_BREAK, json={}",
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
            val resolvedJson =
                """{"name":${gson.toJson(childNodeName)},"description":"","continueTarget":{"uuid":${gson.toJson(rootLoopUuid.toString())}}}"""
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
                  "[AIWorkflowAssistant]{} Could not persist continueTarget update: {}",
                  indent,
                  e.message)
            }
            logger.info(
                "[AIWorkflowAssistant]{} Resolved continueTarget -> uuid={} for FC_CONTINUE, json={}",
                indent,
                rootLoopUuid,
                resolvedJson)
          }
        }
        logger.info(
            "[AIWorkflowAssistant]{} Created node #{} type={} name='{}' (depth={})",
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
              "[AIWorkflowAssistant]{} Nesting deeper: creating SEQUENCE for nodeType={}",
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
          val savedNestedSeq = createNodeMethod.invoke(workflowNodeApi, userContext, nestedSeq)
          fixParentOrderIndex(savedNestedSeq, savedChildNode, userContext)
          logger.info(
              "[AIWorkflowAssistant]{} Created SEQUENCE id={} (depth={})",
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
          "[AIWorkflowAssistant] Creating YES-branch SEQUENCE wrapper for nodeType={}",
          spec.nodeType)
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
      val savedBranchSeq = createNodeMethod.invoke(workflowNodeApi, userContext, branchSequence)
      fixParentOrderIndex(savedBranchSeq, savedActionNode, userContext)
      logger.info(
          "[AIWorkflowAssistant] Created YES-branch SEQUENCE wrapper id={}",
          savedBranchSeq.javaClass.getMethod("getId").invoke(savedBranchSeq))
      processBranchChildren(spec, savedBranchSeq, topLevelChildNodes, 1)
      // Add endpoint inside the YES-branch SEQUENCE only when the endpoint type is neither
      // FC_CHANGE_STATE (the default) nor FC_RETURN. For the default FC_CHANGE_STATE case,
      // the endpoint is created as a sibling of the condition node by the outer endpoint logic
      // below, so it applies regardless of which branch was taken. For non-default endpoint
      // types (e.g. when the user says the state change should only happen conditionally),
      // the endpoint is placed inside the YES branch so it only executes when the condition
      // is met. The conditional node is a branching node: its YES branch executes the child
      // actions, but the lane continues below it.
      val effectiveEndpointType = spec.endpointType.ifBlank { "FC_CHANGE_STATE" }
      if (effectiveEndpointType != "FC_CHANGE_STATE" && effectiveEndpointType != "FC_RETURN") {
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
            "[AIWorkflowAssistant] Created endpoint '{}' inside YES-branch SEQUENCE", stateName)
      }
    }

    // 9c-2. FC_SWITCH handler: creates a multi-branch switch/case structure.
    // Structure: FC_SWITCH → FC_SWITCH_DEFAULT (index 0, else path) + FC_SWITCH_CASE (index 1+,
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
            "[AIWorkflowAssistant] Created SEQUENCE container under {}",
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
      // Step 1: Default branch first (index 0) — FC_SWITCH_DEFAULT, no conditions
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
        logger.info("[AIWorkflowAssistant] Created SWITCH DEFAULT branch")
        createActionSeq(savedDefNode, defaultChildNodes)
      }
      // Step 2: Case branches second (index 1+) — FC_SWITCH_CASE with conditions
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
          logger.info(
              "[AIWorkflowAssistant] Created SWITCH CASE #{} values={}", caseIdx, caseValues)
          createActionSeq(savedCaseNode, caseChildNodes)
        }
      }
      // Do NOT return early — let execution continue to the trigger creation,
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
              val savedSeq = createNodeMethod.invoke(workflowNodeApi, userContext, seq)
              fixParentOrderIndex(savedSeq, savedActionNode, userContext)
              logger.info(
                  "[AIWorkflowAssistant] Created FC_EXPERIMENT {} SEQUENCE at idx={}",
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

    // 9d. Endpoint node: every workflow lane requires a final endpoint (Endpunkt) that
    //     sets the form record to its terminal status (FC_CHANGE_STATE) or simply ends
    //     the process (FC_RETURN). Skip when:
    //     - the main action IS a state change (it already serves as the endpoint), or
    //     - the record is deleted (no status to transition to after deletion), or
    //     - the action is a conditional node with _childNodes and a non-default endpoint
    //       type (the endpoint was already created inside the YES branch above).
    val isNonDefaultEndpointInYesBranch =
        topLevelChildNodes != null &&
            spec.endpointType.ifBlank { "FC_CHANGE_STATE" } != "FC_CHANGE_STATE" &&
            spec.endpointType != "FC_RETURN"
    val effectiveEndpointType = spec.endpointType.ifBlank { "FC_CHANGE_STATE" }
    if (spec.nodeType != "FC_CHANGE_STATE" &&
        spec.nodeType != "FC_DELETE_FORM_RECORD" &&
        spec.nodeType != "FC_QUEUE_TASK" &&
        spec.nodeType != "FC_RETURN" &&
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
      // It does NOT need a target state — just create the node and attach it to the task.
      if (effectiveEndpointType == "FC_RETURN") {
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(endpointNode, savedTask)
        workflowNodeClass
            .getMethod("setParent", workflowNodeClass)
            .invoke(endpointNode, savedRootNode)
        val savedEndpointNode = createNodeMethod.invoke(workflowNodeApi, userContext, endpointNode)
        fixParentOrderIndex(savedEndpointNode, savedRootNode, userContext)
        logger.info(
            "[AIWorkflowAssistant] Created FC_RETURN endpoint node (process ends without state change)")
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
              // Create new state
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
              val stateId =
                  matchedState?.javaClass?.getMethod("getId")?.invoke(matchedState) as? Long
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
                  "[AIWorkflowAssistant] Updated existing workflow state '{}' properties",
                  stateName)
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
          val savedEndpointNode =
              createNodeMethod.invoke(workflowNodeApi, userContext, endpointNode)
          fixParentOrderIndex(savedEndpointNode, savedRootNode, userContext)
        } else {
          logger.warn("[AIWorkflowAssistant] Skipping endpoint node: no workflow states found")
        }
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
   * Fetches available inboxes (Postfach entities) for the project's client/mandant and returns them
   * as a JSON array string (e.g. [{"name":"Default inbox","uuid":"..."}...]). Returns null if the
   * inboxes cannot be loaded. Uses PostfachAPI.getAllByClient() via reflection.
   */
  private fun fetchInboxes(userContext: Any, workflowVersionId: Long): String? {
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
                  p::class.java.getMethod("getName").invoke(p) as? String ?: return@mapNotNull null
              val uuidObj =
                  p::class.java.getMethod("getUUIDObject").invoke(p) as? java.util.UUID
                      ?: return@mapNotNull null
              """{"name":${gson.toJson(name)},"uuid":${gson.toJson(uuidObj.toString())}}"""
            } catch (_: Exception) {
              null
            }
          }
      return "[${inboxes.joinToString(",")}]"
    } catch (e: Exception) {
      logger.warn("[AIWorkflowAssistant] Failed to fetch inboxes: ${e.message}")
      return null
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
            "[AIWorkflowAssistant] buildNodeParams FC_WRITE_FORM_RECORD_ATTRIBUTES: {} attributes, writeAttributesToForm={}",
            attributes.size,
            writeAttributesToForm)
        """{"name":${gson.toJson(nodeName)},"customAttributes":[${attributes.joinToString(",")}],"writeAttributesToForm":$writeAttributesToForm}"""
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
                "[AIWorkflowAssistant] Could not resolve project UUID for '{}': {}",
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
                "[AIWorkflowAssistant] Could not resolve state UUID for '{}': {}",
                stateName,
                causeMsg)
          }
        }
        val stateJson =
            if (stateUuid != null)
                ""","stateNewRecord":{"uuid":${gson.toJson(stateUuid.toString())},"entityClass":"de.xima.fc.entities.WorkflowState"}"""
            else ""
        val pluginResult =
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"copyValues":true,"copyAll":$copyAll$projectJson$stateJson$elementsToCopyJson$multiFileJson}"""
        logger.info(
            "[AIWorkflowAssistant] CreateRecordNodePlugin JSON: projectName='{}', stateName='{}', projectUuid={}, stateUuid={}, result_len={}",
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
        if (attachments.isNotEmpty()) {
          // Use attachmentsToDelete with MultiAttachment structure (decompiled from
          // FcDeleteAttachmentProps)
          // Property key must be "attachmentsToDelete" matching the field in
          // FcDeleteAttachmentProps class
          val attachmentItemsJson =
              attachments.joinToString(",") { id ->
                """{"type":"UPLOAD","identifier":${gson.toJson(id)}}"""
              }
          val resultJson =
              """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"attachmentsToDelete":{"attachments":[$attachmentItemsJson]}}"""
          logger.info(
              "[AIWorkflowAssistant] FC_DELETE_ATTACHMENT generated (attachmentsToDelete): {}",
              resultJson)
          resultJson
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
        }
      }
      "FC_MOVE_FORM_RECORD_TO_INBOX" -> {
        @Suppress("UNCHECKED_CAST") val inboxName = spec.nodeParams["inboxName"] as? String ?: ""
        val targetType = spec.nodeParams["targetType"] as? String ?: ""
        if (inboxName.isNotBlank()) {
          val json =
              if (targetType == "COMPUTED_INBOX_NAME") {
                // AI explicitly wants runtime name lookup — use COMPUTED_INBOX_NAME
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
                            "[AIWorkflowAssistant] FC_MOVE_FORM_RECORD_TO_INBOX resolved inbox '{}' to UUID: {}",
                            inboxName,
                            inboxUuid)
                      }
                    } else {
                      logger.warn(
                          "[AIWorkflowAssistant] FC_MOVE_FORM_RECORD_TO_INBOX inbox '{}' not found",
                          inboxName)
                    }
                  } catch (e: Exception) {
                    logger.warn(
                        "[AIWorkflowAssistant] FC_MOVE_FORM_RECORD_TO_INBOX could not resolve inbox UUID: {}",
                        e.message)
                  }
                }
                if (inboxUuid != null) {
                  """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"targetType":"STATIC_INBOX","inboxReference":{"uuid":${gson.toJson(inboxUuid)},"entityClass":"de.xima.fc.entities.Postfach"}}"""
                } else {
                  """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"targetType":"COMPUTED_INBOX_NAME","inboxName":${gson.toJson(inboxName)}}"""
                }
              }
          logger.info("[AIWorkflowAssistant] FC_MOVE_FORM_RECORD_TO_INBOX generated: {}", json)
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
            "GREATER_THAN_OR_EQUAL" -> "≥"
            "LESSER" -> "less than"
            "LESS_THAN_OR_EQUAL" -> "≤"
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
              // Multiple conditions — build a combined description
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
        val sourceType =
            (spec.nodeParams["sourceType"] as? String ?: "FORM_FIELD_REPETITIONS").uppercase()
        val formFieldName =
            spec.nodeParams["fieldTechnicalId"] as? String
                ?: spec.nodeParams["formFieldName"] as? String
                ?: ""
        when (sourceType) {
          "CHARACTER_SEPARATED_VALUES" -> {
            val csvString =
                spec.nodeParams["csvString"] as? String
                    ?: if (formFieldName.isNotBlank()) "[%$formFieldName%]" else ""
            val delimiter = (spec.nodeParams["delimiter"] as? String)?.ifBlank { "," } ?: ","
            val trim = (spec.nodeParams["trim"] as? String)?.lowercase() ?: "true"
            val filterEmpty = (spec.nodeParams["filterEmpty"] as? String)?.lowercase() ?: "true"
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"sourceProps":{"type":"characterSeparatedValues","csvString":${gson.toJson(csvString)},"delimiter":${gson.toJson(delimiter)},"trim":$trim,"filterEmpty":$filterEmpty,"treatLineBreaksAsDelimiter":false}}"""
          }
          else -> {
            // Default: FORM_FIELD_REPETITIONS
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
        // because while-loops do not have YES/NO branches — they just loop or exit.
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
        null
      }
      "FC_BREAK" -> {
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
        val continueTarget = spec.nodeParams["continueTarget"] as? String
        if (!continueTarget.isNullOrBlank()) {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"continueTarget":{"uuid":${gson.toJson(continueTarget)}}}"""
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""
        }
      }
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
      val endpointState: String = "",
      val endpointType: String = "FC_CHANGE_STATE",
      val stateProperties: Map<String, Any> = emptyMap()
  )

  // endregion Data Classes
}
