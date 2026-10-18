package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiExtendedAccessorNodeProps
import de.xima.fc.form.common.items.XItem
import de.xima.fc.form.common.models.IXForm
import de.xima.fc.interfaces.form.IFormDataAdapter
import de.xima.fc.interfaces.workflow.execution.IWorkflowExecutionEnvironmentData
import de.xima.fc.mdl.enums.EFormFieldTyp
import de.xima.fc.mdl.fdv.form.FormFieldDescription
import de.xima.fc.mdl.fdv.form.FormFieldMetaData
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ExtendedAccessorResolverTest {
  private fun props(field: String = "tfHtml") =
      CodbiExtendedAccessorNodeProps().apply { fieldName = field }

  private fun environment(
      values: List<Array<String>>? = listOf(arrayOf("<p>Hello</p>")),
      meta: FormFieldMetaData? = null,
      item: XItem? = null,
  ): IWorkflowExecutionEnvironmentData {
    val adapter = mockk<IFormDataAdapter>(relaxed = true)
    every { adapter.resolveFieldAlias("tfHtml") } returns "tfHtml"
    every { adapter.getFieldValues("tfHtml") } returns values
    every { adapter.getFieldMetaData("tfHtml", false) } returns meta
    every { adapter.isElementLooped("tfHtml") } returns false
    every { adapter.loopCount("tfHtml") } returns 1

    val xForm = mockk<IXForm>(relaxed = true)
    every { xForm.xItems } returns if (item != null) mapOf("item-id" to item) else emptyMap()

    val environment = mockk<IWorkflowExecutionEnvironmentData>(relaxed = true)
    every { environment.rawFormDataAdapter } returns adapter
    every { environment.formDataAdapter } returns adapter
    every { environment.xForm } returns xForm

    return environment
  }

  @Test
  fun `returns raw html without escaping`() {
    val result = ExtendedAccessorResolver.resolve(props(), environment())

    assertEquals("tfHtml", result.name)
    assertEquals("<p>Hello</p>", result.value)
    assertEquals(listOf("<p>Hello</p>"), result.values)
    assertEquals(listOf(listOf("<p>Hello</p>")), result.repetitions)
  }

  @Test
  fun `joins multiple values with the configured separator`() {
    val p = props().apply { joinSeparator = " | " }
    val result =
        ExtendedAccessorResolver.resolve(
            p,
            environment(values = listOf(arrayOf("a"), arrayOf("b"))),
        )

    assertEquals("a | b", result.value)
    assertEquals(listOf("a", "b"), result.values)
    assertEquals(listOf(listOf("a"), listOf("b")), result.repetitions)
  }

  @Test
  fun `index mode reads only the configured repetition`() {
    val p =
        props().apply {
          repetitionMode = EExtendedAccessorRepetitionMode.INDEX.name
          repetitionIndex = 1
        }
    val result =
        ExtendedAccessorResolver.resolve(
            p,
            environment(values = listOf(arrayOf("a"), arrayOf("b"), arrayOf("c"))),
        )

    assertEquals("b", result.value)
    assertEquals(listOf("b"), result.values)
    assertEquals(listOf(listOf("b")), result.repetitions)
  }

  @Test
  fun `sanitizes unsafe html`() {
    val p = props().apply { sanitizeHtml = true }
    val result =
        ExtendedAccessorResolver.resolve(
            p,
            environment(
                values = listOf(arrayOf("<p>Hello</p><script>alert(1)</script>")),
            ),
        )

    assertEquals("<p>Hello</p>", result.value)
    assertFalse(result.value.contains("<script"))
  }

  @Test
  fun `converts html to text`() {
    val p = props().apply { htmlToText = true }
    val result =
        ExtendedAccessorResolver.resolve(
            p,
            environment(values = listOf(arrayOf("<p>Hello <strong>world</strong></p>"))),
        )

    assertEquals("Hello world", result.value)
  }

  @Test
  fun `includes element metadata when requested`() {
    val item = mockk<XItem>(relaxed = true)
    every { item.name } returns "tfHtml"
    every { item.alias } returns "htmlBody"
    every { item.resolvedAlias } returns "htmlBody"
    every { item.className } returns "XTextArea"
    every { item.datatype } returns "text"

    val meta = FormFieldMetaData("tfHtml", EFormFieldTyp.TEXTAREA, FormFieldDescription())
    meta.fieldAlias = "htmlBody"

    val p = props().apply { includeMeta = true }
    val result =
        ExtendedAccessorResolver.resolve(
            p,
            environment(meta = meta, item = item),
        )

    assertEquals("tfHtml", result.meta["name"])
    assertEquals(true, result.meta["exists"])
    assertEquals("htmlBody", result.meta["alias"])
    assertEquals("XTextArea", result.meta["className"])
    assertEquals("TEXTAREA", result.meta["type"])
    assertEquals("text", result.meta["datatype"])
  }

  @Test
  fun `missing value returns empty result`() {
    val result = ExtendedAccessorResolver.resolve(props(), environment(values = null))

    assertEquals("", result.value)
    assertTrue(result.values.isEmpty())
    assertTrue(result.repetitions.isEmpty())
  }

  @Test
  fun `resolves an alias to the technical field name`() {
    val adapter = mockk<IFormDataAdapter>(relaxed = true)
    every { adapter.resolveFieldAlias("htmlBody") } returns "tfHtml"
    every { adapter.resolveAliasName("htmlBody") } returns "tfHtml"
    every { adapter.getFieldValues("tfHtml") } returns listOf(arrayOf("<p>Hello</p>"))

    val xForm = mockk<IXForm>(relaxed = true)
    every { xForm.xItems } returns emptyMap()

    val environment = mockk<IWorkflowExecutionEnvironmentData>(relaxed = true)
    every { environment.rawFormDataAdapter } returns adapter
    every { environment.formDataAdapter } returns adapter
    every { environment.xForm } returns xForm

    val result = ExtendedAccessorResolver.resolve(props(field = "htmlBody"), environment)

    assertEquals("tfHtml", result.name)
    assertEquals("<p>Hello</p>", result.value)
  }

  @Test
  fun `falls back to the raw adapter when the context adapter has no values`() {
    val contextAdapter = mockk<IFormDataAdapter>(relaxed = true)
    val rawAdapter = mockk<IFormDataAdapter>(relaxed = true)
    every { rawAdapter.resolveFieldAlias("tfHtml") } returns "tfHtml"
    every { rawAdapter.getFieldValues("tfHtml") } returns listOf(arrayOf("<p>Hello</p>"))

    val xForm = mockk<IXForm>(relaxed = true)
    every { xForm.xItems } returns emptyMap()

    val environment = mockk<IWorkflowExecutionEnvironmentData>(relaxed = true)
    every { environment.formDataAdapter } returns contextAdapter
    every { environment.rawFormDataAdapter } returns rawAdapter
    every { environment.xForm } returns xForm

    val result = ExtendedAccessorResolver.resolve(props(), environment)

    assertEquals("tfHtml", result.name)
    assertEquals("<p>Hello</p>", result.value)
  }
}
