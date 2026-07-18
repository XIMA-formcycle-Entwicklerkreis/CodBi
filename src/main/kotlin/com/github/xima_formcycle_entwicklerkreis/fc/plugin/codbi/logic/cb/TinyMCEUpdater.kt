package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Properties

/**
 * # TinyMCEUpdater — Automatic TinyMCE distribution updates
 *
 * Checks for new TinyMCE versions on plugin restart and optionally downloads and deploys them to an
 * external directory. Supports three modes: auto-update, notify-only, and notify-by-email.
 *
 * ## Configuration Properties
 * |Property                        |Default                                         |Description                                         |
 * |--------------------------------|------------------------------------------------|----------------------------------------------------|
 * |`TinyMCE_AutoUpdate`            |`false`                                         |Mode: `true`, `notify`, `notify_mail=addr`          |
 * |`TinyMCE_Update_VersionURL`     |`https://registry.npmjs.org/tinymce/latest`     |JSON endpoint returning `{"version":"x.y.z"}`       |
 * |`TinyMCE_Update_DownloadBaseURL`|`https://cdn.jsdelivr.net/npm/tinymce@{version}`|Base URL for file downloads; `{version}` is replaced|
 * |`TinyMCE_Update_ExternalDir`    |`{user.home}/.codbi/tinymce`                    |Directory where updated files are stored            |
 *
 * @since 1.0.0
 */
object TinyMCEUpdater : CodBi() {
  init {
    idLogMessages = "TinyMCEUpdater"
  }

  // region Constants

  /** Default version check URL (npm registry). */
  private const val DEFAULT_VERSION_URL = "https://registry.npmjs.org/tinymce/latest"

  /** Default download base URL (jsDelivr CDN). */
  private const val DEFAULT_DOWNLOAD_BASE_URL = "https://cdn.jsdelivr.net/npm/tinymce@{version}"

  /** Default external storage directory. */
  private val DEFAULT_EXTERNAL_DIR: String =
      "${System.getProperty("user.home", "/tmp")}/.codbi/tinymce"

  /** Subdirectories to download from the TinyMCE distribution. */
  private val SUBDIRECTORIES = listOf("skins", "icons", "models", "plugins")

  /** Files to download from the TinyMCE distribution root. */
  private val ROOT_FILES = listOf("tinymce.min.js")

  /** Name of the version tracking file. */
  private const val VERSION_FILE = "version.properties"

  // endregion Constants

  // region Configuration (set from plugin properties before calling checkAndUpdate)

  /** The update mode: `true`, `notify`, `notify_mail`, or `false`. */
  @Volatile var mode: String = "false"

  /** The version check URL. Defaults to npm registry. */
  @Volatile var versionUrl: String = DEFAULT_VERSION_URL

  /** The download base URL. `{version}` is replaced with the target version. */
  @Volatile var downloadBaseUrl: String = DEFAULT_DOWNLOAD_BASE_URL

  /** The external directory for storing updated TinyMCE files. */
  @Volatile var externalDir: String = DEFAULT_EXTERNAL_DIR

  /** The email recipient for `notify_mail` mode. Empty if not configured. */
  @Volatile var notifyMailRecipient: String = ""

  // endregion Configuration

