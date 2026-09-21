package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [DesignedTextDetector] — the guard that forces the DETAILED `XSpan` template into the
 * pass-2 prompt when the request asks for a designed/interactive text or an illustration.
 *
 * Background: pass 1 receives only the condensed widget reference and pass 2 receives the detailed
 * `formcycle.widgets.<name>` sections ONLY for the widgets the model requested. The illustration
 * rules (worked example + forbidden compositions + camelCase/quote rules) live in the detailed
 * XSpan section, so a request like "…in schönem Design… Mach das Design auch interaktiv… animierte
 * SVG Illustration…" must force that section in.
 */
class DesignedTextDetectorTest {

  /** The prompt that produced the naive single-`<rect>` illustrations. */
  private val designedTextPrompt =
      "Füge einen Text in schönem Design an welcher die Vorteile einer KI zur Formulargenerierung " +
          "wiedergibt. Mach das Design auch interaktiv (auch das was bei hovern passiert was passt). " +
          "Noch im Text aber über der ersten Zeile soll eine animierte SVG Illustration sein die ein " +
          "Formular dass durch eine KI aufgewertet wird zeigt. Als Hinweis zu diesem Text soll " +
          "beschrieben werden warum die Vorteile auch tatsächliche Vorteile sind."

  @Test
  fun `the designed-text prompt with an animated svg illustration is detected`() {
    assertTrue(DesignedTextDetector.wantsDesignedTextOrIllustration(designedTextPrompt))
  }

  @Test
  fun `a plain field request is not detected`() {
    assertFalse(
        DesignedTextDetector.wantsDesignedTextOrIllustration(
            "Füge ein Eingabefeld für den Namen und eines für die E-Mail-Adresse hinzu."))
    assertFalse(
        DesignedTextDetector.wantsDesignedTextOrIllustration(
            "Add a required textfield for the postal code and a select for the country."))
  }

  @Test
  fun `english design and interaction keywords are detected`() {
    assertTrue(
        DesignedTextDetector.wantsDesignedTextOrIllustration(
            "write a nicely designed text about AI"))
    assertTrue(
        DesignedTextDetector.wantsDesignedTextOrIllustration(
            "make this block interactive with a hover effect"))
    assertTrue(
        DesignedTextDetector.wantsDesignedTextOrIllustration(
            "add an animated inline svg illustration above the first line"))
  }

  @Test
  fun `blank and null prompts are never detected`() {
    assertFalse(DesignedTextDetector.wantsDesignedTextOrIllustration(null))
    assertFalse(DesignedTextDetector.wantsDesignedTextOrIllustration(""))
    assertFalse(DesignedTextDetector.wantsDesignedTextOrIllustration("   "))
  }

  @Test
  fun `xspan is appended when the request needs the illustration rules and xspan was not requested`() {
    val widgets = listOf("XTextField", "XContainer")
    val result = DesignedTextDetector.withXSpan(widgets, designedTextPrompt)
    assertEquals(listOf("XTextField", "XContainer", "XSpan"), result)
  }

  @Test
  fun `an already requested xspan is never duplicated`() {
    val widgets = listOf("XSpan", "XTextField")
    assertEquals(widgets, DesignedTextDetector.withXSpan(widgets, designedTextPrompt))
    // The model may answer with a differently-cased / padded name.
    assertEquals(
        listOf(" xspan "), DesignedTextDetector.withXSpan(listOf(" xspan "), designedTextPrompt))
  }

  @Test
  fun `the widget list is left untouched when the request needs no designed text`() {
    val widgets = listOf("XTextField")
    assertEquals(
        widgets,
        DesignedTextDetector.withXSpan(widgets, "Füge ein Eingabefeld für den Namen hinzu."))
    assertEquals(emptyList<String>(), DesignedTextDetector.withXSpan(emptyList(), null))
  }
}
