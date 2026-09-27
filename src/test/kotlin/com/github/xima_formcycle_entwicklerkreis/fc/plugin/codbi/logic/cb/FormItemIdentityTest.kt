package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

/**
 * Tests [FormItemIdentity] — the fix for the silent loss of a property-level patch.
 *
 * Regression: a patch `{"className":"XTextField","properties":{"label":"Vor-Name"}}` (no `name`, no
 * `id`) matched nothing and was dropped without any warning, so the request produced a
 * byte-identical form (`re-emission stats: items re-emitted=1 (existing=0, new=1)`).
 */
class FormItemIdentityTest {

  private fun obj(json: String) = JsonParser.parseString(json).asJsonObject

  private val originalItems =
      listOf(
          obj(
              """{"className":"XTextField","properties":{"id":"xi-tf-vorname","name":"tfVorname"}}"""),
          obj("""{"className":"XTextField","properties":{"id":"xi-tf-name","name":"tfName"}}"""),
          // No id → cannot contribute to the index.
          obj("""{"className":"XPage","properties":{"name":"p1"}}"""),
          // No name → cannot contribute to the index.
          obj("""{"className":"XFooter","properties":{"id":"xi-footer-1"}}"""))

  @Test
  fun `the index maps id to name and skips incomplete items`() {
    val index = FormItemIdentity.nameById(originalItems)
    assertEquals(mapOf("xi-tf-vorname" to "tfVorname", "xi-tf-name" to "tfName"), index)
  }

  @Test
  fun `the name is taken from properties name first`() {
    val index = FormItemIdentity.nameById(originalItems)
    val item =
        obj("""{"className":"XTextField","properties":{"id":"xi-tf-vorname","name":"tfRenamed"}}""")
    assertEquals("tfRenamed", FormItemIdentity.resolveName(item, index))
  }

  @Test
  fun `a patch that kept only the id still resolves to the element name`() {
    val index = FormItemIdentity.nameById(originalItems)
    val patch =
        obj("""{"className":"XTextField","properties":{"id":"xi-tf-vorname","label":"Vor-Name"}}""")
    assertEquals("tfVorname", FormItemIdentity.resolveName(patch, index))
  }

  @Test
  fun `a top-level name is accepted as a fallback`() {
    val item =
        obj("""{"className":"XTextField","name":"tfVorname","properties":{"label":"Vor-Name"}}""")
    assertEquals("tfVorname", FormItemIdentity.resolveName(item, emptyMap()))
  }

  @Test
  fun `a patch without any identity resolves to null so the caller can warn`() {
    val index = FormItemIdentity.nameById(originalItems)
    val patch = obj("""{"className":"XTextField","properties":{"label":"Vor-Name"}}""")
    assertNull(FormItemIdentity.resolveName(patch, index))
  }

  @Test
  fun `an unknown id does not resolve`() {
    val index = FormItemIdentity.nameById(originalItems)
    val patch =
        obj("""{"className":"XTextField","properties":{"id":"xi-does-not-exist","label":"X"}}""")
    assertNull(FormItemIdentity.resolveName(patch, index))
  }

  @Test
  fun `null and empty inputs are safe`() {
    assertEquals(emptyMap<String, String>(), FormItemIdentity.nameById(null))
    assertEquals(emptyMap<String, String>(), FormItemIdentity.nameById(emptyList()))
    assertNull(FormItemIdentity.resolveName(obj("{}"), emptyMap()))
  }

  @Test
  fun `countWithoutIdentity finds the items the merge can never match`() {
    val aiJson =
        """
        {"_diff":true,"items":[
          {"className":"XTextField","properties":{"label":"Vor-Name"}},
          {"className":"XTextField","properties":{"id":"xi-tf-vorname","label":"Vor-Name"}},
          {"className":"XTextField","properties":{"name":"tfName","label":"Nach-Name"}}
        ]}
        """
    // Only the first item is unmatchable (the second has an id, the third a name).
    assertEquals(1, FormItemIdentity.countWithoutIdentity(aiJson))
  }

  @Test
  fun `countWithoutIdentity is zero for a healthy diff and for garbage`() {
    val healthy =
        """{"items":[{"className":"XTextField","properties":{"name":"tfVorname","label":"Vor-Name"}}]}"""
    assertEquals(0, FormItemIdentity.countWithoutIdentity(healthy))
    assertEquals(0, FormItemIdentity.countWithoutIdentity(null))
    assertEquals(0, FormItemIdentity.countWithoutIdentity(""))
    assertEquals(0, FormItemIdentity.countWithoutIdentity("this is prose, not JSON"))
    assertEquals(0, FormItemIdentity.countWithoutIdentity("""{"title":"no items array"}"""))
  }
}
