package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the `HTML.Select.Favorites` teaching.
 *
 * Reported case: "Füge eine Auswahl ein in der ein Bundesland ausgewählt werden kann wobei Bayern
 * und Hessen die Favoriten sein sollen. Hessen soll anfangs ausgewählt sein und auch ausgewählt
 * werden wenn der Trenner ausgewählt wird." The assistant emitted only Bayern, Hessen and a divider
 * option instead of ALL Bundeslaender, and it never set `DividerTarget` although the prompt asks
 * for it. Root cause: the documentation described the functionality as if it REPLACED the option
 * list (and the long-form section only demanded an `InitialElement` pointing at the FIRST option,
 * never mentioning `Divider`/`DividerTarget`).
 */
class SelectFavoritesRuleTest {

  private fun resource(relative: String): String =
      SelectFavoritesRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the pass-1 catalog says the favourites only MOVE options`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val entry = catalog.substringAfter("### HTML.Select.Favorites").substringBefore("\n### ")
    assertTrue(
        entry.contains("only MOVES the favourite ones"), "the entry must say options are moved")
    assertTrue(
        entry.contains("never adds, removes or filters options"),
        "the entry must say no option is ever dropped or added")
    assertTrue(
        entry.contains("keep ALL options of the select"),
        "the entry must demand the COMPLETE option list")
    for (param in listOf("Divider/DividerTarget/Favorites/InitialElement")) {
      assertTrue(entry.contains(param), "the entry must ask for '$param' in the details request")
    }
    assertTrue(
        entry.contains("beim Trenner soll X ausgewählt sein"),
        "the entry must map the divider-selection request to the functionality")
    assertTrue(
        entry.contains("soll anfangs ausgewählt sein"),
        "the entry must map the preselection request to the functionality")
  }

  @Test
  fun `the pass-2 details document all four parameters with text-vs-value`() {
    val api = resource("codbi-core-api-compact.md")
    val entry =
        api.substringAfter("- HTML.Select.Favorites:").substringBefore("\n- HTML.Select.Injection")
    assertTrue(
        entry.contains("Keeps ALL of the select's options"),
        "the details must state that the option list stays complete")
    assertTrue(
        entry.contains("never a reduced list of only the favourites"),
        "the details must forbid reducing the list to the favourites")
    assertTrue(
        entry.contains("NEVER add a divider option to the select's `options`"),
        "the details must forbid emitting the divider as an option")
    assertTrue(
        entry.contains("Favorites: The TEXTS"),
        "Favorites must be documented as matched by the option TEXT")
    assertTrue(
        entry.contains("DividerTarget: The VALUE"),
        "DividerTarget must be documented as an option VALUE")
    assertTrue(
        entry.contains("InitialElement: The VALUE"),
        "InitialElement must be documented as an option VALUE")
    assertTrue(
        entry.contains("never force it to the first option"),
        "InitialElement must not be forced to the first option any more")
  }

  @Test
  fun `the long-form reference no longer forces InitialElement and documents DividerTarget`() {
    val details = resource("prompts/codbi-functionalities.md")
    val section = details.substringAfter("## HTML.Select.Favorites").substringBefore("\n## ")
    assertFalse(
        section.contains("of the FIRST option"),
        "the old 'InitialElement = FIRST option' rule must be gone")
    assertTrue(
        section.contains("data-cb-dividertarget"),
        "the section must document the divider target parameter")
    assertTrue(
        section.contains("data-cb-initialelement"),
        "the section must document the initial element parameter")
    assertTrue(
        section.contains("data-cb-favorites"), "the section must document the favourites parameter")
    assertTrue(
        section.contains("NEVER reduce `options` to the favourites"),
        "the section must forbid reducing the option list")
    assertTrue(
        section.contains("NEVER add a \"Trenner\"/\"---\" option"),
        "the section must forbid emitting the divider as an option")
    assertTrue(
        section.contains("carry the option VALUE, data-cb-favorites carries the option TEXT"),
        "the section must state which parameter takes a value and which takes a text")
  }

  @Test
  fun `the XSelect widget entry says a favourites request never shortens the list`() {
    val widgets = resource("formcycle-widgets-compact.md")
    val entry = widgets.substringAfter("## XSelect").substringBefore("\n## ")
    assertTrue(
        entry.contains("NEVER shortens that list"),
        "the widget entry must say a prioritising request keeps the full option list")
    assertTrue(
        entry.contains("all Bundeslaender"), "the widget entry must carry the reported example")
    assertTrue(
        entry.contains("never add the divider as an option"),
        "the widget entry must forbid emitting the divider as an option")
  }
}
