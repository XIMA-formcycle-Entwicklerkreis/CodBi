package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards that the AI — not a server-side heuristic — decides which field is an OpenPLZ.AC.SET
 * address part.
 *
 * Reported case: "Füge noch ein Eingabfeld ein in welchem jedes eingegebene Wort automatisch in ein
 * großgeschriebenes umgewandelt wird." — `HTML.Input.Trans.Capital` was applied correctly, but a
 * deterministic net then stamped `CodBi_OpenPLZ_AC_SET_Locality` onto that plain text field because
 * its label "Wort in Großbuchstaben" contains the substring `ort`. Guessing intent from field names
 * and labels cannot work across the languages and phrasings users write in, so the net was removed
 * entirely: deciding whether a request is about a postal address/locality is the model's job, and
 * the prompts must carry that decision.
 *
 * The three carriers are checked here: the pass-1 element catalog (the ONLY detail pass-1 sees),
 * the always-sent build instruction (pass-2) and the standard-configuration class reference.
 */
class OpenPlzClassDecisionTest {

  private fun resource(relative: String): String =
      OpenPlzClassDecisionTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the pass-1 catalog makes the address decision the model's own`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val openPlz = catalog.substringAfter("### OpenPLZ.AC.SET").substringBefore("\n### ")
    for (cls in
        listOf(
            "CodBi_OpenPLZ_AC_SET_PLZ",
            "CodBi_OpenPLZ_AC_SET_Locality",
            "CodBi_OpenPLZ_AC_SET_Street",
            "CodBi_OpenPLZ_AC_SET_BuildingNumber")) {
      assertTrue(openPlz.contains(cls), "the pass-1 OpenPLZ entry must name $cls")
    }
    assertTrue(
        openPlz.contains("decide by MEANING"),
        "the pass-1 OpenPLZ entry must state that the model decides by meaning")
    assertTrue(
        openPlz.contains("merely contains an address word"),
        "the pass-1 OpenPLZ entry must forbid the class on a field that only contains an address word")
    assertTrue(
        openPlz.contains("No server-side net does this for you"),
        "the pass-1 OpenPLZ entry must not rely on a deterministic server net")
  }

  @Test
  fun `the always-sent build instruction forbids the address-word heuristic and owns the creation`() {
    val build = resource("prompts/codbi-form-task-instruction.md")
    assertTrue(
        build.contains("ADDRESS / LOCALITY IS YOUR DECISION"),
        "the build instruction must state that the address decision is the model's")
    assertTrue(
        build.contains("merely CONTAINS an address word"),
        "the build instruction must forbid tagging a field that only contains an address word")
    assertTrue(
        build.contains("Wort in Großbuchstaben"),
        "the build instruction should name the reported capitalisation field as the counter-example")
    assertTrue(
        build.contains("CREATE them yourself in the address container"),
        "the build instruction must own the creation of missing street / house-number fields")
    assertTrue(
        build.contains("tfStrasse") && build.contains("tfHausnummer"),
        "the build instruction must name the fields to create")
    assertTrue(
        build.contains("the backend does NOT add or complete address groups"),
        "the build instruction must not assume a server net")
  }

  @Test
  fun `the standard-configuration reference states the ownership for the OpenPLZ classes`() {
    val configs = resource("prompts/codbi-standard-configurations.md")
    val section = configs.substringAfter("## OpenPLZ.AC.SET").substringBefore("\n## ")
    assertTrue(
        section.contains("WHICH field gets one of these classes is YOUR decision"),
        "the class reference must state that the model picks the address part")
    assertFalse(
        section.contains("is added automatically"),
        "the class reference must not promise an automatic server-side tagging")
  }
}
