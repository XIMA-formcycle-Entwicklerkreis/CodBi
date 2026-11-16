package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc.CodbiLocalApidoc
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import javax.persistence.EntityManager
import org.slf4j.LoggerFactory

/**
 * The three kinds of **local** CodBi elements the AI may define: a functionality, an element
 * placeholder and a standard configuration.
 *
 * Every kind maps onto exactly one section of the local API-doc documentation JSON (the single
 * source of truth managed by the Local API-Doc manager) plus one "file listing" array that the
 * designer's element listings are built from:
 * ```
 * { "fslFunctionalities":"[...]", "detFunctionalities":{ … },
 *   "fslElementplaceholder":"[...]", "detElementplaceholder":{ … },
 *   "fileListing":"[...]", "detStandards":{ … } }
 * ```
 *
 * @property draftValue The value the AI uses in its draft envelope (`kind`).
 * @property detail The `detail` used for the code key (`"<detail>_<name>"`, see
 *   [com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc.StructuredDataStoreAction]).
 * @property section The documentation JSON section holding the element entries.
 * @property fileListKey The documentation JSON key holding the `.js` file-name listing of the
 *   section.
 * @property registerCall The runtime registration call the generated code must contain.
 */
internal enum class LocalElementKind(
    val draftValue: String,
    val detail: String,
    val section: String,
    val fileListKey: String,
    val registerCall: String
) {
  FUNCTIONALITY(
      "functionality",
      "Functionality",
      "detFunctionalities",
      "fslFunctionalities",
      "registerFunctionality"),
  ELEMENT_PLACEHOLDER(
      "elementPlaceholder",
      "Elementplaceholder",
      "detElementplaceholder",
      "fslElementplaceholder",
      "registerEP"),
  STANDARD("standard", "Standard", "detStandards", "fileListing", "");

  /**
   * Whether the kind requires `CondensedPrompt` / `DetailedPrompt`.
   *
   * ALL THREE kinds do: a standard configuration is exactly what a later AI form run has to find
   * and activate, so it needs the same short/long descriptions as a functionality or an EP
   * (reported: a generated standard configuration was committed without any AI prompt, so no later
   * run could ever pick it).
   */
  val requiresPrompts: Boolean
    get() = true

  companion object {

    /**
     * Accepted spellings of the three kinds — English AND German, plus the synonyms a request or a
     * model typically uses ("Funktionalität", "EP", "Standardkonfiguration"). Keyed by the
     * alphanumeric-only form (see [normalizeKind]).
     */
    private val ALIASES: Map<String, LocalElementKind> =
        mapOf(
            "functionality" to LocalElementKind.FUNCTIONALITY,
            "function" to LocalElementKind.FUNCTIONALITY,
            "funktionalitat" to LocalElementKind.FUNCTIONALITY,
            "funktionalitaet" to LocalElementKind.FUNCTIONALITY,
            "funktion" to LocalElementKind.FUNCTIONALITY,
            "funktional" to LocalElementKind.FUNCTIONALITY,
            "elementplaceholder" to LocalElementKind.ELEMENT_PLACEHOLDER,
            "elementplatzhalter" to LocalElementKind.ELEMENT_PLACEHOLDER,
            "element" to LocalElementKind.ELEMENT_PLACEHOLDER,
            "platzhalter" to LocalElementKind.ELEMENT_PLACEHOLDER,
            "placeholder" to LocalElementKind.ELEMENT_PLACEHOLDER,
            "ep" to LocalElementKind.ELEMENT_PLACEHOLDER,
            "standard" to LocalElementKind.STANDARD,
            "standardkonfiguration" to LocalElementKind.STANDARD,
            "standardconfiguration" to LocalElementKind.STANDARD,
            "standardconfig" to LocalElementKind.STANDARD,
            "konfiguration" to LocalElementKind.STANDARD,
            "configuration" to LocalElementKind.STANDARD)

    /**
     * Lowercased, alphanumeric-only form of a kind value ("Funktionalität" → "funktionalitat").
     * German umlauts are transliterated FIRST — stripping them would yield "funktionalitt" and the
     * German spellings (which a user's request uses) would never resolve.
     */
    private fun normalizeKind(value: String): String =
        value
            .trim()
            .lowercase()
            .replace("ä", "a")
            .replace("ö", "o")
            .replace("ü", "u")
            .replace("ß", "ss")
            .replace(Regex("[^a-z0-9]"), "")

    /**
     * Resolves a draft `kind` value. Accepts the canonical values, the internal `detail`, the enum
     * name, and the German/synonym spellings — a request that SAYS "lokale Funktionalität" already
     * names the kind, so it must never be (re-)asked.
     */
    fun fromDraft(value: String?): LocalElementKind? {
      val raw = value?.trim() ?: return null
      if (raw.isEmpty()) return null
      ALIASES[normalizeKind(raw)]?.let {
        return it
      }
      return values().firstOrNull { normalizeKind(it.draftValue) == normalizeKind(raw) }
    }

    /**
     * Infers the kind from the user's REQUEST when the draft carries none (or an unknown one). This
     * is the server-side safety net behind the contract rule "never ask for the kind": the
     * request's own words name it. Structural, order-sensitive by specificity — "eine
     * Standardkonfiguration für die Funktionalität X" DEFINES the standard, so the standard wins
     * over the functionality.
     */
    fun inferFromText(text: String?): LocalElementKind? {
      val t = text?.lowercase() ?: return null
      if (STANDARD_MARKERS.any { t.contains(it) }) return STANDARD
      if (EP_MARKER.containsMatchIn(t) || PLACEHOLDER_MARKERS.any { t.contains(it) }) {
        return ELEMENT_PLACEHOLDER
      }
      if (FUNCTIONALITY_MARKERS.any { t.contains(it) }) return FUNCTIONALITY
      return null
    }

    private val STANDARD_MARKERS =
        listOf(
            "standardkonfiguration",
            "standard configuration",
            "standard-configuration",
            "standard config",
            "standardkonfig",
            "config preset",
            "konfigurationsvorgabe")

    private val FUNCTIONALITY_MARKERS =
        listOf(
            "funktionalität",
            "funktionalitaet",
            "funktionalitat",
            "functionalität",
            "functionality",
            "funktion",
            "function that",
            "funktional ")

    /** "EP" as a STANDALONE token (never inside another word). */
    private val EP_MARKER = Regex("(^|[^a-z0-9])ep($|[^a-z0-9])")

    private val PLACEHOLDER_MARKERS =
        listOf(
            "elementplaceholder",
            "element placeholder",
            "element-platzhalter",
            "element platzhalter",
            "platzhalter",
            "placeholder")
  }
}

/**
 * Reads and writes the **local API-doc storage** (`codbi_local_apidoc`) directly, so the assistant
 * can offer a reviewable draft of a local CodBi element and commit it deterministically — without
 * going through the designer UI and without duplicating the manager's data model.
 *
 * Two rows are involved:
 * - `data_key = "documentation"` — the documentation JSON holding every local element entry,
 * - `data_key = "<detail>_<name>"` — the element's JavaScript (see [LocalElementKind.detail]).
 *
 * The documentation JSON is *merged*, never replaced: everything this class does not touch stays
 * byte-identical, so a definition created by the AI cannot destroy hand-edited documentation.
 *
 * @see
 *   com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc.StructuredDataStoreAction
 * @see LocalApiDocPrompts
 */
internal object LocalElementStore {

  private val logger = LoggerFactory.getLogger(LocalElementStore::class.java)
  private val gson = GsonBuilder().create()

  /** The `codbi_local_apidoc` data key holding the documentation JSON. */
  const val DOCUMENTATION_KEY = "documentation"

  /** Loads and parses the documentation JSON, or `null` when absent / unparsable. */
  fun loadDocumentation(em: EntityManager): JsonObject? {
    val raw = readKey(em, DOCUMENTATION_KEY)?.takeIf { it.isNotBlank() } ?: return null
    return try {
      val parsed = JsonParser.parseString(raw)
      if (parsed.isJsonObject) parsed.asJsonObject else null
    } catch (e: Exception) {
      logger.warn("[LocalElementStore] Documentation JSON is not parsable: {}", e.message)
      null
    }
  }

  /**
   * Every **already defined local** element, keyed by its lowercased name. Used to refuse a
   * duplicate definition (the runtime would silently discard a second registration) and to tell the
   * AI which names are taken.
   */
  fun existingNames(em: EntityManager): Map<String, LocalElementKind> {
    val documentation = loadDocumentation(em) ?: return emptyMap()
    val result = LinkedHashMap<String, LocalElementKind>()
    for (kind in LocalElementKind.values()) {
      val section =
          documentation.get(kind.section)?.takeIf { it.isJsonObject }?.asJsonObject ?: continue
      for (name in section.keySet()) {
        result.putIfAbsent(name.trim().lowercase(), kind)
      }
    }
    return result
  }