  /**
   * Performs a version check and optional update. Called from
   * [CodbiFormResourcesPlugin.initialize][].
   *
   * Parses the [mode] property to determine the action:
   * - `false` or empty → skip
   * - `true` → check + download + update
   * - `notify` → check + log only
   * - `notify_mail=addr` → check + log + send email
   */
  fun checkAndUpdate() {
    val effectiveMode = mode.trim().lowercase()

    if (effectiveMode.isEmpty() || effectiveMode == "false") {
      log(LogLevel.INFO, "Auto-update disabled (TinyMCE_AutoUpdate=$effectiveMode)")
      return
    }

    // #region Parse mode and optional email recipient
    val (actionMode, mailAddr) = parseMode(effectiveMode)
    // #endregion Parse mode and optional email recipient

    // #region Fetch latest version from the version URL
    val latestVersion: String

    try {
      latestVersion = fetchLatestVersion(versionUrl)
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to fetch latest TinyMCE version: ${e.message}")
      return
    }

    if (latestVersion.isBlank()) {
      log(LogLevel.WARNING, "Empty version string received from $versionUrl")
      return
    }
    // #endregion Fetch latest version from the version URL

    // #region Read currently deployed version
    val currentVersion = readCurrentVersion()

    if (currentVersion == latestVersion) {
      log(LogLevel.INFO, "TinyMCE is up-to-date (version $currentVersion)")
      return
    }
    // #endregion Read currently deployed version

    log(LogLevel.INFO, "New TinyMCE version available: $latestVersion (current: $currentVersion)")

    // #region Handle "notify" mode
    if (actionMode == "notify") {
      log(LogLevel.INFO, "NOTIFY: TinyMCE $latestVersion is available, currently $currentVersion")

      if (mailAddr.isNotBlank()) {
        sendNotificationMail(mailAddr, currentVersion, latestVersion)
      }

      return
    }
    // #endregion Handle "notify" mode

    // #region Handle "true" mode — download and update
    if (actionMode == "true") {
      try {
        downloadAndUpdate(latestVersion)
        writeCurrentVersion(latestVersion)

        log(LogLevel.INFO, "TinyMCE successfully updated to version $latestVersion")

        if (mailAddr.isNotBlank()) {
          sendNotificationMail(mailAddr, currentVersion, latestVersion)
        }
      } catch (e: Exception) {
        log(LogLevel.ERROR, "Failed to update TinyMCE to $latestVersion: ${e.message}")
      }
    }
    // #endregion Handle "true" mode
  }

  /**
   * Parses the mode string into an action mode and optional email address.
   *
   * @param raw The raw mode string (e.g. `"true"`, `"notify"`, `"notify_mail=admin@..."`).
   * @return A pair of (actionMode, emailAddress).
   */
  private fun parseMode(raw: String): Pair<String, String> {
    if (raw.startsWith("notify_mail=")) {
      val addr = raw.substring("notify_mail=".length).trim()
      return "notify" to addr
    }

    if (raw.startsWith("notify")) {
      return "notify" to ""
    }

    return "true" to ""
  }

