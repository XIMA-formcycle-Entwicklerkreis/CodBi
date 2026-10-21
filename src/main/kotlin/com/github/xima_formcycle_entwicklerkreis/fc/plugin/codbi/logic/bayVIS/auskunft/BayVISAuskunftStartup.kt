package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.bayVIS.auskunft

import java.util.Date
import java.util.concurrent.ConcurrentHashMap
import java.util.logging.Level
import java.util.logging.Logger

/**
 * Keeps a failing BayVIS prefetch from aborting FORMCYCLE's plugin start-up and turns it into a
 * WARNING instead of an error.
 *
 * Why this is NOT a validation result (verified in the FORMCYCLE 8.5.3 jars):
 * - `IFCPlugin.validateConfigurationData(...)` returns an `IPluginInitializeValidationResult` which
 *   has exactly two members, `isValid()` and `getErrorMessages()` — there is no "warning" severity.
 * - `de.xima.fc.gui.bean.plugin.BasicPluginBean.showErrorsOnUiAndGetErrorMessages(...)` iterates
 *   the results and only reads `getErrorMessages()` of results whose `isValid()` is **false**;
 *   messages of a VALID result are discarded completely.
 * - A result with `isValid() == false` makes FC treat the plugin as invalid / failed, which is
 *   exactly what kept the CodBi plugin from starting.
 *
 * So the correct way to "warn without failing" is the channel FC itself uses for plugin problems: a
 * protocol entry through `de.xima.fc.api.APIProvider.PROTOKOLL` (`addMandantProtokollEintrag(...)`
 * for a client-scoped plugin, `addSystemProtokollEintrag(...)` otherwise) — the very code path of
 * `de.xima.fc.plugin.PluginHelper.createPluginErrorProtocolEntry( PluginRuntime,
 * DefaultPluginLifecycleData, Throwable, boolean, boolean)`, which writes a
 * `ProtocolEntryClient`/`ProtocolEntrySystem` with `Bemerkung`, `ErstellungsDatum`, `Preserve` and
 * `Details`. The plugin manager stays clean (the plugin is VALID and ignites), the protocol view/
 * protocol list shows the warning, and the server log carries the same text.
 *
 * Everything is done reflectively so the plugin keeps compiling against the plain plugin API.
 */
internal object BayVISAuskunftStartup {

  private val log: Logger = Logger.getLogger(BayVISAuskunftStartup::class.java.name)

  /** Headline of the protocol entry (the `Bemerkung`), one per failed service. */
  private const val PROTOCOL_TITLE =
      "CodBi: BayVIS data could not be loaded while the plugin started (warning)"

  /** Last published warning per service — used to avoid one protocol entry per validation call. */
  private val published = ConcurrentHashMap<String, String>()

  /**
   * Runs [fetch] (which returns the HTTP status of the BayVIS call) and records a warning when the
   * call failed with a non-2xx status or threw. NEVER rethrows, so it can be called from
   * `initialize()` and `validateConfigurationData()` without any risk of aborting the plugin start.
   *
   * @param client The FORMCYCLE client ([de.xima.fc.entities.Mandant]) of the plugin instance,
   *   taken from the lifecycle data (`IPluginDefaultLifecycleData.getClient()`); may be null, in
   *   which case the warning goes into the system protocol.
   * @return The warning text, or null when the call succeeded.
   */
  fun startupCheck(
      service: String,
      endpoint: String,
      client: Any? = null,
      fetch: () -> Int
  ): String? {
    return try {
      val status = fetch()
      if (status in 200..299) {
        published.remove(service)
        null
      } else {
        record(service, BayVISAuskunftErrors.startupWarning(service, endpoint, status), client)
      }
    } catch (t: Throwable) {
      record(service, BayVISAuskunftErrors.startupWarning(service, endpoint, t), client)
    }
  }

  private fun record(service: String, message: String, client: Any?): String {
    log.log(Level.WARNING, "[CodBi][BayVIS] $message")
    // Publish once per DISTINCT message: FC calls validateConfigurationData repeatedly (ignite +
    // every configuration save), and the protocol must not fill up with identical entries.
    if (published.put(service, message) != message) {
      publishProtocolWarning(client, message)
    }
    return message
  }

  /**
   * Writes a protocol entry exactly like `PluginHelper.createPluginErrorProtocolEntry(...)` does.
   * Failure is not fatal (and only logged at FINE), because a missing protocol must never keep the
   * plugin from starting either.
   */
  private fun publishProtocolWarning(client: Any?, message: String) {
    try {
      val apiProvider = Class.forName("de.xima.fc.api.APIProvider")
      val protokoll = apiProvider.getField("PROTOKOLL").get(null) ?: return
      val userContextClass = Class.forName("de.xima.fc.user.UserContext")
      val systemContext =
          Class.forName("de.xima.fc.user.UserContextFactory").getField("SYSTEM").get(null) ?: return
      val date = Date()
      val mandantClass = runCatching { Class.forName("de.xima.fc.entities.Mandant") }.getOrNull()

      if (client != null && mandantClass != null) {
        val entryClass = Class.forName("de.xima.fc.entities.ProtocolEntryClient")
        val entry = entryClass.getDeclaredConstructor().newInstance()
        entryClass.getMethod("setMandant", mandantClass).invoke(entry, client)
        entryClass.getMethod("setBemerkung", String::class.java).invoke(entry, PROTOCOL_TITLE)
        entryClass.getMethod("setErstellungsDatum", Date::class.java).invoke(entry, date)
        entryClass
            .getMethod("setPreserve", java.lang.Boolean.TYPE)
            .invoke(entry, java.lang.Boolean.FALSE)
        entryClass.getMethod("setDetails", String::class.java).invoke(entry, message)
        protokoll.javaClass
            .getMethod("addMandantProtokollEintrag", userContextClass, mandantClass, entryClass)
            .invoke(protokoll, systemContext, client, entry)
        return
      }

      val entryClass = Class.forName("de.xima.fc.entities.ProtocolEntrySystem")
      val entry = entryClass.getDeclaredConstructor().newInstance()
      entryClass.getMethod("setBemerkung", String::class.java).invoke(entry, PROTOCOL_TITLE)
      entryClass.getMethod("setErstellungsDatum", Date::class.java).invoke(entry, date)
      entryClass
          .getMethod("setPreserve", java.lang.Boolean.TYPE)
          .invoke(entry, java.lang.Boolean.FALSE)
      entryClass.getMethod("setDetails", String::class.java).invoke(entry, message)
      protokoll.javaClass
          .getMethod("addSystemProtokollEintrag", userContextClass, entryClass)
          .invoke(protokoll, systemContext, entry)
    } catch (t: Throwable) {
      log.log(
          Level.FINE,
          "[CodBi][BayVIS] could not write the FORMCYCLE protocol warning: ${t.message}",
          t)
    }
  }
}
