package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * `FcDeleteAttachmentProps` has ONE property, `attachmentsToDelete` (a `MultiAttachment` with
 * `attachments`, `searchFilenamePattern` and `searchSourceTypes`). A user who names a FILE ("den
 * Anhang KOALA.JPG löschen") means a name SEARCH — not "delete whatever is in an upload field",
 * which is what the old `{"attachments":["<field id>"]}` documentation produced.
 */
class DeleteAttachmentNodeTest {

  private fun resource(path: String): String =
      DeleteAttachmentNodeTest::class
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
  private val clarification =
      resource(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md")

  @Test
  fun `the references document the real property and the name search`() {
    for (doc in listOf(detailed, compact)) {
      assertTrue(doc.contains("attachmentsToDelete"), "missing the real property name")
      assertTrue(doc.contains("searchFilenamePattern"), "missing the name-search key")
      assertTrue(doc.contains("\"SEARCH\""), "missing the SEARCH item type")
    }
  }

  @Test
  fun `the references no longer teach an upload-field-only identifier list`() {
    for (doc in listOf(detailed, compact)) {
      assertFalse(
          doc.contains("The 'attachments' array must contain the technical IDs"),
          "the old upload-field-only instruction must be gone")
      assertFalse(
          doc.contains("Deletes attachments from the specified upload fields"),
          "the node must not be described as an upload-field-only delete")
    }
  }

  @Test
  fun `the build instruction emits the search shape for a named file`() {
    val line = taskInstruction.lines().first { it.contains("FC_DELETE_ATTACHMENT") }
    assertTrue(line.contains("searchFilenamePattern"), "must emit the pattern")
    assertTrue(line.contains("\"type\":\"SEARCH\""), "must emit the SEARCH item")
    assertTrue(line.contains("KOALA.JPG"), "must show the named-file example")
    assertTrue(line.contains("NEVER emit the old shape"), "must forbid the old attachments shape")
  }

  @Test
  fun `the clarification round never asks which upload field holds the named file`() {
    val idx = clarification.indexOf("RECORD-LEVEL NODES WITH NOTHING TO CLARIFY")
    assertTrue(idx > 0, "the clarification prompt must carry the rule")
    val rule = clarification.substring(idx, minOf(clarification.length, idx + 1200)).lowercase()
    assertTrue(rule.contains("never ask which upload field"), "must forbid the field question")
    assertTrue(rule.contains("searchfilenamepattern"), "must name the pattern key")
  }

  @Test
  fun `the known attachment sources cover the searchable ones`() {
    val types = WorkflowAttachmentSources.TYPES
    for (expected in listOf("FORM_UPLOAD", "WORKFLOW", "INBOX", "CHAT_MESSAGE", "REST_API")) {
      assertTrue(expected in types, "missing source $expected")
    }
    // The resolver always filters the preserved original out of a name search.
    assertFalse("FORM_UPLOAD_PRESERVED_ORIGINAL" in types)
  }
}
