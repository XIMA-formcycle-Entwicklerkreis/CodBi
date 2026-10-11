package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.CodbiConfigTemplate
import de.xima.fc.form.common.models.XFormProperties
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

/** Tests for [CodbiFormProperties]. */
class CodbiFormPropertiesTest {
  private val xFormProperties = XFormProperties()
  private val props = CodbiFormProperties(xFormProperties)

  @Test
  fun getEnabled() {
    assertFalse(props.enabled)

    xFormProperties.setProperty("codbi-prop-enable", "")
    assertFalse(props.enabled)

    xFormProperties.setProperty("codbi-prop-enable", "0")
    assertFalse(props.enabled)

    xFormProperties.setProperty("codbi-prop-enable", "1")
    assertTrue(props.enabled)
  }

  @Test
  fun getMarkElements() {
    // Defaults to disabled.
    assertFalse(props.markElements)

    xFormProperties.setProperty("codbi-prop-mark-elements", "")
    assertFalse(props.markElements)

    xFormProperties.setProperty("codbi-prop-mark-elements", "0")
    assertFalse(props.markElements)

    xFormProperties.setProperty("codbi-prop-mark-elements", "1")
    assertTrue(props.markElements)
  }

  @Test
  fun getMarkLabels() {
    // Defaults to disabled.
    assertFalse(props.markLabels)

    xFormProperties.setProperty("codbi-prop-mark-labels", "")
    assertFalse(props.markLabels)

    xFormProperties.setProperty("codbi-prop-mark-labels", "0")
    assertFalse(props.markLabels)

    xFormProperties.setProperty("codbi-prop-mark-labels", "1")
    assertTrue(props.markLabels)
  }

  @Test
  fun getConfigTemplate() {
    assertEquals(CodbiConfigTemplate.DEFAULT, props.configTemplate)

    xFormProperties.setProperty("codbi-prop-config-template", "default")
    assertEquals(CodbiConfigTemplate.DEFAULT, props.configTemplate)

    xFormProperties.setProperty("codbi-prop-config-template", "xtensible")
    assertEquals(CodbiConfigTemplate.XTENSIBLE, props.configTemplate)

    xFormProperties.setProperty("codbi-prop-config-template", "xxx")
    assertEquals(CodbiConfigTemplate.DEFAULT, props.configTemplate)
  }
}
