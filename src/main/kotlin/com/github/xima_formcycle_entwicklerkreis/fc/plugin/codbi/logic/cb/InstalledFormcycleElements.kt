package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import org.slf4j.LoggerFactory

/**
 * Detects which FORMCYCLE widgets, workflow nodes and workflow triggers are actually **installed**
 * on the current system (i.e. have a registered plugin / handler), so the AI assistant can filter
 * its reference sections to the available elements when the user disables "Nicht installierte
 * Elemente erstellen".
 *
 * The detection reads the Formcycle registries directly, using reflective method matching that
 * tolerates API differences between Formcycle versions:
 * - **Widgets** via `APIProvider.PLUGINS.getFormElementWidgetPlugins(userContext, mandant, locale)`
 *   — every returned widget plugin's `getWidgets(locale)` lists the widget classes it registers
 *   (e.g. `XTextField`, `XCaptcha`, `XRating`). The class simple names are the widget identifiers.
 * - **Workflow nodes** via `WorkflowRegistry.NODE.getAllKnown(mandant)` — every registered
 *   handler's `getType()` (e.g. `FC_EMAIL`, `FC_CHANGE_STATE`).
 * - **Workflow triggers** via `WorkflowRegistry.TRIGGER.getAllKnown(mandant)` — every registered
 *   handler's `getType()` (e.g. `FC_FORM_SUBMIT_BUTTON`).
 *
 * Results are cached per mandant, since the installed set only changes when plugins are
 * installed/uninstalled (which reloads the server). When the mandant cannot be resolved or the
 * registry APIs are unavailable the snapshot is empty — the caller then treats nothing as installed
 * (fail-closed) so a non-installed element is never transmitted by default.
 */
internal object InstalledFormcycleElements {

  private val logger = LoggerFactory.getLogger(InstalledFormcycleElements::class.java)

  /** One detection snapshot for a mandant. */
  data class Snapshot(val widgets: Set<String>, val nodes: Set<String>, val triggers: Set<String>) {
    companion object {
      val EMPTY = Snapshot(emptySet(), emptySet(), emptySet())
    }
  }

  private val cache = ConcurrentHashMap<String, Snapshot>()

  /**
   * Returns the installed widget / node / trigger identifiers for the current request's mandant.
   * When the request carries no mandant context (e.g. the catalog GET), any mandant is used as a
   * fallback — installed plugins are registered server-wide, so the installed set is essentially
   * the same for every mandant. Only when no mandant at all can be obtained is an empty [Snapshot]
   * returned (the caller treats this as "nothing confirmed installed").
   */
  fun snapshotFor(params: IPluginServletActionParams): Snapshot {
    var mandant = resolveMandant(params)
    if (mandant == null) {
      mandant = loadAnyMandant(params)
      if (mandant != null) {
        logger.warn(
            "[InstalledFormcycleElements] Request mandant could not be resolved — using the first available mandant for installed-element detection")
      }
    }
    if (mandant == null) {
      logger.warn(
          "[InstalledFormcycleElements] No mandant could be resolved for the request — installed-element detection is unavailable")
      return Snapshot.EMPTY
    }
    return cache.computeIfAbsent(mandantCacheKey(mandant)) { detect(mandant, params) }
  }

  /** Best-effort cache key for a mandant (its id, or its toString as fallback). */
  private fun mandantCacheKey(mandant: Any): String {
    return try {
      val id = mandant.javaClass.getMethod("getId").invoke(mandant)
      id?.toString() ?: mandant.toString()
    } catch (_: Exception) {
      mandant.toString()
    }
  }

