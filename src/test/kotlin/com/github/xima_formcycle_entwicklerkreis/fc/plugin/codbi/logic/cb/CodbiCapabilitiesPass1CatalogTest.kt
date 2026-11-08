package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the PASS-1 catalog contract ([CodbiCapabilities.buildSectionCondensed] /
 * [CodbiCapabilities.buildWidgetsSectionCondensed]).
 *
 * ELEMENT catalog: pass-1 must advertise EVERY entry WITH its purpose — one sentence "what it does"
 * plus a `USE WHEN …` sentence — and must NOT carry parameters, attribute names or JSON skeletons
 * (those arrive in pass-2 via `need_codbi_details`). This is a hard requirement, not a nicety: with
 * name-only entries the model cannot tell two similar functionalities apart and falls back to
 * whichever mechanism the decision cores teach. Observed failure that this test prevents: for "ein
 * Eingabefeld, in das man den 01.12.2026 und den 10.12.2026 nicht eingeben kann" the assistant
 * chose `ai.llama.standard.txtverify` and put the user's prompt into `data-cb-Question` instead of
 * `HTML.Input.Blacklist` with `data-cb-List`.
 *
 * WIDGET catalog: stays name-only — a widget is chosen by the decision cores and its template is
 * requested in the same pass, so its prose would be dead weight.
 *
 * Without a DB both methods fall back to the bundled resources (`codbi-core-elements-compact.md` /
 * `formcycle-widgets-compact.md`), so these tests exercise the real production artifacts.
 */
class CodbiCapabilitiesPass1CatalogTest {

  @Test
  fun `every element entry is advertised with what it does and when to apply it`() {
    val pass1 = CodbiCapabilities.buildSectionCondensed()
    val full = CodbiCapabilities.buildSection()

    // Same id set: nothing may vanish from pass-1 (that is the whole point of the catalog).
    assertEquals(
        CodbiCapabilities.entryIdsOf(full),
        CodbiCapabilities.entryIdsOf(pass1),
        "pass-1 must advertise exactly the ids of the full elements catalog")

    val bodies = entryBodies(pass1)
    assertTrue(bodies.size > 50, "suspiciously few entries parsed: ${bodies.size}")

    // The invariant: EVERY entry states what it does AND when to apply it.
    val withoutPurpose =
        bodies.filter { (_, body) -> !body.contains("USE WHEN", ignoreCase = true) }.keys
    assertTrue(
        withoutPurpose.isEmpty(),
        "entries without a 'USE WHEN' purpose (not decidable in pass-1): $withoutPurpose")

    val withoutWhat =
        bodies.filter { (_, body) -> body.substringBefore("USE WHEN").trim().length < 20 }.keys
    assertTrue(withoutWhat.isEmpty(), "entries without a 'what it does' sentence: $withoutWhat")
  }

  @Test
  fun `element catalog is transmitted only when the CodBi switch is on`() {
    // The form assistant dialog's CodBi switch: with the switch OFF no CodBi functionality infos
    // may
    // reach ANY pass (pass-1, blind/retry, apply) — every injection point goes through this gate.
    assertTrue(
        CodbiCapabilities.pass1ElementCatalog(true).contains("HTML.Input.Blacklist"),
        "the catalog must contain the full purpose-level entries when CodBi is ON")
    assertEquals(
        "", CodbiCapabilities.pass1ElementCatalog(false), "catalog transmitted with CodBi OFF")
  }

  @Test
  fun `pass-1 element catalog carries no parameters attributes or build syntax`() {
    val pass1 = CodbiCapabilities.buildSectionCondensed()

    // Attribute wiring and JSON skeletons belong to pass-2 (need_codbi_details).
    assertFalse(
        pass1.contains("data-cb-", ignoreCase = true),
        "attribute wiring leaked into the pass-1 element catalog")
    assertFalse(
        Regex("\\{\"className\"").containsMatchIn(pass1),
        "JSON skeletons leaked into the pass-1 element catalog")

    // Purpose-level, but still a fraction of the parameter-complete reference.
    val apiReference = resource("codbi-core-api-compact.md")
    assertTrue(
        pass1.length * 2 < apiReference.length,
        "pass-1 elements (${pass1.length}) is not clearly smaller than the API reference (${apiReference.length})")
  }

