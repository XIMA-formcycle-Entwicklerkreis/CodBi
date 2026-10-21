package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Coverage guard for the CodBi "Extended Accessor" workflow node
 * (`CodbiExtendedAccessorNodePlugin`).
 *
 * The node reads ONE form element and exposes its raw value as a workflow RESULT, which is the only
 * way a rich-text/TinyMCE value reaches a mail body unescaped. The AI could not use it at all until
 * the node was documented in BOTH prompt catalogues and mapped in the node-params builders — a
 * silent regression (deleting an entry, renaming a parameter, dropping the `$` from the result
 * placeholder) would leave the assistant unable to answer "the HTML arrives escaped" requests
 * again. These assertions pin the three places that must stay in sync:
 *
 * 1. the pass-1 compact catalogue (`compact.formcycle_workflow_nodes`) — the node must be offered,
 * 2. the pass-2 detailed catalogue (`formcycle.workflow_nodes.node_types.*`) — the exact
 *    `nodeParams` the builder consumes must be documented,
 * 3. the workflow build instruction — the "use this node" rule and the SYSTEM-placeholder syntax.
 */
class ExtendedAccessorPromptCoverageTest {

  private val resourceBase =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/"

  private val nodeFqcn = WorkflowSpecNormalizer.EXTENDED_ACCESSOR_HANDLER_CLASS

  /** The name the node handler is REGISTERED under — the only valid `nodeType`. */
  private val registeredNodeType = WorkflowSpecNormalizer.EXTENDED_ACCESSOR_NODE_TYPE

  private val compactResource = "formcycle-workflow-nodes-compact.md"
  private val detailedResource = "prompts/formcycle-workflow-nodes.md"
  private val instructionResource = "prompts/codbi-workflow-task-instruction.md"

  private fun read(resource: String): String =
      ExtendedAccessorPromptCoverageTest::class
          .java
          .classLoader
          .getResourceAsStream(resourceBase + resource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")

  /**
   * The `nodeParams` keys the AI emits and `buildNodeParamsJson` maps into
   * `CodbiExtendedAccessorNodeProps`. `name`/`description` come from `BaseActionProps` and are
   * passed by every builder, so they are not listed here.
   */
  private val documentedParamKeys =
      listOf(
          "fieldName",
          "repetitionMode",
          "repetitionIndex",
          "joinSeparator",
          "includeMeta",
          "sanitizeHtml",
          "htmlToText",
          "allowImages",
          "allowLinks",
          "allowTables",
          "allowStyles")

  @Test
  fun `the compact catalogue offers the node as its own ### section`() {
    val compact = read(compactResource)
    // CompactPromptLoader/seedSplitFile only creates a `compact.…node_types.<name>` record for a
    // `###` heading, so the heading form is what makes the node visible in pass 1.
    assertTrue(
        compact.contains("### CodbiExtendedAccessor ($nodeFqcn)"),
        "the compact workflow-node catalogue must list CodbiExtendedAccessor as a ### section " +
            "including its fully-qualified class name (otherwise the AI never sees the node)")
    // The first line carries the purpose and is the ONLY line shipped to pass 1.
    val entryLine =
        compact
            .lineSequence()
            .dropWhile { !it.startsWith("### CodbiExtendedAccessor") }
            .drop(1)
            .firstOrNull { it.isNotBlank() }
            .orEmpty()
    assertTrue(
        entryLine.startsWith("CodbiExtendedAccessor ($nodeFqcn) —"),
        "the compact entry's first line must keep the 'NAME — purpose' form, got: $entryLine")
    assertTrue(
        entryLine.contains("RESULT", ignoreCase = true) &&
            entryLine.contains("escap", ignoreCase = true),
        "the compact purpose line must say that the node returns an UNESCAPED result, " +
            "otherwise pass 1 cannot decide to use it for rich-text values: $entryLine")
  }

  @Test
  fun `the detailed catalogue documents every nodeParams key`() {
    val detailed = read(detailedResource)
    assertTrue(
        detailed.contains("### CodbiExtendedAccessor ($nodeFqcn)"),
        "the detailed workflow-node reference must contain a CodbiExtendedAccessor section")
    for (key in documentedParamKeys) {
      assertTrue(
          detailed.contains(key),
          "the detailed reference must document the '$key' parameter " +
              "(buildNodeParamsJson maps it into CUSTOM_PARAMS)")
    }
  }

  @Test
  fun `the detailed catalogue pins the SYSTEM placeholder syntax`() {
    val detailed = read(detailedResource)
    assertTrue(
        detailed.contains("[%\$<node name>.RESULT.value%]"),
        "the reference must show the \$-prefixed SYSTEM placeholder — without the '\$' formcycle " +
            "resolves a FORM FIELD of that name and the value stays empty")
  }

  @Test
  fun `the workflow build instruction tells the AI when to use the node`() {
    val instruction = read(instructionResource)
    assertTrue(
        instruction.contains("\"$registeredNodeType\""),
        "the workflow task instruction must name the REGISTERED node type so the model emits a " +
            "resolvable nodeType")
    assertFalse(
        instruction.contains(nodeFqcn),
        "the workflow task instruction must not offer the handler class as the nodeType — " +
            "formcycle cannot resolve it ('no handler was registered for that node')")
    assertTrue(
        instruction.contains("RESULT.value"),
        "the workflow task instruction must show how the result is referenced in the consuming node")
  }

  @Test
  fun `the catalogues pin the registered node type, not the handler class`() {
    val compact = read(compactResource)
    val detailed = read(detailedResource)
    assertTrue(
        compact.contains("nodeType IS \"$registeredNodeType\""),
        "the compact entry must state the registered nodeType")
    assertTrue(
        detailed.contains("\"nodeType\":\"$registeredNodeType\""),
        "the detailed example must use the registered nodeType")
    assertFalse(
        detailed.contains("\"nodeType\":\"$nodeFqcn\""),
        "the detailed example must not use the handler class as the nodeType")
  }

  @Test
  fun `the node is not hidden from the AI by the form-only catalogues`() {
    // Guard against the node being documented only in a resource that never reaches the workflow
    // prompt (e.g. a form-assistant key): both workflow catalogues must carry it.
    assertTrue(read(compactResource).contains(nodeFqcn))
    assertTrue(read(detailedResource).contains(nodeFqcn))
    assertFalse(
        read(instructionResource).isBlank(), "the workflow task instruction must be non-empty")
  }
}
