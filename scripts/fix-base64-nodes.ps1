# Fix for FC_ENCODE_BASE64 and FC_DECODE_BASE64 workflow nodes
param(
    [string]$File = "src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt"
)

$ErrorActionPreference = "Stop"
$fullPath = Resolve-Path $File
Write-Host "Processing: $fullPath"
$content = [System.IO.File]::ReadAllText($fullPath)
$originalLen = $content.Length
Write-Host "Original file length: $originalLen"

# === Change 1: System prompt - Insert after FC_RETURN_FILE, before FC_SHOW_TEMPLATE ===
$search1 = 'Set ''fileName'' to the exact filename as stored in the form''s file section (e.g. "xoxo.txt").' + [char]10 + '"' + [char]10 + '            "  - "FC_SHOW_TEMPLATE" — renders an HTML template to the user; " +'

$replacement1 = 'Set ''fileName'' to the exact filename as stored in the form''s file section (e.g. "xoxo.txt").' + [char]10 + '"' + [char]10 + '            "  - "FC_ENCODE_BASE64" — encodes a file or form upload to Base64; " +' + [char]10 + '            "nodeParams: {\"file\":\"<filename from form resources, e.g. ''xoxo.txt''>\", " +' + [char]10 + '            "\"outputFileName\":\"<optional output filename, e.g. ''xoxo.b64''>\"}"' + [char]10 + '"' + [char]10 + '            "  - "FC_DECODE_BASE64" — decodes a Base64-encoded file back to its original format; " +' + [char]10 + '            "nodeParams: {\"file\":\"<filename from form resources, e.g. ''xoxo.b64''>\", " +' + [char]10 + '            "\"outputFileName\":\"<optional output filename, e.g. ''xoxo.txt''>\"}"' + [char]10 + '"' + [char]10 + '            "  - "FC_SHOW_TEMPLATE" — renders an HTML template to the user; " +'

if ($content.Contains($search1)) {
    $content = $content.Replace($search1, $replacement1)
    Write-Host "Change 1 applied: Added FC_ENCODE_BASE64/FC_DECODE_BASE64 to system prompt"
} else {
    Write-Host "WARNING: Change 1 pattern not found - trying alternative approach"
    # The issue might be with the em dash character. Let's search without special chars
    $idx = $content.IndexOf('Set ''fileName'' to the exact filename')
    if ($idx -ge 0) {
        Write-Host "Found target text at index $idx"
        # Show surrounding content for debugging
        Write-Host "Context: $($content.Substring($idx, 200))"
    }
}

# === Change 2: Add handlers to buildNodeParamsJson ===
# Find FC_RETURN_FILE handler and insert FC_ENCODE_BASE64/FC_DECODE_BASE64 before FC_SHOW_TEMPLATE
$search2 = '        }' + [char]10 + '      "FC_SHOW_TEMPLATE" -> {'
$replace2 = '        }' + [char]10 + '      "FC_ENCODE_BASE64" -> {' + [char]10 + '        val fileName = spec.nodeParams["file"] as? String ?: ""' + [char]10 + '        val outputFileName = spec.nodeParams["outputFileName"] as? String ?: ""' + [char]10 + '        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)' + [char]10 + '        if (fileUuid != null) {' + [char]10 + '          val uuidStr = fileUuid.toString()' + [char]10 + '          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"outputFileName":${gson.toJson(outputFileName)}}""' + [char]10 + '        } else {' + [char]10 + '          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"outputFileName":${gson.toJson(outputFileName)}}""' + [char]10 + '        }' + [char]10 + '      }' + [char]10 + '      "FC_DECODE_BASE64" -> {' + [char]10 + '        val fileName = spec.nodeParams["file"] as? String ?: ""' + [char]10 + '        val outputFileName = spec.nodeParams["outputFileName"] as? String ?: ""' + [char]10 + '        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)' + [char]10 + '        if (fileUuid != null) {' + [char]10 + '          val uuidStr = fileUuid.toString()' + [char]10 + '          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"outputFileName":${gson.toJson(outputFileName)}}""' + [char]10 + '        } else {' + [char]10 + '          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"outputFileName":${gson.toJson(outputFileName)}}""' + [char]10 + '        }' + [char]10 + '      }' + [char]10 + '      "FC_SHOW_TEMPLATE" -> {'

if ($content.Contains($search2)) {
    $content = $content.Replace($search2, $replace2)
    Write-Host "Change 2 applied: Added FC_ENCODE_BASE64/FC_DECODE_BASE64 handlers to buildNodeParamsJson"
} else {
    Write-Host "WARNING: Change 2 pattern not found"
    $idx2 = $content.IndexOf('"FC_SHOW_TEMPLATE" -> {')
    if ($idx2 -ge 0) {
        Write-Host "Found FC_SHOW_TEMPLATE at index $idx2"
    }
}

# Write the modified content back
[System.IO.File]::WriteAllText($fullPath, $content)
Write-Host "File written. Length: $($content.Length) (changed: $($content.Length - $originalLen) bytes)"
