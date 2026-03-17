package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.google.gson.Gson
import com.google.gson.JsonParser

/**
 * Holds the language-negotiation strings for a detected non-English language.
 *
 * @property userTurn "Let's talk in [language]" — injected as a fake user turn.
 * @property assistantTurn Short confirmation — injected as the assistant's reply.
 * @property thinkSeed Opening phrase pre-filled into the `<think>` block.
 * @property searchPrompt Follow-up instruction for answering from search results (last round).
 * @property searchPromptIntermediate Follow-up instruction that allows the model to issue another
 *   search if the results are insufficient (non-last rounds).
 * @property searchingLabel Localized "Searching the web for" label (with %s placeholder for query).
 * @property analyzingLabel Localized "Analyzing N results" label (with %d placeholder for count).
 */
internal data class DetectedLanguage(
    val userTurn: String,
    val assistantTurn: String,
    val thinkSeed: String,
    val searchPrompt: String,
    val searchPromptIntermediate: String =
        "Review the search results. If they fully answer the question, give a short, direct answer in 2-4 sentences with Markdown links. If the results are insufficient, you may issue another search with CALL:search('refined query'). Do not repeat yourself.",
    val searchingLabel: String = "🔍 Searching the web for: \"%s\"",
    val analyzingLabel: String = "Analyzing %d results to formulate an answer.",
    val braveCountry: String? = null,
    val languageName: String = "English",
    val exampleProductQuery: String = "ProductName error fix",
    val exampleLawQuery: String = "contract termination rules",
    val exampleWeatherQuery: String = "weather forecast",
    val exampleLocalQuery: String = "restaurants near me",
    val uiReasoningLabel: String = "Reasoning…",
    val uiShowReasoningLabel: String = "Show reasoning",
    val uiShowSourcesLabel: String = "Show sources",
    val uiSearchingLabel: String = "Searching the internet for \u201C%s\u201D…",
    val uiSearchingLabelNoQuery: String = "Searching the internet…",
    val uiThinkingLabel: String = "Thinking…",
    val uiCopyResponseLabel: String = "Response",
    val uiCopyReasoningLabel: String = "Reasoning"
)

/**
 * Detects the user's language via both model-based and heuristic approaches. Contains the language
 * map with localized prompts and UI strings for 12 languages.
 *
 * @param log Logger callback for diagnostic messages.
 */
internal class LanguageDetectionService(private val log: (LogLevel, String) -> Unit) {

  /** Pre-built language negotiation objects keyed by lowercase language name. */
  val languageMap: Map<String, DetectedLanguage> = loadLanguageMap()

  /** Set of recognized language names for validation of model output. */
  val knownLanguageNames: Set<String> =
      setOf(
          "english",
          "german",
          "french",
          "italian",
          "spanish",
          "portuguese",
          "dutch",
          "turkish",
          "japanese",
          "chinese",
          "korean",
          "arabic",
          "russian",
          "hindi",
          "polish",
          "czech",
          "slovak",
          "hungarian",
          "romanian",
          "bulgarian",
          "croatian",
          "serbian",
          "slovenian",
          "greek",
          "swedish",
          "norwegian",
          "danish",
          "finnish",
          "estonian",
          "latvian",
          "lithuanian",
          "ukrainian",
          "thai",
          "vietnamese",
          "indonesian",
          "malay",
          "tagalog",
          "filipino",
          "persian",
          "farsi",
          "hebrew",
          "urdu",
          "bengali",
          "tamil",
          "telugu",
          "marathi",
          "gujarati",
          "punjabi",
          "swahili",
          "catalan",
          "basque",
          "galician",
          "afrikaans",
          "welsh",
          "irish",
          "scots gaelic",
          "icelandic",
          "maltese",
          "albanian",
          "macedonian",
          "bosnian",
          "georgian",
          "armenian",
          "azerbaijani",
          "kazakh",
          "uzbek",
          "mongolian",
          "nepali",
          "sinhalese",
          "sinhala",
          "khmer",
          "lao",
          "burmese",
          "amharic",
          "yoruba",
          "igbo",
          "hausa",
          "zulu",
          "xhosa",
          "sotho",
          "tswana",
          "shona",
          "mandarin",
          "cantonese",
          "wu",
          "hokkien",
          "hakka",
          "cebuano",
          "javanese",
          "sundanese")

