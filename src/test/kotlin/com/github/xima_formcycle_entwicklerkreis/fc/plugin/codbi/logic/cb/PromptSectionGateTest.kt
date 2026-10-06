package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [PromptSectionGate] — the pass-1 section gating that drops whole `<!--SECTION:tag-->
 * … <!--/SECTION:tag-->` blocks a request cannot need, so pass-1 does not pay for instruction
 * blocks that cannot apply.
 *
 * The safety contract under test: a block is dropped ONLY when its tag is neither in the AI's
 * `sections` nor matched by a deterministic detector, and any other case (unknown tag, unbalanced
 * markers, no markers) fails OPEN (the block is kept).
 */
class PromptSectionGateTest {

  private val plainFieldRequest =
      "Füge ein Eingabefeld für den Namen und eines für die E-Mail-Adresse hinzu."

  @Test
  fun `the designed-text prompt is detected as designed_text and svg`() {
    val prompt =
        "Füge einen Text in schönem Design an … Mach das Design auch interaktiv … " +
            "eine animierte SVG Illustration …"
    val detected = PromptSectionGate.detect(prompt)
    assertTrue("designed_text" in detected, "detected=$detected")
    assertTrue("svg" in detected, "detected=$detected")
  }

  @Test
  fun `a translation request is detected as translation`() {
    assertTrue(
        "translation" in PromptSectionGate.detect("Übersetze das gesamte Formular ins Englische."))
    assertTrue("translation" in PromptSectionGate.detect("translate the whole form into French"))
  }

  @Test
  fun `a plain field request triggers no capability tag, only the build-scope tag`() {
    val detected =
        PromptSectionGate.detect(
            "Füge ein Pflichtfeld für den Vornamen und ein Auswahlfeld für die Anrede hinzu.")
    // Adding fields IS a build-scope request, so `field_creation` is correct and intended here (the
    // verb "hinzu…" fired). What must NOT fire is any CodBi-CAPABILITY tag — that is the original
    // intent of this guard.
    assertEquals(setOf("field_creation"), detected)
  }

  @Test
  fun `a false-positive detector match only ever KEEPS a block (address on 'E-Mail-Adresse')`() {
    // The deliberate fail-open trade-off: a word that merely CONTAINS a trigger (here "Adresse" in
    // "E-Mail-Adresse") trips the detector. That is harmless — it can only KEEP the `address`
    // block,
    // never drop one — whereas a false negative would drop a needed rule. Documented, not a bug.
    assertTrue("address" in PromptSectionGate.detect(plainFieldRequest))
  }

  @Test
  fun `blank and null corpora never detect anything`() {
    assertTrue(PromptSectionGate.detect(null).isEmpty())
    assertTrue(PromptSectionGate.detect("").isEmpty())
    assertTrue(PromptSectionGate.detect("   ").isEmpty())
  }

  @Test
  fun `an untriggered block is dropped and a kept block loses its markers`() {
    val text =
        "ALWAYS-ON\n" +
            "<!--SECTION:translation-->TRANSLATION RULE<!--/SECTION:translation-->\n" +
            "<!--SECTION:designed_text,svg-->DESIGN RULE<!--/SECTION:designed_text,svg-->\n"
    val gated = PromptSectionGate.applySectionGates(text, setOf("designed_text"))
    assertFalse(gated.contains("TRANSLATION RULE"), gated)
    assertTrue(gated.contains("ALWAYS-ON"), gated)
    assertTrue(gated.contains("DESIGN RULE"), gated)
    assertFalse(gated.contains("<!--SECTION:"), gated)
    assertFalse(gated.contains("<!--/SECTION:"), gated)
  }

  @Test
  fun `a multi-tag block is kept when ANY of its tags is kept`() {
    val text = "<!--SECTION:designed_text,svg-->BOTH<!--/SECTION:designed_text,svg-->"
    assertEquals("BOTH", PromptSectionGate.applySectionGates(text, setOf("svg")))
    assertEquals("BOTH", PromptSectionGate.applySectionGates(text, setOf("designed_text")))
    assertEquals("", PromptSectionGate.applySectionGates(text, setOf("panels")))
  }

  @Test
  fun `an unknown tag fails open (its block is kept)`() {
    val text = "<!--SECTION:brand_new-->NEW<!--/SECTION:brand_new-->"
    assertEquals("NEW", PromptSectionGate.applySectionGates(text, emptySet()))
  }

