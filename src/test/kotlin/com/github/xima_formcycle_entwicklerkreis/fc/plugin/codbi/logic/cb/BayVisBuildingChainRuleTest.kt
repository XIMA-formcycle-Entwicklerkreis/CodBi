package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported prompt:
 *
 * `Gib in der Konsole die Adresse des Gebäudes in dem sich das Amt 44 befindet aus der BayVIS aus.`
 *
 * The assistant emitted `{ BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; {
 * BayVIS.Behoerden.Gebaeude.ID > 44 } } }` instead of the two-slot chain `{
 * BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } ; { I > 0 ; {
 * BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } } } }`.
 *
 * Three misunderstandings produced it, all of them taught-then-copied from the prompts:
 * 1. "Amt 44" is a DESIGNATION that happens to end in a number; nothing said the digits are part of
 *    the NAME, so `44` was used as an id.
 * 2. `BayVIS.Behoerden.Gebaeude.ID` was described as a "Details EP" and, in the rethink decision
 *    core, even as "the building address placeholder" — so its result was used as the address /
 *    authority id instead of only as the BUILDING-id slot of `Details.Gebaeude`.
 * 3. The MANDATORY two-slot shape of `Details.Gebaeude` (authority id `;` building id) was not
 *    stated next to the EP that needs it, so the call collapsed to one parameter.
 *
 * The assertions keep that teaching (and its language-agnostic wording) in place.
 */
class BayVisBuildingChainRuleTest {

  private fun prompt(name: String): String =
      BayVisBuildingChainRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun resource(relative: String): String =
      BayVisBuildingChainRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  private fun String.section(heading: String): String =
      substringAfter("### $heading\n").substringBefore("\n### ")

  @Test
  fun `a designation with digits is taught as a name, never as an id`() {
    val eps = prompt("codbi-element-placeholders.md")
    assertTrue(
        eps.contains("A DESIGNATION WITH DIGITS IS STILL A NAME, NEVER AN ID"),
        "the EP reference must state that a designation's digits are part of the name")
    assertTrue(
        eps.contains("\"Amt 44\""),
        "the reported designation must appear as the example in ANY-language wording")
    assertTrue(
        eps.contains("NEVER \"shorten\" `{ BayVIS.Behoerden.ID > Amt 44 }` to the literal `44`"),
        "the exact mis-shortening must be forbidden")
    val general = prompt("codbi-general.md")
    assertTrue(
        general.contains("A DESIGNATION THAT CONTAINS DIGITS IS STILL A NAME"),
        "the decision core must carry the same rule")
    assertTrue(
        general.contains("{ BayVIS.Behoerden.Gebaeude.ID > 44 }"),
        "the decision core must show the failing id-shortening")
  }

  @Test
  fun `parameter order is fixed by the EP, not by the sentence`() {
    val swapped =
        "{ BayVIS.Behoerden.Details > email ; { BayVIS.Behoerden.ID > Amt für Digitales } }"
    val eps = prompt("codbi-element-placeholders.md")
    assertTrue(
        eps.contains("PARAMETER ORDER IS FIXED BY THE EP"),
        "the EP reference must state that the declared slot order wins over the sentence order")
    assertTrue(eps.contains(swapped), "the reported swapped EP must be documented as WRONG")
    assertTrue(
        eps.contains("the property sits in the id slot"),
        "the consequence of the swap must be named")
    assertTrue(
        eps.contains("ORDER IS FIXED — the authority ID is ALWAYS slot 1"),
        "the Details section must repeat the fixed order")
    val general = prompt("codbi-general.md")
    assertTrue(
        general.contains(
            "PARAMETER ORDER IS FIXED BY THE EP, NEVER BY THE WORD ORDER OF THE REQUEST"),
        "the decision core must carry the fixed-order rule")
    assertTrue(general.contains(swapped), "the decision core must show the swapped EP")
    val decision = prompt("codbi-general.decision.md")
    assertTrue(
        decision.contains("PARAMETER ORDER IS FIXED BY THE EP"),
        "the decision core (compact) must carry the fixed-order rule")
    val rethink = prompt("codbi-general-rethink.md")
    assertTrue(
        rethink.contains("PARAMETER ORDER IS FIXED BY THE EP"),
        "the rethink core must carry the fixed-order rule")
    val api = resource("codbi-core-api-compact.md")
    val apiDetails =
        api.substringAfter("- BayVIS.Behoerden.Details:")
            .substringBefore("- BayVIS.Behoerden.Gebaeude.ID:")
    assertTrue(
        apiDetails.contains("ORDER IS FIXED"), "the API reference must state the fixed order")
    assertTrue(apiDetails.contains(swapped), "the API reference must keep the reported swap")
    val catalog = resource("codbi-core-elements-compact.md")
    assertTrue(
        catalog.section("BayVIS.Behoerden.Details").contains("the ORDER IS FIXED"),
        "the pass-1 entry must state the fixed order")
  }

