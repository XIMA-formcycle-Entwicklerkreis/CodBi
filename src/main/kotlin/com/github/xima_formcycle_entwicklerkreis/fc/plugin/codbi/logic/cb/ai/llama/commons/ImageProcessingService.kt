package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.TesseractAction
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import java.awt.geom.AffineTransform
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Handles image collection, rotation, downscaling, and base64 encoding for the LLAMA vision
 * pipeline.
 *
 * @param maxPixels Maximum pixel budget for downscaling images before encoding as base64.
 * @param log Logger callback for diagnostic messages.
 */
internal class ImageProcessingService(
    private val maxPixels: Long,
    private val maxUploadBytes: Long,
    private val log: (LogLevel, String) -> Unit
) {

  /**
   * Collects image data from both multipart upload files and base64 data-URL parameters.
   *
   * @param params The servlet action parameters containing upload files and headers.
   * @return A map of input name → raw image bytes.
   */
  fun collectImageData(params: IPluginServletActionParams): Map<String, ByteArray> {
    val fileDataMap = mutableMapOf<String, ByteArray>()

    params.uploadFiles?.forEach { (inputName, fileDataList) ->
      val combinedBytes =
          fileDataList.fold(byteArrayOf()) { acc, fd -> acc + (fd.data ?: byteArrayOf()) }

      if (combinedBytes.isNotEmpty()) {
        fileDataMap[inputName] = combinedBytes

        log(LogLevel.INFO, "Upload image '$inputName': ${combinedBytes.size} bytes")
      }
    }

    params.requestParameters?.forEach { (key, values) ->
      if (key.startsWith("codbi-base64:")) {
        val imageName = key.removePrefix("codbi-base64:")
        val dataUrl = values.firstOrNull() ?: return@forEach

        if (!dataUrl.startsWith("data:image/")) {
          log(LogLevel.WARNING, "Skipping non-image data URL for '$imageName'")

          return@forEach
        }

        val base64 = dataUrl.substringAfter(",")

        try {
          val bytes = java.util.Base64.getDecoder().decode(base64)

          if (bytes.isNotEmpty()) {
            fileDataMap[imageName] = bytes

            log(LogLevel.INFO, "Base64 param image '$imageName': ${bytes.size} bytes")
          }
        } catch (e: IllegalArgumentException) {
          log(LogLevel.WARNING, "Failed to decode base64 for '$imageName': ${e.message}")
        }
      }
    }

    log(
        LogLevel.INFO,
        "Image data: ${fileDataMap.size} images, " +
            "path = ${if (fileDataMap.isNotEmpty()) "IMAGE" else "TEXT-ONLY"}")

    return fileDataMap
  }

  /**
   * Prepares image data for the OpenAI-compatible API: applies rotation, downscales to fit the
   * pixel budget, and encodes as base64 PNG.
   *
   * @return List of base64-encoded PNG strings (data URI format: `data:image/png;base64,...`)
   */
  fun prepareImageParts(fileDataMap: Map<String, ByteArray>, manualRotation: Int?): List<String> {
    val entries =
        fileDataMap.entries.sortedWith(
            compareBy {
              Regex("_(\\d+)\\.[^.]+$").find(it.key)?.groupValues?.get(1)?.toIntOrNull() ?: 0
            })

    return entries.mapNotNull { (inputName, imageBytes) ->
      try {
        if (imageBytes.size > maxUploadBytes) {
          log(
              LogLevel.WARNING,
              "Image '$inputName' exceeds ${maxUploadBytes / (1024 * 1024)} MB limit " +
                  "(${imageBytes.size} bytes) — skipping")

          return@mapNotNull null
        }

        val rotatedBytes = run {
          val buf = ImageIO.read(ByteArrayInputStream(imageBytes)) ?: return@run imageBytes
          val degrees =
              if (manualRotation != null && manualRotation != 0) {
                manualRotation
              } else if (TesseractAction.isOsdAvailable) {
                val detected = TesseractAction.detectOrientation(buf)

                if (detected != 0) {
                  log(
                      LogLevel.INFO,
                      "Tesseract OSD auto-detected rotation for '$inputName': ${detected}°")
                }

                detected
              } else 0

          if (degrees != 0) {
            when (degrees) {
              90,
              180,
              270 -> {
                val rotated = rotateImage(buf, degrees)
                val baos = ByteArrayOutputStream()
                ImageIO.write(rotated, "PNG", baos)
                baos.toByteArray()
              }
              else -> imageBytes
            }
          } else imageBytes
        }

        val finalBytes = downscaleIfNeeded(rotatedBytes)
        val base64 = java.util.Base64.getEncoder().encodeToString(finalBytes)

        log(LogLevel.INFO, "Image '$inputName' prepared: ${finalBytes.size} bytes → base64")
        "data:image/png;base64,$base64"
      } catch (e: Exception) {
        log(LogLevel.WARNING, "Failed to prepare image '$inputName': ${e.message}")

        null
      }
    }
  }

  /**
   * Downscales image bytes if the total pixel count exceeds [maxPixels].
   *
   * @param imageBytes Raw image bytes (PNG, JPEG, etc.).
   * @return Downscaled PNG bytes, or the original bytes if no scaling was needed.
   */
  fun downscaleIfNeeded(imageBytes: ByteArray): ByteArray {
    try {
      val img = ImageIO.read(ByteArrayInputStream(imageBytes)) ?: return imageBytes
      val totalPixels = img.width.toLong() * img.height.toLong()

      if (totalPixels <= maxPixels) return imageBytes

      val scale = sqrt(maxPixels.toDouble() / totalPixels)
      val newW = (img.width * scale).toInt().coerceAtLeast(28)
      val newH = (img.height * scale).toInt().coerceAtLeast(28)

      log(
          LogLevel.INFO,
          "Backend downscaling: ${img.width}\u00d7${img.height} (${totalPixels}px) \u2192 " +
              "${newW}\u00d7${newH} (maxPixels=$maxPixels)")

      val scaled = BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB)
      val g2d = scaled.createGraphics()

      g2d.setRenderingHint(
          java.awt.RenderingHints.KEY_INTERPOLATION,
          java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR)
      g2d.drawImage(img, 0, 0, newW, newH, null)
      g2d.dispose()

      val baos = ByteArrayOutputStream()

      ImageIO.write(scaled, "PNG", baos)

      return baos.toByteArray()
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Downscale failed: ${e.message} — using original")

      return imageBytes
    }
  }

  /**
   * Rotates a [BufferedImage] by 90, 180, or 270 degrees.
   *
   * @param image The source image.
   * @param degrees Rotation angle (must be a multiple of 90).
   * @return A new [BufferedImage] with the rotation applied.
   */
  fun rotateImage(image: BufferedImage, degrees: Int): BufferedImage {
    val rads = Math.toRadians(degrees.toDouble())
    val sin = abs(sin(rads))
    val cos = abs(cos(rads))
    val w = image.width
    val h = image.height
    val newW = floor(w * cos + h * sin).toInt()
    val newH = floor(h * cos + w * sin).toInt()
    val imageType =
        image.type.let {
          if (it == 0) {
            log(LogLevel.WARNING, "Image has TYPE_CUSTOM (0) — converting to TYPE_INT_ARGB")
            BufferedImage.TYPE_INT_ARGB
          } else it
        }
    val rotated = BufferedImage(newW, newH, imageType)
    val g2d = rotated.createGraphics()
    val at = AffineTransform()

    at.translate(newW / 2.0, newH / 2.0)
    at.rotate(rads, 0.0, 0.0)
    at.translate(-w / 2.0, -h / 2.0)
    g2d.transform = at
    g2d.drawImage(image, 0, 0, null)
    g2d.dispose()

    return rotated
  }
}