  @Test
  fun `an unbalanced marker keeps the body and removes only the marker token`() {
    val text = "before <!--SECTION:translation-->body"
    assertEquals("before body", PromptSectionGate.applySectionGates(text, emptySet()))
  }

  @Test
  fun `text without markers is returned unchanged`() {
    val text = "just some decision core text with no markers"
    assertEquals(text, PromptSectionGate.applySectionGates(text, emptySet()))
  }

  @Test
  fun `resolveKeepTags unions the AI sections with the detectors`() {
    // The AI lists translation; the detectors fire on the design prompt; normalisation lowercases.
    val keep =
        PromptSectionGate.resolveKeepTags(listOf(" Translation ", "PANELS"), "ein schönes Design")
    assertTrue("translation" in keep, "keep=$keep")
    assertTrue("panels" in keep, "keep=$keep")
    // resolveKeepTags returns the NORMALISED comparison form (non-alphanumerics stripped).
    assertTrue("designedtext" in keep, "keep=$keep")
  }

  @Test
  fun `all gated tags are declared known so a typo cannot silently drop a block`() {
    // The tags used in the decision-core markers must all be members of KNOWN_TAGS.
    val usedInPrompts =
        setOf(
            "translation",
            "designed_text",
            "svg",
            "custom_js",
            "panels",
            "photocropper",
            "ep_wiring",
            "address",
            "logging",
            "datasource",
            "navbar",
            "repeatable",
            "upload",
            "approval",
            "bundid",
            "aichat",
            "css",
            "date",
            "appointment")
    assertTrue(
        PromptSectionGate.KNOWN_TAGS.containsAll(usedInPrompts),
        PromptSectionGate.KNOWN_TAGS.toString())
  }

  @Test
  fun `variant spellings of a kept tag still match a marker tag`() {
    val block = "<!--SECTION:designed_text-->X<!--/SECTION:designed_text-->"
    // hyphen / spaces / different case all normalise to the same comparison form
    assertEquals("X", PromptSectionGate.applySectionGates(block, setOf("designed-text")))
    assertEquals("X", PromptSectionGate.applySectionGates(block, setOf("Designed Text")))
    val aiChat = "<!--SECTION:aichat-->A<!--/SECTION:aichat-->"
    assertEquals("A", PromptSectionGate.applySectionGates(aiChat, setOf("AI Chat")))
  }

  @Test
  fun `a costly tag is honoured only when the detector matches too`() {
    // "when UNSURE, INCLUDE it" is right for a cheap capability tag, but `svg` gates ~15-20k chars
    // of the XSpan illustration half. An AI-only inclusion must therefore not keep it; a real
    // keyword must.
    val cssOnlyAnimation =
        "Die Stichpunkte sollen interaktiv animiert sein, wenn man mit der Maus darüber fährt."
    assertFalse("svg" in PromptSectionGate.resolveKeepTags(listOf("svg"), cssOnlyAnimation))
    assertTrue(
        "svg" in
            PromptSectionGate.resolveKeepTags(
                listOf("svg"), "Bitte eine animierte SVG Illustration einbauen"))
    assertFalse(
        "customjs" in PromptSectionGate.resolveKeepTags(listOf("custom_js"), cssOnlyAnimation))
    assertTrue(
        "customjs" in
            PromptSectionGate.resolveKeepTags(listOf("custom_js"), "Das geht per JavaScript"))
    // Cheap capability tags keep the AI signal alone ...
    assertTrue("designedtext" in PromptSectionGate.resolveKeepTags(listOf("designed_text"), null))
    // ... and the detector still adds a tag the AI did not mention.
    assertTrue("designedtext" in PromptSectionGate.resolveKeepTags(null, "schöner Text mit Design"))
  }

  @Test
  fun `resolveKeepTags normalises variant spellings returned by the AI`() {
    val keep = PromptSectionGate.resolveKeepTags(listOf("designed-text", "EP Wiring"), null)
    assertTrue("designedtext" in keep, "keep=$keep")
    assertTrue("epwiring" in keep, "keep=$keep")
  }

  @Test
  fun `the sections vocabulary advertised in the chat prompt matches KNOWN_TAGS`() {
    // Drift guard: the AI is told which members are valid — they must be exactly the tags the gate
    // can act on. If either side changes without the other, this fails.
    val resource =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md"
    val text =
        PromptSectionGate::class
            .java
            .classLoader
            .getResourceAsStream(resource)
            ?.bufferedReader(Charsets.UTF_8)
            ?.use { it.readText() }
    assertTrue(
        text != null && text.contains("\"sections\""), "the chat prompt must define sections")
    val advertised = Regex("\"sections\"[^\\[]*\\[([^\\]]*)\\]").find(text!!)?.groupValues?.get(1)
    assertTrue(advertised != null, "could not locate the sections vocabulary in the chat prompt")
    val members =
        advertised!!.split(",").map { it.trim().removeSurrounding("\"") }.filter { it.isNotBlank() }
    assertEquals(PromptSectionGate.KNOWN_TAGS, members.toSet())
  }

