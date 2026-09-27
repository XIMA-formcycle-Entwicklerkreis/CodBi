package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests the deterministic, inference-free "repeat onto form" merge behind the change log's "apply
 * this entry again" button (`ApplyLogEntry` → [AICodBiAssistant.applyLoggedItems]).
 *
 * The fixtures use the persist shape the designer actually stores (and the assistant emits, see
 * `reorderItemsByTreeOrder`): a FLAT `items` array in tree order where a container references its
 * children by NAME in `properties.elements`. Getting this wrong is exactly what made a restored
 * element invisible in the designer, so the shape is part of the contract under test.
 *
 * The other part of the contract is the one the requirement states: the logged elements are
 * inserted into the CURRENT form, and an element whose id — or technical name — already exists gets
 * a `_cb_ressurected_<N>` identifier, N being the smallest free integer (considering the form's
 * existing ids AND the ids already handed out in the same batch), so the form can never end up with
 * duplicate ids/names.
 */
class ApplyLogEntryTest {

  private val assistant = AICodBiAssistant()

  /** The CURRENT form: one page (`page1`) with a text field (`tfName` / `xi-tf-name`). */
  private val currentForm =
      """
      {"items":[
        {"className":"XPage","properties":{"name":"page1","id":"xi-page-1","elements":["tfName"]}},
        {"className":"XTextField","properties":{"name":"tfName","id":"xi-tf-name","label":"Name"}}
      ]}
      """
          .trimIndent()

  /** The same form after a run added one field. */
  private val formWithNewField =
      """
      {"items":[
        {"className":"XPage","properties":{"name":"page1","id":"xi-page-1","elements":["tfName","tfEmail"]}},
        {"className":"XTextField","properties":{"name":"tfName","id":"xi-tf-name","label":"Name"}},
        {"className":"XTextField","properties":{"name":"tfEmail","id":"xi-tf-email","label":"E-Mail"}}
      ]}
      """
          .trimIndent()

  /** The same form after a run added a fieldset with one field. */
  private val formWithNewFieldSet =
      """
      {"items":[
        {"className":"XPage","properties":{"name":"page1","id":"xi-page-1","elements":["tfName","fsNew"]}},
        {"className":"XTextField","properties":{"name":"tfName","id":"xi-tf-name","label":"Name"}},
        {"className":"XFieldSet","properties":{"name":"fsNew","id":"xi-fs-new","legend":"Neu","elements":["tfA"]}},
        {"className":"XTextField","properties":{"name":"tfA","id":"xi-tf-a","label":"A"}}
      ]}
      """
          .trimIndent()

  /** Builds a stored `items` payload whose elements all live on `page1`, in the given order. */
  private fun entryItems(vararg elements: String): JsonObject {
    val created = JsonArray()
    var index = 1
    for (el in elements) {
      val item = JsonParser.parseString(el).asJsonObject
      val loc = JsonObject()
      loc.add("item", item)
      loc.addProperty("parent", "page1")
      loc.addProperty("index", index++)
      created.add(loc)
    }
    val form = JsonObject()
    form.add("created", created)
    val out = JsonObject()
    out.add("form", form)
    return out
  }

  private fun item(name: String, id: String) =
      """{"className":"XTextField","properties":{"name":"$name","id":"$id","label":"$name"}}"""

  /** All `properties.name` values of the form's flat `items` array, in document order. */
  private fun namesOf(root: JsonObject): List<String> {
    val items = root.getAsJsonArray("items") ?: return emptyList()
    return items.mapNotNull { el ->
      el.takeIf { it.isJsonObject }
          ?.asJsonObject
          ?.getAsJsonObject("properties")
          ?.get("name")
          ?.takeIf { it.isJsonPrimitive }
          ?.asString
    }
  }

  /** The flat item whose `properties.name` is [name]. */
  private fun itemByName(root: JsonObject, name: String): JsonObject? {
    val items = root.getAsJsonArray("items") ?: return null
    for (el in items) {
      val obj = el.takeIf { it.isJsonObject }?.asJsonObject ?: continue
      val n =
          obj.getAsJsonObject("properties")?.get("name")?.takeIf { it.isJsonPrimitive }?.asString
      if (n == name) return obj
    }
    return null
  }

