package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import java.awt.Color
import java.awt.image.BufferedImage
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [ImagePreprocessor] — grayscale conversion, Otsu/adaptive binarization, denoising. */
class ImagePreprocessorTest {

  /** Creates a simple test image with known pixel values. */
  private fun createGradientImage(width: Int = 100, height: Int = 100): BufferedImage {
    val img = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
    for (y in 0 until height) {
      for (x in 0 until width) {
        val gray = (x * 255 / width.coerceAtLeast(1))
        img.setRGB(x, y, Color(gray, gray, gray).rgb)
      }
    }
    return img
  }

  /** Creates a high-contrast black/white image. */
  private fun createBitonalImage(width: Int = 50, height: Int = 50): BufferedImage {
    val img = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
    for (y in 0 until height) {
      for (x in 0 until width) {
        img.setRGB(x, y, if (x < width / 2) Color.BLACK.rgb else Color.WHITE.rgb)
      }
    }
    return img
  }

  @Nested
  inner class PreprocessDisabled {

    @Test
    fun returnsOriginalWhenDisabled() {
      val original = createGradientImage(20, 20)
      val result = ImagePreprocessor.preprocessImage(original, enabled = false)
      assertSame(original, result)
    }
  }

  @Nested
  inner class ApplyPreprocessingTest {

    @Test
    fun returnsNonNullResult() {
      val image = createGradientImage()
      val result = ImagePreprocessor.applyPreprocessing(image)
      assertNotNull(result)
    }

    @Test
    fun resultImageHasSameDimensions() {
      val image = createGradientImage(80, 60)
      val result = ImagePreprocessor.applyPreprocessing(image)!!
      assertEquals(80, result.image.width)
      assertEquals(60, result.image.height)
    }

    @Test
    fun thresholdIsInValidRange() {
      val image = createGradientImage()
      val result = ImagePreprocessor.applyPreprocessing(image)!!
      assertTrue(result.threshold in 0..255, "Threshold was ${result.threshold}")
    }

    @Test
    fun outputImageIsBinary() {
      val image = createGradientImage()
      val result = ImagePreprocessor.applyPreprocessing(image)!!
      // Binary images should only have black (0x000000) or white (0xFFFFFF) pixels
      for (y in 0 until result.image.height) {
        for (x in 0 until result.image.width) {
          val rgb = result.image.getRGB(x, y) and 0xFFFFFF
          assertTrue(
              rgb == 0x000000 || rgb == 0xFFFFFF,
              "Pixel ($x,$y) was 0x${rgb.toString(16)}, expected black or white")
        }
      }
    }

    @Test
    fun bitonalImageProducesValidThreshold() {
      val image = createBitonalImage()
      val result = ImagePreprocessor.applyPreprocessing(image)!!
      // Threshold must be in the valid 0-255 range
      assertTrue(
          result.threshold in 0..255,
          "Expected threshold in 0-255 for bitonal image, got ${result.threshold}")
    }
  }

  @Nested
  inner class AdaptiveThresholdTest {

    @Test
    fun adaptiveModeReturnsResult() {
      val image = createGradientImage()
      val result = ImagePreprocessor.applyPreprocessing(image, useAdaptive = true)
      assertNotNull(result)
    }

    @Test
    fun adaptiveResultHasSameDimensions() {
      val image = createGradientImage(60, 40)
      val result = ImagePreprocessor.applyPreprocessing(image, useAdaptive = true)!!
      assertEquals(60, result.image.width)
      assertEquals(40, result.image.height)
    }

    @Test
    fun adaptiveOutputIsBinary() {
      val image = createGradientImage(30, 30)
      val result = ImagePreprocessor.applyPreprocessing(image, useAdaptive = true)!!
      for (y in 0 until result.image.height) {
        for (x in 0 until result.image.width) {
          val rgb = result.image.getRGB(x, y) and 0xFFFFFF
          assertTrue(rgb == 0x000000 || rgb == 0xFFFFFF)
        }
      }
    }
  }

  @Nested
  inner class PreprocessResultDataClass {

    @Test
    fun holdsImageAndThreshold() {
      val img = createGradientImage(10, 10)
      val result = ImagePreprocessor.PreprocessResult(img, 128)
      assertSame(img, result.image)
      assertEquals(128, result.threshold)
    }

    @Test
    fun equality() {
      val img = createGradientImage(10, 10)
      val a = ImagePreprocessor.PreprocessResult(img, 100)
      val b = ImagePreprocessor.PreprocessResult(img, 100)
      assertEquals(a, b)
    }
  }

  @Nested
  inner class PreprocessFromBufferedImageTest {

    @Test
    fun enabledPreprocessingReturnsDifferentImage() {
      val original = createGradientImage(40, 40)
      val result = ImagePreprocessor.preprocessImage(original, enabled = true)
      // Result should be a different image object (preprocessed)
      assertNotSame(original, result)
    }

    @Test
    fun resultDimensionsMatch() {
      val original = createGradientImage(50, 30)
      val result = ImagePreprocessor.preprocessImage(original, enabled = true)
      assertEquals(50, result.width)
      assertEquals(30, result.height)
    }
  }
}
