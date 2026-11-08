package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported: "Füge ein Eingabefeld für die email-adresse von mitarbeitern aus dem LDAP ein" — the
 * assistant did not apply the CodBi `LDAP.Autocomplete` functionality, although an input field for
 * an LDAP attribute can only be built that way (with or without the word "autocomplete" in the
 * request).
 *
 * The user also corrected an assumption: Formcycle does **not** let an element bind an LDAP source,
 * so there is no LDAP source list to offer and no "which LDAP source?" question to ask. The prompts
 * therefore teach the wiring AND the absence of a source.
 */
class LdapAutocompleteRuleTest {

  private fun resource(path: String): String =
      LdapAutocompleteRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(path)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("resource $path missing")

  private fun prompt(name: String): String =
      resource("com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")

  private fun catalog(): String =
      resource(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-elements-compact.md")
          .replace("\r\n", "\n")

  @Test
  fun `the pass-1 entry makes an LDAP attribute field a change without the word autocomplete`() {
    val entry = catalog().substringAfter("### LDAP.Autocomplete\n").substringBefore("### ")
    assertTrue(
        entry.contains("also when the request never says"),
        "the entry must apply without the word 'autocomplete': $entry")
    assertTrue(
        entry.contains("Eingabefeld für die E-Mail-Adresse von Mitarbeitern aus dem LDAP"),
        "the reported request must be the example: $entry")
    assertTrue(
        entry.contains("There is NO LDAP source to select"),
        "the entry must state that no LDAP source exists to pick: $entry")
  }

  @Test
  fun `the multi-field variant is taught as the container functionality`() {
    val entry = catalog().substringAfter("### LDAP.Autocomplete.Set\n").substringBefore("### ")
    assertTrue(entry.contains("SEVERAL fields"), "the Set variant must be described: $entry")
    assertTrue(entry.contains("CodBi_LDAP_AC_*"), "the member classes must be named: $entry")
    assertTrue(
        entry.contains("There is NO LDAP source to select"),
        "the Set variant must also forbid a source question: $entry")
  }

  @Test
  fun `the pass-2 reference documents the attribute property and the empty URL`() {
    val api =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md")
    assertTrue(
        api.contains("data-cb-func=\"LDAP.Autocomplete\" + data-cb-property=\"mail\""),
        "the reference must show the real wiring for an e-mail field")
    assertTrue(
        api.contains("the NAME OF THE LDAP ATTRIBUTE"),
        "Property must be defined as the LDAP attribute, not a form field name")
    assertTrue(
        api.contains("Formcycle does NOT let a form element bind an LDAP source"),
        "the reference must state that no source can be bound")
    assertFalse(
        api.contains("The URL of the Formcycle predefined LDAP-Query to use."),
        "the old wording that invites binding a query must be gone")
  }

  @Test
  fun `every build prompt carries the LDAP attribute rule`() {
    listOf(
            "codbi-form-task-instruction.md",
            "codbi-general.decision.md",
            "codbi-general-rethink.md",
            "codbi-functionalities.md",
            "codbi-general.md")
        .forEach { name ->
          val text = prompt(name)
          assertTrue(text.contains("LDAP.Autocomplete"), "$name must teach the LDAP wiring")
          assertTrue(
              text.contains("E-Mail-Adresse von Mitarbeitern aus dem LDAP"),
              "$name must carry the reported example")
          assertTrue(
              text.contains("LDAP source"),
              "$name must state that there is no LDAP source to choose")
        }
  }

  @Test
  fun `the clarification round never asks for an LDAP source`() {
    val clarify = prompt("codbi-clarification.md")
    assertTrue(
        clarify.contains("LDAP / ACTIVE-DIRECTORY ATTRIBUTE (highest priority)"),
        "the clarify prompt must carry the rule")
    assertTrue(
        clarify.contains("never offer LDAP sources"), "offering LDAP sources must be forbidden")
    assertTrue(
        clarify.contains("Ask ONLY for the LDAP ATTRIBUTE itself"),
        "the only legitimate question is the missing attribute")
    assertTrue(
        clarify.contains("Formcycle does NOT allow binding an LDAP source"),
        "the reason must be stated so the rule is not re-derived differently")
  }
}