  @Test
  fun `cache mode keeps every known block and only strips the markers`() {
    // AI_Assistant_PromptCaching passes PromptSectionGate.KNOWN_TAGS as the keep set. Its contract:
    // NOTHING may be dropped mid-prompt (a request-dependent drop would change every byte after it
    // and invalidate the provider's prefix cache) — but the raw marker comments must still
    // disappear,
    // because the model reads `<!--SECTION:…-->` as "commented out".
    val text =
        "ALWAYS-ON\n" +
            "<!--SECTION:translation-->TRANSLATION RULE<!--/SECTION:translation-->\n" +
            "<!--SECTION:designed_text,svg-->DESIGN RULE<!--/SECTION:designed_text,svg-->\n"
    val cached = PromptSectionGate.applySectionGates(text, PromptSectionGate.KNOWN_TAGS)
    assertTrue(cached.contains("ALWAYS-ON"), cached)
    assertTrue(cached.contains("TRANSLATION RULE"), cached)
    assertTrue(cached.contains("DESIGN RULE"), cached)
    assertFalse(cached.contains("<!--SECTION:"), cached)
    assertFalse(cached.contains("<!--/SECTION:"), cached)
  }

  @Test
  fun `cache mode equals the full corpus with the markers removed`() {
    // The invariant that makes the mode cacheable: the result is independent of what the request
    // would have needed — it is simply the complete corpus minus the marker tokens.
    val text =
        "CORE\n" +
            "<!--SECTION:translation-->TRANSLATION<!--/SECTION:translation-->\n" +
            "<!--SECTION:svg-->SVG<!--/SECTION:svg-->"
    assertEquals(
        "CORE\nTRANSLATION\nSVG",
        PromptSectionGate.applySectionGates(text, PromptSectionGate.KNOWN_TAGS))
    // ...whereas the request-dependent gates really do produce a SHORTER, different prompt (the
    // mode
    // exists because of exactly this difference).
    val gated = PromptSectionGate.applySectionGates(text, setOf("svg"))
    assertFalse(gated.contains("TRANSLATION"), gated)
    assertTrue(
        gated.length <
            PromptSectionGate.applySectionGates(text, PromptSectionGate.KNOWN_TAGS).length)
  }

  @Test
  fun `a plain label edit triggers neither build-scope tag`() {
    // Regression: the bare NOUN ("field"/"Feld") must never fire `field_creation` — otherwise a
    // plain edit keeps the ~12 k chars of construction rules it does not need (which made the
    // token count go UP after the first version of this marking).
    val plainEdits =
        listOf(
            "Ändere das Label des Vorname-Feldes auf Vor-Name.",
            "Change the field label to Vor-Name.",
            "Setze den Hilfetext des E-Mail Feldes.",
            "Rename the container title.")
    for (corpus in plainEdits) {
      val detected = PromptSectionGate.detect(corpus)
      assertFalse("field_creation" in detected, "$corpus -> detected=$detected")
      assertFalse("removal" in detected, "$corpus -> detected=$detected")
    }
  }

  @Test
  fun `creating fields and removing elements trigger their build-scope tags`() {
    assertTrue(
        "field_creation" in PromptSectionGate.detect("Füge ein Feld für die E-Mail-Adresse hinzu."))
    assertTrue(
        "field_creation" in
            PromptSectionGate.detect("Add a new field for the customer's phone number."))
    assertTrue("removal" in PromptSectionGate.detect("Entferne das Feld Nachname."))
    assertTrue("removal" in PromptSectionGate.detect("delete the address field"))
  }

