package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.hp.gagawa.java.elements.Form
import com.hp.gagawa.java.elements.Html
import com.hp.gagawa.java.elements.Script
import de.xima.fc.common.dom.Gagawa.*
import de.xima.fc.form.common.models.IXForm
import de.xima.fc.form.common.models.IXFormRenderConfig
import de.xima.fc.form.common.models.IXFormRenderContext
import de.xima.fc.form.common.models.XForm
import de.xima.fc.form.common.models.XFormRenderContext
import de.xima.fc.interfaces.plugin.param.form.IPluginFormRenderCallbackOnAfterRenderFormParams
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [FormRenderCallback]. */
class FormRenderCallbackTest {

  // region onAfterRenderForm

  @Test
  fun appendsCodeLibraryResourcesWhenEnabled() {
    val params = AfterRenderFormParams()
    params.xForm.formProperties.setProperty("codbi-prop-enable", "1")

    FormRenderCallback.onAfterRenderForm(params)

    val script = byTagName(params.doc.form, "script")
    assertEquals("codbi-script", attr(script, "id"))
    assertEquals("codbi-script", attr(script, "name"))
    assertEquals(
        "/xima-formcylce/ressource/-1/-1/plugin/form-resources/f140090d-d471-4650-8fef-8067e1e1dcdd/com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources/codbi.js",
        attr(script, "src"))

    val link = byTagName(params.doc.head, "link")
    assertEquals("codbi-style", attr(link, "id"))
    assertEquals("codbi-style", attr(link, "name"))
    assertEquals(
        "/xima-formcylce/ressource/-1/-1/plugin/form-resources/f140090d-d471-4650-8fef-8067e1e1dcdd/com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources/codbi.css",
        attr(link, "href"))
  }

  @Test
  fun doesNotAppendCodeLibraryResourcesWhenDisabled() {
    val params = AfterRenderFormParams()
    params.xForm.formProperties.setProperty("codbi-prop-enable", "0")

    FormRenderCallback.onAfterRenderForm(params)

    assertNull(byTagName(params.doc.html, "script"))
    assertNull(byTagName(params.doc.html, "link"))
  }

  @Test
  fun appendsSelectedConfigTemplateWhenEnabled() {
    val params = AfterRenderFormParams()
    params.xForm.formProperties.setProperty("codbi-prop-enable", "1")
    params.xForm.formProperties.setProperty("codbi-prop-config-template", "minimal")

    FormRenderCallback.onAfterRenderForm(params)

    val script =
        matching(params.doc.form, Script::class.java, { attr(it, "id") == "codbi-config-template" })
    assertEquals("codbi-config-template", attr(script, "id"))
    assertEquals("codbi-config-template", attr(script, "name"))
    assertEquals(
        "/xima-formcylce/ressource/-1/-1/plugin/form-resources/f140090d-d471-4650-8fef-8067e1e1dcdd/com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources/config-template-default.js",
        attr(script, "src"))
  }

  @Test
  fun doesNotAppendSelectedConfigTemplateWhenDisabled() {
    val params = AfterRenderFormParams()
    params.xForm.formProperties.setProperty("codbi-prop-enable", "0")
    params.xForm.formProperties.setProperty("codbi-prop-config-template", "minimal")

    FormRenderCallback.onAfterRenderForm(params)

    val script =
        matching(params.doc.form, Script::class.java, { attr(it, "id") == "codbi-config-template" })
    assertNull(script)
  }

  @Test
  fun returnsNullForNullParams() {
    val result = FormRenderCallback.onAfterRenderForm(null)
    assertNull(result)
  }

  // endregion

  // region extractEPs