  /**
   * One compact line per existing local element — `- <name> (<kind>): <short description>` — read
   * from ONE load of the documentation JSON.
   *
   * This is what lets the MODEL decide which element a request refers to when the request names it
   * by MEANING ("the calc functionality", "den Taschenrechner", "das Adressfeld") instead of by its
   * id: without the descriptions, only a literal name match could ever find an element, so anything
   * phrased differently silently became a NEW element.
   *
   * @param limit Upper bound of entries (tokens stay predictable).
   */
  fun catalogue(em: EntityManager, limit: Int = 120): List<String> {
    val documentation = loadDocumentation(em) ?: return emptyList()
    val out = ArrayList<String>(minOf(limit, 32))
    for (kind in LocalElementKind.values()) {
      val section =
          documentation.get(kind.section)?.takeIf { it.isJsonObject }?.asJsonObject ?: continue
      for ((name, value) in section.entrySet()) {
        if (out.size >= limit) return out
        val entry = value.takeIf { it.isJsonObject }?.asJsonObject ?: continue
        out.add("- " + name + " (" + kind.draftValue + "): " + summaryLine(entry))
      }
    }
    return out
  }

  /**
   * The manager's per-language `Summary` (en → de → it), else its `Description`, as ONE plain line
   * of at most 160 characters (markup stripped — the descriptions are stored as HTML).
   */
  private fun summaryLine(entry: JsonObject): String {
    val summary = entry.get("Summary")
    val text =
        when {
          summary == null || summary.isJsonNull -> ""
          summary.isJsonPrimitive -> summary.asString
          summary.isJsonObject -> {
            val obj = summary.asJsonObject
            listOf("en", "de", "it")
                .mapNotNull { key -> obj.get(key)?.takeIf { it.isJsonPrimitive }?.asString }
                .firstOrNull { it.isNotBlank() }
                .orEmpty()
          }
          else -> ""
        }
    val plain =
        text.ifBlank { entry.get("Description")?.takeIf { it.isJsonPrimitive }?.asString.orEmpty() }
    return plain.replace(Regex("<[^>]+>"), " ").replace(Regex("\\s+"), " ").trim().take(160)
  }

  /** Loads the stored documentation entry of one element, or `null` when it does not exist. */
  fun loadEntry(em: EntityManager, kind: LocalElementKind, name: String): JsonObject? {
    val documentation = loadDocumentation(em) ?: return null
    val section =
        documentation.get(kind.section)?.takeIf { it.isJsonObject }?.asJsonObject ?: return null
    val entry = section.get(name.trim().lowercase()) ?: return null
    return entry.takeIf { it.isJsonObject }?.asJsonObject
  }

  /** Loads the stored JavaScript of one element, or `null` when none is stored. */
  fun loadCode(em: EntityManager, kind: LocalElementKind, name: String): String? =
      readKey(em, codeKey(kind, name))?.takeIf { it.isNotBlank() }

  /**
   * The `codbi_local_apidoc` key holding the code of one element (mirrors the manager's scheme).
   */
  fun codeKey(kind: LocalElementKind, name: String): String =
      "${kind.detail}_${name.trim().lowercase()}"

  /**
   * Merges one element into the documentation JSON and stores its code — in ONE transaction, so a
   * failure never leaves an entry without its code (or vice versa).
   *
   * @return **TRUE** on success.
   */
  fun save(
      em: EntityManager,
      kind: LocalElementKind,
      name: String,
      entry: JsonObject,
      code: String?
  ): Boolean {
    val key = name.trim().lowercase()
    if (key.isBlank()) return false
    return try {
      em.transaction.begin()
      val documentation =
          readKey(em, DOCUMENTATION_KEY)
              ?.takeIf { it.isNotBlank() }
              ?.let { raw -> runCatching { JsonParser.parseString(raw).asJsonObject }.getOrNull() }
              ?: JsonObject()
      // Every section must exist as an object — the manager and the prompt assembly both rely on
      // it.
      for (section in listOf("detFunctionalities", "detElementplaceholder", "detStandards")) {
        if (documentation.get(section)?.isJsonObject != true)
            documentation.add(section, JsonObject())
      }
      val section = documentation.getAsJsonObject(kind.section)
      section.add(key, entry)
      // The `.js` file listing drives the designer's element pickers (and therefore the AI's name
      // index) — an entry without a listing entry is never offered anywhere.
      appendToFileList(documentation, kind.fileListKey, "$name.js".replace(" ", ""))
      upsertKey(em, DOCUMENTATION_KEY, gson.toJson(documentation))
      if (!code.isNullOrBlank()) upsertKey(em, codeKey(kind, name), code)
      em.transaction.commit()
      true
    } catch (e: Exception) {
      if (em.transaction.isActive) runCatching { em.transaction.rollback() }
      logger.warn("[LocalElementStore] Failed to save local element '{}': {}", name, e.message)
      false
    }
  }

  // region Low level storage

  private fun readKey(em: EntityManager, key: String): String? =
      try {
        em.createQuery(
                "SELECT e.content FROM CodbiLocalApidoc e WHERE e.dataKey = :key",
                String::class.java)
            .setParameter("key", key)
            .resultList
            .firstOrNull()
      } catch (e: Exception) {
        logger.warn("[LocalElementStore] Failed to read '{}': {}", key, e.message)
        null
      }

  private fun upsertKey(em: EntityManager, key: String, content: String) {
    val existing =
        em.createQuery(
                "SELECT e FROM CodbiLocalApidoc e WHERE e.dataKey = :key",
                CodbiLocalApidoc::class.java)
            .setParameter("key", key)
            .resultList
            .firstOrNull()
    if (existing == null) {
      em.persist(CodbiLocalApidoc(dataKey = key, content = content))
    } else {
      existing.content = content
      existing.updatedAt = java.sql.Timestamp(System.currentTimeMillis())
    }
  }

  /**
   * Adds [fileName] to the (JSON-array-as-string, legacy CSV tolerated) listing stored under [key].
   * Nothing is added when the file name is already listed.
   */
  private fun appendToFileList(documentation: JsonObject, key: String, fileName: String) {
    val list = parseFileList(documentation.get(key)?.takeIf { it.isJsonPrimitive }?.asString)
    if (list.none { it.equals(fileName, ignoreCase = true) }) list.add(fileName)
    documentation.addProperty(key, gson.toJson(list))
  }

  /**
   * Parses a file listing that the manager may store as a JSON array *string*, as a JSON string
   * holding such an array (legacy double encoding) or as a plain CSV.
   */
  private fun parseFileList(raw: String?): MutableList<String> {
    val out = mutableListOf<String>()
    val text = raw?.trim().orEmpty()
    if (text.isEmpty()) return out
    try {
      val parsed: JsonElement = JsonParser.parseString(text)
      if (parsed.isJsonArray) {
        parsed.asJsonArray.forEach { el -> if (el.isJsonPrimitive) out.add(el.asString) }
        return out.distinctBy { it.lowercase() }.toMutableList()
      }
      if (parsed.isJsonPrimitive) {
        // A JSON string holding the real listing ("[\"a.js\"]" or "a.js,b.js").
        val inner = parsed.asString.trim()
        if (inner != text) return parseFileList(inner)
      }
    } catch (_: Exception) {
      // Not JSON → CSV below.
    }
    return text
        .split(",")
        .map { it.trim().trim('"').trim('\'') }
        .filter { it.isNotEmpty() }
        .distinctBy { it.lowercase() }
        .toMutableList()
  }

  // endregion
}

/**
 * Parsing, validation and prompt building for **AI-drafted local CodBi elements**.
 *
 * The AI is a *drafting* device only: this object turns its answer into the exact documentation
 * entry the Local API-Doc manager would have written, and refuses anything that could break the
 * runtime (duplicate name, missing registration call, forbidden constructs, missing prompts). The
 * commit is a deterministic, inference-free write — see
 * [`AICodBiAssistant.handleLocalElementCommit()`].
 */
internal object LocalElementDrafts {

  /**
   * The assistant INTENT (and the `intent` value of the change-log rows) for defining a local CodBi
   * element. Exactly 19 characters — the change-log column is `VARCHAR(20)`.
   */
  const val INTENT = "codbi-local-element"

  /** The prompt key of the AI output contract ([`codbi-local-element-contract.md`]). */
  const val PROMPT_KEY = "codbi.local_element_contract"

  /** The file name of that contract (read raw when the stored prompt is incomplete). */
  const val PROMPT_FILE = "codbi-local-element-contract.md"

  /**
   * Marker every COMPLETE contract contains (the OUTPUT envelope key). A stored prompt without it
   * was truncated to the sections' intro — the reason a live model answered in its own key spelling
   * — and must be replaced by the bundled resource.
   */
  private const val CONTRACT_MARKER = "codbi_element_draft"

  /** Whether [text] is the complete contract (not just its introduction). */
  fun isCompleteContract(text: String?): Boolean = text != null && text.contains(CONTRACT_MARKER)

  private val logger = LoggerFactory.getLogger(LocalElementDrafts::class.java)

  /** Dotted technical name: at least two segments, letters/digits/underscore only. */
  private val NAME_PATTERN = Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$")

