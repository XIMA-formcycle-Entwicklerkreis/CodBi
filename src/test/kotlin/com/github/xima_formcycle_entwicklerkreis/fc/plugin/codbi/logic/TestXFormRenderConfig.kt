package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import de.xima.fc.form.common.models.IXFormRenderConfig
import de.xima.fc.form.common.models.XFormRenderConfig

/**
 * Creates a new [IXFormRenderConfig] with defaults for testing.
 *
 * @return A new [IXFormRenderConfig] with defaults for testing.
 */
internal fun newXFormRenderConfig(): IXFormRenderConfig {
  val config = XFormRenderConfig()
  config.isFormOnly = false
  config.isForceInline = false
  config.isForceFullyInline = false
  config.baseIncludeUrl = "/xima-formcylce/"
  return config
}
