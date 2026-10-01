package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the translation DELTA protocol (plan §6B):
 * [`AICodBiAssistant.buildTranslationDeltaView`] and [`AICodBiAssistant.spliceTranslationDelta`].
 *
 * The delta protocol replaces the legacy `runSequentialWholeFormTranslation` full-form echo with
 * ONE slim base-language-only view + ONE small per-language completion that returns ONLY the
 * translated strings (keyed by element/option/button identity). Those strings are spliced into the
 * ORIGINAL persist as `i18n[<lang>]` objects — never re-emitted as a full form.
 *
 * Invariants under test:
 * - The base view contains translatable user-readable strings only; it carries NO structural fields
 *   (`className`, `id`, `elements`, `parentid`), NO ids, and NO base-language text.
 * - The splice writes translations into `properties.i18n[lang]` (plain elements),
 *   `options[i].i18n[lang]` (options, by `text`/`value`), and `buttons[i].i18n[lang]` (buttons, by
 *   `name`/`text`/`value`).
 * - Structural fields of the original persist are NEVER touched.
 * - Keys that match no element are silently ignored (fail-open).
 */
class TranslationDeltaProtocolTest {

  private val assistant = AICodBiAssistant()

  private fun buildView(persistJson: String, baseLang: String): String? =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("buildTranslationDeltaView", String::class.java, String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, persistJson, baseLang) as String?

  private fun splice(root: JsonObject, delta: String, lang: String) {
    AICodBiAssistant::class
        .java
        .getDeclaredMethod(
            "spliceTranslationDelta",
            JsonObject::class.java,
            JsonObject::class.java,
            String::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, root, JsonParser.parseString(delta).asJsonObject, lang)
  }

  @Suppress("UNCHECKED_CAST")
  private fun batches(langs: List<String>, estimate: Int): List<List<String>> =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod(
              "groupTranslationBatches", List::class.java, Int::class.javaPrimitiveType)
          .apply { isAccessible = true }
          .invoke(assistant, langs, estimate) as List<List<String>>

  private fun estimateOut(view: String): Int =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("estimateTranslationOutputTokens", String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, view) as Int

  @Suppress("UNCHECKED_CAST")
  private fun parseBatch(raw: String): Map<String, JsonObject>? =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("parseBatchDelta", String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, raw) as Map<String, JsonObject>?

  private val formJson =
      """
      {
        "title": "Anmeldung",
        "items": [
          {
            "className": "XPage",
            "properties": {"name": "p1", "id": "xi-p1", "elements": ["tfVorname"]}
          },
          {
            "className": "XTextField",
            "properties": {
              "name": "tfVorname",
              "id": "xi-vorname",
              "parentid": "xi-p1",
              "label": "Vorname",
              "placeholder": "Bitte eintragen",
              "className": "mt-2"
            }
          },
          {
            "className": "XSelect",
            "properties": {
              "name": "selAnrede",
              "id": "xi-anrede",
              "parentid": "xi-p1",
              "label": "Anrede",
              "options": [
                {"text": "Herr", "value": "1"},
                {"text": "Frau", "value": "2"}
              ]
            }
          },
          {
            "className": "XButtonList",
            "properties": {
              "name": "buttons",
              "id": "xi-buttons",
              "buttons": [
                {"name": "btnSubmit", "title": "", "value": "Absenden"},
                {"name": "btnReset", "title": "", "value": "Zurücksetzen"}
              ]
            }
          }
        ]
      }
      """
          .trimIndent()

  private fun root(): JsonObject = JsonParser.parseString(formJson).asJsonObject

  // ---- buildTranslationDeltaView ---------------------------------------------------------------

