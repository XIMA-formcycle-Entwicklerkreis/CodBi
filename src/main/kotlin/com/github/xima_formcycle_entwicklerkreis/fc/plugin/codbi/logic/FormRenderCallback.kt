package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiFormResourcesPlugin
import de.xima.fc.interfaces.plugin.param.form.IPluginFormRenderCallbackOnAfterRenderFormParams
import de.xima.fc.interfaces.plugin.retval.form.IPluginFormRenderCallbackOnAfterRenderFormRetVal
import de.xima.fc.plugin.form.IFormRenderPluginCallback
import java.util.Stack

/**
 * A form render callback invoked after formcycle finished creating the HTML for a form.
 *
 * Inspects the form settings with regard to the configured code library settings. If the code
 * library was enabled in the designer, adds the required CSS and JavaScript resources to the form.
 *
 * Also, if the code library was enabled, the user can configure additional settings such as the
 * configuration template to use. This render callback also adjusts the form to reflect these
 * settings.
 *
 * With the CodBi enabled all HTML-Attributes that are set on all items will be checked for
 * attributes related to that framework. The code of all used functionalities and **e**lement
 * **p**laceholders will be automatically be injected into the frontend via proper script-tags.
 *
 * @since 1.0.0
 */
internal object FormRenderCallback : IFormRenderPluginCallback {

  /**
   * Matches a `class` attribute of the rendered markup. The value is captured WITHOUT its quotes:
   * group 1 holds a double-quoted value, group 2 a single-quoted one.
   *
   * The lookbehind keeps attributes such as `data-class="…"` out of the match — only a real `class`
   * attribute describes the CSS classes an element actually carries.
   */
  private val CLASS_ATTRIBUTE =
      Regex("""(?<![-\w])class\s*=\s*(?:"([^"]*)"|'([^']*)')""", RegexOption.IGNORE_CASE)

  /**
   * Matches a CodBi attribute (`data-cb-…`) of the rendered markup. Group 1 holds the attribute
   * NAME, group 2 a double-quoted value, group 3 a single-quoted one.
   *
   * Needed because the persisted items of the target form are NOT the only source of CodBi usages:
   * a Mirror renders the referenced element LIVE, so functionalities applied to an element inside
   * the mirrored container (e.g. `data-cb-func="media.multipleupload"` on a mirrored `XUpload`)
   * only exist in the RENDERED markup — the target form's own items know nothing about them (and
   * the Mirror's persisted copies are only refreshed when the designer loads the form).
   */
  private val CB_ATTRIBUTE =
      Regex("""(?<![-\w])(data-cb-[\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')""", RegexOption.IGNORE_CASE)

  /**
   * Extracts all **E**lement **P**laceholders used within a CodBi-Attribute's value with nesting
   * supported. Those placeholders are of following format { Placeholder e.g. HTML.Text.Mapper >
   * Parameter SSV }.
   *
   * @param toExtractFrom The CodBi-Attributes's string to extract the **E**lement **P**laceholders
   *   from.
   * @return The listing of **E**lement **P**laceholders that were found in the string
   *   **toExtractFrom**.
   */
  fun extractEPs(toExtractFrom: String): List<String> {
    val result = mutableListOf<String>()
    val segmentStartStack = Stack<Int>() // Indices of segments
    var currentSegmentStart = 0 // Index of current segment

    for (i in toExtractFrom.indices) {
      when (toExtractFrom[i]) {
        '{' -> {
          segmentStartStack.push(currentSegmentStart)

          currentSegmentStart = i + 1
        }
        '}' -> {
          if (segmentStartStack.isNotEmpty()) {
            currentSegmentStart = segmentStartStack.pop()
          } else {
            currentSegmentStart = i + 1
          }
        } // Opening without closing curly brace encountered. Move on.
        '>' -> {
          if (segmentStartStack.isNotEmpty()) {
            val leftPart = toExtractFrom.substring(currentSegmentStart, i).trim()

            if (leftPart.isNotEmpty()) {
              result.add(leftPart)
            }

            currentSegmentStart = i + 1
          } else {
            currentSegmentStart = i + 1
          }
        }
        else -> { // Currently not in any segment.
          if (segmentStartStack.isEmpty()) {
            currentSegmentStart = i + 1
          }
        }
      }
    }
    return result
  }