  /** Every `properties.id` of the form's flat `items` array. */
  private fun idsOf(root: JsonObject): List<String> {
    val items = root.getAsJsonArray("items") ?: return emptyList()
    return items.mapNotNull { el ->
      el.takeIf { it.isJsonObject }
          ?.asJsonObject
          ?.getAsJsonObject("properties")
          ?.get("id")
          ?.takeIf { it.isJsonPrimitive }
          ?.asString
    }
  }

  /** The child NAMES the container [name] references in its `properties.elements`. */
  private fun childRefsOf(root: JsonObject, name: String): List<String> {
    val container = itemByName(root, name) ?: return emptyList()
    val elements =
        container.getAsJsonObject("properties")?.getAsJsonArray("elements") ?: return emptyList()
    return elements.mapNotNull { it.takeIf { it.isJsonPrimitive }?.asString }
  }

  /** How many items of the form have this `className`. */
  private fun countClass(root: JsonObject, className: String): Int {
    val items = root.getAsJsonArray("items") ?: return 0
    return items.count { el ->
      el.takeIf { it.isJsonObject }?.asJsonObject?.get("className")?.asString == className
    }
  }

  /** The CURRENT form with a header (containing a span) — for the structural rules. */
  private val formWithHeader =
      """
      {"items":[
        {"className":"XPage","properties":{"name":"page1","id":"xi-page-1","elements":["tfName"]}},
        {"className":"XTextField","properties":{"name":"tfName","id":"xi-tf-name","label":"Name"}},
        {"className":"XHeader","properties":{"name":"header1","id":"xi-header-1","elements":["spLogo"]}},
        {"className":"XSpan","properties":{"name":"spLogo","id":"xi-sp-logo","rtevalue":"<p>Logo</p>"}}
      ]}
      """
          .trimIndent()

  // ---- the merge itself -------------------------------------------------------------------------

  @Test
  fun `a free id and name are inserted unchanged`() {
    val merged =
        assistant.applyLoggedItems(currentForm, entryItems(item("tfEmail", "xi-tf-email")), null)
    assertNotNull(merged)
    assertEquals(listOf("page1", "tfName", "tfEmail"), namesOf(merged!!.form))
    assertTrue(merged.resurrected.isEmpty(), "resurrected=${merged.resurrected}")
    assertEquals(listOf("tfEmail"), merged.applied)
  }

  @Test
  fun `existing ids get the smallest free _cb_ressurected_N`() {
    // TWO logged elements both collide with the existing id -> they must become _cb_ressurected_1
    // and _cb_ressurected_2 (the counter counts what this batch already handed out).
    val merged =
        assistant.applyLoggedItems(
            currentForm,
            entryItems(item("tfName", "xi-tf-name"), item("tfName", "xi-tf-name")),
            null)
    assertNotNull(merged)
    val ids = idsOf(merged!!.form)
    assertTrue(ids.contains("_cb_ressurected_1"), "ids=$ids")
    assertTrue(ids.contains("_cb_ressurected_2"), "ids=$ids")
    assertEquals(listOf("tfName", "tfName"), merged.resurrected)
  }

  @Test
  fun `an existing technical name is suffixed as well`() {
    // The id is free, the NAME is not: Formcycle requires unique names, so the same counter
    // suffixes the name (documented extension of the requested id rule).
    val merged =
        assistant.applyLoggedItems(currentForm, entryItems(item("tfName", "xi-tf-name-2")), null)
    assertNotNull(merged)
    assertEquals(listOf("page1", "tfName", "tfName_cb_ressurected_1"), namesOf(merged!!.form))
    assertEquals(listOf("tfName"), merged.resurrected)
  }

