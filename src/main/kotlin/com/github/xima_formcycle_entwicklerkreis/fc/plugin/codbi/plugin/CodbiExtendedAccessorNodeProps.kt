package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow.EExtendedAccessorRepetitionMode
import de.xima.fc.workflow.taglib.model.BaseActionProps
import org.slf4j.LoggerFactory

/**
 * Configuration of the CodBi "Extended Accessor" workflow node.
 *
 * The node reads exactly one form element and exposes its raw or structured value as a workflow
 * result. It never exposes the complete form-data map.
 */
class CodbiExtendedAccessorNodeProps : BaseActionProps() {
  /**
   * Technical name or alias of the form element to read.
   *
   * The explicit accessors log every read/write so workflow-designer persistence issues can be
   * diagnosed from the server log: a `setter` entry proves the value reached the model, a later
   * `getter` entry proves which value was rendered back into the properties view.
   */
  var fieldName: String? = ""
    get() {
      val value = field ?: ""
      logger.info("[CodBi][ExtendedAccessor] fieldName getter -> '{}' (raw='{}')", value, field)
      return value
    }
    set(value) {
      logger.info("[CodBi][ExtendedAccessor] fieldName setter <- '{}'", value)
      field = value
    }

  /**
   * One of the [EExtendedAccessorRepetitionMode] names.
   *
   * Nullable because JSF submits `null` for unrendered/unsubmitted select values; the resolver
   * treats it as `CURRENT`.
   */
  var repetitionMode: String? = EExtendedAccessorRepetitionMode.CURRENT.name
    get() = field ?: EExtendedAccessorRepetitionMode.CURRENT.name

  /**
   * Repetition index used when [repetitionMode] is `INDEX`. Negative or null values mean "not set".
   *
   * Nullable because an empty JSF number input submits `null`.
   */
  var repetitionIndex: Int? = -1
    get() = field ?: -1

  /**
   * Separator used to build the joined `value` string.
   *
   * Nullable because JSF may submit `null` for an empty input.
   */
  var joinSeparator: String? = ","
    get() = field ?: ","

  /** Whether basic element metadata is added to the result. */
  var includeMeta: Boolean = false

  /** Whether the value is passed through the OWASP HTML sanitizer. */
  var sanitizeHtml: Boolean = false

  /** Whether HTML is converted to plain text. */
  var htmlToText: Boolean = false

  /** Sanitizer switch: allow `<img>` elements. */
  var allowImages: Boolean = false

  /** Sanitizer switch: allow `<a>` elements. */
  var allowLinks: Boolean = true

  /** Sanitizer switch: allow `<table>` elements. */
  var allowTables: Boolean = true

  /** Sanitizer switch: allow inline styles. */
  var allowStyles: Boolean = true

  private companion object {
    private val logger = LoggerFactory.getLogger(CodbiExtendedAccessorNodeProps::class.java)
  }
}
