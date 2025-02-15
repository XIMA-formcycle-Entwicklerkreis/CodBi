package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
import de.xima.fc.entities.FrontendServer
import de.xima.fc.entities.Mandant
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInstallData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginUninstallData
import de.xima.fc.interfaces.plugin.lifecycle.helper.IPluginFileHelper
import de.xima.fc.interfaces.plugin.lifecycle.helper.IPluginManifest
import de.xima.fc.interfaces.plugin.lifecycle.helper.IPluginResourceHelper
import de.xima.fc.plugin.interfaces.IFCPlugin
import de.xima.fc.plugin.runtime.PluginManifest
import java.util.*
import java.util.jar.Manifest

/**
 * Initializes a formcycle plugin by first invoking the [IFCPlugin.install] method and then the
 * [IFCPlugin.initialize] method. Passes dummy data to the lifecycle methods.
 *
 * @since 1.0.0
 */
internal fun <Plugin : IFCPlugin> Plugin.testInit() {
  val lifecycleData = LifecycleData()
  this.install(lifecycleData)
  this.initialize(lifecycleData)
}

/**
 * Shuts down a formcycle plugin by first invoking the [IFCPlugin.shutdown] method and then the
 * [IFCPlugin.uninstall] method. Passes dummy data to the lifecycle methods.
 *
 * @since 1.0.0
 */
internal fun <Plugin : IFCPlugin> Plugin.testDestroy() {
  val lifecycleData = LifecycleData()
  this.shutdown(lifecycleData)
  this.uninstall(lifecycleData)
}

/**
 * Dummy lifecycle data passed to plugin lifecycle methods when creating plugin instances for
 * testing.
 *
 * @since 1.0.0
 */
private class LifecycleData :
    IPluginInstallData, IPluginInitializeData, IPluginShutdownData, IPluginUninstallData {
  private val client = Mandant()
  private val manifest = PluginManifest(newManifest())

  private val properties = Properties()
  private val runtimeKey = UUID.randomUUID().toString()
  private val scopeKey = UUID.randomUUID().toString()

  override fun getScopeKey(): String {
    return scopeKey
  }

  override fun getRuntimeKey(): String {
    return runtimeKey
  }

  override fun getClient(): Mandant {
    return client
  }

  override fun getProperties(): Properties {
    return properties
  }

  override fun getFrontendServer(): FrontendServer? {
    return null
  }

  override fun getFileHelper(): IPluginFileHelper? {
    return null
  }

  override fun getResourceHelper(): IPluginResourceHelper? {
    return null
  }

  override fun getManifest(): IPluginManifest {
    return manifest
  }
}

/**
 * Creates a plugin manifest with dummy data. Passed to plugin lifecycle methods when creating
 * plugin instances for testing.
 *
 * @since 1.0.0
 */
private fun newManifest(): Manifest {
  val manifest = Manifest()
  manifest.mainAttributes.putValue(
      "Implementation-Title", "com.github.xima_formcycle_entwicklerkreis:fc.plugin.codbi")
  manifest.mainAttributes.putValue("Implementation-Version", "1.0.0")
  manifest.mainAttributes.putValue("Plugin-Key", Constants.PLUGIN_KEY)
  manifest.mainAttributes.putValue("Plugin-Repository", "xfc-proma")
  manifest.mainAttributes.putValue("formcycle-version-requirement", "1.0.0")
  return manifest
}
