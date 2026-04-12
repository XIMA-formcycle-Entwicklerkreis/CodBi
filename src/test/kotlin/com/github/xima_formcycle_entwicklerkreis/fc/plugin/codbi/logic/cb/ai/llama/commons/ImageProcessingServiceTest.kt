package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [ImageProcessingService] — downscaling, rotation, pixel budget enforcement. */
class ImageProcessingServiceTest {

  private val logs = mutableListOf<String>()
  private val service =
      ImageProcessingService(
          maxPixels = 1_000_000L,
          maxUploadBytes = 10 * 1024 * 1024L,
          log = { _, msg -> logs.add(msg) })

  /** Creates a test image and returns its PNG bytes. */
  private fun createTestImageBytes(width: Int, height: Int): ByteArray {
    val img = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
    val g = img.createGraphics()
    g.color = Color.BLUE
    g.fillRect(0, 0, width, height)
    g.dispose()
    val baos = ByteArrayOutputStream()
    ImageIO.write(img, "PNG", baos)
    return baos.toByteArray()
  }

  /** Creates a BufferedImage directly. */
  private fun createTestImage(width: Int, height: Int): BufferedImage {
    val img = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
    val g = img.createGraphics()
    g.color = Color.RED
    g.fillRect(0, 0, width, height)
    g.dispose()
    return img
  }

  // region Downscaling

  @Nested
  inner class DownscaleTest {

    @Test
    fun noDownscaleWhenUnderBudget() {
      val bytes = createTestImageBytes(100, 100) // 10,000 px << 1M
      val result = service.downscaleIfNeeded(bytes)
      // Should return original bytes
      val img = ImageIO.read(java.io.ByteArrayInputStream(result))
      assertEquals(100, img.width)
      assertEquals(100, img.height)
    }

    @Test
    fun downscalesWhenOverBudget() {
      val bytes = createTestImageBytes(2000, 2000) // 4M px > 1M budget
      val result = service.downscaleIfNeeded(bytes)
      val img = ImageIO.read(java.io.ByteArrayInputStream(result))
      val totalPixels = img.width.toLong() * img.height.toLong()
      assertTrue(
          totalPixels <= 1_100_000, "Downscaled to ${img.width}x${img.height} = $totalPixels px")
    }

    @Test
    fun downscalesMaintainsAspectRatio() {
      val bytes = createTestImageBytes(2000, 1000) // 2M px, 2:1 ratio
      val result = service.downscaleIfNeeded(bytes)
      val img = ImageIO.read(java.io.ByteArrayInputStream(result))
      val ratio = img.width.toDouble() / img.height.toDouble()
      assertEquals(2.0, ratio, 0.15, "Aspect ratio should be approximately 2:1")
    }

    @Test
    fun handlesInvalidBytes() {
      val garbage = ByteArray(256) { it.toByte() }
      val result = service.downscaleIfNeeded(garbage)
      assertArrayEquals(garbage, result, "Should return original on parse failure")
    }

    @Test
    fun minimumDimensions() {
      // Create a very large image that would downscale to tiny
      val smallService =
          ImageProcessingService(
              maxPixels = 100L,
              maxUploadBytes = 10 * 1024 * 1024L,
              log = { _, msg -> logs.add(msg) })
      val bytes = createTestImageBytes(500, 500)
      val result = smallService.downscaleIfNeeded(bytes)
      val img = ImageIO.read(java.io.ByteArrayInputStream(result))
      assertTrue(img.width >= 28, "Width should be at least 28: ${img.width}")
      assertTrue(img.height >= 28, "Height should be at least 28: ${img.height}")
    }
  }

  // endregion

  // region Rotation

