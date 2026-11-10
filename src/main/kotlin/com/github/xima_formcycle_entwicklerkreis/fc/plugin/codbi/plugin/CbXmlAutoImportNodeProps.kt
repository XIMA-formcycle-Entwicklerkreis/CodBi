package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.alibaba.fastjson.annotation.JSONField
import de.xima.fc.workflow.model.nodes.SingleFile
import de.xima.fc.workflow.taglib.model.BaseActionProps

/**
 * Configuration of the CodBi workflow node **cbXMLAutoImport**.
 *
 * The node reads one XML file and writes EVERY value it finds into the matching form field — the
 * only requirement is that the form actually has an element with that technical name. In contrast
 * to FORMCYCLE's `FC_IMPORT_FORM_VALUE_FROM_XML` there is no "Zu setzende Werte" / `xpathMapping`
 * list and therefore nothing to configure per field; the only list is the OPPOSITE: fields that
 * must be left alone ("Nicht zu setzende Werte", [excludedFields]).
 *
 * [xmlSource] uses the same `SingleFile` model as the built-in node, so an existing XML-source
 * configuration (upload element, form resource, file of a previous node, URL) can be reused
 * verbatim. The flat [sourceType] / [sourceIdentifier] pair is the designer's simpler alternative;
 * it is only used when [xmlSource] carries no reference.
 *
 * @since 1.1.0
 */
class CbXmlAutoImportNodeProps : BaseActionProps() {

  /**
   * FORMCYCLE file reference (formcycle/BPMN compatible). When set, it wins over [sourceType] /
   * [sourceIdentifier].
   */
  var xmlSource: SingleFile? = null
    get() = field
    set(value) {
      field = value
    }

  /**
   * Kind of the source selected in the designer: [SOURCE_TYPE_UPLOAD] (file-upload element),
   * [SOURCE_TYPE_FORM_RESOURCE] (a file of the form's file management), [SOURCE_TYPE_PREVIOUS_NODE]
   * (the file a previous workflow node produced) or [SOURCE_TYPE_URL] (an external URL).
   */
  var sourceType: String? = SOURCE_TYPE_UPLOAD
    get() = field ?: SOURCE_TYPE_UPLOAD
    set(value) {
      field = value
    }

  /**
   * Depends on [sourceType]: technical name of the upload element, UUID of the form file, UUID of
   * the previous workflow node, or the URL of the XML file.
   */
  var sourceIdentifier: String? = ""
    get() = field ?: ""
    set(value) {
      field = value
    }

  /**
   * Display name of the selected source (form file name / node name). Designer-only help for stale
   * UUIDs — it is never used for resolution.
   */
  var sourceLabel: String? = ""
    get() = field ?: ""
    set(value) {
      field = value
    }

  /**
   * Technical names (or aliases) of form fields that must NOT be filled by this node — the "Nicht
   * zu setzende Werte" list.
   */
  var excludedFields: List<String>? = emptyList()
    get() = field ?: emptyList()
    set(value) {
      field = value?.map { it.trim() }?.filter { it.isNotEmpty() }?.distinct()
    }

  /**
   * Newline separated form of [excludedFields], bound to the hidden textarea of the designer view
   * (JSF cannot edit a plain `List<String>` row by row without a backing bean).
   */
  @get:JSONField(serialize = false, deserialize = false)
  @set:JSONField(serialize = false, deserialize = false)
  var excludedFieldText: String
    get() = excludedFields.orEmpty().joinToString("\n")
    set(value) {
      excludedFields =
          value.split('\n', ',', ';').map { it.trim() }.filter { it.isNotEmpty() }.distinct()
    }

  /**
   * `true` (default): every value found in the file is written, overwriting the current value.
   * `false`: only fields that are currently empty are filled — existing user input is kept.
   */
  var overwriteExisting: Boolean = true
    get() = field
    set(value) {
      field = value
    }

  /** `true` (default): removes whitespace around the values (pretty-printed XML indentation). */
  var trimValues: Boolean = true
    get() = field
    set(value) {
      field = value
    }

  /**
   * `true` (default): a repeated element (`<values><value>…`) writes all of its values. `false`:
   * only the first value is written.
   */
  var importRepeatedValues: Boolean = true
    get() = field
    set(value) {
      field = value
    }

  /**
   * `true`: the file is only analysed — the node reports what WOULD be imported and changes
   * nothing. Useful while building the workflow.
   */
  var dryRun: Boolean = false
    get() = field
    set(value) {
      field = value
    }

  companion object {
    /** Source is a file-upload element of the form. */
    const val SOURCE_TYPE_UPLOAD: String = "UPLOAD"

    /** Source is a file of the form's file management (`ProjektRessource`). */
    const val SOURCE_TYPE_FORM_RESOURCE: String = "FORM_RESOURCE"

    /** Source is the file a previous workflow node produced. */
    const val SOURCE_TYPE_PREVIOUS_NODE: String = "PREVIOUS_NODE"

    /** Source is an external URL (`http`/`https`/`file`). */
    const val SOURCE_TYPE_URL: String = "URL"

    /** All values [sourceType] may have. */
    val SOURCE_TYPES: List<String> =
        listOf(
            SOURCE_TYPE_UPLOAD,
            SOURCE_TYPE_FORM_RESOURCE,
            SOURCE_TYPE_PREVIOUS_NODE,
            SOURCE_TYPE_URL)
  }
}
