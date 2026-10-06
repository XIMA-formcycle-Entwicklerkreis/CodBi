package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

// region Imports
// #region XIMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

// #endregion XIMA
// endregion Imports
/**
 * # Base for all classes related to [CodBi] / AI.
 *
 * In order to enable the re-usage of images that were already uploaded, this class sets up a cache
 * ([cacheIDedImages]) that is managed by a janitor ([janitorIDedImages]) with a specific expiration
 * time for the images defined ([msExpirationIDedImages]). **DSGVO Notice**: IDed images are
 * temporarily stored as files on the server.
 *
 * A dedicated [log]ger posts messages in following manner to the console **[[ CodBi / AI /
 * [idLogMessages] ] **...message...** ]**.
 *
 * ## AI on Formcylce server benefits
 * - **Lean Compliance**: Simpler DSGVO and EU AI Act handling. Most easy approval from your Data
 *   Protection Officer (DSGVO), No Data Transit Mapping, No extra TOMs, no extra VVTs.
 * - **Infrastructure Efficiency**: No second OS to patch, monitor, or license. Dramatically lowers
 *   TCO (Total Cost of Ownership) and prevents "server sprawl."
 * - **Maximum Performance**: Zero network latency. Localhost communication bypasses the physical
 *   network, ensuring the fastest possible data exchange between Formcycle and the AI.
 * - **Simplified Security**: No internal API ports to open or protect. Data never leaves the
 *   machine, eliminating the need for complex mTLS or inter-server encryption.
 * - **Unified Maintenance**: Single-point backups ensure the application and AI model are always in
 *   sync. Debugging is faster with all logs centralized on one filesystem.
 *
 * **Bottom Line**: Hosting on the same server is the most pragmatic, cost-effective, and
 * low-maintenance approach for high-speed, internalized workflows.
 *
 * ## Plugin Properties
 * |Property                                     |Type  |Default |Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
 * |---------------------------------------------|------|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
 * |`AI_CachedImageExpiration`                   |Long  |`600000`|Time in ms before a cached image expires and is purged by the janitor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
 * |`AI_Log_SensitiveElements`                   |CSV   |`(none)`|Comma-separated names of elements that are considered **sensitive** - CodBi elements (functionalities, EPs, standard configurations/classes/globals), FORMCYCLE widgets (e.g. XTextField, XTextArea) and workflow node/trigger types (e.g. FC_EMAIL, FC_SQL_STATEMENT). Every occurrence of such an element in the AI change log is marked with an **always-on red border**; additionally, when the last inference used one of them, the change-log dialog opens automatically with those elements marked with a lightning icon (temporary). Re-read on every log load, so configuration changes take effect the next time the change log is opened.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
 * |`AI_FormAssistant_Matomo_URL`                |String|`(none)`|Base URL of the Matomo server used to answer statistics questions about the current form (e.g. `https://matomo.example/matomo`). Together with `AI_FormAssistant_Matomo_APIKey` this lets the AI assistant fetch and interpret the current form's Matomo usage statistics (page views, bounce/exit rates, field timings/corrections, top forms ranking) when the user asks about them or asks for an optimization analysis. When it is not set, the AI tells the user that the administrator has to define the plugin properties.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
 * |`AI_FormAssistant_Matomo_APIKey`             |String|`(none)`|Matomo `token_auth` API key for the server configured in `AI_FormAssistant_Matomo_URL`. Required together with the URL for the AI to be able to query statistics of the current form.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
 * |`AI_FormAssistant_MaxFormReruns`             |Int   |`2`     |Maximum number of additional detail-reruns (`need_codbi_details`) after the initial form-modification pass. When the AI keeps requesting CodBi/widget details, the assistant reruns up to this many extra times with the newly requested details before giving up (and, when the AI still only requests details, performs one final forced complete-form pass). Set to `0` to disable reruns. Re-read on plugin re-initialization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
 * |`AI_FormAssistant_MaxFormReruns_<specialist>`|Int   |(global)|Per-specialist override of `AI_FormAssistant_MaxFormReruns`. `<specialist>` is the model's specialist name (e.g. `cerebras`), matching the `specialist:<name>` / `ext-specialist:<name>` model id. When set, this value wins over the global one for that specialist model. Re-read on plugin re-initialization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
 * |`AI_Assistant_ReasoningEffort`               |String|`(none)`|Reasoning budget requested from an EXTERNAL, reasoning-capable provider (Cerebras GPT-OSS and similar): `low`/`medium`/`high` raise or lower the budget; unset leaves the provider's own default. **`low`, `medium` and `high` are the ONLY levels such APIs accept** — Cerebras answers anything else with `HTTP 400 … Unsupported reasoning effort`, which aborts the whole run, so `off`/`none`/`disabled` and every other unsupported value are deliberately coerced to the lowest level `low` (with a WARN log line) instead of failing. A provider that really offers a "no reasoning at all" switch is configured explicitly through its extra-parameters property (e.g. `AI_LLAMA_STD_EXT_SPECIALIST_ExtraParams_<name>` = `{"disable_reasoning":true}`). Reasoning tokens are billed as part of `completion_tokens` while the visible answer is only a fraction of them — the change log makes that visible per trip: compare `tokensOut` with the `completionChars` of the same trip (a JSON answer is ~2.5-4 chars/token; a reasoning-heavy call drops far below that). Sent only to external providers; a local llama.cpp server uses the `thinking` model routing instead. Overridable per specialist via `AI_Assistant_ReasoningEffort_<specialist>` and per run via the assistant dialog's reasoning-effort dropdown (Default/Low/Medium/High/Off (minimum)); precedence (highest first): per-request UI selection → per-specialist property → this global property → the provider default (send nothing). Re-read on plugin re-initialization.                                          |
 * |`AI_Assistant_ReasoningEffort_<specialist>`  |String|(global)|Per-specialist override of `AI_Assistant_ReasoningEffort`. `<specialist>` is the model's specialist name (e.g. `cerebras`), matching the `specialist:<name>` / `ext-specialist:<name>` model id. When set, it wins over the global property for that specialist model (the assistant dialog's reasoning-effort dropdown still overrides it for a single run). Re-read on plugin re-initialization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
 * |`AI_Assistant_PromptCaching`                 |String|`false` |Cache-friendly assembly of the assistant's build prompts (pass-1 and the pass-2 apply prompt). Accepted values: `false`/`off` (default — the request-dependent `<!--SECTION:-->` gates prune every prompt per request), `true`/`on`/`1`/`yes`/`enabled`/`always` (always cache-friendly), and **`auto`** (cache-friendly only when a **cached-input rate is configured for the model** — `AI_LLAMA_STD_*PricePerMCachedInput*` — because only then does the provider actually bill a cache hit cheaper; note that Cerebras charges the SAME input rate for cached and fresh tokens, so there `auto` stays off and prompt caching only improves latency, not cost). In cache-friendly mode the gates are NOT applied — every section is kept (the raw marker comments are still stripped) — and each prompt is composed so that all static corpora come FIRST while everything that varies per request (condensed element/widget catalogs, requested CodBi details, Bürger-Services naming, requested widget templates) comes LAST. That keeps the beginning of the prompt byte-identical across calls, which is what a provider with automatic prefix caching needs in order to re-use its KV cache; the `cachedIn` value of each trip in the AI change log shows how many prompt tokens the provider actually served from that cache, and the reported cost bills those tokens at the model's `PricePerMCachedInput` rate when one is configured. Trade-off: the blocks the gates used to drop are transmitted again (roughly 6-10k input tokens more per pass-1). Re-read on plugin re-initialization.|
 * |`AI_Assistant_AuxModel`                      |String|`(none)`|Optional model id used for the assistant's AUXILIARY inferences INSTEAD of the model selected in the assistant dialog (`X-Model`). Applies to intent classification (phase 1), the clarification check, the pass-1 identity-repair round and the whole-form translation passes — never to the form/workflow build passes, which always use the selected model. Accepts the same ids as `X-Model` (`standard`, `thinking`, `specialist:<name>`, `ext-specialist:<name>`). When unset (the default) every inference keeps the selected model, so this property is a strict no-op. Useful to run the cheap classification/clarification calls on a smaller/cheaper model while the build stays on a strong one. Per-role overrides: `AI_Assistant_AuxModel_<role>`. Re-read on plugin re-initialization. The server log line `Model routing: selected=…, classify=…, clarify=…, repair=…, translate=…` shows the effective model per role for each run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
 * |`AI_Assistant_AuxModel_<role>`               |String|(global)|Per-role override of `AI_Assistant_AuxModel`. `<role>` is one of `classify`, `clarify`, `repair`, `translate`. When set, it wins over the global property for that role only. Re-read on plugin re-initialization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
 * |`AI_Workflow_ExistingStructureCap`           |Int   |`4096`  |Character cap for the `EXISTING WORKFLOW STRUCTURE` block appended to the WORKFLOW system prompt when the workflow is being modified (it carries the full `customParameters` of every existing node/trigger, and on large workflows can reach tens of thousands of chars — hundreds of KB on multi-branch builds). In Stage 1 this is a pure MEASUREMENT instrument: the "Workflow system prompt" server log line classifies the block as `full` (block at or under the cap — the whole block is sent, unchanged from today's behaviour) or `bounded` (block larger than the cap), so the share of runs that would profit from a future two-tier split becomes visible WITHOUT changing what is sent. A Stage-2 stage turns this into the actual lever: above the cap the block is replaced by the lean node list plus a per-node preview (see `AI_Workflow_ExistingStructurePreview`), and full bodies are shipped only for the nodes the run references/demands. Below the cap every value still behaves identically to today. Re-read on plugin re-initialization. `0` disables the distinction (every non-empty block reports `bounded`).                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
 * |`AI_Workflow_ExistingStructurePreview`       |Int   |`128`   |Per-node preview cap (in chars) used by the Stage-2 two-tier split when the `EXISTING WORKFLOW STRUCTURE` block exceeds `AI_Workflow_ExistingStructureCap`. On such large workflows the WORKFLOW system prompt stops shipping every full body: pass-1 sends the lean node list plus each node's `customParameters` truncated to this preview cap (description dropped), and pass-2 / the `need_workflow_node_details` demand path ship the FULL bodies only for the nodes the run actually references (replace/remove `targetNodeId`) or explicitly requests (`instanceIds`). Below the cap the whole block is sent unchanged, so this property has no effect on the common case. Re-read on plugin re-initialization. `0` makes the preview emit no body text at all (id/type/name only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
 */
