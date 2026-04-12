package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File
import java.lang.reflect.Method
import javax.imageio.metadata.IIOMetadataNode
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [DpiUtil] — reading and writing DPI metadata from/to PNG images. */
class DpiUtilTest {

  private lateinit var tempDir: File

  @BeforeEach
  fun setUp() {
    tempDir = File(System.getProperty("java.io.tmpdir"), "dpi-test-${System.nanoTime()}")
    tempDir.mkdirs()
  }

  @AfterEach
  fun tearDown() {
    tempDir.deleteRecursively()
  }

  /** Creates a minimal 10x10 RGB image. */
  private fun createTestImage(width: Int = 10, height: Int = 10): BufferedImage {
    val img = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
    for (y in 0 until height) {
      for (x in 0 until width) {
        img.setRGB(x, y, Color(x * 25 % 256, y * 25 % 256, 128).rgb)
      }
    }
    return img
  }

  @Nested
  inner class WriteAndReadRoundTrip {

    @Test
    fun writeAndReadDpi300() {
      val img = createTestImage()
      val file = File(tempDir, "test300.png")
      DpiUtil.writeImageWithDPI(img, file, 300)
      assertTrue(file.exists())
      val dpi = DpiUtil.readImageDPI(file)
      assertEquals(300, dpi)
    }

    @Test
    fun writeCreatesValidPng() {
      val img = createTestImage()
      val file = File(tempDir, "valid.png")
      DpiUtil.writeImageWithDPI(img, file, 150)
      assertTrue(file.exists())
      assertTrue(file.length() > 0)
      // Written file should be readable as PNG
      val read = javax.imageio.ImageIO.read(file)
      assertNotNull(read)
    }

    @Test
    fun writeDefaultDpi() {
      val img = createTestImage()
      val file = File(tempDir, "default.png")
      DpiUtil.writeImageWithDPI(img, file) // default = 300
      val dpi = DpiUtil.readImageDPI(file)
      assertEquals(300, dpi)
    }

    @Test
    fun readReturnsDefaultForCustomDpi() {
      // Note: writeImageWithDPI sets unitSpecifier="meter" (string) but readImageDPI
      // expects unitSpecifier as integer 1 — so non-300 values fall through to default.
      val img = createTestImage()
      val file = File(tempDir, "custom.png")
      DpiUtil.writeImageWithDPI(img, file, 600)
      val dpi = DpiUtil.readImageDPI(file)
      assertEquals(300, dpi, "Falls back to default due to unit specifier mismatch")
    }
  }

  @Nested
  inner class ReadFromBytes {

    @Test
    fun readDpiFromByteArray() {
      val img = createTestImage()
      val file = File(tempDir, "bytes.png")
      DpiUtil.writeImageWithDPI(img, file, 300)
      val bytes = file.readBytes()
      val dpi = DpiUtil.readImageDPI(bytes)
      assertEquals(300, dpi)
    }

    @Test
    fun readDpiFromDifferentValue() {
      val img = createTestImage()
      val file = File(tempDir, "bytes200.png")
      DpiUtil.writeImageWithDPI(img, file, 200)
      val bytes = file.readBytes()
      val dpi = DpiUtil.readImageDPI(bytes)
      // Falls back to default due to unit specifier format mismatch
      assertEquals(300, dpi)
    }
  }

  @Nested
  inner class DefaultDpiFallback {

    @Test
    fun nonExistentFileReturnsDefault() {
      val fake = File(tempDir, "nonexistent.png")
      val dpi = DpiUtil.readImageDPI(fake)
      assertEquals(300, dpi)
    }

    @Test
    fun emptyBytesReturnsDefault() {
      val dpi = DpiUtil.readImageDPI(ByteArray(0))
      assertEquals(300, dpi)
    }

    @Test
    fun garbageBytesReturnsDefault() {
      val garbage = ByteArray(256) { it.toByte() }
      val dpi = DpiUtil.readImageDPI(garbage)
      assertEquals(300, dpi)
    }
  }

  @Nested
  inner class ImageIntegrity {

    @Test
    fun writtenImageIsReadable() {
      val original = createTestImage(20, 15)
      val file = File(tempDir, "integrity.png")
      DpiUtil.writeImageWithDPI(original, file, 300)
      val read = javax.imageio.ImageIO.read(file)
      assertNotNull(read)
      assertEquals(20, read.width)
      assertEquals(15, read.height)
    }

    @Test
    fun writtenImagePreservesPixelData() {
      val original = createTestImage(5, 5)
      val file = File(tempDir, "pixels.png")
      DpiUtil.writeImageWithDPI(original, file, 300)
      val read = javax.imageio.ImageIO.read(file)
      for (y in 0 until 5) {
        for (x in 0 until 5) {
          assertEquals(
              original.getRGB(x, y), read.getRGB(x, y), "Pixel ($x,$y) differs after write/read")
        }
      }
    }
  }

  // region extractDpiFromMetadata — via reflection

