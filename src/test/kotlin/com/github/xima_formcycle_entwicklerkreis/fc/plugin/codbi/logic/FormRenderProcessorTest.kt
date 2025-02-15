package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiFormResourcesPlugin
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.testDestroy
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.testInit
import de.xima.fc.common.dom.Gagawa.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/** Tests for [FormRenderProcessor]. */
class FormRenderProcessorTest {
  private val plugin = CodbiFormResourcesPlugin()

  @Test
  fun insertFormResourcePluginScript_appendsInlineToBodyWhenInlineRequested() {
    val doc = HtmlDocument()
    val renderConfig = newXFormRenderConfig()
    val processor = FormRenderProcessor(renderConfig, doc.html, doc.form)

    renderConfig.isForceInline = true
    processor.insertFormResourcePluginScript("codbi", "codbi.js")

    val script = byTagName(doc.form, "script")
    assertEquals("codbi", attr(script, "id"))
    assertEquals("codbi", attr(script, "name"))
    assertTrue(text(script).length > 100)
  }

  @Test
  fun insertFormResourcePluginScript_appendsInlineToFormWhenInlineRequestedAndOnlyFormRendered() {
    val doc = HtmlDocument()
    val renderConfig = newXFormRenderConfig()
    val processor = FormRenderProcessor(renderConfig, doc.html, doc.form)

    renderConfig.isForceInline = true
    renderConfig.isFormOnly = true
    processor.insertFormResourcePluginScript("codbi", "codbi.js")

    val script = byTagName(doc.form, "script")
    assertEquals("codbi", attr(script, "id"))
    assertEquals("codbi", attr(script, "name"))
    assertTrue(text(script).length > 100)
  }

  @Test
  fun insertFormResourcePluginScript_appendsExternalToFormWhenRenderingEntireHtmlPage() {
    val doc = HtmlDocument()
    val renderConfig = newXFormRenderConfig()
    val processor = FormRenderProcessor(renderConfig, doc.html, doc.form)

    processor.insertFormResourcePluginScript("my-script", "my-script.js")

    val script = byTagName(doc.form, "script")
    assertEquals("my-script", attr(script, "id"))
    assertEquals("my-script", attr(script, "name"))
    assertEquals(
        "/xima-formcylce/ressource/-1/-1/plugin/form-resources/f140090d-d471-4650-8fef-8067e1e1dcdd/com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources/my-script.js",
        attr(script, "src"))
  }

  @Test
  fun insertFormResourcePluginScript_appendsExternalToFormWhenOnlyFormRendered() {
    val doc = HtmlDocument()
    val renderConfig = newXFormRenderConfig()
    val processor = FormRenderProcessor(renderConfig, doc.html, doc.form)

    renderConfig.isFormOnly = true
    processor.insertFormResourcePluginScript("my-script", "my-script.js")

    val script = byTagName(doc.form, "script")
    assertEquals("my-script", attr(script, "id"))
    assertEquals("my-script", attr(script, "name"))
    assertEquals(
        "/xima-formcylce/ressource/-1/-1/plugin/form-resources/f140090d-d471-4650-8fef-8067e1e1dcdd/com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources/my-script.js",
        attr(script, "src"))
  }

  @Test
  fun insertFormResourcePluginStyle_appendsInlineToHeadWhenInlineRequested() {
    val doc = HtmlDocument()
    val renderConfig = newXFormRenderConfig()
    val processor = FormRenderProcessor(renderConfig, doc.html, doc.form)

    renderConfig.isForceInline = true
    processor.insertFormResourcePluginStyle("codbi", "codbi.css")

    val style = byTagName(doc.head, "style")
    assertEquals("codbi", attr(style, "id"))
    assertEquals("codbi", attr(style, "name"))
    assertTrue(text(style).length > 100)
  }

  @Test
  fun insertFormResourcePluginStyle_appendsInlineToFormWhenInlineRequestedAndOnlyFormRendered() {
    val doc = HtmlDocument()
    val renderConfig = newXFormRenderConfig()
    val processor = FormRenderProcessor(renderConfig, doc.html, doc.form)

    renderConfig.isForceInline = true
    renderConfig.isFormOnly = true
    processor.insertFormResourcePluginStyle("codbi", "codbi.css")

    val style = byTagName(doc.form, "style")
    assertEquals("codbi", attr(style, "id"))
    assertEquals("codbi", attr(style, "name"))
    assertTrue(text(style).length > 100)
  }

  @Test
  fun insertFormResourcePluginStyle_appendsExternalToHeadWhenRenderingEntireHtmlPage() {
    val doc = HtmlDocument()
    val renderConfig = newXFormRenderConfig()
    val processor = FormRenderProcessor(renderConfig, doc.html, doc.form)

    processor.insertFormResourcePluginStyle("my-style", "my-style.css")

    val link = byTagName(doc.head, "link")
    assertEquals("my-style", attr(link, "id"))
    assertEquals("my-style", attr(link, "name"))
    assertEquals(
        "/xima-formcylce/ressource/-1/-1/plugin/form-resources/f140090d-d471-4650-8fef-8067e1e1dcdd/com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources/my-style.css",
        attr(link, "href"))
  }

  @Test
  fun insertFormResourcePluginStyle_appendsExternalToBodyWhenOnlyFormRendered() {
    val doc = HtmlDocument()
    val renderConfig = newXFormRenderConfig()
    val processor = FormRenderProcessor(renderConfig, doc.html, doc.form)

    renderConfig.isFormOnly = true
    processor.insertFormResourcePluginStyle("my-style", "my-style.css")

    val link = byTagName(doc.body, "link")
    assertEquals("my-style", attr(link, "id"))
    assertEquals("my-style", attr(link, "name"))
    assertEquals(
        "/xima-formcylce/ressource/-1/-1/plugin/form-resources/f140090d-d471-4650-8fef-8067e1e1dcdd/com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources/my-style.css",
        attr(link, "href"))
  }

  @BeforeEach
  fun setUp() {
    plugin.testInit()
  }

  @AfterEach
  fun tearDown() {
    plugin.testDestroy()
  }
}
