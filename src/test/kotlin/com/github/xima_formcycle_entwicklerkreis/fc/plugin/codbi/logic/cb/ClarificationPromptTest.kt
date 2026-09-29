package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Lever #1 of the input-token optimisation — "shrink the clarify prompt". The clarification round's
 * gated prompt was ~33 k chars; its bulk is the `codbi-clarification.md` template itself (~44 k
 * chars ≈ 14 k tokens) plus the verbose envelope prose the backend assembles around the data
 * blocks.
 *
 * This condensation is mechanism C/D (condense verbose prose, keep every operative rule, fail-open
 * gating): the file must shrink so the clarify round costs fewer tokens, but NOT ONE decision
 * signal the model needs to act on the current request may be lost. These tests run against the
 * REAL bundled prompt file (not a fixture), so a future edit that drops a hard rule, removes a
 * `{{PLACEHOLDER}}`, breaks a `<!--CLARIFY:-->` gate, or bloats the file back up fails the build
 * instead of silently degrading every clarification round.
 *
 * Mirror of the "three mistakes" rules from the plan: keep every imperative (even terse); a
 * condensation must first separate a block's data/tables from its imperatives, keep all imperatives
 * and only then cut prose.
 */
class ClarificationPromptTest {

  private val resource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md"

  private fun template(): String =
      ClarificationPromptTest::class
          .java
          .classLoader
          .getResourceAsStream(resource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")

  // --- the %%template%% contract: every placeholder the backend injects into must still exist ---

  @Test
  fun `every envelope placeholder is preserved`() {
    val p = template()
    for (placeholder in
        listOf(
            "{{ACTION}}",
            "{{USER_REQUEST}}",
            "{{QUESTION_COUNT_RULE}}",
            "{{CURRENTLY_OPEN_FORM}}",
            "{{FORM_ELEMENTS}}",
            "{{FORM_STRUCTURE}}",
            "{{TEXT_SPAN_CONTENT}}",
            "{{CLARIFICATION_HISTORY}}",
            "{{CHAT_HISTORY}}",
            "{{CHANGE_HISTORY_BLOCK}}",
            "{{FORM_LIST_BLOCK}}",
            "{{CHANGE_HISTORY_STATUS}}")) {
      assertTrue(p.contains(placeholder), "missing placeholder $placeholder")
    }
  }

  // --- the core decision invariants (must survive any condensation) ---

  @Test
  fun `the response contract is preserved`() {
    val p = template()
    assertTrue(p.contains("need_clarification"), "the clarification JSON status is missing")
    assertTrue(p.contains("NO_CLARIFICATION"), "the NO_CLARIFICATION terminal answer is missing")
    assertTrue(p.contains("questions"), "the questions JSON array is missing")
    assertTrue(p.contains("multiSelect"), "the multiSelect key is missing")
    assertTrue(p.contains("allowFreeText"), "the allowFreeText key is missing")
    assertTrue(p.contains("options"), "the options key is missing")
  }

  @Test
  fun `never re-ask and no-trivia rules survive`() {
    val p = template()
    assertTrue(p.contains("NEVER RE-ASK"), "the re-ask prohibition heading must survive")
    assertTrue(
        p.contains("already asked"), "repeating an already-asked question must stay forbidden")
    assertTrue(
        p.contains("NO_CLARIFICATION"), "the terminal answer for a change-only request must remain")
  }

  @Test
  fun `the element-placeholder hard rule survives verbatim constructs`() {
    val p = template()
    // A field whose value is produced by an EP must be built from a sensible example, never asked
    // for.
    assertTrue(p.contains("Data.CSV"), "the EP list must keep Data.CSV")
    assertTrue(p.contains("Date.FromString"), "the EP list must keep Date.FromString")
    assertTrue(p.contains("LDAP.Find"), "the EP list must keep LDAP.Find")
    assertTrue(
        p.contains("example") || p.contains("Beispiel"),
        "the 'build a sensible example parameter' imperative must survive")
    assertTrue(
        p.contains("do NOT ask"),
        "the EP 'do NOT ask for input data/format/URL' imperative must survive")
  }

  @Test
  fun `the literal-value vs form-field rule survives`() {
    val p = template()
    assertTrue(p.contains("[%"), "the form-field placeholder syntax must be preserved")
    assertTrue(
        p.contains("LITERAL") || p.contains("literal"),
        "the 'provided value is a LITERAL value' rule must survive")
    assertTrue(
        p.contains("form field"),
        "the 'only when the user explicitly asks for a form field' rule must survive")
  }

  @Test
  fun `the another-form need_form_list and need_chat_history flow survives`() {
    val p = template()
    assertTrue(p.contains("need_form_list"), "the form-list request status must survive")
    assertTrue(p.contains("need_chat_history"), "the change-history request status must survive")
    assertTrue(p.contains("formKey"), "the formKey parameter must survive")
  }

  @Test
  fun `the workflow mail reuse and process-link rules survive`() {
    val p = template()
    assertTrue(
        p.contains("EXISTING WORKFLOW MAIL NODES") ||
            p.contains("existing mail") ||
            p.contains("EXISTING MAIL"),
        "the existing-mail reuse rule must survive")
    // The template carries the system variables in the literal "$FORM_PROCESS_LINK" /
    // "$FORM_REVIEW_LINK"
    // forms (optionally preceded by a literal backslash). Just assert the variable NAME survives.
    assertTrue(
        p.contains("FORM_PROCESS_LINK"), "the form-process-link system variable must survive")
    assertTrue(p.contains("FORM_REVIEW_LINK"), "the review-link system variable must survive")
  }

  // --- the gated scenario blocks must keep their tags AND their operative rules ---

  @Test
  fun `all four CLARIFY gates and their scenario rules survive`() {
    val p = template()
    assertTrue(p.contains("<!--CLARIFY:"), "no CLAIRIFY gate marker survived")
    assertTrue(p.contains("payment"), "the payment gate block must survive")
    assertTrue(p.contains("livedata"), "the livedata gate block must survive")
    assertTrue(p.contains("http"), "the http gate block must survive")
    assertTrue(p.contains("approval"), "the approval gate block must survive")
    // The payment gate carries the mandatory notification-matrix questions.
    assertTrue(
        p.contains("CLIENT") && p.contains("RECEIPT") && p.contains("ADMIN"),
        "the payment notification matrix must survive")
    // Live-data: never ask for an endpoint/URL.
    assertTrue(
        p.contains("endpoint") || p.contains("URL"), "the live-data no-endpoint rule must survive")
  }

  @Test
  fun `the mandatory-values and required-input rules survive`() {
    val p = template()
    assertTrue(p.contains("MANDATORY"), "the mandatory-values heading must survive")
    assertTrue(
        p.contains("RECIPIENT") || p.contains("recipient"),
        "the email-recipient mandatory value must survive")
    assertTrue(
        p.contains("FC_EMAIL") || p.contains("FC_SHOW_TEMPLATE") || p.contains("FC_POST_REQUEST"),
        "at least one workflow-node mandatory-value rule must survive")
  }

  // --- the file must actually be smaller than the pre-condensation ~44 k reference ---

  @Test
  fun `the clarification template is a small fraction of the original reference`() {
    val p = template()
    // Original measured at 44,328 chars ≈ 14 k tokens (the largest single component of the gated
    // clarify prompt). Every byte cut here is paid on EVERY non-skipped clarification round.
    assertTrue(p.length < 34000, "clarification template grew back to ${p.length} chars")
  }

  // --- the verbose essay trap: a condensation must not JUNK the operative imperative ---

  @Test
  fun `the condensed template still states when to ASK vs decide`() {
    val p = template()
    assertTrue(
        p.contains("ASK") || p.contains("ask"), "the ASK instruction must survive the condensation")
    assertTrue(
        p.contains("derive") || p.contains("decide") || p.contains("DEFAULT"),
        "the decide-it-yourself imperative must survive the condensation")
  }

  // --- the verbose filler that a condensation is ALLOWED to remove ---

  @Test
  fun `the obvious filler sentences are gone`() {
    val p = template()
    assertFalse(
        p.contains("You are about to {{ACTION}} for the user") || p.contains("for the user."),
        "the redundant identity filler sentence should be gone")
  }
}
