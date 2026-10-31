package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiExtendedAccessorNodeProps
import de.xima.fc.interfaces.form.IFormDataAdapter
import de.xima.fc.interfaces.workflow.execution.IWorkflowExecutionEnvironmentData
import org.jsoup.Jsoup
import org.owasp.html.PolicyFactory
import org.owasp.html.Sanitizers
import org.slf4j.LoggerFactory

/** Controls which repetitions of a form element are read. */
enum class EExtendedAccessorRepetitionMode {
  /** Use the current repetition/field-value context. */
  CURRENT,
  /** Use one explicit repetition index. */
  INDEX,
  /** Read all repetitions. */
  ALL,
}

/**
 * Result of reading one form element.
 *
 * @property name technical name of the element
 * @property value joined string value
 * @property values flat list of values
 * @property repetitions per-repetition values
 * @property meta optional basic metadata
 */
data class ExtendedAccessorResult(
    val name: String,
    val value: String,
    val values: List<String>,
    val repetitions: List<List<String>>,
    val meta: Map<String, Any?>,
)

/**
 * Reads exactly one form element from the workflow execution environment and prepares it for the
 * Extended Accessor workflow node.
 *
 * The resolver only touches the configured field. It never reads or returns the complete request
 * map or the complete form record.
 */
object ExtendedAccessorResolver {
  private val logger = LoggerFactory.getLogger(ExtendedAccessorResolver::class.java)

  fun resolve(
      props: CodbiExtendedAccessorNodeProps,
      env: IWorkflowExecutionEnvironmentData,
  ): ExtendedAccessorResult {
    val configuredName = props.fieldName.orEmpty().trim()
    val mode = parseRepetitionMode(props.repetitionMode.orEmpty())
    val baseCandidates = fieldNameCandidates(configuredName, env)
    val adapters = adaptersFor(mode, env)
    logger.info(
        "[CodBi][ExtendedAccessor] resolve configuredName='{}' mode={} baseCandidates={} adapters={}",
        configuredName,
        mode,
        baseCandidates,
        adapters.map { it.javaClass.simpleName },
    )

    var technicalName = configuredName
    var selectedAdapter: IFormDataAdapter? = null
    var rawValues: List<Array<String>>? = null
    var foundNonEmpty = false

    for (adapter in adapters) {
      // Alias/name mappings are adapter-specific (form data vs. workflow field-value context).
      val candidates = LinkedHashSet(baseCandidates)
      runCatching { adapter.resolveFieldAlias(configuredName) }
          .getOrNull()
          ?.takeIf { it.isNotBlank() }
          ?.let(candidates::add)
      runCatching { adapter.resolveAliasName(configuredName) }
          .getOrNull()
          ?.takeIf { it.isNotBlank() }
          ?.let(candidates::add)

      logger.info(
          "[CodBi][ExtendedAccessor] adapter={} candidates={}",
          adapter.javaClass.simpleName,
          candidates,
      )
      for (candidate in candidates) {
        val values =
            runCatching {
                  when (mode) {
                    EExtendedAccessorRepetitionMode.CURRENT -> adapter.getFieldValues(candidate)
                    EExtendedAccessorRepetitionMode.INDEX -> {
                      val all = adapter.getFieldValues(candidate) ?: return@runCatching null
                      val index = props.repetitionIndex ?: -1
                      if (index in all.indices) listOf(all[index]) else emptyList()
                    }
                    EExtendedAccessorRepetitionMode.ALL -> adapter.getFieldValues(candidate)
                  }
                }
                .getOrNull() ?: continue
        logger.info(
            "[CodBi][ExtendedAccessor] adapter={} candidate='{}' -> {} value row(s)",
            adapter.javaClass.simpleName,
            candidate,
            values.size,
        )

        if (values.isNotEmpty()) {
          technicalName = candidate
          selectedAdapter = adapter
          rawValues = values
          foundNonEmpty = true
          break
        }
        // Keep the first non-null (but empty) result as a fallback, so an actually empty field
        // still reports the correct technical name instead of silently looking "missing".
        if (rawValues == null) {
          technicalName = candidate
          selectedAdapter = adapter
          rawValues = values
        }
      }
      if (foundNonEmpty) {
        break
      }
    }

    if (!foundNonEmpty && rawValues == null) {
      logger.warn(
          "Extended Accessor: form element '{}' was not found in the submitted form data (candidates: {})",
          configuredName,
          baseCandidates)
    }

    val allValues: List<List<String>> = rawValues.orEmpty().map { it.toList() }
    val transformed = allValues.map { row -> row.map { transformValue(it, props) } }
    val flat = transformed.flatten()
    val joined = flat.joinToString(props.joinSeparator.orEmpty().ifEmpty { "," })
    val meta = if (props.includeMeta) buildMeta(technicalName, selectedAdapter, env) else emptyMap()
    logger.info(
        "[CodBi][ExtendedAccessor] resolved field='{}' adapter={} nonEmpty={} rows={} flatValues={} resultLength={}",
        technicalName,
        selectedAdapter?.javaClass?.simpleName,
        foundNonEmpty,
        allValues.size,
        flat.size,
        joined.length,
    )

    return ExtendedAccessorResult(
        name = technicalName,
        value = joined,
        values = flat,
        repetitions = transformed,
        meta = meta,
    )
  }

