package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.File
import javax.imageio.ImageIO
import javax.imageio.metadata.IIOMetadataNode
import org.slf4j.LoggerFactory

/**
 * Stateless utility for reading and writing DPI (dots per inch) metadata in image files.
 *
 * Supports PNG (`pHYs` chunk) and JPEG (`app0JFIF` segment) metadata formats. Falls back to a
 * default of 300 DPI when metadata is missing or unreadable.
 */
object DpiUtil {
  private val log = LoggerFactory.getLogger(DpiUtil::class.java)

  private const val DEFAULT_DPI = 300

  /**
   * Reads DPI metadata from an image file.
   *
   * @param imageFile The image file to read DPI from.
   * @return The DPI value, or 300 as default if not found.
   */
  fun readImageDPI(imageFile: File): Int {
    try {
      val readers =
          ImageIO.getImageReadersByFormatName(imageFile.extension.lowercase().ifEmpty { "png" })

      if (!readers.hasNext()) return DEFAULT_DPI

      val reader = readers.next()
      val iis = ImageIO.createImageInputStream(imageFile)

      if (iis == null) {
        reader.dispose()

        return DEFAULT_DPI
      }

      try {
        reader.input = iis

        val metadata = reader.getImageMetadata(0)
        val formatName = metadata.nativeMetadataFormatName
        val tree = metadata.getAsTree(formatName)

        if (tree is IIOMetadataNode) {
          val dpi = extractDpiFromMetadata(tree)

          if (dpi != null) {
            log.info("[[ CodBi / AI / Tesseract ]] Read DPI from image: $dpi")

            return dpi
          }
        }
      } finally {
        reader.dispose()
        iis.close()
      }
    } catch (X: Exception) {
      log.warn("[[ CodBi / AI / Tesseract ]] Failed to read DPI from image: ${X.message}")
    }

    log.info("[[ CodBi / AI / Tesseract ]] No DPI metadata found, using default $DEFAULT_DPI DPI")

    return DEFAULT_DPI
  }

  /**
   * Reads DPI metadata from image bytes.
   *
   * @param imageBytes The image bytes to read DPI from.
   * @return The DPI value, or 300 as default if not found.
   */
  fun readImageDPI(imageBytes: ByteArray): Int {
    try {
      ByteArrayInputStream(imageBytes).use { input ->
        val iis = ImageIO.createImageInputStream(input) ?: return DEFAULT_DPI

        iis.use {
          val readers = ImageIO.getImageReaders(iis)

          if (!readers.hasNext()) return DEFAULT_DPI

          val reader = readers.next()

          try {
            reader.input = iis

            val metadata = reader.getImageMetadata(0)
            val formatName = metadata.nativeMetadataFormatName
            val tree = metadata.getAsTree(formatName)

            if (tree is IIOMetadataNode) {
              val dpi = extractDpiFromMetadata(tree)

              if (dpi != null) {
                log.info("[[ CodBi / AI / Tesseract ]] Read DPI from image bytes: $dpi")

                return dpi
              }
            }
          } finally {
            reader.dispose()
          }
        }
      }
    } catch (X: Exception) {
      log.warn("[[ CodBi / AI / Tesseract ]] Failed to read DPI from image bytes: ${X.message}")
    }

    log.info(
        "[[ CodBi / AI / Tesseract ]] No DPI metadata found in image bytes, using default $DEFAULT_DPI DPI")

    return DEFAULT_DPI
  }

  /**
   * Writes a BufferedImage to a PNG file with proper DPI metadata. This ensures Tesseract gets the
   * correct resolution information.
   *
   * @param image The image to write.
   * @param outputFile The file to write to.
   * @param dpi The DPI (dots per inch) to set in the image metadata.
   */
  fun writeImageWithDPI(image: BufferedImage, outputFile: File, dpi: Int = DEFAULT_DPI) {
    val writers = ImageIO.getImageWritersByFormatName("png")

    if (!writers.hasNext()) {
      ImageIO.write(image, "PNG", outputFile)

      return
    }

    val writer = writers.next()
    val writeParam = writer.defaultWriteParam
    val ios = ImageIO.createImageOutputStream(outputFile)

    if (ios == null) {
      ImageIO.write(image, "PNG", outputFile)
      writer.dispose()

      return
    }

    try {
      writer.output = ios

      val metadata =
          writer.getDefaultImageMetadata(
              javax.imageio.ImageTypeSpecifier.createFromBufferedImageType(image.type), writeParam)

      val dotsPerMeter = (dpi / 0.0254).toInt()
      val root = metadata.getAsTree("javax_imageio_png_1.0") as IIOMetadataNode
      var physNode: IIOMetadataNode?
      val nodeList = root.getElementsByTagName("pHYs")

      if (nodeList.length > 0) {
        physNode = nodeList.item(0) as IIOMetadataNode
      } else {
        physNode = IIOMetadataNode("pHYs")

        root.appendChild(physNode)
      }

      physNode.setAttribute("pixelsPerUnitXAxis", dotsPerMeter.toString())
      physNode.setAttribute("pixelsPerUnitYAxis", dotsPerMeter.toString())
      physNode.setAttribute("unitSpecifier", "meter")

      try {
        metadata.setFromTree("javax_imageio_png_1.0", root)

        log.info("[[ CodBi / AI / Tesseract ]] Set image DPI to $dpi ($dotsPerMeter dots/meter)")
      } catch (e: Exception) {
        log.warn("[[ CodBi / AI / Tesseract ]] Failed to set DPI metadata: ${e.message}")
      }

      val iioImage = javax.imageio.IIOImage(image, null, metadata)

      writer.write(null, iioImage, writeParam)
    } finally {
      ios.close()
      writer.dispose()
    }
  }

  /**
   * Extracts DPI from a metadata tree, checking PNG pHYs and JPEG app0JFIF nodes.
   *
   * @return The DPI if found, or null.
   */
  private fun extractDpiFromMetadata(tree: IIOMetadataNode): Int? {
    val physNode = findNode(tree, "pHYs")

    if (physNode != null) {
      val pixelsPerUnitX = physNode.getAttribute("pixelsPerUnitXAxis")?.toIntOrNull()
      val unitSpecifier = physNode.getAttribute("unitSpecifier")?.toIntOrNull()

      if (pixelsPerUnitX != null && unitSpecifier == 1) {
        return (pixelsPerUnitX * 0.0254).toInt()
      }
    }

    val jfifNode = findNode(tree, "app0JFIF")

    if (jfifNode != null) {
      val resX = jfifNode.getAttribute("Xdensity")?.toIntOrNull()
      val resUnits = jfifNode.getAttribute("resUnits")?.toIntOrNull()

      if (resX != null) {
        return when (resUnits) {
          1 -> resX
          2 -> (resX * 2.54).toInt()
          else -> resX
        }
      }
    }

    return null
  }

  /**
   * Recursively finds a node by name in metadata tree.
   *
   * @param node The metadata node to search in.
   * @param nodeName The name of the node to find.
   * @return The found node, or null if not found.
   */
  private fun findNode(node: IIOMetadataNode, nodeName: String): IIOMetadataNode? {
    if (node.nodeName.equals(nodeName, ignoreCase = true)) {
      return node
    }

    for (i in 0 until node.length) {
      val child = node.item(i)

      if (child is IIOMetadataNode) {
        val found = findNode(child, nodeName)

        if (found != null) return found
      }
    }

    return null
  }
}
