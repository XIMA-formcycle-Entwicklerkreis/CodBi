package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import ai.djl.modality.cv.Image
import ai.djl.modality.cv.ImageFactory
import ai.djl.modality.cv.output.DetectedObjects
import ai.djl.ndarray.NDList
import ai.djl.repository.zoo.Criteria
import ai.djl.translate.Batchifier
import ai.djl.translate.Translator
import ai.djl.translate.TranslatorContext
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.Pytorch
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.request.FileData
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.io.SequenceInputStream
import java.net.HttpURLConnection
import java.nio.charset.StandardCharsets
import java.util.*
import java.util.stream.Stream
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory

class PyTorchOcrTranslator : Translator<Image, String> {
  override fun processInput(ctx: TranslatorContext, input: Image): NDList {
    var array = input.toNDArray(ctx.ndManager, Image.Flag.GRAYSCALE)
    // CRNN (OCR) models almost always require a fixed height of 32 pixels
    array = ai.djl.modality.cv.util.NDImageUtils.resize(array, 100, 32)
    array = array.toType(ai.djl.ndarray.types.DataType.FLOAT32, false)
    // Standard ImageNet/Vision normalization
    array = array.div(255f).sub(0.5f).div(0.5f)
    return NDList(array)
  }

  override fun processOutput(ctx: TranslatorContext, list: NDList): String {
    // For testing: if we get here, the model is working!
    return "Model Inference Successful"
  }

  override fun getBatchifier(): Batchifier = Batchifier.STACK
}

/**
 * OCR specialization for the FORMCYCLE CodBi Plugin. Chaining CRAFT Detection and CRNN Recognition.
 */
class OcrAction : Pytorch<Image, String>() {
  private val logger = LoggerFactory.getLogger(OcrAction::class.java)

  override fun getName(): String = "CodBi_OCR"

  override fun getCriteriaMap(): Map<String, Criteria<*, *>> {
    return mapOf(
        "detector" to
            Criteria.builder()
                .setTypes(Image::class.java, DetectedObjects::class.java)
                .optEngine("PyTorch")
                // CRAFT finds the bounding boxes of text
                .optModelUrls(
                    "https://djl-ai.s3.amazonaws.com/mlrepo/model/cv/object_detection/ai/djl/pytorch/craft/0.0.1/craft.zip")
                .optArgument("threshold", 0.85)
                .build(),
        "recognizer" to
            Criteria.builder()
                .setTypes(Image::class.java, String::class.java)
                .optEngine("PyTorch")
                // CRNN reads the text inside those boxes
                .optModelUrls(
                    "https://djl-ai.s3.amazonaws.com/mlrepo/model/cv/word_recognition/ai/djl/pytorch/crnn/0.0.1/crnn.zip")
                .optTranslator(PyTorchOcrTranslator())
                .build())
  }

  override fun parseInput(req: HttpServletRequest): Image? {
    TODO("Not yet implemented")
  }

  override fun writeResponse(resp: HttpServletResponse, output: String) {
    TODO("Not yet implemented")
  }

  private fun convertToInputStream(fileDataStream: Stream<out FileData>): InputStream {
    val inputStreams =
        fileDataStream.map { fileData -> ByteArrayInputStream(fileData.data) }.iterator()
    return SequenceInputStream(Collections.enumeration(inputStreams.asSequence().toList()))
  }

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val servletResponse = ServletResponse(EResponseType.JSON)
    servletResponse.encoding = StandardCharsets.UTF_8.name()

    if (params.uploadFiles.isEmpty()) {
      servletResponse.value = "{\"status\": \"error\", \"message\": \"No files uploaded\"}"
      servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST
      return PluginServletActionRetVal(servletResponse)
    }

    val ocrResults = mutableMapOf<String, String>()
    val detector = getPredictor<Image, DetectedObjects>("detector")
    val recognizer = getPredictor<Image, String>("recognizer")

    try {
      params.uploadFiles.forEach { (formFieldName, fileItem) ->
        try {
          fileItem.stream().use { stream ->
            val inputStream = convertToInputStream(stream)
            val image = ImageFactory.getInstance().fromInputStream(inputStream)
            val fileText = StringBuilder()

            // Stage A: Detection
            val detections = detector.predict(image)

            // Sort boxes top-to-bottom (y) then left-to-right (x)
            val sortedItems =
                detections
                    .items<DetectedObjects.DetectedObject>()
                    .sortedWith(compareBy({ it.boundingBox.bounds.x }, { it.boundingBox.bounds.y }))

            // Stage B: Recognition with explicit coordinate getters
            sortedItems.forEach { detection ->
              val box = detection.boundingBox

              // Using get(index) or specific getters to avoid the 'No get method' error
              val x = box.bounds.x.toInt().coerceAtLeast(0)
              val y = box.bounds.y.toInt().coerceAtLeast(0)
              val w = box.bounds.width.toInt()
              val h = box.bounds.height.toInt()

              // Safety Boundary Check
              val safeW = if (x + w > image.width) image.width - x else w
              val safeH = if (y + h > image.height) image.height - y else h

              if (safeW > 0 && safeH > 0) {
                val subImage = image.getSubImage(x, y, safeW, safeH)
                val recognizedText = recognizer.predict(subImage)
                fileText.append(recognizedText).append(" ")
              }
            }
            ocrResults[formFieldName] = fileText.toString().trim()
          }
        } catch (e: Exception) {
          logger.error("OCR Inference failed for '$formFieldName': ${e.message}")
          ocrResults[formFieldName] = "ERROR: ${e.message}"
        }
      }

      // Build JSON output
      val jsonBody =
          ocrResults.entries.joinToString(prefix = "{", postfix = "}") {
            "\"${it.key}\": \"${it.value.replace("\"", "\\\"")}\""
          }

      servletResponse.value = jsonBody
      servletResponse.httpStatusCode = HttpURLConnection.HTTP_OK
    } catch (e: Exception) {
      logger.error("Global OCR execution error", e)
      servletResponse.value = "{\"status\": \"error\", \"message\": \"${e.message}\"}"
      servletResponse.httpStatusCode = HttpURLConnection.HTTP_INTERNAL_ERROR
    } finally {
      releasePredictor("detector", detector)
      releasePredictor("recognizer", recognizer)
    }

    return PluginServletActionRetVal(servletResponse)
  }
}