abstract class AI : CodBi(), IPluginServletAction {
  // region Shared Concurrency Control
  companion object {
    /**
     * Base URL of the Matomo server used to answer statistics questions about the current form
     * (e.g. `https://matomo.example/matomo`). Configured via the plugin property
     * `AI_FormAssistant_Matomo_URL`. When blank, the AI tells the user that the administrator has
     * to define the plugin properties before statistics can be queried.
     */
    @Volatile @JvmStatic var matomoUrl: String? = null

    /**
     * Matomo `token_auth` API key for the server configured via [matomoUrl]. Configured via the
     * plugin property `AI_FormAssistant_Matomo_APIKey`.
     */
    @Volatile @JvmStatic var matomoApiKey: String? = null

    /**
     * Shared semaphore that limits concurrent **local** AI inferences across all modules (LLAMA,
     * Tesseract, Whisper). Configured via `AI_LLAMA_ENGINE_MaxConcurrent` (default 2).
     */
    @Volatile
    @JvmStatic
    var inferenceSemaphore = java.util.concurrent.Semaphore(2, true)
      private set

    /** Whether the queue-position badge is enabled globally. Configured via `AI_QueueBadge`. */
    @Volatile @JvmStatic var queueBadgeEnabled: Boolean = false

    /**
     * Lowercased names of elements that are considered **sensitive**. Configured via the plugin
     * property `AI_Log_SensitiveElements` (comma-separated CSV). The list may hold:
     * - **CodBi elements** — functionalities, element placeholders, standard configurations / CSS
     *   classes / global variables (e.g. `HTML.CSS`, `OpenPLZ.Autocomplete`),
     * - **FORMCYCLE widgets** — the element class name (e.g. `XTextField`, `XTextArea`, `XUpload`);
     *   a matching widget is reported whenever the AI creates it OR writes into an existing one
     *   (e.g. potentially harmful HTML/code placed into an existing `XTextField`), and
     * - **workflow nodes / triggers** — the node type (e.g. `FC_EMAIL`, `FC_SQL_STATEMENT`) or a
     *   custom node/trigger name; the whole workflow change description is scanned.
     *
     * The list is:
     * - used by the `Run` handler to detect which sensitive elements the last inference applied
     *   (the change log dialog then opens automatically, highlighting those elements with a
     *   lightning icon), and
     * - returned with every `Log` response so the frontend marks **all** matching nodes with an
     *   always-on red border and the per-node verification checkbox.
     *
     * It is `@Volatile` and re-read whenever the plugin is re-initialized; because every log load
     * reads the current value, configuration changes take effect the next time the change log is
     * opened.
     */
    @Volatile @JvmStatic var logSensitiveElements: Set<String> = emptySet()

    /**
     * Tracks every request that is waiting for or currently holding the inference semaphore.
     * Streaming threads register before [acquire]; retry-based clients (sync LLAMA, Tesseract)
     * register on the first failed [tryAcquire]. Tickets are removed when inference completes (in
     * the finally block after [release]). The map value is the creation timestamp for waiting
     * tickets, or [Long.MAX_VALUE] for running inferences (immune to stale cleanup).
     */
    @JvmStatic val queueTickets = java.util.concurrent.ConcurrentHashMap<String, Long>()

    /**
     * Maps ticket UUID → model-type key (e.g. `"llama-thinking"`, `"llama-fast"`, `"tesseract"`).
     * Registered alongside [queueTickets] so [estimateWaitMs] can look up which model types are
     * ahead in the queue and calculate an approximate wait time.
     */
    @JvmStatic val ticketModelTypes = java.util.concurrent.ConcurrentHashMap<String, String>()

    /** Maximum number of past durations kept per model type for averaging. */
    private const val MAX_HISTORY_SIZE = 20

    /**
     * Stores the last [MAX_HISTORY_SIZE] inference durations (in ms) per model-type key. Used by
     * [estimateWaitMs] to compute average inference time per model type.
     */
    @JvmStatic
    val inferenceHistory = java.util.concurrent.ConcurrentHashMap<String, MutableList<Long>>()

    /**
     * Records the duration of a completed inference for a given model type.
     *
     * @param modelType The model-type key (e.g. `"llama-thinking"`, `"tesseract"`).
     * @param durationMs The wall-clock duration in milliseconds.
     */
    @JvmStatic
    fun recordInferenceDuration(modelType: String, durationMs: Long) {
      inferenceHistory.compute(modelType) { _, list ->
        val l = list ?: java.util.Collections.synchronizedList(mutableListOf())
        l.add(durationMs)
        while (l.size > MAX_HISTORY_SIZE) l.removeAt(0)
        l
      }
    }

    /**
     * Estimates the total wait time (in ms) for a ticket by summing the average inference duration
     * of every ticket ahead of it in the queue. Only tickets whose model type has recorded history
     * contribute to the estimate. Returns `null` if no estimate is possible (no history for any of
     * the queued model types).
     *
     * @param excludeTicket The ticket UUID to exclude (the requester's own ticket).
     */
    @JvmStatic
    fun estimateWaitMs(excludeTicket: String?): Long? {
      val permits = inferenceSemaphore.availablePermits()
      val otherTickets = queueTickets.keys.filter { it != excludeTicket }
      if (otherTickets.isEmpty()) return null
      // Only tickets that are waiting (not currently running) contribute to wait.
      // Running tickets (MAX_VALUE) will finish soon — include their avg as well since
      // they are occupying a permit that we need.
      var totalMs = 0L
      var hasEstimate = false
      // Count how many are running vs waiting ahead
      val running = otherTickets.filter { queueTickets[it] == Long.MAX_VALUE }
      val waiting =
          otherTickets.filter { queueTickets[it] != Long.MAX_VALUE && queueTickets[it] != null }
      // For each running inference, add its avg duration (it's occupying a slot we might need)
      for (ticket in running) {
        val mt = ticketModelTypes[ticket] ?: continue
        val hist = inferenceHistory[mt] ?: continue
        if (hist.isEmpty()) continue
        totalMs += hist.average().toLong()
        hasEstimate = true
      }
      // For each waiting inference ahead, add its avg duration
      for (ticket in waiting) {
        val mt = ticketModelTypes[ticket] ?: continue
        val hist = inferenceHistory[mt] ?: continue
        if (hist.isEmpty()) continue
        totalMs += hist.average().toLong()
        hasEstimate = true
      }
      // Divide by concurrency (multiple slots can run in parallel)
      val effectivePermits = (permits + running.size).coerceAtLeast(1)
      return if (hasEstimate) (totalMs / effectivePermits) else null
    }

    /**
     * Removes waiting tickets older than 30 s (abandoned clients). Active tickets
     * ([Long.MAX_VALUE]) are not affected.
     */
    @JvmStatic
    fun cleanupStaleTickets() {
      val cutoff = System.currentTimeMillis() - 30_000
      queueTickets.entries.removeIf { entry ->
        if (entry.value < cutoff) {
          ticketModelTypes.remove(entry.key)
          true
        } else false
      }
    }

    /** Replaces the shared inference semaphore with a new limit. */
    @JvmStatic
    fun updateMaxConcurrent(maxConcurrent: Int) {
      inferenceSemaphore = java.util.concurrent.Semaphore(maxConcurrent.coerceAtLeast(1), true)
    }
  }

