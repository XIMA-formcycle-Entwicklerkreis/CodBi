import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let content = readFileSync(filePath, 'utf8');

let modified = false;

// Use raw strings - escape $ as $$ for JS template literals
// Kotlin code uses $ for string templates

// ====== 1. Add FILE_PROVIDE_ACTION to FC_ENCODE_BASE64 handler ======
const oldEncode = content.indexOf('"FC_ENCODE_BASE64" ->');
if (oldEncode >= 0) {
  // Find the complete handler block
  const lineStart = content.lastIndexOf('\n', oldEncode) + 1;
  let lineEnd = content.indexOf('\n      "FC_DECODE_BASE64"', oldEncode);
  if (lineEnd < 0) lineEnd = content.indexOf('\n      "FC_SHOW_TEMPLATE"', oldEncode);
  if (lineEnd >= 0) {
    const oldBlock = content.substring(lineStart, lineEnd);
    const dq = String.fromCharCode(34); // double quote
    const nl = '\n';
    
    const newBlock = 
`      ${dq}FC_ENCODE_BASE64${dq} -> {
        val nodeUuid = spec.nodeParams[${dq}_resolvedNodeUuid${dq}] as? String ?: ${dq}${dq}
        val taskUuid = spec.nodeParams[${dq}_resolvedTaskUuid${dq}] as? String ?: ${dq}${dq}
        if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
          // Reference a file from a preceding node${dq}s output via FILE_PROVIDE_ACTION
          ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}singleFile${dq}:{${dq}resource${dq}:{${dq}type${dq}:${dq}FILE_PROVIDE_ACTION${dq},${dq}nodeKey${dq}:{${dq}uuid${dq}:$` + '${gson.toJson(nodeUuid)}' + `,${dq}taskUuid${dq}:$` + '${gson.toJson(taskUuid)}' + `}}},${dq}attachmentFilter${dq}:[]}}${dq}${dq}${dq}
        } else {
          val fileName = spec.nodeParams[${dq}file${dq}] as? String ?: ${dq}${dq}
          val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
          if (fileUuid != null) {
            val uuidStr = fileUuid.toString()
            ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}singleFile${dq}:{${dq}resource${dq}:{${dq}type${dq}:${dq}FORM${dq},${dq}entity${dq}:{${dq}entityClass${dq}:${dq}de.xima.fc.entities.ProjektRessource${dq},${dq}uuid${dq}:${dq}$` + '{uuidStr}' + `${dq}}},${dq}attachmentFilter${dq}:[]}}${dq}${dq}${dq}
          } else {
            ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}singleFile${dq}:{${dq}searchFilename${dq}:$` + '${gson.toJson(fileName)}' + `,${dq}attachmentFilter${dq}:[${dq}FORM_UPLOAD${dq}]}}${dq}${dq}${dq}
          }
        }
      }`;
    
    content = content.substring(0, lineStart) + newBlock + content.substring(lineEnd);
    console.log('✓ Updated FC_ENCODE_BASE64 handler');
    modified = true;
  }
} else {
  console.log('✗ FC_ENCODE_BASE64 handler NOT FOUND');
}