  /** Upper bounds that keep a generated definition sane (and the DB row small). */
  private const val MAX_CODE_LENGTH = 200_000
  private const val MAX_TEXT_LENGTH = 20_000
  private const val MAX_NAME_LENGTH = 120

  /** Constructs that are never acceptable in a generated CodBi element's JavaScript. */
  private val FORBIDDEN_CODE = listOf("eval(", "document.write", "<script", "localStorage.clear")

  /**
   * Dynamic code evaluation WITHOUT the `eval` keyword: `Function('return ' + expr)()` is exactly
   * `new Function(…)` — i.e. eval — and must be refused just like `eval(`.
   *
   * Matched with a WORD BOUNDARY, never as a substring: `initFunction(` / `myFunction(` are
   * perfectly legitimate names and must not be flagged.
   */
  private val DYNAMIC_CODE = Regex("\\bFunction\\s*\\(")

  /**
   * A use of `element`/`elem` that is NOT a property access (`foo.element`) — the identifier a
   * model reaches for although the registration callback only provides `toLoad` and `toProcess`.
   *
   * This is the source of the runtime error `CodBiError: … functionality "x" … ReferenceError:
   * element is not defined`: the definition is registered, the functionality runs, and the very
   * first statement throws because there is no global `element` in the callback's scope.
   */
  private val ELEMENT_ALIAS_USE = Regex("(?<![\\w$.])(element|elem)\\b")

  /**
   * `const element = …`, `function elem()`, `class element` — a real declaration, never an error.
   */
  private val ELEMENT_DECLARED = Regex("\\b(const|let|var|function|class)\\s+(element|elem)\\b")

  /** `function build(element)` — the alias is a declared parameter. */
  private val ELEMENT_FUNCTION_PARAM =
      Regex("\\bfunction\\b[^;{}]*\\([^)]*\\b(element|elem)\\b[^)]*\\)")

  /** `(toLoad, element) => …` — the alias is a declared arrow parameter. */
  private val ELEMENT_ARROW_PARAM = Regex("\\([^)]*\\b(element|elem)\\b[^)]*\\)\\s*=>")

  /**
   * The alias used AS A VALUE (`element.foo`, `element['foo']`) — the only shape
   * [repairElementReference] rewrites. An object key (`{ element: … }`) or a declaration is left
   * alone.
   */
  private val ELEMENT_ALIAS_VALUE_USE = Regex("(?<![\\w$.])(element|elem)\\b(?=\\s*[.\\[])")

  /** The two names the registration callback provides. */
  private val REGISTRATION_SCOPE = Regex("\\b(toProcess|toLoad)\\b")

  /**
   * Parameter lists of arrow functions and `function` declarations. Removed before looking for a
   * USE of `toProcess`/`toLoad`, because the wrapper ([ensureRegistrationCall]) and the contract
   * both DECLARE them — a declaration is not a use, and a code that only declares them does
   * nothing.
   */
  private val PARAMETER_LISTS = Regex("\\([^()]*\\)\\s*=>|\\bfunction\\b[^(){};]*\\([^()]*\\)")

  /**
   * Extracts the draft envelope from the AI's answer. Accepts the envelope itself or one nested
   * under `draft` / `codbiElement` (models sometimes wrap their JSON), and `null` when nothing
   * usable is found.
   */
  fun extractDraft(raw: String?): JsonObject? {
    if (raw.isNullOrBlank()) return null
    val parsed =
        runCatching { JsonParser.parseString(raw) }.getOrNull()
            // ONE malformation live models keep producing: a stray quote AFTER a value, e.g.
            // `"options":[]"`. It made the whole answer unparsable, so a COMPLETE draft was
            // silently
            // dropped and the run ended with the misleading "The draft has no Name." (reported).
            // The
            // repair only removes such a quote, so nothing else about the answer changes.
            ?: runCatching { JsonParser.parseString(repairStrayQuote(raw)) }.getOrNull()
            ?: return null
    if (!parsed.isJsonObject) return null
    val root = parsed.asJsonObject
    for (key in listOf("draft", "codbiElement", "localElement")) {
      val nested = root.get(key)
      if (nested != null && nested.isJsonObject) return canonicalize(nested.asJsonObject)
    }
    return canonicalize(root)
  }

  /**
   * Removes a quote that directly follows a closing bracket or a number (`[]"`, `}"`, `0"`)
   * followed by a separator — the malformation that made valid-looking drafts unparsable.
   * Everything else is left untouched, and a still-invalid answer is reported as "not valid JSON"
   * by the caller's repair round.
   */
  private fun repairStrayQuote(raw: String): String =
      raw.replace(Regex("([\\]}0-9])\"(?=\\s*[,}\\]])"), "$1")
          .replace(Regex("([\\]}0-9])\"(?=\\s*$)"), "$1")

  /**
   * Canonical key names a model may use for the same information, mapped onto the contract keys.
   *
   * Live runs show the same model answering `{ name, kind, description, parameters, script }` or `{
   * …, attributes: { "data-cb-func": … } }` instead of the documented envelope — the information is
   * all there, only the spelling differs, and rejecting it wasted an entire run. Everything
   * downstream (validation, the documentation entry, the repair prompt, the review dialog, the
   * commit) therefore sees ONE shape.
   */
  private val KEY_ALIASES: Map<String, List<String>> =
      linkedMapOf(
          "Name" to listOf("name", "element", "technicalName", "technical_name", "id"),
          "Description" to listOf("description", "doc", "documentation", "details"),
          "Summary" to listOf("summary", "shortDescription", "short_description", "short"),
          "CondensedPrompt" to
              listOf("condensedPrompt", "condensed_prompt", "shortPrompt", "compactPrompt"),
          "DetailedPrompt" to listOf("detailedPrompt", "detailed_prompt", "longPrompt", "prompt"),
          "Parameter" to listOf("parameters", "params", "arguments"),
          "supportedFormelementtypes" to
              listOf(
                  "supportedFormElementTypes",
                  "formelementtypes",
                  "formElementTypes",
                  "supportedElements",
                  "appliesTo",
                  "applicableTo"),
          "Code" to listOf("code", "script", "source", "js", "javascript", "snippet"),
          "Usage" to listOf("usage", "attributes", "wiring", "formWiring"),
          "Signature" to listOf("signature"),
          "classes" to listOf("Classes", "cssClasses", "cssclasses"),
          "globals" to listOf("Globals", "globalVariables"),
          "Active" to listOf("active"),
          "Notes" to listOf("notes"))

  /**
   * Rewrites a parsed draft so every canonical key is present (see [KEY_ALIASES]).
   *
   * Unknown members are kept untouched, the canonical spelling always wins over an alias, and a
   * `Usage` taken from a `data-cb-*` attribute map keeps only its primitive values (a parameter
   * description object is not a wiring value). Idempotent, so it is safe on an already canonical
   * draft or on the payload of `CommitLocalElement`.
   */
  fun canonicalize(draft: JsonObject): JsonObject {
    val out = JsonObject()
    for ((key, value) in draft.entrySet()) out.add(key, value)
    for ((canonical, aliases) in KEY_ALIASES) {
      if (out.get(canonical)?.isJsonNull == false) continue
      val found =
          aliases.firstNotNullOfOrNull { alias -> draft.get(alias)?.takeIf { !it.isJsonNull } }
      if (found != null) out.add(canonical, found)
    }
    // `attributes: { "data-cb-func": …, "data-cb-layout": { … } }` → `Usage` with primitives only.
    val usage = out.get("Usage")
    if (usage != null && usage.isJsonObject && draft.has("attributes")) {
      val clean = JsonObject()
      for ((key, value) in usage.asJsonObject.entrySet()) {
        if (value.isJsonPrimitive) clean.add(key, value)
      }
      out.add("Usage", clean)
    }
    return out
  }

  /** The `kind` of a draft, or `null` when it is missing/unknown. */
  fun kindOf(draft: JsonObject): LocalElementKind? =
      LocalElementKind.fromDraft(optionString(draft, "kind"))

  /** The declared element name of a draft (trimmed, or empty). */
  fun nameOf(draft: JsonObject): String = optionString(draft, "Name")?.trim().orEmpty()

  /**
   * Whether the draft carries a **usable** technical name (a dotted id). This is the single piece
   * of information the user has to supply — everything else is generated — so it decides whether
   * the assistant asks a clarification question instead of aborting.
   */
  fun isUsableName(draft: JsonObject): Boolean {
    val name = nameOf(draft)
    return name.isNotEmpty() && name.length <= MAX_NAME_LENGTH && NAME_PATTERN.matches(name)
  }

  /**
   * The segments a model likes to slip into a name it was given, because they describe the KIND of
   * element rather than the element itself ("Mein.Wetter" → "Mein.EP.Wetter"). Only used to
   * RECOGNISE such an insertion; the returned name is always the user's own answer.
   */
  private val KIND_MARKERS =
      setOf(
          "ep",
          "epl",
          "epc",
          "func",
          "fn",
          "function",
          "functionality",
          "funktion",
          "funktionalitaet",
          "funktionalitat",
          "config",
          "configuration",
          "konfiguration",
          "konfig",
          "standard",
          "standardconfig",
          "standardconfiguration",
          "standardkonfiguration",
          "placeholder",
          "platzhalter")