  @Test
  fun `selecting one element applies only that element`() {
    val items = entryItems(item("tfEmail", "xi-tf-email"), item("tfPhone", "xi-tf-phone"))
    val merged = assistant.applyLoggedItems(currentForm, items, "tfPhone")
    assertNotNull(merged)
    assertEquals(listOf("page1", "tfName", "tfPhone"), namesOf(merged!!.form))
    assertEquals(listOf("tfPhone"), merged.applied)
  }

  @Test
  fun `an unknown selection applies nothing`() {
    val items = entryItems(item("tfEmail", "xi-tf-email"))
    assertNull(assistant.applyLoggedItems(currentForm, items, "tfDoesNotExist"))
  }

  // ---- the STORED payload (AiAssistantLog.computeAppliedItems) ----------------------------------

  @Test
  fun `adding a field does not mark its page as changed`() {
    val payload = AiAssistantLog.computeAppliedItems(currentForm, formWithNewField)
    assertNotNull(payload)
    val form = payload!!.getAsJsonObject("form")
    // Only the NEW field is a change — the page merely grew, which is the child's change, not its
    // own
    // (the page only differs in its `properties.elements` name list).
    assertEquals(0, form.getAsJsonArray("changed").size(), form.toString())
    val created = form.getAsJsonArray("created")
    assertEquals(1, created.size(), form.toString())
    assertEquals(
        "tfEmail",
        created[0]
            .asJsonObject
            .getAsJsonObject("item")
            .getAsJsonObject("properties")
            .get("name")
            .asString)
  }

  @Test
  fun `a created element of a flat form records its page as parent`() {
    val payload = AiAssistantLog.computeAppliedItems(currentForm, formWithNewField)
    assertNotNull(payload)
    val created = payload!!.getAsJsonObject("form").getAsJsonArray("created")
    val loc = created[0].asJsonObject
    // WITHOUT the name-reference pass this was `null` — and the element was then invisible.
    assertEquals("page1", loc.get("parent").asString, loc.toString())
    // The index is the position inside the page's name list.
    assertEquals(1, loc.get("index").asInt, loc.toString())
  }

  @Test
  fun `a created container is stored without its children so a re-apply cannot duplicate them`() {
    val payload = AiAssistantLog.computeAppliedItems(currentForm, formWithNewFieldSet)
    assertNotNull(payload)
    val created = payload!!.getAsJsonObject("form").getAsJsonArray("created")
    assertEquals(2, created.size(), "expected the fieldset and its field: $created")
    // The fieldset must NOT carry a child reference (its field is stored separately) …
    val fieldSet = created.map { it.asJsonObject }.first { it.get("parent")?.asString == "page1" }
    val fieldSetItem = fieldSet.getAsJsonObject("item")
    assertNull(fieldSetItem.get("elements"), fieldSet.toString())
    assertNull(fieldSetItem.getAsJsonObject("properties").get("elements"), fieldSet.toString())

    // … and applying it inserts the container AND the field exactly once (no duplicate element).
    val merged = assistant.applyLoggedItems(currentForm, payload, null)
    assertNotNull(merged)
    assertEquals(listOf("page1", "tfName", "fsNew", "tfA"), namesOf(merged!!.form))
    assertEquals(listOf("tfName", "fsNew"), childRefsOf(merged.form, "page1"))
    assertEquals(listOf("tfA"), childRefsOf(merged.form, "fsNew"))
  }

  @Test
  fun `restoring into a flat form adds the object to items and the name to the page`() {
    val payload = AiAssistantLog.computeAppliedItems(currentForm, formWithNewField)!!
    // The user's scenario: the element was deleted again, so it is restored into the flat form.
    val merged = assistant.applyLoggedItems(currentForm, payload, null)
    assertNotNull(merged)
    // The OBJECT must be in the root `items` array (otherwise the designer shows nothing) …
    assertEquals(listOf("page1", "tfName", "tfEmail"), namesOf(merged!!.form))
    // … and the page must reference it BY NAME.
    assertEquals(listOf("tfName", "tfEmail"), childRefsOf(merged.form, "page1"))
  }

