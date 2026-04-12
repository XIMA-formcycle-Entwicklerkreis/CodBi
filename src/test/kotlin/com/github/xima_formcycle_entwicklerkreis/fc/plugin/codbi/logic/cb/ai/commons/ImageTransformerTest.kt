package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import java.awt.Color
import java.awt.image.BufferedImage
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [ImageTransformer] geometric transformations. */
class ImageTransformerTest {

  private lateinit var testImage: BufferedImage

  /** Creates a 4x2 image with a known pixel pattern for verifying transformations. */
  @BeforeEach
  fun setUp() {
    // 4 wide x 2 tall: top-left red, top-right green, bottom-left blue, bottom-right white
    testImage = BufferedImage(4, 2, BufferedImage.TYPE_INT_RGB)
    testImage.setRGB(0, 0, Color.RED.rgb)
    testImage.setRGB(3, 0, Color.GREEN.rgb)
    testImage.setRGB(0, 1, Color.BLUE.rgb)
    testImage.setRGB(3, 1, Color.WHITE.rgb)
  }

  @Nested
  inner class TransformationEnum {

    @Test
    fun hasSevenValues() {
      assertEquals(7, ImageTransformer.Transformation.entries.size)
    }

    @Test
    fun containsAllExpectedValues() {
      assertNotNull(ImageTransformer.Transformation.valueOf("ROTATE_90"))
      assertNotNull(ImageTransformer.Transformation.valueOf("ROTATE_180"))
      assertNotNull(ImageTransformer.Transformation.valueOf("ROTATE_270"))
      assertNotNull(ImageTransformer.Transformation.valueOf("FLIP_HORIZONTAL"))
      assertNotNull(ImageTransformer.Transformation.valueOf("FLIP_VERTICAL"))
      assertNotNull(ImageTransformer.Transformation.valueOf("ROTATE_90_FLIP_HORIZONTAL"))
      assertNotNull(ImageTransformer.Transformation.valueOf("ROTATE_270_FLIP_HORIZONTAL"))
    }
  }

  @Nested
  inner class Rotate90Test {

    @Test
    fun swapsDimensions() {
      val result = ImageTransformer.rotate90(testImage)
      assertEquals(2, result.width) // height becomes width
      assertEquals(4, result.height) // width becomes height
    }

    @Test
    fun topLeftMovesToTopRight() {
      val result = ImageTransformer.rotate90(testImage)
      // After 90° CW rotation: top-left (0,0) of original goes to top-right area
      assertEquals(testImage.getRGB(0, 0), result.getRGB(result.width - 1, 0))
    }
  }

  @Nested
  inner class Rotate180Test {

    @Test
    fun preservesDimensions() {
      val result = ImageTransformer.rotate180(testImage)
      assertEquals(testImage.width, result.width)
      assertEquals(testImage.height, result.height)
    }

    @Test
    fun topLeftMovesToBottomRight() {
      val result = ImageTransformer.rotate180(testImage)
      assertEquals(testImage.getRGB(0, 0), result.getRGB(result.width - 1, result.height - 1))
    }
  }

  @Nested
  inner class Rotate270Test {

    @Test
    fun swapsDimensions() {
      val result = ImageTransformer.rotate270(testImage)
      assertEquals(2, result.width)
      assertEquals(4, result.height)
    }

    @Test
    fun topLeftMovesToBottomLeft() {
      val result = ImageTransformer.rotate270(testImage)
      assertEquals(testImage.getRGB(0, 0), result.getRGB(0, result.height - 1))
    }
  }

  @Nested
  inner class FlipHorizontalTest {

    @Test
    fun preservesDimensions() {
      val result =
          ImageTransformer.transformImage(
              testImage, ImageTransformer.Transformation.FLIP_HORIZONTAL)
      assertEquals(testImage.width, result.width)
      assertEquals(testImage.height, result.height)
    }

    @Test
    fun topLeftMovesToTopRight() {
      val result =
          ImageTransformer.transformImage(
              testImage, ImageTransformer.Transformation.FLIP_HORIZONTAL)
      assertEquals(testImage.getRGB(0, 0), result.getRGB(result.width - 1, 0))
    }

    @Test
    fun topRightMovesToTopLeft() {
      val result =
          ImageTransformer.transformImage(
              testImage, ImageTransformer.Transformation.FLIP_HORIZONTAL)
      assertEquals(testImage.getRGB(3, 0), result.getRGB(0, 0))
    }
  }

