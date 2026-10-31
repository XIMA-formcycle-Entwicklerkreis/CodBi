package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiFormResourcesPlugin
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.testDestroy
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.testInit
import de.xima.fc.interfaces.plugin.retval.form.IPluginFormResourceDescriptor
import de.xima.fc.interfaces.workflow.IResourceDescriptor
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.net.URI
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Tests for [FormRenderCallback.collectCodbiUsage]: the CodBi functionalities/EPs of the RENDERED
 * markup must be detected, because elements a Mirror renders LIVE belong to another form and are
 * therefore absent from the target form's persisted items.
 */
class FormRenderCallbackCodbiUsageTest {
  private val plugin = CodbiFormResourcesPlugin()

  @BeforeEach
  fun setUp() {
    plugin.testInit()
    // The generated web bundle is not on the test classpath as a directory the plugin's resource
    // scan can walk, so seed the resources these tests reference.
    val seeded =
        listOf("media.multipleupload.js", "date.min.js", "date.max.js", "date.today.js", "codbi.js")
            .associateWith { name -> descriptor(name) }
    CodbiFormResourcesPlugin.formResources = CodbiFormResourcesPlugin.formResources + seeded
  }

  @AfterEach
  fun tearDown() {
    plugin.testDestroy()
  }

  @Test
  fun collectsFunctionalitiesFromMirroredMarkup() {
    val functionalities = mutableSetOf<String>()
    val eps = mutableSetOf<String>()
    // A mirrored XUpload inside the target form's rendered markup. Its `data-cb-func` comes from
    // the
    // SOURCE form and must still cause the functionality script to be injected.
    val markup =
        """
        <div class="codbi-mirror">
          <div class="xm-item-div CXUpload" data-xi="xi-mir-1_xi-up-1">
            <input type="file" name="mirFormElement_up1" data-cb-func="media.multipleupload" />
          </div>
        </div>
        """

    FormRenderCallback.collectCodbiUsage(markup, functionalities, eps)

    assertEquals(setOf("media.multipleupload"), functionalities)
    assertTrue(eps.isEmpty(), "eps=$eps")
  }

  @Test
  fun collectsMultipleFunctionalitiesAndSingleQuotedValues() {
    val functionalities = mutableSetOf<String>()
    val eps = mutableSetOf<String>()
    val markup =
        "<span data-cb-func='date.min, media.multipleupload'><b data-cb-func=\"date.max\"></b></span>"

    FormRenderCallback.collectCodbiUsage(markup, functionalities, eps)

    assertEquals(setOf("date.min", "date.max", "media.multipleupload"), functionalities)
  }

  @Test
  fun collectsElementPlaceholdersFromAnyOtherCodbiAttribute() {
    val functionalities = mutableSetOf<String>()
    val eps = mutableSetOf<String>()
    val markup = "<input data-cb-value=\"{date.today > dd.MM.yyyy}\" />"

    FormRenderCallback.collectCodbiUsage(markup, functionalities, eps)

    assertEquals(setOf("date.today"), eps)
    assertTrue(functionalities.isEmpty(), "functionalities=$functionalities")
  }

  @Test
  fun ignoresDataCbApplyAndUnknownResources() {
    val functionalities = mutableSetOf<String>()
    val eps = mutableSetOf<String>()
    val markup =
        """
        <div data-cb-apply="1"
             data-cb-func="does.not.exist"
             data-cb-value="{does.not.exist > x}"></div>
        """

    FormRenderCallback.collectCodbiUsage(markup, functionalities, eps)

    assertTrue(functionalities.isEmpty(), "functionalities=$functionalities")
    assertTrue(eps.isEmpty(), "eps=$eps")
  }

  @Test
  fun extractsTheCodbiAttributesOfTheRenderedMarkup() {
    val markup = """<div data-cb-func="codbi" data-cb-Question='what?'></div>"""

    assertEquals(
        listOf("data-cb-func" to "codbi", "data-cb-Question" to "what?"),
        FormRenderCallback.extractCodbiAttributeUsages(markup))
  }

  /** A minimal form-resource descriptor, so the collection accepts the names the tests use. */
  private fun descriptor(fileName: String): IPluginFormResourceDescriptor =
      object : IPluginFormResourceDescriptor {
        override fun getFileName(): String = fileName

        override fun getMimeType(): String = "text/javascript"

        override fun getResource(): IResourceDescriptor =
            object : IResourceDescriptor {
              override fun getAbsoluteUri(): URI = URI.create("test:$fileName")

              override fun open(): InputStream =
                  ByteArrayInputStream("/* $fileName */".toByteArray())
            }

        override fun isIncludeInForm(): Boolean = true
      }
}