  /**
   * Detects a draft name that only RE-SPELLS the name the user answered by inserting (or dropping)
   * a kind segment and returns the user's answer instead. Reported: the assistant asked for the
   * name, the user answered `Mein.Wetter`, and the committed element was called `Mein.EP.Wetter`.
   *
   * The comparison is purely mechanical — the sequence of the remaining segments must be EQUAL — so
   * it can never select a different element: any other difference leaves [draftName] untouched.
   *
   * @return The name to use instead, or `null` when [draftName] is not such a variant.
   */
  fun answeredNameOverride(draftName: String, answeredName: String): String? {
    val draft = draftName.trim()
    val answer = answeredName.trim()
    if (draft.isEmpty() || answer.isEmpty()) return null
    if (draft.equals(answer, ignoreCase = true)) return null
    val draftSegments = draft.split('.').filter { it.isNotBlank() }
    val answerSegments = answer.split('.').filter { it.isNotBlank() }
    if (draftSegments.size < 2 || answerSegments.size < 2) return null
    // The answer recoverable by REMOVING kind markers from the draft ("Mein.EP.Wetter" →
    // "Mein.Wetter")
    val strippedDraft = draftSegments.filterNot { it.lowercase() in KIND_MARKERS }
    if (strippedDraft.size == answerSegments.size &&
        strippedDraft.zip(answerSegments).all { (a, b) -> a.equals(b, ignoreCase = true) }) {
      return answer
    }
    // … or by INSERTING one the user had written but the model dropped.
    val strippedAnswer = answerSegments.filterNot { it.lowercase() in KIND_MARKERS }
    if (strippedAnswer.size == draftSegments.size &&
        strippedAnswer.zip(draftSegments).all { (a, b) -> a.equals(b, ignoreCase = true) }) {
      return answer
    }
    return null
  }

  /** The generated JavaScript of a draft (empty string when the draft carries none). */
  fun codeOf(draft: JsonObject): String = optionString(draft, "Code")?.trim().orEmpty()

  /**
   * Validates a draft against the runtime's rules.
   *
   * @param draft The parsed draft envelope.
   * @param kind The declared kind.
   * @param existingNames Lowercased names of the already defined LOCAL elements.
   * @param allowOverwrite Whether an existing element of the same kind may be replaced (the
   *   caller's confirmed `overwrite` flag).
   * @return The list of problems; **empty** means the draft may be committed.
   */
  fun validate(
      draft: JsonObject,
      kind: LocalElementKind,
      existingNames: Map<String, LocalElementKind>,
      allowOverwrite: Boolean
  ): List<String> {
    val problems = mutableListOf<String>()
    val name = nameOf(draft)
    val code = codeOf(draft)

    if (name.isEmpty()) {
      problems.add("The draft has no Name.")
    } else {
      if (name.length > MAX_NAME_LENGTH)
          problems.add("The Name is longer than $MAX_NAME_LENGTH characters.")
      if (!NAME_PATTERN.matches(name)) {
        problems.add(
            "The Name '$name' is not a dotted technical id (letters, digits and '.' only, at least two segments, e.g. 'Mein.Rechner').")
      }
      val existingKind = existingNames[name.lowercase()]
      if (existingKind != null && !allowOverwrite) {
        problems.add(
            "A local $existingKind named '$name' already exists — confirm the overwrite to replace it.")
      }
      if (existingKind != null && existingKind != kind && !allowOverwrite) {
        problems.add(
            "'$name' is already defined as a ${existingKind.draftValue}, not as a ${kind.draftValue}.")
      }
    }

    if (optionString(draft, "Description")?.isBlank() != false)
        problems.add("The Description is missing.")
    problems.addAll(summaryProblems(draft))
    // A standard configuration's GLOBAL VARIABLES are read by editors and by later AI runs, so an
    // empty
    // description makes them opaque (reported: the generated global `NINA` had "" as its
    // description).
    // One sentence per global: what it holds and which configuration uses it.
    if (kind == LocalElementKind.STANDARD) {
      draft
          .get("globals")
          ?.takeIf { it.isJsonObject }
          ?.asJsonObject
          ?.entrySet()
          ?.forEach { entry ->
            val value = entry.value
            val text =
                when {
                  value.isJsonPrimitive -> value.asString
                  value.isJsonObject -> optionString(value.asJsonObject, "description").orEmpty()
                  else -> ""
                }.trim()
            if (text.isBlank()) {
              problems.add(
                  "The global variable '${entry.key}' has no description — say in ONE sentence what it holds " +
                      "and which standard configuration uses it.")
            }
          }
    }

    // A configuration that PROVIDES classes is applied by the per-element standard-configuration
    // listing through exactly those classes, so its `targets` selector must reference one of them.
    // Reported: the class `CodBi_GOOSE_Input` was defined, but the code targeted `.Mein_GOOSE`,
    // which
    // nothing ever sets — the configuration could never fire.
    if (kind == LocalElementKind.STANDARD) {
      val providedClasses =
          draft.get("classes")?.takeIf { it.isJsonObject }?.asJsonObject?.keySet().orEmpty()
      val code = codeOf(draft)
      if (providedClasses.isNotEmpty() && code.isNotBlank()) {
        val targets =
            Regex("targets\\s*:\\s*['\"`]([^'\"`]*)['\"`]")
                .find(code)
                ?.groupValues
                ?.getOrNull(1)
                .orEmpty()
                .trim()
        if (targets.isNotEmpty() &&
            providedClasses.none { targets.contains(it, ignoreCase = true) }) {
          problems.add(
              "The `targets` selector '$targets' does not use any of the classes this configuration " +
                  "provides (${providedClasses.joinToString(", ")}) — the per-element listing applies " +
                  "THOSE classes, so the configuration would never match.")
        }
      }
    }

    if (kind.requiresPrompts) {
      if (optionString(draft, "CondensedPrompt")?.isBlank() != false) {
        problems.add(
            "The CondensedPrompt is missing — without it later form runs cannot use the element.")
      }
      if (optionString(draft, "DetailedPrompt")?.isBlank() != false) {
        problems.add(
            "The DetailedPrompt is missing — without it later form runs cannot use the element.")
      }
    }
    for (key in listOf("Description", "Summary", "CondensedPrompt", "DetailedPrompt", "Notes")) {
      val value = optionString(draft, key)
      if (value != null && value.length > MAX_TEXT_LENGTH) {
        problems.add("$key is longer than $MAX_TEXT_LENGTH characters.")
      }
    }

    if (kind != LocalElementKind.STANDARD) {
      if (code.isEmpty()) {
        problems.add("The Code is missing — a ${kind.draftValue} needs its JavaScript.")
      } else {
        if (code.length > MAX_CODE_LENGTH)
            problems.add("The Code is longer than $MAX_CODE_LENGTH characters.")
        for (bad in FORBIDDEN_CODE) {
          if (code.contains(bad, ignoreCase = true))
              problems.add("The Code must not contain '$bad'.")
        }
        val registrations = countRegistrations(code, kind, name)
        if (registrations == 0) {
          problems.add(
              "The Code does not call window.codbi.${kind.registerCall}('<name>', …) with the declared Name '$name'.")
        } else if (registrations > 1) {
          problems.add(
              "The Code contains more than one registration call — exactly one is allowed.")
        }
      }
      // The manager's applicability listing (and therefore the element panel) only offers a
      // functionality for the widget types it declares — an empty list means "applies to nothing",
      // which is what the user saw as "the form element types are not set".
      if (kind == LocalElementKind.FUNCTIONALITY &&
          stringList(draft.get("supportedFormelementtypes")).isEmpty()) {
        problems.add(
            "supportedFormelementtypes is missing — declare the FORMCYCLE form element types this " +
                "functionality applies to, e.g. [\"XFieldSet\",\"XContainer\"].")
      }
    } else if (code.isNotEmpty()) {
      for (bad in FORBIDDEN_CODE) {
        if (code.contains(bad, ignoreCase = true)) problems.add("The Code must not contain '$bad'.")
      }
    }
    // `Function(…)` (with or without `new`) is eval in disguise — the very construct a generated
    // calculator tends to reach for. Refused for every kind, in one place.
    if (code.isNotEmpty() && DYNAMIC_CODE.containsMatchIn(code)) {
      problems.add(
          "The Code must not evaluate code dynamically with Function(…) — that is eval in disguise; " +
              "evaluate explicitly instead.")
    }
    // A FUNCTIONALITY only ever receives `toLoad` (the RESOLVED PARAMETER OBJECT) and `toProcess`
    // (the
    // Element) — see `global-scope.ts`, which invokes `fn(codbiAttributes, currentElement)`.
    if (kind == LocalElementKind.FUNCTIONALITY && code.isNotEmpty()) {
      if (usesUndeclaredElement(code)) {
        // Throws `ReferenceError: element is not defined` the moment it runs — the reported live
        // error.
        problems.add(
            "The Code uses the undefined variable 'element' — inside the registration callback the " +
                "attached form element is 'toProcess' (the first argument is 'toLoad'). Use " +
                "'toProcess' instead.")
      } else if (!usesRegistrationScope(code)) {
        // The reported "functionality that does nothing": the code only DEFINES helpers (e.g.
        // `function insertCalculator(element, params)`) and never passes the attached element to
        // them,
        // so the registration succeeds and nothing is ever built.
        problems.add(
            "The Code never uses 'toProcess' (or 'toLoad') — a functionality that only DEFINES helpers " +
                "does nothing at runtime. CALL your code with the attached element, e.g. " +
                "insertCalculator(toProcess, toLoad).")
      }
      if (TO_LOAD_AS_ELEMENT.containsMatchIn(code)) {
        // `unfold the panel → nothing happens` (reported): `toLoad.getAttribute(…)` throws
        // `TypeError: toLoad.getAttribute is not a function`, because `toLoad` is the parameter
        // OBJECT.
        problems.add(
            "The Code uses 'toLoad' as a DOM element — 'toLoad' is the resolved PARAMETER OBJECT " +
                "(read `toLoad.layout`), the ELEMENT is 'toProcess' " +
                "(toProcess.getAttribute('data-cb-<param>'), toProcess.appendChild(…)).")
      } else {
        // Wrong-CASED parameter read (reported: `toLoad.extraValue` instead of
        // `toLoad.extravalue`).
        // The runtime lowercases EVERY `toLoad` property — the `data-cb-<param>` attribute name
        // with
        // the `data-cb-` prefix dropped AND the remainder lowered — so a property identifier
        // holding
        // an uppercase letter (that is not one of the DOM members above) always refers to a
        // property
        // that is `undefined`.
        val wrongCaseProp =
            TO_LOAD_PROP.findAll(code)
                .map { it.groupValues[1] }
                .firstOrNull { p -> p.any { it.isUpperCase() } && !TO_LOAD_DOM_MEMBERS.matches(p) }
        if (wrongCaseProp != null) {
          problems.add(
              "The Code reads 'toLoad.$wrongCaseProp' — every 'toLoad' parameter property is " +
                  "LOWERCASED at runtime (the 'data-cb-<param>' attribute name with the 'data-cb-' " +
                  "prefix dropped and lowercased), so that property is 'undefined'. Read " +
                  "'toLoad.${wrongCaseProp.lowercase()}' instead.")
        }
      }
      if (!usesProcessedElement(code)) {
        // A functionality that never touches its element cannot render anything — the user unfolds
        // the
        // form, the functionality runs, and nothing appears.
        problems.add(
            "The Code never uses 'toProcess' — the attached form element — so it cannot render " +
                "anything. Build the UI INTO it (toProcess.appendChild(…)) and END the callback with " +
                "that call.")
      }
      if (!hasBalancedBraces(code)) {
        // Reported: "the code is missing the button for the digits" — the answer was CUT OFF, so
        // the
        // trailing statements (the button loop / the append) never made it into the stored code.
        problems.add(
            "The Code is INCOMPLETE — its curly braces do not balance, so the JavaScript is cut off " +
                "(the answer was truncated). Return the COMPLETE code, including the button creation " +
                "AND the final toProcess.appendChild(…).")
      } else if (!endsAsAStatement(code)) {
        // A truncation can also stop INSIDE a statement while the braces still balance
        // (`… toProcess.appendChild(btn); btn.` ) — that shape was committed and broke the element.
        problems.add(
            "The Code ENDS in the middle of a statement (it stops at '…" +
                code.trimEnd().takeLast(24) +
                "') — it looks truncated. Return the COMPLETE code, ending with the final " +
                "toProcess.appendChild(…) followed by `);`.")
      }
      if (CREATES_ELEMENT.containsMatchIn(code) && !ATTACHES_ELEMENT.containsMatchIn(code)) {
        // The UI was built but never inserted — the form shows nothing (the reported "missing
        // buttons").
        problems.add(
            "The Code creates DOM elements but never attaches them, so nothing would appear. Append the " +
                "finished UI to 'toProcess' (toProcess.appendChild(wrapper)) or set " +
                "toProcess.innerHTML.")
      }
    }
    return problems
  }