  @Test
  fun `a loc without a parent is still appended to the last page by name`() {
    // An entry recorded by the PREVIOUS logic: no `parent` and the index is the position in the
    // flat
    // `items` array. It must still end up visible (page name list + items array).
    val legacy =
        """
        {"form":{"created":[
          {"item":{"className":"XTextField","properties":{"name":"tfEmail","id":"xi-tf-email","label":"E-Mail"}},"index":2}
        ]}}
        """
            .trimIndent()
    val merged =
        assistant.applyLoggedItems(currentForm, JsonParser.parseString(legacy).asJsonObject, null)
    assertNotNull(merged)
    assertEquals(listOf("page1", "tfName", "tfEmail"), namesOf(merged!!.form))
    assertEquals(listOf("tfName", "tfEmail"), childRefsOf(merged.form, "page1"))
  }

  @Test
  fun `two restored elements keep the recorded order in the page`() {
    val payload =
        JsonParser.parseString(
                """
                {"form":{"created":[
                  {"item":{"className":"XTextField","properties":{"name":"tfA","id":"xi-tf-a"}},"parent":"page1","index":1},
                  {"item":{"className":"XTextField","properties":{"name":"tfB","id":"xi-tf-b"}},"parent":"page1","index":2}
                ]}}
                """
                    .trimIndent())
            .asJsonObject
    val merged = assistant.applyLoggedItems(currentForm, payload, null)
    assertNotNull(merged)
    assertEquals(listOf("page1", "tfName", "tfA", "tfB"), namesOf(merged!!.form))
    assertEquals(listOf("tfName", "tfA", "tfB"), childRefsOf(merged.form, "page1"))
  }

  // ---- containers: a container re-apply pulls its children unless asked not to
  // ---------------------

  /** A stored payload with a CONTAINER (`fsNew`, no nested child refs) and its child (`tfA`). */
  private fun containerPayload(): JsonObject =
      JsonParser.parseString(
              """
              {"form":{"created":[
                {"item":{"className":"XFieldSet","properties":{"name":"fsNew","id":"xi-fs-new","legend":"Neu"}},"parent":"page1","index":1},
                {"item":{"className":"XTextField","properties":{"name":"tfA","id":"xi-tf-a","label":"A"}},"parent":"fsNew","index":0}
              ]}}
              """
                  .trimIndent())
          .asJsonObject

  @Test
  fun `a container selection pulls in the logged children`() {
    // The container's own nested children are NOT part of its stored item (they are separate
    // entries
    // whose recorded parent is the container) — a per-container re-apply must pull them in.
    val merged = assistant.applyLoggedItems(currentForm, containerPayload(), "fsNew")
    assertNotNull(merged)
    assertNotNull(itemByName(merged!!.form, "fsNew"))
    assertNotNull(itemByName(merged.form, "tfA"))
    assertEquals(listOf("tfName", "fsNew"), childRefsOf(merged.form, "page1"))
    assertEquals(listOf("tfA"), childRefsOf(merged.form, "fsNew"))
    assertEquals(listOf("fsNew", "tfA"), merged.applied)
  }

  @Test
  fun `withoutChildren restores only the container itself`() {
    val merged =
        assistant.applyLoggedItems(
            currentForm, containerPayload(), "fsNew", includeChildren = false)
    assertNotNull(merged)
    assertNotNull(itemByName(merged!!.form, "fsNew"))
    // The child was NOT restored …
    assertNull(itemByName(merged.form, "tfA"))
    // … and the container has no child reference.
    assertTrue(childRefsOf(merged.form, "fsNew").isEmpty())
    assertEquals(listOf("fsNew"), merged.applied)
  }

  // ---- structural rules: a page/header/footer is not duplicated by a restore
  // ---------------------

