package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the "digits → words in the REQUESTED language" documentation.
 *
 * Reported case: "Füge ein Eingabfeld ein, dass eingegebene Ziffern automatisch in ihre
 * entsprechenden spanischen Wörter umwandelt." — the assistant applied the standard class
 * `CodBi_TRANS_NTW`, which hard-codes the GERMAN words ("Null" … "Neun"), so a Spanish request
 * would have produced German output. The class is a German-only shortcut; the capability behind it
 * is `HTML.Input.Trans.NTW` with its LANGUAGE-SPECIFIC `NumberWords` parameter (ten words, index =
 * digit) — and it is NOT `HTML.Input.Cleave`, which has no `NumberWords` parameter at all.
 *
 * Every reference the assistant reads must say that, so the functionality is applied with the words
 * of the language the user asked for:
 * - the pass-1 element catalog (the ONLY detail pass-1 sees),
 * - the pass-2 functionality details,
 * - the standard-configuration class reference,
 * - the compact API reference (the class list + the parameter list).
 */
class NumberWordsLanguageRuleTest {

  private fun resource(relative: String): String =
      NumberWordsLanguageRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the pass-1 catalog makes the digit-to-word functionality language-aware`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val ntw = catalog.substringAfter("### HTML.Input.Trans.NTW").substringBefore("\n### ")
    assertTrue(
        ntw.contains("`NumberWords`"), "the pass-1 NTW entry must name its NumberWords parameter")
    assertTrue(
        ntw.contains("Cero,Uno,Dos"),
        "the pass-1 NTW entry must show a NON-German word list (the reported Spanish case)")
    assertTrue(
        ntw.contains("CodBi_TRANS_NTW") && ntw.contains("GERMAN"),
        "the pass-1 NTW entry must warn that the standard class only knows German words")
    assertTrue(
        ntw.contains("NOT HTML.Input.Cleave"),
        "the pass-1 NTW entry must forbid using Cleave for digit-to-word")
    val financial = catalog.substringAfter("### Financial").substringBefore("\n### ")
    assertTrue(
        financial.contains("CodBi_TRANS_NTW") && financial.contains("GERMAN"),
        "the pass-1 Financial entry must state that CodBi_TRANS_NTW is German-only")
  }

  @Test
  fun `the pass-2 details document the exact NumberWords wiring`() {
    val details = resource("prompts/codbi-functionalities.md")
    val ntw = details.substringAfter("## HTML.Input.Trans.NTW").substringBefore("\n## ")
    assertTrue(ntw.contains("data-cb-NumberWords"), "the details must name data-cb-NumberWords")
    assertTrue(
        ntw.contains("index 0 is the word for \"0\""),
        "the details must explain that the list index is the digit")
    assertTrue(
        ntw.contains("Cero,Uno,Dos,Tres,Cuatro,Cinco,Seis,Siete,Ocho,Nueve"),
        "the details must carry the Spanish word list of the reported case")
    assertTrue(
        ntw.contains("do NOT use HTML.Input.Cleave"),
        "the details must forbid applying Cleave for digit-to-word")
    assertTrue(
        ntw.contains("hard-codes the GERMAN words"),
        "the details must explain why the CodBi_TRANS_NTW class is unusable for other languages")
  }

  @Test
  fun `the standard-configuration reference marks CodBi_TRANS_NTW as German-only`() {
    val configs = resource("prompts/codbi-standard-configurations.md")
    val cls = configs.substringAfter("### CodBi_TRANS_NTW").substringBefore("\n### ")
    assertTrue(cls.contains("ONLY in GERMAN"), "the class doc must restrict it to German")
    assertTrue(
        cls.contains("HTML.Input.Trans.NTW") && cls.contains("data-cb-NumberWords"),
        "the class doc must point to the functionality + its NumberWords parameter")
  }

  @Test
  fun `the compact API reference states the language and rejects Cleave`() {
    val api = resource("codbi-core-api-compact.md")
    val ntw =
        api.substringAfter("- HTML.Input.Trans.NTW").substringBefore("\n- HTML.Input.Trans.RegEx")
    assertTrue(ntw.contains("NumberWords"), "the API reference must list NumberWords")
    assertTrue(
        ntw.contains("LANGUAGE-SPECIFIC"),
        "the API reference must call the words language-specific")
    assertTrue(ntw.contains("Cero,Uno,Dos"), "the API reference must show a non-German list")
    assertTrue(
        ntw.contains("NOT Cleave"),
        "the API reference must state that Cleave is not the digit-to-word functionality")
    val financial = api.substringAfter("- Financial").substringBefore("\n- ")
    assertTrue(
        financial.contains("ONLY in GERMAN"),
        "the class list must mark CodBi_TRANS_NTW as German-only")
    assertTrue(
        financial.contains("HTML.Input.Trans.NTW"),
        "the class list must point to the functionality for other languages")
  }
}