  /**
   * Rewrites the **id inside the registration call** so it is exactly the declared [name].
   *
   * The registration id is the runtime key: `window.codbi.registerFunctionality('<id>', …)` and the
   * element's `Name` must be the SAME string, otherwise the definition can never activate. Models
   * frequently emit a variant (a slug, a differently cased or shortened id) — and a definition that
   * looks right in the review but registers the wrong key is useless. Instead of rejecting the
   * draft, the id is therefore NORMALISED in place, using the very same replacement the Local
   * API-Doc manager performs when an element is renamed (`RENAME CODE`, see
   * [com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc.StructuredDataStoreAction]).
   *
   * Only the FIRST argument of the call is touched; everything else (body, parameters, further
   * statements) stays byte-identical. A code that contains MORE than one registration call is left
   * alone — that is a real problem and is reported by [validate].
   */
  fun normalizeRegistration(code: String, name: String): String {
    val target = name.trim()
    if (code.isBlank() || target.isEmpty()) return code
    return code.replace(REGISTRATION_CALL) { match ->
      val call = match.groupValues[1]
      val quote = match.groupValues[2]
      "$call($quote$target$quote"
    }
  }

  /**
   * `<register|extend Functionality|EP>(<quote>…<quote>` — the call name plus its id argument.
   *
   * Deliberately PREFIX-AGNOSTIC: the contract asks for `window.codbi.registerFunctionality(…)`,
   * but generated code also arrives as `codbi.registerFunctionality(…)`, via a local alias (`const
   * cb = window.codbi; cb.registerFunctionality(…)`) or bare inside an IIFE. All of those register
   * the same runtime key, so all of them are normalised — the id is what must match, not the
   * spelling of the receiver.
   */
  private val REGISTRATION_CALL =
      Regex(
          "\\b(registerFunctionality|extendFunctionality|registerEP|extendEP)\\s*\\(\\s*([\"'`])(?:(?!\\2).)*\\2")

  /**
   * Completes code that arrived WITHOUT any registration call by wrapping its body in the kind's
   * registration call.
   *
   * A definition that never registers its id is dead code, and "the registration call is missing"
   * is the one defect the server can repair without knowing anything about the generated logic —
   * the wrapper only adds the envelope the runtime expects. Only FUNCTIONALITIES are wrapped: their
   * body is a side effect on `toProcess`, so wrapping keeps the intent. An element placeholder must
   * RETURN a value, which a wrapper cannot invent — it stays a problem for the repair round.
   */
  fun ensureRegistrationCall(kind: LocalElementKind, name: String, code: String): String {
    val target = name.trim()
    if (kind != LocalElementKind.FUNCTIONALITY || target.isEmpty() || code.isBlank()) return code
    if (REGISTRATION_CALL.containsMatchIn(code)) return code
    return "window.codbi.registerFunctionality(\"$target\", (toLoad, toProcess) => {\n$code\n});"
  }

  /**
   * The ONE preparation step every code path must run: normalise the registration id to [name] and,
   * when the body contains no registration call at all, wrap it (functionalities only).
   *
   * Used by the drafting pass, by its repair round and by the commit, so a stored definition can
   * never miss the runtime envelope while the drafting pass produced a repaired one.
   */
  fun prepareCode(kind: LocalElementKind, name: String, code: String): String =
      ensureRegistrationCall(
          kind, name, normalizeRegistration(repairElementReference(kind, code), name))

  /**
   * Replaces an **undeclared `element`/`elem` reference** with `toProcess` — the attached form
   * element the registration callback actually receives.
   *
   * This is the one mechanical repair for the reported runtime error `CodBiError: … functionality
   * "mein.rechner" … ReferenceError: element is not defined`: models habitually write
   * `element.appendChild(…)` although the callback's scope only provides `toLoad` and `toProcess` —
   * and a second, corrected answer is not guaranteed (a live run repeated the very same code in the
   * repair round, leaving the user with nothing). Rewriting the identifier is exactly what the
   * generated code meant, so the draft becomes committable and the element works; the review dialog
   * reports the adjustment.
   *
   * Only VALUE uses are rewritten (`element.` / `element[`), never an object key (`{ element: …
   * }`); a declared local (`const element = …`) is left completely alone, and element placeholders
   * / standards are untouched because they never receive an element.
   */
  fun repairElementReference(kind: LocalElementKind, code: String): String {
    if (kind != LocalElementKind.FUNCTIONALITY || code.isBlank()) return code
    if (!usesUndeclaredElement(code)) return code
    return code.replace(ELEMENT_ALIAS_VALUE_USE) { "toProcess" }
  }

  /** Diagnostic: how many registration calls carry the declared [name]. */
  fun registrationCount(code: String, kind: LocalElementKind, name: String): Int =
      countRegistrations(code, kind, name)