  @Test
  fun `a changed page is merged into the existing one instead of being resurrected`() {
    val items =
        JsonParser.parseString(
                """
                {"form":{"changed":[
                  {"item":{"className":"XPage","properties":{"name":"page1","id":"xi-page-1","header":"Neu"}},"index":0}
                ]}}
                """
                    .trimIndent())
            .asJsonObject
    val merged = assistant.applyLoggedItems(currentForm, items, null)
    assertNotNull(merged)
    assertEquals(1, countClass(merged!!.form, "XPage"), merged.form.toString())
    assertEquals(listOf("page1", "tfName"), namesOf(merged.form))
    // The recorded change is applied to the page that is already there.
    assertEquals(
        "Neu",
        itemByName(merged.form, "page1")!!.getAsJsonObject("properties").get("header").asString)
    assertEquals(listOf("page1"), merged.applied)
  }

  @Test
  fun `a logged header is never created and its element goes into the existing header`() {
    val items =
        JsonParser.parseString(
                """
                {"form":{"created":[
                  {"item":{"className":"XHeader","properties":{"name":"header1","id":"xi-header-1"}}},
                  {"item":{"className":"XSpan","properties":{"name":"spLegal","id":"xi-sp-legal","rtevalue":"<p>Impressum</p>"}},"parent":"header1","index":1}
                ]}}
                """
                    .trimIndent())
            .asJsonObject
    val merged = assistant.applyLoggedItems(formWithHeader, items, null)
    assertNotNull(merged)
    // NOT a second header …
    assertEquals(1, countClass(merged!!.form, "XHeader"), merged.form.toString())
    // … but the element that belongs into a header is inserted into the EXISTING one.
    assertEquals(listOf("spLogo", "spLegal"), childRefsOf(merged.form, "header1"))
    assertNotNull(itemByName(merged.form, "spLegal"))
    assertEquals(listOf("spLegal"), merged.applied)
  }

  @Test
  fun `a logged footer is never created and its element falls back to the page`() {
    val items =
        JsonParser.parseString(
                """
                {"form":{"created":[
                  {"item":{"className":"XFooter","properties":{"name":"footer1","id":"xi-footer-1"}}},
                  {"item":{"className":"XSpan","properties":{"name":"spNote","id":"xi-sp-note"}},"parent":"footer1","index":0}
                ]}}
                """
                    .trimIndent())
            .asJsonObject
    // The form has NO footer — it must not be created either.
    val merged = assistant.applyLoggedItems(currentForm, items, null)
    assertNotNull(merged)
    assertEquals(0, countClass(merged!!.form, "XFooter"), merged.form.toString())
    // Its element is still restored (no header/footer exists → the page).
    assertNotNull(itemByName(merged.form, "spNote"))
    assertEquals(listOf("tfName", "spNote"), childRefsOf(merged.form, "page1"))
  }

  @Test
  fun `a changed footer is merged into the existing footer`() {
    val withFooter =
        """
        {"items":[
          {"className":"XPage","properties":{"name":"page1","id":"xi-page-1","elements":["tfName"]}},
          {"className":"XTextField","properties":{"name":"tfName","id":"xi-tf-name","label":"Name"}},
          {"className":"XFooter","properties":{"name":"footer1","id":"xi-footer-1","showlogo":"1"}}
        ]}
        """
            .trimIndent()
    val items =
        JsonParser.parseString(
                """
                {"form":{"changed":[
                  {"item":{"className":"XFooter","properties":{"name":"footer1","id":"xi-footer-1","showlogo":"0"}}}
                ]}}
                """
                    .trimIndent())
            .asJsonObject
    val merged = assistant.applyLoggedItems(withFooter, items, null)
    assertNotNull(merged)
    assertEquals(1, countClass(merged!!.form, "XFooter"), merged.form.toString())
    assertEquals(
        "0",
        itemByName(merged.form, "footer1")!!.getAsJsonObject("properties").get("showlogo").asString)
  }

  // ---- a logged element that is NOT in the form (deleted since) ---------------------------------