  // endregion Shared Concurrency Control
  /**
   * Stores [File] and timestamp so we can clean up old ones that passed the
   * [msExpirationIDedImages].
   */
  data class CachedImage(val file: File, val timestamp: Long = System.currentTimeMillis())

  /** The cache that hold the images for which an **X-OCR-Image-ID** was transmitted. */
  protected val cacheIDedImages: ConcurrentHashMap<String, CachedImage> = ConcurrentHashMap()
  /**
   * Specifies the time in milliseconds that an image in the [cacheIDedImages] may persist (defaults
   * to 600000). This value can be overridden by the plugin property **AI_CachedImageExpiration**.
   */
  protected var msExpirationIDedImages: Long = 10 * 60 * 1000L
  /** The service that is responsible for keeping the [cacheIDedImages] clean. */
  protected var janitorIDedImages: ScheduledExecutorService? = null

  // region Tenant scope validation
  /**
   * Rejects tenant-level installation. CodBi must be installed as a **system plugin** because its
   * AI services (Whisper, LLAMA) bind local server ports and manage heavyweight processes that
   * would conflict when instantiated once per tenant.
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    if (configData.client != null) {
      return object : IPluginInitializeValidationResult {
        override fun isValid() = false

        override fun getErrorMessages() =
            listOf(
                "CodBi must be installed as a system plugin, not as a tenant plugin. " +
                    "Its AI services bind local server ports that would conflict across tenants.")
      }
    }
    return null
  }

  // endregion Tenant scope validation

  /**
   * Initializes the AI components by reading configuration properties. Specifically, it acquires
   * the `msExpirationIDedImages` from the plugin property "AI_CachedImageExpiration". Subclasses
   * should call this method at the beginning of their own `initialize` implementation.
   *
   * @param configData Provided by the Formcycle environment.
   */
  override fun initialize(configData: IPluginInitializeData) {
    idLogMessages = "AI"

    val expirationValue = configData.properties.getProperty("AI_CachedImageExpiration")

    configData.properties.getProperty("AI_QueueBadge")?.trim()?.lowercase()?.let {
      queueBadgeEnabled = it == "true" || it == "1" || it == "yes"
    }

    configData.properties.getProperty("AI_Log_SensitiveElements")?.let { csv ->
      logSensitiveElements =
          csv.split(",").map { it.trim().lowercase() }.filter { it.isNotEmpty() }.toSet()
    }

    // Matomo statistics backend for the AI assistant (see MatomoStats). The values are re-read on
    // every plugin (re-)initialization, so configuration changes take effect on the next request.
    configData.properties
        .getProperty("AI_FormAssistant_Matomo_URL")
        ?.trim()
        ?.takeIf { it.isNotBlank() }
        ?.let { matomoUrl = it }
    configData.properties
        .getProperty("AI_FormAssistant_Matomo_APIKey")
        ?.trim()
        ?.takeIf { it.isNotBlank() }
        ?.let { matomoApiKey = it }

    if (!expirationValue.isNullOrBlank()) {
      expirationValue.toLongOrNull()?.let {
        if (it > 0) {
          msExpirationIDedImages = it
        } else {
          log(
              LogLevel.WARNING,
              "AI_CachedImageExpiration must be a positive number, but was '$expirationValue'. Using default.")
        }
      }
    }
  }

