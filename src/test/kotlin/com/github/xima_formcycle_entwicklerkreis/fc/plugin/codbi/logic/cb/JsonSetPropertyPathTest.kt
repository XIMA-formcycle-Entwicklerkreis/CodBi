package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported: "Füge ein Eingabefeld hinzu und setzen dessen style.scale eigenschaft auf 2." — the
 * assistant did not recognise that the request names a PROPERTY of the element it just created and
 * therefore never applied `JSON.SET`.
 *
 * `JSON.SET` is exactly that: it assigns `ToSet` to `Property` of the object the optional dotted
 * `Path` resolves from the tagged element. Two causes were fixed:
 * 1. TEACHING — every prompt described `JSON.SET` only as "store JSON in a hidden field", and the
 *    long-form reference even documented `Path` as "leading from the property onward" (the opposite
 *    of the code). All of them now describe the property/Path/Property split with the reported
 *    sentence as the worked example.
 * 2. STRUCTURE — a model that puts the whole path into `data-cb-property`
 *    (`property="style.scale"`) produced a value the runtime rejects.
 *    `splitDottedJsonSetProperty()` moves the leading segments into `data-cb-path`, which is a
 *    faithful rewrite of the same intent (`element.style.scale`).
 */
class JsonSetPropertyPathTest {

  private val assistant = AICodBiAssistant()

  private fun resource(path: String): String =
      JsonSetPropertyPathTest::class
          .java
          .classLoader
          .getResourceAsStream(path)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("resource $path missing")

  private fun prompt(name: String): String =
      resource("com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")

  private fun item(attributes: JsonArray): JsonArray {
    val item = JsonObject()
    item.addProperty("className", "XTextField")
    val props = JsonObject()
    props.add("attributes", attributes)
    item.add("properties", props)
    return JsonArray().also { it.add(item) }
  }

  private fun attr(name: String, value: String): JsonObject =
      JsonObject().also {
        it.addProperty("text", name)
        it.addProperty("value", value)
      }

  private fun props(items: JsonArray): JsonObject =
      items[0].asJsonObject.getAsJsonObject("properties")

  /** Reads a `data-cb-*` value exactly like the runtime does: `attributes` entry OR direct key. */
  private fun value(items: JsonArray, key: String): String? {
    val props = props(items)
    props
        .get(key)
        ?.takeIf { it.isJsonPrimitive }
        ?.let {
          return it.asString
        }
    val attrs = props.getAsJsonArray("attributes") ?: return null
    for (e in attrs) {
      val o = e.asJsonObject
      if (o.get("text")?.asString.equals(key, ignoreCase = true)) {
        return o.get("value")?.asString
      }
    }
    return null
  }

  @Test
  fun `the reported dotted property is split into path and property`() {
    val items =
        item(
            JsonArray().also {
              it.add(attr("data-cb-func", "JSON.SET"))
              it.add(attr("data-cb-property", "style.scale"))
              it.add(attr("data-cb-toset", "2"))
            })

    assertEquals(1, assistant.splitDottedJsonSetProperty(items), "one item must be repaired")

    assertEquals("style", value(items, "data-cb-path"), "leading segment moves into the path")
    assertEquals("scale", value(items, "data-cb-property"), "last segment becomes the property")
    assertEquals("2", value(items, "data-cb-toset"), "the value is never touched")
  }

  @Test
  fun `an already present path is extended, not replaced`() {
    val items =
        item(
            JsonArray().also {
              it.add(attr("data-cb-func", "JSON.SET"))
              it.add(attr("data-cb-path", "firstChild"))
              it.add(attr("data-cb-property", "style.display"))
              it.add(attr("data-cb-toset", "none"))
            })

    assertEquals(1, assistant.splitDottedJsonSetProperty(items))
    assertEquals("firstChild.style", value(items, "data-cb-path"))
    assertEquals("display", value(items, "data-cb-property"))
    assertEquals("none", value(items, "data-cb-toset"))
  }

  @Test
  fun `a dot-free property and a non JSON SET item stay untouched`() {
    val plain =
        item(
            JsonArray().also {
              it.add(attr("data-cb-func", "JSON.SET"))
              it.add(attr("data-cb-property", "value"))
              it.add(attr("data-cb-toset", "x"))
            })
    assertEquals(0, assistant.splitDottedJsonSetProperty(plain))
    assertNull(value(plain, "data-cb-path"), "no path may be invented")

    val other =
        item(
            JsonArray().also {
              it.add(attr("data-cb-func", "HTML.SETAttribute"))
              it.add(attr("data-cb-property", "style.scale"))
              it.add(attr("data-cb-toset", "2"))
            })
    assertEquals(0, assistant.splitDottedJsonSetProperty(other))
    assertEquals("style.scale", value(other, "data-cb-property"), "foreign functionality untouched")
  }

  @Test
  fun `the direct-key representation is handled as well`() {
    val items = item(JsonArray())
    val props = props(items)
    props.addProperty("data-cb-func", "JSON.SET")
    props.addProperty("data-cb-property", "style.scale")
    props.addProperty("data-cb-toset", "2")

    assertEquals(1, assistant.splitDottedJsonSetProperty(items))
    assertEquals("style", value(items, "data-cb-path"))
    assertEquals("scale", value(items, "data-cb-property"))
  }

  @Test
  fun `the reference documents the split with the reported example`() {
    val api =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md")
    assertTrue(
        api.contains("data-cb-path=\"style\" + data-cb-property=\"scale\" + data-cb-toset=\"2\""),
        "the pass-2 reference must show the exact wiring")
    assertTrue(
        api.contains("the LAST segment of the requested dotted path"),
        "the reference must define Property as the last segment")
    assertTrue(
        api.contains("the OPTIONAL dotted path FROM the tagged element TO the object"),
        "the reference must define Path correctly (from the element, not from the property)")

    val catalog =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-elements-compact.md")
    val entry = catalog.substringAfter("### JSON.SET\n")
    assertTrue(
        entry.contains("Sets a named PROPERTY of the element"),
        "the pass-1 entry must describe property setting, not only hidden JSON")
    assertTrue(entry.contains("style.scale"), "the pass-1 entry must name the reported path")
  }

  @Test
  fun `every build prompt carries the property rule`() {
    listOf(
            "codbi-form-task-instruction.md",
            "codbi-general.decision.md",
            "codbi-general-rethink.md",
            "codbi-functionalities.md")
        .forEach { name ->
          val text = prompt(name)
          assertTrue(text.contains("style.scale"), "$name must name the reported property path")
          assertTrue(text.contains("LAST dot"), "$name must teach the split at the last dot")
        }
  }
}
