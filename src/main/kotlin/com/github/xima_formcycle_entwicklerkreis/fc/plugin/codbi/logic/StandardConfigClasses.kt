package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.fasterxml.jackson.databind.ObjectMapper
import java.nio.charset.StandardCharsets.UTF_8
import java.util.logging.Logger

/**
 * Static index of the CSS classes provided by the CodBi **S**tandard **C**onfigurations.
 *
 * A standard configuration is applied to a form element by putting one of its CSS classes (e.g.
 * `CodBi_NoFutureDate`) into the element's class list. The class itself carries **no** behaviour: the
 * behaviour is applied by the configuration's own script
 * (`window.codbi.loadConfig({ targets: ".CodBi_NoFutureDate", FUNC: "Date.Min", … })`).
 *
 * Historically that script was injected **only** while the configuration was activated FORM-wide in
 * the designer's CodBi section (the `codbi-prop-standards` CSV). A class that was applied without that
 * activation was therefore nothing but a dead marker — the element *looked* configured, while the
 * functionality behind it was never even loaded. A manually applied functionality
 * (`data-cb-func="Date.Min"`) works in exactly the same form, because the [FormRenderCallback]
 * injects the functionality's script for every `data-cb-func` it finds.
 *
 * This index closes that gap: it maps every config class to the configuration that owns it AND to the
 * functionalities that class applies, so the render callback can inject both for the classes that the
 * RENDERED form actually uses — no matter how the class got there and without the form-level toggle.
 *
 * The data is read from the shipped configuration metadata (the `Configurations` folder's `<id>.json`
 * files, the same files the designer
 * uses), which is generated from the `loadConfig`/`loadConfigs` calls of the configuration sources:
 *
 * ```json
 * { "classes": { "CodBi_NoFutureDate": { "description": "…" } },
 *   "funcs":   { "CodBi_NoFutureDate": "Date.Min" } }
 * ```
 *
 * `Holistic.*` configurations are deliberately **excluded**: their CSS classes are EXCLUSION markers
 * (`CodBi_XCL_*`) that a field carries to opt OUT of a form-wide configuration. Resolving them here
 * would activate that configuration for the whole form just because one field excludes it.
 */
internal object StandardConfigClasses {

  /** The classpath folder holding the configuration metadata (`<id>.json` + `index.json`). */
  private const val BASE_PACKAGE =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Configurations"

  /** A plain CSS class token — selectors (e.g. `[data-vdt="phone"]`) are not usable as class names. */
  private val CSS_CLASS = Regex("^\\.?[A-Za-z_][A-Za-z0-9_-]*$")

  private val LOG: Logger = Logger.getLogger(StandardConfigClasses::class.java.name)

  /** One standard configuration that provides a CSS class. */
  data class Provider(
      /** The configuration id, i.e. the name of its script/`codbi-prop-standards` entry (e.g. `Appointments`). */
      val configId: String,
      /** The functionalities (`FUNC`) that configuration applies for this very class (e.g. `Date.Min`). */
      val funcs: List<String>
  )

  @Volatile private var cached: Map<String, List<Provider>>? = null

  /** Every known CSS class (without the leading dot) to the configuration(s) providing it. */
  val providers: Map<String, List<Provider>>
    get() = cached ?: build().also { cached = it }

  /**
   * Resolves the configurations (and the functionalities they apply) for the given CSS classes.
   *
   * @param cssClasses The CSS classes that occur in a rendered form.
   * @return The distinct providers of those classes — empty when none of them belongs to a standard
   *   configuration.
   */
  fun providersOf(cssClasses: Collection<String>): List<Provider> {
    val index = providers

    // Distinct by configuration AND functionality list: two classes of the SAME configuration may
    // apply DIFFERENT functionalities (e.g. `CodBi_DateFrame_1_Begin` = "HTML.Input.Cleave,
    // Date.Frame" but `CodBi_DateFrame_1_End` = "HTML.Input.Cleave"), so collapsing on the config id
    // alone would silently drop a functionality the used class needs.
    return cssClasses
        .asSequence()
        .mapNotNull { index[it] }
        .flatten()
        .distinct()
        .toList()
  }

  /** Drops the cache, e.g. after a plugin (re-)initialization changed the shipped metadata. */
  fun reset() {
    cached = null
  }

  /**
   * Builds the index from the classpath metadata.
   *
   * @return The class → providers map, or an empty map when the metadata cannot be read (a render
   *   must never fail because of a missing index).
   */
  private fun build(): Map<String, List<Provider>> {
    val classLoader = StandardConfigClasses::class.java.classLoader
    val mapper = ObjectMapper()
    val indexStream =
        classLoader.getResourceAsStream("$BASE_PACKAGE/index.json")
            ?: run {
              LOG.warning("Standard-configuration index not found at '$BASE_PACKAGE/index.json'")
              return emptyMap()
            }
    val configIds =
        try {
          indexStream.bufferedReader(UTF_8).use { reader ->
            (mapper.readValue(reader.readText(), List::class.java) as List<*>)
                .mapNotNull { it?.toString() }
                .map { it.substringBeforeLast('.') }
          }
        } catch (x: Exception) {
          LOG.warning("Failed to read the standard-configuration index: ${x.message}")
          return emptyMap()
        }

    val result = mutableMapOf<String, MutableList<Provider>>()

    for (configId in configIds) {
      // `Holistic.*` classes are exclusion markers, not applicability markers — see the class docs.
      if (configId.startsWith("Holistic.", ignoreCase = true)) {
        continue
      }

      val stream = classLoader.getResourceAsStream("$BASE_PACKAGE/$configId.json") ?: continue
      val node =
          try {
            stream.use { mapper.readTree(it) }
          } catch (x: Exception) {
            LOG.warning("Failed to parse '$BASE_PACKAGE/$configId.json': ${x.message}")
            continue
          }

      val funcsByClass = mutableMapOf<String, List<String>>()
      node.path("funcs")?.fields()?.forEach { (cssClass, funcsNode) ->
        funcsByClass[cssClass.removePrefix(".")] =
            funcsNode
                .asText("")
                .split(",")
                .map { it.trim() }
                .filter { it.isNotEmpty() }
      }

      val declaredClasses =
          node.path("classes")?.fieldNames()?.asSequence()?.toList() ?: emptyList()

      for (rawClass in (declaredClasses + funcsByClass.keys).distinct()) {
        val cssClass = rawClass.removePrefix(".")

        if (!CSS_CLASS.matches(cssClass)) {
          continue
        }

        val funcs = funcsByClass[cssClass].orEmpty()

        result.getOrPut(cssClass) { mutableListOf() }.add(Provider(configId, funcs))
      }
    }

    return result.mapValues { (_, providers) -> providers.toList() }
  }
}
