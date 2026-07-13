# Fix: FC_ENCODE_BASE64 / FC_DECODE_BASE64 Workflow Node Generation

## Problem

When the user prompts the AI assistant with "Beim Klick auf submit soll das Bild im Formular in Base64 umgewandelt werden und in X.b64 gespeichert werden" (convert image to Base64 on submit), the AI correctly identifies that `FC_ENCODE_BASE64` is the right workflow node type, but:

1. **The AI doesn't know what `nodeParams` to generate** — the system prompt (`buildWorkflowSystemPrompt()`) has no documentation for `FC_ENCODE_BASE64` or `FC_DECODE_BASE64` node parameters.

2. **The AI's generated `nodeParams` are completely ignored** — `buildNodeParamsJson()` has no handler for `FC_ENCODE_BASE64` or `FC_DECODE_BASE64`, so they fall through to the `else` case which only produces `{"name":...,"description":...}` without any encoding configuration.

## Root Cause

- `FC_ENCODE_BASE64` and `FC_DECODE_BASE64` are listed only in the `FC_CATCH_ERROR` trigger's action type list and in the `deriveNodeName()` mapping
- They are **missing** from the NODE TYPES documentation section that tells the AI what `nodeParams` to generate
- They are **missing** from the `buildNodeParamsJson()` `when` expression, so their parameters are never serialized into the workflow node configuration

## Files to Modify

### 1. `src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt`

#### Change 1a: System Prompt (line ~3562)

**Insert** after the `FC_RETURN_FILE` documentation block (line 3562 ends with `"xoxo.txt").\n" +`) and **before** `FC_SHOW_TEMPLATE` (line 3563 starts with `"  - \"FC_SHOW_TEMPLATE\" — renders...`):

```kotlin
            "  - \"FC_ENCODE_BASE64\" — encodes a file or form upload to Base64; " +
            "nodeParams: {\"file\":\"<filename from form resources, e.g. 'xoxo.txt'>\", " +
            "\"outputFileName\":\"<optional output filename, e.g. 'xoxo.b64'>\"}\n" +
            "  - \"FC_DECODE_BASE64\" — decodes a Base64-encoded file back to its original format; " +
            "nodeParams: {\"file\":\"<filename from form resources, e.g. 'xoxo.b64'>\", " +
            "\"outputFileName\":\"<optional output filename, e.g. 'xoxo.txt'>\"}\n" +
```

#### Change 1b: buildNodeParamsJson (line ~4608-4609)

**Insert** between the end of `FC_RETURN_FILE` case (line 4608: `}`) and the start of `FC_SHOW_TEMPLATE` case (line 4609: `"FC_SHOW_TEMPLATE" -> {`):

```kotlin
      "FC_ENCODE_BASE64" -> {
        val fileName = spec.nodeParams["file"] as? String ?: ""
        val outputFileName = spec.nodeParams["outputFileName"] as? String ?: ""
        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
        if (fileUuid != null) {
          val uuidStr = fileUuid.toString()
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"outputFileName":${gson.toJson(outputFileName)}}"""
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"outputFileName":${gson.toJson(outputFileName)}}"""
        }
      }
      "FC_DECODE_BASE64" -> {
        val fileName = spec.nodeParams["file"] as? String ?: ""
        val outputFileName = spec.nodeParams["outputFileName"] as? String ?: ""
        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
        if (fileUuid != null) {
          val uuidStr = fileUuid.toString()
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"outputFileName":${gson.toJson(outputFileName)}}"""
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"outputFileName":${gson.toJson(outputFileName)}}"""
        }
      }
```

### 2. `src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIWorkflowAssistant.kt`

Apply **exactly the same two changes** to the corresponding functions in this file.

## Implementation Strategy

Since the Kotlin file uses em dashes (`—`) in string literals and has complex escaping, the recommended approach is to:

1. Open the file in VS Code
2. Navigate to the exact insertion points using the line numbers above
3. Copy-paste the new code blocks manually, ensuring proper indentation

Alternatively, use a Node.js/Python script to do the text replacement (since PowerShell had escaping issues).

## Verification

After making changes, verify that:

1. `Select-String -Path "AICodBiAssistant.kt" -Pattern "encodes a file|decodes a Base64"` returns results
2. `Select-String -Path "AICodBiAssistant.kt" -Pattern "FC_ENCODE_BASE64" ->"` returns the new handler case
3. The same for `AIWorkflowAssistant.kt`
4. The project compiles without errors (`mvn compile` or equivalent)
