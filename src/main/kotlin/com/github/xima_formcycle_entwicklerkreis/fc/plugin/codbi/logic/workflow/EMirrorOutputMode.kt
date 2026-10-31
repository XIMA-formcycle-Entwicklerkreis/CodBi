package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow

/**
 * Output mode of the CodBi workflow **Mirror** node.
 *
 * The node always reflects the current state of the source workflow path; the mode only controls
 * how much detail is exposed in the result.
 *
 * @since 1.1.0
 */
enum class EMirrorOutputMode {
  /** Trigger type/name plus a compact `<type>: <name>` line per node. */
  SUMMARY,

  /** Same as [SUMMARY], but the `nodes` list also includes the node descriptions. */
  NODES,
}
