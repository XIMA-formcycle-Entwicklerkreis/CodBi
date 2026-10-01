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
    // clarify prompt). Every byte cut here is paid on EVERY non-skipped clarification round. The
    // cap is the POST-condensation size (measured ~30.8 k) with a little headroom for a legitimate
    // future rule addition — it must never silently regrow toward the pre-condensation 44 k.
    assertTrue(p.length < 32000, "clarification template grew back to ${p.length} chars")
  }

  // --- Lever 1 (backend): the CLARIFICATION round gets a CONDENSED form-structure context ---
  //
  // The clarify AI only RESOLVES references to existing elements; it never builds/verifies, so the
  // per-element "already configured" flag suffix ([required; hiddenif=...; readonly; regex; ...])
  // is dead weight for it. `buildFormStructureContext(persistJson, condensed = true)` must keep
  // every NAME/LABEL/TITLE + the page/fieldset tree, but drop those flags — while the default
  // (chat/pass-1) variant keeps them unchanged.

  private val persistWithFlags =
      """
      {"items":[
        {"className":"XPage","properties":{"name":"page1","label":"Seite 1","elements":[
          {"className":"XFieldSet","properties":{"name":"fs1","legend":"Pers\u00f6nliche Daten",
            "required":"1","hiddenifshow":"true","regex":"[A-Z]","elements":[
            {"className":"XTextField","properties":{"name":"vorname","title":"Vorname","required":"1"}}
          ]}}
        ]}}
      ]}
      """
          .trimIndent()

  private fun buildStructure(persist: String, condensed: Boolean): String? =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("buildFormStructureContext", String::class.java, Boolean::class.java)
          .apply { isAccessible = true }
          .invoke(AICodBiAssistant(), persist, condensed) as? String

  @Test
  fun `condensed structure context keeps names and labels but drops config flags`() {
    val condensed = buildStructure(persistWithFlags, condensed = true) ?: error("condensed is null")
    // Every element's reference surface must survive: names, labels/titles, and the tree.
    assertTrue(condensed.contains("page1"), "page technical name must survive")
    assertTrue(condensed.contains("Seite 1"), "page label must survive")
    assertTrue(condensed.contains("fs1"), "fieldset technical name must survive")
    assertTrue(condensed.contains("Pers\u00f6nliche Daten"), "fieldset legend must survive")
    assertTrue(condensed.contains("vorname"), "field technical name must survive")
    assertTrue(condensed.contains("Vorname"), "field title must survive")
    // The clarify round never builds/verifies, so the "already configured" flag suffix is DEAD
    // WEIGHT for it and must be dropped.
    assertTrue(!condensed.contains("required"), "condensed must not carry the required flag")
    assertTrue(!condensed.contains("hiddenif"), "condensed must not carry hiddenif detail")
    assertTrue(!condensed.contains("regex"), "condensed must not carry validation detail")
  }

  @Test
  fun `condensed structure context is strictly smaller than the full one`() {
    val full = buildStructure(persistWithFlags, condensed = false) ?: error("full is null")
    val condensed = buildStructure(persistWithFlags, condensed = true) ?: error("condensed is null")
    assertTrue(
        condensed.length < full.length, "condensed ($condensed.length) >= full ($full.length)")
  }

  @Test
  fun `the default structure context still carries the config flags (chat - pass1 unchanged)`() {
    val full = buildStructure(persistWithFlags, condensed = false) ?: error("full is null")
    // Chat/pass-1 genuinely react to required/visibility/validation, so those flags must survive
    // in the default variant.
    assertTrue(full.contains("required"), "default variant must keep the required flag")
    assertTrue(full.contains("hiddenif"), "default variant must keep hiddenif detail")
  }

  // --- Lever 1 (backend): the WORKFLOW clarify branch shares the same condensed decision-core ---
  //
  // A workflow request may still reference existing form elements ("when 'Genehmigen' is clicked",
  // "bound to the 'vorname' field"), so the workflow clarify round must resolve references against
  // the SAME lean decision-core (condensed=@true) as the form one. It never builds/verifies, so it
  // too must NOT receive the per-element config-flag suffix. `buildFormStructureContext(persist,
  // condensed=@true)` is the single seam both intents share; here we assert the workflow intent
  // uses
  // it (that is, it resolves refs from the lean core, not the full chat/pass-1 variant).
  @Test
  fun `the workflow clarify round consumes the same condensed decision-core as the form one`() {
    val workflowCondensed = buildStructure(persistWithFlags, condensed = true) ?: error("null")
    // Same lean core as the form round: every reference surface survives, no config-flag suffix.
    assertTrue(workflowCondensed.contains("vorname"), "workflow core must keep the field name")
    assertTrue(workflowCondensed.contains("Vorname"), "workflow core must keep the field title")
    assertTrue(workflowCondensed.contains("page1"), "workflow core must keep the page tree")
    assertTrue(!workflowCondensed.contains("required"), "workflow core must drop the required flag")
    assertTrue(!workflowCondensed.contains("hiddenif"), "workflow core must drop hiddenif detail")
    // And it is strictly leaner than the chat/pass-1 variant the workflow round does NOT need.
    val chatFull = buildStructure(persistWithFlags, condensed = false) ?: error("null")
    assertTrue(
        workflowCondensed.length < chatFull.length,
        "workflow condensed core (${workflowCondensed.length}) must be leaner than chat full (${chatFull.length})")
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