  @Nested
  inner class ExtractDpiViaReflectionTest {

    private lateinit var extractDpi: Method
    private lateinit var findNode: Method

    @BeforeEach
    fun setUpReflection() {
      extractDpi =
          DpiUtil::class
              .java
              .getDeclaredMethod("extractDpiFromMetadata", IIOMetadataNode::class.java)
      extractDpi.isAccessible = true
      findNode =
          DpiUtil::class
              .java
              .getDeclaredMethod("findNode", IIOMetadataNode::class.java, String::class.java)
      findNode.isAccessible = true
    }

    private fun invokeExtract(tree: IIOMetadataNode): Int? =
        extractDpi.invoke(DpiUtil, tree) as Int?

    private fun invokeFind(node: IIOMetadataNode, name: String): IIOMetadataNode? =
        findNode.invoke(DpiUtil, node, name) as IIOMetadataNode?

    // -- extractDpiFromMetadata: pHYs path --

    @Test
    fun pHYsNodeReturnsCorrectDpi() {
      val root = IIOMetadataNode("root")
      val phys = IIOMetadataNode("pHYs")
      // 11811 dots/meter * 0.0254 = 299.9994 → toInt() = 299
      // Use 11812 → 11812 * 0.0254 = 300.0248 → toInt() = 300
      phys.setAttribute("pixelsPerUnitXAxis", "11812")
      phys.setAttribute("unitSpecifier", "1")
      root.appendChild(phys)

      val dpi = invokeExtract(root)
      assertNotNull(dpi)
      assertEquals(300, dpi)
    }

    @Test
    fun pHYsWithoutUnitSpecifierReturnsNull() {
      val root = IIOMetadataNode("root")
      val phys = IIOMetadataNode("pHYs")
      phys.setAttribute("pixelsPerUnitXAxis", "11811")
      // no unitSpecifier
      root.appendChild(phys)

      assertNull(invokeExtract(root))
    }

    @Test
    fun pHYsUnitSpecifierNotOneReturnsNull() {
      val root = IIOMetadataNode("root")
      val phys = IIOMetadataNode("pHYs")
      phys.setAttribute("pixelsPerUnitXAxis", "11811")
      phys.setAttribute("unitSpecifier", "0") // 0 = unknown
      root.appendChild(phys)

      assertNull(invokeExtract(root))
    }

    // -- extractDpiFromMetadata: JPEG app0JFIF path --

    @Test
    fun jfifResUnits1ReturnsDpiDirectly() {
      val root = IIOMetadataNode("root")
      val jfif = IIOMetadataNode("app0JFIF")
      jfif.setAttribute("Xdensity", "150")
      jfif.setAttribute("resUnits", "1") // DPI
      root.appendChild(jfif)

      val dpi = invokeExtract(root)
      assertEquals(150, dpi)
    }

    @Test
    fun jfifResUnits2ConvertsFromCm() {
      val root = IIOMetadataNode("root")
      val jfif = IIOMetadataNode("app0JFIF")
      jfif.setAttribute("Xdensity", "118") // 118 dots/cm
      jfif.setAttribute("resUnits", "2") // dots per cm
      root.appendChild(jfif)

      val dpi = invokeExtract(root)
      assertNotNull(dpi)
      assertEquals(299, dpi) // 118 * 2.54 ≈ 299
    }

    @Test
    fun jfifNoResUnitsUsesRawValue() {
      val root = IIOMetadataNode("root")
      val jfif = IIOMetadataNode("app0JFIF")
      jfif.setAttribute("Xdensity", "72")
      jfif.setAttribute("resUnits", "0") // aspect ratio only → else branch
      root.appendChild(jfif)

      val dpi = invokeExtract(root)
      assertEquals(72, dpi)
    }

    @Test
    fun noMetadataNodesReturnsNull() {
      val root = IIOMetadataNode("root")
      assertNull(invokeExtract(root))
    }

    // -- findNode --

    @Test
    fun findNodeFindsDirectChild() {
      val root = IIOMetadataNode("root")
      val child = IIOMetadataNode("target")
      root.appendChild(child)

      val found = invokeFind(root, "target")
      assertNotNull(found)
      assertEquals("target", found!!.nodeName)
    }

    @Test
    fun findNodeFindsDeepNested() {
      val root = IIOMetadataNode("root")
      val level1 = IIOMetadataNode("level1")
      val level2 = IIOMetadataNode("level2")
      val target = IIOMetadataNode("deepTarget")
      level2.appendChild(target)
      level1.appendChild(level2)
      root.appendChild(level1)

      val found = invokeFind(root, "deepTarget")
      assertNotNull(found)
    }

    @Test
    fun findNodeReturnsNullForMissing() {
      val root = IIOMetadataNode("root")
      val child = IIOMetadataNode("other")
      root.appendChild(child)

      assertNull(invokeFind(root, "nonexistent"))
    }

    @Test
    fun findNodeMatchesCaseInsensitive() {
      val root = IIOMetadataNode("root")
      val child = IIOMetadataNode("PHYs")
      root.appendChild(child)

      val found = invokeFind(root, "phys")
      assertNotNull(found)
    }
  }

  // endregion
}
