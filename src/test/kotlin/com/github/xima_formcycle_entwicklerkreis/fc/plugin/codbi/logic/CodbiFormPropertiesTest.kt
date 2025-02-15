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
  fun getConfigTemplate() {
    assertEquals(CodbiConfigTemplate.DEFAULT, props.configTemplate)

    xFormProperties.setProperty("codbi-prop-config-template", "default")
    assertEquals(CodbiConfigTemplate.DEFAULT, props.configTemplate)

    xFormProperties.setProperty("codbi-prop-config-template", "minimal")
    assertEquals(CodbiConfigTemplate.MINIMAL, props.configTemplate)

    xFormProperties.setProperty("codbi-prop-config-template", "xxx")
    assertEquals(CodbiConfigTemplate.DEFAULT, props.configTemplate)
  }
}
