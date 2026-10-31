package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * `FcWriteFormRecordAttrProps` has exactly two properties: `customAttributes` (a list of name/value
 * settings — the designer's "Modifications" table) and `writeAttributesToForm`. A node whose
 * `customAttributes` is empty writes nothing, which is why "das Serverattribut zzz auf xxx setzen"
 * produced a node with an empty Modifications table.
 */
class RecordAttributesNodeTest {

  private fun fragment(nodeParams: Map<String, Any?>): String? =
      RecordAttributesParams.fragmentJson(nodeParams)

  private fun resource(path: String): String =
      RecordAttributesNodeTest::class
          .java
          .classLoader
          .getResourceAsStream(path)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $path not found on the classpath")

  private val detailed =
      resource(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-workflow-nodes.md")
  private val compact =
      resource(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/formcycle-workflow-nodes-compact.md")
  private val taskInstruction =
      resource(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-workflow-task-instruction.md")

  // region the params builder

  @Test
  fun `a single attribute becomes the modifications list`() {
    val json = fragment(mapOf("attributes" to listOf(mapOf("name" to "zzz", "value" to "xxx"))))
    assertTrue(json != null, "the attribute must not be dropped")
    assertTrue(json!!.contains("\"customAttributes\":[{\"name\":\"zzz\",\"value\":\"xxx\"}]"), json)
    assertTrue(json.contains("\"writeAttributesToForm\":false"), json)
  }

  @Test
  fun `the real props key is accepted`() {
    val json =
        fragment(mapOf("customAttributes" to listOf(mapOf("name" to "zzz", "value" to "xxx"))))
    assertTrue(json != null && json.contains("\"name\":\"zzz\""), json ?: "null")
  }

  @Test
  fun `the designer label and a name-value map are accepted`() {
    val viaLabel =
        fragment(mapOf("modifications" to listOf(mapOf("key" to "zzz", "value" to "xxx"))))
    assertTrue(viaLabel != null && viaLabel.contains("\"name\":\"zzz\""), viaLabel ?: "null")
    val viaMap = fragment(mapOf("customAttributes" to mapOf("zzz" to "xxx")))
    assertTrue(viaMap != null && viaMap.contains("\"value\":\"xxx\""), viaMap ?: "null")
  }

  @Test
  fun `a flat key and value pair is accepted`() {
    val json = fragment(mapOf("attributeKey" to "zzz", "value" to "xxx"))
    assertTrue(json != null && json.contains("\"name\":\"zzz\""), json ?: "null")
  }

  @Test
  fun `writeAttributesToForm is carried through`() {
    val json =
        fragment(
            mapOf(
                "attributes" to listOf(mapOf("name" to "zzz", "value" to "xxx")),
                "writeAttributesToForm" to true))
    assertTrue(json != null && json.contains("\"writeAttributesToForm\":true"), json ?: "null")
  }

  @Test
  fun `nothing supplied yields no fragment`() {
    assertNull(fragment(emptyMap()))
    assertNull(fragment(mapOf("attributes" to emptyList<Any>())))
  }

  // endregion the params builder

  @Test
  fun `the references name the real property and the Modifications table`() {
    for (doc in listOf(detailed, compact)) {
      assertTrue(doc.contains("### FC_WRITE_FORM_RECORD_ATTRIBUTES"), "missing section")
      assertTrue(doc.contains("customAttributes"), "must name the real property")
      assertTrue(
          doc.contains("Modifications") || doc.contains("Modifications"),
          "must name the designer table")
      assertTrue(doc.contains("\"zzz\""), "must carry the worked example")
    }
  }

  @Test
  fun `the references no longer teach a bare attributes key`() {
    for (doc in listOf(detailed, compact)) {
      assertFalse(
          doc.contains("nodeParams\":{\"attributes\":["),
          "the node parameter is customAttributes, not attributes")
    }
    assertFalse(taskInstruction.contains("ALWAYS uses {\"attributes\":["))
  }

  @Test
  fun `the build instruction uses customAttributes in its examples`() {
    val line =
        taskInstruction.lines().first {
          it.contains("EXACT nodeParams: FC_WRITE_FORM_RECORD_ATTRIBUTES")
        }
    assertTrue(line.contains("customAttributes"), line)
  }
}
