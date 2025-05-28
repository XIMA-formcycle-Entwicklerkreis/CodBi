package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

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
 * attributes related to that framework. The code of all used functionalities and **E**lement
 * **P**laceholders will be automatically be injected into the frontend via proper script-tags.
 *
 * @since 1.0.0
 */
internal object FormRenderCallback : IFormRenderPluginCallback {
  /** Stores all functionalities used by the form. */
  var usedFunctionalities: Set<String> = mutableSetOf<String>()
  /** Stores all **E**lement **P**laceholders used by the form. */
  var usedEPs: Set<String> = mutableSetOf<String>()

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

    if (renderProcessor != null && properties?.enabled == true) {
      for (child in params.xForm.xItems) {
        for (i in 0 until child.value.attributes.size) { // Iterate through all attributes...
          val currentEntry = child.value.attributes.get(i)

          if (currentEntry is com.alibaba.fastjson.JSONObject) {
            if ((currentEntry.get("text") as String).lowercase() ==
                "cbfunc") { // Check if it is the property that contains the functionalities to use.
              for (functionality in (currentEntry.get("value") as String).split(",")) {
                this.usedFunctionalities =
                    this.usedFunctionalities.plus(functionality.trim().lowercase())
              }
            } else {
              if ((currentEntry.get("text") as String).lowercase() != "cbapply" &&
                  (currentEntry.get("text") as String).substring(0, 2) ==
                      "cb") { // CodBi-Attributes named "cbAPPLY" can be omitted. All others
                // starting with "cb" may contain EPs.
                for (ep in extractEPs((currentEntry.get("value") as String))) {
                  this.usedEPs = this.usedEPs.plus(ep.trim().lowercase())
                }
              }
            }
          }
        }
      }

      processCodeLib(renderProcessor, properties)
    }

    return null
  }

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
      properties: CodbiFormProperties
  ) {
    // Insert the main CSS and JavaScript for the code library
    renderProcessor.insertFormResourcePluginStyle("codbi-style", "codbi.css")
    renderProcessor.insertFormResourcePluginScript("codbi-script", "codbi.js")
    // region Inject used functionalities
    for (functionality in this.usedFunctionalities) {
      renderProcessor.insertFormResourcePluginScript(
          "codbi-functionality-" + functionality.replace(".", "-"), "$functionality.js")
    }
    // endregion Inject used functionalities
    // region Inject used element placeholders
    for (ep in this.usedEPs) {
      renderProcessor.insertFormResourcePluginScript(
          "codbi-elementplaceholder-" + ep.replace(".", "-"), "$ep.js")
    }
    // endregion Inject used element placeholders
    // region Inject selected standard configurations
    for (standard in properties.standards.split(",")) {
      renderProcessor.insertFormResourcePluginScript(
          "codbi-standard-" + standard.trim().replace(".", "-"), standard.trim() + ".js")
    }
    // endregion Inject selected standard configurations
    // Insert the JavaScript for the selected configuration template
    // Currently, a config template is required, but perhaps it should be possible to choose none?
    renderProcessor.insertFormResourcePluginScript(
        "codbi-config-template", "config-template-${properties.configTemplate.value}.js")
  }
}
