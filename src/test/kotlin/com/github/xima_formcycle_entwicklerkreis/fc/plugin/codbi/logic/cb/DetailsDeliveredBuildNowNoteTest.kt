package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import java.lang.reflect.Method
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for [`AICodBiAssistant.detailsDeliveredBuildNowNote`] — the explicit "your
 * requested details are above, build now, do NOT re-request" instruction prepended to the pass-2
 * and forced-final user content.
 *
 * Background (Phase 3 bug): after the "ONE COMPLETE REQUEST" tightening, the model requested the
 * BayVIS EP + HTML.Text.Mapper together in pass-1 (correct, cost lowered), but then KEPT
 * re-emitting the identical `need_codbi_details` request in pass-2 EVEN THOUGH it had already
 * received those exact details (`codbiDetails+nameIndex=...` was sent). The details were presented
 * as a passive reference catalog with no link to the model's own request, so the model — primed by
 * the "request details FIRST, never invent placeholders" rules — kept asking, the degenerate-loop
 * guard fired, the forced final pass re-requested again, and the run ended with NO form generated.
 * The helper below makes the delivery unmistakable by naming the exact delivered ids/widgets and
 * forbidding a follow-up request.
 */
class DetailsDeliveredBuildNowNoteTest {

  private fun note(requested: List<String>, widgets: List<String>): String {
    val method: Method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("detailsDeliveredBuildNowNote", List::class.java, List::class.java)
    method.isAccessible = true
    @Suppress("UNCHECKED_CAST")
    return method.invoke(AICodBiAssistant(), requested, widgets) as String
  }

  @Test
  fun `empty requested ids produce no confirmation note`() {
    assertTrue(note(emptyList(), emptyList()).isEmpty())
    assertTrue(note(emptyList(), listOf("XSpan")).isEmpty())
  }

  @Test
  fun `non-empty requested ids produce a build-now note naming every delivered id`() {
    val out = note(listOf("HTML.Text.Mapper", "BayVIS.Ansprechpartner.Details"), listOf("XSpan"))
    assertTrue(out.contains("YOUR REQUESTED DETAILS ARE ABOVE — DO NOT REQUEST THEM AGAIN"))
    assertTrue(out.contains("HTML.Text.Mapper"))
    assertTrue(out.contains("BayVIS.Ansprechpartner.Details"))
    assertTrue(out.contains("XSpan"))
    // The core anti-loop guarantee must be present.
    assertTrue(out.contains("NEVER emit another need_codbi_details"))
    assertTrue(out.contains("is a degenerate loop that wastes a full inference and yields no form"))
    // It must instruct to build in THIS response instead of re-requesting.
    assertTrue(out.contains("BUILD the complete form JSON in THIS response"))
  }

  @Test
  fun `widget ids are optional and omitted from the note when absent`() {
    val outNoWidgets = note(listOf("BayVIS.Ansprechpartner.Details"), emptyList())
    assertTrue(outNoWidgets.contains("BayVIS.Ansprechpartner.Details"))
    assertFalse(outNoWidgets.contains("widget template(s)"))
    val outWithWidgets = note(listOf("BayVIS.Behoerden.Details"), listOf("XTextArea"))
    assertTrue(outWithWidgets.contains("widget template(s): XTextArea"))
  }

  @Test
  fun `the produced instruction is a hard block against branching id sets`() {
    val out = note(listOf("HTML.Text.Injector", "BayVIS.Behoerden.Details"), listOf("XSpan"))
    // No id is free to be re-requested later; the delivered set is exactly the requested set.
    assertTrue(out.contains("HTML.Text.Injector"))
    assertTrue(out.contains("BayVIS.Behoerden.Details"))
    assertTrue(out.contains("in this already-delivered set"))
  }
}
