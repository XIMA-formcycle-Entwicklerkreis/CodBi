package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import java.awt.geom.AffineTransform
import java.awt.image.AffineTransformOp
import java.awt.image.BufferedImage

/**
 * Stateless utility for geometric image transformations (rotations, flips) used to correct image
 * orientation before OCR processing.
 */
object ImageTransformer {

  /**
   * Defines the possible image transformations that can be applied to correct image orientation.
   */
  enum class Transformation {
    /** Rotates the image 90 degrees clockwise. */
    ROTATE_90,
    /** Rotates the image 180 degrees. */
    ROTATE_180,
    /** Rotates the image 270 degrees clockwise (or 90 degrees counter-clockwise). */
    ROTATE_270,
    /** Flips the image horizontally (mirror effect on vertical axis). */
    FLIP_HORIZONTAL,
    /** Flips the image vertically (mirror effect on horizontal axis). */
    FLIP_VERTICAL,
    /** Rotates the image 90 degrees clockwise, then flips it horizontally. */
    ROTATE_90_FLIP_HORIZONTAL,
    /** Rotates the image 270 degrees clockwise, then flips it horizontally. */
    ROTATE_270_FLIP_HORIZONTAL
  }

  /**
   * Transforms an image using the specified transformation type.
   *
   * @param img The [BufferedImage] to transform.
   * @param transformation The [Transformation] to apply.
   * @return The transformed image.
   */
  fun transformImage(img: BufferedImage, transformation: Transformation): BufferedImage {
    val w = img.width
    val h = img.height
    val at = AffineTransform()

    val (resultWidth, resultHeight, transforms) =
        when (transformation) {
          Transformation.ROTATE_90 ->
              Triple(h, w) {
                at.translate(h.toDouble(), 0.0)
                at.rotate(Math.PI / 2)
              }
          Transformation.ROTATE_180 ->
              Triple(w, h) {
                at.translate(w.toDouble(), h.toDouble())
                at.rotate(Math.PI)
              }
          Transformation.ROTATE_270 ->
              Triple(h, w) {
                at.translate(0.0, w.toDouble())
                at.rotate(-Math.PI / 2)
              }
          Transformation.FLIP_HORIZONTAL ->
              Triple(w, h) {
                at.translate(w.toDouble(), 0.0)
                at.scale(-1.0, 1.0)
              }
          Transformation.FLIP_VERTICAL ->
              Triple(w, h) {
                at.translate(0.0, h.toDouble())
                at.scale(1.0, -1.0)
              }
          Transformation.ROTATE_90_FLIP_HORIZONTAL ->
              Triple(h, w) {
                // Combined: rotate 90° CW then flip horizontally → single affine matrix
                // Flip H after 90° CW = translate(0,0), scale(-1,1) * translate(h,0) * rotate(π/2)
                at.scale(-1.0, 1.0)
                at.translate(-h.toDouble(), 0.0)
                at.rotate(Math.PI / 2)
              }
          Transformation.ROTATE_270_FLIP_HORIZONTAL ->
              Triple(h, w) {
                // Combined: rotate 270° CW then flip horizontally → single affine matrix
                // Flip H after 270° CW = scale(-1,1) * translate(0,w) * rotate(-π/2)
                at.translate(h.toDouble(), w.toDouble())
                at.rotate(-Math.PI / 2)
                at.scale(-1.0, 1.0)
              }
        }

    transforms()

    val result = BufferedImage(resultWidth, resultHeight, img.type)
    val op = AffineTransformOp(at, AffineTransformOp.TYPE_BILINEAR)

    return op.filter(img, result)
  }

  /** Rotates the image 90 degrees clockwise. */
  fun rotate90(img: BufferedImage): BufferedImage = transformImage(img, Transformation.ROTATE_90)

  /** Rotates the image 180 degrees. */
  fun rotate180(img: BufferedImage): BufferedImage = transformImage(img, Transformation.ROTATE_180)

  /** Rotates the image 270 degrees clockwise. */
  fun rotate270(img: BufferedImage): BufferedImage = transformImage(img, Transformation.ROTATE_270)

  /**
   * Applies a rotation angle (0, 90, 180, 270) to the given image.
   *
   * @param image The image to rotate.
   * @param angle The rotation angle in degrees.
   * @return The rotated image, or the original if the angle is 0 or invalid.
   */
  fun applyRotation(image: BufferedImage, angle: Int): BufferedImage =
      when (angle) {
        90 -> rotate90(image)
        180 -> rotate180(image)
        270 -> rotate270(image)
        else -> image
      }
}
