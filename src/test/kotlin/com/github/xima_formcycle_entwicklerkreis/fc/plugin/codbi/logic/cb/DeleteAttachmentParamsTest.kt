package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The AI sends the REAL props shape (`attachmentsToDelete`), and the builder used to read only flat
 * keys — so a correct model answer still produced an FC_DELETE_ATTACHMENT node without any selection.
 * The payload below is the one observed in the production log.
 */
class DeleteAttachmentParamsTest {

  private fun fragment(nodeParams: Map<String, Any?>): String? =
      DeleteAttachmentParams.fragmentJson(nodeParams)

  @Test
  fun `the observed nested search payload becomes attachmentsToDelete`() {
    val nodeParams =
        mapOf(
            "attachmentsToDelete" to
                mapOf(
                    "attachments" to listOf(mapOf("type" to "SEARCH")),
                    "searchFilenamePattern" to "KOALA.JPG"))
    val json = fragment(nodeParams)
    assertTrue(json != null && json.startsWith("\"attachmentsToDelete\":{"))
    assertTrue(json!!.contains("\"attachments\":[{\"type\":\"SEARCH\"}]"))
    assertTrue(json.contains("\"searchFilenamePattern\":\"KOALA.JPG\""))
  }

  @Test
  fun `a flat shape is accepted as well`() {
    val json = fragment(mapOf("fileName" to "KOALA.JPG"))
    assertTrue(json != null && json.contains("\"searchFilenamePattern\":\"KOALA.JPG\""))
    assertTrue(json!!.contains("\"type\":\"SEARCH\""))
  }

  @Test
  fun `a nested upload item keeps the field technical id`() {
    val json =
        fragment(
            mapOf(
                "attachmentsToDelete" to
                    mapOf(
                        "attachments" to
                            listOf(mapOf("type" to "UPLOAD", "identifier" to "uplAnhang")))))
    assertTrue(json != null && json.contains("\"type\":\"UPLOAD\""))
    assertTrue(json!!.contains("\"identifier\":\"uplAnhang\""))
    // No pattern → no SEARCH item (the pattern is only meaningful with one).
    assertFalse(json.contains("\"SEARCH\""))
  }

  @Test
  fun `search and upload can be combined`() {
    val json =
        fragment(
            mapOf(
                "attachmentsToDelete" to
                    mapOf(
                        "attachments" to
                            listOf(mapOf("type" to "SEARCH"), mapOf("type" to "UPLOAD", "identifier" to "uplA")),
                        "searchFilenamePattern" to "*.pdf")))
    assertTrue(json != null && json.contains("\"SEARCH\"") && json.contains("\"uplA\""))
  }

  @Test
  fun `source types are normalised and filtered to the known values`() {
    val json =
        fragment(
            mapOf(
                "attachmentsToDelete" to
                    mapOf(
                        "attachments" to listOf(mapOf("type" to "SEARCH")),
                        "searchFilenamePattern" to "KOALA.JPG",
                        "searchSourceTypes" to
                            listOf("form_upload", "NotASource", "WORKFLOW"))))
    assertTrue(json != null && json.contains("\"searchSourceTypes\":[\"FORM_UPLOAD\",\"WORKFLOW\"]"))
  }

  @Test
  fun `nothing to delete yields no fragment`() {
    assertNull(fragment(emptyMap()))
    assertNull(fragment(mapOf("attachments" to listOf(mapOf("type" to "PREVIOUS_NODE")))))
    assertEquals(null, fragment(mapOf("fileName" to "   ")))
  }
}