// ====== 2. Add FILE_PROVIDE_ACTION to FC_RETURN_FILE handler ======
const oldReturnIdx = content.indexOf('"FC_RETURN_FILE" ->');
if (oldReturnIdx >= 0) {
  const lineStart = content.lastIndexOf('\n', oldReturnIdx) + 1;
  let lineEnd = content.indexOf('\n      "FC_PROCESS_LOG_PDF"', oldReturnIdx);
  if (lineEnd < 0) lineEnd = content.indexOf('\n      "FC_SHOW_TEMPLATE"', oldReturnIdx);
  if (lineEnd >= 0) {
    const dq = String.fromCharCode(34);
    const newBlock = 
`      ${dq}FC_RETURN_FILE${dq} -> {
        val nodeUuid = spec.nodeParams[${dq}_resolvedNodeUuid${dq}] as? String ?: ${dq}${dq}
        val taskUuid = spec.nodeParams[${dq}_resolvedTaskUuid${dq}] as? String ?: ${dq}${dq}
        val forceDownload = spec.nodeParams[${dq}forceDownload${dq}] as? Boolean ?: true
        val deleteAfter = spec.nodeParams[${dq}deleteFileAfterDownload${dq}] as? Boolean ?: false
        if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
          // Reference a file from a preceding node${dq}s output via FILE_PROVIDE_ACTION
          ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}multiFile${dq}:{${dq}resources${dq}:[{${dq}type${dq}:${dq}FILE_PROVIDE_ACTION${dq},${dq}nodeKey${dq}:{${dq}uuid${dq}:$` + '${gson.toJson(nodeUuid)}' + `,${dq}taskUuid${dq}:$` + '${gson.toJson(taskUuid)}' + `}}}],${dq}attachmentFilter${dq}:[]},${dq}forceDownload${dq}:$forceDownload,${dq}deleteFileAfterDownload${dq}:$deleteAfter}${dq}${dq}${dq}
        } else {
          val fileName = spec.nodeParams[${dq}fileName${dq}] as? String ?: ${dq}${dq}
          val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
          if (fileUuid != null) {
            val uuidStr = fileUuid.toString()
            ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}multiFile${dq}:{${dq}resources${dq}:[{${dq}type${dq}:${dq}FORM${dq},${dq}entity${dq}:{${dq}entityClass${dq}:${dq}de.xima.fc.entities.ProjektRessource${dq},${dq}uuid${dq}:${dq}$` + '{uuidStr}' + `${dq}}}]],${dq}attachmentFilter${dq}:[]},${dq}forceDownload${dq}:$forceDownload,${dq}deleteFileAfterDownload${dq}:$deleteAfter}${dq}${dq}${dq}
          } else {
            ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}multiFile${dq}:{${dq}resources${dq}:[{${dq}type${dq}:${dq}ATTACHMENT_SEARCH${dq},${dq}identifier${dq}:$` + '${gson.toJson(fileName)}' + `}],${dq}attachmentFilter${dq}:[${dq}FORM_UPLOAD${dq}],${dq}searchFilename${dq}:$` + '${gson.toJson(fileName)}' + `},${dq}forceDownload${dq}:$forceDownload,${dq}deleteFileAfterDownload${dq}:$deleteAfter}${dq}${dq}${dq}
          }
        }
      }`;
    
    content = content.substring(0, lineStart) + newBlock + content.substring(lineEnd);
    console.log('✓ Updated FC_RETURN_FILE handler');
    modified = true;
  }
} else {
  console.log('✗ FC_RETURN_FILE handler NOT FOUND');
}

