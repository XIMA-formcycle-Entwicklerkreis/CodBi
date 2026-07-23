#!/usr/bin/env python3
"""Fix the FC_SWITCH handler to use FC_SWITCH_CASE/FC_SWITCH_DEFAULT node types."""
import re

with open('src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the FC_SWITCH handler
old_start = '// 9c-2. FC_SWITCH handler: creates a multi-branch switch/case structure.'

# Find the end: "// Do NOT return early" followed by closing }
old_end_marker = '// Do NOT return early'

start_idx = content.find(old_start)
end_marker_idx = content.find(old_end_marker, start_idx)
end_brace = content.find('}', end_marker_idx)

if start_idx < 0 or end_marker_idx < 0 or end_brace < 0:
    print(f"Could not find markers: start={start_idx}, end_marker={end_marker_idx}, end_brace={end_brace}")
    exit(1)

replacement_end = end_brace + 1

new_handler = '''    // 9c-2. FC_SWITCH handler: creates a multi-branch switch/case structure.
    // Structure confirmed from properly configured switch (from log):
    //   FC_SWITCH (FcSwitchHandler)
    //   +-- FC_SWITCH_CASE (FcSwitchCaseHandler) -> SEQUENCE -> actions
    //   +-- FC_SWITCH_CASE (FcSwitchCaseHandler) -> SEQUENCE -> actions
    //   +-- FC_SWITCH_DEFAULT (FcSwitchDefaultHandler) -> SEQUENCE -> actions
    // The case/default node types ARE the branch markers. FcSwitchCaseProps
    // is stored on the FC_SWITCH_CASE node, NOT on the SEQUENCE wrapper.
    @Suppress("UNCHECKED_CAST")
    if (spec.nodeType == "FC_SWITCH") {
      val cases = (spec.nodeParams["_cases"] as? List<Map<String, Any>>)?.ifEmpty { null }
      val defaultChildNodes =
          (spec.nodeParams["_defaultChildNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
      // Helper: create SEQUENCE wrapper under a parent with action nodes + endpoint
      val createActionSeq: (Any, String, List<Map<String, Any>>?) -> Unit = { parent, label, childNodesList ->
        val seq = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(seq, "FcSequenceHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(seq, "SEQUENCE")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(seq, true)
        workflowNodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(seq, UUID.randomUUID())
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(seq, savedTask)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(seq, parent)
        val savedSeq = createNodeMethod.invoke(workflowNodeApi, userContext, seq)
        fixParentOrderIndex(savedSeq, parent, userContext)
        logger.info("[AICodBiAssistant] Created {} SEQUENCE under {}", label,
            parent.javaClass.getMethod("getType").invoke(parent))
        if (childNodesList != null) {
          for ((_, childSpecMap) in childNodesList.withIndex()) {
            val childSpec = gson.fromJson(gson.toJson(childSpecMap), WorkflowTaskSpec::class.java)
            val childNodeName = deriveNodeName(childSpec)
            val childNode = workflowNodeClass.getDeclaredConstructor().newInstance()
            workflowNodeClass.getMethod("setName", String::class.java).invoke(childNode, childNodeName)
            workflowNodeClass.getMethod("setType", String::class.java).invoke(childNode, childSpec.nodeType)
            workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(childNode, true)
            workflowNodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(childNode, UUID.randomUUID())
            val childParamsJson = buildNodeParamsJson(childSpec, workflowVersion, userContext)
            if (childParamsJson != null) {
              workflowNodeClass.getMethod("setCustomParameters", String::class.java).invoke(childNode, childParamsJson)
            }
            workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(childNode, savedTask)
            workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(childNode, savedSeq)
            val savedChildNode = createNodeMethod.invoke(workflowNodeApi, userContext, childNode)
            fixParentOrderIndex(savedChildNode, savedSeq, userContext)
          }
        }
        if (spec.endpointType != "FC_RETURN") {
          val stateName = spec.endpointState.ifBlank { "Received" }
          var endpointStateUuid: Any? = null
          try { endpointStateUuid = resolveStateUuid(userContext, workflowVersion, stateName) } catch (_: Exception) {}
          val epNode = workflowNodeClass.getDeclaredConstructor().newInstance()
          val epType = spec.endpointType.ifBlank { "FC_CHANGE_STATE" }
          workflowNodeClass.getMethod("setName", String::class.java).invoke(epNode, epType)
          workflowNodeClass.getMethod("setType", String::class.java).invoke(epNode, epType)
          workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(epNode, true)
          workflowNodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(epNode, UUID.randomUUID())
          if (endpointStateUuid != null) {
            val uuidStr = endpointStateUuid.toString()
            val epJson = """{"targetState":{"uuid":${gson.toJson(uuidStr)},"entityClass":"de.xima.fc.entities.WorkflowState"}}"""
            workflowNodeClass.getMethod("setCustomParameters", String::class.java).invoke(epNode, epJson)
          }
          workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(epNode, savedTask)
          workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(epNode, savedSeq)
          val savedEp = createNodeMethod.invoke(workflowNodeApi, userContext, epNode)
          fixParentOrderIndex(savedEp, savedSeq, userContext)
        }
      }
      // Create case branches
      if (cases != null) {
        for ((caseIdx, caseSpec) in cases.withIndex()) {
          val caseValues = (caseSpec["caseValues"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
          val caseCombinationType = caseSpec["combinationType"] as? String ?: "OR"
          val caseCustomExpression = caseSpec["customExpression"] as? String ?: ""
          val caseDescription = caseSpec["description"] as? String ?: ""
          @Suppress("UNCHECKED_CAST")
          val caseChildNodes = (caseSpec["_childNodes"] as? List<Map<String, Any>>)?.ifEmpty { null }
          // Create FC_SWITCH_CASE node as child of switch
          val caseNode = workflowNodeClass.getDeclaredConstructor().newInstance()
          workflowNodeClass.getMethod("setName", String::class.java).invoke(caseNode, "FcSwitchCaseHandler")
          workflowNodeClass.getMethod("setType", String::class.java).invoke(caseNode, "FC_SWITCH_CASE")
          workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(caseNode, true)
          workflowNodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(caseNode, UUID.randomUUID())
          // Set FcSwitchCaseProps on the FC_SWITCH_CASE node
          val caseValuesJson = caseValues.joinToString(",", "[", "]") { v ->
            """{"caseValue":${gson.toJson(v)},"matchCondition":"EQUAL","variableName":"C${caseValues.indexOf(v) + 1}"}"""
          }
          val caseCustomExprJson = if (caseCombinationType == "CUSTOM" && caseCustomExpression.isNotBlank()) {
            ""","customExpression":${gson.toJson(caseCustomExpression)}"""
          } else ""
          val caseParamsJson =
            """{"caseValues":$caseValuesJson,"combinationType":${gson.toJson(caseCombinationType)},"description":${gson.toJson(caseDescription)}$caseCustomExprJson}"""
          workflowNodeClass.getMethod("setCustomParameters", String::class.java).invoke(caseNode, caseParamsJson)
          workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(caseNode, savedTask)
          workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(caseNode, savedActionNode)
          val savedCaseNode = createNodeMethod.invoke(workflowNodeApi, userContext, caseNode)
          fixParentOrderIndex(savedCaseNode, savedActionNode, userContext)
          logger.info("[AICodBiAssistant] Created SWITCH CASE #{} values={}", caseIdx, caseValues)
          // Create SEQUENCE under FC_SWITCH_CASE with actions + endpoint
          createActionSeq(savedCaseNode, "case", caseChildNodes)
        }
      }
      // Create default branch
      if (defaultChildNodes != null) {
        val defNode = workflowNodeClass.getDeclaredConstructor().newInstance()
        workflowNodeClass.getMethod("setName", String::class.java).invoke(defNode, "FcSwitchDefaultHandler")
        workflowNodeClass.getMethod("setType", String::class.java).invoke(defNode, "FC_SWITCH_DEFAULT")
        workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(defNode, true)
        workflowNodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(defNode, UUID.randomUUID())
        workflowNodeClass.getMethod("setCustomParameters", String::class.java).invoke(defNode, "{}")
        workflowNodeClass.getMethod("setTask", workflowTaskClass).invoke(defNode, savedTask)
        workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(defNode, savedActionNode)
        val savedDefNode = createNodeMethod.invoke(workflowNodeApi, userContext, defNode)
        fixParentOrderIndex(savedDefNode, savedActionNode, userContext)
        logger.info("[AICodBiAssistant] Created SWITCH DEFAULT")
        createActionSeq(savedDefNode, "default", defaultChildNodes)
      }'''

content = content[:start_idx] + new_handler + content[replacement_end:]

with open('src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: FC_SWITCH handler replaced with FC_SWITCH_CASE/FC_SWITCH_DEFAULT structure")
