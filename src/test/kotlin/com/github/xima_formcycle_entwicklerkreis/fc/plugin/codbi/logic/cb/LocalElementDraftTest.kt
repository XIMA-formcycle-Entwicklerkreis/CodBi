package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests the deterministic half of the `codbi-local-element` intent: the validation of an AI-drafted
 * local CodBi element and the documentation entry derived from it.
 *
 * The rules under test are the ones that keep a generated definition from being a silent no-op at
 * runtime — a dotted unique name, exactly ONE registration call for that name, the mandatory
 * prompts (without them the element never reaches a later AI form run) and no forbidden constructs
 * in the JavaScript. The commit itself is a plain storage write and is covered by the store, not
 * here.
 */
class LocalElementDraftTest {

  private fun draft(json: String) = JsonParser.parseString(json.trimIndent()).asJsonObject

  private val functionalityDraft =
      """
      {"status":"codbi_element_draft","kind":"functionality","Name":"Mein.Rechner",
       "Description":"<p>Baut einen Taschenrechner ein.</p>",
       "Summary":{"en":"Embeds a calculator into a fieldset or container.","de":"Baut einen Taschenrechner in ein Fieldset oder einen Container ein.","it":"Incorpora una calcolatrice in un fieldset o contenitore."},
       "CondensedPrompt":"Baut einen JS-Taschenrechner in ein Fieldset/Container ein.",
       "DetailedPrompt":"Layout=normal|wissenschaftlich; wirkt auf XFieldSet/XContainer.",
       "Parameter":{"1":"layout — normal oder wissenschaftlich"},
       "supportedFormelementtypes":["XFieldSet","XContainer"],
       "Code":"window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { toProcess.setAttribute('data-ready', '1'); });",
       "Usage":{"data-cb-func":"Mein.Rechner","data-cb-layout":"wissenschaftlich"}}
      """

  private val epDraft =
      """
      {"kind":"elementPlaceholder","Name":"Mein.EP",
       "Description":"Wetterbericht.",
       "Summary":{"en":"Returns the weather forecast from a date for N days.","de":"Liefert den Wetterbericht ab einem Datum für N Tage.","it":"Restituisce le previsioni dal giorno indicato per N giorni."},
       "CondensedPrompt":"Wetterbericht ab Datum für N Tage.",
       "DetailedPrompt":"1. ab-Datum, 2. Anzahl Tage; async fetch auf api.open-meteo.com.",
       "Parameter":{"1":"ab — ISO-Datum","2":"tage — Anzahl Tage"},
       "Signature":{"params":[{"index":1,"name":"ab","type":"date","optional":true}],"returnType":"object","source":"manager"},
       "Code":"window.codbi.registerEP('Mein.EP', async (params) => { const r = await fetch('https://api.open-meteo.com/v1/forecast'); return r.json(); });"}
      """

  private val standardDraft =
      """
      {"kind":"standard","Name":"JOJO.Rechner",
       "Description":"Preset für den Rechner.",
       "Summary":{"en":"Presets the scientific display.","de":"Setzt die wissenschaftliche Anzeige als Vorgabe.","it":"Imposta la visualizzazione scientifica come predefinita."},
       "CondensedPrompt":"Vorgabe für Mein.Rechner.",
       "DetailedPrompt":"Global JOJO_RECHNER_LAYOUT=scientific.",
       "classes":{},
       "globals":{"JOJO_RECHNER_LAYOUT":"scientific"}}
      """

  @Test
  fun `a complete functionality draft is committable`() {
    val draft = draft(functionalityDraft)
    val kind = LocalElementDrafts.kindOf(draft)
    assertEquals(LocalElementKind.FUNCTIONALITY, kind)
    assertEquals("Mein.Rechner", LocalElementDrafts.nameOf(draft))
    assertEquals(emptyList<String>(), LocalElementDrafts.validate(draft, kind!!, emptyMap(), false))
  }

