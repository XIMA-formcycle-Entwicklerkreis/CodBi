package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [CodbiBlindPassPolicy] — the pass-2 token reduction that stops the blind CodBi
 * reconsideration (which re-sends the whole CodBi/widget reference) when nothing in the run
 * indicates that a CodBi decision is still open.
 *
 * The safety contract: the pass is skipped ONLY for a usable pass-1 form that touched no CodBi
 * element and whose request carries no CodBi-capable section. Every other case — including all
 * "unknown" inputs — keeps the pass (fail-open).
 */
class CodbiBlindPassPolicyTest {

  private fun skip(
      pass1ProducedForm: Boolean = true,
      createdWidgets: Boolean = false,
      touchesCodbiInOutput: Boolean = false,
      keepTags: Collection<String>? = emptySet()
  ): Boolean =
      CodbiBlindPassPolicy.maySkipBlindPass(
          pass1ProducedForm, createdWidgets, touchesCodbiInOutput, keepTags)

  @Test
  fun `a plain field edit skips the blind pass`() {
    assertTrue(skip())
  }

  @Test
  fun `null keep tags never keep the pass`() {
    assertTrue(skip(keepTags = null))
  }

  @Test
  fun `a prose pass-1 keeps the recovery pass`() {
    assertFalse(skip(pass1ProducedForm = false))
  }

  @Test
  fun `a newly created widget keeps the pass`() {
    assertFalse(skip(createdWidgets = true))
  }

  @Test
  fun `existing data-cb wiring keeps the pass`() {
    assertFalse(skip(touchesCodbiInOutput = true))
  }

  @Test
  fun `every codbi-capable section keeps the pass`() {
    val capable =
        listOf(
            "translation",
            "designed_text",
            "svg",
            "custom_js",
            "panels",
            "photocropper",
            "ep_wiring",
            "address",
            "logging",
            "datasource",
            "navbar",
            "repeatable",
            "upload",
            "approval",
            "bundid",
            "aichat",
            "css",
            "date",
            "appointment")
    for (tag in capable) {
      assertFalse(skip(keepTags = setOf(tag)), tag)
    }
  }

  @Test
  fun `an unrelated or blank section does not keep the pass`() {
    assertTrue(skip(keepTags = setOf("not_a_known_tag")))
    assertTrue(skip(keepTags = setOf("")))
    assertTrue(skip(keepTags = emptyList()))
  }

  @Test
  fun `capability detection normalises variant spellings and casing`() {
    assertTrue(CodbiBlindPassPolicy.hasCodbiCapableSection(listOf("EP-Wiring")))
    assertTrue(CodbiBlindPassPolicy.hasCodbiCapableSection(listOf("Datasource")))
    assertTrue(CodbiBlindPassPolicy.hasCodbiCapableSection(listOf("designed-text")))
    assertFalse(CodbiBlindPassPolicy.hasCodbiCapableSection(listOf("nope")))
    assertFalse(CodbiBlindPassPolicy.hasCodbiCapableSection(null))
    assertFalse(CodbiBlindPassPolicy.hasCodbiCapableSection(emptyList()))
  }
}