  /**
   * Fetches the latest version string from the specified URL.
   *
   * Expects a JSON response with a `version` field: `{ "version": "6.8.3" }`.
   */
  private fun fetchLatestVersion(urlString: String): String {
    val url = URL(urlString)
    val connection = url.openConnection() as HttpURLConnection

    connection.requestMethod = "GET"
    connection.connectTimeout = 10_000
    connection.readTimeout = 10_000

    try {
      val response = connection.inputStream.bufferedReader().readText()
      // Parse {"version":"x.y.z"} — simple regex to avoid additional JSON dependency
      val match = Regex(""""version"\s*:\s*"([^"]+)"""").find(response)

      return match?.groupValues?.getOrNull(1) ?: ""
    } finally {
      connection.disconnect()
    }
  }

  /**
   * Reads the currently deployed TinyMCE version from the version file in the external directory.
   *
   * @return The current version string, or "0.0.0" if unknown.
   */
  private fun readCurrentVersion(): String {
    val versionFile = File(externalDir, VERSION_FILE)

    if (!versionFile.exists()) {
      return "0.0.0"
    }

    return try {
      val props = Properties()

      versionFile.inputStream().use { props.load(it) }
      props.getProperty("version", "0.0.0")
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Failed to read version file: ${e.message}")
      "0.0.0"
    }
  }

  /** Writes the deployed TinyMCE version to the version file. */
  private fun writeCurrentVersion(version: String) {
    val dir = File(externalDir)

    dir.mkdirs()

    val versionFile = File(dir, VERSION_FILE)
    val props = Properties()

    props.setProperty("version", version)
    props.setProperty("updated", java.time.Instant.now().toString())

    try {
      versionFile.outputStream().use { props.store(it, "TinyMCE version tracking") }
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to write version file: ${e.message}")
    }
  }

  /**
   * Downloads the TinyMCE distribution for the given [version] to the external directory.
   *
   * Downloads root files (tinymce.min.js) and all required subdirectories (skins, icons, models,
   * plugins) from the configured [downloadBaseUrl].
   */
  private fun downloadAndUpdate(version: String) {
    val baseUrl = downloadBaseUrl.replace("{version}", version)
    val targetDir = File(externalDir)

    targetDir.mkdirs()

    // #region Download root files
    for (fileName in ROOT_FILES) {
      val fileUrl = "$baseUrl/$fileName"
      val targetFile = File(targetDir, fileName)

      downloadFile(fileUrl, targetFile)
      log(LogLevel.INFO, "Downloaded: $fileName")
    }
    // #endregion Download root files

    // #region Download subdirectory files
    for (subdir in SUBDIRECTORIES) {
      val subdirUrl = "$baseUrl/$subdir"
      val targetSubdir = File(targetDir, subdir)

      // We need to discover files in the subdirectory. Try a common file pattern:
      // For TinyMCE, subdirectories contain index.js, plugin.js, etc.
      // Since we can't list directories on a CDN, we download known structures.
      downloadSubdirEntries(version, subdir, "$subdirUrl", targetSubdir)
    }
    // #endregion Download subdirectory files
  }

  /**
   * Downloads a single file from [sourceUrl] to [targetFile], creating parent directories as
   * needed. Uses a simple GET request.
   */
  private fun downloadFile(sourceUrl: String, targetFile: File) {
    targetFile.parentFile.mkdirs()

    val url = URL(sourceUrl)
    val connection = url.openConnection() as HttpURLConnection

    connection.connectTimeout = 15_000
    connection.readTimeout = 30_000

    try {
      connection.inputStream.use { input ->
        targetFile.outputStream().use { output -> input.transferTo(output) }
      }
    } finally {
      connection.disconnect()
    }
  }

  /**
   * Downloads files from the TinyMCE distribution [subdir] (e.g. "skins", "plugins", "icons",
   * "models"). Since CDN directories cannot be listed, we depend on `directory-listing.txt` or fall
   * back to known file patterns.
   *
   * The primary strategy is:
   * 1. Try to download a `directory-listing.txt` from the subdirectory (if the CDN/mirror supports
   *    it).
   * 2. Fall back to a minimal known file set required for TinyMCE to function.
   */
  private fun downloadSubdirEntries(
      version: String,
      subdir: String,
      subdirUrl: String,
      targetSubdir: File
  ) {
    // #region Strategy 1: Try directory-listing.txt
    val listingUrl = "$subdirUrl/directory-listing.txt"

    try {
      val listingContent = downloadText(listingUrl)
      val files = listingContent.lines().map { it.trim() }.filter { it.isNotBlank() }

      if (files.isNotEmpty()) {
        for (relativePath in files) {
          val fileUrl = "$subdirUrl/$relativePath"
          val targetFile = File(targetSubdir, relativePath)

          downloadFile(fileUrl, targetFile)
        }

        return
      }
    } catch (_: Exception) {
      // Fall through to fallback
    }
    // #endregion Strategy 1: Try directory-listing.txt

    // #region Strategy 2: Known file patterns per subdirectory
    downloadKnownSubdirEntries(version, subdir, subdirUrl, targetSubdir)
    // #endregion Strategy 2: Known file patterns per subdirectory
  }

  /**
   * Downloads the known file structure for a given TinyMCE subdirectory.
   *
   * This mirrors the structure of the TinyMCE distribution from npm:
   * - `skins/`: `ui/tinymce-5/skin.min.css`, `ui/tinymce-5/skin.min.js`,
   *   `content/tinymce-5/content.min.css`, `content/default/content.min.css`
   * - `icons/`: `default/icons.min.js`, `default/icons.js`
   * - `models/`: `dom/model.min.js`
   * - `plugins/`: Each plugin has `plugin.min.js`
   */
  private fun downloadKnownSubdirEntries(
      version: String,
      subdir: String,
      subdirUrl: String,
      targetSubdir: File
  ) {
    when (subdir) {
      "skins" -> {
        downloadFile(
            "$subdirUrl/ui/tinymce-5/skin.min.css", File(targetSubdir, "ui/tinymce-5/skin.min.css"))
        downloadFile(
            "$subdirUrl/ui/tinymce-5/skin.min.js", File(targetSubdir, "ui/tinymce-5/skin.min.js"))
        downloadFile(
            "$subdirUrl/content/tinymce-5/content.min.css",
            File(targetSubdir, "content/tinymce-5/content.min.css"))
        downloadFile(
            "$subdirUrl/content/default/content.min.css",
            File(targetSubdir, "content/default/content.min.css"))
        downloadFile(
            "$subdirUrl/content/dark/content.min.css",
            File(targetSubdir, "content/dark/content.min.css"))
        downloadFile(
            "$subdirUrl/content/document/content.min.css",
            File(targetSubdir, "content/document/content.min.css"))
      }
      "icons" -> {
        downloadFile("$subdirUrl/default/icons.min.js", File(targetSubdir, "default/icons.min.js"))
        downloadFile("$subdirUrl/default/icons.js", File(targetSubdir, "default/icons.js"))
      }
      "models" -> {
        downloadFile("$subdirUrl/dom/model.min.js", File(targetSubdir, "dom/model.min.js"))
        downloadFile("$subdirUrl/dom/model.js", File(targetSubdir, "dom/model.js"))
      }
      "plugins" -> {
        // Download all known plugins — this list can grow over time.
        val knownPlugins =
            listOf(
                "accordion",
                "advlist",
                "anchor",
                "autolink",
                "autoresize",
                "autosave",
                "charmap",
                "code",
                "codesample",
                "directionality",
                "emoticons",
                "fullscreen",
                "help",
                "image",
                "importcss",
                "insertdatetime",
                "link",
                "lists",
                "media",
                "nonbreaking",
                "pagebreak",
                "preview",
                "quickbars",
                "save",
                "searchreplace",
                "table",
                "visualblocks",
                "visualchars",
                "wordcount")

        for (plugin in knownPlugins) {
          downloadFile(
              "$subdirUrl/$plugin/plugin.min.js", File(targetSubdir, "$plugin/plugin.min.js"))
        }
      }
    }
  }

  /** Downloads a text resource from [url] and returns its content as a string. */
  private fun downloadText(url: String): String {
    val connection = URL(url).openConnection() as HttpURLConnection

    connection.connectTimeout = 10_000
    connection.readTimeout = 10_000

    try {
      return connection.inputStream.bufferedReader().readText()
    } finally {
      connection.disconnect()
    }
  }

  /**
   * Sends a notification email via the formcycle mail API (using reflection, same pattern as
   * [MailBridge]).
   *
   * @param recipient The email address to send to.
   * @param currentVersion The currently installed version.
   * @param newVersion The newly available version.
   */
  private fun sendNotificationMail(recipient: String, currentVersion: String, newVersion: String) {
    try {
      val subject = "TinyMCE Update Available: $newVersion"
      val body =
          "A new version of TinyMCE is available.\n\n" +
              "Current version: $currentVersion\n" +
              "New version:     $newVersion\n\n" +
              "The update was applied automatically (if mode was set to 'true').\n" +
              "Otherwise, please update manually by redeploying the plugin."

      // Same reflection-based mail sending as MailBridge
      val contextProviderClass = Class.forName("de.xima.fc.mail.MailContextProvider")
      val mailContext =
          contextProviderClass.getMethod("getSystemContext").invoke(null)
              ?: throw IllegalStateException("No system mail server configured in FORMCYCLE")

      val serverData =
          mailContext.javaClass.getMethod("getServerData").invoke(mailContext)
              ?: throw IllegalStateException("Mail context has no server data")
      val senderAddr =
          serverData.javaClass.getMethod("getSenderAddress").invoke(serverData) as? String
              ?: throw IllegalStateException("No sender address configured")
      val senderName =
          serverData.javaClass.getMethod("getSenderName").invoke(serverData) as? String ?: "CodBi"

      val simpleTextMailClass = Class.forName("de.xima.fc.mail.type.SimpleTextMail")
      val mail =
          simpleTextMailClass
              .getConstructor(
                  String::class.java,
                  String::class.java,
                  String::class.java,
                  String::class.java,
                  String::class.java,
                  String::class.java)
              .newInstance(subject, body, "text/plain", senderAddr, senderName, recipient)

      val mailContextInterface = Class.forName("de.xima.fc.mail.interfaces.IMailContext")
      val baseMailDataClass = Class.forName("de.xima.fc.interfaces.mail.IBaseMailData")
      mailContextInterface.getMethod("send", baseMailDataClass).invoke(mailContext, mail)

      log(LogLevel.INFO, "Notification email sent to $recipient about TinyMCE $newVersion")
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to send notification email: ${e.message}")
    }
  }
}
