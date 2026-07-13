#!/usr/bin/env python3
"""
Fix for FC_ENCODE_BASE64 and FC_DECODE_BASE64 workflow nodes:
1. Add documentation to the system prompt (buildWorkflowSystemPrompt)
2. Add handlers to buildNodeParamsJson
"""
import sys
import os

def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(base, "src", "main", "kotlin", "com", "github", 
                        "xima_formcycle_entwicklerkreis", "fc", "plugin", "codbi", 
                        "logic", "cb", "AICodBiAssistant.kt")
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Change 1: Insert FC_ENCODE_BASE64/FC_DECODE_BASE64 into the system prompt
    # After: Set 'fileName' to the exact filename as stored in the form's file section (e.g. "xoxo.txt").\n" +
    # Before: "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; " +
    
    insert_after = """Set 'fileName' to the exact filename as stored in the form's file section (e.g. "xoxo.txt").\n" +
            "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; " +"""
    
    replacement = """Set 'fileName' to the exact filename as stored in the form's file section (e.g. "xoxo.txt").\n" +
            "  - \"FC_ENCODE_BASE64\" — encodes a file or form upload to Base64; " +
            "nodeParams: {\"file\":\"<filename from form resources, e.g. 'xoxo.txt'>\", " +
            "\"outputFileName\":\"<optional output filename, e.g. 'xoxo.b64'>\"}\n" +
            "  - \"FC_DECODE_BASE64\" — decodes a Base64-encoded file back to its original format; " +
            "nodeParams: {\"file\":\"<filename from form resources, e.g. 'xoxo.b64'>\", " +
            "\"outputFileName\":\"<optional output filename, e.g. 'xoxo.txt'>\"}\n" +
            "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; " +"""
    
    if insert_after in content:
        content = content.replace(insert_after, replacement, 1)
        print("Change 1 applied: Added FC_ENCODE_BASE64/FC_DECODE_BASE64 to system prompt")
    else:
        print("ERROR: Could not find insertion point for Change 1")
        # Debug: find similar text
        idx = content.find('FC_SHOW_TEMPLATE')
        if idx >= 0:
            print(f"  Found FC_SHOW_TEMPLATE at index {idx}")
            print(f"  Context: ...{content[idx-100:idx+100]}...")
    
    # Change 2: Add FC_ENCODE_BASE64/FC_DECODE_BASE64 handlers to buildNodeParamsJson
    # Insert after FC_RETURN_FILE case and before FC_SHOW_TEMPLATE case
    # The FC_RETURN_FILE case ends with:
    #       }
    #     "FC_SHOW_TEMPLATE" -> {
    
    insert_before_show_template = """      "FC_SET_SAVED_FLAG",
      "FC_DELETE_FORM_RECORD",
      "FC_EMPTY" -> """ + '"""{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""'
    
    encode_handler = """      "FC_ENCODE_BASE64" -> {
        val fileName = spec.nodeParams["file"] as? String ?: ""
        val outputFileName = spec.nodeParams["outputFileName"] as? String ?: ""
        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
        if (fileUuid != null) {
          val uuidStr = fileUuid.toString()
          """ + '"""{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"outputFileName":${gson.toJson(outputFileName)}}"""' + """
        } else {
          """ + '"""{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"outputFileName":${gson.toJson(outputFileName)}}"""' + """
        }
      }
      "FC_DECODE_BASE64" -> {
        val fileName = spec.nodeParams["file"] as? String ?: ""
        val outputFileName = spec.nodeParams["outputFileName"] as? String ?: ""
        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
        if (fileUuid != null) {
          val uuidStr = fileUuid.toString()
          """ + '"""{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"outputFileName":${gson.toJson(outputFileName)}}"""' + """
        } else {
          """ + '"""{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"outputFileName":${gson.toJson(outputFileName)}}"""' + """
        }
      }
      "FC_SET_SAVED_FLAG",
      "FC_DELETE_FORM_RECORD",
      "FC_EMPTY" -> """ + '"""{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)}}"""'
    
    if insert_before_show_template in content:
        # Count occurrences - there might be multiple in different files
        count = content.count(insert_before_show_template)
        if count == 1:
            content = content.replace(insert_before_show_template, encode_handler, 1)
            print("Change 2 applied: Added FC_ENCODE_BASE64/FC_DECODE_BASE64 handlers to buildNodeParamsJson")
        else:
            print(f"WARNING: Found {count} occurrences of the FC_SET_SAVED_FLAG pattern")
            # Try inserting before the first occurrence that comes after FC_RETURN_FILE
            parts = content.split(insert_before_show_template)
            # Find which occurrence to replace - the one after FC_RETURN_FILE
            for i, part in enumerate(parts):
                if 'FC_RETURN_FILE' in part:
                    parts[i] = parts[i].rstrip('\n')
                    # Reconstruct with handler inserted
                    new_content = encode_handler.join(parts[:i+1]) + insert_before_show_template.join(parts[i+1:])
                    if new_content != content:
                        content = new_content
                        print("Change 2 applied: Inserted handlers before FC_SET_SAVED_FLAG after FC_RETURN_FILE")
                    break
    else:
        print("ERROR: Could not find insertion point for Change 2")
        # Debug
        idx = content.find('FC_SET_SAVED_FLAG')
        if idx >= 0:
            print(f"  Found FC_SET_SAVED_FLAG at index {idx}")
            print(f"  Context: ...{content[idx-100:idx+100]}...")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\nFile written: {path}")
    print("Done!")

if __name__ == '__main__':
    main()