  /**
   * Detects the user's language by sending the question to the model with a language-detection
   * system prompt and few-shot examples.
   *
   * Falls back to the heuristic [detectLanguage] if the model call fails.
   *
   * @param question The user's question text.
   * @param sendCompletion Callback that sends a chat completion request body and returns the
   *   response body. The caller is responsible for routing to either the local server or external
   *   API.
   * @return A [DetectedLanguage] with conversation seeds and prompts, or `null` for English.
   */
  fun detectLanguageViaModel(
      question: String,
      sendCompletion: (requestBody: String) -> String
  ): DetectedLanguage? {
    try {
      val messagesJson = buildString {
        append("[")
        append(
            "{\"role\":\"system\",\"content\":\"You are a language detector. " +
                "Detect the LANGUAGE the text is WRITTEN IN based on its words and grammar. " +
                "IGNORE the topic, subject matter, or any people/places/countries mentioned in the text. " +
                "The text may be in its native script OR romanized (Latin alphabet). " +
                "Reply with ONLY the language name in English, nothing else. " +
                "Examples: English, German, French, Italian, Spanish, Portuguese, Dutch, Turkish, Japanese, Chinese, Korean, Arabic, Russian, Hindi.\"}")
        append(",{\"role\":\"user\",\"content\":\"Chi è Nelson Mandela?\"}")
        append(",{\"role\":\"assistant\",\"content\":\"Italian\"}")
        append(",{\"role\":\"user\",\"content\":\"Wie wird das Wetter in Tokyo?\"}")
        append(",{\"role\":\"assistant\",\"content\":\"German\"}")
        append(",{\"role\":\"user\",\"content\":\"¿Quién fue Mahatma Gandhi?\"}")
        append(",{\"role\":\"assistant\",\"content\":\"Spanish\"}")
        append(",{\"role\":\"user\",\"content\":\"${jsonEscape(question)}\"}")
        append("]")
      }

      val requestBody = buildString {
        append("{\"messages\":$messagesJson")
        append(",\"max_tokens\":8")
        append(",\"temperature\":0.0")
        append(",\"stream\":false")
        append("}")
      }

      val response = sendCompletion(requestBody)

      val json = JsonParser.parseString(response).asJsonObject
      val raw =
          json
              .getAsJsonArray("choices")
              ?.get(0)
              ?.asJsonObject
              ?.getAsJsonObject("message")
              ?.get("content")
              ?.asString ?: ""
      val langName =
          raw.trim().lowercase().removeSuffix(".").removeSuffix("!").removeSuffix(",").trim()

      log(LogLevel.INFO, "Model-detected language: '$langName' (raw: '${raw.trim()}')")

      val regexLang = detectLanguage(question)

      if (regexLang != null) {
        if (langName != regexLang.languageName.lowercase() && langName != "english") {
          log(
              LogLevel.WARNING,
              "Model detected '$langName' but regex detected '${regexLang.languageName}' — preferring regex")

          return regexLang
        }
      }

      if (langName == "english") return null

      val detected = languageMap[langName]

      if (detected != null) return detected

      if (langName in knownLanguageNames) {
        log(LogLevel.WARNING, "Language '$langName' recognised but no localised prompts available")
      } else if (langName.isNotBlank()) {
        log(LogLevel.WARNING, "Unknown language from model: '$langName'")
      }

      return regexLang
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Language detection via model failed: ${e.message}")

      return detectLanguage(question)
    }
  }