  @Test
  fun `base view contains translatable strings but no structure or ids`() {
    val view = buildView(formJson, "de") ?: error("view should not be null")
    val parsed = JsonParser.parseString(view).asJsonObject

    assertEquals("de", parsed.get("lang").asString)
    assertEquals("Anmeldung", parsed.getAsJsonObject("form").get("title").asString)

    val elements = parsed.getAsJsonObject("elements")
    // Plain element carries only its translatable base properties.
    val tf = elements.getAsJsonObject("tfVorname")
    assertEquals("Vorname", tf.get("label").asString)
    assertEquals("Bitte eintragen", tf.get("placeholder").asString)
    assertTrue(!tf.has("id"), "the base view must never carry an id")
    assertTrue(!tf.has("className"), "the base view must never carry a className")

    // Options are keyed "<name>/<optText>".
    assertEquals("Herr", elements.getAsJsonObject("selAnrede/Herr").get("value").asString)
    assertEquals("Frau", elements.getAsJsonObject("selAnrede/Frau").get("value").asString)
    // Option element itself carries nothing (it has no user-visible base props besides option
    // text).
    val sel = elements.getAsJsonObject("selAnrede")
    assertEquals("Anrede", sel.get("label").asString)

    // Buttons are keyed "<list>/<btnName>", carrying their display label under `value` (the field
    // Formcycle buttons use as their label, per buildWorkflowButton).
    assertEquals("Absenden", elements.getAsJsonObject("buttons/btnSubmit").get("value").asString)
    assertEquals("Zurücksetzen", elements.getAsJsonObject("buttons/btnReset").get("value").asString)

    // No structural container leaked into the view.
    assertTrue(!parsed.toString().contains("xi-p1"), "the view must not contain element ids")
    assertTrue(
        !parsed.toString().contains("XPage"), "the view must not contain structural class names")
    assertTrue(!parsed.toString().contains("parentid"), "the view must not contain parentid")
  }

  @Test
  fun `base view is null when there is nothing translatable`() {
    val empty =
        """{"title":"","items":[{"className":"XPage","properties":{"name":"p1","elements":["tf"]}},{"className":"XTextField","properties":{"name":"tf"}}]}"""
    assertNull(buildView(empty, "de"))
  }

  // ---- spliceTranslationDelta ------------------------------------------------------------------

  @Test
  fun `splice writes i18n for plain elements without touching structure`() {
    val root = root()
    val delta =
        """
        {
          "lang": "en",
          "form": {"title": "Registration"},
          "elements": {
            "tfVorname": {"label": "First name", "placeholder": "Please enter"},
            "selAnrede/Herr": {"value": "Mr"},
            "buttons/btnSubmit": {"value": "Send"}
          }
        }
        """
            .trimIndent()
    splice(root, delta, "en")

    val tf = itemByName(root, "tfVorname")
    val tfI18nEn = tf.getAsJsonObject("properties").getAsJsonObject("i18n").getAsJsonObject("en")
    assertEquals("First name", tfI18nEn.get("label").asString)
    assertEquals("Please enter", tfI18nEn.get("placeholder").asString)
    // Base-language label and structural fields untouched.
    assertEquals("Vorname", tf.getAsJsonObject("properties").get("label").asString)
    assertEquals("xi-vorname", tf.getAsJsonObject("properties").get("id").asString)

    val option = optionByName(root, "selAnrede", "text", "Herr")
    assertEquals("Mr", option.getAsJsonObject("i18n").getAsJsonObject("en").get("value").asString)
    // The untouched other option got no i18n.
    val frau = optionByName(root, "selAnrede", "text", "Frau")
    assertTrue(!frau.has("i18n"), "untouched options must not gain an i18n object")

    val submitBtn = buttonByName(root, "buttons", "name", "btnSubmit")
    assertEquals(
        "Send", submitBtn.getAsJsonObject("i18n").getAsJsonObject("en").get("value").asString)
    // Structural button fields untouched (base `value` stays the German label).
    assertEquals(
        "Absenden", buttonByName(root, "buttons", "name", "btnSubmit").get("value").asString)
  }

  @Test
  fun `splice writes title into form-level i18n`() {
    val root = root()
    splice(root, """{"lang":"en","form":{"title":"Registration"}}""", "en")
    val formI18nEn = root.getAsJsonObject("i18n").getAsJsonObject("en")
    assertEquals("Registration", formI18nEn.get("title").asString)
    assertEquals("Anmeldung", root.get("title").asString)
  }

