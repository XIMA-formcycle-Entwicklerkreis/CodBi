package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Lever 4 (token reduction — remaining clarify sub-blocks) — regression tests for the
 * completion-page condensation (`condenseCompletionPagesForClarify`).
 *
 * `fetchCompletionPages` returns a rich `[{"name":...,"uuid":...},...]` JSON array, but the clarify
 * round only ever offers these as multiple-choice options BY NAME ("ask the user to PICK ONE BY
 * NAME"). The clarify round resolves references — it never persists a page — so the per-page `uuid`
 * is dead weight there and must be dropped, leaving just the page names.
 *
 * Fail-open gagged: a malformed/blank/null input must come back unchanged so a bad block never
 * starves the clarify round of context.
 *
 * The second half verifies the deterministic consumption seam: a condensed name-list
 * `completionPages` reaching `buildClarificationSystemPrompt` still assembles the "AVAILABLE
 * ABSCHLUSSSEITEN" block so the page names reach the final prompt.
 *
 * NOTE: `fetchWorkflowMailNodesSummary` (the third Lever-4 sub-block) also dropped its per-node
 * `id`/`type` dead weight, but it is DB-backed (`formcycleEntityManager`) and returns null without
 * a live server, so — as with `buildWorkflowStructureContext` — its reduced `{name, subject,
 * sender, recipient}` shape is asserted only through the consumption seam below (the block
 * assembles without leaking `"id"`/`"type"`).
 */
class ClarifyCompletionPagesCondenseTest {

  private val assistant = AICodBiAssistant()

  private fun condense(input: String?): String? =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("condenseCompletionPagesForClarify", String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, input) as String?

  private fun fullInput(): String =
      """[{"name":"Standard-Fehlerseite","uuid":"aaaa-bbbb-0001"},
         {"name":"Danke-Seite","uuid":"aaaa-bbbb-0002"}]"""

  private fun buildSystemPrompt(
      completionPages: String?,
      workflowMails: String? = null,
      formVariables: String? = null
  ): String {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod(
                "buildClarificationSystemPrompt",
                String::class.java, // prompt
                String::class.java, // intent
                String::class.java, // formElements
                String::class.java, // formStructureContext
                String::class.java, // workflowStructureContext
                String::class.java, // textSpanContentContext
                String::class.java, // clarificationContext
                String::class.java, // chatContext
                String::class.java, // changeHistoryContext
                String::class.java, // formListContext
                String::class.java, // formKey
                String::class.java, // currentFormTitle
                Boolean::class.javaPrimitiveType, // useCodbi
                Boolean::class.javaPrimitiveType, // askAllQuestions
                String::class.java, // completionPages
                String::class.java, // formVariables
                String::class.java, // workflowMails
                String::class.java, // availableDatasources
                Set::class.java) // clarificationTopics
    method.isAccessible = true
    return method.invoke(
        assistant,
        "set the success page to the Danke-Seite",
        "workflow",
        null,
        null,
        null,
        null,
        "",
        "",
        null,
        null,
        null,
        null,
        true,
        false,
        completionPages,
        formVariables,
        workflowMails,
        null,
        emptySet<Any>()) as String
  }

  @Test
  fun `reduces the json array to a comma separated name list`() {
    val out = condense(fullInput())!!
    assertEquals("Standard-Fehlerseite, Danke-Seite", out)
  }

  @Test
  fun `drops the uuid which is dead weight for clarify`() {
    val out = condense(fullInput())!!
    assertFalse(out.contains("uuid"), "the per-page uuid must be dropped for the clarify round")
    assertFalse(
        out.contains("aaaa-bbbb"), "the uuid values must not leak into the condensed name list")
  }

  @Test
  fun `is strictly smaller than the full version`() {
    val full = fullInput()
    val out = condense(full)!!
    assertTrue(
        out.length < full.length, "condensed length ${out.length} must be < full ${full.length}")
  }

  @Test
  fun `page names survive so the ai can offer them as multiple choice`() {
    val out = condense(fullInput())!!
    assertTrue(out.contains("Standard-Fehlerseite"), "page name must survive")
    assertTrue(out.contains("Danke-Seite"), "page name must survive")
  }

  @Test
  fun `fail-open on malformed input returns the original unchanged`() {
    val notJson = "this is not json at all"
    assertEquals(notJson, condense(notJson))
    val notArray = """{"name":"Standard-Fehlerseite"}"""
    assertEquals(notArray, condense(notArray))
  }

  @Test
  fun `blank and null inputs pass through untouched`() {
    // Fail-open: the exact input comes back unchanged so a blank/missing block never disturbs the
    // surrounding prompt assembly. Null stays null; blank strings stay blank strings.
    assertNull(condense(null))
    assertEquals("", condense(""))
    assertEquals("   ", condense("   "))
  }

  @Test
  fun `the condensed name list assembles the completion-pages block`() {
    val prompt = buildSystemPrompt("Standard-Fehlerseite, Danke-Seite")
    assertTrue(
        prompt.contains("AVAILABLE ABSCHLUSSSEITEN (completion pages)"),
        "the completion-pages block must be appended when a name list is present")
    assertTrue(prompt.contains("PICK ONE BY NAME"), "the pick-one-by-name instruction must survive")
    assertTrue(prompt.contains("Danke-Seite"), "the page name must reach the final prompt")
  }

  @Test
  fun `blank completion pages inject no completion-pages block`() {
    val prompt = buildSystemPrompt(null)
    // The bundled template itself already mentions "AVAILABLE ABSCHLUSSSEITEN", so pin the absence
    // check to "from this list (multiple-choice options)" — phrasing ONLY the assembled block
    // emits.
    assertFalse(
        prompt.contains("from this list (multiple-choice options)"),
        "null completion pages must inject no completion-pages block (fail-open)")
  }

  @Test
  fun `the lean workflow-mail block assembles with the reused values`() {
    val leanMails =
        """[{"name":"Mail an Genehmiger","subject":"Bitte freigeben","sender":"noreply@example.de","recipient":"g@example.de"}]"""
    val prompt = buildSystemPrompt(null, workflowMails = leanMails)
    assertTrue(
        prompt.contains("EXISTING WORKFLOW MAIL NODES"),
        "the workflow-mail block must be appended when a lean summary is present")
    assertTrue(prompt.contains("Mail an Genehmiger"), "the mail name must reach the final prompt")
    assertTrue(
        prompt.contains("Bitte freigeben"), "the reusable subject must reach the final prompt")
    assertTrue(
        prompt.contains("g@example.de"), "the reusable recipient must reach the final prompt")
  }

  @Test
  fun `the form-variables block stays a lean name list`() {
    val prompt = buildSystemPrompt(null, formVariables = "Vorname, Nachname")
    assertTrue(
        prompt.contains("FORM GLOBAL VARIABLES (Formularvariablen, NOT form fields)"),
        "the form-variables block must be appended when variable names are present")
    assertTrue(prompt.contains("Vorname"), "the variable name must reach the final prompt")
    assertTrue(
        prompt.contains("[%variableName%]"),
        "the runtime placeholder hint must survive in the form-variables block")
  }
}