  /**
   * Removes comments (line comments and block comments) and the contents of string and template
   * literals, replacing each non-newline character with a SPACE so positions and line structure are
   * kept.
   *
   * The `element`/`elem` use/declaration checks must only ever see REAL code: an `element` inside a
   * comment or a string is not a variable reference at all, so it must neither be flagged as an
   * undeclared use nor count as a declaration. Without this, a generated calculator that correctly
   * uses `toProcess`/`document.createElement` but mentions "element" in an explanatory comment (or
   * a string) is falsely rejected for "using the undefined variable 'element'".
   */
  private fun stripCommentsAndStrings(code: String): String {
    val chars = code.toCharArray()
    var i = 0
    while (i < code.length) {
      val c = code[i]
      when {
        c == '\'' || c == '"' || c == '`' -> {
          val quote = c
          chars[i] = ' '
          i += 1
          while (i < code.length) {
            val d = code[i]
            if (d == '\\') {
              chars[i] = ' '
              if (i + 1 < code.length) {
                chars[i + 1] = ' '
                i += 2
              } else {
                i += 1
              }
              continue
            }
            if (d != '\n') chars[i] = ' '
            i += 1
            if (d == quote) break
            if (d == '\n' && quote != '`') break
          }
        }
        c == '/' && code.getOrNull(i + 1) == '/' -> {
          chars[i] = ' '
          chars[i + 1] = ' '
          i += 2
          while (i < code.length && code[i] != '\n') {
            chars[i] = ' '
            i += 1
          }
        }
        c == '/' && code.getOrNull(i + 1) == '*' -> {
          chars[i] = ' '
          chars[i + 1] = ' '
          i += 2
          while (i < code.length) {
            if (code[i] == '*' && code.getOrNull(i + 1) == '/') {
              chars[i] = ' '
              chars[i + 1] = ' '
              i += 2
              break
            }
            if (code[i] != '\n') chars[i] = ' '
            i += 1
          }
        }
        else -> i += 1
      }
    }
    return String(chars)
  }

  /**
   * Whether the code USES `element`/`elem` without declaring it anywhere.
   *
   * The registration callback's scope only provides `toLoad` and `toProcess`, so such a reference
   * is guaranteed to throw `ReferenceError: element is not defined` at runtime. A code that
   * declares its own `element`/`elem` (a `const`, a `function` parameter or an arrow parameter) is
   * untouched — only the undeclared case is reported.
   *
   * Comments and string/template literals are stripped before the checks: an `element` inside them
   * is not a variable reference (see [stripCommentsAndStrings]).
   */
  fun usesUndeclaredElement(code: String): Boolean {
    if (code.isBlank()) return false
    val body = stripCommentsAndStrings(code)
    if (!ELEMENT_ALIAS_USE.containsMatchIn(body)) return false
    if (ELEMENT_DECLARED.containsMatchIn(body)) return false
    if (ELEMENT_FUNCTION_PARAM.containsMatchIn(body)) return false
    if (ELEMENT_ARROW_PARAM.containsMatchIn(body)) return false
    return true
  }

  /**
   * Whether the code actually USES the registration scope — `toProcess` (the attached form element)
   * or `toLoad` (its resolved parameters) — instead of only DECLARING them in a parameter list.
   *
   * A functionality whose body merely defines a helper (`function insertCalculator(element,
   * params)`) registers fine but never builds anything, which is indistinguishable from "does
   * nothing" for the user — the reported follow-up. Parameter lists are therefore stripped before
   * the check, because both the wrapper ([ensureRegistrationCall]) and the contract declare those
   * two names.
   */
  fun usesRegistrationScope(code: String): Boolean {
    if (code.isBlank()) return false
    val body = code.replace(PARAMETER_LISTS) { "" }
    return REGISTRATION_SCOPE.containsMatchIn(body)
  }

  /**
   * Whether the code uses `toProcess` — the attached form ELEMENT — as a value (not only as a
   * parameter name). A functionality that never touches it cannot render anything: the run succeeds
   * and the form shows nothing (the reported "unfolding the panel does not show a calculator").
   */
  fun usesProcessedElement(code: String): Boolean {
    if (code.isBlank()) return false
    val body = code.replace(PARAMETER_LISTS) { "" }
    return Regex("\\btoProcess\\b").containsMatchIn(body)
  }

  /** A code that creates DOM elements … */
  private val CREATES_ELEMENT = Regex("\\bdocument\\s*\\.\\s*createElement\\b")

  /**
   * … must attach them somewhere, otherwise nothing can render. Only PARENT-inserting operations
   * count (`textContent`/`innerText` set the text of a node, they never insert it anywhere).
   */
  private val ATTACHES_ELEMENT =
      Regex(
          "\\b(appendChild|append|prepend|insertBefore|replaceChildren|insertAdjacentHTML|" +
              "insertAdjacentElement|replaceWith)\\s*\\(|\\binnerHTML\\s*=")

  /**
   * Whether the code ENDS like a complete script — a statement (`;`) or a block (`}`).
   *
   * A truncated answer typically stops mid-statement (`… toProcess.appendChild(btn); btn.`), which
   * the brace balance alone does not catch.
   */
  fun endsAsAStatement(code: String): Boolean {
    val trimmed = code.trimEnd()
    return trimmed.isNotEmpty() && (trimmed.endsWith(";") || trimmed.endsWith("}"))
  }

  /**
   * Whether the code's CURLY BRACES balance, ignoring strings, template literals and comments.
   *
   * An unbalanced code is a TRUNCATED answer: the trailing statements (e.g. the digit-button loop
   * or the final `toProcess.appendChild(…)`) were cut off, which is exactly the reported "the code
   * is missing the button for the digits". Only braces are counted — a regex literal may contain
   * parentheses, braces are far less likely.
   */
  fun hasBalancedBraces(code: String): Boolean {
    var depth = 0
    var i = 0
    while (i < code.length) {
      val c = code[i]
      when {
        c == '\'' || c == '"' || c == '`' -> {
          i += 1
          while (i < code.length) {
            val d = code[i]
            if (d == '\\') {
              i += 2
              continue
            }
            i += 1
            if (d == c) break
            if (d == '\n' && c != '`') break
          }
        }
        c == '/' && code.getOrNull(i + 1) == '/' -> {
          while (i < code.length && code[i] != '\n') i += 1
        }
        c == '/' && code.getOrNull(i + 1) == '*' -> {
          val end = code.indexOf("*/", i + 2)
          i = if (end < 0) code.length else end + 2
        }
        c == '{' -> {
          depth += 1
          i += 1
        }
        c == '}' -> {
          depth -= 1
          if (depth < 0) return false
          i += 1
        }
        else -> i += 1
      }
    }
    return depth == 0
  }

  /**
   * `toLoad` used as a DOM node. `toLoad` is the RESOLVED PARAMETER OBJECT (`toLoad.layout`), never
   * the element — `toLoad.getAttribute(…)` throws `TypeError: toLoad.getAttribute is not a
   * function`, which aborts the functionality before it appends anything.
   */
  private val TO_LOAD_AS_ELEMENT =
      Regex(
          "\\btoLoad\\s*\\.\\s*(getAttribute|setAttribute|hasAttribute|appendChild|append|prepend|" +
              "querySelector|querySelectorAll|classList|dataset|innerHTML|textContent|innerText|" +
              "addEventListener|insertBefore|remove|removeChild|closest|children)\\b")

  /**
   * Any `toLoad.<prop>` access. Group 1 holds the property identifier.
   *
   * Used to detect a WRONG-CASED parameter read: the runtime lowercases EVERY `toLoad` property
   * (the `data-cb-<param>` attribute name with the `data-cb-` prefix dropped AND the remainder
   * lowered), so `toLoad.extraValue`/`toLoad.Data` is `undefined` and must be written
   * `toLoad.extravalue` / `toLoad.data`.
   */
  private val TO_LOAD_PROP = Regex("\\btoLoad\\s*\\.\\s*([A-Za-z_$][A-Za-z0-9_$]*)\\b")

  /**
   * The DOM members of `TO_LOAD_AS_ELEMENT`, tested as whole identifiers to exclude from casing.
   */
  private val TO_LOAD_DOM_MEMBERS =
      Regex(
          "(getAttribute|setAttribute|hasAttribute|appendChild|append|prepend|querySelector|" +
              "querySelectorAll|classList|dataset|innerHTML|textContent|innerText|addEventListener|" +
              "insertBefore|remove|removeChild|closest|children)")

  /**
   * Diagnostic summary of a generated code's registration calls — logged when validation rejects a
   * draft, so the actual call shape (receiver, quotes, id) is visible in the server log.
   */
  fun describeRegistration(code: String, kind: LocalElementKind, name: String): String {
    val calls =
        REGISTRATION_CALL.findAll(code).map { it.value.replace("\n", " ").take(120) }.toList()
    return "kind=${kind.draftValue} name='$name' calls=${calls.size} " +
        "matching=${countRegistrations(code, kind, name)} codeLen=${code.length} calls=$calls"
  }