  /**
   * Quick heuristic language detection based on character patterns and common word markers. Does
   * not call the model — uses only regex and string matching.
   *
   * @param question The user's question text.
   * @return A [DetectedLanguage] or `null` if the text appears to be English.
   */
  fun detectLanguage(question: String): DetectedLanguage? {
    val lower = question.lowercase()
    val cjkCount = lower.count { it in '\u4E00'..'\u9FFF' || it in '\u3400'..'\u4DBF' }
    val hiragana = lower.count { it in '\u3040'..'\u309F' }
    val katakana = lower.count { it in '\u30A0'..'\u30FF' }
    val hangul = lower.count { it in '\uAC00'..'\uD7AF' || it in '\u1100'..'\u11FF' }
    val cyrillic = lower.count { it in '\u0400'..'\u04FF' }
    val arabic = lower.count { it in '\u0600'..'\u06FF' }

    if (hiragana + katakana >= 2 || (cjkCount >= 2 && (hiragana + katakana) >= 1)) {
      return languageMap["japanese"]
    }

    if (hangul >= 2) return languageMap["korean"]

    if (cjkCount >= 2) return languageMap["chinese"]

    if (cyrillic >= 3) return languageMap["russian"]

    val germanMarkers =
        listOf(
            " ist ",
            " und ",
            " der ",
            " die ",
            " das ",
            " den ",
            " dem ",
            " des ",
            " ein ",
            " eine ",
            " nicht ",
            " auf ",
            " mit ",
            " für ",
            " sich ",
            " von ",
            " zu ",
            " wie ",
            " was ",
            " wer ",
            " wo ",
            " wann ",
            " warum ",
            " kann ",
            " wird ",
            " sind ",
            " hat ",
            " auch ",
            " noch ",
            " oder ",
            " aber ",
            " wenn ",
            " ich ",
            " mir ",
            " mich ",
            " dich ",
            " dir ",
            " er ",
            " sie ",
            " wir ",
            "ü",
            "ö",
            "ä",
            "ß")

    if (germanMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["german"]
    }

    val dutchMarkers =
        listOf(
            " is ",
            " en ",
            " het ",
            " een ",
            " van ",
            " de ",
            " voor ",
            " met ",
            " niet ",
            " zijn ",
            " ook ",
            " kan ",
            " heeft ",
            " dat ",
            " dit ",
            " wel ",
            " maar ",
            " wat ",
            " waar ",
            " hoe ",
            " naar ",
            " bij ",
            " nog ",
            " meer ",
            "ij")

    val dutchStrongMarkers = listOf(" het ", " zijn ", " heeft ", " dat ", " dit ", " maar ")

    if (dutchMarkers.count { lower.contains(it) } >= 3 ||
        dutchStrongMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["dutch"]
    }

    val italianMarkers =
        listOf(
            " di ",
            " il ",
            " la ",
            " le ",
            " un ",
            " una ",
            " che ",
            " non ",
            " per ",
            " con ",
            " come ",
            " del ",
            " della ",
            " delle ",
            " degli ",
            " nei ",
            " nel ",
            " nella ",
            " nelle ",
            " sono ",
            " anche ",
            " stato ",
            " essere ",
            " hanno ",
            " può ",
            " chi ",
            " cosa ",
            " dove ",
            " quando ",
            " molto ",
            " più ",
            " alla ",
            " allo ",
            " agli ",
            " alle ",
            " dall",
            " sull",
            " qual ",
            " attuale",
            " città",
            " sindaco",
            " oggi")

    val strongItalianMarkers =
        listOf(" chi ", " perché", " qual ", " quale ", " della ", " delle ", " degli ")

    if (italianMarkers.count { lower.contains(it) } >= 2 ||
        strongItalianMarkers.any { lower.contains(it) }) {

      return languageMap["italian"]
    }

    val portugueseMarkers =
        listOf(
            "ã",
            "õ",
            " é ",
            " para ",
            " com ",
            " que ",
            " não ",
            " uma ",
            " um ",
            " você ",
            " está ",
            " são ",
            " tem ",
            " como ",
            " mais ",
            " muito ",
            " bem ",
            " também ",
            " qual ",
            " melhor",
            " pode ",
            " fazer ",
            " sobre ",
            " quando ",
            " onde ")
    val portugueseHits = portugueseMarkers.count { lower.contains(it) }

    if (portugueseHits >= 2 ||
        (portugueseHits >= 1 && listOf("ã", "õ").any { lower.contains(it) })) {
      return languageMap["portuguese"]
    }

    val frenchMarkers =
        listOf(
            " est ",
            " les ",
            " des ",
            " une ",
            " dans ",
            " pour ",
            " avec ",
            " que ",
            " qui ",
            " sur ",
            " pas ",
            " sont ",
            " très ",
            " mais ",
            " aussi ",
            " cette ",
            " nous ",
            " vous ",
            " ils ",
            " elle ",
            " faire ",
            " avoir ",
            " peut ",
            " fait ",
            " tout ",
            " bien ",
            " comment ",
            " pourquoi",
            " quel",
            " quoi ",
            "é",
            "è",
            "ê",
            "ç",
            "l'",
            "d'",
            "c'",
            "j'",
            "n'",
            "s'",
            "qu'")

    if (frenchMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["french"]
    }

    val spanishMarkers =
        listOf(
            " es ",
            " los ",
            " las ",
            " una ",
            " para ",
            " con ",
            " del ",
            " por ",
            " que ",
            "ñ",
            "¿",
            "¡")

    if (spanishMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["spanish"]
    }

    val turkishMarkers =
        listOf(
            "ı",
            "ğ",
            "ş",
            "ç",
            " bir ",
            " ve ",
            " bu ",
            " için ",
            " ile ",
            " ne ",
            " nasıl",
            " hangi",
            " nedir",
            " var ",
            " olan ",
            " gibi ",
            " daha ",
            " en ")

    if (turkishMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["turkish"]
    }

    return null // English or unknown — no extra hint needed
  }

