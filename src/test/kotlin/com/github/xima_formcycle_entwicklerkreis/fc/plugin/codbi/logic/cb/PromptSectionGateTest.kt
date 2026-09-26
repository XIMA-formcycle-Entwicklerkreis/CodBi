package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [PromptSectionGate] — the pass-1 section gating that drops whole `<!--SECTION:tag-->
 * … <!--/SECTION:tag-->` blocks a request cannot need, so pass-1 does not pay for instruction
 * blocks that cannot apply.
 *
 * The safety contract under test: a block is dropped ONLY when its tag is neither in the AI's
 * `sections` nor matched by a deterministic detector, and any other case (unknown tag, unbalanced
 * markers, no markers) fails OPEN (the block is kept).
 */
class PromptSectionGateTest {

  private val plainFieldRequest =
      "Füge ein Eingabefeld für den Namen und eines für die E-Mail-Adresse hinzu."

  @Test
  fun `the designed-text prompt is detected as designed_text and svg`() {
    val prompt =
        "Füge einen Text in schönem Design an … Mach das Design auch interaktiv … " +
            "eine animierte SVG Illustration …"
    val detected = PromptSectionGate.detect(prompt)
    assertTrue("designed_text" in detected, "detected=$detected")
    assertTrue("svg" in detected, "detected=$detected")
  }

  @Test
  fun `a translation request is detected as translation`() {
    assertTrue(
        "translation" in PromptSectionGate.detect("Übersetze das gesamte Formular ins Englische."))
    assertTrue("translation" in PromptSectionGate.detect("translate the whole form into French"))
  }

  @Test
  fun `a plain field request without trigger words detects nothing gated`() {
    val detected =
        PromptSectionGate.detect(
            "Füge ein Pflichtfeld für den Vornamen und ein Auswahlfeld für die Anrede hinzu.")
    assertTrue(detected.isEmpty(), "detected=$detected")
  }

  @Test
  fun `a false-positive detector match only ever KEEPS a block (address on 'E-Mail-Adresse')`() {
    // The deliberate fail-open trade-off: a word that merely CONTAINS a trigger (here "Adresse" in
    // "E-Mail-Adresse") trips the detector. That is harmless — it can only KEEP the `address`
    // block,
    // never drop one — whereas a false negative would drop a needed rule. Documented, not a bug.
    assertTrue("address" in PromptSectionGate.detect(plainFieldRequest))
  }

  @Test
  fun `blank and null corpora never detect anything`() {
    assertTrue(PromptSectionGate.detect(null).isEmpty())
    assertTrue(PromptSectionGate.detect("").isEmpty())
    assertTrue(PromptSectionGate.detect("   ").isEmpty())
  }

  @Test
  fun `an untriggered block is dropped and a kept block loses its markers`() {
    val text =
        "ALWAYS-ON\n" +
            "<!--SECTION:translation-->TRANSLATION RULE<!--/SECTION:translation-->\n" +
            "<!--SECTION:designed_text,svg-->DESIGN RULE<!--/SECTION:designed_text,svg-->\n"
    val gated = PromptSectionGate.applySectionGates(text, setOf("designed_text"))
    assertFalse(gated.contains("TRANSLATION RULE"), gated)
    assertTrue(gated.contains("ALWAYS-ON"), gated)
    assertTrue(gated.contains("DESIGN RULE"), gated)
    assertFalse(gated.contains("<!--SECTION:"), gated)
    assertFalse(gated.contains("<!--/SECTION:"), gated)
  }

  @Test
  fun `a multi-tag block is kept when ANY of its tags is kept`() {
    val text = "<!--SECTION:designed_text,svg-->BOTH<!--/SECTION:designed_text,svg-->"
    assertEquals("BOTH", PromptSectionGate.applySectionGates(text, setOf("svg")))
    assertEquals("BOTH", PromptSectionGate.applySectionGates(text, setOf("designed_text")))
    assertEquals("", PromptSectionGate.applySectionGates(text, setOf("panels")))
  }

  @Test
  fun `an unknown tag fails open (its block is kept)`() {
    val text = "<!--SECTION:brand_new-->NEW<!--/SECTION:brand_new-->"
    assertEquals("NEW", PromptSectionGate.applySectionGates(text, emptySet()))
  }

  @Test
  fun `an unbalanced marker keeps the body and removes only the marker token`() {
    val text = "before <!--SECTION:translation-->body"
    assertEquals("before body", PromptSectionGate.applySectionGates(text, emptySet()))
  }

  @Test
  fun `text without markers is returned unchanged`() {
    val text = "just some decision core text with no markers"
    assertEquals(text, PromptSectionGate.applySectionGates(text, emptySet()))
  }

