package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import de.xima.fc.workflow.taglib.model.BaseActionProps

/**
 * Configuration of the temporary Phase-0 spike probe node (delete after the spike).
 *
 * The node is intentionally minimal: it carries no user-facing options and exists only to emit a
 * clearly-labelled `[SPIKE]` log marker when the workflow engine executes it. Its presence in a run
 * (via an injected lane) proves whether FORMCYCLE re-walks the live `children` collection of an
 * already-loaded node and executes freshly-persisted children in the SAME submit.
 */
class SpikeProbeNodeProps : BaseActionProps()
