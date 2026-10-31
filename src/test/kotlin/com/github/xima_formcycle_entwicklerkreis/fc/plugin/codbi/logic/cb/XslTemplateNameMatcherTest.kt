package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The user names a transformation template inside a sentence ("… und zuvor mit XXX transformiert
 * werden"), so the name reaches the build pass in prose spelling. The lookup must match the REAL
 * template list without guessing: one clear hit is accepted, ambiguity leaves the node on raw XML.
 */
class XslTemplateNameMatcherTest {

  @Test
  fun `normalize folds case, separators, umlauts and the extension`() {
    assertEquals("anschriftenreport", XslTemplateNameMatcher.normalize("Anschriften-Report"))
    assertEquals("anschriftenreport", XslTemplateNameMatcher.normalize("Anschriften_Report.xsl"))
    assertEquals("anschriftenreport", XslTemplateNameMatcher.normalize("  ANSCHRIFTEN REPORT "))
    // The XSL/XSLT extension is never part of the key, and the umlaut is folded.
    assertEquals("uebersicht", XslTemplateNameMatcher.normalize("Übersicht.XSLT"))
    assertEquals("uebersicht", XslTemplateNameMatcher.normalize("Uebersicht.xslt"))
  }

  @Test
  fun `an exact match ignores separators and casing`() {
    val result = XslTemplateNameMatcher.resolve("anschriften-report", listOf("Anschriften Report"))
    assertEquals("Anschriften Report", result.match?.name)
    assertTrue(result.match?.exact == true)
  }

  @Test
  fun `the name the user spelled differently still resolves`() {
    val available = listOf("Anschriften Report 2024", "Import_Vorlage", "Adressen_XSL")
    // The user wrote "Anschriften-Report" / "Import Vorlage" / "Adressen" in prose.
    assertEquals(
        "Anschriften Report 2024",
        XslTemplateNameMatcher.resolve("Anschriftenreport", available).match?.name)
    assertEquals(
        "Import_Vorlage", XslTemplateNameMatcher.resolve("Import Vorlage", available).match?.name)
    assertEquals("Adressen_XSL", XslTemplateNameMatcher.resolve("Adressen", available).match?.name)
  }

  @Test
  fun `a clear partial match is accepted and marked as not exact`() {
    val result = XslTemplateNameMatcher.resolve("Import_Vorlage2", listOf("Import_Vorlage2_Final"))
    assertEquals("Import_Vorlage2_Final", result.match?.name)
    assertFalse(result.match?.exact ?: true)
  }

  @Test
  fun `ambiguity is never guessed`() {
    val result =
        XslTemplateNameMatcher.resolve("Import", listOf("Import_Vorlage_A", "Import_Vorlage_B"))
    assertNull(result.match)
    assertEquals(listOf("Import_Vorlage_A", "Import_Vorlage_B"), result.candidates)
  }

  @Test
  fun `an unknown name reports no match and no candidates`() {
    val result = XslTemplateNameMatcher.resolve("VoelligAnders", listOf("Anschriften Report"))
    assertNull(result.match)
    assertTrue(result.candidates.isEmpty())
  }

  @Test
  fun `very short keys never match by containment`() {
    assertNull(XslTemplateNameMatcher.resolve("ab", listOf("Absender_Report")).match)
  }
}