  @Test
  fun `splice ignores unknown keys and does not mutate when nothing matches`() {
    val root = root()
    val before = root.deepCopy()
    splice(root, """{"lang":"en","elements":{"doesNotExist":{"label":"X"}}}""", "en")
    assertEquals(before, root, "an unknown key must leave the form untouched")
  }

  @Test
  fun `splice accumulates multiple languages on the same element`() {
    val root = root()
    splice(root, """{"lang":"en","elements":{"tfVorname":{"label":"First name"}}}""", "en")
    splice(root, """{"lang":"fr","elements":{"tfVorname":{"label":"Prénom"}}}""", "fr")
    val props = itemByName(root, "tfVorname").getAsJsonObject("properties")
    assertEquals(
        "First name", props.getAsJsonObject("i18n").getAsJsonObject("en").get("label").asString)
    assertEquals(
        "Prénom", props.getAsJsonObject("i18n").getAsJsonObject("fr").get("label").asString)
  }

  // ---- Lever 4 batching (plan §6B) -------------------------------------------------------------

  @Test
  fun `grouping batches several languages when the estimate fits the budget`() {
    val groups = batches(listOf("en", "fr", "it"), 100)
    assertEquals(1, groups.size)
    assertEquals(listOf("en", "fr", "it"), groups[0])
  }

  @Test
  fun `grouping splits a language that would overflow the budget into its own batch`() {
    // 1_000 estimated tokens per language > 800 budget → every language is its own solo batch.
    val groups = batches(listOf("en", "fr"), 1000)
    assertEquals(2, groups.size)
    assertEquals(listOf("en"), groups[0])
    assertEquals(listOf("fr"), groups[1])
  }

  @Test
  fun `grouping batches small languages together and splits the overflow`() {
    // 300+300+300 = 900 > 800 → [en,fr] then [it] (a mixed batch + a solo batch).
    val groups = batches(listOf("en", "fr", "it"), 300)
    assertEquals(2, groups.size)
    assertEquals(listOf("en", "fr"), groups[0])
    assertEquals(listOf("it"), groups[1])
  }

  @Test
  fun `grouping returns empty for no languages`() {
    assertTrue(batches(emptyList(), 100).isEmpty())
  }

  @Test
  fun `estimate of output tokens grows with base-view content`() {
    val view = buildView(formJson, "de") ?: error("view should not be null")
    val estimate = estimateOut(view)
    assertTrue(estimate >= 1, "estimate should be positive, was $estimate")
    // The small fixture base view is well under the 800-token batch budget, so a real
    // multi-language request on it would be translated in ONE batched completion.
    assertTrue(estimate < 800, "estimate should stay under the batch budget, was $estimate")
  }

  @Test
  fun `batch parser returns null for a non-object or a missing translations key`() {
    assertNull(parseBatch("[]"))
    assertNull(parseBatch("{}"))
    assertNull(parseBatch("""{"foo":1}"""))
  }

  @Test
  fun `batch parser skips unparseable inner deltas so they can be reissued`() {
    val batch = parseBatch("""{"translations":{"en":{"form":{}},"fr":"oops"}}""")
    assertEquals(setOf("en"), batch?.keys)
  }

