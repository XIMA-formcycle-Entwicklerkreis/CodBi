package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the two defects observed on a live workflow build (see
 * [WorkflowSpecNormalizer]):
 *
 * 1. the AI emitted the handler CLASS as `nodeType`, which formcycle persists but cannot resolve
 *    ("no handler was registered for that node") — the node never executes;
 * 2. the FC_EMAIL body referenced `[%$Mail an A@B.C senden.RESULT.value%]` while the persisted node
 *    name lost the dots (`Mail an ABC senden`), so the result resolved to nothing.
 */
class WorkflowSpecNormalizerTest {

  @Test
  fun `the handler class is canonicalised to the registered node type`() {
    assertEquals(
        WorkflowSpecNormalizer.EXTENDED_ACCESSOR_NODE_TYPE,
        WorkflowSpecNormalizer.canonicalNodeType(WorkflowSpecNormalizer.EXTENDED_ACCESSOR_HANDLER_CLASS))
    assertEquals(
        WorkflowSpecNormalizer.EXTENDED_ACCESSOR_NODE_TYPE,
        WorkflowSpecNormalizer.canonicalNodeType(
            "de.some.other.package.CodbiExtendedAccessorNodePlugin"))
    assertEquals(
        WorkflowSpecNormalizer.EXTENDED_ACCESSOR_NODE_TYPE,
        WorkflowSpecNormalizer.canonicalNodeType("CodbiExtendedAccessor"))
    // Display labels are repaired too instead of producing an unresolvable node.
    assertEquals(
        WorkflowSpecNormalizer.EXTENDED_ACCESSOR_NODE_TYPE,
        WorkflowSpecNormalizer.canonicalNodeType("Erweiterter Zugriff"))
    assertEquals(
        WorkflowSpecNormalizer.EXTENDED_ACCESSOR_NODE_TYPE,
        WorkflowSpecNormalizer.canonicalNodeType("Extended Accessor"))
  }

  @Test
  fun `unrelated node types are left untouched`() {
    assertEquals("FC_EMAIL", WorkflowSpecNormalizer.canonicalNodeType("FC_EMAIL"))
    assertEquals("FC_MULTIPLE_CONDITION", WorkflowSpecNormalizer.canonicalNodeType(" FC_MULTIPLE_CONDITION "))
    assertEquals("", WorkflowSpecNormalizer.canonicalNodeType(null))
  }

  @Test
  fun `node names keep letters spaces and parentheses but lose punctuation`() {
    assertEquals("Mail an ABC senden", WorkflowSpecNormalizer.sanitizeName("Mail an A@B.C senden"))
    // Punctuation is DELETED (not replaced by a space) — exactly like the node-name sanitizer.
    assertEquals(
        "HTTP-Request an intranetexampleloc senden (2)",
        WorkflowSpecNormalizer.sanitizeName("HTTP-Request an intranet.example.loc senden (2)"))
    assertEquals("Antragstext straße", WorkflowSpecNormalizer.sanitizeName("Antragstext straße"))
  }

  @Test
  fun `a result placeholder follows the sanitized node name`() {
    val renames = LinkedHashMap<String, String>()
    WorkflowSpecNormalizer.collectRenames(
        mapOf("taskName" to "Mail an A@B.C senden"), renames)
    assertEquals("Mail an A@B.C senden" to "Mail an ABC senden", renames.entries.first().toPair())

    val body = "<p>[%\$Mail an A@B.C senden.RESULT.value%]</p>"
    assertEquals(
        "<p>[%\$Mail an ABC senden.RESULT.value%]</p>",
        WorkflowSpecNormalizer.rewritePlaceholders(body, renames))
  }

  @Test
  fun `other placeholders are never rewritten`() {
    val renames = mapOf("Mail an A@B.C senden" to "Mail an ABC senden")
    val body = "[%tfAntragstext%] [%\$RECORD_ATTR.key%] [%\$FORM_PROCESS_LINK%]"
    assertEquals(body, WorkflowSpecNormalizer.rewritePlaceholders(body, renames))
  }

  @Test
  fun `normalizeNode fixes node types and placeholders at every nesting depth`() {
    val spec: Map<String, Any> =
        mapOf(
            "taskName" to "Mail an A@B.C senden",
            "nodeType" to WorkflowSpecNormalizer.EXTENDED_ACCESSOR_HANDLER_CLASS,
            "nodeParams" to mapOf("fieldName" to "ed1"),
            "chainedNodes" to
                listOf(
                    mapOf(
                        "nodeType" to "FC_EMAIL",
                        "taskName" to "Mail an A@B.C",
                        "nodeParams" to
                            mapOf(
                                "body" to "[%\$Mail an A@B.C senden.RESULT.value%]",
                                "_childNodes" to
                                    listOf(
                                        mapOf(
                                            "nodeType" to
                                                WorkflowSpecNormalizer
                                                    .EXTENDED_ACCESSOR_HANDLER_CLASS,
                                            "nodeParams" to
                                                mapOf(
                                                    "fieldName" to "ed2",
                                                    "joinSeparator" to ",")))))))

    val renames = LinkedHashMap<String, String>()
    WorkflowSpecNormalizer.collectRenames(spec, renames)
    val normalized = WorkflowSpecNormalizer.normalizeNode(spec, renames)

    assertEquals(
        WorkflowSpecNormalizer.EXTENDED_ACCESSOR_NODE_TYPE, normalized["nodeType"])
    val email = (normalized["chainedNodes"] as List<*>).first() as Map<*, *>
    val body = (email["nodeParams"] as Map<*, *>)["body"] as String
    assertTrue(body.contains("[%\$Mail an ABC senden.RESULT.value%]"), "got: $body")
    assertFalse(body.contains("A@B.C"), "the raw task name must not survive in the placeholder")

    val child = ((email["nodeParams"] as Map<*, *>)["_childNodes"] as List<*>).first() as Map<*, *>
    assertEquals(WorkflowSpecNormalizer.EXTENDED_ACCESSOR_NODE_TYPE, child["nodeType"])
  }
}
