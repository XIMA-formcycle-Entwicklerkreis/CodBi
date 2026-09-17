package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `denestRepeatableContainers`.
 *
 * Formcycle forbids a repeatable (dynamic) container nested inside another repeatable container.
 * The guard flattens the inner container into the outer one. Flattening must PRESERVE the inner
 * container's fields and RE-PARENT them onto the outer container; if a promoted field keeps the
 * removed inner container as its `parentid`, Formcycle publishes it but never renders it — the
 * field appears to have been deleted (the reported "select and input fields for the opening times
 * were removed" regression, where the AI wrapped the weekday repeatable in a new repeatable
 * wrapper).
 */
class FormContainerDenestTest {

  private val assistant = AICodBiAssistant()

  private fun denest(json: String): JsonObject {
    val root = JsonParser.parseString(json).asJsonObject
    AICodBiAssistant::class
        .java
        .getDeclaredMethod("denestRepeatableContainers", JsonObject::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, root)
    return root
  }

  private fun item(root: JsonObject, name: String): JsonObject? {
    val arr = root.getAsJsonArray("items") ?: return null
    for (el in arr) {
      if (!el.isJsonObject) continue
      val obj = el.asJsonObject
      if (obj.getAsJsonObject("properties")?.get("name")?.asString == name) return obj
    }
    return null
  }

  private fun props(root: JsonObject, name: String): JsonObject? =
      item(root, name)?.getAsJsonObject("properties")

  private fun elementsOf(root: JsonObject, name: String): List<String> =
      props(root, name)?.getAsJsonArray("elements")?.map { it.asString } ?: emptyList()

  private fun parentIdOf(root: JsonObject, name: String): String? =
      props(root, name)?.get("parentid")?.takeIf { it.isJsonPrimitive }?.asString

  private fun container(
      name: String,
      id: String,
      dynamic: String,
      elements: String,
      parent: String? = null
  ): String {
    val parentProp = if (parent == null) "" else ""","parentid":"$parent""""
    return """{"className":"XContainer","properties":{"name":"$name","id":"$id","dynamic":"$dynamic","elements":[$elements]$parentProp}}"""
  }

  private fun field(name: String, id: String, parent: String): String =
      """{"className":"XTextField","properties":{"name":"$name","id":"$id","parentid":"$parent"}}"""

  @Test
  fun flattensNestedRepeatableAndReparentsFields() {
    val root =
        denest(
            """{"items":[""" +
                container("coOpeningHoursWrapper", "xi-wrap", "1", """"coOpeningHours"""") +
                "," +
                container(
                    "coOpeningHours",
                    "xi-open",
                    "1",
                    """"selWeekday","tfFromTime","tfToTime"""",
                    "xi-wrap") +
                "," +
                field("selWeekday", "xi-sel", "xi-open") +
                "," +
                field("tfFromTime", "xi-from", "xi-open") +
                "," +
                field("tfToTime", "xi-to", "xi-open") +
                "]}")

    // The inner repeatable container is gone ...
    assertNull(item(root, "coOpeningHours"))
    // ... its fields are preserved and now live directly in the outer container ...
    assertEquals(
        listOf("selWeekday", "tfFromTime", "tfToTime"), elementsOf(root, "coOpeningHoursWrapper"))
    // ... and they were re-parented, so Formcycle can render them.
    assertEquals("xi-wrap", parentIdOf(root, "selWeekday"))
    assertEquals("xi-wrap", parentIdOf(root, "tfFromTime"))
    assertEquals("xi-wrap", parentIdOf(root, "tfToTime"))
  }

  @Test
  fun flattensNestedRepeatableWithBooleanDynamicFlag() {
    val root =
        denest(
            """{"items":[""" +
                """{"className":"XContainer","properties":{"name":"wrap","id":"xi-wrap","dynamic":true,"elements":["inner"]}},""" +
                """{"className":"XContainer","properties":{"name":"inner","id":"xi-inner","dynamic":true,"elements":["fld"],"parentid":"xi-wrap"}},""" +
                field("fld", "xi-fld", "xi-inner") +
                "]}")

    assertNull(item(root, "inner"))
    assertEquals(listOf("fld"), elementsOf(root, "wrap"))
    assertEquals("xi-wrap", parentIdOf(root, "fld"))
  }

  @Test
  fun flattensDeepNestingWithoutDroppingFields() {
    val root =
        denest(
            """{"items":[""" +
                """{"className":"XContainer","properties":{"name":"panel","id":"xi-panel","elements":["grand"]}},""" +
                container("grand", "xi-grand", "1", """"wrap"""") +
                "," +
                container("wrap", "xi-wrap", "1", """"hours"""", "xi-grand") +
                "," +
                container("hours", "xi-hours", "1", """"f1","f2"""", "xi-wrap") +
                "," +
                field("f1", "xi-f1", "xi-hours") +
                "," +
                field("f2", "xi-f2", "xi-hours") +
                "]}")

    assertNull(item(root, "wrap"))
    assertNull(item(root, "hours"))
    assertTrue(item(root, "f1") != null && item(root, "f2") != null, "fields must never be dropped")
    assertEquals(listOf("f1", "f2"), elementsOf(root, "grand"))
    assertEquals("xi-grand", parentIdOf(root, "f1"))
    assertEquals("xi-grand", parentIdOf(root, "f2"))
  }

  @Test
  fun leavesNonNestedRepeatableUntouched() {
    val root =
        denest(
            """{"items":[""" +
                container("coOpeningHours", "xi-open", "1", """"selWeekday","tfFromTime"""") +
                "," +
                field("selWeekday", "xi-sel", "xi-open") +
                "," +
                field("tfFromTime", "xi-from", "xi-open") +
                "]}")

    assertTrue(item(root, "coOpeningHours") != null)
    assertEquals(listOf("selWeekday", "tfFromTime"), elementsOf(root, "coOpeningHours"))
    assertEquals("xi-open", parentIdOf(root, "selWeekday"))
  }
}