  @Test
  fun `a parsed multi-language batch splices every language without loss`() {
    val root = root()
    val multi =
        """
        {
          "translations": {
            "en": {"form":{"title":"Registration"},"elements":{"tfVorname":{"label":"First name"},"selAnrede/Herr":{"value":"Mr"}}},
            "fr": {"form":{"title":"Inscription"},"elements":{"tfVorname":{"label":"Prénom"},"selAnrede/Herr":{"value":"M."}}}
          }
        }
        """
            .trimIndent()
    val batch = parseBatch(multi) ?: error("batch should parse")
    assertEquals(setOf("en", "fr"), batch.keys)
    for ((lang, delta) in batch) {
      AICodBiAssistant::class
          .java
          .getDeclaredMethod(
              "spliceTranslationDelta",
              JsonObject::class.java,
              JsonObject::class.java,
              String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, root, delta, lang)
    }
    val props = itemByName(root, "tfVorname").getAsJsonObject("properties")
    assertEquals(
        "First name", props.getAsJsonObject("i18n").getAsJsonObject("en").get("label").asString)
    assertEquals(
        "Prénom", props.getAsJsonObject("i18n").getAsJsonObject("fr").get("label").asString)
    // Base-language + structural fields untouched.
    assertEquals("Vorname", props.get("label").asString)
    assertEquals("xi-vorname", props.get("id").asString)
    // Form-level title lands in i18n; the base title stays.
    assertEquals(
        "Registration", root.getAsJsonObject("i18n").getAsJsonObject("en").get("title").asString)
    assertEquals("Anmeldung", root.get("title").asString)
  }

  // ---- Lever 4 context enrichment (type, parent, form metadata) --------------------------------

  private val contextFormJson =
      """
      {
        "title": "Anmeldung",
        "description": "Formular für die Veranstaltung",
        "submit_button_label": "Anmelden",
        "items": [
          {
            "className": "XPage",
            "properties": {
              "name": "p1",
              "label": "Kontaktdaten",
              "elements": [
                {
                  "className": "XFieldSet",
                  "properties": {
                    "name": "fsKunden",
                    "legend": "Kunde",
                    "elements": [
                      {
                        "className": "XTextField",
                        "properties": {"name": "tfName", "label": "Name"}
                      },
                      {
                        "className": "XSpan",
                        "properties": {"name": "spHinweis", "rtevalue": "Bitte ausfüllen"}
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
      """
          .trimIndent()

  private fun contextRoot(): JsonObject = JsonParser.parseString(contextFormJson).asJsonObject

  @Test
  fun `base view enriches elements with widget type and parent heading path`() {
    val view = buildView(contextFormJson, "de") ?: error("view should not be null")
    val parsed = JsonParser.parseString(view).asJsonObject
    val elements = parsed.getAsJsonObject("elements")

    val tf = elements.getAsJsonObject("tfName")
    assertEquals("Name", tf.get("label").asString)
    // Item 3: human-readable widget type.
    assertEquals("TextInput", tf.get("type").asString)
    // Item 1: parent heading path = page › fieldset (both labeled).
    assertEquals("Kontaktdaten › Kunde", tf.get("parent").asString)

    // XSpan maps to StaticText; still under the same fieldset path.
    val span = elements.getAsJsonObject("spHinweis")
    assertEquals("StaticText", span.get("type").asString)
    assertEquals("Kontaktdaten › Kunde", span.get("parent").asString)
  }

  @Test
  fun `base view keeps form-level translatable metadata besides title`() {
    val view = buildView(contextFormJson, "de") ?: error("view should not be null")
    val form = JsonParser.parseString(view).asJsonObject.getAsJsonObject("form")
    assertEquals("Anmeldung", form.get("title").asString)
    // Item 4: description and submit label ride alongside title.
    assertEquals("Formular für die Veranstaltung", form.get("description").asString)
    assertEquals("Anmelden", form.get("submit_button_label").asString)
  }

  @Test
  fun `context keys are not counted toward the output-token estimate`() {
    // A long parent path + type must NOT inflate the estimated translated output.
    val view = buildView(contextFormJson, "de") ?: error("view should not be null")
    val estimate = estimateOut(view)
    // Only the translatable strings (title/description/submit/labels/rtevalue) count; parent/type
    // are context. A generous upper bound proves the long parent path was not added.
    assertTrue(estimate < 60, "estimate too large: $estimate")
  }

