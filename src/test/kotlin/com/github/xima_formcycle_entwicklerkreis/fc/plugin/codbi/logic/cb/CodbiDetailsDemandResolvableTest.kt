package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the EARLY degenerate-loop guard
 * (`CodbiDetailsDemandPolicy.addsNothingNewThatResolves`).
 *
 * Real failure it addresses: pass-2 answered
 * `{"status":"need_codbi_details","elements":["btlSend"],"widgets":["XButtonList"]}` where
 * `btlSend` is a FORM element name (the `elements` field is for CodBi FUNCTION ids) and
 * `XButtonList` had already been sent. The set-equal guard did not fire (the element list changed),
 * so the run paid a full extra ~57 KB pass-3 inference that could not possibly return targeted
 * details, and only THEN hit the degenerate guard.
 *
 * Fail-open contract: the early stop may ONLY fire when nothing new can resolve — any newly named
 * widget, or any newly named element id that resolves, must still rerun.
 */
class CodbiDetailsDemandResolvableTest {

  private val nothingResolves: (Collection<String>) -> Boolean = { false }
  private val everythingResolves: (Collection<String>) -> Boolean = { true }

  @Test
  fun `unresolvable new element with only already-sent widgets is degenerate`() {
    // The observed case: elements=[btlSend] (a form element name), widgets=[XButtonList] already
    // sent.
    assertTrue(
        CodbiDetailsDemandPolicy.addsNothingNewThatResolves(
            newElements = listOf("btlSend"),
            newWidgets = listOf("XButtonList"),
            sentElements = emptyList(),
            sentWidgets = listOf("XButtonList"),
            resolves = nothingResolves))
  }

  @Test
  fun `a newly named widget must still rerun`() {
    assertFalse(
        CodbiDetailsDemandPolicy.addsNothingNewThatResolves(
            newElements = listOf("btlSend"),
            newWidgets = listOf("XButtonList", "XSelect"),
            sentElements = emptyList(),
            sentWidgets = listOf("XButtonList"),
            resolves = nothingResolves))
  }

  @Test
  fun `a newly named element that resolves must still rerun`() {
    assertFalse(
        CodbiDetailsDemandPolicy.addsNothingNewThatResolves(
            newElements = listOf("CodBi_People_Name"),
            newWidgets = listOf("XButtonList"),
            sentElements = emptyList(),
            sentWidgets = listOf("XButtonList"),
            resolves = everythingResolves))
  }

  @Test
  fun `no new element at all is not this guard's job (exact repeat is handled elsewhere)`() {
    assertFalse(
        CodbiDetailsDemandPolicy.addsNothingNewThatResolves(
            newElements = listOf("CodBi_People_Name"),
            newWidgets = emptyList(),
            sentElements = listOf("CodBi_People_Name"),
            sentWidgets = emptyList(),
            resolves = nothingResolves))
  }

  @Test
  fun `blank demand names nothing new and is not degenerate here`() {
    assertFalse(
        CodbiDetailsDemandPolicy.addsNothingNewThatResolves(
            newElements = emptyList(),
            newWidgets = emptyList(),
            sentElements = emptyList(),
            sentWidgets = emptyList(),
            resolves = nothingResolves))
  }

  @Test
  fun `only the NEW ids are passed to the resolver`() {
    // The sent id must not be re-evaluated: resolving only the fresh set keeps the guard honest.
    var seen: Collection<String>? = null
    CodbiDetailsDemandPolicy.addsNothingNewThatResolves(
        newElements = listOf("alreadySent", "fresh"),
        newWidgets = emptyList(),
        sentElements = listOf("alreadySent"),
        sentWidgets = emptyList(),
        resolves = { ids ->
          seen = ids
          true
        })
    assertTrue(seen != null && seen!!.contains("fresh") && !seen!!.contains("alreadySent"))
  }
}