  @Nested
  inner class FlipVerticalTest {

    @Test
    fun preservesDimensions() {
      val result =
          ImageTransformer.transformImage(testImage, ImageTransformer.Transformation.FLIP_VERTICAL)
      assertEquals(testImage.width, result.width)
      assertEquals(testImage.height, result.height)
    }

    @Test
    fun topLeftMovesToBottomLeft() {
      val result =
          ImageTransformer.transformImage(testImage, ImageTransformer.Transformation.FLIP_VERTICAL)
      assertEquals(testImage.getRGB(0, 0), result.getRGB(0, result.height - 1))
    }
  }

  @Nested
  inner class ApplyRotationTest {

    @Test
    fun angle0ReturnsOriginal() {
      val result = ImageTransformer.applyRotation(testImage, 0)
      assertSame(testImage, result)
    }

    @Test
    fun angle90Rotates() {
      val result = ImageTransformer.applyRotation(testImage, 90)
      assertEquals(2, result.width)
      assertEquals(4, result.height)
    }

    @Test
    fun angle180Rotates() {
      val result = ImageTransformer.applyRotation(testImage, 180)
      assertEquals(4, result.width)
      assertEquals(2, result.height)
    }

    @Test
    fun angle270Rotates() {
      val result = ImageTransformer.applyRotation(testImage, 270)
      assertEquals(2, result.width)
      assertEquals(4, result.height)
    }

    @Test
    fun invalidAngleReturnsOriginal() {
      val result = ImageTransformer.applyRotation(testImage, 45)
      assertSame(testImage, result)
    }
  }

  @Nested
  inner class CombinedTransformations {

    @Test
    fun rotate90FlipHorizontalSwapsDimensions() {
      val result =
          ImageTransformer.transformImage(
              testImage, ImageTransformer.Transformation.ROTATE_90_FLIP_HORIZONTAL)
      assertEquals(2, result.width)
      assertEquals(4, result.height)
    }

    @Test
    fun rotate270FlipHorizontalSwapsDimensions() {
      val result =
          ImageTransformer.transformImage(
              testImage, ImageTransformer.Transformation.ROTATE_270_FLIP_HORIZONTAL)
      assertEquals(2, result.width)
      assertEquals(4, result.height)
    }
  }

  @Nested
  inner class RoundTripTests {

    @Test
    fun fourRotations90ReturnToOriginalDimensions() {
      var img = testImage
      repeat(4) { img = ImageTransformer.rotate90(img) }
      assertEquals(testImage.width, img.width)
      assertEquals(testImage.height, img.height)
    }

    @Test
    fun doubleRotation180ReturnsToOriginalDimensions() {
      val result = ImageTransformer.rotate180(ImageTransformer.rotate180(testImage))
      assertEquals(testImage.width, result.width)
      assertEquals(testImage.height, result.height)
    }

    @Test
    fun doubleFlipHorizontalReturnsToOriginal() {
      val once =
          ImageTransformer.transformImage(
              testImage, ImageTransformer.Transformation.FLIP_HORIZONTAL)
      val twice =
          ImageTransformer.transformImage(once, ImageTransformer.Transformation.FLIP_HORIZONTAL)
      assertEquals(testImage.width, twice.width)
      assertEquals(testImage.height, twice.height)
      // Pixel values should match original
      assertEquals(testImage.getRGB(0, 0), twice.getRGB(0, 0))
      assertEquals(testImage.getRGB(3, 0), twice.getRGB(3, 0))
    }

    @Test
    fun doubleFlipVerticalReturnsToOriginal() {
      val once =
          ImageTransformer.transformImage(testImage, ImageTransformer.Transformation.FLIP_VERTICAL)
      val twice =
          ImageTransformer.transformImage(once, ImageTransformer.Transformation.FLIP_VERTICAL)
      assertEquals(testImage.getRGB(0, 0), twice.getRGB(0, 0))
      assertEquals(testImage.getRGB(0, 1), twice.getRGB(0, 1))
    }
  }
}
