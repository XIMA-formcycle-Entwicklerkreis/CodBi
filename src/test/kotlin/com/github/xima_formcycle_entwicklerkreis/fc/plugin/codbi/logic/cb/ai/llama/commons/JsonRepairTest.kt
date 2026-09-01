package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/** Tests for [repairAiJson] — the LLM JSON slip repairer shared by the AI assistants. */
class JsonRepairTest {

  @Test
  fun returnsBlankInputUnchanged() {
    assertEquals("", repairAiJson(""))
    assertEquals("   ", repairAiJson("   "))
  }

  @Test
  fun leavesValidJsonByteForByteUnchanged() {
    val valid = """[{"a":1,"b":[{"c":2}]}]"""
    assertEquals(valid, repairAiJson(valid))
  }

  @Test
  fun leavesPlainStringArraysUnchanged() {
    val valid = """{"caseValues":["a","b"]}"""
    assertEquals(valid, repairAiJson(valid))
  }

  @Test
  fun repairsTrailingComma() {
    assertEquals("""{"a":1,"b":[1,2]}""", repairAiJson("""{"a":1,"b":[1,2,]}"""))
  }

  @Test
  fun repairsStrayEscapedQuoteOutsideString() {
    assertEquals("""{"unit": "€"}""", repairAiJson("""{"unit": \"€\"}"""))
  }

  @Test
  fun keepsLegitimateEscapedQuoteInsideString() {
    val input = """{"a":"he said \"hi\" ok"}"""
    assertEquals(input, repairAiJson(input))
  }

  @Test
  fun insertsMissingOpeningBraceBeforeArrayObjectElement() {
    // The model dropped the `{` of the second chained node object — this is exactly the payload
    // from the production log that produced
    // "MalformedJsonException: Unterminated array ... chainedNodes[2]".
    val malformed =
        """[{"operation":"replace","targetNodeId":"1681","nodeType":"SEQUENCE","nodeParams":{"chainedNodes":[{"nodeType":"FC_EMAIL","taskName":"Fehler-Mail senden","nodeParams":{"from":"System@X.de","to":"Callari@WaXCode.net","subject":"Fehler beim HTTP-Aufruf","body":"Fehlerdetails: [%CURRENT_ERROR_MESSAGE%]"}},"nodeType":"FC_SHOW_TEMPLATE","taskName":"Abschlussseite Fehler anzeigen","nodeParams":{"htmlTemplate":"Allgemeiner Fehler 2"}}]}}]"""
    val repaired = repairAiJson(malformed)
    assertNotEquals(malformed, repaired)

    val parsed = JsonParser.parseString(repaired)
    assertTrue(parsed.isJsonArray)
    val arr = parsed.asJsonArray
    assertEquals(1, arr.size())
    val chained = arr[0].asJsonObject.getAsJsonObject("nodeParams").getAsJsonArray("chainedNodes")
    assertEquals(2, chained.size())
    assertEquals("FC_EMAIL", chained[0].asJsonObject.get("nodeType").asString)
    assertEquals("FC_SHOW_TEMPLATE", chained[1].asJsonObject.get("nodeType").asString)
    assertEquals(
        "Allgemeiner Fehler 2",
        chained[1].asJsonObject.getAsJsonObject("nodeParams").get("htmlTemplate").asString)
  }

  @Test
  fun insertsMissingOpeningBraceOnFirstArrayElement() {
    // The model drops the OPENING `{` of the second element but keeps the matching closing `}`
    // (the payload stays brace-balanced). That is the realistic failure pattern — e.g. the closing
    // `}` before `]` closes the object that was never opened.
    val malformed = """[{"x":1},"y":2}]"""
    val repaired = repairAiJson(malformed)
    val arr = JsonParser.parseString(repaired).asJsonArray
    assertEquals(2, arr.size())
    assertEquals("x", arr[0].asJsonObject.keySet().single())
    assertEquals("y", arr[1].asJsonObject.keySet().single())
  }

  @Test
  fun doesNotMangleNestedObjectArrays() {
    // Valid JSON that already has correct braces must stay identical.
    val valid = """{"outer":[{"a":1},{"b":[{"c":2}]}]}"""
    assertEquals(valid, repairAiJson(valid))
  }
}
