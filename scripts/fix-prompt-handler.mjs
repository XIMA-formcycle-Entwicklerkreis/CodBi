import fs from 'fs';

const filePath = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(filePath, 'utf-8');

// Fix 1: Update the system prompt to tell AI to use the upload field's technicalId
const oldPrompt = '  - "FC_ENCODE_BASE64" — encodes a file or form upload to Base64; " +\n            "nodeParams: {"file":"<filename from form resources, e.g. \'xoxo.txt\'>"}\n" +';
const newPrompt = '  - "FC_ENCODE_BASE64" — encodes an uploaded file (image/document) to Base64; " +\n            "nodeParams: {"file":"<technicalId of the XUpload form field containing the file to encode, e.g. \'fdBild\' — CRITICAL: use the form element\'s technicalId (properties.name), NOT a made-up filename>"}\n" +';

if (c.includes(oldPrompt)) {
    c = c.replace(oldPrompt, newPrompt);
    console.log('Prompt updated');
} else {
    console.log('WARNING: Old prompt not found');
}

// Fix 2: Update the FC_ENCODE_BASE64 handler to use forUploadElement format
const oldHandler = `      "FC_ENCODE_BASE64" -> {
        val fileName = spec.nodeParams["file"] as? String ?: ""
        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
        if (fileUuid != null) {
          val uuidStr = fileUuid.toString()
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"resource":{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}},"attachmentFilter":[]}}"""
        } else {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"searchFilename":${gson.toJson(fileName)},"attachmentFilter":["FORM_UPLOAD"]}}"""
        }
      }`;

const newHandler = `      "FC_ENCODE_BASE64" -> {
        val fileName = spec.nodeParams["file"] as? String ?: ""
        if (fileName.isBlank()) {
          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"attachmentFilter":["FORM_UPLOAD"]}}"""
        } else {
          // Try 1: Resolve as project resource (form file management section)
          val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
          if (fileUuid != null) {
            val uuidStr = fileUuid.toString()
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"resource":{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}},"attachmentFilter":[]}}"""
          } else {
            // Try 2: Reference as form upload element by technical ID (forUploadElement pattern)
            // The fileName is the upload element's name (e.g. "fdBild"). The SingleFile.forUploadElement
            // factory method creates a searchFilename + FORM_UPLOAD filter with the element ID.
            """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"searchFilename":${gson.toJson(fileName)},"attachmentFilter":["FORM_UPLOAD"]}}"""
          }
        }
      }`;

if (c.includes(oldHandler)) {
    c = c.replace(oldHandler, newHandler);
    console.log('Handler updated');
} else {
    console.log('WARNING: Old handler not found - trying to find it');
    const idx = c.indexOf('FC_ENCODE_BASE64" -> {');
    if (idx >= 0) {
        const snippet = c.substring(idx, idx + 600);
        console.log('Found at', idx);
        console.log(snippet);
    }
}

fs.writeFileSync(filePath, c, 'utf-8');
console.log('File saved');