  /**
   * Initiates a task that removes unused images that're expired ([msExpirationIDedImages]) from the
   * cache ([cacheIDedImages]).
   */
  fun startJanitor() {
    janitorIDedImages?.scheduleAtFixedRate(
        {
          val now = System.currentTimeMillis()
          val iterator = cacheIDedImages.entries.iterator()

          while (iterator.hasNext()) {
            val entry = iterator.next()
            val age = now - entry.value.timestamp

            if (age > msExpirationIDedImages) {
              entry.value.file.delete()
              iterator.remove()

              log(LogLevel.INFO, "Janitor: Purged image ${entry.key} (Age: ${age/1000}s).")
            }
          }
        },
        1,
        1,
        TimeUnit.MINUTES)
  }

  /** Shuts down the janitor ([startJanitor]) and removes all cached images ([cacheIDedImages]). */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    try {
      janitorIDedImages?.shutdown()

      if (janitorIDedImages?.awaitTermination(5, TimeUnit.SECONDS) == false) {
        janitorIDedImages?.shutdownNow()
      }
    } catch (X: InterruptedException) {
      janitorIDedImages?.shutdownNow()
    }

    cacheIDedImages.values.forEach { it.file.delete() }
    cacheIDedImages.clear()

    janitorIDedImages = null
  }
}