  @Test
  fun `a changed element that no longer exists is restored as a new element`() {
    val items =
        JsonParser.parseString(
                """
                {"form":{"changed":[
                  {"item":{"className":"XTextField","properties":{"name":"tfGone","id":"xi-tf-gone","label":"Weg","required":"1"}},"parent":"page1","index":1}
                ]}}
                """
                    .trimIndent())
            .asJsonObject
    val merged = assistant.applyLoggedItems(currentForm, items, null)
    assertNotNull(merged)
    // Nothing to merge onto → the element comes back as the entry left it …
    assertEquals(listOf("page1", "tfName", "tfGone"), namesOf(merged!!.form))
    val restored = itemByName(merged.form, "tfGone")!!
    // … with the identity it had (its id is free again after the deletion).
    assertEquals("xi-tf-gone", restored.getAsJsonObject("properties").get("id").asString)
    assertEquals("1", restored.getAsJsonObject("properties").get("required").asString)
    assertEquals(listOf("tfName", "tfGone"), childRefsOf(merged.form, "page1"))
  }

  @Test
  fun `a changed element whose container is gone lands on the last page`() {
    val items =
        JsonParser.parseString(
                """
                {"form":{"changed":[
                  {"item":{"className":"XTextField","properties":{"name":"tfOrphan","id":"xi-tf-orphan","label":"Verwaist"}},"parent":"fsDeleted","index":0}
                ]}}
                """
                    .trimIndent())
            .asJsonObject
    val merged = assistant.applyLoggedItems(currentForm, items, null)
    assertNotNull(merged)
    assertNotNull(itemByName(merged!!.form, "tfOrphan"))
    // The recorded index belonged to the deleted container → the element is APPENDED, not inserted
    // at
    // position 0 of the page.
    assertEquals(listOf("tfName", "tfOrphan"), childRefsOf(merged.form, "page1"))
  }

  // ---- RECONSTRUCTION: entries recorded before the `items` column -------------------------------

  /**
   * The recorded change description of a run that CREATED a text field: `widgetsCreated` names it,
   * `attributesSet` carries every property the AI set (label, required, a designed text) and
   * `classesSet` its CodBi class. It carries no id — the description never stores one.
   */
  private val createdDescription =
      """
      {"widgetsCreated":[
         {"name":"tfEmail","className":"de.xima.fc.form.element.TextInput"}
       ],
       "widgetsRemoved":[],
       "classesSet":[
         {"widget":"tfEmail","className":"de.xima.fc.form.element.TextInput",
          "classes":["CodBi_People_Name"]}
       ],
       "attributesSet":[
         {"widget":"tfEmail","className":"de.xima.fc.form.element.TextInput","attributes":[
            {"name":"label","value":"Ihr Name","kind":"attr","codbi":false},
            {"name":"required","value":"true","kind":"attr","codbi":false},
            {"name":"rtevalue","value":"<p>Bitte angeben</p>","kind":"attr","codbi":false}
         ]}
       ]}
      """
          .trimIndent()

  @Test
  fun `reconstructs a created element from the change description`() {
    val items =
        AiAssistantLog.reconstructItems(JsonParser.parseString(createdDescription).asJsonObject)
    assertNotNull(items)
    assertTrue(items!!.get("reconstructed")?.asBoolean == true, items.toString())
    val form = items.getAsJsonObject("form")
    assertEquals(0, form.getAsJsonArray("changed").size(), form.toString())
    val created = form.getAsJsonArray("created")
    assertEquals(1, created.size(), form.toString())
    val loc = created[0].asJsonObject
    assertTrue(loc.get("reconstructed").asBoolean, loc.toString())
    val item = loc.getAsJsonObject("item")
    assertEquals("de.xima.fc.form.element.TextInput", item.get("className").asString)
    val props = item.getAsJsonObject("properties")
    assertEquals("tfEmail", props.get("name").asString)
    assertEquals("Ihr Name", props.get("label").asString)
    assertEquals("<p>Bitte angeben</p>", props.get("rtevalue").asString)
    // "true" stays a boolean, so the required flag survives the round-trip.
    assertTrue(props.get("required").asBoolean, props.toString())
    assertEquals(
        listOf("CodBi_People_Name"), props.getAsJsonArray("cssclasses").map { it.asString })
  }

