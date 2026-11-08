package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the "one more" EXCEPTION of the REUSE-INSTEAD-OF-DUPLICATING rule.
 *
 * Reported case: the form already had a date field (blocking two dates) and the follow-up request
 * "Füge noch ein Eingabfeld für ein Datum … ein in welches man den 11.12.2026 10.12.2026 nicht
 * eingeben kann" did NOT create a second date field — the assistant MODIFIED the existing one (and
 * even changed its label). Cause: the reuse rule was absolute ("never add a second one") in every
 * build prompt, so an explicit request for an ADDITIONAL element had no way to win.
 *
 * The exception must therefore live in every prompt that carries the reuse rule, and it must state
 * the two things that make it safe: the request decides BY MEANING (an explicit "add another"), and
 * the existing element stays COMPLETELY untouched.
 */
class FormReuseOneMoreRuleTest {

  private fun prompt(name: String): String =
      FormReuseOneMoreRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled prompt '$name' not found")

  @Test
  fun `every prompt carrying the reuse rule also carries the one-more exception`() {
    // The three files that instruct "REUSE INSTEAD OF DUPLICATING" — the always-sent build
    // instruction (pass-1 / rethink) and the two form-structure rule files (pass-1 decision core
    // and
    // the pass-2 apply prompt).
    for (name in
        listOf(
            "codbi-form-task-instruction.md",
            "codbi-form-structure-rules.md",
            "codbi-form-structure-rules.decision.md")) {
      val text = prompt(name)
      assertTrue(
          text.contains("REUSE AN EXISTING ELEMENT") ||
              text.contains("REUSE INSTEAD OF DUPLICATING"),
          "$name must still carry the reuse rule")
      assertTrue(
          text.contains("ONE MORE"),
          "$name must carry the exception for a request that asks for ONE MORE element")
      assertTrue(
          text.contains("CREATE a new", ignoreCase = true),
          "$name must state that the addition CREATES a new element")
    }
  }

  @Test
  fun `the exception keeps the existing element untouched`() {
    val rules = prompt("codbi-form-task-instruction.md")
    assertTrue(
        rules.contains("leave the existing element completely unchanged", ignoreCase = true) ||
            rules.contains("leave the existing element untouched", ignoreCase = true),
        "the existing element must not be edited when the request asks for an additional one")
    // The reported wording itself must be recognizable, so the model sees the mapping.
    assertTrue(
        rules.contains("Füge NOCH EIN", ignoreCase = true) ||
            rules.contains("Füge noch ein", ignoreCase = true),
        "the exception must name the reported 'Füge noch ein …' wording as an example")
  }
}