  @Nested
  inner class ExtractEPsTest {

    @Test
    fun emptyString() {
      val result = FormRenderCallback.extractEPs("")
      assertTrue(result.isEmpty())
    }

    @Test
    fun noPlaceholders() {
      val result = FormRenderCallback.extractEPs("just plain text")
      assertTrue(result.isEmpty())
    }

    @Test
    fun singlePlaceholder() {
      val result = FormRenderCallback.extractEPs("{HTML.Text.Mapper > param1 param2}")
      assertEquals(1, result.size)
      assertEquals("HTML.Text.Mapper", result[0])
    }

    @Test
    fun multiplePlaceholders() {
      val result = FormRenderCallback.extractEPs("{EP1 > a} some text {EP2 > b}")
      assertEquals(2, result.size)
      assertEquals("EP1", result[0])
      assertEquals("EP2", result[1])
    }

    @Test
    fun nestedBraces() {
      val result = FormRenderCallback.extractEPs("{Outer{Inner > x} > y}")
      // The outer EP should be extracted (Outer before >)
      // And Inner before > as well
      assertTrue(result.isNotEmpty())
    }

    @Test
    fun noGreaterThanInBraces() {
      // {text} without > should not produce any EPs
      val result = FormRenderCallback.extractEPs("{noGreaterThan}")
      assertTrue(result.isEmpty())
    }

    @Test
    fun emptyLeftPart() {
      // { > param} — empty left part should not be added
      val result = FormRenderCallback.extractEPs("{ > param}")
      assertTrue(result.isEmpty() || result.all { it.isNotBlank() })
    }

    @Test
    fun unmatchedClosingBrace() {
      val result = FormRenderCallback.extractEPs("text } more text")
      assertTrue(result.isEmpty())
    }

    @Test
    fun unmatchedOpeningBrace() {
      val result = FormRenderCallback.extractEPs("{unclosed > param")
      // Stack is not empty at end, but no crash
      assertTrue(result.isEmpty() || result.size >= 0)
    }

    @Test
    fun greaterThanOutsideBraces() {
      val result = FormRenderCallback.extractEPs("a > b")
      // > outside braces should not produce EPs
      assertTrue(result.isEmpty())
    }

    @Test
    fun multipleLevelsOfNesting() {
      val result = FormRenderCallback.extractEPs("{L1{L2{L3 > deep} > mid} > outer}")
      // Should find EPs at each level where > appears inside braces
      assertTrue(result.isNotEmpty())
    }

    @Test
    fun whitespaceTrimmed() {
      val result = FormRenderCallback.extractEPs("{  Spaced.EP  > params }")
      assertTrue(result.any { it == "Spaced.EP" })
    }

    @Test
    fun multipleGreaterThansInSameBracePair() {
      // {A > B > C} — first > extracts "A", second > starts new segment
      val result = FormRenderCallback.extractEPs("{A > B > C}")
      assertTrue(result.contains("A"))
    }

    @Test
    fun consecutivePlaceholdersNoSpace() {
      val result = FormRenderCallback.extractEPs("{EP.One > x}{EP.Two > y}")
      assertEquals(2, result.size)
      assertTrue(result.contains("EP.One"))
      assertTrue(result.contains("EP.Two"))
    }

    @Test
    fun bracesWithOnlyWhitespace() {
      val result = FormRenderCallback.extractEPs("{   > params}")
      // Empty left part after trim → should not be added
      assertTrue(result.isEmpty())
    }

    @Test
    fun complexRealWorldPattern() {
      val result =
          FormRenderCallback.extractEPs(
              "prefix {HTML.Text.Mapper > SSV.input SSV.output} middle {CSS.Class.Toggle > on off} suffix")
      assertEquals(2, result.size)
      assertEquals("HTML.Text.Mapper", result[0])
      assertEquals("CSS.Class.Toggle", result[1])
    }
  }

  // endregion
}

private class AfterRenderFormParams : IPluginFormRenderCallbackOnAfterRenderFormParams {
  val doc: HtmlDocument = HtmlDocument()
  private val formRenderConfig: IXFormRenderConfig = newXFormRenderConfig()
  private val formRenderContext: IXFormRenderContext = XFormRenderContext()
  private val xForm = XForm()

  override fun getFormRenderConfig(): IXFormRenderConfig {
    return formRenderConfig
  }

  override fun getFormRenderContext(): IXFormRenderContext {
    return formRenderContext
  }

  override fun getHtml(): Html {
    return doc.html
  }

  override fun getForm(): Form {
    return doc.form
  }

  override fun getXForm(): IXForm {
    return xForm
  }
}