  @Test
  fun `a plain edit drops the build-scope rules of the structure core and keeps the core rules`() {
    val resource =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md"
    val text =
        PromptSectionGate::class
            .java
            .classLoader
            .getResourceAsStream(resource)
            ?.bufferedReader(Charsets.UTF_8)
            ?.use { it.readText() }
    assertTrue(
        text != null && text.contains("<!--SECTION:field_creation-->"),
        "the structure core must carry the build-scope markers")
    val gated = PromptSectionGate.applySectionGates(text!!, emptySet())
    // Build-scope rules are dropped for a request that builds nothing ...
    assertFalse(gated.contains("ROW GROUPING RULES"), "row grouping should be gated away")
    assertFalse(gated.contains("COMPLETE FORM RULES"), "complete-form rules should be gated away")
    assertFalse(gated.contains("REMOVALS — REMOVE A FIELD"), "removal rules should be gated away")
    assertFalse(gated.contains("BUTTON ACTIONS"), "button actions should be gated away")
    // Newly-gated build-scope rules (creation/placement/naming) are dropped too ...
    assertFalse(
        gated.contains("RELATIVE PLACEMENT OF A NEW ELEMENT"),
        "relative placement is a build-scope rule and must be gated away for a plain edit")
    assertFalse(
        gated.contains("ELEMENT NAMES use a type prefix"),
        "element-naming is a build-scope rule and must be gated away for a plain edit")
    assertFalse(
        gated.contains("INTRO AT POSITION 0"),
        "intro-position is a build-scope rule and must be gated away for a plain edit")
    assertFalse(
        gated.contains("NEVER invent a className"),
        "className-validity is a build-scope rule and must be gated away for a plain edit")
    assertFalse(
        gated.contains("Buttons (submit, back, next) are NOT standalone widgets"),
        "button-structure is a build-scope rule and must be gated away for a plain edit")
    // ... while the always-on core of the same file survives verbatim.
    assertTrue(gated.contains("HOW TO READ THE FORM DUMP"), "the reading convention must stay")
    assertTrue(gated.contains("CONDITIONAL PROPERTIES"), "conditionals must stay")
    assertTrue(gated.contains("REUSE INSTEAD OF DUPLICATING"), "reuse-instead-of-dup must stay")
    assertTrue(gated.contains("FLAT ITEMS WITH PROPERTY-LEVEL REFERENCES"), "flat-items must stay")
    assertTrue(gated.length < text.length, "gating must actually shorten the prompt")
  }

  @Test
  fun `the designed-text and svg blocks are split so a css-only design request drops the illustration rules`() {
    // Lever 1 (the immediate next step): the structure core used to carry ONE block tagged
    // `designed_text,svg`, so a CSS-only design request kept the illustration rules through the
    // `designed_text` half. The block is now split into a `designed_text` part and an `svg` part.
    val resource =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md"
    val text =
        PromptSectionGate::class
            .java
            .classLoader
            .getResourceAsStream(resource)
            ?.bufferedReader(Charsets.UTF_8)
            ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")
    val designedTextMarker = "RICH / DESIGNED / INTERACTIVE TEXT — DECISION RULES"
    val illustrationMarker = "ILLUSTRATION — DECISION RULE"
    // A CSS-only / animation design request keeps only the designed-text part ...
    val cssOnly = PromptSectionGate.applySectionGates(text, setOf("designed_text"))
    assertTrue(cssOnly.contains(designedTextMarker), "the designed-text rules must stay")
    assertFalse(cssOnly.contains(illustrationMarker), "the illustration rules must be dropped")
    // ... an illustration request keeps only the svg part ...
    val illustration = PromptSectionGate.applySectionGates(text, setOf("svg"))
    assertFalse(
        illustration.contains(designedTextMarker), "the designed-text rules must be dropped")
    assertTrue(illustration.contains(illustrationMarker), "the illustration rules must stay")
    // ... and a request needing both still gets both.
    val both = PromptSectionGate.applySectionGates(text, setOf("designed_text", "svg"))
    assertTrue(both.contains(designedTextMarker), "the designed-text rules must stay")
    assertTrue(both.contains(illustrationMarker), "the illustration rules must stay")
  }

