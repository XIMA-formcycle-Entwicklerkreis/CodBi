import fs from 'fs';

const filePath = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(filePath, 'utf-8');

// Find and update the prompt
const searchFCEnc = 'FC_ENCODE_BASE64" — encodes';
const idx = c.indexOf(searchFCEnc);
if (idx >= 0) {
    const lineEnd = c.indexOf('\n', idx);
    const line1 = c.substring(idx, lineEnd);
    console.log('Found prompt line:', line1);
    
    // Check if it says 'a file or form upload' (old) or 'an uploaded file' (new)
    if (line1.includes('a file or form upload')) {
        const oldText = line1;
        const newText = line1.replace('FC_ENCODE_BASE64" — encodes a file or form upload to Base64', 
                                       'FC_ENCODE_BASE64" — encodes an uploaded file (image/document) to Base64');
        c = c.replace(oldText, newText);
        console.log('Prompt updated');
    }
}

// Find and update the next line too (nodeParams)
const idx2 = c.indexOf('nodeParams:', idx);
if (idx2 >= 0) {
    const lineEnd2 = c.indexOf('\n', idx2);
    const line2 = c.substring(idx2, lineEnd2);
    console.log('Found nodeParams line:', line2);
    
    if (line2.includes('filename from form resources')) {
        const oldParams = line2;
        const newParams = line2.replace(
            '"<filename from form resources, e.g. ' + "'xoxo.txt'" + '>"',
            '"<technicalId of the XUpload form field, e.g. ' + "'fdBild'" + ' — CRITICAL: use the form element\\'s technicalId (properties.name), NOT a random filename>"'
        );
        c = c.replace(oldParams, newParams);
        console.log('Params updated');
    }
}

// Update the handler (use non-template-literal approach to avoid $ escaping)
const handlerSearch = 'FC_ENCODE_BASE64" -> {';
const idx3 = c.indexOf(handlerSearch);
if (idx3 >= 0) {
    // Find the end of this handler (the closing })
    const handlerStart = idx3;
    // The handler ends at the line "FC_DECODE_BASE64" -> { or whichever comes next
    const handlerEnd = c.indexOf('\n      "FC_DECODE_BASE64"', handlerStart);
    
    if (handlerEnd > handlerStart) {
        const oldHandler = c.substring(handlerStart, handlerEnd);
        console.log('Found handler, length:', oldHandler.length);
        
        const newHandler = 
`FC_ENCODE_BASE64" -> {
        val fileName = spec.nodeParams["file"] as? String ?: ""
        if (fileName.isBlank()) {
          """{"name":` + '${gson.toJson(nodeName)}' + `,"description":` + '${gson.toJson(nodeDescription)}' + `,"singleFile":{"attachmentFilter":["FORM_UPLOAD"]}}"""
        } else {
          val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
          if (fileUuid != null) {
            val uuidStr = fileUuid.toString()
            """{"name":` + '${gson.toJson(nodeName)}' + `,"description":` + '${gson.toJson(nodeDescription)}' + `,"singleFile":{"resource":{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}},"attachmentFilter":[]}}"""
          } else {
            """{"name":` + '${gson.toJson(nodeName)}' + `,"description":` + '${gson.toJson(nodeDescription)}' + `,"singleFile":{"searchFilename":` + '${gson.toJson(fileName)}' + `,"attachmentFilter":["FORM_UPLOAD"]}}"""
          }
        }
      }`;
        
        c = c.substring(0, handlerStart) + newHandler + c.substring(handlerEnd);
        console.log('Handler updated');
    }
}

fs.writeFileSync(filePath, c, 'utf-8');
console.log('File saved');
