package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
import de.xima.fc.interfaces.workflow.execution.INormalCompletionResult
import de.xima.fc.interfaces.workflow.mixin.IElementCategory
import de.xima.fc.interfaces.workflow.params.IGetElementPrototypesParams
import de.xima.fc.interfaces.workflow.params.INodeExecutionParams
import de.xima.fc.interfaces.workflow.value.IValueDescriptor
import de.xima.fc.interfaces.workflow.value.IValueDescriptorFactory
import de.xima.fc.workflow.mixin.APluginActionNodeHandler
import org.slf4j.LoggerFactory

/**
 * TEMPORARY Phase-0 spike probe node (delete after the spike).
 *
 * A benign action node that does nothing except log a clearly-labelled marker when the workflow
 * engine executes it. It is used to answer the Option-B timing question: if the [MirrorNodePlugin]
 * (with its `spikeProbe` flag) injects a [SpikeProbeNodePlugin] child into a downstream lane
 * mid-run, and THIS handler's `[SPIKE] EXECUTED` marker appears in the SAME submit's log, then
 * FORMCYCLE re-walks live `children` and same-trigger refresh is possible.
 */
class SpikeProbeNodePlugin : APluginActionNodeHandler<SpikeProbeNodeProps>() {
  override fun getName(): String = NODE_TYPE

  override fun getPropertiesViewXhtmlName(): String = "MirrorNode.xhtml"

  override fun getMainCategory(params: IGetElementPrototypesParams): IElementCategory =
      ECodbiWorkflowElementCategory.MAIN_CODBI

  override fun getSubCategory(params: IGetElementPrototypesParams): IElementCategory =
      ECodbiWorkflowElementCategory.SUB_CODBI_MIRROR

  override fun getResourceBundlePath(): String = Constants.RESOURCE_PATH_BUNDLE.removePrefix("/")

  override fun getSuccessValueDescriptor(factory: IValueDescriptorFactory): IValueDescriptor<*, *> =
      factory.recordBuilder().optionalProperty("marker", factory.string()).build()

  override fun execute(params: INodeExecutionParams<SpikeProbeNodeProps>): INormalCompletionResult {
    val name = params.data.name
    logger.info(
        "[SPIKE][SpikeProbe] EXECUTED marker node name='{}' — proving this node ran in the " +
            "current workflow execution",
        name)
    return params
        .normalResult()
        .success { b -> b.asRecord().property("marker", "executed:${name}").build() }
        .build()
  }

  private companion object {
    const val NODE_TYPE = "SpikeProbe"
    val logger = LoggerFactory.getLogger(SpikeProbeNodePlugin::class.java)
  }
}
