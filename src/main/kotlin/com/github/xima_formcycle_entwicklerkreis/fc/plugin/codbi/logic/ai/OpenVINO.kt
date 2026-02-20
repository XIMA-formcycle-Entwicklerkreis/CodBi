package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.openvino

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.ONNX
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import java.io.File
import java.net.URI

/**
 * Lightweight OpenVINO manager similar in spirit to the ONNX helper. This class focuses on
 * providing predictor pool management and model directory layout for OpenVINO-based models. It
 * intentionally keeps engine initialization minimal so the project can be adapted to a specific
 * OpenVINO Java binding later.
 *
 * Netzwerkanforderungen / Domains
 * - `storage.openvinotoolkit.org` (HTTPS, Port 443): Herunterladen der offiziellen OpenVINO
 *   ZIP-Archive, aus denen die Runtime-DLLs extrahiert werden.
 * - `repo.maven.apache.org` (HTTPS, Port 443): Optionaler Download des DJL/OpenVINO Engine-JARs und
 *   native JARs, falls verfügbar.
 * - Artifactory-Fallback (konfigurierbar über `-Dcodbi.artifactory.url`), z.B.
 *   `https://artifactory.xima-services.de/artifactory/fc-plugin-dev` (HTTPS, Port 443): Wird
 *   verwendet, wenn Artefakte in Maven Central fehlen oder hinter einem internen Mirror liegen.
 *
 * Hinweise
 * - Für Umgebungen mit Firmen-Proxy muss die JVM korrekt konfiguriert sein (`https.proxyHost`,
 *   `https.proxyPort`) und das Proxy-Zertifikat im Java Truststore (`cacerts`) vorhanden sein,
 *   sonst schlagen HTTPS-Downloads mit `PKIX path building failed` / `certificate_unknown` fehl.
 * - Die Klasse prüft bestehende DLLs in `[modelDir]/openvino_runtime/bin` und lädt nur fehlende
 *   Dateien herunter/extrahiert sie aus dem ZIP-Archiv.
 * - Falls native DLL-Abhängigkeiten (z.B. MSVC Runtime) fehlen, können zusätzliche
 *   Systemkomponenten (z.B. Microsoft Visual C++ Redistributable) erforderlich sein; die Logs
 *   enthalten Hinweise zum weiteren Vorgehen.
 */
abstract class OpenVINO : ONNX() {

  init {
    idLogMessages = "OpenVINO"
  }

  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    // Only perform OpenVINO-specific initialization when the global Active_AI
    // configuration contains the token "openvino". This allows users to control
    // whether OpenVINO helpers are active through the same Active_AI property.
    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""
    if (!activeAI.contains("openvino")) {
      isActive = false
      log(
          AI.LogLevel.INFO,
          "OpenVINO disabled by Active_AI configuration; skipping OpenVINO initialization")
      return
    }
    val pluginDir = File(configData.fileHelper.pluginFolder, "ai/openvino")
    val nativeRootDir = File(pluginDir, "native")
    val nativeRunDir = File(nativeRootDir, "run-${System.currentTimeMillis()}")
    nativeRunDir.mkdirs()
    modelDir = File(pluginDir, "models").also { it.mkdirs() }

    val djlCache = File(pluginDir, "djl-cache")
    djlCache.mkdirs()
    System.setProperty("djl.cache.dir", djlCache.absolutePath)