  @Test
  fun `a name without a dot is refused`() {
    val draft = draft(functionalityDraft.replace("Mein.Rechner", "Rechner"))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("dotted technical id") }, problems.toString())
  }

  @Test
  fun `an existing name is refused unless the overwrite is confirmed`() {
    val draft = draft(functionalityDraft)
    val existing = mapOf("mein.rechner" to LocalElementKind.FUNCTIONALITY)
    val refused =
        LocalElementDrafts.validate(
            draft, LocalElementKind.FUNCTIONALITY, existing, allowOverwrite = false)
    assertTrue(refused.any { it.contains("already exists") }, refused.toString())
    assertEquals(
        emptyList<String>(),
        LocalElementDrafts.validate(
            draft, LocalElementKind.FUNCTIONALITY, existing, allowOverwrite = true))
  }

  @Test
  fun `code registering a different id is refused`() {
    val draft =
        draft(
            functionalityDraft.replace(
                "registerFunctionality('Mein.Rechner'", "registerFunctionality('Anderer.Rechner'"))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("registerFunctionality") }, problems.toString())
  }

  @Test
  fun `a variant registration id is normalised so the draft becomes committable`() {
    val draft = draft(functionalityDraft)
    val variant =
        "window.codbi.registerFunctionality('meinrechner', (toLoad, toProcess) => { toProcess.classList.add('ready'); });"
    draft.addProperty("Code", variant)
    // A variant id is a real problem …
    assertTrue(
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
            .isNotEmpty())
    // … which the structural fix resolves by rewriting ONLY the id.
    val normalized = LocalElementDrafts.normalizeRegistration(variant, "Mein.Rechner")
    assertTrue(normalized.contains("registerFunctionality('Mein.Rechner'"), normalized)
    assertTrue(normalized.contains("classList.add('ready')"), normalized)
    draft.addProperty("Code", normalized)
    assertEquals(
        emptyList<String>(),
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false))
  }

  @Test
  fun `a functionality body without any registration call is wrapped in one`() {
    val body = "toProcess.innerHTML = '<div>7 8 9</div>';"
    val wrapped =
        LocalElementDrafts.ensureRegistrationCall(
            LocalElementKind.FUNCTIONALITY, "Mein.Rechner", body)
    assertTrue(wrapped.contains("registerFunctionality(\"Mein.Rechner\""), wrapped)
    assertTrue(wrapped.contains(body), wrapped)
    // The wrapped code is committable.
    val draft = draft(functionalityDraft)
    draft.addProperty("Code", wrapped)
    assertEquals(
        emptyList<String>(),
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false))
    // Code that already registers is untouched.
    val already = "window.codbi.registerFunctionality('Mein.Rechner', () => {});"
    assertEquals(
        already,
        LocalElementDrafts.ensureRegistrationCall(
            LocalElementKind.FUNCTIONALITY, "Mein.Rechner", already))
    // An EP body must RETURN a value — a wrapper cannot invent it, so it is never wrapped.
    assertEquals(
        body,
        LocalElementDrafts.ensureRegistrationCall(
            LocalElementKind.ELEMENT_PLACEHOLDER, "Mein.EP", body))
  }

  @Test
  fun `prepareCode normalises and wraps in one step`() {
    val bare = "toProcess.innerHTML = '<b>x</b>';"
    val prepared =
        LocalElementDrafts.prepareCode(LocalElementKind.FUNCTIONALITY, "Mein.Rechner", bare)
    assertTrue(prepared.contains("registerFunctionality(\"Mein.Rechner\""), prepared)
    assertEquals(
        1,
        LocalElementDrafts.registrationCount(
            prepared, LocalElementKind.FUNCTIONALITY, "Mein.Rechner"))
    val wrongId = "window.codbi.registerFunctionality('x', () => {});"
    val fixed =
        LocalElementDrafts.prepareCode(LocalElementKind.FUNCTIONALITY, "Mein.Rechner", wrongId)
    assertEquals(
        1,
        LocalElementDrafts.registrationCount(fixed, LocalElementKind.FUNCTIONALITY, "Mein.Rechner"))
  }

  @Test
  fun `the id is normalised for every spelling of the registration receiver`() {
    val spellings =
        listOf(
            "window.codbi.registerFunctionality('X', () => {});",
            "codbi.registerFunctionality('X', () => {});",
            "const cb = window.codbi; cb.registerFunctionality('X', () => {});",
            "window.codbi.extendFunctionality('X', () => {});",
            "window.codbi.registerEP('X', () => {});")
    for (code in spellings) {
      val normalized = LocalElementDrafts.normalizeRegistration(code, "Mein.Rechner")
      assertTrue(normalized.contains("('Mein.Rechner'"), normalized)
      assertFalse(normalized.contains("'X'"), normalized)
    }
  }

  @Test
  fun `normalising keeps a correct id and never collapses two calls`() {
    val ok = "window.codbi.registerFunctionality(\"Mein.Rechner\", () => {});"
    assertEquals(ok, LocalElementDrafts.normalizeRegistration(ok, "Mein.Rechner"))
    val two =
        "window.codbi.registerFunctionality('A', () => {});\n" +
            "window.codbi.registerFunctionality('B', () => {});"
    val normalized = LocalElementDrafts.normalizeRegistration(two, "Mein.Rechner")
    // Two calls stay two calls (both now carry the declared id) → validate still refuses them.
    assertEquals(2, Regex("registerFunctionality\\('Mein\\.Rechner'").findAll(normalized).count())
  }

  /**
   * The mechanical counterpart of the "undefined element" rule — a live repair round simply
   * repeated the broken code, so `prepareCode` rewrites an undeclared `element` USED AS A VALUE to
   * `toProcess`. The draft then becomes committable and the element actually works at runtime.
   */
  /**
   * The reported follow-up: a draft whose `Code` only DEFINES a helper (`function insertCalculator(
   * element, params) { … }`) registers and then does nothing. Declaring `toLoad`/`toProcess` in the
   * callback's parameter list is not a USE, so such a code is refused; calling the helper with them
   * is what makes the functionality work.
   */
  @Test
  fun `a functionality that only defines a helper is refused`() {
    val dead =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "function insertCalculator(element, params) { element.appendChild(document.createElement('div')); } });"
    val deadDraft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$dead\""))
    val problems =
        LocalElementDrafts.validate(deadDraft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("toProcess") }, problems.toString())
    assertFalse(LocalElementDrafts.usesRegistrationScope(dead), dead)

    // Calling the helper with the attached element is what makes it work.
    val alive =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "function insertCalculator(element, params) { element.appendChild(document.createElement('div')); } " +
            "insertCalculator(toProcess, toLoad); });"
    val aliveDraft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$alive\""))
    assertTrue(LocalElementDrafts.usesRegistrationScope(alive), alive)
    assertTrue(
        LocalElementDrafts.validate(aliveDraft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
            .isEmpty(),
        "a functionality that CALLS its helper must be committable")
  }

  @Test
  fun `prepareCode rewrites an undefined element reference to toProcess`() {
    val broken =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const layout = element.dataset.cbLayout; " +
            "element.appendChild(document.createElement('div')); });"
    val prepared =
        LocalElementDrafts.prepareCode(LocalElementKind.FUNCTIONALITY, "Mein.Rechner", broken)
    assertFalse(LocalElementDrafts.usesUndeclaredElement(prepared), prepared)
    assertTrue(prepared.contains("toProcess.dataset.cbLayout"), prepared)
    assertTrue(prepared.contains("toProcess.appendChild("), prepared)
    val rewritten =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$prepared\""))
    assertTrue(
        LocalElementDrafts.validate(rewritten, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
            .isEmpty(),
        "the rewritten code must be committable")

    // A DECLARED element variable is something else entirely — never touched.
    val declared =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const element = document.createElement('div'); element.className = 'x'; " +
            "toProcess.appendChild(element); });"
    assertEquals(
        declared,
        LocalElementDrafts.repairElementReference(LocalElementKind.FUNCTIONALITY, declared))

    // An element placeholder never receives an element, so nothing is rewritten there either.
    assertEquals(
        broken,
        LocalElementDrafts.repairElementReference(LocalElementKind.ELEMENT_PLACEHOLDER, broken))
  }

  @Test
  fun `two registration calls are refused`() {
    val code =
        "window.codbi.registerFunctionality('Mein.Rechner', (a, b) => {});\n" +
            "window.codbi.registerFunctionality('Mein.Rechner', (a, b) => {});"
    val draft =
        draft(
            functionalityDraft.replace(
                Regex("\"Code\":\"[^\"]*\""),
                "\"Code\":\"${code.replace("\n", "\\n").replace("'", "'")}\""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("more than one registration") }, problems.toString())
  }

  @Test
  fun `forbidden constructs are refused`() {
    val code = "window.codbi.registerFunctionality('Mein.Rechner', () => { eval('1+1'); });"
    val draft =
        draft(
            functionalityDraft.replace(
                Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"${code.replace("'", "'")}\""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("eval(") }, problems.toString())
  }

  /**
   * `Function('return ' + expr)()` is eval without the keyword — the exact construct a generated
   * calculator reaches for. It must be refused, while a legitimate `initFunction(` call stays legal
   * (the check is a word-boundary match, not a substring search).
   */
  @Test
  fun `dynamic Function evaluation is refused but a normal function name is not`() {
    val dynamic =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "out.value = Function('return ' + expr)(); });"
    val dynamicDraft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$dynamic\""))
    val problems =
        LocalElementDrafts.validate(dynamicDraft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("Function(") }, problems.toString())
    assertFalse(problems.any { it.contains("registerFunctionality") }, problems.toString())

    val legit =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "initFunction(toProcess); });"
    val legitDraft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$legit\""))
    assertTrue(
        LocalElementDrafts.validate(legitDraft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
            .isEmpty(),
        "a legitimate initFunction(…) call must never be flagged")
  }

  /**
   * The reported runtime error `CodBiError … functionality "mein.rechner" … ReferenceError: element
   * is not defined`: the registration callback provides `toLoad`/`toProcess` only, so an UNDECLARED
   * `element` must already be refused at draft time (the repair round then rewrites it), while a
   * locally declared `element` must stay legal.
   */
  @Test
  fun `code using an undefined element variable is refused`() {
    val broken =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const panel = document.createElement('div'); element.appendChild(panel); });"
    val brokenDraft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$broken\""))
    val problems =
        LocalElementDrafts.validate(brokenDraft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("toProcess") }, problems.toString())
    assertTrue(LocalElementDrafts.usesUndeclaredElement(broken), broken)

    val ok =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const element = document.createElement('div'); element.className = 'cb'; " +
            "toProcess.appendChild(element); });"
    val okDraft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$ok\""))
    assertTrue(
        LocalElementDrafts.validate(okDraft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
            .isEmpty(),
        "a DECLARED element variable must never be flagged")
    assertFalse(LocalElementDrafts.usesUndeclaredElement(ok), ok)

    // A property access (`foo.element`) and a declared arrow parameter are not global lookups
    // either.
    assertFalse(
        LocalElementDrafts.usesUndeclaredElement(
            "window.codbi.registerFunctionality('A.B', (toLoad, toProcess) => { " +
                "const cfg = toProcess.element; });"))
    assertFalse(
        LocalElementDrafts.usesUndeclaredElement(
            "window.codbi.registerFunctionality('A.B', (toLoad, toProcess) => { " +
                "[1].forEach((element) => element); });"))
  }

  @Test
  fun `missing prompts are refused because later form runs could not use the element`() {
    val draft =
        draft(
            functionalityDraft.replace(
                "\"CondensedPrompt\":\"Baut einen JS-Taschenrechner in ein Fieldset/Container ein.\",",
                ""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("CondensedPrompt") }, problems.toString())
  }

  @Test
  fun `an async element placeholder with a signature is committable and keeps its signature`() {
    val draft = draft(epDraft)
    val kind = LocalElementDrafts.kindOf(draft)
    assertEquals(LocalElementKind.ELEMENT_PLACEHOLDER, kind)
    assertEquals(emptyList<String>(), LocalElementDrafts.validate(draft, kind!!, emptyMap(), false))
    val entry = LocalElementDrafts.documentationEntry(kind, draft)
    assertNotNull(entry.getAsJsonObject("Signature"))
    assertEquals("Mein.EP", LocalElementDrafts.nameOf(draft))
    assertTrue(entry.get("local").asBoolean)
  }

  @Test
  fun `a standard needs no code and keeps classes and globals`() {
    val draft = draft(standardDraft)
    val kind = LocalElementDrafts.kindOf(draft)
    assertEquals(LocalElementKind.STANDARD, kind)
    assertEquals(emptyList<String>(), LocalElementDrafts.validate(draft, kind!!, emptyMap(), false))
    val entry = LocalElementDrafts.documentationEntry(kind, draft)
    assertEquals("scientific", entry.getAsJsonObject("globals").get("JOJO_RECHNER_LAYOUT").asString)
    assertNotNull(entry.getAsJsonObject("classes"))
    assertEquals("", LocalElementDrafts.codeOf(draft))
  }

  @Test
  fun `the documentation entry carries the functionality wiring metadata`() {
    val kind = LocalElementKind.FUNCTIONALITY
    val entry = LocalElementDrafts.documentationEntry(kind, draft(functionalityDraft))
    assertTrue(entry.get("local").asBoolean)
    assertEquals(2, entry.getAsJsonArray("supportedFormelementtypes").size())
    assertNotNull(entry.getAsJsonObject("Parameter").get("1"))
    assertFalse(entry.get("CondensedPrompt").asString.isBlank())
  }

  @Test
  fun `the draft is found when the model nests it under draft`() {
    val nested = JsonParser.parseString("""{"draft":$functionalityDraft}""").asJsonObject
    val extracted = LocalElementDrafts.extractDraft(nested.toString())
    assertNotNull(extracted)
    assertEquals("Mein.Rechner", LocalElementDrafts.nameOf(extracted!!))
  }

  @Test
  fun `extractDraft rejects prose`() {
    assertNull(LocalElementDrafts.extractDraft("Sure! Here is your element: Mein.Rechner"))
    assertNull(LocalElementDrafts.extractDraft(""))
  }

  @Test
  fun `the element context lists existing names so a duplicate is avoided`() {
    val context =
        LocalElementDrafts.buildElementContext(
            mapOf(
                "mein.rechner" to LocalElementKind.FUNCTIONALITY,
                "jojo.rechner" to LocalElementKind.STANDARD),
            null,
            null)
    assertTrue(context.contains("mein.rechner (functionality)"), context)
    assertTrue(context.contains("jojo.rechner (standard)"), context)
    assertTrue(context.contains("MUST NOT be reused"), context)
  }

  @Test
  fun `the code key mirrors the local API-Doc manager scheme`() {
    assertEquals(
        "Functionality_mein.rechner",
        LocalElementStore.codeKey(LocalElementKind.FUNCTIONALITY, "Mein.Rechner"))
    assertEquals(
        "Elementplaceholder_mein.ep",
        LocalElementStore.codeKey(LocalElementKind.ELEMENT_PLACEHOLDER, "mein.ep"))
    assertEquals(
        "Standard_jojo.rechner",
        LocalElementStore.codeKey(LocalElementKind.STANDARD, "JOJO.Rechner"))
  }

  @Test
  fun `the kind is recognized from German and synonym spellings`() {
    assertEquals(LocalElementKind.FUNCTIONALITY, LocalElementKind.fromDraft("Funktionalität"))
    assertEquals(LocalElementKind.FUNCTIONALITY, LocalElementKind.fromDraft("funktionalitaet"))
    assertEquals(LocalElementKind.FUNCTIONALITY, LocalElementKind.fromDraft("Functionality"))
    assertEquals(LocalElementKind.ELEMENT_PLACEHOLDER, LocalElementKind.fromDraft("EP"))
    assertEquals(
        LocalElementKind.ELEMENT_PLACEHOLDER, LocalElementKind.fromDraft("Element-Placeholder"))
    assertEquals(LocalElementKind.ELEMENT_PLACEHOLDER, LocalElementKind.fromDraft("Platzhalter"))
    assertEquals(LocalElementKind.STANDARD, LocalElementKind.fromDraft("Standardkonfiguration"))
    assertEquals(LocalElementKind.STANDARD, LocalElementKind.fromDraft("standard configuration"))
    assertNull(LocalElementKind.fromDraft(""))
    assertNull(LocalElementKind.fromDraft(null))
  }

  @Test
  fun `the kind is inferred from the request when the draft omits it`() {
    assertEquals(
        LocalElementKind.FUNCTIONALITY,
        LocalElementKind.inferFromText(
            "Erstelle eine lokale Funktionalität die in ein Fieldset oder einen Container einen JS-Taschenrechner einfügt"))
    assertEquals(
        LocalElementKind.ELEMENT_PLACEHOLDER,
        LocalElementKind.inferFromText(
            "Erstelle einen EP Mein.EP der einen Wetterbericht von Wetter.com bezieht"))
    assertEquals(
        LocalElementKind.ELEMENT_PLACEHOLDER,
        LocalElementKind.inferFromText(
            "Create an element placeholder that fetches a weather report"))
    // A standard FOR a functionality defines the STANDARD, not the functionality.
    assertEquals(
        LocalElementKind.STANDARD,
        LocalElementKind.inferFromText(
            "Erstelle eine Standardkonfiguration JOJO.Rechner für die Funktionalität Mein.Rechner voreingestellt auf wissenschaftliche Anzeige"))
    assertNull(LocalElementKind.inferFromText("Baue ein Datumsfeld in das Formular ein"))
  }

  @Test
  fun `a draft without a usable name is detected so the user is asked instead of aborting`() {
    val withoutName =
        draft(
            """
            {"kind":"functionality","Description":"x","Summary":"y",
             "CondensedPrompt":"c","DetailedPrompt":"d",
             "Code":"window.codbi.registerFunctionality('A.B', () => {});"}
            """)
    assertFalse(LocalElementDrafts.isUsableName(withoutName))
    assertFalse(
        LocalElementDrafts.isUsableName(draft("""{"kind":"functionality","Name":"Rechner"}""")))
    assertTrue(LocalElementDrafts.isUsableName(draft(functionalityDraft)))
  }

  /**
   * Live runs answer in the model's OWN key spelling (`script`, `description`, `parameters`,
   * `attributes`). `extractDraft` canonicalises it, so the information is not thrown away — the
   * reported "The Description is missing. The Code is missing" came from exactly such a draft.
   */
  @Test
  fun `a draft in the model key spelling is canonicalised and committable`() {
    val raw =
        """
        {"name":"Mein.Rechner","kind":"functionality",
         "description":"Bettet einen Taschenrechner ein.",
         "summary":{"en":"Embeds a calculator.","de":"Bettet einen Taschenrechner ein.","it":"Incorpora una calcolatrice."},
         "parameters":{"layout":{"type":"enum","enum":["normal","scientific"],"default":"normal","description":"Layout"}},
         "attributes":{"data-cb-func":"Mein.Rechner","data-cb-layout":{"type":"enum"}},
         "supportedFormElementTypes":["XFieldSet","XContainer"],
         "condensedPrompt":"calculator","detailedPrompt":"layout=normal|scientific",
         "script":"toProcess.appendChild(document.createElement('div'));"}
        """
    val draft = LocalElementDrafts.extractDraft(raw.trimIndent())!!

    assertEquals("Mein.Rechner", LocalElementDrafts.nameOf(draft))
    assertTrue(LocalElementDrafts.codeOf(draft).contains("toProcess.appendChild"), draft.toString())
    assertTrue(draft.get("Summary").isJsonObject, draft.toString())
    // `attributes` → `Usage`, but only its primitive entries (a parameter description is not
    // wiring).
    val usage = LocalElementDrafts.usageOf(draft)
    assertEquals("Mein.Rechner", usage?.get("data-cb-func")?.asString)
    assertNull(usage?.get("data-cb-layout"))
    // The drafting pass prepares the code (id + wrapper) before validating — a bare body is
    // wrapped.
    val prepared =
        LocalElementDrafts.prepareCode(
            LocalElementKind.FUNCTIONALITY, "Mein.Rechner", LocalElementDrafts.codeOf(draft))
    assertTrue(prepared.contains("registerFunctionality(\"Mein.Rechner\""), prepared)
    draft.addProperty("Code", prepared)
    assertTrue(
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
            .isEmpty(),
        "the canonicalised draft must be committable")
  }

  /**
   * The stored documentation must carry the parameter, its typed metadata, the languages and the
   * types.
   */
  @Test
  fun `the documentation entry carries parameter metadata languages and form element types`() {
    val raw =
        """
        {"Name":"Mein.Rechner","kind":"functionality","Description":"d",
         "Summary":{"en":"Embeds a calculator.","de":"Bettet einen Taschenrechner ein.","it":"Incorpora una calcolatrice."},
         "CondensedPrompt":"calculator","DetailedPrompt":"layout=normal|scientific",
         "Parameter":{"layout":{"type":"string","enum":["normal","scientific"],"default":"normal","description":"Layout"}},
         "supportedFormelementtypes":["XFieldSet","XContainer"],
         "Code":"window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { toProcess.appendChild(document.createElement('div')); });"}
        """
    val draft = LocalElementDrafts.extractDraft(raw.trimIndent())!!
    val entry = LocalElementDrafts.documentationEntry(LocalElementKind.FUNCTIONALITY, draft)

    // name → description (the manager's map) …
    assertEquals("Layout", entry.getAsJsonObject("Parameter").get("layout").asString)
    // … plus the typed metadata the designer renders its editors from. The model said `string` but
    // declared a fixed value list, so the stored type MUST be `enum` (reported).
    val meta = entry.getAsJsonObject("parameters").getAsJsonObject("layout")
    assertEquals("enum", meta.get("type").asString)
    assertEquals(2, meta.getAsJsonArray("options").size())
    assertEquals("normal", meta.get("default").asString)
    // per-language short description + the widget types the element applies to
    assertEquals(
        "Bettet einen Taschenrechner ein.", entry.getAsJsonObject("Summary").get("de").asString)
    assertEquals(2, entry.getAsJsonArray("supportedFormelementtypes").size())
  }

  @Test
  fun `an english only summary is refused`() {
    val draft =
        draft(
            functionalityDraft.replace(
                Regex("\"Summary\":\\{[^}]*\\}"), "\"Summary\":\"only english\""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("language", ignoreCase = true) }, problems.toString())
  }

  @Test
  fun `a functionality without form element types is refused`() {
    val draft =
        draft(functionalityDraft.replace(Regex("\"supportedFormelementtypes\":\\[[^]]*\\],"), ""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(
        problems.any { it.contains("supportedFormelementtypes", ignoreCase = true) },
        problems.toString())
  }

  @Test
  fun `the intent value fits the change-log column`() {
    assertEquals(19, LocalElementDrafts.INTENT.length)
    assertTrue(LocalElementDrafts.INTENT.length <= 20)
  }

  /**
   * Reported from a live run: the calculator was committed, its code ran — and
   * `toLoad.getAttribute(…)` threw, because `toLoad` is the resolved PARAMETER OBJECT (the runtime
   * calls `fn(codbiAttributes, currentElement)`). Nothing was rendered.
   */
  @Test
  fun `using toLoad as an element is refused`() {
    val broken =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const layout = toLoad.getAttribute('data-cb-layout') || 'normal'; " +
            "toProcess.appendChild(document.createElement('div')); });"
    val draft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$broken\""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("PARAMETER OBJECT") }, problems.toString())
  }

  /**
   * A functionality that never touches `toProcess` renders nothing — also reported from that run.
   */
  @Test
  fun `a functionality that never touches toProcess is refused`() {
    val broken =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const layout = toLoad.layout; window.__cbLayout = layout; });"
    val draft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$broken\""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("toProcess") }, problems.toString())
    assertFalse(LocalElementDrafts.usesProcessedElement(broken), broken)

    val fine =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "toProcess.appendChild(document.createElement('div')); });"
    assertTrue(LocalElementDrafts.usesProcessedElement(fine), fine)
  }

  /**
   * Reported: "the code is missing the button for the digits" — the answer was CUT OFF, so its
   * trailing statements never made it. An unbalanced brace count is the structural fingerprint of
   * that.
   */
  @Test
  fun `a truncated code is refused`() {
    val cut =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const btn = document.createElement('button'); toProcess.appendChild(btn);"
    val draft = draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$cut\""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("INCOMPLETE") }, problems.toString())
    assertFalse(LocalElementDrafts.hasBalancedBraces(cut), cut)

    val ok =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "toProcess.appendChild(document.createElement('button')); });"
    assertTrue(LocalElementDrafts.hasBalancedBraces(ok), ok)
    // A brace inside a string is not structure.
    assertTrue(
        LocalElementDrafts.hasBalancedBraces(
            "window.codbi.registerFunctionality('A.B', (a, b) => { b.innerHTML = '<div>{'; });"))
  }

  /** A cut-off answer can also stop INSIDE a statement while the braces still balance. */
  @Test
  fun `a code that stops mid-statement is refused`() {
    val cut =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "toProcess.appendChild(document.createElement('button')); toProcess."
    val draft = draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$cut\""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("truncated") }, problems.toString())
    assertFalse(LocalElementDrafts.endsAsAStatement(cut), cut)
    assertTrue(LocalElementDrafts.endsAsAStatement("foo();"), "a statement ends with ';'")
    assertTrue(LocalElementDrafts.endsAsAStatement("function f() {}"), "a block ends with '}'")
  }

  /** Creating buttons without attaching them renders nothing (the reported "missing buttons"). */
  @Test
  fun `a code that never attaches the created elements is refused`() {
    val detached =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const btn = document.createElement('button'); btn.textContent = '7'; });"
    val draft =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$detached\""))
    val problems =
        LocalElementDrafts.validate(draft, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
    assertTrue(problems.any { it.contains("never attach") }, problems.toString())

    val attached =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => { " +
            "const btn = document.createElement('button'); toProcess.appendChild(btn); });"
    val ok =
        draft(functionalityDraft.replace(Regex("\"Code\":\"[^\"]*\""), "\"Code\":\"$attached\""))
    assertTrue(
        LocalElementDrafts.validate(ok, LocalElementKind.FUNCTIONALITY, emptyMap(), false)
            .isEmpty(),
        "an attached button must be committable")
  }

  /**
   * The contract must stay ONE flat document. `PromptLoader` splits a `.md` at every `## ` heading
   * and serves only the part BEFORE the first heading for the parent key — that is how a live model
   * ended up WITHOUT the OUTPUT envelope and the hard rules and answered in its own key spelling.
   */
  @Test
  fun `the contract resource is one block and carries the envelope and the hard rules`() {
    val resource =
        Thread.currentThread()
            .contextClassLoader
            .getResourceAsStream(
                "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/" +
                    LocalElementDrafts.PROMPT_FILE)
    assertNotNull(resource, "the contract resource must be on the test classpath")
    val text = resource!!.bufferedReader().use { it.readText() }

    assertFalse(
        text.lines().any { it.trimStart().startsWith("## ") },
        "the contract must not use `## ` headings (the loader would strip everything after the first)")
    assertTrue(LocalElementDrafts.isCompleteContract(text), "the OUTPUT envelope must be present")
    assertTrue(text.contains("toProcess"), "the callback scope must be documented")
    assertTrue(text.contains("supportedFormelementtypes"), "the applicability must be documented")
    assertTrue(text.contains("\"enum\""), "the enum parameter type must be documented")
    assertTrue(text.contains("\"de\"") && text.contains("\"it\""), "Summary must be per language")
  }

  /**
   * The Local API-Doc manager renders its code editor from `det*[name].Code`, while the runtime
   * loads the `"<detail>_<name>"` row. A committed element must carry BOTH — without the entry's
   * `Code` it appeared in the manager's tree with an EMPTY code editor ("no code supplied for the
   * generated functionality"), even though the code had been committed successfully.
   */
  @Test
  fun `the documentation entry carries the generated code for the manager`() {
    val code =
        "window.codbi.registerFunctionality(\"Mein.Rechner\", (toLoad, toProcess) => { " +
            "toProcess.appendChild(document.createElement('div')); });"
    val entry =
        LocalElementDrafts.documentationEntry(
            LocalElementKind.FUNCTIONALITY, draft(functionalityDraft), code)

    assertEquals(code, entry.get("Code").asString)
    assertTrue(entry.get("local").asBoolean)
    // An element WITHOUT code keeps the key absent (an empty editor must not pretend to have code).
    assertNull(
        LocalElementDrafts.documentationEntry(
                LocalElementKind.FUNCTIONALITY, draft(functionalityDraft))
            .get("Code"))
  }

  /**
   * A CHANGE request ("change the calculator so the buttons wrap") must see the stored definition
   * AND its code, plus the rule that only the requested part changes: the commit REPLACES the
   * stored element with the answer, so a from-scratch rewrite would silently drop parameters,
   * prompts and behaviour nobody asked to change.
   */
  @Test
  fun `the element context carries the current code and the change-only rule`() {
    val current =
        JsonParser.parseString(
                """{"Description":"Fügt einen Taschenrechner ein.","Parameter":{"layout":"Button layout"}}""")
            .asJsonObject
    val currentCode =
        "window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => {\n" +
            "  toProcess.appendChild(document.createElement('div'));\n" +
            "});"

    val context =
        LocalElementDrafts.buildElementContext(
            mapOf("mein.rechner" to LocalElementKind.FUNCTIONALITY), current, currentCode)

    assertTrue(context.contains("CURRENT DEFINITION OF THE ELEMENT TO CHANGE"), context)
    assertTrue(context.contains("CURRENT CODE OF THE ELEMENT TO CHANGE"), context)
    assertTrue(context.contains("toProcess.appendChild"), context)
    assertTrue(context.contains("THIS IS A CHANGE REQUEST"), context)
    assertTrue(context.contains("Change ONLY what"), context)
    // Without an existing element there is no change section at all.
    assertFalse(
        LocalElementDrafts.buildElementContext(
                mapOf("mein.rechner" to LocalElementKind.FUNCTIONALITY), null, null)
            .contains("CHANGE REQUEST"))
  }

  /**
   * The target round lets the MODEL decide which existing element a request means ("the calc
   * functionality") — but only a name that really exists may be selected, so a paraphrase or a
   * hallucination can never pick the wrong element.
   */
  @Test
  fun `the model-chosen target must be a name that really exists`() {
    val known = listOf("mein.rechner", "mein.ep", "jojo.layout")

    assertEquals(
        "mein.rechner",
        LocalElementDrafts.targetNameOf(
            """{"status":"codbi_element_target","Name":"Mein.Rechner"}""", known))
    // A space/underscore spelling of a real name resolves to that name.
    assertEquals(
        "mein.rechner",
        LocalElementDrafts.targetNameOf(
            """{"status":"codbi_element_target","Name":"mein rechner"}""", known))
    assertEquals("mein.ep", LocalElementDrafts.targetNameOf("""{"element":"mein_ep"}""", known))

    // A paraphrase, "new", prose or an empty catalogue selects NOTHING.
    assertNull(
        LocalElementDrafts.targetNameOf(
            """{"status":"codbi_element_target","Name":"Der Taschenrechner"}""", known))
    assertNull(
        LocalElementDrafts.targetNameOf("""{"status":"codbi_element_target","new":true}""", known))
    assertNull(LocalElementDrafts.targetNameOf("nope", known))
    assertNull(
        LocalElementDrafts.targetNameOf(
            """{"status":"codbi_element_target","Name":"mein.ep"}""", emptyList()))
  }

  /**
   * An ambiguous target round becomes a normal clarification question WITH the real names as
   * options.
   */
  @Test
  fun `an ambiguous target round yields the question and its options`() {
    val answer =
        """{"status":"need_clarification","questions":[{"id":"target",""" +
            """"question":"Welchen Rechner meinst du?","options":["mein.rechner","jojo.layout"],""" +
            """"allowFreeText":true}]}"""

    val parsed = LocalElementDrafts.targetQuestionOf(answer)
    assertNotNull(parsed)
    assertEquals("Welchen Rechner meinst du?", parsed!!.first)
    assertEquals(listOf("mein.rechner", "jojo.layout"), parsed.second)

    // A decision ("new") or an empty answer carries no question.
    assertNull(
        LocalElementDrafts.targetQuestionOf("""{"status":"codbi_element_target","new":true}"""))
    assertNull(LocalElementDrafts.targetQuestionOf(null))
  }

  /**
   * The ROUTER must be taught that changing how an existing local element works is a local-element
   * request — in the reported run the whole pipeline was skipped because the request was classified
   * as "form", so the element came back unchanged.
   */
  @Test
  fun `the router is taught that changing an existing local element is a local-element request`() {
    val resource =
        Thread.currentThread()
            .contextClassLoader
            .getResourceAsStream(
                "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-classify-intent.md")
    assertNotNull(resource, "the classifier prompt must be on the test classpath")
    val text = resource!!.bufferedReader().use { it.readText() }

    assertTrue(text.contains("codbi-local-element"), "the intent must be offered")
    assertTrue(
        text.contains("CHANGING HOW AN EXISTING LOCAL ELEMENT WORKS"),
        "the change-request rule must be present")
    // Both shapes named: described by PURPOSE, and phrased as a DEFECT.
    assertTrue(
        text.contains("the calc functionality"), "the purpose-description case must be named")
    assertTrue(text.contains("in einer Reihe"), "the defect phrasing must be named")
    // …and the counter-examples that must stay "form".
    assertTrue(
        text.contains("baue einen Taschenrechner in das Fieldset ein"),
        "the USE-in-the-form counter-example must be named")
  }
}