  @Test
  fun `a plain edit drops the newly-gated build-scope blocks of the general and task cores`() {
    fun loadCorpus(path: String): String =
        PromptSectionGate::class
            .java
            .classLoader
            .getResourceAsStream(path)
            ?.bufferedReader(Charsets.UTF_8)
            ?.use { it.readText() } ?: error("no such resource: $path")

    val general =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md"
    val task =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-task-instruction.decision.md"

    // A plain edit (empty keep set) must drop the creation-only blocks we just tagged ...
    val generalGated = PromptSectionGate.applySectionGates(loadCorpus(general), emptySet())
    assertFalse(
        generalGated.contains("EXACT WIDGET className CASING"),
        "className-casing is build-scope; a plain edit does not need it")
    // A plain edit also drops the removal block (empty keep set keeps no build-scope tag) ...
    assertFalse(
        generalGated.contains("REMOVING A FUNCTIONALITY FROM AN EXISTING ELEMENT"),
        "removal rules are build-scope; a plain edit does not need them")
    // ... while the always-on cross-cutting rules of the same file survive verbatim.
    assertTrue(generalGated.contains("PRESERVE EXISTING ATTRIBUTES"), "preserve must stay")
    assertTrue(
        generalGated.contains("MOVING ELEMENTS PRESERVES EVERYTHING ELSE"), "moving must stay")
    assertTrue(
        generalGated.contains("MODIFYING AN EXISTING ELEMENT IN PLACE KEEPS ALL OTHER ELEMENTS"),
        "modify-in-place must stay")

    val taskGated = PromptSectionGate.applySectionGates(loadCorpus(task), emptySet())
    assertFalse(
        taskGated.contains("PLACE EVERY CREATED ELEMENT"),
        "create-placement is build-scope; a plain edit does not need it")
    assertFalse(
        taskGated.contains("NO DIRECT WIDGET CREATION"),
        "direct-creation protocol is build-scope; a plain edit does not need it")
    // CONTROL TYPES is deliberately kept ungated (a conversion edit needs it without a verb).
    assertTrue(taskGated.contains("CONTROL TYPES:"), "control types must stay")
  }

  @Test
  fun `a creation request keeps the newly-gated build-scope blocks of all three cores`() {
    val keep = PromptSectionGate.resolveKeepTags(null, "Füge ein neues Feld für die Adresse hinzu.")
    // resolveKeepTags returns tags in NORMALIZED form (lowercased, separators stripped), so the
    // marker tag `field_creation` surfaces as `fieldcreation`.
    assertTrue("fieldcreation" in keep, "keep=$keep")

    fun loadCorpus(path: String): String =
        PromptSectionGate::class
            .java
            .classLoader
            .getResourceAsStream(path)
            ?.bufferedReader(Charsets.UTF_8)
            ?.use { it.readText() } ?: error("no such resource: $path")

    val general =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md"
    val task =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-task-instruction.decision.md"
    val structure =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md"

    assertTrue(
        PromptSectionGate.applySectionGates(loadCorpus(general), keep)
            .contains("EXACT WIDGET className CASING"),
        "creation request keeps className-casing")
    assertTrue(
        PromptSectionGate.applySectionGates(loadCorpus(task), keep)
            .contains("PLACE EVERY CREATED ELEMENT"),
        "creation request keeps create-placement")
    assertTrue(
        PromptSectionGate.applySectionGates(loadCorpus(task), keep)
            .contains("NO DIRECT WIDGET CREATION"),
        "creation request keeps direct-creation protocol")
    assertTrue(
        PromptSectionGate.applySectionGates(loadCorpus(structure), keep)
            .contains("RELATIVE PLACEMENT OF A NEW ELEMENT"),
        "creation request keeps relative placement")
    // Regression: a creation request must keep the explicit "never emit a container with an empty
    // 'elements' when the request asked for content inside it" imperative. Without it the AI emits
    // a
    // bare container (e.g. `fdPersonData`) with NO input fields inside — the empty-container
    // regression.
    val gatedStructure = PromptSectionGate.applySectionGates(loadCorpus(structure), keep)
    assertTrue(
        gatedStructure.contains("create ALL of those child input items IN THE SAME RESPONSE"),
        "creation request keeps the never-empty-container imperative")
    assertTrue(
        gatedStructure.contains("empty 'elements':[]"),
        "creation request keeps the empty-elements prohibition")
    // A REMOVAL request keeps the removal block of the general core.
    val removalKeep = PromptSectionGate.resolveKeepTags(null, "Entferne das Feld Nachname.")
    assertTrue("removal" in removalKeep, "removalKeep=$removalKeep")
    assertTrue(
        PromptSectionGate.applySectionGates(loadCorpus(general), removalKeep)
            .contains("REMOVING A FUNCTIONALITY FROM AN EXISTING ELEMENT"),
        "removal request keeps the removal rules")
  }

