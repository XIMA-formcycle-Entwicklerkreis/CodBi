package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow

import de.xima.fc.utils.FormDataUtils
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class XmlAutoImportTest {

  private val knownFields = setOf("firstName", "lastName", "items", "notes")
  private val aliases = mapOf("vorname" to "firstName")

  private fun plan(xml: String, options: XmlAutoImport.Options = XmlAutoImport.Options()) =
      XmlAutoImport.plan(
          document = XmlAutoImport.parse(xml.toByteArray()),
          knownFieldNames = knownFields,
          aliasToFieldName = aliases,
          options = options)

  @Test
  fun `imports every plainValue of a formcycle export whose field exists`() {
    val xml =
        """
        <xfc-data xfc-version="8.5.3">
          <processes>
            <process>
              <form version="3">
                <field name="firstName"><plainValue>Max</plainValue></field>
                <field name="lastName"><plainValue>Mustermann</plainValue></field>
                <field name="street"><plainValue>Hauptstrasse 1</plainValue></field>
              </form>
            </process>
          </processes>
        </xfc-data>
        """
            .trimIndent()

    val plan = plan(xml)

    assertEquals(XmlAutoImport.Format.FORMCYCLE_XML, plan.format)
    assertEquals(listOf("firstName", "lastName"), plan.entries.map { it.fieldName })
    assertEquals(listOf("Max"), plan.entries[0].values)
    assertEquals(listOf("Mustermann"), plan.entries[1].values)
    // "street" is not part of the form and must be reported, never written
    assertEquals(listOf("street"), plan.unknownFieldNames)
    assertFalse(plan.isEmpty)
  }

  @Test
  fun `reads all values of a repeated element`() {
    val xml =
        """
        <xfc-data>
          <field name="items">
            <values count="3">
              <value index="0">A</value>
              <value index="1">B</value>
              <value index="2">C</value>
            </values>
          </field>
        </xfc-data>
        """
            .trimIndent()

    val plan = plan(xml)

    assertEquals(1, plan.entries.size)
    assertEquals(listOf("A", "B", "C"), plan.entries[0].values)
  }

  @Test
  fun `keeps only the first value when repeats are disabled`() {
    val xml =
        """
        <xfc-data>
          <field name="items">
            <values count="2"><value index="0">A</value><value index="1">B</value></values>
          </field>
        </xfc-data>
        """
            .trimIndent()

    val plan = plan(xml, XmlAutoImport.Options(importRepeatedValues = false))

    assertEquals(listOf("A"), plan.entries[0].values)
  }

  @Test
  fun `merges repeated field elements of the same field`() {
    val xml =
        """
        <xfc-data>
          <field name="items"><plainValue>A</plainValue></field>
          <field name="items"><plainValue>B</plainValue></field>
        </xfc-data>
        """
            .trimIndent()

    val plan = plan(xml)

    assertEquals(1, plan.entries.size)
    assertEquals(listOf("A", "B"), plan.entries[0].values)
  }

  @Test
  fun `resolves aliases to the technical field name`() {
    val xml =
        """<xfc-data><field name="vorname"><plainValue>Erika</plainValue></field></xfc-data>"""

    val plan = plan(xml)

    assertEquals(listOf("firstName"), plan.entries.map { it.fieldName })
    assertEquals("vorname", plan.entries[0].rawName)
    assertTrue(plan.unknownFieldNames.isEmpty())
  }

  @Test
  fun `matches field names case insensitively`() {
    val xml =
        """<xfc-data><field name="FIRSTNAME"><plainValue>Max</plainValue></field></xfc-data>"""

    assertEquals(listOf("firstName"), plan(xml).entries.map { it.fieldName })
  }

  @Test
  fun `imports generic xml by element name or name attribute`() {
    val xml =
        """
        <formState>
          <firstName>Max</firstName>
          <data lastName="Mustermann" />
          <notes>   keep me   </notes>
          <unknownField>ignored</unknownField>
        </formState>
        """
            .trimIndent()

    val plan = plan(xml)

    assertEquals(XmlAutoImport.Format.GENERIC_XML, plan.format)
    assertEquals(listOf("firstName", "lastName", "notes"), plan.entries.map { it.fieldName })
    assertEquals(listOf("Max"), plan.entries[0].values)
    assertEquals(listOf("Mustermann"), plan.entries[1].values)
    // trimming removes the indentation of a pretty-printed document
    assertEquals(listOf("keep me"), plan.entries[2].values)
    // structural elements of a generic document are neither imported nor reported as unknown
    assertTrue(plan.unknownFieldNames.isEmpty())
  }

  @Test
  fun `keeps whitespace when trimming is disabled`() {
    val xml = "<formState><notes>  raw  </notes></formState>"

    val plan = plan(xml, XmlAutoImport.Options(trimValues = false))

    assertEquals(listOf("  raw  "), plan.entries[0].values)
  }

  @Test
  fun `reports an empty plan when nothing matches`() {
    val xml = """<xfc-data><field name="street"><plainValue>x</plainValue></field></xfc-data>"""

    val plan = plan(xml)

    assertTrue(plan.isEmpty)
    assertEquals(listOf("street"), plan.unknownFieldNames)
  }

  @Test
  fun `keeps container keys even when the form does not register the container`() {
    // The row field exists in the form → the key must be written verbatim, no container lookup.
    val values =
        linkedMapOf(
            "coAnyContainer_dyn_tfName_0" to listOf("A"),
            "coAnyContainer_dyn_tfName_1" to listOf("B"),
            "coAnyContainer_dyn_size" to listOf("2"))

    val plan = XmlAutoImport.planPersisted(values, knownFields + "tfName", aliases)

    assertEquals(
        listOf(
            "coAnyContainer_dyn_tfName_0",
            "coAnyContainer_dyn_tfName_1",
            "coAnyContainer_dyn_size"),
        plan.entries.map { it.fieldName })
    assertTrue(plan.unknownFieldNames.isEmpty())
  }

  @Test
  fun `container keys whose row field is unknown are reported, not written`() {
    val values = linkedMapOf("coFoo_dyn_unknownField_0" to listOf("A"))

    val plan = XmlAutoImport.planPersisted(values, knownFields, aliases)

    assertTrue(plan.isEmpty)
    assertEquals(listOf("coFoo_dyn_unknownField_0"), plan.unknownFieldNames)
  }

  @Test
  fun `keeps the persisted keys of repeatable containers and repetitions`() {
    val values =
        linkedMapOf(
            "coFoo_dyn_size" to listOf("2"),
            "coFoo_dyn_tfName_0" to listOf("A"),
            "coFoo_dyn_tfName_1" to listOf("B"),
            "notes_quest_0" to listOf("first"),
            "notes_quest_1" to listOf("second"))

    val plan =
        XmlAutoImport.planPersisted(
            values,
            knownFields + "tfName",
            aliases,
            XmlAutoImport.Options(knownContainerNames = setOf("coFoo")))

    // Every key is passed through VERBATIM: the adapter needs `_dyn_size` plus one key per row.
    assertEquals(
        listOf(
            "coFoo_dyn_size",
            "coFoo_dyn_tfName_0",
            "coFoo_dyn_tfName_1",
            "notes_quest_0",
            "notes_quest_1"),
        plan.entries.map { it.fieldName })
    assertEquals(listOf("2"), plan.entries[0].values)
    assertTrue(plan.unknownFieldNames.isEmpty())
  }

  @Test
  fun `excluded container fields are dropped from the persisted keys`() {
    val values =
        linkedMapOf(
            "coFoo_dyn_size" to listOf("2"),
            "coFoo_dyn_tfName_0" to listOf("A"),
            "coFoo_dyn_tfName_1" to listOf("B"))

    val plan =
        XmlAutoImport.planPersisted(
            values,
            knownFields + "tfName",
            aliases,
            XmlAutoImport.Options(
                knownContainerNames = setOf("coFoo"), excludedFieldNames = setOf("tfName")))

    assertEquals(listOf("coFoo_dyn_size"), plan.entries.map { it.fieldName })
    assertEquals(listOf("tfName"), plan.excludedFieldNames)
  }

  @Test
  fun `detects and imports a formcycle persistence document`() {
    // FC_EXPORT_TO_PERSISTENCE writes the RAW stored form data — a java.beans XMLEncoder document,
    // not the <xfc-data> export. FORM CYCLE's own serializer is used so the fixture cannot drift.
    val raw =
        FormDataUtils.serializeFormData(
            linkedMapOf(
                "firstName" to listOf("Max"),
                "lastName" to listOf("Mustermann"),
                "street" to listOf("Hauptstrasse 1"),
                "items" to listOf("A", "B")))

    val persisted = XmlAutoImport.persistedValues(raw)

    assertNotNull(persisted)
    val plan = XmlAutoImport.planPersisted(persisted!!, knownFields, aliases)
    assertEquals(XmlAutoImport.Format.PERSISTENCE_XML, plan.format)
    assertEquals(listOf("firstName", "lastName", "items"), plan.entries.map { it.fieldName })
    assertEquals(listOf("Max"), plan.entries[0].values)
    assertEquals(listOf("A", "B"), plan.entries[2].values)
    assertEquals(listOf("street"), plan.unknownFieldNames)
  }

  @Test
  fun `persistence import honours exclusions and the repeat option`() {
    val raw =
        FormDataUtils.serializeFormData(
            linkedMapOf("firstName" to listOf("Max"), "items" to listOf("A", "B")))

    val plan =
        XmlAutoImport.planPersisted(
            XmlAutoImport.persistedValues(raw)!!,
            knownFields,
            aliases,
            XmlAutoImport.Options(
                importRepeatedValues = false, excludedFieldNames = setOf("firstName")))

    assertEquals(listOf("items"), plan.entries.map { it.fieldName })
    assertEquals(listOf("A"), plan.entries[0].values)
    assertEquals(listOf("firstName"), plan.excludedFieldNames)
  }

  @Test
  fun `plain xml is not mistaken for a persistence document`() {
    assertNull(XmlAutoImport.persistedValues("<xfc-data><field name=\"a\"/></xfc-data>"))
    assertNull(XmlAutoImport.persistedValues(""))
    assertFalse(
        XmlAutoImport.isPersistedFormData("<formState><firstName>x</firstName></formState>"))
  }

  @Test
  fun `skips fields from the exclusion list`() {
    val xml =
        """
        <xfc-data>
          <field name="firstName"><plainValue>Max</plainValue></field>
          <field name="lastName"><plainValue>Mustermann</plainValue></field>
        </xfc-data>
        """
            .trimIndent()

    val plan = plan(xml, XmlAutoImport.Options(excludedFieldNames = setOf("lastName")))

    assertEquals(listOf("firstName"), plan.entries.map { it.fieldName })
    assertEquals(listOf("lastName"), plan.excludedFieldNames)
    assertTrue(plan.unknownFieldNames.isEmpty())
  }

  @Test
  fun `resolves excluded aliases to the technical field name`() {
    val xml =
        """<xfc-data><field name="vorname"><plainValue>Erika</plainValue></field></xfc-data>"""

    val plan = plan(xml, XmlAutoImport.Options(excludedFieldNames = setOf("vorname")))

    assertTrue(plan.isEmpty)
    assertEquals(listOf("firstName"), plan.excludedFieldNames)
  }

  @Test
  fun `ignores exclusions that match no field`() {
    val xml =
        """<xfc-data><field name="firstName"><plainValue>Max</plainValue></field></xfc-data>"""

    val plan = plan(xml, XmlAutoImport.Options(excludedFieldNames = setOf("tippfehler")))

    assertEquals(listOf("firstName"), plan.entries.map { it.fieldName })
    assertTrue(plan.excludedFieldNames.isEmpty())
  }

  @Test
  fun `rejects documents with a doctype`() {
    val xml =
        """
        <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
        <foo>&xxe;</foo>
        """
            .trimIndent()

    assertThrows(Exception::class.java) { XmlAutoImport.parse(xml.toByteArray()) }
  }
}
