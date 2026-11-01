package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.WorkflowSpecNormalizer
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Verifies the parameter shape the AI-produced CodBi workflow **Mirror** node ends up with.
 *
 * The tests run without a FORMCYCLE user context, i.e. the resolution of a source form / workflow
 * path is unavailable and the builder must still emit a well-formed parameter object that keeps
 * whatever the model supplied (the node is then completed by hand in the designer).
 */
class AiMirrorNodeParamsTest {

  private fun build(params: Map<String, Any>): Map<String, Any> {
    val json = AiMirrorNodeParams.build(null, params, "Pfad spiegeln", "Spiegelt den Pfad")
    val obj = JsonParser.parseString(json).asJsonObject
    return obj.entrySet().associate { (key, value) -> key to value.asString }
  }

  @Test
  fun `emits the canonical Mirror node parameter set`() {
    val resolved =
        build(
            mapOf(
                "sourceForm" to "project-42",
                "sourceFormName" to "Streuobstbefoerderung",
                "pathName" to "Freigabe bestaetigen",
                "outputMode" to "nodes"))

    assertEquals("Pfad spiegeln", resolved["name"])
    assertEquals("Spiegelt den Pfad", resolved["description"])
    assertEquals("project-42", resolved["sourceForm"])
    assertEquals("Streuobstbefoerderung", resolved["sourceFormName"])
    assertEquals("", resolved["pathId"])
    assertEquals("Freigabe bestaetigen", resolved["pathName"])
    assertEquals("NODES", resolved["outputMode"])
    assertEquals("true", resolved["autoSync"])
    assertEquals("true", resolved["syncEndpoint"])
    assertEquals("false", resolved["pauseSync"])
  }

  @Test
  fun `accepts alternative key spellings and textual flags`() {
    val resolved =
        build(
            mapOf(
                "form" to "project-7",
                "formTitle" to "Antrag",
                "path" to "Senden",
                "autoSync" to "nein",
                "syncEndpoint" to "0",
                "pauseSync" to "ja",
                "mode" to "unbekannt"))

    assertEquals("project-7", resolved["sourceForm"])
    assertEquals("Antrag", resolved["sourceFormName"])
    assertEquals("Senden", resolved["pathName"])
    assertEquals("SUMMARY", resolved["outputMode"])
    assertEquals("false", resolved["autoSync"])
    assertEquals("false", resolved["syncEndpoint"])
    assertEquals("true", resolved["pauseSync"])
  }

  @Test
  fun `keeps a numeric path id untouched`() {
    val resolved =
        build(mapOf("sourceForm" to "project-42", "pathId" to "4711", "pathName" to "Senden"))

    assertEquals("4711", resolved["pathId"])
    assertEquals("Senden", resolved["pathName"])
  }

  @Test
  fun `derives a description when none was generated`() {
    val json =
        AiMirrorNodeParams.build(
            null, mapOf("sourceForm" to "project-42", "pathName" to "Senden"), "", "")
    val description = JsonParser.parseString(json).asJsonObject.get("description").asString

    assertEquals("Mirror of Senden", description)
    assertTrue(description.startsWith("Mirror of "))
    assertFalse(description.isBlank())
  }

  @Test
  fun `canonicalises the node type spellings to the registered name`() {
    assertEquals("Mirror", WorkflowSpecNormalizer.canonicalNodeType("Mirror"))
    assertEquals("Mirror", WorkflowSpecNormalizer.canonicalNodeType("mirror"))
    assertEquals("Mirror", WorkflowSpecNormalizer.canonicalNodeType("MirrorNode"))
    assertEquals(
        "Mirror",
        WorkflowSpecNormalizer.canonicalNodeType(
            "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.MirrorNodePlugin"))
  }
}