  /**
   * Returns a follow-up prompt for answering from search results in the user's language. On
   * intermediate rounds the prompt tells the model it may issue another search; on the last round
   * it instructs a direct answer.
   *
   * @param originalQuestion The user's original question (used for fallback language detection).
   * @param lang Pre-detected language, or `null` to detect from [originalQuestion].
   * @param isLastRound Whether this is the final allowed search round.
   * @return A localised instruction string for the search follow-up completion.
   */
  fun searchFollowUpPrompt(
      originalQuestion: String,
      lang: DetectedLanguage? = null,
      isLastRound: Boolean = true
  ): String {
    val resolved = lang ?: detectLanguage(originalQuestion)

    if (resolved != null) {
      return if (isLastRound) resolved.searchPrompt else resolved.searchPromptIntermediate
    }

    return if (isLastRound) {
      "Give a short, direct answer in 2-4 sentences using the search results. Include relevant links from the results as Markdown links. Do not repeat yourself."
    } else {
      "Review the search results. If they fully answer the question, give a short, direct answer in 2-4 sentences with Markdown links. If the results are insufficient, you may issue another search with CALL:search('refined query'). Do not repeat yourself."
    }
  }

  /** Loads the language map from the bundled `languages.json` resource file. */
  /** ISO 639-1 two-letter code to canonical language-map key. */
  private val isoCodeMap: Map<String, String> =
      mapOf(
          "de" to "german",
          "it" to "italian",
          "fr" to "french",
          "es" to "spanish",
          "pt" to "portuguese",
          "nl" to "dutch",
          "tr" to "turkish",
          "ja" to "japanese",
          "zh" to "chinese",
          "ko" to "korean",
          "ru" to "russian",
          "ar" to "arabic",
          "hi" to "hindi",
          "pl" to "polish",
          "cs" to "czech",
          "sk" to "slovak",
          "hu" to "hungarian",
          "ro" to "romanian",
          "bg" to "bulgarian",
          "hr" to "croatian",
          "sr" to "serbian",
          "sl" to "slovenian",
          "el" to "greek",
          "sv" to "swedish",
          "no" to "norwegian",
          "da" to "danish",
          "fi" to "finnish",
          "et" to "estonian",
          "lv" to "latvian",
          "lt" to "lithuanian",
          "uk" to "ukrainian",
          "th" to "thai",
          "vi" to "vietnamese",
          "id" to "indonesian",
          "ms" to "malay",
          "fa" to "persian",
          "he" to "hebrew",
          "en" to "english")

  /**
   * Looks up a [DetectedLanguage] by ISO 639-1 two-letter code.
   *
   * @param code Two-letter language code (e.g. "de", "fr").
   * @return The matching [DetectedLanguage], or `null` for "en" or unknown codes.
   */
  fun lookupByCode(code: String): DetectedLanguage? {
    val lower = code.lowercase().trim()
    if (lower == "en") return null
    val langName = isoCodeMap[lower] ?: return null
    return languageMap[langName]
  }

  /**
   * Returns the English language name for an ISO 639-1 code, or the code itself if not mapped.
   *
   * @param code Two-letter language code.
   * @return The canonical English language name (e.g. "German") or the original code.
   */
  fun languageNameForCode(code: String): String {
    val lower = code.lowercase().trim()
    val langName = isoCodeMap[lower] ?: return code
    return languageMap[langName]?.languageName ?: langName.replaceFirstChar { it.uppercase() }
  }

  private fun loadLanguageMap(): Map<String, DetectedLanguage> {
    val stream =
        javaClass.getResourceAsStream("/AI/llama/languages.json")
            ?: error("languages.json resource not found")

    val root = stream.reader(Charsets.UTF_8).use { JsonParser.parseReader(it).asJsonObject }
    val languagesObj = root.getAsJsonObject("languages")
    val gson = Gson()
    val resolved = mutableMapOf<String, DetectedLanguage>()

    for ((key, value) in languagesObj.entrySet()) {
      resolved[key] = gson.fromJson(value, DetectedLanguage::class.java)
    }

    val aliasesObj = root.getAsJsonObject("aliases")

    for ((alias, canonEl) in aliasesObj.entrySet()) {
      val canon = canonEl.asString
      resolved[canon]?.let { resolved[alias] = it }
    }

    return resolved
  }
}