    // Attempt to extract OpenVINO natives from a Maven-provided JAR similar to ONNX flow.
    nativeLibDir = nativeRunDir
    // Try to initialize ONNX early so the OnnxRuntime engine is registered and
    // available for Criteria that use the OnnxRuntime engine with the OpenVINO EP.
    try {
      if (initEngine()) {
        log(AI.LogLevel.INFO, "ONNX engine initialized early from OpenVINO helper")
      } else {
        log(AI.LogLevel.WARNING, "ONNX engine could not be initialized early from OpenVINO helper")
      }
    } catch (e: Throwable) {
      log(AI.LogLevel.WARNING, "Early ONNX init failed: ${e.message}")
    }
    try {
      if (ensureNativeLibrariesFromMaven(nativeRunDir)) {
        System.setProperty("openvino.native.path", nativeRunDir.absolutePath)
        log(AI.LogLevel.INFO, "Set openvino.native.path to: ${nativeRunDir.absolutePath}")
      }
    } catch (e: Exception) {
      log(AI.LogLevel.WARNING, "Failed to extract OpenVINO natives: ${e.message}")
    }
    // On Windows, ensure the full OpenVINO runtime is present (download + extract DLLs)
    val osName = (System.getProperty("os.name") ?: "").lowercase()
    if (osName.contains("win")) {
      try {
        ensureOpenVINORuntime()
      } catch (e: Exception) {
        log(AI.LogLevel.WARNING, "Failed to ensure OpenVINO runtime: ${e.message}")
      }
    }
    isActive = true
    log(AI.LogLevel.INFO, "OpenVINO helper initialized: ${modelDir?.absolutePath}")
  }

  private data class OpenVINOPlatform(val mavenPlatformDir: String, val nativePaths: List<String>)

  private fun resolveOpenVINOPlatform(): OpenVINOPlatform {
    val os = System.getProperty("os.name").lowercase()
    val arch = System.getProperty("os.arch").lowercase()
    return when {
      os.contains("win") && arch.contains("64") ->
          OpenVINOPlatform(
              "win-x64", listOf("ai/openvino/native/win-x64", "com/intel/openvino/native/win-x64"))
      os.contains("mac") && (arch.contains("aarch") || arch == "arm") ->
          OpenVINOPlatform(
              "osx-aarch64",
              listOf("ai/openvino/native/osx-aarch64", "com/intel/openvino/native/osx-aarch64"))
      os.contains("mac") ->
          OpenVINOPlatform(
              "osx-x64", listOf("ai/openvino/native/osx-x64", "com/intel/openvino/native/osx-x64"))
      arch.contains("aarch") || arch == "arm" ->
          OpenVINOPlatform(
              "linux-aarch64",
              listOf("ai/openvino/native/linux-aarch64", "com/intel/openvino/native/linux-aarch64"))
      else ->
          OpenVINOPlatform(
              "linux-x64",
              listOf("ai/openvino/native/linux-x64", "com/intel/openvino/native/linux-x64"))
    }
  }

  private fun resolveOpenVinoVersionFromClasspath(): String {
    val override = System.getProperty("codbi.openvino.version")?.trim()
    if (!override.isNullOrEmpty() && override.lowercase() != "auto") return override
    return "0.31.0"
  }

  private fun ensureNativeLibrariesFromMaven(targetDir: File): Boolean {
    val platform = resolveOpenVINOPlatform()
    val version = resolveOpenVinoVersionFromClasspath()
    val artifactId = "openvino-engine"
    val groupPath = "ai/djl/openvino"
    val repo = "https://repo.maven.apache.org/maven2"
    val altRepo =
        System.getProperty("codbi.artifactory.url")
            ?: "https://artifactory.xima-services.de/artifactory/fc-plugin-dev"

    val engineJarUrlCentral = "$repo/$groupPath/$artifactId/$version/$artifactId-$version.jar"
    val engineJarUrlAlt = "$altRepo/$groupPath/$artifactId/$version/$artifactId-$version.jar"

    val nativeArtifactId =
        when {
          platform.mavenPlatformDir.contains("win") -> "openvino-native-win-x86_64"
          else -> "openvino-native-linux-x86_64"
        }
    // Native artifacts use a separate version delivered by Intel/OpenVINO releases
    val nativeVersion = System.getProperty("codbi.openvino.native.version") ?: "2024.4.0"
    val nativeJarUrl =
        "$repo/$groupPath/$nativeArtifactId/$nativeVersion/$nativeArtifactId-$nativeVersion.jar"

    val cacheDir = File(targetDir.parentFile ?: targetDir, "maven-cache")
    cacheDir.mkdirs()

    // Download engine JAR (if present) and native JAR (recommended)
    val engineCache = File(cacheDir, "$artifactId-$version.jar")
    val nativeCache = File(cacheDir, "$nativeArtifactId-$nativeVersion.jar")

    try {
      if (!engineCache.exists() || engineCache.length() < 1000) {
        try {
          log(AI.LogLevel.INFO, "Downloading OpenVINO engine JAR from: $engineJarUrlCentral")
          downloadFile(engineJarUrlCentral, engineCache)
        } catch (e1: Exception) {
          log(AI.LogLevel.WARNING, "Central engine JAR not found: ${e1.message}, trying alt repo")
          downloadFile(engineJarUrlAlt, engineCache)
        }
      }
    } catch (X: Exception) {
      log(AI.LogLevel.WARNING, "Engine JAR download failed (continues): ${X.message}")
    }

    try {
      if (!nativeCache.exists() || nativeCache.length() < 1000) {
        try {
          val nativeJarUrlCentral =
              "$repo/$groupPath/$nativeArtifactId/$nativeVersion/$nativeArtifactId-$nativeVersion.jar"
          val nativeJarUrlAlt =
              "$altRepo/$groupPath/$nativeArtifactId/$nativeVersion/$nativeArtifactId-$nativeVersion.jar"
          try {
            log(AI.LogLevel.INFO, "Downloading OpenVINO native JAR from: $nativeJarUrlCentral")
            downloadFile(nativeJarUrlCentral, nativeCache)
          } catch (e2: Exception) {
            log(AI.LogLevel.WARNING, "Native jar not on central: ${e2.message}, trying alt repo")
            downloadFile(nativeJarUrlAlt, nativeCache)
          }
        } catch (X: Exception) {
          log(AI.LogLevel.WARNING, "Native JAR download failed: ${X.message}")
        }
      }
    } catch (X: Exception) {
      log(AI.LogLevel.WARNING, "Native JAR download failed: ${X.message}")
      // Continue — sometimes natives are supplied externally
    }

    // Extract native libs from whichever JAR we obtained
    return try {
      listOf(engineCache, nativeCache)
          .filter { it.exists() && it.length() > 1000 }
          .forEach { jarFile ->
            java.util.jar.JarFile(jarFile).use { jar ->
              jar.entries()
                  .asSequence()
                  .filter { e ->
                    !e.isDirectory &&
                        (e.name.endsWith(".dll") ||
                            e.name.endsWith(".so") ||
                            e.name.endsWith(".dylib"))
                  }
                  .forEach { entry ->
                    val outName = entry.name.substringAfterLast('/')
                    val outFile = File(targetDir, outName)
                    outFile.parentFile?.mkdirs()
                    jar.getInputStream(entry).use { input ->
                      outFile.outputStream().use { output -> input.copyTo(output) }
                    }
                    log(AI.LogLevel.INFO, "Extracted native: ${outFile.absolutePath}")
                  }
            }
          }
      log(AI.LogLevel.INFO, "Successfully extracted OpenVINO natives.")
      true
    } catch (X: Exception) {
      log(AI.LogLevel.ERROR, "Extraction failed: ${X.message}")
      false
    }
  }

  /**
   * Ensure a full OpenVINO runtime is available locally by downloading the official OpenVINO ZIP
   * and extracting required runtime DLLs into the model directory. This mirrors the user's
   * requested behavior for Windows runtime installation.
   */
  private fun ensureOpenVINORuntime() {
    val base =
        modelDir
            ?: run {
              log(AI.LogLevel.WARNING, "Model dir not set - cannot install OpenVINO runtime")
              return
            }
    val binDir = File(base, "openvino_runtime/bin")
    if (!binDir.exists()) binDir.mkdirs()

    val requiredDlls =
        listOf(
            "openvino.dll",
            "openvino_intel_cpu_plugin.dll",
            "openvino_onnx_frontend.dll",
            "tbb12.dll")

    // Only download/extract the DLLs that are missing to avoid unnecessary downloads
    val missing = requiredDlls.filterNot { File(binDir, it).exists() }.toMutableList()
    if (missing.isEmpty()) {
      log(AI.LogLevel.INFO, "OpenVINO Runtime bereits lokal vorhanden.")
      addDirToPath(binDir)
      return
    }

    val zipUrl =
        "https://storage.openvinotoolkit.org/repositories/openvino/packages/2025.4/windows/openvino_toolkit_windows_2025.4.0.20398.8fdad55727d_x86_64.zip"
    val tempZip = File(base, "openvino_temp.zip")

    try {
      log(
          AI.LogLevel.INFO,
          "Fehlende OpenVINO-DLLs: ${missing.joinToString(", ")}. Lade OpenVINO Runtime herunter (nur fehlende Dateien)...")
      URI(zipUrl)
          .toURL()
          .openConnection()
          .apply { connectTimeout = 30000 }
          .getInputStream()
          .use { input -> tempZip.outputStream().use { output -> input.copyTo(output) } }

      log(AI.LogLevel.INFO, "Extrahiere benötigte DLLs...")
      java.util.zip.ZipFile(tempZip).use { zip ->
        val candidatePaths =
            listOf("runtime/bin/intel64/Release/", "runtime/bin/", "runtime/3rdparty/tbb/bin/")
        zip.entries().asSequence().forEach { entry ->
          if (entry.name.endsWith(".dll") && candidatePaths.any { entry.name.contains(it) }) {
            val fileName = entry.name.substringAfterLast("/")
            if (missing.contains(fileName)) {
              zip.getInputStream(entry).use { input ->
                File(binDir, fileName).outputStream().use { output -> input.copyTo(output) }
              }
              log(AI.LogLevel.INFO, "Extrahiert: $fileName (aus ZIP-Pfad: ${entry.name})")
              missing.remove(fileName)
            }
          }
        }
      }
      tempZip.delete()

      if (missing.isEmpty()) {
        log(
            AI.LogLevel.INFO,
            "OpenVINO Runtime erfolgreich installiert (fehlende Dateien ergänzt).")
      } else {
        log(
            AI.LogLevel.WARNING,
            "Einige OpenVINO-DLLs konnten nicht extrahiert: ${missing.joinToString(", ")}")
      }
      addDirToPath(binDir)
    } catch (e: Exception) {
      log(AI.LogLevel.ERROR, "Fehler beim Setup der OpenVINO Runtime: ${e.message}", "", e)
    }
  }

  private fun addDirToPath(binDir: File) {
    val currentPath = System.getProperty("java.library.path") ?: ""
    if (!currentPath.contains(binDir.absolutePath)) {
      System.setProperty(
          "java.library.path", "${binDir.absolutePath}${File.pathSeparator}$currentPath")

      // Try to pre-load known dependency DLLs in a sensible order so the Windows loader
      // can resolve transitive dependencies early. This helps avoid the generic
      // "Can't find dependent libraries" error when the Visual C++ runtime or other
      // deps are missing or not yet visible to the process loader.
      val deps =
          listOf(
              "tbb12.dll",
              "openvino_onnx_frontend.dll",
              "openvino_intel_cpu_plugin.dll",
              "openvino.dll")
      deps.forEach { name ->
        val f = File(binDir, name)
        if (f.exists()) {
          try {
            System.load(f.absolutePath)
            log(AI.LogLevel.INFO, "Pre-loaded native library: ${f.absolutePath}")
          } catch (e: UnsatisfiedLinkError) {
            log(AI.LogLevel.WARNING, "Failed to pre-load ${f.name}: ${e.message}")
          } catch (e: Throwable) {
            log(AI.LogLevel.WARNING, "Failed to pre-load ${f.name}: ${e.message}")
          }
        } else {
          log(
              AI.LogLevel.INFO,
              "Native file missing (will attempt runtime load): ${f.absolutePath}")
        }
      }

      // If pre-loading failed with dependent-library errors it's often caused by
      // a missing MSVC runtime. Provide a helpful hint in the logs.
      // We cannot reliably alter the OS DLL search path for the running JVM after
      // startup on all platforms; recommend installing the Visual C++ Redistributable
      // (2015-2022) x64 on Windows if dependent libraries are still missing.
      log(
          AI.LogLevel.INFO,
          "Added ${binDir.absolutePath} to java.library.path and attempted to pre-load OpenVINO natives. If you still see 'Can't find dependent libraries' please ensure the Microsoft Visual C++ Redistributable (2015-2022, x64) is installed and that all runtime DLLs (e.g. msvcp140.dll) are available on the system PATH.")
    }
  }

  /**
   * Checks whether an OpenVINO runtime is available for the current platform. On Windows this
   * checks the `modelDir/openvino_runtime/bin` folder for required DLLs. On other platforms it
   * checks the extracted `nativeLibDir` for any native libraries.
   */
  protected fun isOpenVinoRuntimeAvailable(): Boolean {
    val base = modelDir ?: return false
    val os = (System.getProperty("os.name") ?: "").lowercase()
    return if (os.contains("win")) {
      val binDir = File(base, "openvino_runtime/bin")
      val requiredDlls =
          listOf(
              "openvino.dll",
              "openvino_intel_cpu_plugin.dll",
              "openvino_onnx_frontend.dll",
              "tbb12.dll")
      requiredDlls.all { File(binDir, it).exists() }
    } else {
      val runDir = nativeLibDir ?: return false
      val files = runDir.listFiles() ?: return false
      files.any {
        it.name.endsWith(".so") || it.name.endsWith(".dylib") || it.name.endsWith(".dll")
      }
    }
  }

  protected fun ensureModelDir(): File? = modelDir

  protected fun downloadFile(url: String, targetFile: File) {
    targetFile.parentFile?.mkdirs()
    URI(url).toURL().openConnection().getInputStream().use { input ->
      targetFile.outputStream().use { output -> input.copyTo(output) }
    }
  }

  protected fun ensureModelFiles(map: Map<String, String>) {
    val dir = modelDir ?: return
    map.forEach { (name, url) ->
      val target = File(dir, name)
      if (!target.exists()) {
        try {
          log(AI.LogLevel.INFO, "Downloading OpenVINO model file: $name from $url")
          downloadFile(url, target)
          log(AI.LogLevel.INFO, "Downloaded $name")
        } catch (e: Exception) {
          log(AI.LogLevel.WARNING, "Failed to download $name: ${e.message}")
        }
      }
    }
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)
    predictorPools.values.forEach { pool -> pool.clear() }
    loadedModels.clear()
    isActive = false
  }
}