  @Test
  fun `the German einfuegen and platzieren verbs fire the build-scope detector`() {
    // Regression for the detector expansion: a request phrased purely as placement/insertion must
    // still be recognised as build-scope — otherwise the placement rules are dropped for a request
    // that actually builds. The separable-prefix imperative "Füge ... ein" (prefix split from the
    // stem) is caught by the bare "füge" verb, and the infinitive "einfügen" by the contiguous
    // form.
    assertTrue(
        "field_creation" in PromptSectionGate.detect("Füge ein Texteingabefeld ein."),
        "split-prefix füge must fire field_creation")
    assertTrue(
        "field_creation" in PromptSectionGate.detect("Ich möchte ein Texteingabefeld einfügen."),
        "contiguous einfügen must fire field_creation")
    assertTrue(
        "field_creation" in
            PromptSectionGate.detect("Platziere ein Pflichtfeld unter dem Adress-Container."),
        "platzieren must fire field_creation")
    assertTrue(
        "field_creation" in PromptSectionGate.detect("Fuege ein neues Feld ein."),
        "fuege (ASCII) must fire field_creation")
    // A plain edit still must not fire it.
    assertFalse(
        "field_creation" in PromptSectionGate.detect("Ändere das Label des Vorname-Feldes."),
        "a plain edit must not fire field_creation")
  }

  @Test
  fun `Bayernportal and Bavarian-portal wording fire the ep_wiring detector`() {
    // Regression for the live bug report: the user asked for a text field showing an employee's
    // contact data "der im Bayernportal registriert ist", and the assistant produced a bare
    // XTextField with codbiVerdict="none". Root cause: the pass-1 ep_wiring block (which carries
    // the
    // "Bayernportal == BayVIS" decision rule and the employee-contact HTML.Text.Mapper/EP wiring)
    // is
    // GATED, and its deterministic detector only matched the literal word "bayvis". A prompt that
    // spoke only of the "Bayernportal" therefore dropped the block, so the model never "decided"
    // BayVIS applies. Adding the portal-synonym keywords makes the detector keep ep_wiring.
    assertTrue(
        "ep_wiring" in
            PromptSectionGate.detect(
                "Füge ein Textfeld ein welches die Kontaktdaten des Mitarbeiters anzeigt der im Bayernportal registriert ist."),
        "Bayernportal must fire ep_wiring")
    assertTrue(
        "ep_wiring" in PromptSectionGate.detect("alle Ämter im Bayernportal für die Stadt"),
        "Bayernportal authorities must fire ep_wiring")
    assertTrue(
        "ep_wiring" in
            PromptSectionGate.detect("a text field for contact data from the Bavarian portal"),
        "Bavarian portal must fire ep_wiring")
    // The established literal term still fires it.
    assertTrue("ep_wiring" in PromptSectionGate.detect("BayVIS-Kontaktdaten anzeigen"))
  }