  /**
   * Counts how often the code registers the declared [name] via the [kind]'s registration call. The
   * count is 0 when the name does not appear in the call (a copied example would otherwise register
   * the WRONG id and the element would never activate).
   */
  private fun countRegistrations(code: String, kind: LocalElementKind, name: String): Int {
    if (kind.registerCall.isEmpty() || name.isEmpty()) return 0
    val pattern =
        Regex(
            "\\b${Regex.escape(kind.registerCall)}\\s*\\(\\s*['\"`]${Regex.escape(name)}['\"`]",
            RegexOption.IGNORE_CASE)
    return pattern.findAll(code).count()
  }

  /**
   * Builds the documentation entry exactly as the Local API-Doc manager stores it (only the keys
   * that apply to [kind], with `local = true`).
   *
   * @param code The element's JavaScript. It is stored on the entry AS WELL as in the
   *   `"<detail>_<name>"` row, because the two are read by different consumers: the runtime loads
   *   the row (`X-Action: Code`), while the Local API-Doc manager renders its code editor from
   *   `det*[name].Code`. Without it a committed element appeared in the manager's tree with an
   *   EMPTY code editor (the reported "no code supplied for the generated functionality").
   */
  fun documentationEntry(kind: LocalElementKind, draft: JsonObject, code: String = ""): JsonObject {
    val entry = JsonObject()
    entry.addProperty("Description", optionString(draft, "Description").orEmpty())
    // The manager stores the short description PER LANGUAGE (`string | { en, de, it }`) and the
    // designer
    // resolves it with `localizedFunctionalitySummary` — a one-language string is why the German
    // and
    // Italian UI stayed empty.
    val summary = draft.get("Summary")
    if (summary != null && summary.isJsonObject) {
      entry.add("Summary", summary)
    } else {
      entry.addProperty("Summary", optionString(draft, "Summary").orEmpty())
    }
    if (kind.requiresPrompts) {
      entry.addProperty("CondensedPrompt", optionString(draft, "CondensedPrompt").orEmpty())
      entry.addProperty("DetailedPrompt", optionString(draft, "DetailedPrompt").orEmpty())
    }
    when (kind) {
      LocalElementKind.FUNCTIONALITY -> {
        // `Parameter` is the manager's `name → description` map; the typed metadata (`type`,
        // `options`,
        // `default`) is stored next to it as `parameters`, which is what the designer's parameter
        // editors render from. Without both, a declared parameter never reached the panel.
        entry.add("Parameter", parameterDescriptions(draft))
        parameterMetadata(draft)?.let { entry.add("parameters", it) }
        val supported = stringList(draft.get("supportedFormelementtypes"))
        if (supported.isNotEmpty()) {
          val array = JsonArray()
          supported.forEach { array.add(it) }
          entry.add("supportedFormelementtypes", array)
        }
      }
      LocalElementKind.ELEMENT_PLACEHOLDER -> {
        val descriptions = parameterDescriptions(draft)
        val typed = parameterMetadata(draft)
        entry.add("Parameter", descriptions)
        typed?.let { entry.add("parameters", it) }
        // An EP receives its arguments POSITIONALLY and the designer renders its input fields from
        // `detElementplaceholder[id].Signature`. The AI draft declares `Parameter` only, so the
        // signature is DERIVED here like the manager's `parametersToSignature()` does — without it
        // a
        // generated EP had two parameters in the API doc and not one input field in the panel.
        val signature =
            draft.get("Signature")?.takeIf { it.isJsonObject }
                ?: signatureFromMetadata(descriptions, typed)
        signature?.let { entry.add("Signature", it) }
      }
      LocalElementKind.STANDARD -> {
        entry.add(
            "Active",
            draft.get("Active")?.takeIf { it.isJsonPrimitive }
                ?: com.google.gson.JsonPrimitive(false))
        entry.add("classes", draft.get("classes")?.takeIf { it.isJsonObject } ?: JsonObject())
        entry.add("globals", draft.get("globals")?.takeIf { it.isJsonObject } ?: JsonObject())
      }
    }
    if (code.isNotBlank()) entry.addProperty("Code", code)
    entry.addProperty("local", true)
    return entry
  }

  /** The "how a form run wires it" object, returned to the review dialog (never stored). */
  fun usageOf(draft: JsonObject): JsonObject? =
      draft.get("Usage")?.takeIf { it.isJsonObject }?.asJsonObject

  /** A one-line human summary of a committed draft (used for the change-log row). */
  fun describe(kind: LocalElementKind, name: String, action: String): String =
      "Local ${kind.draftValue} '$name' $action"

  /** The languages the local API-doc manager offers for a short description. */
  private val SUMMARY_LANGUAGES = listOf("en", "de", "it")

  /**
   * Checks the `Summary`. The manager keeps it per language, so an English-only text left the
   * German and Italian designer UI empty — the reported gap. A plain string is therefore reported
   * as "not translated" instead of being silently stored for one language only.
   */
  private fun summaryProblems(draft: JsonObject): List<String> {
    val summary = draft.get("Summary")
    if (summary == null || summary.isJsonNull) {
      return listOf(
          "The Summary is missing — give it as {\"en\": …, \"de\": …, \"it\": …} (one sentence per language).")
    }
    if (summary.isJsonPrimitive) {
      return if (summary.asString.isBlank()) {
        listOf(
            "The Summary is empty — give it as {\"en\": …, \"de\": …, \"it\": …} (one sentence per language).")
      } else {
        listOf(
            "The Summary is not translated — give it as an OBJECT with all three languages: " +
                "{\"en\": …, \"de\": …, \"it\": …} (the manager stores it per language).")
      }
    }
    if (!summary.isJsonObject) {
      return listOf(
          "The Summary must be an object of language → text, e.g. {\"en\": …, \"de\": …, \"it\": …}.")
    }
    val obj = summary.asJsonObject
    val missing = SUMMARY_LANGUAGES.filter { optionString(obj, it)?.isBlank() != false }
    return if (missing.isEmpty()) emptyList()
    else
        listOf(
            "The Summary is missing the language(s) ${missing.joinToString(", ")} — it must contain " +
                "en, de and it.")
  }

  /**
   * `Parameter` as the manager stores it: parameter name → human description. A draft may carry the
   * description as a plain string OR as a typed object (`{ type, enum, default, description }`),
   * which the contract allows — both produce the name/description map the panel lists.
   */
  private fun parameterDescriptions(draft: JsonObject): JsonObject {
    val out = JsonObject()
    val source = draft.get("Parameter")?.takeIf { it.isJsonObject }?.asJsonObject ?: return out
    for ((name, value) in source.entrySet()) {
      val text =
          when {
            value.isJsonPrimitive -> value.asString
            value.isJsonObject ->
                optionString(value.asJsonObject, "description")
                    ?: optionString(value.asJsonObject, "Description")
                    ?: optionString(value.asJsonObject, "label")
                    ?: ""
            else -> ""
          }
      // The NAME must survive even without a description, otherwise the parameter disappears.
      out.addProperty(name, text)
    }
    return out
  }

  /**
   * The typed parameter metadata (the live registry's `parameters`) the designer renders its
   * type-aware editors from — `type`, `options` (from `options` or the contract's `enum`),
   * `default` and `description`. `null` when the draft declares no typed metadata (legacy
   * description-only map).
   */
  private fun parameterMetadata(draft: JsonObject): JsonObject? {
    val source = draft.get("Parameter")?.takeIf { it.isJsonObject }?.asJsonObject ?: return null
    val out = JsonObject()
    for ((name, value) in source.entrySet()) {
      val obj = value.takeIf { it.isJsonObject }?.asJsonObject ?: continue
      val meta = JsonObject()
      // A FIXED VALUE LIST *is* an enum: a model that writes `"type":"string"` together with
      // `"enum":[…]` means an enum, and the manager's type dropdown must not fall back to `string`
      // (reported: "the Parameter gets a type of string although it may have two values").
      val options =
          (obj.get("options") ?: obj.get("enum"))?.takeIf {
            it.isJsonArray && it.asJsonArray.size() > 0
          }
      val declared = optionString(obj, "type")?.trim()?.lowercase()
      val type =
          when {
            options != null -> "enum"
            !declared.isNullOrEmpty() -> declared
            else -> null
          }
      type?.let { meta.addProperty("type", it) }
      options?.let { meta.add("options", it) }
      obj.get("default")?.takeIf { !it.isJsonNull }?.let { meta.add("default", it) }
      optionString(obj, "description")
          ?.takeIf { it.isNotBlank() }
          ?.let { meta.addProperty("description", it) }
      if (meta.size() > 0) out.add(name, meta)
    }
    return out.takeIf { it.size() > 0 }
  }

