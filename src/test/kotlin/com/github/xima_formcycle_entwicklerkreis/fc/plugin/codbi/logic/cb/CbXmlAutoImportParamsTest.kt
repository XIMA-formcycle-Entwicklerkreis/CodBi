package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class CbXmlAutoImportParamsTest {

  @Test
  fun `reads the exclusion list from every documented key`() {
    CbXmlAutoImportParams.EXCLUSION_KEYS.forEach { key ->
      assertEquals(
          listOf("bemerkung"),
          CbXmlAutoImportParams.excludedFields(mapOf(key to listOf("bemerkung"))),
          "key $key")
    }
  }

  @Test
  fun `accepts names, objects, a string and a map`() {
    assertEquals(
        listOf("a", "b"),
        CbXmlAutoImportParams.excludedFields(mapOf("excludedFields" to listOf(" a ", "b", "a"))))

    assertEquals(
        listOf("a", "b"),
        CbXmlAutoImportParams.excludedFields(
            mapOf(
                "exclusions" to
                    listOf(mapOf("field" to "a"), mapOf("technicalId" to "b"), mapOf("x" to "y")))))

    assertEquals(
        listOf("a", "b", "c"),
        CbXmlAutoImportParams.excludedFields(mapOf("excludeFields" to "a, b\nc")))

    assertEquals(
        listOf("a", "b"),
        CbXmlAutoImportParams.excludedFields(mapOf("excluded" to mapOf("a" to false, "b" to true))))
  }

  @Test
  fun `ignores empty and missing exclusion lists`() {
    assertTrue(CbXmlAutoImportParams.excludedFields(emptyMap()).isEmpty())
    assertTrue(
        CbXmlAutoImportParams.excludedFields(mapOf("excludedFields" to emptyList<String>()))
            .isEmpty())
    assertTrue(CbXmlAutoImportParams.excludedFields(mapOf("excludedFields" to "  ,  ")).isEmpty())
    assertTrue(CbXmlAutoImportParams.excludedFields(mapOf("excludedFields" to 42)).isEmpty())
  }

  @Test
  fun `reads boolean flags in the shapes a model produces`() {
    assertTrue(CbXmlAutoImportParams.flag(mapOf("dryRun" to true), "dryRun", false))
    assertTrue(CbXmlAutoImportParams.flag(mapOf("dryRun" to "true"), "dryRun", false))
    assertTrue(CbXmlAutoImportParams.flag(mapOf("dryRun" to "JA"), "dryRun", false))
    assertTrue(CbXmlAutoImportParams.flag(mapOf("dryRun" to 1), "dryRun", false))
    assertFalse(CbXmlAutoImportParams.flag(mapOf("dryRun" to "false"), "dryRun", true))
    assertFalse(CbXmlAutoImportParams.flag(mapOf("dryRun" to 0), "dryRun", true))
    assertTrue(CbXmlAutoImportParams.flag(emptyMap(), "overwriteExisting", true))
    assertFalse(CbXmlAutoImportParams.flag(emptyMap(), "dryRun", false))
  }

  @Test
  fun `normalizes every spelling of the node type`() {
    listOf(
            "cbXMLAutoImport",
            "cbXmlAutoImport",
            "CBXMLAUTOIMPORT",
            "CbXMLAutoImport",
            "XML auto import",
            "XML-Auto-Import",
            "XML Automatischer Import",
            "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CbXmlAutoImportNodePlugin")
        .forEach { raw ->
          assertEquals(
              WorkflowSpecNormalizer.XML_AUTO_IMPORT_NODE_TYPE,
              WorkflowSpecNormalizer.canonicalNodeType(raw),
              "type $raw")
        }
  }
}