  @Test
  fun `blacklist is decidable in pass-1 and points away from txtverify`() {
    // Regression for the reported failure: a fixed set of forbidden VALUES/DATES must be mapped to
    // HTML.Input.Blacklist in the very pass that makes the decision.
    val bodies = entryBodies(CodbiCapabilities.buildSectionCondensed())
    val blacklist =
        bodies["HTML.Input.Blacklist"]
            ?: error("HTML.Input.Blacklist missing from the pass-1 element catalog")
    assertTrue(
        blacklist.contains("USE WHEN", ignoreCase = true),
        "HTML.Input.Blacklist has no USE WHEN purpose: $blacklist")
    assertTrue(
        blacklist.contains("nicht eingegeben werden", ignoreCase = true),
        "HTML.Input.Blacklist does not name the 'not enterable' trigger: $blacklist")
    assertTrue(
        blacklist.contains("must not accept", ignoreCase = true),
        "HTML.Input.Blacklist does not name the English trigger: $blacklist")

    // A user-dictated message must be wired into the ERROR COMPOSITION, not invented as a
    // parameter: the functionality has no Message parameter, its error text is
    // Prefix + List + Postfix.
    assertTrue(
        blacklist.contains("Prefix", ignoreCase = true) &&
            blacklist.contains("Postfix", ignoreCase = true) &&
            blacklist.contains("ShowBlacklist", ignoreCase = true),
        "HTML.Input.Blacklist does not teach the Prefix/Postfix/ShowBlacklist message wiring: " +
            blacklist)
    // ... and the wiring is CONDITIONAL: with no dictated message none of those parameters may be
    // configured — the built-in message is shown. The entry must state that explicitly, otherwise
    // every Blacklist would get a needless prefix/postfix.
    assertTrue(
        blacklist.contains("built-in message", ignoreCase = true),
        "HTML.Input.Blacklist does not state that the default message needs no configuration: " +
            blacklist)

    // txtverify must name Blacklist as the alternative, so the strongest rule stops absorbing it.
    val txtverify = bodies["AI.LLAMA.STANDARD.TXTVERIFY"] ?: error("txtverify entry missing")
    assertTrue(
        txtverify.contains("HTML.Input.Blacklist"),
        "txtverify does not exclude the fixed-value case: $txtverify")

    // And regex must not be used for whole values either.
    val regex = bodies["HTML.Input.REGEX"] ?: error("REGEX entry missing")
    assertTrue(
        regex.contains("HTML.Input.Blacklist"),
        "HTML.Input.REGEX does not exclude the fixed-value case: $regex")
  }

  @Test
  fun `elements preamble and group headings are preserved verbatim`() {
    val pass1 = CodbiCapabilities.buildSectionCondensed()

    assertTrue(
        pass1.contains("Element-only reference: what each functionality, element placeholder,"),
        "elements preamble was not preserved verbatim")
    assertTrue(
        pass1.contains("PASS-1 CONTRACT"),
        "the pass-1 details-request contract was dropped from the preamble")
    for (group in
        listOf("## Functionalities", "## Element Placeholders", "## Standard Configurations")) {
      assertTrue(pass1.contains(group), "group heading '$group' dropped")
    }
  }

  @Test
  fun `widgets catalog stays name-only`() {
    val nameOnly = CodbiCapabilities.buildWidgetsSectionCondensed()
    val full = CodbiCapabilities.buildWidgetsSection()

    listOf("XTextField", "XTextArea", "XButtonList", "XPage", "XMirror").forEach { widget ->
      assertTrue(nameOnly.contains("\n## $widget\n"), "widget heading '$widget' dropped")
    }
    assertFalse(
        nameOnly.contains("Single-line text input"),
        "widget prose leaked into the name-only widgets catalog")
    assertTrue(
        nameOnly.length * 2 < full.length,
        "widgets name-only (${nameOnly.length}) is not a fraction of full (${full.length})")

    // The decision-critical LABELS rule survives; the clarification-only paragraphs do not.
    assertTrue(
        nameOnly.contains("LABELS — Every interactive element you create MUST carry"),
        "the LABELS general rule was dropped from the widgets preamble")
    assertFalse(
        nameOnly.contains("REQUIRED OPTIONS — Several widgets have mandatory options"),
        "clarification-only 'REQUIRED OPTIONS' paragraph leaked back into the widgets catalog")
    assertFalse(
        nameOnly.contains("EXISTING FORM ELEMENTS —"),
        "clarification-only 'EXISTING FORM ELEMENTS' paragraph leaked back into the widgets catalog")
  }

  @Test
  fun `XMirror widget is offered to the AI and has a requestable details section`() {
    // Regression: without an XMirror entry the assistant never learns that a form element from
    // ANOTHER form can be MIRRORED (it only sees the copy path) and cannot create the widget.
    val nameOnly = CodbiCapabilities.buildWidgetsSectionCondensed()
    assertTrue(
        nameOnly.contains("\n## XMirror\n"),
        "the XMirror widget must be listed in the pass-1 widget catalog")

    val detailed = resource("prompts/formcycle-widgets.md")
    assertTrue(detailed.contains("\n## XMirror\n"), "the detailed XMirror section is missing")
    for (key in
        listOf(
            "codbi_mirror_form",
            "codbi_mirror_element",
            "codbi_mirror_element_key",
            "codbi_mirror_form_name",
            "codbi_mirror_element_name")) {
      assertTrue(detailed.contains(key), "the detailed XMirror section is missing '$key'")
    }
  }

  /** Maps every `### <id>` heading to the concatenated body text that follows it. */
  private fun entryBodies(markdown: String): Map<String, String> {
    val out = LinkedHashMap<String, StringBuilder>()
    var current: String? = null
    for (line in markdown.lines()) {
      val t = line.trim()
      when {
        t.startsWith("### ") -> {
          current = t.removePrefix("### ").trim()
          out[current] = StringBuilder()
        }
        t.startsWith("## ") || t.startsWith("# ") -> current = null
        current != null && t.isNotEmpty() -> out.getValue(current).append(t).append(' ')
      }
    }
    return out.mapValues { it.value.toString().trim() }
  }

  private fun resource(path: String): String {
    val full = "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$path"
    return CodbiCapabilitiesPass1CatalogTest::class
        .java
        .classLoader
        .getResourceAsStream(full)
        ?.bufferedReader(Charsets.UTF_8)
        ?.use { it.readText() } ?: error("bundled resource not found: $full")
  }
}