  @Test
  fun `one named authority's field never comes from the directory EP`() {
    val eps = prompt("codbi-element-placeholders.md")
    assertTrue(
        eps.contains(
            "ONE NAMED AUTHORITY'S FIELD COMES FROM THE DETAILS EP, NEVER FROM THE DIRECTORY EP"),
        "the EP reference must state the directory-vs-details rule")
    assertTrue(
        eps.contains("Reported failure — WRONG: { BayVIS.Behoerden > email }"),
        "the reported wrong EP must be documented")
    assertTrue(
        eps.contains(
            "CORRECT: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; email }"),
        "the correct single-field chain must be documented")
    assertTrue(
        eps.contains("Naming the SYSTEM (\"aus dem Bayernportal\""),
        "naming the system must not select the directory EP")
    val general = prompt("codbi-general.md")
    assertTrue(
        general.contains(
            "A DIRECTORY EP RETURNS A WHOLE COLUMN, NEVER THE VALUE OF ONE NAMED AUTHORITY"),
        "the decision core must carry the same rule")
    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(
        task.contains("NEVER { BayVIS.Behoerden > email }"),
        "the pass-2 mapping list must forbid the directory column for a named authority")
    val catalog = resource("codbi-core-elements-compact.md")
    assertTrue(
        catalog.section("BayVIS.Behoerden").contains("can never select ONE named authority"),
        "the pass-1 entry must state that the directory EP cannot select one authority")
    val api = resource("codbi-core-api-compact.md")
    val apiDirectory = api.substringAfter("- BayVIS.Behoerden:").substringBefore("- Data.CSV:")
    assertTrue(
        apiDirectory.contains("WRONG (reported failure): `{ BayVIS.Behoerden > email }`"),
        "the API reference must keep the reported failure")
  }

  @Test
  fun `the building EP takes two non-interchangeable id slots`() {
    val section =
        prompt("codbi-element-placeholders.md").section("BayVIS.Behoerden.Details.Gebaeude")
    assertTrue(
        section.contains("THE TWO SLOTS ARE BOTH MANDATORY AND NOT INTERCHANGEABLE"),
        "the mandatory two-slot shape must be stated on the consuming EP")
    assertTrue(
        section.contains("slot 1 must come from `BayVIS.Behoerden.ID`"),
        "slot 1 must be named as the authority-id slot")
    assertTrue(
        section.contains("slot 2 must come from `BayVIS.Behoerden.Gebaeude.ID`"),
        "slot 2 must be named as the building-id slot")
    assertTrue(
        section.contains("the wrapper belongs INSIDE a slot"),
        "each slot needs its own I wrapper — never one around the whole call")
  }

  @Test
  fun `the reported failure and the correct chain are both spelled out`() {
    val eps = prompt("codbi-element-placeholders.md")
    assertTrue(
        eps.contains(
            "Reported failure — WRONG: { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > 44 } } }"),
        "the reported wrong EP must be documented verbatim")
    assertTrue(
        eps.contains(
            "CORRECT: { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } } } }"),
        "the correct two-slot chain must be documented verbatim")
  }