// ====== 3. Add FILE_PROVIDE_ACTION to FC_EMAIL handler ======
const oldEmailIdx = content.indexOf('"FC_EMAIL" ->');
if (oldEmailIdx >= 0) {
  const lineStart = content.lastIndexOf('\n', oldEmailIdx) + 1;
  let lineEnd = content.indexOf('\n      "FC_DOI_INIT"', oldEmailIdx);
  if (lineEnd >= 0) {
    const dq = String.fromCharCode(34);
    const newBlock = 
`      ${dq}FC_EMAIL${dq} -> {
        val to = spec.nodeParams[${dq}to${dq}] as? String ?: ${dq}${dq}
        val subject = spec.nodeParams[${dq}subject${dq}] as? String ?: ${dq}${dq}
        val body = spec.nodeParams[${dq}body${dq}] as? String ?: ${dq}${dq}
        val from = spec.nodeParams[${dq}from${dq}] as? String ?: ${dq}${dq}
        val senderName = spec.nodeParams[${dq}senderName${dq}] as? String ?: ${dq}${dq}
        val nodeUuid = spec.nodeParams[${dq}_resolvedNodeUuid${dq}] as? String ?: ${dq}${dq}
        val taskUuid = spec.nodeParams[${dq}_resolvedTaskUuid${dq}] as? String ?: ${dq}${dq}
        val bodyFormatType = ${dq}HTML${dq}
        val toJson = if (to.isNotBlank()) [${dq}$` + '${gson.toJson(to)}' + `${dq}] else ${dq}[]${dq}
        val multiFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              // Attach a file from a preceding node${dq}s output via FILE_PROVIDE_ACTION
              ${dq}${dq},${dq}multiFile${dq}:{${dq}resources${dq}:[{${dq}type${dq}:${dq}FILE_PROVIDE_ACTION${dq},${dq}nodeKey${dq}:{${dq}uuid${dq}:$` + '${gson.toJson(nodeUuid)}' + `,${dq}taskUuid${dq}:$` + '${gson.toJson(taskUuid)}' + `}}}],${dq}attachmentFilter${dq}:[]}${dq}${dq}${dq}
            } else {
              @Suppress(${dq}UNCHECKED_CAST${dq})
              val attachments =
                  (spec.nodeParams[${dq}attachments${dq}] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
              if (attachments.isNotEmpty()) {
                val resourcesJson =
                    attachments.joinToString(${dq},${dq}) { id ->
                      ${dq}${dq}${dq}{${dq}type${dq}:${dq}UPLOAD${dq},${dq}identifier${dq}:$` + '${gson.toJson(id)}' + `}${dq}${dq}${dq}
                    }
                ${dq}${dq}${dq},${dq}multiFile${dq}:{${dq}resources${dq}:[$resourcesJson],${dq}attachmentFilter${dq}:[]}${dq}${dq}${dq}
              } else ${dq}${dq}
            }
        ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}to${dq}:$toJson,${dq}cc${dq}:[],${dq}bcc${dq}:[],${dq}subject${dq}:$` + '${gson.toJson(subject)}' + `,${dq}body${dq}:$` + '${gson.toJson(body)}' + `,${dq}plainBody${dq}:$` + '${gson.toJson(body)}' + `,${dq}bodyFormatType${dq}:$` + '${gson.toJson(bodyFormatType)}' + `,${dq}from${dq}:$` + '${gson.toJson(from)}' + `,${dq}senderName${dq}:$` + '${gson.toJson(senderName)}' + `$multiFileJson}${dq}${dq}${dq}
      }`;
    
    content = content.substring(0, lineStart) + newBlock + content.substring(lineEnd);
    console.log('✓ Updated FC_EMAIL handler');
    modified = true;
  }
} else {
  console.log('✗ FC_EMAIL handler NOT FOUND');
}

// ====== 4. Add new handlers ======
const handlerInsertPoint = `      "FC_SET_SAVED_FLAG",
      "FC_DELETE_FORM_RECORD",
      "FC_EMPTY" ->`;

const dq = String.fromCharCode(34);
const nl = '\n';

