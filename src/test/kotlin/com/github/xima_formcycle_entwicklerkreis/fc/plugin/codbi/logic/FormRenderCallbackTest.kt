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
import org.junit.jupiter.api.Test

/** Tests for [FormRenderCallback]. */
class FormRenderCallbackTest {
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
