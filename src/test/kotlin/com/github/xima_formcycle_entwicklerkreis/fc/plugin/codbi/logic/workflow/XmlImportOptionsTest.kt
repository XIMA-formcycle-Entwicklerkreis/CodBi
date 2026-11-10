package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class XmlImportOptionsTest {

  // Entities are built by concatenation on purpose: this test must contain the literal sequences
  // `&nbsp;`, `&` and `<` as INPUT, not as (unescaped) markup.
  private val nbsp = "&" + "nbsp;"
  private val amp = "&" + "amp;"
  private val lt = "&" + "lt;"
  private val gt = "&" + "gt;"

  @Test
  fun `strips element label markup from option labels`() {
    // FORMCYCLE element labels are rich text; a <select><option> must not show the markup.
    assertEquals("Vorname", XmlImportOptions.plainText("<p>Vorname</p>"))
    assertEquals("", XmlImportOptions.plainText("<p></p>"))
    assertEquals("", XmlImportOptions.plainText("<p>   </p>"))
    assertEquals(
        "Name des Antragstellers",
        XmlImportOptions.plainText("<p>Name <strong>des</strong>${nbsp}Antragstellers</p>"))
    assertEquals("A & B", XmlImportOptions.plainText("A ${amp} B"))
    assertEquals("<wert>", XmlImportOptions.plainText("${lt}wert${gt}"))
    assertEquals("Zeile", XmlImportOptions.plainText("<div>\n  Zeile\n</div>"))
  }

  @Test
  fun `only value-carrying widgets are offered as import targets`() {
    // Value holders: offered.
    listOf("XTextField", "XTextArea", "XCheckbox", "XSelect", "XAppointment", "XDate").forEach {
      assertTrue(XmlImportOptions.isFillable(it), it)
    }

    // Buttons/links, uploads, containers, pages and static content: never offered.
    listOf(
            "XButton",
            "XActionButton",
            "XSubmitButton",
            "XLinkButton",
            "XUpload",
            "XFileUpload",
            "XUploadArea",
            "XPage",
            "XFieldSet",
            "XContainer",
            "XContainerInvisible",
            "XHeader",
            "XFooter",
            "XHtml",
            "XImage",
            "XSpacer",
            "XLine",
            "XAnchor",
            "XNavigationBar",
            "XCaptcha",
            "")
        .forEach { assertFalse(XmlImportOptions.isFillable(it), it) }
  }

  @Test
  fun `plain technical names stay unchanged`() {
    assertEquals("tfName", XmlImportOptions.plainText("tfName"))
    assertEquals(
        "11111111-2222-3333-4444-555555555555",
        XmlImportOptions.plainText("11111111-2222-3333-4444-555555555555"))
  }
}
