$f = Resolve-Path "src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt"
$c = [System.IO.File]::ReadAllText($f)

# ========================
# Change 1: System Prompt
# ========================
$old1 = 'Set ''fileName'' to the exact filename as stored in the form''s file section (e.g. "xoxo.txt").\n" +' + [char]10 + '            "  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +'

$new1_start = 'Set ''fileName'' to the exact filename as stored in the form''s file section (e.g. "xoxo.txt").\n" +' + [char]10 + '            "  - "FC_ENCODE_BASE64" - encodes a file or form upload to Base64; " +' + [char]10 + '            "nodeParams: {\"file\":\"<filename from form resources, e.g. ''xoxo.txt''>\", " +' + [char]10 + '            "\"outputFileName\":\"<optional output filename, e.g. ''xoxo.b64''>\"}"' + [char]10 + '" +' + [char]10 + '            "  - "FC_DECODE_BASE64" - decodes a Base64-encoded file back to its original format; " +' + [char]10 + '            "nodeParams: {\"file\":\"<filename from form resources, e.g. ''xoxo.b64''>\", " +' + [char]10 + '            "\"outputFileName\":\"<optional output filename, e.g. ''xoxo.txt''>\"}"' + [char]10 + '" +' + [char]10 + '            "  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +'

$idx1 = $c.IndexOf($old1)
if ($idx1 -ge 0) {
    $c = $c.Substring(0, $idx1) + $new1_start + $c.Substring($idx1 + $old1.Length)
    Write-Host "Change 1 applied at index $idx1"
} else {
    Write-Host "ERROR: Change 1 pattern not found"
    # Try with em dash instead of hyphen
    $old1b = 'Set ''fileName'' to the exact filename as stored in the form''s file section (e.g. "xoxo.txt").\n" +' + [char]10 + '            "  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +'
    Write-Host "  Index with hyphen: " ($c.IndexOf($old1b))
}

# ==============================
# Change 2: buildNodeParamsJson
# ==============================
$old2 = '      }' + [char]10 + '      "FC_SHOW_TEMPLATE" -> {'

$handler_enc = '      "FC_ENCODE_BASE64" -> {' + [char]10 + '        val fileName = spec.nodeParams["file"] as? String ?: ""' + [char]10 + '        val outputFileName = spec.nodeParams["outputFileName"] as? String ?: ""' + [char]10 + '        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)' + [char]10 + '        if (fileUuid != null) {' + [char]10 + '          val uuidStr = fileUuid.toString()' + [char]10 + '          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"outputFileName":${gson.toJson(outputFileName)}}"""' + [char]10 + '        } else {' + [char]10 + '          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"outputFileName":${gson.toJson(outputFileName)}}"""' + [char]10 + '        }' + [char]10 + '      }' + [char]10 + '      "FC_DECODE_BASE64" -> {' + [char]10 + '        val fileName = spec.nodeParams["file"] as? String ?: ""' + [char]10 + '        val outputFileName = spec.nodeParams["outputFileName"] as? String ?: ""' + [char]10 + '        val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)' + [char]10 + '        if (fileUuid != null) {' + [char]10 + '          val uuidStr = fileUuid.toString()' + [char]10 + '          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"FORM","entity":{"entityClass":"de.xima.fc.entities.ProjektRessource","uuid":"$uuidStr"}}],"attachmentFilter":[]},"outputFileName":${gson.toJson(outputFileName)}}"""' + [char]10 + '        } else {' + [char]10 + '          """{"name":${gson.toJson(nodeName)},"description":${gson.toJson(nodeDescription)},"multiFile":{"resources":[{"type":"ATTACHMENT_SEARCH","identifier":${gson.toJson(fileName)}}],"attachmentFilter":["FORM_UPLOAD"],"searchFilename":${gson.toJson(fileName)}},"outputFileName":${gson.toJson(outputFileName)}}"""' + [char]10 + '        }' + [char]10 + '      }' + [char]10 + '      "FC_SHOW_TEMPLATE" -> {'

$new2 = $handler_enc

$idx2 = $c.IndexOf($old2)
if ($idx2 -ge 0) {
    $c = $c.Substring(0, $idx2) + $new2 + $c.Substring($idx2 + $old2.Length)
    Write-Host "Change 2 applied at index $idx2"
} else {
    Write-Host "ERROR: Change 2 pattern not found"
}

[System.IO.File]::WriteAllText($f, $c)
Write-Host "File written successfully"