  /**
   * Checks if the code library was enabled, and if so, takes the appropriate actions.
   *
   * Determines the functionalities and **e**lement **p**laceholders that're referenced in any
   * XItem-Attribute.
   *
   * @param params The parameters of the form render callback, as provided by formcycle.
   * @return Always null, we only mutate the form in-place.
   */
  override fun onAfterRenderForm(
      params: IPluginFormRenderCallbackOnAfterRenderFormParams?
  ): IPluginFormRenderCallbackOnAfterRenderFormRetVal? {
    val properties = params?.xForm?.formProperties?.let { CodbiFormProperties(it) }
    val renderProcessor = params?.let { FormRenderProcessor(it) }

    // Hide the Mirror widget's persisted "registration" copies on the published form: the Mirror
    // renders the referenced source element LIVE instead. This must run for EVERY form (a form may
    // use the Mirror without the CodBi code library being enabled).
    renderProcessor?.insertHideMirrorCopiesScript()
    // Teach FORMCYCLE's client-side condition engine the mirrored elements: their ids are
    // namespaced
    // and they are not part of the target form's item loop, so FORMCYCLE never registers their
    // hidden-if/readonly-if/required-if conditions on its own. Also needed regardless of the CodBi
    // code library being enabled.
    renderProcessor?.insertMirrorConditionModelScript()

    if (renderProcessor != null && properties?.enabled == true) {
      val usedFunctionalities = mutableSetOf<String>()
      val usedEPs = mutableSetOf<String>()

      // The RENDERED markup is serialized exactly once and used for BOTH scans below.
      val renderedMarkup = renderProcessor.renderedFormMarkup()

      // (1) The persisted items of the TARGET form.
      for (child in params.xForm.xItems) {
        for (i in 0 until child.value.attributes.size) { // Iterate through all attributes...
          val currentEntry = child.value.attributes[i]

          if (currentEntry is com.alibaba.fastjson.JSONObject) {
            // A MALFORMED attribute entry must never break the whole render: the designer preview
            // threw `null cannot be cast to non-null type kotlin.String` for an entry without a
            // "text" STRING (observed after a run whose AI emitted the change-log attribute shape
            // {"name":…,"value":…,"kind":…,"codbi":…}), which left the user with an EMPTY-looking
            // form. Skip such entries instead of throwing; the backend also normalizes them away
            // (see AICodBiAssistant's properties.attributes canonicalization).
            val attrText = currentEntry.get("text") as? String ?: continue
            val attrValue = currentEntry.get("value") as? String ?: ""
            collectCodbiUsage(attrText, attrValue, usedFunctionalities, usedEPs)
          }
        }
      }

      // (2) The RENDERED markup. This is what makes CodBi functionalities (and EPs) work on
      // elements a Mirror renders LIVE: those elements belong to ANOTHER form, so they are absent
      // from `xForm.xItems` — and the Mirror's persisted copies are only refreshed when the
      // designer loads the target form. Without this scan a functionality applied to a mirrored
      // element (e.g. a multi-upload on a mirrored `XUpload`) only appeared after opening and
      // saving the target form in the designer.
      collectCodbiUsage(renderedMarkup, usedFunctionalities, usedEPs)

      // #region Standard-configuration CSS classes used by the RENDERED form.
      // A standard configuration is applied by putting one of its CSS classes onto an element — the
      // class is only a MARKER, the behaviour is applied by the configuration's own script. Those
      // scripts used to be injected exclusively from the form-level `codbi-prop-standards` CSV, so
      // a
      // class that was applied without activating its configuration (e.g. typed into the element's
      // CSS-classes property) did literally nothing: future dates stayed selectable although the
      // field carried `CodBi_NoFutureDate`. A manually applied `data-cb-func="Date.Min"` worked in
      // the SAME form, because the item scan above injects the functionality's script for it.
      // Detecting the classes in the rendered markup closes that gap: the owning configuration AND
      // the
      // functionalities it applies are injected whenever the form actually uses the class.
      // #endregion
      val usedStandardClasses = extractClassNames(renderedMarkup)
      val standardProviders = StandardConfigClasses.providersOf(usedStandardClasses)

      for (provider in standardProviders) {
        for (functionality in provider.funcs) {
          usedFunctionalities.add(functionality.lowercase())
        }
      }

      processCodeLib(
          renderProcessor,
          properties,
          usedFunctionalities,
          usedEPs,
          standardProviders.map { it.configId })
    }

    return null
  }

  /**
   * Extracts every CSS class token that occurs in a `class="…"` (or `class='…'`) attribute of the
   * given markup.
   *
   * Only class attributes are considered — `class` also appears in text, ids and inline scripts,
   * and those must not be mistaken for an applied standard-configuration class.
   *
   * @param toExtractFrom The rendered form markup.
   * @return The de-duplicated class names, in document order.
   */
  fun extractClassNames(toExtractFrom: String): Set<String> {
    val result = linkedSetOf<String>()

    for (match in CLASS_ATTRIBUTE.findAll(toExtractFrom)) {
      val value = match.groupValues[1].ifEmpty { match.groupValues[2] }

      for (candidate in value.split(" ", "\t", "\n", "\r", "\u000C")) {
        val cssClass = candidate.trim()

        if (cssClass.isNotEmpty()) {
          result.add(cssClass)
        }
      }
    }

    return result
  }