  /**
   * Candidate field identifiers for the configured value. The mirror tree usually provides the
   * technical `name`, but aliases (and the resolved alias) are also accepted — this is what makes
   * the node work for elements whose submitted key is an alias or a repetition-suffixed name.
   */
  private fun fieldNameCandidates(
      configuredName: String,
      env: IWorkflowExecutionEnvironmentData,
  ): List<String> {
    val candidates = LinkedHashSet<String>()
    if (configuredName.isNotBlank()) {
      candidates.add(configuredName)
    }
    val item =
        runCatching {
              env.xForm.xItems.orEmpty().values.firstOrNull {
                it.name == configuredName ||
                    it.alias == configuredName ||
                    it.resolvedAlias == configuredName
              }
            }
            .getOrNull()
    item?.name?.takeIf { it.isNotBlank() }?.let(candidates::add)
    item?.alias?.takeIf { it.isNotBlank() }?.let(candidates::add)
    item?.resolvedAlias?.takeIf { it.isNotBlank() }?.let(candidates::add)
    return candidates.toList()
  }

  /**
   * Adapters to consult, in order. `CURRENT` reads the workflow context adapter first (so repeated
   * / form-element-context nodes see their current value) and then the raw submission adapter.
   * `INDEX` and `ALL` always read the raw submission data.
   */
  private fun adaptersFor(
      mode: EExtendedAccessorRepetitionMode,
      env: IWorkflowExecutionEnvironmentData,
  ): List<IFormDataAdapter> {
    val adapters = LinkedHashSet<IFormDataAdapter>()
    if (mode == EExtendedAccessorRepetitionMode.CURRENT) {
      runCatching { env.formDataAdapter }.getOrNull()?.let(adapters::add)
    }
    runCatching { env.rawFormDataAdapter }.getOrNull()?.let(adapters::add)
    return adapters.toList()
  }

  private fun transformValue(
      value: String,
      props: CodbiExtendedAccessorNodeProps,
  ): String {
    var result = value

    if (props.sanitizeHtml) {
      result = buildPolicy(props).sanitize(result)
    }

    if (props.htmlToText) {
      result = Jsoup.parse(result).text()
    }

    return result
  }

  private fun buildPolicy(props: CodbiExtendedAccessorNodeProps): PolicyFactory {
    var policy = Sanitizers.FORMATTING.and(Sanitizers.BLOCKS)

    if (props.allowLinks) {
      policy = policy.and(Sanitizers.LINKS)
    }
    if (props.allowTables) {
      policy = policy.and(Sanitizers.TABLES)
    }
    if (props.allowImages) {
      policy = policy.and(Sanitizers.IMAGES)
    }
    if (props.allowStyles) {
      policy = policy.and(Sanitizers.STYLES)
    }

    return policy
  }

  private fun buildMeta(
      technicalName: String,
      adapter: IFormDataAdapter?,
      env: IWorkflowExecutionEnvironmentData,
  ): Map<String, Any?> {
    val item =
        runCatching {
              env.xForm.xItems.orEmpty().values.firstOrNull {
                it.name == technicalName ||
                    it.alias == technicalName ||
                    it.resolvedAlias == technicalName
              }
            }
            .getOrNull()
    val fieldMeta = runCatching { adapter?.getFieldMetaData(technicalName, false) }.getOrNull()

    val meta =
        linkedMapOf<String, Any?>(
            "name" to technicalName,
            "exists" to
                (runCatching { adapter?.getFieldValues(technicalName) }.getOrNull() != null),
            "alias" to (fieldMeta?.fieldAlias ?: item?.alias),
            "resolvedAlias" to item?.resolvedAlias,
            "className" to item?.className,
            "datatype" to item?.datatype,
            "type" to fieldMeta?.type?.name,
            "looped" to runCatching { adapter?.isElementLooped(technicalName) }.getOrNull(),
            "loopCount" to runCatching { adapter?.loopCount(technicalName) }.getOrNull(),
        )

    return meta.filterValues { it != null }
  }

  private fun parseRepetitionMode(value: String): EExtendedAccessorRepetitionMode =
      EExtendedAccessorRepetitionMode.values().firstOrNull {
        it.name.equals(value, ignoreCase = true)
      } ?: EExtendedAccessorRepetitionMode.CURRENT
}