const newHandlers = 
`      ${dq}FC_FILL_PDF${dq} -> {
        val exportName = spec.nodeParams[${dq}exportName${dq}] as? String ?: ${dq}filled.pdf${dq}
        val flatten = spec.nodeParams[${dq}flatten${dq}] as? Boolean ?: true
        val usedFont = spec.nodeParams[${dq}usedFont${dq}] as? String ?: ${dq}${dq}
        val nodeUuid = spec.nodeParams[${dq}_resolvedNodeUuid${dq}] as? String ?: ${dq}${dq}
        val taskUuid = spec.nodeParams[${dq}_resolvedTaskUuid${dq}] as? String ?: ${dq}${dq}
        val singleFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              // Fill a PDF from a preceding node${dq}s output
              ${dq}${dq},${dq}singleFile${dq}:{${dq}resource${dq}:{${dq}type${dq}:${dq}FILE_PROVIDE_ACTION${dq},${dq}nodeKey${dq}:{${dq}uuid${dq}:$` + '${gson.toJson(nodeUuid)}' + `,${dq}taskUuid${dq}:$` + '${gson.toJson(taskUuid)}' + `}}}${dq}${dq}${dq}
            } else {
              val fileName = spec.nodeParams[${dq}file${dq}] as? String ?: ${dq}${dq}
              val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
              if (fileUuid != null) {
                val uuidStr = fileUuid.toString()
                ${dq}${dq},${dq}singleFile${dq}:{${dq}resource${dq}:{${dq}type${dq}:${dq}FORM${dq},${dq}entity${dq}:{${dq}entityClass${dq}:${dq}de.xima.fc.entities.ProjektRessource${dq},${dq}uuid${dq}:${dq}$` + '{uuidStr}' + `${dq}}}],${dq}attachmentFilter${dq}:[]}${dq}${dq}${dq}
              } else if (fileName.isNotBlank()) {
                ${dq}${dq},${dq}singleFile${dq}:{${dq}searchFilename${dq}:$` + '${gson.toJson(fileName)}' + `,${dq}attachmentFilter${dq}:[${dq}FORM_UPLOAD${dq}]}${dq}${dq}${dq}
              } else ${dq}${dq}
            }
        val usedFontJson = if (usedFont.isNotBlank()) ${dq}${dq},${dq}usedFont${dq}:$` + '${gson.toJson(usedFont)}' + `${dq}${dq}${dq} else ${dq}${dq}
        ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}exportName${dq}:$` + '${gson.toJson(exportName)}' + `,${dq}flatten${dq}:$flatten$usedFontJson$singleFileJson,${dq}pdfFileProvision${dq}:{${dq}attachToFormRecord${dq}:false,${dq}attachmentAccessibleToEndUser${dq}:true}}${dq}${dq}${dq}
      }
      ${dq}FC_FILL_WORD${dq} -> {
        val exportName = spec.nodeParams[${dq}exportName${dq}] as? String ?: ${dq}filled.docx${dq}
        val nodeUuid = spec.nodeParams[${dq}_resolvedNodeUuid${dq}] as? String ?: ${dq}${dq}
        val taskUuid = spec.nodeParams[${dq}_resolvedTaskUuid${dq}] as? String ?: ${dq}${dq}
        val singleFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ${dq}${dq},${dq}singleFile${dq}:{${dq}resource${dq}:{${dq}type${dq}:${dq}FILE_PROVIDE_ACTION${dq},${dq}nodeKey${dq}:{${dq}uuid${dq}:$` + '${gson.toJson(nodeUuid)}' + `,${dq}taskUuid${dq}:$` + '${gson.toJson(taskUuid)}' + `}}}${dq}${dq}${dq}
            } else {
              val fileName = spec.nodeParams[${dq}file${dq}] as? String ?: ${dq}${dq}
              val fileUuid = resolveProjectFileUuid(userContext, workflowVersion, fileName)
              if (fileUuid != null) {
                val uuidStr = fileUuid.toString()
                ${dq}${dq},${dq}singleFile${dq}:{${dq}resource${dq}:{${dq}type${dq}:${dq}FORM${dq},${dq}entity${dq}:{${dq}entityClass${dq}:${dq}de.xima.fc.entities.ProjektRessource${dq},${dq}uuid${dq}:${dq}$` + '{uuidStr}' + `${dq}}}],${dq}attachmentFilter${dq}:[]}${dq}${dq}${dq}
              } else if (fileName.isNotBlank()) {
                ${dq}${dq},${dq}singleFile${dq}:{${dq}searchFilename${dq}:$` + '${gson.toJson(fileName)}' + `,${dq}attachmentFilter${dq}:[${dq}FORM_UPLOAD${dq}]}${dq}${dq}${dq}
              } else ${dq}${dq}
            }
        ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}exportName${dq}:$` + '${gson.toJson(exportName)}' + `$singleFileJson,${dq}wordFileProvision${dq}:{${dq}attachToFormRecord${dq}:false,${dq}attachmentAccessibleToEndUser${dq}:true}}${dq}${dq}${dq}
      }
      ${dq}FC_COMPRESS_AS_ZIP${dq} -> {
        val compressedFileName = spec.nodeParams[${dq}compressedFileName${dq}] as? String ?: ${dq}archive.zip${dq}
        val namingScheme = (spec.nodeParams[${dq}namingScheme${dq}] as? String ?: ${dq}FLAT_FILE_NAME_ONLY${dq}).uppercase()
        val nodeUuid = spec.nodeParams[${dq}_resolvedNodeUuid${dq}] as? String ?: ${dq}${dq}
        val taskUuid = spec.nodeParams[${dq}_resolvedTaskUuid${dq}] as? String ?: ${dq}${dq}
        val multiFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              // Compress a file from a preceding node${dq}s output
              ${dq}${dq},${dq}multiFile${dq}:{${dq}resources${dq}:[{${dq}type${dq}:${dq}FILE_PROVIDE_ACTION${dq},${dq}nodeKey${dq}:{${dq}uuid${dq}:$` + '${gson.toJson(nodeUuid)}' + `,${dq}taskUuid${dq}:$` + '${gson.toJson(taskUuid)}' + `}}}],${dq}attachmentFilter${dq}:[]}${dq}${dq}${dq}
            } else {
              @Suppress(${dq}UNCHECKED_CAST${dq})
              val files = (spec.nodeParams[${dq}files${dq}] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
              if (files.isNotEmpty()) {
                val resourcesJson = files.joinToString(${dq},${dq}) { f ->
                  ${dq}${dq}${dq}{${dq}type${dq}:${dq}ATTACHMENT_SEARCH${dq},${dq}identifier${dq}:$` + '${gson.toJson(f)}' + `}${dq}${dq}${dq}
                }
                ${dq}${dq},${dq}multiFile${dq}:{${dq}resources${dq}:[$resourcesJson],${dq}attachmentFilter${dq}:[${dq}FORM_UPLOAD${dq}],${dq}searchFilename${dq}:$` + '${gson.toJson(files[0])}' + `}${dq}${dq}${dq}
              } else ${dq}${dq}
            }
        ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}compressedFileName${dq}:$` + '${gson.toJson(compressedFileName)}' + `,${dq}namingScheme${dq}:$` + '${gson.toJson(namingScheme)}' + `$multiFileJson,${dq}compressedFileProvision${dq}:{${dq}attachToFormRecord${dq}:false,${dq}attachmentAccessibleToEndUser${dq}:true}}${dq}${dq}${dq}
      }
      ${dq}FC_SAVE_TO_FILE_SYSTEM${dq} -> {
        val exportDirectory = spec.nodeParams[${dq}exportDirectory${dq}] as? String ?: ${dq}${dq}
        val nodeUuid = spec.nodeParams[${dq}_resolvedNodeUuid${dq}] as? String ?: ${dq}${dq}
        val taskUuid = spec.nodeParams[${dq}_resolvedTaskUuid${dq}] as? String ?: ${dq}${dq}
        val multiFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ${dq}${dq},${dq}multiFile${dq}:{${dq}resources${dq}:[{${dq}type${dq}:${dq}FILE_PROVIDE_ACTION${dq},${dq}nodeKey${dq}:{${dq}uuid${dq}:$` + '${gson.toJson(nodeUuid)}' + `,${dq}taskUuid${dq}:$` + '${gson.toJson(taskUuid)}' + `}}}],${dq}attachmentFilter${dq}:[]}${dq}${dq}${dq}
            } else {
              @Suppress(${dq}UNCHECKED_CAST${dq})
              val files = (spec.nodeParams[${dq}files${dq}] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
              if (files.isNotEmpty()) {
                val resourcesJson = files.joinToString(${dq},${dq}) { f ->
                  ${dq}${dq}${dq}{${dq}type${dq}:${dq}ATTACHMENT_SEARCH${dq},${dq}identifier${dq}:$` + '${gson.toJson(f)}' + `}${dq}${dq}${dq}
                }
                ${dq}${dq},${dq}multiFile${dq}:{${dq}resources${dq}:[$resourcesJson],${dq}attachmentFilter${dq}:[${dq}FORM_UPLOAD${dq}],${dq}searchFilename${dq}:$` + '${gson.toJson(files[0])}' + `}${dq}${dq}${dq}
              } else ${dq}${dq}
            }
        ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}exportDirectory${dq}:$` + '${gson.toJson(exportDirectory)}' + `$multiFileJson}${dq}${dq}${dq}
      }
      ${dq}FC_SAVE_TO_WEBDAV${dq} -> {
        val path = spec.nodeParams[${dq}path${dq}] as? String ?: ${dq}${dq}
        val webdavConnection = spec.nodeParams[${dq}webdavConnection${dq}] as? String ?: ${dq}${dq}
        val nodeUuid = spec.nodeParams[${dq}_resolvedNodeUuid${dq}] as? String ?: ${dq}${dq}
        val taskUuid = spec.nodeParams[${dq}_resolvedTaskUuid${dq}] as? String ?: ${dq}${dq}
        val multiFileJson =
            if (nodeUuid.isNotBlank() && taskUuid.isNotBlank()) {
              ${dq}${dq},${dq}multiFile${dq}:{${dq}resources${dq}:[{${dq}type${dq}:${dq}FILE_PROVIDE_ACTION${dq},${dq}nodeKey${dq}:{${dq}uuid${dq}:$` + '${gson.toJson(nodeUuid)}' + `,${dq}taskUuid${dq}:$` + '${gson.toJson(taskUuid)}' + `}}}],${dq}attachmentFilter${dq}:[]}${dq}${dq}${dq}
            } else {
              @Suppress(${dq}UNCHECKED_CAST${dq})
              val files = (spec.nodeParams[${dq}files${dq}] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
              if (files.isNotEmpty()) {
                val resourcesJson = files.joinToString(${dq},${dq}) { f ->
                  ${dq}${dq}${dq}{${dq}type${dq}:${dq}ATTACHMENT_SEARCH${dq},${dq}identifier${dq}:$` + '${gson.toJson(f)}' + `}${dq}${dq}${dq}
                }
                ${dq}${dq},${dq}multiFile${dq}:{${dq}resources${dq}:[$resourcesJson],${dq}attachmentFilter${dq}:[${dq}FORM_UPLOAD${dq}],${dq}searchFilename${dq}:$` + '${gson.toJson(files[0])}' + `}${dq}${dq}${dq}
              } else ${dq}${dq}
            }
        val connJson = if (webdavConnection.isNotBlank()) ${dq}${dq},${dq}webdavConnection${dq}:$` + '${gson.toJson(webdavConnection)}' + `${dq}${dq}${dq} else ${dq}${dq}
        ${dq}${dq}${dq}{${dq}name${dq}:$` + '${gson.toJson(nodeName)}' + `,${dq}description${dq}:$` + '${gson.toJson(nodeDescription)}' + `,${dq}path${dq}:$` + '${gson.toJson(path)}' + `$connJson$multiFileJson}${dq}${dq}${dq}
      }
      ${dq}FC_SET_SAVED_FLAG${dq},
      ${dq}FC_DELETE_FORM_RECORD${dq},
      ${dq}FC_EMPTY${dq} ->`;

