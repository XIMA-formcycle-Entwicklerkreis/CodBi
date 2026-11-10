package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported prompt:
 *
 * `Gib in der Konsole das Header-Element aus.`
 *
 * The assistant emitted `{ XHeader > header1 }` — a Formcycle WIDGET TYPE used as an EP id, with a
 * bare element name as its "parameter". `DOM.Query`
 * ([`dom.query.ts`](src/main/web/packages/form/src/js/EPs/dom.query.ts): one parameter, validated
 * as a CSS selector, `document.querySelector(...)`, returns the `Element`) is the EP that acquires
 * rendered page elements: `{ DOM.Query > #xi-header-1 }` (element id) or `{ DOM.Query > .header1 }`
 * (element name, rendered as a CSS class).
 *
 * Root causes covered:
 * 1. the pass-1 entry only said "Queries an element from the DOM / a value must be read from the
 *    page" — neither the CSS selector nor the "widget type is not an EP" boundary was stated;
 * 2. the API reference and the details index declared `Parameters: none.` / `"parameters": {}`;
 * 3. no rule existed that the `className` values of the form JSON (`XHeader`, `XSpan`, …) are never
 *    EP ids.
 */
class DomQueryElementRuleTest {

  private fun prompt(name: String): String =
      DomQueryElementRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun resource(relative: String): String =
      DomQueryElementRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the EP reference teaches DOM Query as the element-acquiring EP`() {
    val section =
        prompt("codbi-element-placeholders.md")
            .substringAfter("## DOM.Query\n")
            .substringBefore("\n## ")
    assertTrue(section.isNotBlank(), "the EP reference must contain a DOM.Query section")
    assertTrue(section.contains("CSS SELECTOR string"), "the selector parameter must be named")
    assertTrue(section.contains("`#xi-header-1`"), "the id form of the selector must be shown")
    assertTrue(section.contains("`.header1`"), "the name-as-class form must be shown")
    assertTrue(
        section.contains("THE EP for acquiring DOM ELEMENTS"), "its purpose must be explicit")
    assertTrue(section.contains("Reported failure"), "the reported failure must be documented")
    assertTrue(section.contains("{ XHeader > header1 }"), "the wrong EP must appear verbatim")
    assertTrue(
        section.contains("CORRECT: `{ DOM.Query > #xi-header-1 }`"), "the correct EP must be shown")
    assertTrue(section.contains("FORMCYCLE WIDGET TYPE"), "the widget-type boundary must be stated")
  }

  @Test
  fun `the pass-1 entry names the selector and forbids widget types`() {
    val entry =
        resource("codbi-core-elements-compact.md")
            .substringAfter("### DOM.Query\n")
            .substringBefore("\n### ")
    assertTrue(entry.contains("CSS SELECTOR"), "pass-1 must name the CSS selector")
    assertTrue(entry.contains("NEVER a widget type"), "pass-1 must exclude widget types")
    assertTrue(entry.contains("#<element id>"), "pass-1 must show the id selector form")
    assertFalse(
        entry.contains("Queries an element from the DOM."), "the vague wording must be gone")
  }

  @Test
  fun `the API reference and the details index declare the selector parameter`() {
    val apiEntry =
        resource("codbi-core-api-compact.md").substringAfter("- DOM.Query:").substringBefore("- F:")
    assertFalse(
        apiEntry.contains("Parameters: none."), "the API reference must not say 'no parameters'")
    assertTrue(apiEntry.contains("CSS SELECTOR string"), "the API reference must name the selector")
    assertTrue(
        apiEntry.contains("WRONG (reported failure): `{ XHeader > header1 }`"),
        "the API reference must keep the reported failure")
    assertTrue(
        apiEntry.contains("are Formcycle `className` values, not EPs"),
        "the API reference must state that widget types are not EPs")

    val indexEntry =
        resource("codbi-core-details-index.json")
            .substringAfter("\"DOM.Query\": {")
            .substringBefore("\"F\": {")
    assertFalse(
        indexEntry.contains("\"parameters\": {}"), "the index must declare the selector parameter")
    assertTrue(indexEntry.contains("CSS-Selector"), "the index must document the CSS selector")
    assertTrue(indexEntry.contains("XHeader"), "the index must carry the widget-type warning")
  }

  @Test
  fun `the always-sent rules forbid widget types as EP ids`() {
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(
        canonical.contains("FORMCYCLE WIDGET TYPES ARE NOT EPs"),
        "the canonical rules must state that widget types are never EP ids")
    assertTrue(
        canonical.contains("{ XHeader > header1 }"),
        "the wrong EP must be in the always-sent rules")
    assertTrue(
        canonical.contains("{ DOM.Query > #xi-header-1 }"),
        "the correct EP must be in the always-sent rules")
    assertFalse(canonical.contains("<!--SECTION:"), "the canonical rules must stay ungated")
  }

  @Test
  fun `every decision core and the field map carry the rule`() {
    for (file in
        listOf("codbi-general.md", "codbi-general.decision.md", "codbi-general-rethink.md")) {
      val text = prompt(file)
      assertTrue(
          text.contains("FORMCYCLE WIDGET TYPES ARE NOT EPs"),
          "$file must state that widget types are never EP ids")
      assertTrue(text.contains("{ DOM.Query > #xi-header-1 }"), "$file must show the correct EP")
    }
    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(
        task.contains("'Gib das Header-Element aus'"),
        "the field-creation map must carry the reported request")
    assertTrue(
        task.contains("`{ XHeader > header1 }` does not exist"),
        "the mapping must forbid the widget-type EP")
  }
}
