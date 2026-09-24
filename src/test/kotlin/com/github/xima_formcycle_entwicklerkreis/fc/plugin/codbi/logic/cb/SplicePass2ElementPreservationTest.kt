package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

/**
 * Regression tests for [`AICodBiAssistant.splicePass2IntoPass1`] element-preservation guard.
 *
 * Reported bug: after a text + calc generation request, a follow-up request that only modifies the
 * calculator caused the AI to MERGE the separate existing elements (a dedicated text element
 * `spKIAdvantages` + a calculator `spCalculator`) into ONE new element
 * (`spKIAIAdvantagesCalculator`). The old reconciliation logic then dropped the two originals
 * because they were no longer referenced by the re-authored container's `elements` array, silently
 * removing the untouched text element.
 *
 * The guard only drops a pre-existing pass-1 child when the AI has EXPLICITLY listed that child in
 * the `_removedItems` array. Omitting a child from a re-authored `elements` array (as happens when
 * the AI merges elements) must NOT by itself remove it, while genuine user-requested removals via
 * `_removedItems` must keep working.
 */
class SplicePass2ElementPreservationTest {

  private val assistant = AICodBiAssistant()

  private fun splice(pass1: String, pass2: String): String =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("splicePass2IntoPass1", String::class.java, String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, pass1, pass2) as String

  private fun item(json: String, name: String): JsonObject? {
    val root = JsonParser.parseString(json).asJsonObject
    return root
        .getAsJsonArray("items")
        ?.firstOrNull { el ->
          el.isJsonObject &&
              el.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString == name
        }
        ?.asJsonObject
  }

  private val pass1Form =
      """
      {"items":[
        {"className":"XPage","properties":{"name":"spPage1","id":"xi-page1","elements":["spKIAdvantages","spCalculator"]}},
        {"className":"XSpan","properties":{"name":"spKIAdvantages","id":"xi-adv","parentid":"xi-page1","html":"<p>Vorteile</p>"}},
        {"className":"XHtml","properties":{"name":"spCalculator","id":"xi-calc","parentid":"xi-page1","html":"<script>function calc(){}</script>"}}
      ]}
      """
          .trimIndent()

  @Test
  fun `separate elements are preserved when pass2 merges them into one new element`() {
    // Pass-2 returns a SINGLE merged element that contains both the advantages text AND the
    // calculator, referenced from the page, and does NOT list the original two in _removedItems.
    val pass2 =
        """
        {"items":[
          {"className":"XPage","properties":{"name":"spPage1","id":"xi-page1","elements":["spKIAIAdvantagesCalculator"]}},
          {"className":"XHtml","properties":{"name":"spKIAIAdvantagesCalculator","id":"xi-merged","parentid":"xi-page1","html":"<p>Vorteile</p><script>function calc(){}</script>"}}
        ]}
        """
            .trimIndent()

    val result = splice(pass1Form, pass2)

    // The untouched originals must survive even though the AI merged them away.
    assertNotNull(item(result, "spKIAdvantages"), "text element must be preserved")
    assertNotNull(item(result, "spCalculator"), "calculator element must be preserved")
  }

  @Test
  fun `explicitly removed child is still honored`() {
    // Pass-2 lists spCalculator in _removedItems: it must be dropped, the untouched text stays.
    val pass2 =
        """
        {"_removedItems":["spCalculator"],
         "items":[
          {"className":"XPage","properties":{"name":"spPage1","id":"xi-page1","elements":["spKIAdvantages"]}},
          {"className":"XSpan","properties":{"name":"spKIAdvantages","id":"xi-adv","parentid":"xi-page1","html":"<p>Vorteile</p>"}}
        ]}
        """
            .trimIndent()

    val result = splice(pass1Form, pass2)

    assertNotNull(item(result, "spKIAdvantages"), "untouched text element must be preserved")
    assertNull(item(result, "spCalculator"), "explicitly removed calculator must be dropped")
  }
}