if (content.includes(handlerInsertPoint)) {
  content = content.replace(handlerInsertPoint, newHandlers);
  console.log('✓ Added new handlers (FC_FILL_PDF, FC_FILL_WORD, FC_COMPRESS_AS_ZIP, FC_SAVE_TO_FILE_SYSTEM, FC_SAVE_TO_WEBDAV)');
  modified = true;
} else {
  console.log('✗ Handler insertion point NOT FOUND');
}

// ====== 5. Add system prompt documentation ======
const promptSearch = `"  - \\"FC_PROCESS_LOG_PDF\\" — generates a PDF from the current process log messages;`;
const promptIdx = content.indexOf(promptSearch);
if (promptIdx >= 0) {
  // Find end of this entry (next "  - \" or next append()
  const entryEnd = content.indexOf('\\n" +', promptIdx);
  if (entryEnd >= 0) {
    const afterEntry = content.indexOf('\\n" +', entryEnd + 5);
    if (afterEntry >= 0) {
      const endOfLine = afterEntry + 5; // include \n" +
      
      const newContent = `"  - \\"FC_FILL_PDF\\" — fills a PDF template with form data and produces a filled PDF; ` +
        `"nodeParams: {\\"file\\":\\"<template filename from form resources, e.g. 'vorlage.pdf'>\\", ` +
        `"\\"exportName\\":\\"<output filename, e.g. 'ausgefuellt.pdf'>\\", ` +
        `"\\"flatten\\":<true|false> (optional, default true)}. ` +
        `"When used as a chained node (after a file-producing node), ` +
        `"the template file is taken from the preceding node's output instead of form resources.\\n" +` +
        `"  - \\"FC_FILL_WORD\\" — fills a Word template with form data and produces a filled document; ` +
        `"nodeParams: {\\"file\\":\\"<template filename from form resources, e.g. 'vorlage.docx'>\\", ` +
        `"\\"exportName\\":\\"<output filename, e.g. 'ausgefuellt.docx'>\\"}. ` +
        `"When used as a chained node, the template is taken from the preceding node's output.\\n" +` +
        `"  - \\"FC_COMPRESS_AS_ZIP\\" — compresses one or more files into a ZIP archive; ` +
        `"nodeParams: {\\"compressedFileName\\":\\"<output ZIP filename, e.g. 'archive.zip'>\\", ` +
        `"\\"files\\":[\\"<filename1>\\",\\"<filename2>\\"]}. ` +
        `"When used as a chained node, compresses the file from the preceding node's output.\\n" +` +
        `"  - \\"FC_SAVE_TO_FILE_SYSTEM\\" — saves a file to the server's file system; ` +
        `"nodeParams: {\\"exportDirectory\\":\\"<target directory path>\\", ` +
        `"\\"files\\":[\\"<filename1>\\"]}. ` +
        `"When used as a chained node, saves the preceding node's output file to the directory.\\n" +` +
        `"  - \\"FC_SAVE_TO_WEBDAV\\" — saves a file to a WebDAV server; ` +
        `"nodeParams: {\\"path\\":\\"<target path on WebDAV>\\", ` +
        `"\\"files\\":[\\"<filename1>\\"]}. ` +
        `"When used as a chained node, saves the preceding node's output to the WebDAV path.\\n" +`;
      
      content = content.substring(0, endOfLine) + '\n' + newContent + content.substring(endOfLine);
      console.log('✓ Added system prompt documentation for new node types');
      modified = true;
    }
  }
} else {
  console.log('✗ System prompt FC_PROCESS_LOG_PDF entry NOT FOUND');
}