  @Test
  fun `the building-id EP is never an address and never an authority id`() {
    val section = prompt("codbi-element-placeholders.md").section("BayVIS.Behoerden.Gebaeude.ID")
    assertTrue(
        section.contains(
            "ONLY EVER FILL THE **SECOND** PARAMETER OF BayVIS.Behoerden.Details.Gebaeude"),
        "the EP reference must limit Gebaeude.ID to the second parameter")
    assertTrue(
        section.contains("it does NOT accept a designation/name"),
        "Gebaeude.ID must not be fed a designation")
    val rethink = prompt("codbi-general-rethink.md")
    assertFalse(
        rethink.contains(
            "the building address placeholder is { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > ... } }"),
        "the old shorthand that made Gebaeude.ID the address must be gone")
    assertTrue(
        rethink.contains("an address placeholder is NOT BayVIS.Behoerden.Gebaeude.ID"),
        "the rethink core must correct that shorthand explicitly")
  }

  @Test
  fun `the pass-1 catalog and the API reference carry the corrected semantics`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val gebId = catalog.section("BayVIS.Behoerden.Gebaeude.ID")
    assertTrue(
        gebId.contains("NUMERIC AUTHORITY ID"),
        "pass-1 must state that Gebaeude.ID consumes the NUMERIC AUTHORITY ID")
    assertTrue(
        gebId.contains("never accepts a designation"),
        "pass-1 must state that Gebaeude.ID rejects a designation")
    val details = catalog.section("BayVIS.Behoerden.Details.Gebaeude")
    assertTrue(
        details.contains("requires TWO parameters"),
        "pass-1 must state the two mandatory parameters of Details.Gebaeude")

    val api = resource("codbi-core-api-compact.md")
    val apiGebId =
        api.substringAfter("- BayVIS.Behoerden.Gebaeude.ID:")
            .substringBefore("- BayVIS.Behoerden.ID:")
    assertTrue(
        apiGebId.contains("NUMERIC AUTHORITY id"),
        "the API reference must state the numeric authority id input")
    assertTrue(
        apiGebId.contains("use it ONLY for the 2nd parameter of BayVIS.Behoerden.Details.Gebaeude"),
        "the API reference must limit Gebaeude.ID to the 2nd parameter")
    val apiDetails =
        api.substringAfter("- BayVIS.Behoerden.Details.Gebaeude:")
            .substringBefore("- BayVIS.Behoerden.Details:")
    assertTrue(
        apiDetails.contains(
            "a call with ONE parameter, or with a building id in the authority slot, is INVALID"),
        "the API reference must reject the one-slot call explicitly")
    assertTrue(
        apiDetails.contains("WRONG (reported failure)"),
        "the API reference must keep the reported failure as a counter-example")
  }

  @Test
  fun `the field-creation map carries the address chain`() {
    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(
        task.contains("'Adresse des Gebäudes, in dem Amt X sitzt'"),
        "the pass-2 mapping list must carry the reported address request")
    assertTrue(
        task.contains("the TWO-SLOT building chain, NEVER the building-id EP alone"),
        "the mapping must exclude the building-id EP as a standalone address value")
    assertTrue(
        task.contains("digits included (\"Amt 44\")"),
        "the mapping must keep the designation-vs-id distinction")
  }

  @Test
  fun `the decision cores state the corrected chain`() {
    val decision = prompt("codbi-general.decision.md")
    assertTrue(
        decision.contains("AUTHORITY DESIGNATION vs ID + THE BUILDING CHAIN"),
        "the decision core must carry the designation/id + two-slot rule")
    assertTrue(
        decision.contains("A ONE-slot call, or a building id in the authority slot, is INVALID"),
        "the decision core must reject the one-slot call")
    val rethink = prompt("codbi-general-rethink.md")
    assertTrue(
        rethink.contains("BUILDING / GEBÄUDE ADDRESS — EXACT CHAIN"),
        "the rethink core must carry the exact building chain")
    assertTrue(
        rethink.contains("BOTH resolved from the SAME designation"),
        "the rethink core must state that both slots derive from the same designation")
  }
}