  @Test
  fun `context keys are never written into i18n even if the model echoes them back`() {
    val root = contextRoot()
    val delta =
        """
        {
          "lang": "en",
          "form": {"title": "Registration"},
          "elements": {
            "tfName": {"type": "TextInput", "parent": "Kontaktdaten › Kunde", "label": "Name"}
          }
        }
        """
            .trimIndent()
    splice(root, delta, "en")
    val props = nestedItemByName(root, "tfName").getAsJsonObject("properties")
    val en = props.getAsJsonObject("i18n").getAsJsonObject("en")
    // Only the real translation is written; context keys are guarded out.
    assertEquals("Name", en.get("label").asString)
    assertTrue(!en.has("type"), "context `type` must never reach i18n")
    assertTrue(!en.has("parent"), "context `parent` must never reach i18n")
  }

  @Test
  fun `button entries carry the parent path as context`() {
    // The existing formJson has a button list under an unlabeled page; rebuild with a labeled page.
    // The parent path is only propagated when the walk descends into a container's `elements`
    // array of INLINE nested objects (the real Formcycle shape) — NOT string references.
    // So the button list is embedded inside the labeled page as a nested object.
    val withLabel =
        """
        {
          "title": "Anmeldung",
          "items": [
            {
              "className": "XPage",
              "properties": {
                "name": "p1",
                "label": "Ende",
                "elements": [
                  {
                    "className": "XButtonList",
                    "properties": {
                      "name": "buttons",
                      "buttons": [{"name": "btnSubmit", "title": "", "value": "Absenden"}]
                    }
                  }
                ]
              }
            }
          ]
        }
        """
            .trimIndent()
    val view = buildView(withLabel, "de") ?: error("view should not be null")
    val btn =
        JsonParser.parseString(view)
            .asJsonObject
            .getAsJsonObject("elements")
            .getAsJsonObject("buttons/btnSubmit")
    assertEquals("Absenden", btn.get("value").asString)
    assertEquals("Ende", btn.get("parent").asString)
    // Buttons get no `type` (they are already keyed by their own name/action).
    assertTrue(!btn.has("type"), "buttons carry no type context")
  }

  // ---- Rich HTML (rtevalue) --------------------------------------------------------------------
  // Regression for a real bug: a rich XSpan `rtevalue` (heading + paragraphs + inline `<style>`
  // + `.cbBenefitCard` cards) was flattened (ALL tags stripped + whitespace collapsed) into one
  // unbroken run, and the translated value came back with every fragment jammed together and no
  // markup. Fix: when a base value LITERALLY contains HTML tags, it is shown to the model verbatim
  // (not stripped) so the returned translation is COMPLETE translated HTML; plain strings keep the
  // slim stripped/flattened form.

  private val richHtmlFormJson =
      """
      {
        "title": "Mittag",
        "items": [
          {
            "className": "XSpan",
            "properties": {
              "name": "spBenefit",
              "rtevalue": "<style type=\"text/css\">@keyframes cbFadeIn{from{opacity:0}to{opacity:1}}</style><h2 style=\"text-align:center\">Formular zur Mitteilung</h2><p>Bitte nutzen Sie das Online-Formular.</p><div class=\"cbBenefitCard\"><strong>Vorteil 1:</strong> Sofortige Zustellung</div>"
            }
          }
        ]
      }
      """
          .trimIndent()

  @Test
  fun `rich HTML rtevalue is emitted verbatim in the base view, not stripped`() {
    val view = buildView(richHtmlFormJson, "de") ?: error("view should not be null")
    val span =
        JsonParser.parseString(view)
            .asJsonObject
            .getAsJsonObject("elements")
            .getAsJsonObject("spBenefit")
    val rte = span.get("rtevalue").asString
    // The full markup is retained byte-for-byte, so the model can return complete translated HTML.
    assertTrue(rte.contains("<style type=\"text/css\">"), "rich HTML must keep its <style> block")
    assertTrue(rte.contains("</style>"), "rich HTML must keep the closing style tag")
    assertTrue(rte.contains("<h2"), "rich HTML must keep its heading tag")
    assertTrue(rte.contains("</h2>"), "rich HTML must keep the closing heading tag")
    assertTrue(rte.contains("<p>"), "rich HTML must keep its paragraph tag")
    assertTrue(
        rte.contains("<div class=\"cbBenefitCard\">"),
        "rich HTML must keep the benefit card div + class")
    assertTrue(rte.contains("<strong>"), "rich HTML must keep the <strong> tag")
    // The visible text is still present (not erased) between the tags.
    assertTrue(rte.contains("Bitte nutzen Sie das Online-Formular."), "visible text must remain")
  }

