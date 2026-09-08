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
    // (the payload stays brace-balanced). That is the realistic failure pattern — e.g. a workflow
    // node object (`"nodeType":...,"nodeParams":...`) whose `{` was dropped, with the closing `}`
    // before `]` closing the object that was never opened. Real dropped-brace node objects are
    // always MULTI-member, so `"y":2,"z":3` mirrors a node's member run.
    val malformed = """[{"x":1},"y":2,"z":3}]"""
    val repaired = repairAiJson(malformed)
    val arr = JsonParser.parseString(repaired).asJsonArray
    assertEquals(2, arr.size())
    assertEquals("x", arr[0].asJsonObject.keySet().single())
    val second = arr[1].asJsonObject
    assertEquals(setOf("y", "z"), second.keySet())
    assertEquals(2, second.get("y").asInt)
    assertEquals(3, second.get("z").asInt)
  }

  @Test
  fun doesNotMangleNestedObjectArrays() {
    // Valid JSON that already has correct braces must stay identical.
    val valid = """{"outer":[{"a":1},{"b":[{"c":2}]}]}"""
    assertEquals(valid, repairAiJson(valid))
  }

  @Test
  fun foldsMisplacedTrailingItemMemberBackIntoItsObject() {
    // The model emitted an item's trailing `"attributes":[]` AFTER the item's closing `}` and
    // dropped the enclosing `]` of the "items" array (a form-generation failure from production).
    val malformed =
        """{"items":[{"className":"A","properties":{"name":"a"}},{"className":"B","properties":{"name":"b","options":[{"text":"Montag","value":"Montag"}]}},"attributes":[]}"""
    val repaired = repairAiJson(malformed)
    assertNotEquals(malformed, repaired)

    val parsed = JsonParser.parseString(repaired).asJsonObject
    val items = parsed.getAsJsonArray("items")
    assertEquals(2, items.size())
    // The trailing member must be folded INTO the preceding object, not left dangling or turned
    // into a spurious extra array element.
    val second = items[1].asJsonObject
    assertEquals("B", second.get("className").asString)
    assertEquals("b", second.getAsJsonObject("properties").get("name").asString)
    assertTrue(second.has("attributes"))
    assertTrue(second.get("attributes").isJsonArray)
    // The first element stays untouched.
    assertEquals("A", items[0].asJsonObject.get("className").asString)
    assertEquals("a", items[0].asJsonObject.getAsJsonObject("properties").get("name").asString)
  }

  @Test
  fun recoversUnclosedArrayWhoseCloserWasReusedByEnclosingObject() {
    // Missing `]` of the "a" array — the model reused the object's `}` to close it.
    val malformed = """{"a":[{"b":1}}"""
    val repaired = repairAiJson(malformed)
    val parsed = JsonParser.parseString(repaired).asJsonObject
    val arr = parsed.getAsJsonArray("a")
    assertEquals(1, arr.size())
    assertEquals(1, arr[0].asJsonObject.get("b").asInt)
  }

  @Test
  fun doesNotSilentlyCompleteTruncatedPayload() {
    // A payload that runs out of input in the MIDDLE of a value (here: an unterminated string — the
    // value never got its closing quote) cannot be re-balanced, so it is a cut-off answer and must
    // stay unchanged rather than being "completed" into a partial form. (A payload that merely
    // DROPS trailing closers — a missing `]`/`}` — is re-balanced instead, see
    // repairsDroppedBraceInWorkflowChildNodesArray.)
    // Unterminated string: the `"name"` value never got its closing quote (runs out mid-token), so
    // the recovery cannot re-balance it and it must be left untouched rather than "completed".
    val truncated = """{"items":[{"className":"A","properties":{"name":""" + "\"a" + """}"""
    assertEquals(truncated, repairAiJson(truncated))
  }

  @Test
  fun recoversProductionFormPayloadWithMisplacedAttributes() {
    // Faithful reproduction of the failing pass-2 response from the log: 13 form items followed by
    // `,"attributes":[]}` after the last item's closing brace (the "items" array `]` is missing).
    val malformed =
        """{"items":[
{"className":"XHeader","properties":{"name":"header1","id":"xi-header-1","maxwidth":"850px","computedwidth":"100%","minwidth":"300px","showrequiredhint":false,"print_hide":"0"}},
{"className":"XSpan","properties":{"name":"spHeader","id":"xi-sp-header","rtevalue":"Amt für Digitales"},"attributes":[]},
{"className":"XPage","properties":{"name":"p1","id":"xi-p-1","maxwidth":"850px","computedwidth":"100%","minwidth":"0px","print_hide":"0","print_text_only":"1","print_break":"0","print_size":"16"}},
{"className":"XContainer","properties":{"name":"coPerson","id":"xi-co-person","elements":["tfPhone","tfEmail"]}},
{"className":"XTextField","properties":{"name":"tfPhone","id":"xi-tf-phone","label":"Telefon","required":"1","readonly":"0","placeholder":"","datatype":"phone","fullwidth":"0","cssclasses":["CodBi_People_Phone"]},"attributes":[]},
{"className":"XTextField","properties":{"name":"tfEmail","id":"xi-tf-email","label":"E-Mail","required":"1","readonly":"0","placeholder":"","datatype":"email","fullwidth":"0","cssclasses":["CodBi_People_Mail"]},"attributes":[]},
{"className":"XContainer","properties":{"name":"coAddress","id":"xi-co-address","elements":["tfStreet","tfHouseNumber","tfPLZ","tfCity"]}},
{"className":"XTextField","properties":{"name":"tfStreet","id":"xi-tf-street","label":"Straße","required":"1","readonly":"0","placeholder":"","datatype":"","fullwidth":"0"},"attributes":[]},
{"className":"XTextField","properties":{"name":"tfHouseNumber","id":"xi-tf-housenumber","label":"Hausnummer","required":"1","readonly":"0","placeholder":"","datatype":"","fullwidth":"0"},"attributes":[]},
{"className":"XTextField","properties":{"name":"tfPLZ","id":"xi-tf-plz","label":"PLZ","required":"1","readonly":"0","placeholder":"","datatype":"plzDE","fullwidth":"0","value":"91522","cssclasses":["CodBi_People_PLZ"]},"attributes":[]},
{"className":"XTextField","properties":{"name":"tfCity","id":"xi-tf-city","label":"Ort","required":"1","readonly":"0","placeholder":"","datatype":"","fullwidth":"0","value":"Ansbach"},"attributes":[]},
{"className":"XContainer","properties":{"name":"coOpeningHours","id":"xi-co-openinghours","elements":["selWeekday","coTimeBlocks"]}},
{"className":"XSelect","properties":{"name":"selWeekday","id":"xi-sel-weekday","label":"Wochentag","required":"1","fullwidth":"0","options":[{"text":"Montag","value":"Montag"},{"text":"Dienstag","value":"Dienstag"},{"text":"Mittwoch","value":"Mittwoch"},{"text":"Donnerstag","value":"Donnerstag"},{"text":"Freitag","value":"Freitag"},{"text":"Samstag","value":"Samstag"},{"text":"Sonntag","value":"Sonntag"}]}},"attributes":[]}"""
    val repaired = repairAiJson(malformed)

    val parsed = JsonParser.parseString(repaired).asJsonObject
    val items = parsed.getAsJsonArray("items")
    assertEquals(13, items.size())
    val last = items[12].asJsonObject
    assertEquals("XSelect", last.get("className").asString)
    // The misplaced trailing member ended up attached to the select item.
    assertTrue(last.has("attributes"))
    val options = last.getAsJsonObject("properties").getAsJsonArray("options")
    assertEquals(7, options.size())
    // Spot-check the first and one middle item survived verbatim.
    assertEquals("XHeader", items[0].asJsonObject.get("className").asString)
    assertEquals(
        "tfEmail", items[5].asJsonObject.getAsJsonObject("properties").get("name").asString)
  }

  @Test
  fun repairsDroppedBraceInWorkflowChildNodesArray() {
    // Faithful reproduction of the workflow retry from the production log that failed with
    // "MalformedJsonException: Unterminated array ... $.nodeParams._childNodes[4]". The model
    // dropped the opening `{` of the FC_SHOW_TEMPLATE element inside `_childNodes` (the element
    // key `"nodeType":...` starts the object but the brace is missing; the closing `}` before `]`
    // was reused).
    val malformed =
        """{"taskName":"E-Mail mit Öffnungszeiten senden","taskDescription":"","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnSubmit"},"nodeType":"FC_EXPERIMENT","nodeParams":{"_childNodes":[{"nodeType":"FC_WRITE_FORM_RECORD_ATTRIBUTES","nodeParams":{"attributes":[{"name":"openingHours","value":""}],"writeAttributesToForm":false}},{"nodeType":"FC_FOR_EACH_LOOP","nodeParams":{"fieldTechnicalId":"tfVon1","sourceType":"FORM_FIELD_REPETITIONS","_childNodes":[{"nodeType":"FC_WRITE_FORM_RECORD_ATTRIBUTES","nodeParams":{"attributes":[{"name":"openingHours","value":"[%${'$'}RECORD_ATTR.openingHours%],<p>[%selWochentag%]: [%tfVon1%] - [%tfBis1%]</p>"}],"writeAttributesToForm":false}}]}},{"nodeType":"FC_EMAIL","nodeParams":{"to":"Testamt@Ansbach.de","from":"Intranet@Ansbach.de","subject":"Neue Öffnungszeiten","body":"<p>Adresse: [%tfStrasse%] [%tfHausnummer%], [%tfPLZ%] [%tfOrt%]</p><p>Kontakt: [%tfVorname%] [%tfNachname%], E-Mail: [%tfEmail%], Telefon: [%tfTelefon%]</p><p>Öffnungszeiten:</p>[%${'$'}RECORD_ATTR.openingHours%]"}},"nodeType":"FC_SHOW_TEMPLATE","nodeParams":{"htmlTemplate":"Submission successful"}}],"_handlerChildNodes":[{"nodeType":"FC_SHOW_TEMPLATE","nodeParams":{"htmlTemplate":"Allgemeiner Fehler 2"}}]}"""
    val repaired = repairAiJson(malformed)
    assertNotEquals(malformed, repaired)

    val root = JsonParser.parseString(repaired).asJsonObject
    val child = root.getAsJsonObject("nodeParams").getAsJsonArray("_childNodes")
    assertEquals(4, child.size())
    assertEquals("FC_WRITE_FORM_RECORD_ATTRIBUTES", child[0].asJsonObject.get("nodeType").asString)
    assertEquals("FC_FOR_EACH_LOOP", child[1].asJsonObject.get("nodeType").asString)
    assertEquals("FC_EMAIL", child[2].asJsonObject.get("nodeType").asString)
    assertEquals("FC_SHOW_TEMPLATE", child[3].asJsonObject.get("nodeType").asString)
    assertEquals(
        "Submission successful",
        child[3].asJsonObject.getAsJsonObject("nodeParams").get("htmlTemplate").asString)
  }
}
