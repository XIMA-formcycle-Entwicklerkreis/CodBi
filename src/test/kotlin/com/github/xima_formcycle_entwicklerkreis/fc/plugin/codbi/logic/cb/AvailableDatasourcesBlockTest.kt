package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The "AVAILABLE FORMCYCLE DATASOURCES" block is injected into the clarification prompt AND every
 * form pass. It must cover `DQ.Table.View`'s `data-cb-dataquery` — not only the XSelect
 * `datasource` property — so the model resolves the user's wording ("die Altstadtfest-Abfrage")
 * against the configured names and asks when nothing fits instead of carrying the wording over.
 */
class AvailableDatasourcesBlockTest {

  private val assistant = AICodBiAssistant()

  private fun block(names: List<String>): String? {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("buildAvailableDatasourcesBlock", List::class.java)
    method.isAccessible = true
    return method.invoke(assistant, names) as String?
  }

  @Test
  fun `the block names data-cb-dataquery as a datasource-bound parameter`() {
    val text =
        block(
            listOf(
                "INHALT.Antrag auf Zulassung zur Teilnahme am Ansbacher Altstadtfest 2027",
                "56_Staatsangehoerigkeiten"))

    assertNotNull(text)
    assertTrue(text!!.contains("data-cb-dataquery"), "the DQ attribute must be covered: $text")
    assertTrue(text.contains("DQ.Table.View"), "the functionality must be named: $text")
    assertTrue(
        text.contains("INHALT.Antrag auf Zulassung zur Teilnahme am Ansbacher Altstadtfest 2027"),
        "every configured name must be listed: $text")
  }

  @Test
  fun `the block forbids keeping an unlisted wording`() {
    val text = block(listOf("Test"))!!

    assertTrue(
        text.contains("NEVER keep an unlisted/misspelled wording"),
        "the model must not treat the user's wording as the technical name: $text")
    assertTrue(
        text.contains("If EXACTLY ONE listed name clearly fits"),
        "the ask-when-none-or-several rule must stay: $text")
  }

  @Test
  fun `an empty availability list yields no block`() {
    assertNull(block(emptyList()))
    assertNull(block(listOf(" ", "")))
  }

  @Test
  fun `the block still covers the XSelect datasource property`() {
    val text = block(listOf("Test"))!!

    assertTrue(text.contains("XSelect"), "the select rule must not be lost: $text")
    assertTrue(text.contains("`datasource`"), "the select property must stay documented: $text")
    assertFalse(text.contains("\u0000"))
  }
}