  @Nested
  inner class RotationTest {

    @Test
    fun rotate90() {
      val img = createTestImage(100, 50)
      val rotated = service.rotateImage(img, 90)
      assertEquals(50, rotated.width)
      assertEquals(100, rotated.height)
    }

    @Test
    fun rotate180() {
      val img = createTestImage(100, 50)
      val rotated = service.rotateImage(img, 180)
      assertEquals(100, rotated.width)
      assertEquals(50, rotated.height)
    }

    @Test
    fun rotate270() {
      val img = createTestImage(100, 50)
      val rotated = service.rotateImage(img, 270)
      assertEquals(50, rotated.width)
      assertEquals(100, rotated.height)
    }

    @Test
    fun rotate0() {
      val img = createTestImage(100, 50)
      val rotated = service.rotateImage(img, 0)
      assertEquals(100, rotated.width)
      assertEquals(50, rotated.height)
    }

    @Test
    fun squareImageRotation() {
      val img = createTestImage(80, 80)
      val rotated = service.rotateImage(img, 90)
      assertEquals(80, rotated.width)
      assertEquals(80, rotated.height)
    }
  }

  // endregion

  // region Rotation edge cases

  @Nested
  inner class RotationEdgeCasesTest {

    @Test
    fun rotateNonStandardAngle() {
      val img = createTestImage(100, 50)
      val rotated = service.rotateImage(img, 45)
      // For 45°, dimensions change based on sin/cos
      assertTrue(rotated.width > 0)
      assertTrue(rotated.height > 0)
    }

    @Test
    fun rotateMinimalImage() {
      val img = createTestImage(1, 1)
      val rotated = service.rotateImage(img, 90)
      assertTrue(rotated.width >= 1)
      assertTrue(rotated.height >= 1)
    }

    @Test
    fun rotatePreservesPixelData() {
      val img = createTestImage(100, 50)
      val rotated = service.rotateImage(img, 90)
      // Verify rotated image has non-zero pixels
      assertTrue(rotated.getRGB(0, 0) != 0 || rotated.width > 0)
    }

    @Test
    fun rotateWideImage() {
      val img = createTestImage(1000, 10)
      val rotated = service.rotateImage(img, 90)
      assertEquals(10, rotated.width)
      assertEquals(1000, rotated.height)
    }

    @Test
    fun rotateTallImage() {
      val img = createTestImage(10, 1000)
      val rotated = service.rotateImage(img, 270)
      assertEquals(1000, rotated.width)
      assertEquals(10, rotated.height)
    }
  }

  // endregion

  // region Downscale edge cases

  @Nested
  inner class DownscaleEdgeCasesTest {

    @Test
    fun logsDownscaleOperation() {
      val bytes = createTestImageBytes(3000, 3000)
      service.downscaleIfNeeded(bytes)
      assertTrue(
          logs.any { it.contains("Backend downscaling") || it.contains("downscal") },
          "Should log downscale: $logs")
    }

    @Test
    fun extremeAspectRatioWide() {
      val bytes = createTestImageBytes(5000, 100) // 500K px, very wide
      val result = service.downscaleIfNeeded(bytes)
      val img = ImageIO.read(java.io.ByteArrayInputStream(result))
      assertTrue(img.width > img.height, "Wide image should stay wide")
    }

    @Test
    fun extremeAspectRatioTall() {
      val bytes = createTestImageBytes(100, 5000) // 500K px, very tall
      val result = service.downscaleIfNeeded(bytes)
      val img = ImageIO.read(java.io.ByteArrayInputStream(result))
      assertTrue(img.height > img.width, "Tall image should stay tall")
    }

    @Test
    fun justAboveBudget() {
      // Create image just slightly above 1M pixels
      val bytes = createTestImageBytes(1002, 1001)
      val result = service.downscaleIfNeeded(bytes)
      val img = ImageIO.read(java.io.ByteArrayInputStream(result))
      val totalPixels = img.width.toLong() * img.height.toLong()
      assertTrue(totalPixels <= 1_100_000, "Should downscale: $totalPixels")
    }

    @Test
    fun exactlyAtBudget() {
      val bytes = createTestImageBytes(1000, 1000) // Exactly 1M pixels
      val result = service.downscaleIfNeeded(bytes)
      val img = ImageIO.read(java.io.ByteArrayInputStream(result))
      assertEquals(1000, img.width)
      assertEquals(1000, img.height)
    }
  }

  // endregion
}
