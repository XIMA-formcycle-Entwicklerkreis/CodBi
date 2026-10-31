package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.alibaba.fastjson.JSONObject
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorFormAccess
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests the deterministic cross-form COPY (`_copyElements`): the AI only names the source; the
 * server clones the full foreign subtree and rebuilds ids/names/parent links.
 */
class ForeignElementCopyTest {

  private fun targetForm(): JsonObject =
      JsonParser.parseString(
              """
              {"items":[
                {"className":"XPage","properties":{"name":"p1","id":"xi-p1","elements":["tfExisting"]}},
                {"className":"XTextField","properties":{"name":"tfExisting","id":"xi-existing","label":"Existing"}}
              ]}
              """)
          .asJsonObject

  private fun node(
      ref: String,
      parentRef: String?,
      name: String,
      className: String,
      properties: String
  ): MirrorFormAccess.MirrorNode =
      MirrorFormAccess.MirrorNode(
          ref = ref,
          parentRef = parentRef,
          name = name,
          className = className,
          properties = JSONObject.parseObject(properties))

  private fun spec(
      parent: String? = "p1",
      name: String? = null,
      after: String? = null,
      before: String? = null
  ) =
      ForeignElementCopy.CopySpec(
          formKey = "project-1",
          element = "xi-div6",
          elementKey = "div6",
          formName = "Meldeformular",
          parent = parent,
          name = name,
          after = after,
          before = before)

  private fun sourceNodes(): List<MirrorFormAccess.MirrorNode> =
      listOf(
          node(
              "xi-div6",
              null,
              "div6",
              "XContainer",
              """{"name":"div6","id":"xi-div6","elements":["selKind","tfName"],"legend":"Div 6"}"""),
          node(
              "xi-sel-kind",
              "xi-div6",
              "selKind",
              "XSelect",
              """{"name":"selKind","id":"xi-sel-kind","label":"Art",
                 "options":[{"text":"A","value":"a"},{"text":"B","value":"b"}],
                 "attributes":[{"text":"data-cb-func","value":"HTML.Input.REGEX"}],
                 "rowid":"row-1","hiddenif":"xi-tf-name"}"""),
          node(
              "xi-tf-name",
              "xi-div6",
              "tfName",
              "XTextField",
              """{"name":"tfName","id":"xi-tf-name","label":"Name","value":"[%selKind%]","rowid":"row-1"}"""))

  private fun JsonObject.items(): JsonArray = getAsJsonArray("items")

  private fun JsonObject.item(name: String): JsonObject {
    for (el in items()) {
      val item = el.asJsonObject
      if (item.getAsJsonObject("properties")?.get("name")?.asString == name) return item
    }
    error("item '$name' not found in $this")
  }

  private fun JsonObject.props(): JsonObject = getAsJsonObject("properties")

  private fun JsonObject.stringArray(key: String): List<String> =
      getAsJsonArray(key).map { it.asString }

  @Test
  fun `copies the full subtree and rebuilds identity, hierarchy and internal references`() {
    val root = targetForm()

    val created = ForeignElementCopy.copySubtree(root, spec(), sourceNodes())

    assertEquals(3, created)
    assertEquals(5, root.items().size())

    val copiedRoot = root.item("div6")
    assertEquals("XContainer", copiedRoot.get("className").asString)
    // parentid must be the parent's technical ID, not its name.
    assertEquals("xi-p1", copiedRoot.props().get("parentid").asString)
    assertEquals(listOf("div6_selKind", "div6_tfName"), copiedRoot.props().stringArray("elements"))

    val copiedSelect = root.item("div6_selKind")
    assertEquals(
        copiedRoot.props().get("id").asString, copiedSelect.props().get("parentid").asString)
    assertEquals("XSelect", copiedSelect.get("className").asString)
    // Configuration is copied verbatim, not re-authored.
    assertEquals(2, copiedSelect.props().getAsJsonArray("options").size())
    assertEquals(
        "HTML.Input.REGEX",
        copiedSelect.props().getAsJsonArray("attributes")[0].asJsonObject.get("value").asString)
    // Row ids stay grouped but are namespaced so they cannot merge with target rows.
    assertEquals("div6_row-1", copiedSelect.props().get("rowid").asString)

    val copiedName = root.item("div6_tfName")
    assertEquals(copiedRoot.props().get("id").asString, copiedName.props().get("parentid").asString)
    // Internal placeholder and condition references are remapped to the copied siblings.
    assertEquals("[%div6_selKind%]", copiedName.props().get("value").asString)
    assertEquals(
        copiedName.props().get("id").asString, copiedSelect.props().get("hiddenif").asString)

    // The copied root is referenced by the target page (after the existing element).
    assertEquals(listOf("tfExisting", "div6"), root.item("p1").props().stringArray("elements"))
  }

  @Test
  fun `uses a unique root name when the target already has the source name`() {
    val root = targetForm()
    val existing =
        JsonParser.parseString(
                """{"className":"XContainer","properties":{"name":"div6","id":"xi-div6-old","elements":[]}}""")
            .asJsonObject
    root.items().add(existing)

    ForeignElementCopy.copySubtree(root, spec(), sourceNodes())

    assertNotNull(root.items().firstOrNull { it.asJsonObject.itemNameIs("div6_2") })
  }

  @Test
  fun `copies a page subtree without a parent and keeps its children linked`() {
    val root = targetForm()
    val pageNodes =
        listOf(
            node(
                "xi-p9",
                null,
                "p9",
                "XPage",
                """{"name":"p9","id":"xi-p9","header":"Seite 9","elements":["tfNine"]}"""),
            node(
                "xi-tf-nine",
                "xi-p9",
                "tfNine",
                "XTextField",
                """{"name":"tfNine","id":"xi-tf-nine","label":"Feld 9"}"""))

    val created = ForeignElementCopy.copySubtree(root, spec(parent = null), pageNodes)

    assertEquals(2, created)
    val copiedPage = root.item("p9")
    assertFalse(copiedPage.props().has("parentid"))
    assertEquals("Seite 9", copiedPage.props().get("header").asString)
    assertEquals(listOf("p9_tfNine"), copiedPage.props().stringArray("elements"))
    assertEquals("xi-p9", root.item("p9_tfNine").props().get("parentid").asString)
  }

  @Test
  fun `strips the marker even when no user context is available`() {
    val withMarker =
        JsonParser.parseString(
                """
                {"items":[],"_copyElements":[
                  {"formKey":"project-1","element":"xi-div6","elementKey":"div6"}
                ]}
                """)
            .asJsonObject

    val result =
        JsonParser.parseString(ForeignElementCopy.apply(withMarker.toString(), null)).asJsonObject

    assertFalse(result.has(ForeignElementCopy.MARKER))
    assertTrue(result.has("items"))
  }

  @Test
  fun `sanitizes names and keeps the configured after-order`() {
    val root = targetForm()
    ForeignElementCopy.copySubtree(
        root, spec(name = "Kopie div 6", after = "tfExisting"), sourceNodes().take(1))

    assertEquals("Kopie_div_6", root.items().last().asJsonObject.props().get("name").asString)
    assertEquals(
        listOf("tfExisting", "Kopie_div_6"), root.item("p1").props().stringArray("elements"))
  }

  private fun JsonObject.itemNameIs(name: String): Boolean =
      getAsJsonObject("properties")?.get("name")?.asString == name
}
