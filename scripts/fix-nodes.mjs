import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();
const file1 = path.join(baseDir, 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt');
const file2 = path.join(baseDir, 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIWorkflowAssistant.kt');

function processFile(filePath) {
    console.log(`Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalLen = content.length;
    
    // ===== Change 1: System Prompt =====
    // Find the FC_RETURN_FILE documentation end and insert before FC_SHOW_TEMPLATE
    
    // Search for the text we want to insert after
    const search1 = 'Set \'fileName\' to the exact filename as stored in the form\'s file section (e.g. "xoxo.txt").\n" +\n            "  - "FC_SHOW_TEMPLATE"';
    
    const insert1 = 'Set \'fileName\' to the exact filename as stored in the form\'s file section (e.g. "xoxo.txt").\n" +\n            "  - "FC_ENCODE_BASE64" - encodes a file or form upload to Base64; " +\n            "nodeParams: {\\"file\\":\\"<filename from form resources, e.g. \'xoxo.txt\'>\\"}" +\n            "  - "FC_DECODE_BASE64" - decodes a Base64-encoded file back to its original format; " +\n            "nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. \'xoxo.txt\'>\\"}" +\n            "  - "FC_SHOW_TEMPLATE"';
    
    if (content.includes(search1)) {
        content = content.replace(search1, insert1);
        console.log('  Change 1 (System Prompt) applied');
    } else {
        console.log('  WARNING: Change 1 pattern not found');
        // Debug: find approximate location
        const idx = content.indexOf('FC_SHOW_TEMPLATE');
        if (idx >= 0) {
            console.log(`  Found FC_SHOW_TEMPLATE at index ${idx}`);
            console.log(`  Context: ...${content.substring(idx-50, idx+50).replace(/\n/g, '\\n')}...`);
        }
    }
    
    // ===== Change 2: buildNodeParamsJson =====
    // Add FC_ENCODE_BASE64 handler after FC_RETURN_FILE, before FC_SHOW_TEMPLATE
    const search2 = '      "FC_RETURN_FILE" -> {\n        val fileName = spec.nodeParams["fileName"] as? String ?: ""';
    const handler2 = '      "FC_ENCODE_BASE64" -> {\n        val fileName = spec.nodeParams["file"] as? String ?: ""\n        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)\n        if (fileUuid != null) {\n          val uuidStr = fileUuid.toString()\n          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"resource":{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}},"attachmentFilter":[]}}"""\n        } else {\n          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"singleFile":{"searchFilename":${gson.toJson(fileName)},"attachmentFilter":["FORM_UPLOAD"]}}"""\n        }\n      }\n      "FC_DECODE_BASE64" -> {\n        val base64 = spec.nodeParams["base64"] as? String ?: ""\n        val exportName = spec.nodeParams["exportName"] as? String ?: ""\n        """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"base64":${gson.toJson(base64)},"decodedFileProvision":{"attachToFormRecord":true,"attachmentAccessibleToEndUser":true},"exportName":${gson.toJson(exportName)}}"""\n      }\n      "FC_RETURN_FILE" -> {\n        val fileName = spec.nodeParams["fileName"] as? String ?: ""';
    
    if (content.includes(search2)) {
        content = content.replace(search2, handler2);
        console.log('  Change 2 (buildNodeParamsJson) applied');
    } else {
        console.log('  WARNING: Change 2 pattern not found (trying alternative)');
        // Try with different whitespace
        const search2b = 'FC_RETURN_FILE" -> {';
        const idx2 = content.indexOf(search2b);
        if (idx2 >= 0) {
            console.log(`  Found FC_RETURN_FILE handler at index ${idx2}`);
            console.log(`  Context: ${content.substring(idx2-10, idx2+200).replace(/\n/g, '\\n')}`);
        }
    }
    
    if (content.length !== originalLen) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  File saved (${content.length - originalLen} bytes changed)`);
    } else {
        console.log('  No changes made');
    }
}

processFile(file1);
processFile(file2);
