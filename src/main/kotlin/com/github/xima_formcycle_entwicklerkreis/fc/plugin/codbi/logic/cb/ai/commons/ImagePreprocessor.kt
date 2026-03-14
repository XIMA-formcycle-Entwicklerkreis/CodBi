package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO
import org.slf4j.LoggerFactory

/**
 * Stateless image preprocessing pipeline for OCR: grayscale conversion, Otsu binarization, and
 * median denoising.
 */
object ImagePreprocessor {
  private val log = LoggerFactory.getLogger(ImagePreprocessor::class.java)

  /**
   * Preprocesses an image file to improve OCR accuracy. Applies: Grayscale conversion, adaptive
   * binarization, noise reduction.
   *
   * @param inputFile The original image file.
   * @param enabled Whether preprocessing is enabled.
   * @return A new preprocessed image file, or the original if preprocessing is disabled or fails.
   */
  fun preprocessImage(inputFile: File, enabled: Boolean, useAdaptive: Boolean = false): File {
    if (!enabled) {
      log.info(
          "[[ CodBi / AI / Tesseract ]] Image preprocessing disabled (use X-Preprocess: true to enable)")

      return inputFile
    }

    try {
      val originalDPI = DpiUtil.readImageDPI(inputFile)
      val originalImage = ImageIO.read(inputFile) ?: return inputFile
      val result = applyPreprocessing(originalImage, useAdaptive) ?: return inputFile
      val preprocessedFile = kotlin.io.path.createTempFile("ocr_preprocessed_", ".png").toFile()

      DpiUtil.writeImageWithDPI(result.image, preprocessedFile, originalDPI)

      log.info(
          "[[ CodBi / AI / Tesseract ]] Image preprocessing successful: Otsu threshold=${result.threshold}, file=${inputFile.name}")

      return preprocessedFile
    } catch (X: Exception) {
      log.error(
          "[[ CodBi / AI / Tesseract ]] Image preprocessing failed for ${inputFile.name}, using original image: ${X.message}")

      return inputFile
    }
  }

  /**
   * Preprocesses an image in-memory to improve OCR accuracy.
   *
   * @param image The original image.
   * @param enabled Whether preprocessing is enabled.
   * @return The preprocessed image or the original if preprocessing is disabled or fails.
   */
  fun preprocessImage(
      image: BufferedImage,
      enabled: Boolean,
      useAdaptive: Boolean = false
  ): BufferedImage {
    if (!enabled) {
      log.info(
          "[[ CodBi / AI / Tesseract ]] Image preprocessing disabled (use X-Preprocess: true to enable)")

      return image
    }

    return applyPreprocessing(image, useAdaptive)?.image ?: image
  }

  /**
   * Core image preprocessing: grayscale conversion, binarization, and median denoising.
   *
   * @param image The source image.
   * @param useAdaptive When true, uses adaptive (local mean) thresholding instead of global Otsu.
   *   Adaptive thresholding handles uneven lighting and shadows better, making it suitable for
   *   difficult camera captures.
   * @return The preprocessing result, or null if preprocessing fails.
   */
  fun applyPreprocessing(image: BufferedImage, useAdaptive: Boolean = false): PreprocessResult? {
    try {
      val grayscaleImage = BufferedImage(image.width, image.height, BufferedImage.TYPE_BYTE_GRAY)
      val graphics = grayscaleImage.createGraphics()

      graphics.drawImage(image, 0, 0, null)
      graphics.dispose()

      val w = grayscaleImage.width
      val h = grayscaleImage.height
      val binarizedImage = BufferedImage(w, h, BufferedImage.TYPE_BYTE_BINARY)

      val threshold =
          if (useAdaptive) {
            applyAdaptiveThreshold(grayscaleImage, binarizedImage)
          } else {
            applyOtsuThreshold(grayscaleImage, binarizedImage)
          }

      val denoisedImage = applyMedianDenoise(binarizedImage)

      val mode = if (useAdaptive) "adaptive" else "Otsu"

      log.info(
          "[[ CodBi / AI / Tesseract ]] Image preprocessing successful: mode=$mode, threshold=$threshold")

      return PreprocessResult(denoisedImage, threshold)
    } catch (X: Exception) {
      log.error(
          "[[ CodBi / AI / Tesseract ]] Image preprocessing failed, using original image: ${X.message}")

      return null
    }
  }