  @Test
  fun `a Bayernportal request keeps the employee-contact wiring rules of the ep_wiring block`() {
    // Regression for the live bug report follow-up: with the ep_wiring block now correctly kept for
    // a "Bayernportal" request, it must ALSO carry the exact data-cb-* parameter-name lesson so the
    // model never puts the EP under data-cb-Data (a Sys.Log.Console-only attribute) and never omits
    // data-cb-property on an HTML.Text.Mapper/Injector element.
    val keep =
        PromptSectionGate.resolveKeepTags(
            null,
            "Füge ein Textfeld ein welches die Kontaktdaten des Mitarbeiters anzeigt der im Bayernportal registriert ist.")
    // resolveKeepTags returns tags in NORMALIZED form (lowercased, separators stripped), so the
    // marker tag `ep_wiring` surfaces as `epwiring` (the same normalization as field_creation ->
    // fieldcreation).
    assertTrue("epwiring" in keep, "keep=$keep")
    val gated =
        PromptSectionGate.applySectionGates(
            PromptSectionGate::class
                .java
                .classLoader
                .getResourceAsStream(
                    "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md")
                ?.bufferedReader(Charsets.UTF_8)
                ?.use { it.readText() } ?: error("no decision core resource"),
            keep)
    assertTrue(gated.contains("data-cb-Data"), "wrong-parameter prohibition must be kept")
    // The exact corrective wording must survive gating for a Bayernportal request.
    assertTrue(
        gated.contains("HTML.Text.INJECTOR carries its single string in data-cb-replacement"),
        "Injector parameter-name lesson must be kept")
    assertTrue(
        gated.contains("EVERY HTML.Text.Mapper/Injector element MUST carry data-cb-property"),
        "data-cb-property requirement must be kept")
    // The known never-write precondition is present too.
    assertTrue(
        gated.contains(
            "NEVER write the EP into \"data-cb-Data\", which belongs ONLY to Sys.Log.Console"),
        "Sys.Log.Console-only attribution must be kept")
    assertTrue(
        gated.contains("No text functionality ever uses data-cb-Data for its EP"),
        "data-cb-Data forbidden on text functionalities must be kept")
    // Regression for the live bug report "the ai generated a text without any placeholders in it
    // so the functionality cannot write anything": the element's OWN content property (rtevalue on
    // an XSpan / value on a text field) must carry the [(property)] placeholder TEMPLATE, or the
    // HTML.Text.Mapper/Injector has nothing to expand and renders empty. This requirement and the
    // worked example (which shows the placeholders living INSIDE rtevalue alongside the wiring)
    // must survive gating for a Bayernportal request.
    assertTrue(
        gated.contains(
            "HARD REQUIREMENT — THE CONTENT CARRIES THE [(property)] PLACEHOLDER TEMPLATE"),
        "content placeholder-template requirement must be kept")
    assertTrue(
        gated.contains("An HTML.Text.Mapper element whose content property is BLANK or MISSING"),
        "blank/missing content placeholder must be a FAIL in the block")
    assertTrue(
        gated.contains("[(vorname)]/[(nachname)]/[(email)] placeholders live INSIDE the rtevalue"),
        "worked example placeholder-in-content lesson must be kept")
    assertTrue(
        gated.contains("MUST carry a non-empty placeholder template in its own content property"),
        "non-empty placeholder template requirement must be kept in the param-name rule")
    // Regression for the bug "the AI builds the text functionality in pass-1" where it skipped the
    // details request and invented the BayVIS placeholder property names from memory. The gated
    // ep_wiring block must (a) hard-require building a BayVIS-backed text functionality ONLY in
    // pass-2 via need_codbi_details, and (b) embed the authoritative per-EP property lists so a
    // pass-1/edge emit still names real properties. Both must survive gating for a Bayernportal
    // request.
    assertTrue(
        gated.contains("A TEXT FUNCTIONALITY AGAINST A BayVIS EP IS BUILT IN PASS-2, NEVER PASS-1"),
        "BayVIS text functionality must be pass-2-only in the block")
    assertTrue(
        gated.contains("AUTHORITATIVE BayVIS per-EP PROPERTY LISTS"),
        "authoritative property lists must be kept in the block")
    assertTrue(
        gated.contains(
            "apTelefonLandvorwahl, apTelefonOrtsvorwahl, apTelefonAnlage, apTelefonDurchwahl, apEmail"),
        "Ansprechpartner.Details property list must be kept")
    assertTrue(
        gated.contains("There is NO \"phone\"/\"telefon\"/\"telephone\" property"),
        "no-phone property rule must be kept")
    // Regression for "the ai used [(apTelefonOrtsvorwahl)] [(apTelefonDurchwahl)] which is missing
    // the main number in the middle": the gated block's own phone-composition example previously
    // dropped apTelefonAnlage (and apTelefonLandvorwahl), so the model copied it verbatim and
    // emitted an incomplete phone. The block must now require ALL FOUR apTelefon* parts together
    // and
    // explicitly forbid omitting apTelefonAnlage. Both clauses must survive gating for
    // Bayernportal.
    assertTrue(
        gated.contains(
            "[(apTelefonLandvorwahl)] [(apTelefonOrtsvorwahl)] [(apTelefonAnlage)] [(apTelefonDurchwahl)]"),
        "full four-part phone composition must be kept in the block")
    assertTrue(
        gated.contains(
            "Omitting [(apTelefonAnlage)] (or any part) produces an incomplete phone number — a FAIL"),
        "omitting apTelefonAnlage must be explicitly forbidden in the block")
    assertTrue(
        gated.contains(
            "hausanschriftPLZ, hausanschriftOrt, hausanschriftStrasse, postanschriftPLZ, postanschriftOrt, postanschriftStrasse, logo"),
        "building property list must be kept")
    assertTrue(
        gated.contains("There is NO hausanschriftHausnummer"), "no-house-number rule must be kept")
    assertTrue(
        gated.contains(
            "a person/employee (name, e-mail, phone, contact) ALWAYS comes from BayVIS.Ansprechpartner.Details"),
        "subject-to-EP remapping rule must be kept")
    // Regression for the +60k input-token report: the model PARTIALLY followed the pass-2-only rule
    // (requested the BayVIS EP but omitted HTML.Text.Mapper in pass-1), then re-requested the same
    // set in later passes, degrading the run into pass-1 + pass-2 + pass-3 + a forced final
    // complete-form pass — each re-sending the whole ~70-80KB system prompt. The ep_wiring block
    // must now hard-require ONE complete request (Mapper/Injector AND the BayVIS EP together) and a
    // NEVER re-request the same set. Both clauses must survive gating for a Bayernportal request.
    assertTrue(
        gated.contains("ONE COMPLETE REQUEST — NEVER SPLIT OR RE-REQUEST"),
        "one-complete-request rule must be kept in the block")
    assertTrue(
        gated.contains(
            "\"elements\" MUST contain BOTH the \"HTML.Text.Mapper\" (or \"HTML.Text.Injector\") id AND the exact BayVIS EP id(s)"),
        "request-BOTH-together rule must be kept in the block")
    assertTrue(
        gated.contains(
            "NEVER emit a second \"need_codbi_details\" for ANY id, widget or EP you already requested"),
        "never-re-request-the-same-set rule must be kept in the block")
    assertTrue(
        gated.contains("A single re-request of the exact same set is a degenerate loop"),
        "degenerate-loop cost warning must be kept in the block")
  }

