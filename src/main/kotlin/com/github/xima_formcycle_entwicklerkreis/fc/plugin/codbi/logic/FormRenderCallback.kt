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
  /** Stores all functionalities used by the form. */
  var usedFunctionalities: Set<String> = mutableSetOf<String>()
  /** Stores all **E**lement **P**laceholders used by the form. */
  var usedEPs: Set<String> = mutableSetOf<String>()
  /**
   * Stores the prefix to prepend when trying to load local libraries dynamically. Setting this to
   * an empty [String] will result in the CodBi not even trying to load local library files.
   */
  var prefixLocalLib: String = ""

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
          val currentEntry = child.value.attributes[i]

          if (currentEntry is com.alibaba.fastjson.JSONObject) {
            val currentEntryValue = (currentEntry.get("text") as String).lowercase()

            if (currentEntryValue == "data-cb-func" ||
                currentEntryValue == "data-cb-_t_func" ||
                currentEntryValue ==
                    "data-cb-_f_func") { // Check if it is the property that contains the
              // functionalities
              // to use.
              for (functionality in (currentEntry["value"] as String).split(",")) {
                val fileName = functionality.trim().lowercase()

                if (CodbiFormResourcesPlugin.formResources["$fileName.js"]?.resource != null) {
                  this.usedFunctionalities = this.usedFunctionalities.plus(fileName)
                }
              }
            } else {
              if ((currentEntry["text"] as String).length > 8 &&
                  (currentEntry["text"] as String).lowercase() != "data-cb-apply" &&
                  (currentEntry["text"] as String).substring(0, 8) == "data-cb-") {
                // CodBi-Attributes named "data-cb-APPLY" can be omitted. All
                // others starting with "data-cb-" may contain EPs.
                for (ep in extractEPs((currentEntry["value"] as String))) {
                  val fileName = ep.trim().lowercase()

                  if (CodbiFormResourcesPlugin.formResources["$fileName.js"]?.resource != null) {
                    this.usedEPs = this.usedEPs.plus(ep.trim().lowercase())
                  }
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
    renderProcessor.insertFormResourcePluginScript(
        "codbi-script", "codbi.js", isModule = false, prepend = true)
    // region Inject used functionalities
    for (functionality in this.usedFunctionalities) {
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
    for (ep in this.usedEPs) {
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
    for (standard in properties.standards.split(",")) {
      val trimmed = standard.trim()
      if (trimmed.isEmpty()) continue
      if (CodbiFormResourcesPlugin.formResources["$trimmed.js"]?.resource != null) {
        renderProcessor.insertFormResourcePluginScript(
            "codbi-standard-" + trimmed.replace(".", "-"), "$trimmed.js")
      } else {
        renderProcessor.insertNncHandlerScript(
            "codbi-standard-" + trimmed.replace(".", "-"), trimmed)
      }
    }
    // endregion Inject selected standard configurations
    // Insert the JavaScript for the selected configuration template
    // Currently, a config template is required, but perhaps it should be possible to choose none?
    renderProcessor.insertFormResourcePluginScript(
        "codbi-config-template", "config-template-${properties.configTemplate.value}.js")
  }
}