// ====== 6. Add deriveNodeName entries ======
const deriveSearch = `"FC_PROCESS_LOG_PDF" -> "Generate process log PDF"`;
const deriveIdx = content.indexOf(deriveSearch);
if (deriveIdx >= 0) {
  const lineEnd = content.indexOf('\n', deriveIdx);
  if (lineEnd >= 0) {
    const newEntries = `          "FC_PROCESS_LOG_PDF" -> "Generate process log PDF"${nl}` +
      `          "FC_FILL_PDF" -> "Fill PDF template"${nl}` +
      `          "FC_FILL_WORD" -> "Fill Word template"${nl}` +
      `          "FC_COMPRESS_AS_ZIP" -> "Compress as ZIP"${nl}` +
      `          "FC_SAVE_TO_FILE_SYSTEM" -> "Save to file system"${nl}` +
      `          "FC_SAVE_TO_WEBDAV" -> "Save to WebDAV"`;
    
    content = content.substring(0, deriveIdx) + deriveSearch + nl + newEntries + content.substring(lineEnd);
    console.log('✓ Added deriveNodeName entries');
    modified = true;
  }
} else {
  console.log('✗ deriveNodeName FC_PROCESS_LOG_PDF entry NOT FOUND');
}

// Write back
if (modified) {
  writeFileSync(filePath, content, 'utf8');
  console.log('\n✅ File updated successfully!');
} else {
  console.log('\n❌ No changes were made - check errors above');
}