  /**
   * Otsu global thresholding: computes an optimal global threshold by maximizing inter-class
   * variance.
   */
  private fun applyOtsuThreshold(grayscale: BufferedImage, output: BufferedImage): Int {
    val w = grayscale.width
    val h = grayscale.height
    val histogram = IntArray(256)

    for (y in 0 until h) {
      for (x in 0 until w) {
        histogram[grayscale.getRGB(x, y) and 0xFF]++
      }
    }

    val total = w * h
    var sum = 0.0

    for (i in 0..255) sum += i * histogram[i]

    var sumB = 0.0
    var wB = 0
    var wF: Int
    var maxVariance = 0.0
    var threshold = 0

    for (t in 0..255) {
      wB += histogram[t]

      if (wB == 0) continue

      wF = total - wB

      if (wF == 0) break

      sumB += (t * histogram[t]).toDouble()

      val mB = sumB / wB
      val mF = (sum - sumB) / wF
      val variance = wB.toDouble() * wF.toDouble() * (mB - mF) * (mB - mF)

      if (variance > maxVariance) {
        maxVariance = variance
        threshold = t
      }
    }

    for (y in 0 until h) {
      for (x in 0 until w) {
        val gray = grayscale.getRGB(x, y) and 0xFF

        output.setRGB(x, y, if (gray > threshold) 0xFFFFFF else 0x000000)
      }
    }

    return threshold
  }

  /**
   * Adaptive (local mean) thresholding using an integral image for O(1) per-pixel local mean. Each
   * pixel is compared against the mean of its surrounding block; this handles uneven lighting and
   * shadows that degrade global Otsu thresholding.
   *
   * @param blockSize Side length of the local neighborhood (must be odd). Defaults to 15.
   * @param C Constant subtracted from the local mean; positive values bias toward white.
   */
  private fun applyAdaptiveThreshold(
      grayscale: BufferedImage,
      output: BufferedImage,
      blockSize: Int = 15,
      C: Int = 8
  ): Int {
    val w = grayscale.width
    val h = grayscale.height
    val halfBlock = blockSize / 2

    // Build integral image (use Long to avoid overflow on large images)
    val integral = LongArray((w + 1) * (h + 1))
    val stride = w + 1

    for (y in 0 until h) {
      var rowSum = 0L

      for (x in 0 until w) {
        rowSum += (grayscale.getRGB(x, y) and 0xFF).toLong()
        integral[(y + 1) * stride + (x + 1)] = rowSum + integral[y * stride + (x + 1)]
      }
    }

    // Compute per-pixel threshold from local mean
    var thresholdSum = 0L
    var pixelCount = 0L

    for (y in 0 until h) {
      for (x in 0 until w) {
        val x1 = maxOf(0, x - halfBlock)
        val y1 = maxOf(0, y - halfBlock)
        val x2 = minOf(w - 1, x + halfBlock)
        val y2 = minOf(h - 1, y + halfBlock)
        val count = (x2 - x1 + 1) * (y2 - y1 + 1)
        val sum =
            integral[(y2 + 1) * stride + (x2 + 1)] -
                integral[y1 * stride + (x2 + 1)] -
                integral[(y2 + 1) * stride + x1] + integral[y1 * stride + x1]
        val localThreshold = (sum / count).toInt() - C
        val gray = grayscale.getRGB(x, y) and 0xFF

        output.setRGB(x, y, if (gray > localThreshold) 0xFFFFFF else 0x000000)

        thresholdSum += localThreshold
        pixelCount++
      }
    }

    return if (pixelCount > 0) (thresholdSum / pixelCount).toInt() else 0
  }

  /**
   * 3×3 median filter for binary image denoising. Uses a fixed-size primitive buffer instead of
   * per-pixel list allocation to minimize GC pressure on large images.
   */
  private fun applyMedianDenoise(binarized: BufferedImage): BufferedImage {
    val w = binarized.width
    val h = binarized.height
    val denoisedImage = BufferedImage(w, h, BufferedImage.TYPE_BYTE_BINARY)
    val neighborhood = IntArray(9)

    for (y in 1 until h - 1) {
      for (x in 1 until w - 1) {
        var i = 0

        for (dy in -1..1) {
          for (dx in -1..1) {
            neighborhood[i++] = binarized.getRGB(x + dx, y + dy) and 0xFF
          }
        }

        neighborhood.sort()

        denoisedImage.setRGB(x, y, if (neighborhood[4] > 127) 0xFFFFFF else 0x000000)
      }
    }

    return denoisedImage
  }

  /** Result of image preprocessing containing the processed image and the Otsu threshold used. */
  data class PreprocessResult(val image: BufferedImage, val threshold: Int)
}