  @Test
  fun `the server_vars catalog is demand-gated but the EConditionType codes stay on`() {
    // Regression for the demand-gated Server-Variables catalog lever: the ~3KB placeholder catalog
    // (`[%\$NAME%]` system placeholders) is only needed when the request/form actually references a
    // placeholder, so it is wrapped in SECTION:server_vars and must be dropped for a plain edit —
    // while the EConditionType numeric codes (untagged, same file) must survive verbatim because a
    // conversion edit can need them (e.g. hiddenifcomp="9") without ever mentioning a placeholder.
    fun loadCorpus(path: String): String =
        PromptSectionGate::class
            .java
            .classLoader
            .getResourceAsStream(path)
            ?.bufferedReader(Charsets.UTF_8)
            ?.use { it.readText() } ?: error("no such resource: $path")

    val resource =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-general-apply.md"
    val raw = loadCorpus(resource)

    // Drift guard: the markers must be present and the tag must be a known, actable tag.
    assertTrue(raw.contains("<!--SECTION:server_vars-->"), "raw must carry the open marker")
    assertTrue(raw.contains("<!--/SECTION:server_vars-->"), "raw must carry the close marker")
    assertTrue(
        "server_vars" in PromptSectionGate.KNOWN_TAGS, "server_vars must be a KNOWN_TAG to gate")

    // A plain edit (or any request that does not reference a placeholder) keeps EConditionType but
    // drops the whole server-variable catalog.
    val gatedOut = PromptSectionGate.applySectionGates(raw, emptySet())
    assertTrue(
        gatedOut.contains("ECONDITIONTYPE CODES"), "EConditionType codes must stay (untagged)")
    assertTrue(gatedOut.contains("MANDATORY"), "EConditionType '0 = MANDATORY' must stay")
    assertTrue(gatedOut.contains("9 = EMPTY"), "EConditionType '9 = EMPTY' must stay")
    assertFalse(
        gatedOut.contains("AVAILABLE SERVER VARIABLES"),
        "the server-variables catalog must be gated out for a plain edit")
    assertFalse(gatedOut.contains("FORM RECORD"), "FORM RECORD block must be dropped")
    // The corpus documents the placeholders as [%\u0024...%] with the dollar escaped for Markdown,
    // so match the literal backslash-dollar bytes actually present in the file.
    assertFalse(gatedOut.contains("[%\\\$PROCESS_ID%]"), "server-variable literals must be dropped")
    assertFalse(
        gatedOut.contains("<!--SECTION:server_vars-->"),
        "gated out markers must be stripped, not left dangling")

    // A request/email/parameter insert that references a placeholder keeps the catalog and strips
    // only the marker comments.
    val kept = PromptSectionGate.applySectionGates(raw, setOf("server_vars"))
    assertTrue(
        kept.contains("AVAILABLE SERVER VARIABLES"), "a placeholder request keeps the catalog")
    assertTrue(kept.contains("[%\\\$PROCESS_ID%]"), "a placeholder request keeps the literals")
    assertFalse(kept.contains("<!--SECTION:"), "markers must be stripped when kept")

    // Caching mode (KNOWN_TAGS as keep set) must also keep the catalog — nothing may be dropped
    // mid-prompt in the cacheable variant.
    val cached = PromptSectionGate.applySectionGates(raw, PromptSectionGate.KNOWN_TAGS)
    assertTrue(cached.contains("AVAILABLE SERVER VARIABLES"), "cache mode keeps the catalog")
    assertFalse(cached.contains("<!--/SECTION:"), "cache mode strips the close markers")

    // And the gated-out variant is materially shorter (that is the point of the lever ~3KB).
    assertTrue(gatedOut.length < kept.length, "gating out must shorten the prompt")
  }
}