  @Test
  fun `resolveKeepTags unions the AI sections with the detectors`() {
    // The AI lists translation; the detectors fire on the design prompt; normalisation lowercases.
    val keep =
        PromptSectionGate.resolveKeepTags(listOf(" Translation ", "PANELS"), "ein schönes Design")
    assertTrue("translation" in keep, "keep=$keep")
    assertTrue("panels" in keep, "keep=$keep")
    // resolveKeepTags returns the NORMALISED comparison form (non-alphanumerics stripped).
    assertTrue("designedtext" in keep, "keep=$keep")
  }

  @Test
  fun `all gated tags are declared known so a typo cannot silently drop a block`() {
    // The tags used in the decision-core markers must all be members of KNOWN_TAGS.
    val usedInPrompts =
        setOf(
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
    assertTrue(
        PromptSectionGate.KNOWN_TAGS.containsAll(usedInPrompts),
        PromptSectionGate.KNOWN_TAGS.toString())
  }

  @Test
  fun `variant spellings of a kept tag still match a marker tag`() {
    val block = "<!--SECTION:designed_text-->X<!--/SECTION:designed_text-->"
    // hyphen / spaces / different case all normalise to the same comparison form
    assertEquals("X", PromptSectionGate.applySectionGates(block, setOf("designed-text")))
    assertEquals("X", PromptSectionGate.applySectionGates(block, setOf("Designed Text")))
    val aiChat = "<!--SECTION:aichat-->A<!--/SECTION:aichat-->"
    assertEquals("A", PromptSectionGate.applySectionGates(aiChat, setOf("AI Chat")))
  }

  @Test
  fun `resolveKeepTags normalises variant spellings returned by the AI`() {
    val keep = PromptSectionGate.resolveKeepTags(listOf("designed-text", "EP Wiring"), null)
    assertTrue("designedtext" in keep, "keep=$keep")
    assertTrue("epwiring" in keep, "keep=$keep")
  }

  @Test
  fun `the sections vocabulary advertised in the chat prompt matches KNOWN_TAGS`() {
    // Drift guard: the AI is told which members are valid — they must be exactly the tags the gate
    // can act on. If either side changes without the other, this fails.
    val resource =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md"
    val text =
        PromptSectionGate::class
            .java
            .classLoader
            .getResourceAsStream(resource)
            ?.bufferedReader(Charsets.UTF_8)
            ?.use { it.readText() }
    assertTrue(
        text != null && text.contains("\"sections\""), "the chat prompt must define sections")
    val advertised = Regex("\"sections\"[^\\[]*\\[([^\\]]*)\\]").find(text!!)?.groupValues?.get(1)
    assertTrue(advertised != null, "could not locate the sections vocabulary in the chat prompt")
    val members =
        advertised!!.split(",").map { it.trim().removeSurrounding("\"") }.filter { it.isNotBlank() }
    assertEquals(PromptSectionGate.KNOWN_TAGS, members.toSet())
  }

  @Test
  fun `cache mode keeps every known block and only strips the markers`() {
    // AI_Assistant_PromptCaching passes PromptSectionGate.KNOWN_TAGS as the keep set. Its contract:
    // NOTHING may be dropped mid-prompt (a request-dependent drop would change every byte after it
    // and invalidate the provider's prefix cache) — but the raw marker comments must still
    // disappear,
    // because the model reads `<!--SECTION:…-->` as "commented out".
    val text =
        "ALWAYS-ON\n" +
            "<!--SECTION:translation-->TRANSLATION RULE<!--/SECTION:translation-->\n" +
            "<!--SECTION:designed_text,svg-->DESIGN RULE<!--/SECTION:designed_text,svg-->\n"
    val cached = PromptSectionGate.applySectionGates(text, PromptSectionGate.KNOWN_TAGS)
    assertTrue(cached.contains("ALWAYS-ON"), cached)
    assertTrue(cached.contains("TRANSLATION RULE"), cached)
    assertTrue(cached.contains("DESIGN RULE"), cached)
    assertFalse(cached.contains("<!--SECTION:"), cached)
    assertFalse(cached.contains("<!--/SECTION:"), cached)
  }

  @Test
  fun `cache mode equals the full corpus with the markers removed`() {
    // The invariant that makes the mode cacheable: the result is independent of what the request
    // would have needed — it is simply the complete corpus minus the marker tokens.
    val text =
        "CORE\n" +
            "<!--SECTION:translation-->TRANSLATION<!--/SECTION:translation-->\n" +
            "<!--SECTION:svg-->SVG<!--/SECTION:svg-->"
    assertEquals(
        "CORE\nTRANSLATION\nSVG",
        PromptSectionGate.applySectionGates(text, PromptSectionGate.KNOWN_TAGS))
    // ...whereas the request-dependent gates really do produce a SHORTER, different prompt (the
    // mode
    // exists because of exactly this difference).
    val gated = PromptSectionGate.applySectionGates(text, setOf("svg"))
    assertFalse(gated.contains("TRANSLATION"), gated)
    assertTrue(
        gated.length <
            PromptSectionGate.applySectionGates(text, PromptSectionGate.KNOWN_TAGS).length)
  }
}
