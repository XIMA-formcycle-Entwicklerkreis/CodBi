package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * FC_RENEW_PROCESS_ID mints a new process ID for the CURRENT record. `FcRenewProcessIdProps` is
 * EMPTY (it only inherits name/description from BaseActionProps) and the executor always generates a
 * full UUID itself, so the node must be documented as parameterless and the assistant must never ask
 * the user for a prefix/mask/value.
 */
class RenewProcessIdNodeTest {

  private fun resource(path: String): String =
      RenewProcessIdNodeTest::class
          .java
          .classLoader
          .getResourceAsStream(path)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $path not found on the classpath")

  private val detailed =
      resource("com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-workflow-nodes.md")
  private val compact =
      resource(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/formcycle-workflow-nodes-compact.md")
  private val taskInstruction =
      resource(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-workflow-task-instruction.md")
  private val clarification =
      resource("com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md")

  @Test
  fun `both workflow references document the node as parameterless`() {
    for (doc in listOf(detailed, compact)) {
      assertTrue(doc.contains("### FC_RENEW_PROCESS_ID"), "missing node section")
      assertTrue(doc.contains("nodeParams: {}"), "the node must be documented without parameters")
    }
  }

  @Test
  fun `the references forbid faking it with a field or an attribute`() {
    for (doc in listOf(detailed, compact)) {
      assertTrue(doc.contains("FC_CHANGE_FORM_VALUE"), "must rule out the form-value node")
      assertTrue(doc.contains("FC_WRITE_FORM_RECORD_ATTRIBUTES"), "must rule out record attributes")
    }
  }

  @Test
  fun `the build instruction routes the intent to the node`() {
    val line = taskInstruction.lines().first { it.contains("FC_RENEW_PROCESS_ID") }
    assertTrue(line.contains("neue Prozess-ID"), "the German phrasing must be recognised")
    assertTrue(line.contains("renew the process id"), "the English phrasing must be recognised")
    assertTrue(line.contains("\"nodeParams\":{}"), "the build must emit empty nodeParams")
  }

  @Test
  fun `the clarification round never asks for an ID format`() {
    val idx = clarification.indexOf("RECORD-LEVEL NODES WITH NOTHING TO CLARIFY")
    assertTrue(idx > 0, "the clarification prompt must carry the rule")
    val rule = clarification.substring(idx, minOf(clarification.length, idx + 1200)).lowercase()
    assertTrue(rule.contains("never ask for a prefix"), "prefix questions must be forbidden")
    assertTrue(rule.contains("fc_renew_process_id"), "the rule must name the node")
  }

  @Test
  fun `the node type accepts its display labels`() {
    for (raw in
        listOf(
            "FC_RENEW_PROCESS_ID",
            "FC_RENEW_PROCESSID",
            "Create new process ID",
            "Neue Prozess-ID vergeben",
            "Maak nieuw Process ID van formulier record",
            "Assegnare un nuovo ID di processo")) {
      assertEquals("FC_RENEW_PROCESS_ID", WorkflowSpecNormalizer.canonicalNodeType(raw), raw)
    }
  }
}