  /**
   * Resolves the request's mandant (client). `getPluginClient()` is often null on GET requests, so
   * the mandant is additionally resolved by its id via `APIProvider.MANDANT.getById(...)` and via
   * the request's project. Falls back to reflective accessors (`getMandant()`/`getClient()`, the
   * mandant reachable from the request's user / benutzer).
   */
  private fun resolveMandant(params: IPluginServletActionParams): Any? {
    // 1) The servlet params may already expose the Mandant directly.
    val direct = runCatching { params.getPluginClient() }.getOrNull()
    if (direct != null) {
      logger.info("[InstalledFormcycleElements] Resolved mandant via getPluginClient()")
      return direct
    }
    // 2) getPluginClient() is null on many requests — resolve by the client id instead.
    val clientId = runCatching { params.getClientId() }.getOrNull()
    if (clientId != null && clientId > 0L) {
      val byId = loadMandantById(clientId, params)
      if (byId != null) {
        logger.info(
            "[InstalledFormcycleElements] Resolved mandant via getClientId()={} -> MANDANT.getById",
            clientId)
        return byId
      }
    }
    // 3) Resolve via the request's project (project -> mandant).
    val projectId = runCatching { params.getProjectId() }.getOrNull()
    if (projectId != null && projectId > 0L) {
      val byProject = loadMandantByProject(projectId, params)
      if (byProject != null) {
        logger.info(
            "[InstalledFormcycleElements] Resolved mandant via getProjectId()={} -> project.getMandant()",
            projectId)
        return byProject
      }
    }
    // 4) Reflective fallbacks.
    val attempts =
        listOf(
            "getMandant (reflection)" to
                {
                  runCatching { params.javaClass.getMethod("getMandant").invoke(params) }
                      .getOrNull()
                },
            "getClient (reflection)" to
                {
                  runCatching { params.javaClass.getMethod("getClient").invoke(params) }.getOrNull()
                },
            "user.getMandant()" to
                {
                  runCatching {
                        val user = params.user
                        user.javaClass.getMethod("getMandant").invoke(user)
                      }
                      .getOrNull()
                },
            "benutzer.getMandant()" to
                {
                  runCatching {
                        val benutzer = params.benutzer
                        benutzer.javaClass.getMethod("getMandant").invoke(benutzer)
                      }
                      .getOrNull()
                },
        )
    for ((name, call) in attempts) {
      val value = call()
      if (value != null) {
        logger.info("[InstalledFormcycleElements] Resolved mandant via {}", name)
        return value
      }
    }
    logger.warn("[InstalledFormcycleElements] All mandant resolution attempts failed")
    return null
  }

  /** Loads the mandant by its id via `APIProvider.MANDANT.getById(UserContext, Long)`. */
  private fun loadMandantById(clientId: Long, params: IPluginServletActionParams): Any? {
    return runCatching {
          val userContext = userContextOf(params) ?: return@runCatching null
          val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
          val mandantApi = apiProviderClass.getField("MANDANT").get(null)
          val ucClass = Class.forName("de.xima.fc.user.UserContext")
          val getById =
              mandantApi.javaClass.getMethod("getById", ucClass, java.lang.Long::class.java)
          getById.invoke(mandantApi, userContext, clientId)
        }
        .getOrNull()
  }

  /**
   * Loads the mandant of the request's project via `APIProvider.PROJEKT.getById(...).getMandant()`.
   */
  private fun loadMandantByProject(projectId: Long, params: IPluginServletActionParams): Any? {
    return runCatching {
          val userContext = userContextOf(params) ?: return@runCatching null
          val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
          val projektApi = apiProviderClass.getField("PROJEKT").get(null)
          val ucClass = Class.forName("de.xima.fc.user.UserContext")
          val getById =
              projektApi.javaClass.getMethod("getById", ucClass, java.lang.Long::class.java)
          val project =
              getById.invoke(projektApi, userContext, projectId) ?: return@runCatching null
          project.javaClass.getMethod("getMandant").invoke(project)
        }
        .getOrNull()
  }

  /**
   * Last-resort fallback: loads any mandant from the database via
   * `APIProvider.MANDANT.getAll(...)`. Installed plugins are registered server-wide, so the
   * installed-element set is effectively the same for every mandant — this makes detection work
   * even when the request (e.g. the catalog GET) carries no client/project context at all.
   */
  private fun loadAnyMandant(params: IPluginServletActionParams): Any? {
    // Try the request's user context first, then the system context — the catalog GET may only
    // expose an anonymous user that cannot list mandants, while the system context always can.
    val userContext = userContextOf(params)
    val systemContext =
        runCatching {
              val factoryClass = Class.forName("de.xima.fc.user.UserContextFactory")
              factoryClass.getMethod("forSystem").invoke(null)
            }
            .getOrNull()
    for (ctx in listOfNotNull(userContext, systemContext).distinct()) {
      val mandant =
          runCatching {
                val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
                val mandantApi = apiProviderClass.getField("MANDANT").get(null)
                val ucClass = Class.forName("de.xima.fc.user.UserContext")
                val getAll = mandantApi.javaClass.getMethod("getAll", ucClass)
                @Suppress("UNCHECKED_CAST")
                val all = getAll.invoke(mandantApi, ctx) as? List<*> ?: return@runCatching null
                all.firstOrNull()
              }
              .getOrNull()
      if (mandant != null) return mandant
    }
    return null
  }