  @Test
  fun `a plain string value is still stripped and flattened`() {
    val view = buildView(contextFormJson, "de") ?: error("view should not be null")
    val span =
        JsonParser.parseString(view)
            .asJsonObject
            .getAsJsonObject("elements")
            .getAsJsonObject("spHinweis")
    // "Bitte ausfüllen" is plain (no tags) → keeps the slim stripped form.
    assertEquals("Bitte ausfüllen", span.get("rtevalue").asString)
  }

  @Test
  fun `splicing a complete translated HTML rtevalue writes it back intact`() {
    val root = JsonParser.parseString(richHtmlFormJson).asJsonObject
    val fullHtml =
        "<style type=\"text/css\">@keyframes cbFadeIn{from{opacity:0}to{opacity:1}}</style>" +
            "<h2 style=\"text-align:center\">Форма для повідомлення</h2>" +
            "<p>Будь ласка, скористайтесь онлайн-формою.</p>" +
            "<div class=\"cbBenefitCard\"><strong>Перевага 1:</strong> Миттєва доставка</div>"
    // Build the delta via Gson so the embedded double quotes / braces in the HTML are escaped for
    // JSON.
    val spanObj = JsonObject().apply { addProperty("rtevalue", fullHtml) }
    val elsObj = JsonObject().apply { add("spBenefit", spanObj) }
    val deltaObj =
        JsonObject().apply {
          addProperty("lang", "uk")
          add("elements", elsObj)
        }
    splice(root, deltaObj.toString(), "uk")
    val span = nestedItemByName(root, "spBenefit").getAsJsonObject("properties")
    val uk = span.getAsJsonObject("i18n").getAsJsonObject("uk")
    // The complete translated HTML lands verbatim in i18n, markup and separators preserved.
    assertEquals(fullHtml, uk.get("rtevalue").asString)
    assertTrue(uk.get("rtevalue").asString.contains("<div class=\"cbBenefitCard\"><strong>"))
  }

  // ---- fixtures --------------------------------------------------------------------------------

  private fun itemByName(root: JsonObject, name: String): JsonObject {
    return root
        .getAsJsonArray("items")
        .first { el ->
          el.isJsonObject &&
              el.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString == name
        }
        .asJsonObject
  }

  // Finds an element by name, descending into nested container `elements` arrays (the real
  // Formcycle
  // shape), unlike itemByName which only scans the flat top-level list.
  private fun nestedItemByName(root: JsonObject, name: String): JsonObject {
    fun walk(items: JsonArray): JsonObject? {
      for (el in items) {
        if (!el.isJsonObject) continue
        val obj = el.asJsonObject
        val props = obj.getAsJsonObject("properties")
        if (props?.get("name")?.asString == name) return obj
        val els = props?.getAsJsonArray("elements")
        if (els != null) {
          walk(els)?.let {
            return it
          }
        }
      }
      return null
    }
    return walk(root.getAsJsonArray("items")) ?: error("no nested element named $name")
  }

  private fun optionByName(
      root: JsonObject,
      elementName: String,
      key: String,
      value: String
  ): JsonObject {
    val props = itemByName(root, elementName).getAsJsonObject("properties")
    return props
        .getAsJsonArray("options")
        .first { el -> el.isJsonObject && el.asJsonObject.get(key)?.asString == value }
        .asJsonObject
  }

  private fun buttonByName(
      root: JsonObject,
      listName: String,
      key: String,
      value: String
  ): JsonObject {
    val props = itemByName(root, listName).getAsJsonObject("properties")
    return props
        .getAsJsonArray("buttons")
        .first { el -> el.isJsonObject && el.asJsonObject.get(key)?.asString == value }
        .asJsonObject
  }
}
