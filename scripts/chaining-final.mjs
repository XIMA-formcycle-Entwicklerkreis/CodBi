import fs from 'fs';

const fp = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(fp, 'utf-8');

// 1. Add FC_PROVIDE_RESOURCE handler to buildNodeParamsJson
// Insert before:       "FC_ENCODE_BASE64" -> {
// Which is now placed after FC_DECODE_BASE64 handler

const marker1 = '      "FC_ENCODE_BASE64" -> {';
const handler1 = 
`      "FC_PROVIDE_RESOURCE" -> {
        val exportName = spec.nodeParams["exportName"] as? String ?: ""
        val nodeUuid = spec.nodeParams["_resolvedNodeUuid"] as? String ?: ""
        val taskUuid = spec.nodeParams["_resolvedTaskUuid"] as? String ?: ""
        if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
          """{"name":` + '${gson.toJson(nodeName)}' + `,"description":` + '${gson.toJson(nodeDescription)}' + `,"singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION","nodeKey":{"uuid":` + '${gson.toJson(nodeUuid)}' + `,"taskUuid":` + '${gson.toJson(taskUuid)}' + `}}},"exportName":` + '${gson.toJson(exportName)}' + `,"fileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
        } else {
          """{"name":` + '${gson.toJson(nodeName)}' + `,"description":` + '${gson.toJson(nodeDescription)}' + `,"singleFile":{"resource":{"type":"FILE_PROVIDE_ACTION"}},"exportName":` + '${gson.toJson(exportName)}' + `,"fileProvision":{"attachToFormRecord":false,"attachmentAccessibleToEndUser":true}}"""
        }
      }
      "FC_ENCODE_BASE64" -> {`;

if (c.includes(marker1)) {
    c = c.replace(marker1, handler1);
    console.log('Handler added');
}

// 2. Add chained node processing in createWorkflowTask
// Find the return statement
const retMarker = 'return "Workflow task \'';
const retIdx = c.indexOf(retMarker);
if (retIdx > 0) {
    const before = c.substring(0, retIdx);
    const after = c.substring(retIdx);
    const chainingCode = 
`    // Process chained nodes (sequential actions in the same task)
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
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(chainNode, rootNode)
        createNodeMethod.invoke(workflowNodeApi, userContext, chainNode)
        prevNodeUuid = chainNodeUuidVal
      }
    }
    `;
    c = before + chainingCode + after;
    console.log('Chaining code inserted');
}

// 3. Add system prompt: FC_PROVIDE_RESOURCE after FC_DECODE_BASE64
const promptTarget = `"nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. 'xoxo.txt'>\\"}\\n" +`;
const promptReplace = `"nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. 'xoxo.txt'>\\"}\\n" +
            "  - \\"FC_PROVIDE_RESOURCE\\" — provides (downloads) a file from a preceding action node's output; " +
            "nodeParams: {\\"exportName\\":\\"<filename for download, e.g. 'decoded.txt'>\\", \\"sourceNode\\":\\"%prev%\\"}. " +
            "CRITICAL — Use as a chained node after FC_DECODE_BASE64 to make the decoded file downloadable. " +
            "The sourceNode \\"%prev%\\" placeholder resolves to the preceding node's UUID at creation time.\\n" +
            "  - \\"FC_SHOW_TEMPLATE\\" — renders an HTML template to the user; " +`;

if (c.includes(promptTarget)) {
    c = c.replace(promptTarget, promptReplace);
    console.log('System prompt updated');
}

// 4. Add chainedNodes explanation after multi-lane example
const chainExp = '  CRITICAL — Do NOT use an array for setting a form record status.';
const chainExpNew = `  CHAINED NODES ("chainedNodes" field) — For sequential actions where the second action processes the first action's output (e.g. decode Base64 then download the result), add a "chainedNodes" array inside a single task spec. Each entry has "nodeType" and "nodeParams". Use "%prev%" in chained node's nodeParams to reference the preceding node's UUID and "%sourceTaskUuid%" for the task UUID. Example: {"taskName":"Decode and download","nodeType":"FC_DECODE_BASE64","nodeParams":{"base64":"[%tf1%]","exportName":"decoded.txt"},"chainedNodes":[{"nodeType":"FC_PROVIDE_RESOURCE","nodeParams":{"exportName":"decoded.txt","sourceNode":"%prev%"}}],"endpointState":"Received"}\\n` +
            '  CRITICAL — Do NOT use an array for setting a form record status.';

if (c.includes(chainExp)) {
    c = c.replace(chainExp, chainExpNew);
    console.log('Chaining explanation added');
}

fs.writeFileSync(fp, c, 'utf-8');
console.log('File saved');