  /**
   * Builds the Element-Placeholder `Signature` from the declared parameters: their ORDER (an EP is
   * called with positional arguments) plus the typed metadata (`type`, `options`). Mirrors the
   * local API-doc manager's `parametersToSignature()` so a locally generated EP behaves like one
   * that was maintained by hand.
   *
   * @return The signature object, or `null` when the draft declares no parameter at all.
   */
  private fun signatureFromMetadata(descriptions: JsonObject, typed: JsonObject?): JsonObject? {
    if (descriptions.size() == 0) return null
    val params = JsonArray()
    descriptions.keySet().forEachIndexed { index, name ->
      val spec = JsonObject()
      spec.addProperty("index", index + 1)
      spec.addProperty("name", name)
      val meta = typed?.get(name)?.takeIf { it.isJsonObject }?.asJsonObject
      val declaredType = meta?.get("type")?.takeIf { it.isJsonPrimitive }?.asString?.trim()
      spec.addProperty("type", declaredType?.takeIf { it.isNotEmpty() } ?: "any")
      spec.addProperty("optional", false)
      spec.addProperty("variadic", false)
      meta?.get("options")?.takeIf { it.isJsonArray }?.let { spec.add("options", it) }
      val description = descriptions.get(name)?.takeIf { it.isJsonPrimitive }?.asString
      if (!description.isNullOrBlank()) spec.addProperty("description", description)
      params.add(spec)
    }
    val signature = JsonObject()
    signature.add("params", params)
    signature.addProperty("returnType", "any")
    signature.addProperty("source", "local-element")
    return signature
  }

  private fun stringList(element: JsonElement?): List<String> {
    if (element == null) return emptyList()
    return when {
      element.isJsonArray ->
          element.asJsonArray
              .mapNotNull { el -> el.takeIf { it.isJsonPrimitive }?.asString?.trim() }
              .filter { it.isNotEmpty() }
      element.isJsonPrimitive ->
          element.asString.split(",").map { it.trim() }.filter { it.isNotEmpty() }
      else -> emptyList()
    }
  }

  /** Reads a string member tolerating a `JsonNull` and both `Name`/`name` spellings. */
  private fun optionString(obj: JsonObject, key: String): String? {
    val direct = obj.get(key)?.takeIf { it.isJsonPrimitive }?.asString
    if (direct != null) return direct
    return obj.get(key.replaceFirstChar { it.lowercase() })?.takeIf { it.isJsonPrimitive }?.asString
  }

  /**
   * The ids a drafting answer REQUESTS the authoritative details for, or `null` when the answer is
   * something else (a draft, a clarification, prose).
   *
   * Compact-first flow: the drafting prompt carries only the condensed CodBi catalogue, so the
   * model may ask ONCE for the exact parameter names / placeholder syntax of the ids it intends to
   * use — `{"status":"codbi_element_need_details","ids":["HTML.SETAttribute","Mein.Wetter"]}`. The
   * server then supplies exactly those sections instead of the whole ≈134 k-char reference. At most
   * 6 ids are accepted; anything that does not look like a technical id is dropped.
   */
  fun requestedDetailIds(raw: String?): List<String>? {
    if (raw.isNullOrBlank()) return null
    val obj =
        runCatching { JsonParser.parseString(raw) }
            .getOrNull()
            ?.takeIf { it.isJsonObject }
            ?.asJsonObject ?: return null
    val status = obj.get("status")?.takeIf { it.isJsonPrimitive }?.asString?.lowercase().orEmpty()
    val looksLikeRequest = status.contains("detail") || status.contains("need") || obj.has("ids")
    if (!looksLikeRequest) return null
    val values = mutableListOf<String>()
    val array =
        listOf("ids", "elements", "details", "functionalities", "placeholders")
            .firstNotNullOfOrNull { key -> obj.get(key)?.takeIf { it.isJsonArray }?.asJsonArray }
    if (array != null) {
      array.forEach { el -> if (el.isJsonPrimitive) values.add(el.asString) }
    } else {
      val csv = obj.get("ids")?.takeIf { it.isJsonPrimitive }?.asString
      if (csv != null) values.addAll(csv.split(','))
    }
    val ids =
        values
            .map { it.trim().trim('"', '\'', '`') }
            .filter { it.isNotEmpty() && ITEM_ID_PATTERN.matches(it) }
            .distinctBy { it.lowercase() }
            .take(6)
    if (ids.isEmpty()) return null
    return ids
  }

  /** A plausible CodBi id: letters, digits, dots, underscores and hyphens (2–64 chars). */
  private val ITEM_ID_PATTERN = Regex("^[A-Za-z0-9_.-]{2,64}$")

  /**
   * Builds the (short) context block appended to the contract prompt: which local elements already
   * exist and — when the request targets an existing element — its current definition, so the AI
   * proposes an UPDATE instead of a duplicate.
   */
  fun buildElementContext(
      existingNames: Map<String, LocalElementKind>,
      existing: JsonObject?,
      existingCode: String?
  ): String = buildString {
    append("\n\n## LOCAL CODBI ELEMENTS ALREADY DEFINED IN THIS INSTALLATION\n\n")
    if (existingNames.isEmpty()) {
      append("(none — every local element you propose will be the first of its kind)\n")
    } else {
      existingNames.entries
          .sortedBy { it.key }
          .take(400)
          .forEach { (name, kind) ->
            append("- ").append(name).append(" (").append(kind.draftValue).append(")\n")
          }
      append(
          "\nA name from this list MUST NOT be reused for a NEW element. To CHANGE one of them, return the same Name and the complete new definition (the commit overwrites it).\n")
    }
    if (existing != null) {
      append("\n## CURRENT DEFINITION OF THE ELEMENT TO CHANGE\n\n```json\n")
      append(existing.toString())
      append("\n```\n")
      if (!existingCode.isNullOrBlank()) {
        append("\n## CURRENT CODE OF THE ELEMENT TO CHANGE\n\n```js\n")
        append(existingCode.take(12_000))
        append("\n```\n")
      }
      // A CHANGE request (reported: "tell the AI to change the code cause it shows every button in
      // one row"). The commit REPLACES the stored element with the answer, so an answer that
      // rewrites everything from scratch silently loses parameters, prompts and behaviour nobody
      // asked to change.
      append(
          "\n**THIS IS A CHANGE REQUEST.** Answer with the SAME Name and the COMPLETE definition, " +
              "because the commit replaces the stored element with your answer. Change ONLY what " +
              "the request asks for: keep every property, parameter, prompt and every part of the " +
              "code that does not have to change — start from the CURRENT CODE above instead of " +
              "writing a new implementation, and keep the parameter names the definition already " +
              "declares (the forms already using it pass them).\n")
    }
  }

  /**
   * Reads the element the model CHOSE from a `local-element-target` answer.
   *
   * The answer arrives as `{"status":"codbi_element_target","Name":"<name>"}` (also accepted:
   * `element`/`target`/`targetName` as the key). Only a name that is REALLY in [known] is returned
   * — a hallucinated or paraphrased name must never select the wrong element, and [known] is the
   * exact key set of the stored documentation. Case differences and a space/underscore spelling are
   * tolerated (`mein rechner` → `mein.rechner`), nothing else.
   */
  fun targetNameOf(raw: String?, known: Collection<String>): String? {
    if (raw.isNullOrBlank() || known.isEmpty()) return null
    val obj =
        runCatching { JsonParser.parseString(raw) }
            .getOrNull()
            ?.takeIf { it.isJsonObject }
            ?.asJsonObject ?: return null
    val candidate =
        listOf("Name", "name", "element", "Element", "target", "Target", "targetName")
            .asSequence()
            .mapNotNull { key -> obj.get(key)?.takeIf { it.isJsonPrimitive }?.asString }
            .map { it.trim() }
            .firstOrNull { it.isNotEmpty() } ?: return null
    return known.firstOrNull { it.equals(candidate, ignoreCase = true) }
        ?: known.firstOrNull {
          it.equals(candidate.replace(Regex("[\\s_\\-]+"), "."), ignoreCase = true)
        }
  }

  /**
   * The question the target round asked when it could NOT decide, as `question to options`.
   *
   * The options are returned as written — the caller narrows them to the names that really exist (a
   * suggested option must never be a name the installation does not have).
   */
  fun targetQuestionOf(raw: String?): Pair<String, List<String>>? {
    if (raw.isNullOrBlank()) return null
    val obj =
        runCatching { JsonParser.parseString(raw) }
            .getOrNull()
            ?.takeIf { it.isJsonObject }
            ?.asJsonObject ?: return null
    // The canonical shape nests the question under "questions"; a bare object is tolerated too.
    val holder =
        obj.getAsJsonArray("questions")?.firstOrNull()?.takeIf { it.isJsonObject }?.asJsonObject
            ?: obj
    val text =
        listOf("question", "Question", "text", "title", "clarification", "message")
            .mapNotNull { key -> holder.get(key)?.takeIf { it.isJsonPrimitive }?.asString?.trim() }
            .firstOrNull { it.isNotEmpty() } ?: return null
    val options =
        holder
            .get("options")
            ?.takeIf { it.isJsonArray }
            ?.asJsonArray
            ?.mapNotNull { el -> el.takeIf { it.isJsonPrimitive }?.asString?.trim() }
            ?.filter { it.isNotEmpty() } ?: emptyList()
    return text to options
  }
}