  @Test
  fun `reconstructs a changed element into the changed bucket`() {
    val changes =
        """
        {"widgetsCreated":[],
         "attributesSet":[
           {"widget":"tfName","className":"de.xima.fc.form.element.TextInput",
            "attributes":[{"name":"label","value":"Vorname","kind":"attr","codbi":false}]}
         ]}
        """
            .trimIndent()
    val items = AiAssistantLog.reconstructItems(JsonParser.parseString(changes).asJsonObject)
    assertNotNull(items)
    val form = items!!.getAsJsonObject("form")
    assertEquals(0, form.getAsJsonArray("created").size(), form.toString())
    val changed = form.getAsJsonArray("changed")
    assertEquals(1, changed.size(), form.toString())
    val props = changed[0].asJsonObject.getAsJsonObject("item").getAsJsonObject("properties")
    assertEquals("tfName", props.get("name").asString)
    assertEquals("Vorname", props.get("label").asString)
  }

  @Test
  fun `rebuilds the data-cb attributes of a functionality from the description`() {
    val changes =
        """
        {"widgetsCreated":[{"name":"tfPlz","className":"de.xima.fc.form.element.TextInput"}],
         "attributesSet":[
           {"widget":"tfPlz","className":"de.xima.fc.form.element.TextInput","attributes":[
             {"name":"HTML_OpenPLZ_AC.functionality","value":"","kind":"func","codbi":true,
              "params":[{"name":"data-cb-openplz-set-plz","value":"1"}]},
             {"name":"label","value":"PLZ","kind":"attr","codbi":false}
           ]}
         ]}
        """
            .trimIndent()
    val items = AiAssistantLog.reconstructItems(JsonParser.parseString(changes).asJsonObject)
    assertNotNull(items)
    val item =
        items!!
            .getAsJsonObject("form")
            .getAsJsonArray("created")[0]
            .asJsonObject
            .getAsJsonObject("item")
    val attrs = item.getAsJsonArray("attributes").map { it.asJsonObject }
    assertEquals("PLZ", item.getAsJsonObject("properties").get("label").asString)
    // The functionality is re-emitted as data-cb-func …
    val func = attrs.first { it.get("text").asString == "data-cb-func" }
    assertEquals("HTML_OpenPLZ_AC.functionality", func.get("value").asString)
    // … and its NESTED parameter survives with its value (not lost in the reconstruction).
    val param = attrs.first { it.get("text").asString == "data-cb-openplz-set-plz" }
    assertEquals("1", param.get("value").asString)
  }

  @Test
  fun `a description without elements reconstructs nothing`() {
    assertNull(AiAssistantLog.reconstructItems(null))
    assertNull(AiAssistantLog.reconstructItems(JsonObject()))
    // Variables-only change: no widget data at all.
    assertNull(
        AiAssistantLog.reconstructItems(
            JsonParser.parseString("""{"variablesSet":[{"name":"v","value":"1"}]}""").asJsonObject))
  }

  @Test
  fun `a reconstructed element is applied to the current form with a minted unique id`() {
    val items =
        AiAssistantLog.reconstructItems(JsonParser.parseString(createdDescription).asJsonObject)!!
    val merged = assistant.applyLoggedItems(currentForm, items, null)
    assertNotNull(merged)
    assertEquals(listOf("page1", "tfName", "tfEmail"), namesOf(merged!!.form))
    assertEquals(listOf("tfEmail"), merged.applied)
    // The description never recorded an id, so one is minted — unique, never a duplicate.
    val inserted = itemByName(merged.form, "tfEmail")!!
    val mintedId = inserted.getAsJsonObject("properties").get("id").asString
    assertTrue(mintedId.startsWith("_cb_ressurected_"), mintedId)

    // Applying the SAME entry again must not duplicate the id either: id and technical name both
    // collide and receive a fresh suffix.
    val again = assistant.applyLoggedItems(merged.form.toString(), items, null)
    assertNotNull(again)
    val ids = idsOf(again!!.form)
    assertEquals(ids.size, ids.toSet().size, "duplicate id in $ids")
    assertEquals(listOf("tfEmail"), again.resurrected)
  }
}
