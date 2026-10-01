package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Lever #2.3 of the input-token optimisation — "de-duplicate `formcycle-general-apply` against
 * `codbi-form-structure-rules.decision`" (mechanism B: every rule has ONE authoritative home, so
 * the pass-2 static prefix does not pay twice for the same instruction).
 *
 * The pass-2 system prompt is assembled in `AICodBiAssistant.loadCodbiApplyPrompt` from
 * non-overlapping blocks: the structure/behavioural DECISION CORE
 * (`codbi.form_structure_rules_decision` ← `codbi-form-structure-rules.decision.md`) and the lean
 * build ANNEX (`formcycle.general_apply` ← `formcycle-general-apply.md`, which carries ONLY the
 * EConditionType numeric code table + the server-variable catalog the decision core defers to).
 *
 * These tests run against the REAL bundled prompt files (not fixtures) and enforce the split in
 * BOTH directions, so a future edit that:
 * - re-adds a structure/behavioural rule (repeatable containers, panels, relative placement,
 *   conditional-property decision wording) to the apply annex, or
 * - duplicates the EConditionType code table / server-variable catalog into the decision core,
 *   fails the build instead of silently re-paying those tokens on every pass-2 rerun.
 */
class FormcycleGeneralApplyDedupTest {

  private val applyResource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-general-apply.md"
  private val decisionResource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md"

  private fun read(resource: String): String =
      FormcycleGeneralApplyDedupTest::class
          .java
          .classLoader
          .getResourceAsStream(resource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")

  private val apply = read(applyResource)
  private val decision = read(decisionResource)

  // --- every rule has exactly ONE home: the decision core ===

  @Test
  fun `the apply annex is a lean build annex and carries no structure rules`() {
    // The cross-cutting structure/behavioural rules live in the decision core, NOT the apply annex.
    assertTrue(
        apply.contains("NOT repeated here"),
        "the apply annex must keep the sentence declaring the structure rules are de-duplicated")
    assertFalse(
        apply.contains("REPEATABLE CONTAINERS", ignoreCase = true),
        "repeatable-container rules only belong in the decision core")
    assertFalse(
        apply.contains("PANELS STARTING FOLDED", ignoreCase = true),
        "panel rules only belong in the decision core")
    assertFalse(
        apply.contains("RELATIVE PLACEMENT OF A NEW ELEMENT", ignoreCase = true),
        "relative-placement rules only belong in the decision core")
    assertFalse(
        apply.contains("CONDITIONAL PROPERTIES", ignoreCase = true),
        "the conditional-property decision only belongs in the decision core")
    assertFalse(
        apply.contains("SHOW IF", ignoreCase = true),
        "the show/hide-if decision wording only belongs in the decision core")
  }

  @Test
  fun `the decision core carries the rules and does not duplicate the annex tables`() {
    // The decision core is the authoritative home of the structure/behavioural rules.
    assertTrue(
        decision.contains("REPEATABLE CONTAINERS", ignoreCase = true),
        "the decision core must keep the repeatable-container rules")
    assertTrue(
        decision.contains("PANELS STARTING FOLDED", ignoreCase = true),
        "the decision core must keep the panel rules")
    assertTrue(
        decision.contains("RELATIVE PLACEMENT OF A NEW ELEMENT", ignoreCase = true),
        "the decision core must keep the relative-placement rules")
    assertTrue(
        decision.contains("CONDITIONAL PROPERTIES", ignoreCase = true),
        "the decision core must keep the conditional-property decision")

    // The numeric EConditionType table and the server-variable catalog are the apply annex's job —
    // they must NOT be duplicated back into the decision core.
    assertFalse(
        decision.contains("0 = MANDATORY — true/active when the controlling field HAS a value"),
        "the numeric EConditionType table only belongs in the apply annex")
    assertFalse(
        decision.contains("AVAILABLE SERVER VARIABLES", ignoreCase = true),
        "the server-variable catalog only belongs in the apply annex")
    assertFalse(
        decision.contains("[%\\\$PROCESS_ID%]"),
        "the server-variable catalog entries only belong in the apply annex")
  }

  // --- the apply annex still carries the content the decision core defers to ===

  @Test
  fun `the apply annex keeps the complete EConditionType code table`() {
    for (code in
        listOf(
            "0 = MANDATORY",
            "1 = EQUAL",
            "2 = NOT_EQUAL",
            "3 = REGEX",
            "4 = LESS_THAN",
            "5 = GREATER_THAN",
            "6 = BETWEEN",
            "7 = LESS_OR_EQUAL",
            "8 = GREATER_OR_EQUAL",
            "9 = EMPTY")) {
      assertTrue(apply.contains(code), "missing EConditionType code '$code' in the apply annex")
    }
  }

  @Test
  fun `the apply annex keeps the server-variable catalog under its demand gate`() {
    assertTrue(
        apply.contains("<!--SECTION:server_vars-->"),
        "the server-variable catalog must stay inside its demand-gated section")
    assertTrue(
        apply.contains("<!--/SECTION:server_vars-->"), "the server_vars section is unbalanced")
    assertTrue(apply.contains("[%\\\$PROCESS_ID%]"), "missing a representative server variable")
    assertTrue(
        apply.contains("[%\\\$FORM_PROCESS_LINK%]"), "missing the process-link server variable")
  }

  // --- the de-dup must stay a de-dup: the annex stays small ===

  @Test
  fun `the apply annex stays lean and never re-bloats to the full rules size`() {
    // The whole de-dup exists to keep this static block small. A full re-add of the
    // structure/behavioural prose (the ~25KB the decision-core split removed) must fail the build:
    // the annex is the EConditionType table + server-variable catalog only.
    val capped = 12_000
    assertTrue(
        apply.length < capped,
        "the apply annex must stay small (is ${apply.length} chars, cap $capped) — a structure rule was re-added")
  }

  // --- the two static blocks overlap nowhere: a shared rule phrase settles the split intent ===

  @Test
  fun `the option-gated-field rule lives exactly once in the decision core`() {
    // The decision core decides option-gated fields; the annex only carries the code numbers. The
    // settled phrasing must not leak into both.
    val phrase = "hiddenifcomp` = NOT_EQUAL"
    assertTrue(
        decision.contains(phrase),
        "the option-gated-field decision phrase ('$phrase') must live in the decision core")
    // The annex must not re-state the option-gated decision (only its EConditionType code table).
    assertFalse(
        apply.contains("OPTION-GATED", ignoreCase = true),
        "the option-gated-field decision only belongs in the decision core")
  }
}
