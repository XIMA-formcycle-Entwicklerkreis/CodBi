package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.alibaba.fastjson.JSON
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
import de.xima.fc.interfaces.workflow.params.IGetElementPrototypesParams
import de.xima.fc.interfaces.workflow.value.ValueBuilderOptions
import de.xima.fc.workflow.processor.value.ValueDescriptorFactory
import io.mockk.mockk
import java.util.Locale
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CbXmlAutoImportNodePluginTest {
  private val plugin = CbXmlAutoImportNodePlugin()
  private val params = mockk<IGetElementPrototypesParams>(relaxed = true)

  @Test
  fun `uses the requested technical node type`() {
    assertEquals("cbXMLAutoImport", plugin.name)
  }

  @Test
  fun `provides the properties view`() {
    assertEquals("CbXmlAutoImportNode.xhtml", plugin.propertiesViewXhtmlName)
  }

  @Test
  fun `provides localized display name and description`() {
    assertEquals("XML Auto Import", plugin.getDisplayName(Locale.ENGLISH))
    assertEquals("XML-Auto-Import", plugin.getDisplayName(Locale.GERMAN))
    assertTrue(plugin.getDescription(Locale.ENGLISH).isNotBlank())
    assertTrue(plugin.getDescription(Locale.GERMAN).isNotBlank())
  }

  @Test
  fun `uses the CodBi workflow categories`() {
    val main = plugin.getMainCategory(params)
    val sub = plugin.getSubCategory(params)

    assertEquals("CodBi", main.getName(Locale.ENGLISH))
    assertEquals("XML import", sub.getName(Locale.ENGLISH))
    assertEquals("XML-Import", sub.getName(Locale.GERMAN))
  }

  @Test
  fun `reuses the built-in xml icon`() {
    val icon = plugin.getPrototypeIcon(params)

    assertNotNull(icon)
    assertTrue(icon.styleClass.contains("ico-fc-file-xml"))
  }

  @Test
  fun `uses the CodBi dark-orange theme colour`() {
    assertEquals("#FF8C00", plugin.themeColor.toHexString())
  }

  @Test
  fun `properties view offers every source type and the exclusion list`() {
    val view = plugin.propertiesViewXhtml.readText()

    // source selection: type dropdown plus the script-driven picker and the bound identifier
    assertTrue(view.contains("data-codbi-xml-import=\"true\""))
    // The behaviour is inlined (no extra script request that could fail): see the CDATA block.
    assertTrue(view.contains("<![CDATA["))
    // The current source type is rendered into the panel, so the script never has to read the
    // PrimeFaces widget internals.
    assertTrue(view.contains("data-source-type=\"#{model.sourceType}\""))
    // Source type is a PLAIN select (PrimeFaces' widget state proved unreliable): its value is
    // mirrored into the bound hidden input.
    assertTrue(view.contains("<select id=\"xmlImportSourceType\""))
    assertTrue(view.contains("<option value=\"UPLOAD\">"))
    assertTrue(view.contains("<option value=\"FORM_RESOURCE\">"))
    assertTrue(view.contains("<option value=\"PREVIOUS_NODE\">"))
    assertTrue(view.contains("<option value=\"URL\">"))
    assertTrue(view.contains("codbi-xml-import-source-type-value"))
    assertTrue(view.contains("id=\"xmlImportSourceTypeValue\""))
    assertTrue(view.contains("codbi-xml-import-picker"))
    assertTrue(view.contains("id=\"xmlImportSourceIdentifier\""))
    assertTrue(view.contains("value=\"#{model.sourceIdentifier}\""))
    // The picker (SELECT) and the URL input are both rendered; the script shows the one that
    // belongs to the current source type (the panel is NOT re-rendered on a type change).
    assertTrue(view.contains("codbi-xml-import-picker-label"))
    assertTrue(view.contains("codbi-xml-import-url-label"))
    assertTrue(view.contains("data-source-type=\"URL\"] input.codbi-xml-import-identifier"))

    // exclusion list ("Nicht zu setzende Werte"): chips + a field SELECT (choosing adds a field)
    assertTrue(view.contains("data-codbi-xml-import-exclusion-list=\"true\""))
    assertTrue(
        view.contains("<select class=\"codbi-xml-import-input codbi-xml-import-exclusion-new\""))
    assertTrue(view.contains("id=\"xmlImportExclusionText\""))
    assertTrue(view.contains("value=\"#{model.excludedFieldText}\""))

    // the CodBi logo watermark on the options panel (same as the Mirror node)
    assertTrue(view.contains("codbi-xml-import-options"))
    assertTrue(view.contains("--codbi-logo-url"))
    assertTrue(view.contains("Symbol_CodBi.svg"))

    // the URL input is only shown for the URL source type
    assertTrue(view.contains("codbi-xml-import-url-label"))
    assertTrue(view.contains("codbi-xml-import-picker-label"))

    // options
    assertTrue(view.contains("value=\"#{model.overwriteExisting}\""))
    assertTrue(view.contains("value=\"#{model.trimValues}\""))
    assertTrue(view.contains("value=\"#{model.importRepeatedValues}\""))
    assertTrue(view.contains("value=\"#{model.dryRun}\""))
    assertTrue(view.contains("RESULT.summary"))
  }

  @Test
  fun `properties view uses the already registered mirror servlet action`() {
    // Guards the pickers: the option lists are served by the Mirror action (which is registered
    // for sure); a wrong/unknown action name silently returns no options for every select.
    assertTrue(
        plugin.propertiesViewXhtml
            .readText()
            .contains("data-action-name=\"${Constants.MIRROR_SERVLET_ACTION_NAME}\""))
  }

  @Test
  fun `defaults keep every value, overwrite existing input and exclude nothing`() {
    val props = CbXmlAutoImportNodeProps()

    assertEquals(CbXmlAutoImportNodeProps.SOURCE_TYPE_UPLOAD, props.sourceType)
    assertEquals("", props.sourceIdentifier)
    assertEquals("", props.sourceLabel)
    assertNull(props.xmlSource)
    assertTrue(props.excludedFields.orEmpty().isEmpty())
    assertEquals("", props.excludedFieldText)
    assertTrue(props.overwriteExisting)
    assertTrue(props.trimValues)
    assertTrue(props.importRepeatedValues)
    assertFalse(props.dryRun)
  }

  @Test
  fun `offers exactly the four supported source types`() {
    assertEquals(
        listOf("UPLOAD", "FORM_RESOURCE", "PREVIOUS_NODE", "URL"),
        CbXmlAutoImportNodeProps.SOURCE_TYPES)
  }

  @Test
  fun `persists the configuration through the workflow props serializer`() {
    val props =
        CbXmlAutoImportNodeProps().apply {
          sourceType = CbXmlAutoImportNodeProps.SOURCE_TYPE_PREVIOUS_NODE
          sourceIdentifier = "11111111-2222-3333-4444-555555555555"
          sourceLabel = "Export XML"
          overwriteExisting = false
          dryRun = true
          excludedFields = listOf("bemerkung", " interneNotiz ", "bemerkung")
        }

    val json = JSON.toJSONString(props)
    val restored = JSON.parseObject(json, CbXmlAutoImportNodeProps::class.java)

    assertEquals(CbXmlAutoImportNodeProps.SOURCE_TYPE_PREVIOUS_NODE, restored.sourceType)
    assertEquals("11111111-2222-3333-4444-555555555555", restored.sourceIdentifier)
    assertEquals("Export XML", restored.sourceLabel)
    assertFalse(restored.overwriteExisting)
    assertTrue(restored.dryRun)
    // trimmed + de-duplicated
    assertEquals(listOf("bemerkung", "interneNotiz"), restored.excludedFields)
    // the designer-only text property must not pollute the persisted custom parameters
    assertFalse(json.contains("excludedFieldText"))
  }

  @Test
  fun `exclusion text round-trips through the hidden textarea value`() {
    val props = CbXmlAutoImportNodeProps()

    props.excludedFieldText = "bemerkung\n interneNotiz \n\nbemerkung,letzteAenderung"

    assertEquals(listOf("bemerkung", "interneNotiz", "letzteAenderung"), props.excludedFields)
    assertEquals(
        "bemerkung\ninterneNotiz\nletzteAenderung",
        props.excludedFieldText,
    )
  }

  @Test
  fun `success result keeps the summary with the strict result builder`() {
    val descriptor =
        plugin.getSuccessValueDescriptor(ValueDescriptorFactory.getInstance()).asRecord()

    val result =
        descriptor
            .builder(ValueBuilderOptions.immutable())
            .property("value", "imported 2 field(s) from state.xml, excluded 1")
            .property("summary", "imported 2 field(s) from state.xml, excluded 1")
            .property("format", "FORMCYCLE_XML")
            .property("imported", "2")
            .property("excluded", "1")
            .property("skipped", "0")
            .property("unknown", "1")
            .property("fields", listOf("firstName=Max", "lastName=Mustermann"))
            .property("unknownFields", listOf("street"))
            .property("excludedFields", listOf("bemerkung"))
            .build()

    assertEquals("imported 2 field(s) from state.xml, excluded 1", result["value"])
    assertEquals(listOf("firstName=Max", "lastName=Mustermann"), result["fields"])
    assertEquals(listOf("street"), result["unknownFields"])
    assertEquals(listOf("bemerkung"), result["excludedFields"])
  }
}
