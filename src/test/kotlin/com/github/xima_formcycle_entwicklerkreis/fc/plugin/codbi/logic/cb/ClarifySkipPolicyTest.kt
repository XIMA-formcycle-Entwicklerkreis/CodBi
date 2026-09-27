package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [ClarifySkipPolicy] and [ClarificationReferenceDetector] — the lever-1 clarify-skip.
 *
 * The safety contract under test: a skip is authorised ONLY by the AI signal (`needsClarification
 * == false` AND `needsToolContext` present and empty); EVERY other case — a missing key, a
 * requested tool context, a re-run with answers, a detector hit — keeps the clarify round
 * (fail-open). The detector can only veto, never authorise.
 */
class ClarifySkipPolicyTest {

  private fun reason(
      needsClarification: Boolean?,
      needsToolContext: Set<String>? = emptySet(),
      hasClarificationAnswers: Boolean = false,
      referenceVeto: Boolean = false
  ): String? =
      ClarifySkipPolicy.skipReason(
          needsClarification, needsToolContext, hasClarificationAnswers, referenceVeto)

  @Test
  fun `skips only when the AI explicitly denies both a question and any tool context`() {
    assertNotNull(reason(false))
  }

  @Test
  fun `a missing needsClarification key fails open`() {
    assertNull(reason(null))
  }

  @Test
  fun `needsClarification true keeps the round`() {
    assertNull(reason(true))
  }

  @Test
  fun `a missing needsToolContext key fails open`() {
    assertNull(reason(false, needsToolContext = null))
  }

  @Test
  fun `a requested tool context keeps the round`() {
    assertNull(reason(false, setOf("form_list")))
    assertNull(reason(false, setOf("chat_history")))
  }

  @Test
  fun `a re-run carrying clarification answers is never skipped`() {
    assertNull(reason(false, hasClarificationAnswers = true))
  }

  @Test
  fun `a deterministic reference veto keeps the round`() {
    assertNull(reason(false, referenceVeto = true))
  }

  @Test
  fun `the detector fires in every covered language`() {
    val corpora =
        listOf(
            "Mach es genau wie letzte Woche.",
            "Please do the same as on the other form.",
            "Fallo come prima.",
            "Doe het zoals eerder.",
            "Fais-le comme avant.",
            "Hazlo como antes.",
            "Zrób to jak wcześniej.",
            "Bunu daha önce yaptığın gibi yap.")
    for (corpus in corpora) {
      assertTrue(ClarificationReferenceDetector.wantsFormOrHistoryContext(corpus), corpus)
    }
  }

  @Test
  fun `a plain field request triggers no veto`() {
    val corpora =
        listOf(
            "Füge ein Eingabefeld für den Namen hinzu.",
            "Add a field for the e-mail address.",
            "Aggiungi un campo per il nome.",
            "Voeg een veld toe voor de naam.")
    for (corpus in corpora) {
      assertFalse(ClarificationReferenceDetector.wantsFormOrHistoryContext(corpus), corpus)
    }
  }

  @Test
  fun `a blank or missing corpus never vetoes`() {
    assertFalse(ClarificationReferenceDetector.wantsFormOrHistoryContext(null))
    assertFalse(ClarificationReferenceDetector.wantsFormOrHistoryContext(""))
    assertFalse(ClarificationReferenceDetector.wantsFormOrHistoryContext("   "))
  }
}
