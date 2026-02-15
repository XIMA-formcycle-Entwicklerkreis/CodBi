package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.onnx

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import java.io.File
import java.net.URI
import java.util.jar.JarFile

object TokenizersHelper {
  @Volatile private var nativesReady = false
  private var tokenizersNativeRunDir: File? = null

  fun ensureTokenizersNativeLibraries(
      pluginFolder: File,
      log: (AI.LogLevel, String, String, Throwable?) -> Unit,
      keepNewest: Int = 3
  ): File? {
    if (nativesReady && tokenizersNativeRunDir != null && tokenizersNativeRunDir!!.exists())
        return tokenizersNativeRunDir
    val version = "0.36.0"
    val root = File(pluginFolder, "ai/tokenizers/native")
    val runDir = File(root, "run-${System.currentTimeMillis()}")
    val cache = File(root, "maven-cache")
    root.mkdirs()
    runDir.mkdirs()
    cache.mkdirs()
    purgeOldTokenizersRunDirs(root, keepNewest, log)
    val repo = "https://repo1.maven.org/maven2"
    val jarUrl = "$repo/ai/djl/huggingface/tokenizers/$version/tokenizers-$version.jar"
    val jar = File(cache, "tokenizers-$version.jar")
    if (!jar.exists()) {
      try {
        log(AI.LogLevel.INFO, "Downloading tokenizers natives from Maven repo: $jarUrl", "", null)
        downloadTo(jarUrl, jar)
      } catch (X: Exception) {
        log(AI.LogLevel.ERROR, "Failed to download tokenizers jar: ${X.message}", "", X)
        return null
      }
    }
    val os = (System.getProperty("os.name") ?: "").lowercase()
    val arch = (System.getProperty("os.arch") ?: "").lowercase()
    val jarDir =
        when {
          os.contains("windows") -> "native/lib/win-x86_64/cpu"
          os.contains("linux") && (arch.contains("aarch64") || arch.contains("arm64")) ->
              "native/lib/linux-aarch64/cpu"
          os.contains("linux") -> "native/lib/linux-x86_64/cpu"
          os.contains("mac") -> "native/lib/osx-aarch64/cpu"
          else -> null
        } ?: return null
    val requiredNames =
        when {
          jarDir.contains("win-x86_64") ->
              listOf(
                  "tokenizers.dll", "libwinpthread-1.dll", "libstdc++-6.dll", "libgcc_s_seh-1.dll")
          jarDir.contains("linux-") -> listOf("libtokenizers.so")
          jarDir.contains("osx-") -> listOf("libtokenizers.dylib")
          else -> emptyList()
        }
    try {
      JarFile(jar).use { jf ->
        for (name in requiredNames) {
          val entryName = "$jarDir/$name"
          val entry =
              jf.getJarEntry(entryName)
                  ?: throw IllegalStateException(
                      "Missing tokenizers native entry in jar: $entryName")
          val outFile = File(runDir, name)
          jf.getInputStream(entry).use { input ->
            outFile.outputStream().use { output -> input.copyTo(output) }
          }
        }
      }
    } catch (X: Exception) {
      log(AI.LogLevel.ERROR, "Failed to extract tokenizers natives: ${X.message}", "", X)
      return null
    }
    val missing = requiredNames.filter { !File(runDir, it).exists() }
    if (missing.isNotEmpty()) {
      log(AI.LogLevel.ERROR, "Tokenizers natives missing after extraction: $missing", "", null)
      return null
    }
    tokenizersNativeRunDir = runDir
    nativesReady = true
    return runDir
  }

  private fun purgeOldTokenizersRunDirs(
      cacheRootDir: File,
      keepNewest: Int,
      log: (AI.LogLevel, String, String, Throwable?) -> Unit
  ) {
    val runs =
        cacheRootDir
            .listFiles()
            ?.filter { it.isDirectory && it.name.startsWith("run-") }
            ?.sortedByDescending { it.lastModified() } ?: return
    runs.drop(keepNewest).forEach { dir ->
      try {
        dir.deleteRecursively()
        log(AI.LogLevel.INFO, "Deleted old tokenizers native dir: ${dir.absolutePath}", "", null)
      } catch (_: Exception) {}
    }
  }

  private fun downloadTo(url: String, targetFile: File) {
    targetFile.parentFile?.mkdirs()
    URI(url)
        .toURL()
        .openConnection()
        .apply {
          connectTimeout = 15_000
          readTimeout = 600_000
          setRequestProperty("User-Agent", "CodBi-DONUT/1.0")
        }
        .getInputStream()
        .use { input -> targetFile.outputStream().use { output -> input.copyTo(output) } }
  }
}
