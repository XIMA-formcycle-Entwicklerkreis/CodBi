package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.alibaba.fastjson.JSON
import de.xima.fc.interfaces.workflow.params.IGetElementPrototypesParams
import de.xima.fc.interfaces.workflow.value.ValueBuilderOptions
import de.xima.fc.workflow.processor.value.ValueDescriptorFactory
import io.mockk.mockk
import java.util.Locale
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CodbiExtendedAccessorNodePluginTest {
  private val plugin = CodbiExtendedAccessorNodePlugin()
  private val params = mockk<IGetElementPrototypesParams>(relaxed = true)

  @Test
  fun `uses a stable technical name`() {
    assertEquals("CodbiExtendedAccessor", plugin.name)
  }

  @Test
  fun `provides the properties view`() {
    assertEquals("CodbiExtendedAccessorNode.xhtml", plugin.propertiesViewXhtmlName)
  }

  @Test
  fun `provides localized display name and description`() {
    assertEquals("Extended Accessor", plugin.getDisplayName(Locale.ENGLISH))
    assertTrue(plugin.getDescription(Locale.ENGLISH).isNotBlank())
    assertEquals("Erweiterter Zugriff", plugin.getDisplayName(Locale.GERMAN))
  }

  @Test
  fun `uses the CodBi workflow categories`() {
    val main = plugin.getMainCategory(params)
    val sub = plugin.getSubCategory(params)

    assertEquals("CodBi", main.getName(Locale.ENGLISH))
    assertEquals("CodBi", main.getName(Locale.GERMAN))
    assertEquals("Extended Access", sub.getName(Locale.ENGLISH))
    assertEquals("Erweiterter Zugriff", sub.getName(Locale.GERMAN))
  }

  @Test
  fun `provides a blue exchange icon`() {
    val icon = plugin.getPrototypeIcon(params)

    assertNotNull(icon)
    assertEquals("fa fa-exchange-alt", icon.styleClass)
    assertTrue(icon.style.contains("extended-accessor-icon.svg"))
  }

  @Test
  fun `properties view offers a form element tree and preview`() {
    val view = plugin.propertiesViewXhtml.readText()

    assertTrue(view.contains("data-codbi-accessor-tree"))
    assertTrue(view.contains("workflow-extended-accessor.js"))
    assertTrue(view.contains("elementPreview"))
    // The selected element is persisted through a normally submitted input, not a widget-only value.
    assertTrue(view.contains("id=\"codbiAccessorFieldName\""))
    assertTrue(view.contains("codbi-accessor-field-name"))
    assertTrue(view.contains("codbiAccessorSelectField"))
  }

  @Test
  fun `persists the configured field name through the workflow props serializer`() {
    val props =
        CodbiExtendedAccessorNodeProps().apply {
          fieldName = "myField"
          repetitionMode = "ALL"
          sanitizeHtml = true
        }

    val restored =
        JSON.parseObject(JSON.toJSONString(props), CodbiExtendedAccessorNodeProps::class.java)

    assertEquals("myField", restored.fieldName)
    assertEquals("ALL", restored.repetitionMode)
    assertTrue(restored.sanitizeHtml)
  }

  @Test
  fun `success result keeps the resolved value with the strict result builder`() {
    // The workflow engine builds the success value with `ValueBuilderOptions.immutable()`,
    // i.e. strict acceptance criteria. Declaring `value` as `largeString` would reject the
    // plain `String` and silently store `LargeString.empty()`, making the system placeholder
    // `[%$Node.RESULT.value%]` resolve to an empty string.
    val descriptor = plugin.getSuccessValueDescriptor(ValueDescriptorFactory.getInstance()).asRecord()

    val result =
        descriptor
            .builder(ValueBuilderOptions.immutable())
            .property("name", "ed1")
            .property("value", "Hallo Welt")
            .property("values", listOf("Hallo Welt"))
            .property("repetitions", listOf(listOf("Hallo Welt")))
            .build()

    assertEquals("Hallo Welt", result["value"])
  }

  @Test
  fun `uses the CodBi dark-orange theme colour`() {
    assertEquals("#FF8C00", plugin.themeColor.toHexString())
  }
}