  /**
   * Records the CodBi **functionalities** and **e**lement **p**laceholders that one attribute
   * (`attributeName`/`attributeValue`) uses.
   *
   * Only usages whose resource actually exists are recorded — an unknown name would otherwise
   * produce a 404 (functionalities and EPs stored in the database are handled by the caller via the
   * NNC handler).
   */
  fun collectCodbiUsage(
      attributeName: String,
      attributeValue: String,
      usedFunctionalities: MutableSet<String>,
      usedEPs: MutableSet<String>
  ) {
    val name = attributeName.lowercase()
    if (name == "data-cb-func" || name == "data-cb-_t_func" || name == "data-cb-_f_func") {
      // The property carrying the functionalities to use.
      for (functionality in attributeValue.split(",")) {
        val fileName = functionality.trim().lowercase()
        if (CodbiFormResourcesPlugin.formResources["$fileName.js"]?.resource != null) {
          usedFunctionalities.add(fileName)
        }
      }
      return
    }
    // `data-cb-apply` never contains EPs; every other `data-cb-…` attribute may.
    if (name.startsWith("data-cb-") && name != "data-cb-apply") {
      for (ep in extractEPs(attributeValue)) {
        val fileName = ep.trim().lowercase()
        if (CodbiFormResourcesPlugin.formResources["$fileName.js"]?.resource != null) {
          usedEPs.add(fileName)
        }
      }
    }
  }

  /**
   * Records the CodBi usages of every `data-cb-…` attribute that occurs in [markup].
   *
   * Used for the RENDERED form markup, which also contains the elements a Mirror renders LIVE from
   * another form (they are not part of the target form's persisted items).
   */
  fun collectCodbiUsage(
      markup: String,
      usedFunctionalities: MutableSet<String>,
      usedEPs: MutableSet<String>
  ) {
    for ((attributeName, attributeValue) in extractCodbiAttributeUsages(markup)) {
      collectCodbiUsage(attributeName, attributeValue, usedFunctionalities, usedEPs)
    }
  }

  /** @return the `(name, value)` pairs of all `data-cb-…` attributes that occur in [markup]. */
  fun extractCodbiAttributeUsages(markup: String): List<Pair<String, String>> =
      CB_ATTRIBUTE.findAll(markup)
          .map { match ->
            match.groupValues[1] to match.groupValues[2].ifEmpty { match.groupValues[3] }
          }
          .toList()

  /**
   * Called when the code library was enabled. Inserts the required CSS and JavaScript resources;
   * and also takes the appropriate actions for the additional settings, such as adding data
   * attributes etc.
   *
   * Functionalities, **e**lement **p**laceholders & selected standard configurations are injected
   * here.
   */
  private fun processCodeLib(
      renderProcessor: FormRenderProcessor,
      properties: CodbiFormProperties,
      usedFunctionalities: Set<String>,
      usedEPs: Set<String>,
      usedStandardConfigurations: List<String> = emptyList()
  ) {
    // Insert the main CSS and JavaScript for the code library
    renderProcessor.insertFormResourcePluginStyle("codbi-style", "codbi.css")
    renderProcessor.insertFormResourcePluginScript(
        "codbi-script", "codbi.js", isModule = false, prepend = true)
    // region Inject used functionalities
    for (functionality in usedFunctionalities) {
      if (CodbiFormResourcesPlugin.formResources["$functionality.js"]?.resource != null) {
        renderProcessor.insertFormResourcePluginScript(
            "codbi-functionality-" + functionality.replace(".", "-"), "$functionality.js")
      } else {
        renderProcessor.insertNncHandlerScript(
            "codbi-functionality-" + functionality.replace(".", "-"), functionality)
      }
    }
    // endregion Inject used functionalities
    // region Inject used element placeholders
    for (ep in usedEPs) {
      if (CodbiFormResourcesPlugin.formResources["$ep.js"]?.resource != null) {
        renderProcessor.insertFormResourcePluginScript(
            "codbi-elementplaceholder-" + ep.replace(".", "-"), "$ep.js")
      } else {
        renderProcessor.insertNncHandlerScript(
            "codbi-elementplaceholder-" + ep.replace(".", "-"), ep)
      }
    }
    // endregion Inject used element placeholders
    // region Inject selected standard configurations
    // The form-level selection (`codbi-prop-standards`) plus every configuration whose CSS class
    // the
    // rendered form actually uses. Both are injected at most once, in a stable order.
    val standardsToInject = linkedSetOf<String>()

    for (standard in properties.standards.split(",")) {
      val trimmed = standard.trim()
      if (trimmed.isNotEmpty()) standardsToInject.add(trimmed)
    }
    standardsToInject.addAll(usedStandardConfigurations.filter { it.isNotBlank() })

    for (standard in standardsToInject) {
      if (CodbiFormResourcesPlugin.formResources["$standard.js"]?.resource != null) {
        renderProcessor.insertFormResourcePluginScript(
            "codbi-standard-" + standard.replace(".", "-"), "$standard.js")
      } else {
        renderProcessor.insertNncHandlerScript(
            "codbi-standard-" + standard.replace(".", "-"), standard)
      }
    }
    // endregion Inject selected standard configurations
    // Insert the JavaScript for the selected configuration template
    // Currently, a config template is required, but perhaps it should be possible to choose none?
    renderProcessor.insertFormResourcePluginScript(
        "codbi-config-template", "config-template-${properties.configTemplate.value}.js")
  }
}
