package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * The attachment SOURCES formcycle knows (`de.xima.fc.mdl.enums.EAttachmentSource`).
 *
 * Used for the optional `searchSourceTypes` of an FC_DELETE_ATTACHMENT name search
 * (`FcDeleteAttachmentProps.attachmentsToDelete` → `MultiAttachment.searchSourceTypes`). The
 * executor passes the set into `ResolutionHelper.searchAttachment`, which applies NO source filter
 * when the set is EMPTY — so omitting it (the default we emit) searches every source.
 *
 * `FORM_UPLOAD_PRESERVED_ORIGINAL` is excluded on purpose: the resolver always filters that source
 * out of a name search, so listing it would only be dead weight.
 */
internal object WorkflowAttachmentSources {

  val TYPES =
      setOf(
          "ARCHIVED_FORM_UPLOAD",
          "FORM_UPLOAD",
          "WORKFLOW",
          "INBOX",
          "CHAT_MESSAGE",
          "REST_API",
          "UNKNOWN")
}
