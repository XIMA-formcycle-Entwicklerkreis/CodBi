import fs from 'fs';

const filePath = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(filePath, 'utf-8');

function esc(str) {
    // Convert Kotlin string interpolation ${...} to literal by escaping
    return str.replace(/\$\{/g, 'DOLLAR{').replace(/\$/g, 'DOLLAR').replace(/DOLLAR/g, '$');
}

// ===== 1. Update WorkflowTaskSpec data class =====
const oldSpec = `  private data class WorkflowTaskSpec(
      val taskName: String = "",
      val taskDescription: String? = null,
      val triggerType: String = "FC_FORM_SUBMIT_BUTTON",
      val triggerParams: Map<String, Any> = emptyMap(),
      val nodeType: String = "FC_EMAIL",
      val nodeParams: Map<String, Any> = emptyMap(),
      val endpointState: String = "Received",
      val stateProperties: Map<String, Any> = emptyMap()
  )`;

const newSpec = `  private data class WorkflowTaskSpec(
      val taskName: String = "",
      val taskDescription: String? = null,
      val triggerType: String = "FC_FORM_SUBMIT_BUTTON",
      val triggerParams: Map<String, Any> = emptyMap(),
      val nodeType: String = "FC_EMAIL",
      val nodeParams: Map<String, Any> = emptyMap(),
      val chainedNodes: List<Map<String, Any>>? = null,
      val endpointState: String = "Received",
      val stateProperties: Map<String, Any> = emptyMap()
  )`;

if (c.includes(oldSpec)) {
    c = c.replace(oldSpec, newSpec);
    console.log('1. WorkflowTaskSpec updated with chainedNodes');
}

// ===== 2. Add FC_PROVIDE_RESOURCE to deriveNodeName =====
const dnnTarget = '          "FC_ENCODE_BASE64" -> "Encode Base64"';
const dnnReplacement = '          "FC_PROVIDE_RESOURCE" -> "Provide resource file"\n          "FC_ENCODE_BASE64" -> "Encode Base64"';
if (c.includes(dnnTarget)) {
    c = c.replace(dnnTarget, dnnReplacement);
    console.log('2. deriveNodeName: FC_PROVIDE_RESOURCE added');
}

// ===== 3. Add FC_PROVIDE_RESOURCE handler before FC_ENCODE_BASE64 handler =====
const handlerTarget = '      "FC_ENCODE_BASE64" -> {';

const gs = '${gson.toJson('; // Helper - needs to use ${} for Kotlin string interpolation
const nj = 'nodeName)}';
const nd = 'nodeDescription)}';

const provideHandlerCode = 
`      "FC_PROVIDE_RESOURCE" -> {
        val exportName = spec.nodeParams["exportName"] as? String ?: ""
        val sourceNode = spec.nodeParams["sourceNode"] as? String ?: ""
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
          """{"name":` + '${gson.toJson(nodeName)}' + `,"description":` + '${gson.toJson(nodeDescription)}' + `,"singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":` + '${gson.toJson(nodeUuid)}' + `,"taskUuid":` + '${gson.toJson(taskUuid)}' + `}}},"exportName":` + '${gson.toJson(exportName)}' + `,"fileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
        } else {
          """{"name":` + '${gson.toJson(nodeName)}' + `,"description":` + '${gson.toJson(nodeDescription)}' + `,"singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION"}},"exportName":` + '${gson.toJson(exportName)}' + `,"fileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
        }
      }
      "FC_ENCODE_BASE64" -> {`;

if (c.includes(handlerTarget)) {
    c = c.replace(handlerTarget, provideHandlerCode);
    console.log('3. FC_PROVIDE_RESOURCE handler added to buildNodeParamsJson');
}

// ===== 4. System prompt: Add FC_PROVIDE_RESOURCE docs after FC_DECODE_BASE64 =====
const promptTarget = `"nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. 'xoxo.txt'>\\"}\\n" +`;
const promptReplacement = `"nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. 'xoxo.txt'>\\"}\\n" +
            "  - \\"FC_PROVIDE_RESOURCE\\" — provides (downloads) a file from a preceding action node's output; " +
            "nodeParams: {\\"exportName\\":\\"<filename for download, e.g. 'decoded.txt'>\\", \\"sourceNode\\":\\"%prev%\\"}. " +
            "CRITICAL — Use as a chained node after FC_DECODE_BASE64 to make the decoded file downloadable. " +
            "The sourceNode \\"%prev%\\" placeholder is resolved to the preceding node's UUID at creation time.\\n" +
            "  - \\"FC_SHOW_TEMPLATE\\" — renders an HTML template to the user; " +`;

if (c.includes(promptTarget)) {
    c = c.replace(promptTarget, promptReplacement);
    console.log('4. System prompt: FC_PROVIDE_RESOURCE documented');
} else {
    console.log('WARNING: Prompt target not found - trying alternative');
    // Find the line with FC_DECODE_BASE64 in the NODE TYPES section
}

// ===== 5. Add chainedNodes explanation to system prompt (after Output format) =====
const chainTarget = '  CRITICAL — Do NOT use an array for setting a form record status.';
const chainReplacement = '  CHAINED NODES ("chainedNodes" field) — For sequential actions where the second action processes the first action\'s output (e.g. decode Base64 then download the result), ' +
            'add a "chainedNodes" array inside a single task spec. ' +
            'Each entry in chainedNodes has "nodeType" and "nodeParams" keys just like the main node. ' +
            'Use "%prev%" in a chained node\'s params to reference the immediately preceding node\'s UUID. ' +
            'Example: {"taskName":"Decode and download","nodeType":"FC_DECODE_BASE64","nodeParams":{"base64":"[%tf1%]","exportName":"decoded.txt"},"chainedNodes":[{"nodeType":"FC_PROVIDE_RESOURCE","nodeParams":{"exportName":"decoded.txt","sourceNode":"%prev%"}}],"endpointState":"Received"}\n' +
            '  CRITICAL — Do NOT use an array for setting a form record status.';

if (c.includes(chainTarget)) {
    c = c.replace(chainTarget, chainReplacement);
    console.log('5. Chained nodes explanation added to system prompt');
}

// ===== 6. Modify createWorkflowTask to process chained nodes =====
// Find the fixParent_order_idx method which is right after the main creation code
const fixParentTarget = '    val fixParentOrderIdx = { nodeId: Long, parentId: Long ->';
if (c.includes(fixParentTarget)) {
    // Insert chained node processing BEFORE the fixParentOrderIdx section
    // Find the line: return "Workflow task '" + spec.taskName...
    const returnTarget = 'return "Workflow task \'";
    const retIdx = c.indexOf(returnTarget);
    if (retIdx >= 0) {
        const chainInsertCode = `    // Process chained nodes (sequential action nodes in the same task)
    if (spec.chainedNodes != null && spec.chainedNodes.isNotEmpty()) {
      var prevNodeUuid = actionNode.javaClass.getMethod("getUUIDObject").invoke(actionNode) as UUID
      var prevTaskUuid = task.javaClass.getMethod("getUUIDObject").invoke(task) as UUID
      for ((chainIdx, chainSpecMap) in spec.chainedNodes.withIndex()) {
        val chainSpec = gson.fromJson(gson.toJson(chainSpecMap), WorkflowTaskSpec::class.java)
        val chainNode = workflowNodeClass.getDeclaredConstructor().newInstance()
        val chainNodeName = deriveNodeName(chainSpec)
        workflowNodeClass.getMethod("setName", String::class.java).invoke(chainNode, chainNodeName)
        workflowNodeClass.getMethod("setType", String::class.java).invoke(chainNode, chainSpec.nodeType)
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(chainNode, true)
        val chainNodeUuidVal = UUID.randomUUID()
        workflowNodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(chainNode, chainNodeUuidVal)
        // Resolve %prev%, %sourceNodeUuid%, %sourceTaskUuid% placeholders
        val resolvedParams = chainSpec.nodeParams.mapValues { (_, v) ->
          when (v) {
            "%prev%", "%sourceNodeUuid%" -> prevNodeUuid.toString()
            "%sourceTaskUuid%" -> prevTaskUuid.toString()
            else -> v
          }
        } + mapOf("_resolvedNodeUuid" to prevNodeUuid.toString(), "_resolvedTaskUuid" to prevTaskUuid.toString())
        val chainSpecWithUuids = chainSpec.copy(nodeParams = resolvedParams)
        val chainParamsJson = buildNodeParamsJson(chainSpecWithUuids, workflowVersion, userContext)
        if (chainParamsJson != null) {
          workflowNodeClass.getMethod("setCustomParameters", String::class.java).invoke(chainNode, chainParamsJson)
        }
        // Set parent to root SEQUENCE node
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(chainNode, rootNode)
        // Persist to DB
        createNodeMethod.invoke(workflowNodeApi, userContext, chainNode)
        // Update prevNodeUuid so the next chained node references THIS one
        prevNodeUuid = chainNodeUuidVal
      }
    }
    `;
        // Insert before the return statement
        const retLineStart = retIdx;
        c = c.substring(0, retLineStart) + chainInsertCode + '\n    ' + c.substring(retLineStart);
        console.log('6. Chained node processing added to createWorkflowTask');
    }
} else {
    console.log('WARNING: fixParent target not found in createWorkflowTask');
}

fs.writeFileSync(filePath, c, 'utf-8');
console.log('Done');