  private fun detect(mandant: Any, params: IPluginServletActionParams): Snapshot {
    logger.info(
        "[InstalledFormcycleElements] Detecting for mandant class {}", mandant.javaClass.name)
    val widgets = detectWidgets(params, mandant)
    val (nodes, triggers) = detectWorkflowElements(mandant)
    val snapshot = Snapshot(widgets, nodes, triggers)
    logger.info(
        "[InstalledFormcycleElements] Detected {} widget(s), {} node(s), {} trigger(s)",
        widgets.size,
        nodes.size,
        triggers.size)
    // Diagnostic: surface the detected node/trigger types so an incorrect availability marking can
    // be traced to the registry result.
    logger.info(
        "[InstalledFormcycleElements] Detected node types: {}", nodes.sorted().joinToString(", "))
    logger.info(
        "[InstalledFormcycleElements] Detected trigger types: {}",
        triggers.sorted().joinToString(", "))
    return snapshot
  }

  /**
   * Enumerates the installed widget identifiers via
   * `APIProvider.PLUGINS.getFormElementWidgetPlugins`.
   */
  private fun detectWidgets(params: IPluginServletActionParams, mandant: Any): Set<String> {
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val pluginApi = apiProviderClass.getField("PLUGINS").get(null)
      val locale = params.locale ?: Locale.getDefault()
      val userContext = userContextOf(params)
      if (userContext == null) {
        logger.warn(
            "[InstalledFormcycleElements] No UserContext available — widget detection skipped")
        return emptySet()
      }
      // Find getFormElementWidgetPlugins(UserContext, Mandant, Locale) by assignability so the
      // exact parameter types of this Formcycle version don't matter.
      val method =
          pluginApi.javaClass.methods
              .filter { it.name == "getFormElementWidgetPlugins" && it.parameterCount == 3 }
              .firstOrNull { m ->
                m.parameterTypes[0].isAssignableFrom(userContext.javaClass) &&
                    m.parameterTypes[1].isAssignableFrom(mandant.javaClass) &&
                    m.parameterTypes[2] == Locale::class.java
              }
      if (method == null) {
        logger.warn(
            "[InstalledFormcycleElements] getFormElementWidgetPlugins not found or incompatible on {}",
            pluginApi.javaClass.name)
        return emptySet()
      }
      @Suppress("UNCHECKED_CAST")
      val plugins =
          method.invoke(pluginApi, userContext, mandant, locale) as? Map<*, *> ?: return emptySet()
      val result = LinkedHashSet<String>()
      for (plugin in plugins.values) {
        if (plugin == null) continue
        try {
          val getWidgetsMethod = plugin.javaClass.getMethod("getWidgets", Locale::class.java)
          @Suppress("UNCHECKED_CAST")
          val widgetClasses = getWidgetsMethod.invoke(plugin, locale) as? List<*> ?: continue
          for (wc in widgetClasses) {
            val name = (wc as? Class<*>)?.simpleName ?: wc?.toString() ?: ""
            if (name.isNotBlank()) result.add(name)
          }
        } catch (_: Exception) {
          // skip a single plugin whose widget list cannot be read
        }
      }
      result
    } catch (e: Exception) {
      logger.warn("[InstalledFormcycleElements] Widget detection failed: {}", e.message)
      emptySet()
    }
  }

  /** Enumerates installed workflow node + trigger types via `WorkflowRegistry.NODE/TRIGGER`. */
  private fun detectWorkflowElements(mandant: Any): Pair<Set<String>, Set<String>> {
    val nodes = LinkedHashSet<String>()
    val triggers = LinkedHashSet<String>()
    try {
      val registryClass = Class.forName("de.xima.fc.plugin.workflow.registry.WorkflowRegistry")
      val nodeRegistry = runCatching { registryClass.getField("NODE").get(null) }.getOrNull()
      val triggerRegistry = runCatching { registryClass.getField("TRIGGER").get(null) }.getOrNull()
      if (nodeRegistry == null)
          logger.warn("[InstalledFormcycleElements] WorkflowRegistry field 'NODE' not found")
      if (triggerRegistry == null)
          logger.warn("[InstalledFormcycleElements] WorkflowRegistry field 'TRIGGER' not found")
      collectTypes(nodeRegistry, mandant, nodes, "NODE")
      collectTypes(triggerRegistry, mandant, triggers, "TRIGGER")
    } catch (e: Exception) {
      logger.warn("[InstalledFormcycleElements] Workflow element detection failed: {}", e.message)
    }
    return nodes to triggers
  }

  /** Reads the registered handlers of a registry and collects every handler's `getType()`. */
  private fun collectTypes(
      registry: Any?,
      mandant: Any,
      into: MutableSet<String>,
      registryName: String
  ) {
    if (registry == null) return
    val handlers = invokeGetAllKnown(registry, mandant)
    if (handlers == null) {
      logger.warn(
          "[InstalledFormcycleElements] {} registry: getAllKnown not found or incompatible on {}",
          registryName,
          registry.javaClass.name)
      return
    }
    logger.info(
        "[InstalledFormcycleElements] {} registry returned {} handler(s)",
        registryName,
        handlers.size)
    for (h in handlers) {
      if (h == null) continue
      try {
        val type = h.javaClass.getMethod("getType").invoke(h)?.toString() ?: ""
        if (type.isNotBlank()) into.add(type)
      } catch (_: Exception) {
        // skip a handler whose type cannot be read
      }
    }
  }

  /**
   * Invokes `getAllKnown(...)` on a registry. Prefers a one-argument `getAllKnown` whose parameter
   * is assignable from the mandant's actual class, then falls back to the no-arg `getAllKnown()`.
   */
  private fun invokeGetAllKnown(registry: Any, mandant: Any): Collection<*>? {
    val oneArg =
        registry.javaClass.methods
            .filter { it.name == "getAllKnown" && it.parameterCount == 1 }
            .firstOrNull { it.parameterTypes[0].isAssignableFrom(mandant.javaClass) }
    if (oneArg != null) {
      return runCatching { oneArg.invoke(registry, mandant) as? Collection<*> }.getOrNull()
    }
    return runCatching {
          registry.javaClass.getMethod("getAllKnown").invoke(registry) as? Collection<*>
        }
        .getOrNull()
  }

  /**
   * Resolves a `de.xima.fc.user.UserContext` for the request (needed by the widget-plugin API and
   * `MANDANT.getById`). Built from the request's IUser / Benutzer via `UserContextFactory`, falling
   * back to the system context.
   */
  private fun userContextOf(params: IPluginServletActionParams): Any? {
    val factoryClass =
        runCatching { Class.forName("de.xima.fc.user.UserContextFactory") }.getOrNull()
    if (factoryClass != null) {
      // 1) From the request's IUser (params.getUser()).
      val iUser = runCatching { params.user }.getOrNull()
      if (iUser != null) {
        val viaForUser =
            runCatching {
                  val iUserClass = Class.forName("de.xima.fc.interfaces.user.IUser")
                  factoryClass.getMethod("forUser", iUserClass).invoke(null, iUser)
                }
                .getOrNull()
        if (viaForUser != null) return viaForUser
      }
      // 2) From the Benutzer.
      val benutzer = runCatching { params.benutzer }.getOrNull()
      if (benutzer != null) {
        val viaForBenutzer =
            runCatching {
                  factoryClass.methods
                      .filter { it.name == "forBenutzer" && it.parameterCount == 1 }
                      .firstOrNull { it.parameterTypes[0].isAssignableFrom(benutzer.javaClass) }
                      ?.invoke(null, benutzer)
                }
                .getOrNull()
        if (viaForBenutzer != null) return viaForBenutzer
      }
      // 3) The request may expose a ready-made UserContext.
      val viaGetUserContext =
          runCatching { params.javaClass.getMethod("getUserContext").invoke(params) }.getOrNull()
      if (viaGetUserContext != null) return viaGetUserContext
      // 4) System context (can read mandants and plugin registries regardless of the user).
      val system = runCatching { factoryClass.getMethod("forSystem").invoke(null) }.getOrNull()
      if (system != null) return system
    }
    return null
  }
}
