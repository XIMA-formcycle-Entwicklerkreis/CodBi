package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Follow-up on `LDAP.Autocomplete`: the functionality was applied but `data-cb-URL` was missing.
 *
 * The CodBi LDAP runtime uses the installation-wide url (`LDAP_URL` / `LDAP_URL_BACKEND`, exposed
 * as `window.codbiSettings.LDAP.URL`) when the parameter is empty — so the parameter is OPTIONAL
 * when such a url exists, and MANDATORY (a value only the user can supply) when it does not. The
 * assistant cannot know which case applies, so [`AICodBiAssistant.buildLdapConfigBlock()`] states
 * it in every prompt and the clarify round asks for the url only in the second case.
 */
class LdapUrlConfigurationTest {

  private val assistant = AICodBiAssistant()

  @BeforeEach
  fun reset() {
    AI.ldapUrl = null
    AI.ldapUrlBackend = null
  }

  @AfterEach
  fun cleanup() {
    AI.ldapUrl = null
    AI.ldapUrlBackend = null
  }

  private fun resource(path: String): String =
      LdapUrlConfigurationTest::class
          .java
          .classLoader
          .getResourceAsStream(path)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("resource $path missing")

  private fun prompt(name: String): String =
      resource("com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")

  @Test
  fun `a configured url means the parameter is omitted and never asked for`() {
    AI.ldapUrl = "https://www.example.de/form/LDAP?query=1"

    val block = assistant.buildLdapConfigBlock()
    assertTrue(
        block.contains("an LDAP request url IS configured for this installation"),
        "the block must state that a url exists: $block")
    assertTrue(
        block.contains("data-cb-URL` MUST BE OMITTED"),
        "the parameter must be omitted when a url is configured")
    assertTrue(
        block.contains("MUST NEVER be asked for an LDAP url"),
        "asking must be forbidden when a url is configured")
    assertFalse(
        block.contains("ASK the user for that url"),
        "the url must not be asked for when it is configured")
  }

  @Test
  fun `a missing url makes the parameter required and the url a user value`() {
    val block = assistant.buildLdapConfigBlock()
    assertTrue(
        block.contains("NO LDAP request url is configured for this installation"),
        "the block must state that no url exists: $block")
    assertTrue(
        block.contains("`data-cb-URL` is a REQUIRED parameter"),
        "without a url the parameter is required")
    assertTrue(
        block.contains("ASK the user for that url"),
        "the clarify round must ask for the url instead of building a dead field")
    assertTrue(block.contains("NEVER invent or guess a url"), "an invented url is never acceptable")
  }

  @Test
  fun `either configured url counts`() {
    assertFalse(AI.isLdapUrlConfigured(), "nothing configured")
    AI.ldapUrlBackend = "https://backend.example.de/form/LDAP?query=1"
    assertTrue(AI.isLdapUrlConfigured(), "the backend variant alone is enough")
    AI.ldapUrlBackend = "   "
    assertFalse(AI.isLdapUrlConfigured(), "blank values do not count")
    AI.ldapUrl = "https://www.example.de/form/LDAP?query=1"
    assertTrue(AI.isLdapUrlConfigured())
  }

  @Test
  fun `every prompt decides the url from the LDAP CONFIGURATION block`() {
    listOf(
            "codbi-form-task-instruction.md",
            "codbi-general.decision.md",
            "codbi-general-rethink.md",
            "codbi-general.md",
            "codbi-functionalities.md")
        .forEach { name ->
          val text = prompt(name)
          assertTrue(
              text.contains("LDAP CONFIGURATION"),
              "$name must reference the injected LDAP CONFIGURATION block")
          assertTrue(text.contains("data-cb-URL"), "$name must name the URL parameter")
          assertTrue(
              text.contains("OMIT data-cb-URL") || text.contains("leave data-cb-URL EMPTY"),
              "$name must tell the AI to omit the parameter when a url is configured")
        }
  }

  @Test
  fun `the catalog and API reference carry the same rule`() {
    val catalog =
        resource(
                "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-elements-compact.md")
            .replace("\r\n", "\n")
    val entry = catalog.substringAfter("### LDAP.Autocomplete\n").substringBefore("### ")
    assertTrue(
        entry.contains("LDAP CONFIGURATION"),
        "the pass-1 entry must defer the url decision to the block: $entry")
    assertTrue(
        entry.contains("ask for it"),
        "the pass-1 entry must allow asking only when none is configured")

    val api =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md")
    assertTrue(
        api.contains("DECIDED BY THE INSTALLATION (read the \"LDAP CONFIGURATION\" block)"),
        "the pass-2 reference must derive the url rule from the block")
    assertTrue(
        api.contains("is REQUIRED and its value belongs to the user"),
        "the pass-2 reference must state the mandatory case")
  }

  @Test
  fun `the clarification round asks for the url only when none is configured`() {
    val clarify = prompt("codbi-clarification.md")
    assertTrue(
        clarify.contains("the LDAP URL is governed by the injected \"LDAP CONFIGURATION\" block"),
        "the clarify rule must delegate to the block")
    assertTrue(
        clarify.contains("ask for that URL ONLY when the block states that NO url is configured"),
        "asking is allowed only in the no-url case")
    assertTrue(
        clarify.contains("when a url IS configured, never ask"),
        "the configured case must stay question-free")
  }
}
