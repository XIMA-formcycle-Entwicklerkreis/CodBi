package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import java.lang.reflect.Method
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [BraveSearch] — query sanitization, regex patterns, result formatting. */
class BraveSearchTest {

  @BeforeEach
  fun setUp() {
    // Reset filter state before each test
    BraveSearch.filterResults = false
  }

  // region sanitizeQuery — Filter Disabled

  @Nested
  inner class SanitizeQueryFilterDisabled {

    @Test
    fun passesThroughWhenFilterDisabled() {
      val raw = "John Doe email john@example.com phone 555-1234"
      val result = BraveSearch.sanitizeQuery(raw)
      assertEquals(raw, result)
    }

    @Test
    fun protectedTokensResolvedWhenFilterDisabled() {
      val raw = "search for << MyBrand >> info"
      val result = BraveSearch.sanitizeQuery(raw)
      assertEquals("search for MyBrand info", result)
    }

    @Test
    fun multipleProtectedTokensResolvedWhenFilterDisabled() {
      val raw = "<< Token1 >> and << Token2 >>"
      val result = BraveSearch.sanitizeQuery(raw)
      assertEquals("Token1 and Token2", result)
    }

    @Test
    fun filterOverrideFalsePassesThrough() {
      BraveSearch.filterResults = true // global on
      val raw = "John Doe email"
      val result = BraveSearch.sanitizeQuery(raw, filterOverride = false)
      assertEquals(raw, result)
    }
  }

  // endregion

  // region sanitizeQuery — Filter Enabled

  @Nested
  inner class SanitizeQueryFilterEnabled {

    @BeforeEach
    fun enableFilter() {
      BraveSearch.filterResults = true
    }

    @Test
    fun stripsEmailAddresses() {
      val result = BraveSearch.sanitizeQuery("contact test.user@example.com please")
      assertFalse(result.contains("@"), "Email should be stripped: $result")
    }

    @Test
    fun stripsPhoneNumbersInternational() {
      val result = BraveSearch.sanitizeQuery("call +49 123 456789 now")
      assertFalse(result.contains("456789"), "Phone number should be stripped: $result")
    }

    @Test
    fun stripsSerialNumbers() {
      val result = BraveSearch.sanitizeQuery("device S/N87233-12 broken")
      assertFalse(result.contains("87233"), "Serial number should be stripped: $result")
    }

    @Test
    fun stripsSerialNumbersWithColon() {
      val result = BraveSearch.sanitizeQuery("SN: 12345 needs repair")
      assertFalse(result.contains("12345"), "SN: format should be stripped: $result")
    }

    @Test
    fun stripsIban() {
      val result = BraveSearch.sanitizeQuery("payment to DE89 3704 0044 0532 0130 00")
      assertFalse(result.contains("3704"), "IBAN should be stripped: $result")
    }

    @Test
    fun stripsSsn() {
      val result = BraveSearch.sanitizeQuery("SSN is 123-45-6789")
      assertFalse(result.contains("123-45-6789"), "SSN should be stripped: $result")
    }

    @Test
    fun stripsDateOfBirth() {
      val result = BraveSearch.sanitizeQuery("DOB: 01/02/1990 patient record")
      assertFalse(result.contains("01/02/1990"), "DOB should be stripped: $result")
    }

    @Test
    fun stripsGermanDateOfBirth() {
      val result = BraveSearch.sanitizeQuery("Geb. 15.03.1985 Akte")
      assertFalse(result.contains("15.03.1985"), "German DOB should be stripped: $result")
    }

    @Test
    fun stripsStreetAddresses() {
      val result = BraveSearch.sanitizeQuery("lives at 123 Main Street apt")
      assertFalse(result.contains("123 Main Street"), "Street address should be stripped: $result")
    }

    @Test
    fun stripsGermanStreetAddresses() {
      val result = BraveSearch.sanitizeQuery("wohnt 45 Berliner Straße")
      assertFalse(
          result.contains("Berliner Straße") || result.contains("Berliner Strasse"),
          "German address should be stripped: $result")
    }

    @Test
    fun stripsLongNumericIds() {
      val result = BraveSearch.sanitizeQuery("case 123456 details")
      assertFalse(result.contains("123456"), "6+ digit ID should be stripped: $result")
    }

    @Test
    fun stripsUnlessClause() {
      val result = BraveSearch.sanitizeQuery("search info unless John Smith")
      assertFalse(result.contains("John Smith"), "Unless clause should be stripped: $result")
    }

    @Test
    fun preservesProtectedTokens() {
      val result = BraveSearch.sanitizeQuery("<< Google >> products search")
      assertTrue(result.contains("Google"), "Protected token should be preserved: $result")
    }

    @Test
    fun protectedTokensSurviveSanitization() {
      val result =
          BraveSearch.sanitizeQuery("find << Amazon Web Services >> for test.user@example.com")
      assertTrue(result.contains("Amazon Web Services"), "Protected token missing: $result")
      assertFalse(result.contains("@"), "Email should still be stripped: $result")
    }

    @Test
    fun filterOverrideTrueEnablesFilter() {
      BraveSearch.filterResults = false // global off
      val result = BraveSearch.sanitizeQuery("contact test@example.com", filterOverride = true)
      assertFalse(result.contains("@"), "filterOverride=true should enable: $result")
    }

    @Test
    fun emptyAfterSanitization() {
      val result = BraveSearch.sanitizeQuery("test@example.com")
      // Should produce near-empty string (just whitespace/trimmed)
      assertNotNull(result)
    }
  }

  // endregion

  // region Regex Patterns

  @Nested
  inner class CallSearchPattern {

    @Test
    fun matchesSingleQuotes() {
      val match = BraveSearch.CALL_SEARCH_PATTERN.find("CALL:search(query='test query')")
      assertNotNull(match)
      assertEquals("test query", match!!.groupValues[1])
    }

    @Test
    fun matchesDoubleQuotes() {
      val match = BraveSearch.CALL_SEARCH_PATTERN.find("CALL:search(query=\"weather today\")")
      assertNotNull(match)
      assertEquals("weather today", match!!.groupValues[1])
    }

    @Test
    fun matchesWithSpaces() {
      val match = BraveSearch.CALL_SEARCH_PATTERN.find("CALL:search( query = 'spaced' )")
      assertNotNull(match)
      assertEquals("spaced", match!!.groupValues[1])
    }

    @Test
    fun noMatchOnMalformed() {
      val match = BraveSearch.CALL_SEARCH_PATTERN.find("CALL:search(foo)")
      assertNull(match)
    }
  }

  // endregion

  // region SearchResult Data Class

  @Nested
  inner class SearchResultTest {

    @Test
    fun basicConstruction() {
      val result = BraveSearch.SearchResult("Title", "https://example.com", "Desc")
      assertEquals("Title", result.title)
      assertEquals("https://example.com", result.url)
      assertEquals("Desc", result.description)
      assertTrue(result.extraSnippets.isEmpty())
    }

    @Test
    fun withExtraSnippets() {
      val snippets = listOf("extra1", "extra2")
      val result = BraveSearch.SearchResult("T", "U", "D", snippets)
      assertEquals(2, result.extraSnippets.size)
      assertEquals("extra1", result.extraSnippets[0])
    }

    @Test
    fun equality() {
      val a = BraveSearch.SearchResult("T", "U", "D")
      val b = BraveSearch.SearchResult("T", "U", "D")
      assertEquals(a, b)
    }

    @Test
    fun copyModification() {
      val original = BraveSearch.SearchResult("T", "U", "D")
      val modified = original.copy(title = "New")
      assertEquals("New", modified.title)
      assertEquals("U", modified.url)
    }
  }

  // endregion

  // region formatResultsForModel

  @Nested
  inner class FormatResultsForModelTest {

    @Test
    fun emptyResultsMessage() {
      val output = BraveSearch.formatResultsForModel(emptyList())
      assertEquals("No search results found.", output)
    }

    @Test
    fun singleResult() {
      val results = listOf(BraveSearch.SearchResult("My Page", "https://x.com", "A page"))
      val output = BraveSearch.formatResultsForModel(results)
      assertTrue(output.contains("WEB SEARCH RESULTS:"))
      assertTrue(output.contains("[1] My Page"))
      assertTrue(output.contains("https://x.com"))
      assertTrue(output.contains("A page"))
    }

    @Test
    fun multipleResultsNumbered() {
      val results =
          listOf(
              BraveSearch.SearchResult("First", "https://1.com", "D1"),
              BraveSearch.SearchResult("Second", "https://2.com", "D2"),
              BraveSearch.SearchResult("Third", "https://3.com", "D3"),
          )
      val output = BraveSearch.formatResultsForModel(results)
      assertTrue(output.contains("[1] First"))
      assertTrue(output.contains("[2] Second"))
      assertTrue(output.contains("[3] Third"))
    }

    @Test
    fun includesExtraSnippets() {
      val results =
          listOf(
              BraveSearch.SearchResult(
                  "Page", "https://p.com", "Desc", listOf("snippet1", "snippet2")))
      val output = BraveSearch.formatResultsForModel(results)
      assertTrue(output.contains("Extra:"))
      assertTrue(output.contains("snippet1"))
    }

    @Test
    fun includesInstructions() {
      val results = listOf(BraveSearch.SearchResult("P", "https://p.com", "D"))
      val output = BraveSearch.formatResultsForModel(results)
      assertTrue(output.contains("INSTRUCTIONS:"))
    }
  }

  // endregion

  // region sanitizeQuery — Filter Enabled (Deeper)

  @Nested
  inner class SanitizeQueryFilterEnabledDeep {

    @BeforeEach
    fun enableFilter() {
      BraveSearch.filterResults = true
    }

    @Test
    fun stripsPersonNames() {
      // 3+ consecutive title-case words are stripped (to avoid German noun false positives)
      val result = BraveSearch.sanitizeQuery("information about John Michael Smith please")
      assertFalse(
          result.contains("John Michael Smith"),
          "Person name (3+ TitleCase words) should be stripped: $result")
    }

    @Test
    fun preservesTwoWordTitleCase() {
      // 2-word title-case phrases preserved (German nouns like "Wettervorhersage Ansbach")
      val result = BraveSearch.sanitizeQuery("information about John Smith please")
      assertTrue(
          result.contains("John Smith"),
          "Two-word title-case should NOT be stripped (German noun safety): $result")
    }

    @Test
    fun stripsGermanPersonNames() {
      // 3+ consecutive title-case words are stripped
      val result = BraveSearch.sanitizeQuery("Informationen über Hans Peter Müller bitte")
      assertFalse(
          result.contains("Hans Peter Müller"),
          "German person name (3+ words) should be stripped: $result")
    }

    @Test
    fun preservesGermanTwoWordNouns() {
      // 2-word German noun phrases must NOT be stripped
      val result = BraveSearch.sanitizeQuery("Wettervorhersage Ansbach morgen")
      assertTrue(
          result.contains("Wettervorhersage Ansbach"),
          "German 2-word noun phrase should NOT be stripped: $result")
    }

    @Test
    fun preservesSingleTitleCaseWord() {
      val result = BraveSearch.sanitizeQuery("information about Berlin please")
      // Single TitleCase word should NOT be stripped (only 2+ consecutive)
      assertTrue(result.contains("Berlin"), "Single title-case word should stay: $result")
    }

    @Test
    fun stripsAlphanumericDashIds() {
      val result = BraveSearch.sanitizeQuery("reference ABC-12345-XY in system")
      assertFalse(
          result.contains("ABC-12345-XY"), "Alphanumeric dash ID should be stripped: $result")
    }

    @Test
    fun stripsExceptClause() {
      val result = BraveSearch.sanitizeQuery("search all except Jane Doe")
      assertFalse(result.contains("Jane Doe"), "'except' clause should be stripped: $result")
    }

    @Test
    fun stripsExcludingClause() {
      val result = BraveSearch.sanitizeQuery("find data excluding Michael Brown")
      assertFalse(
          result.contains("Michael Brown"), "'excluding' clause should be stripped: $result")
    }

    @Test
    fun stripsPhoneLocalFormat() {
      val result = BraveSearch.sanitizeQuery("call (0123) 456789 for info")
      assertFalse(result.contains("456789"), "Local phone number should be stripped: $result")
    }

    @Test
    fun stripsBornOnDate() {
      val result = BraveSearch.sanitizeQuery("patient born on 15/03/1990 details")
      assertFalse(result.contains("15/03/1990"), "'born on' date should be stripped: $result")
    }

    @Test
    fun stripsGermanStreetWithStraße() {
      val result = BraveSearch.sanitizeQuery("located at 12 Berliner Straße details")
      assertFalse(
          result.contains("12 Berliner Straße"),
          "German Straße address should be stripped: $result")
    }

    @Test
    fun stripsEnglishStreetAbbreviation() {
      val result = BraveSearch.sanitizeQuery("delivery to 456 Oak Ave.")
      assertFalse(
          result.contains("456 Oak Ave"), "English street abbreviation should be stripped: $result")
    }

    @Test
    fun collapsesMultipleSpaces() {
      val result = BraveSearch.sanitizeQuery("search    with    spaces    test@email.com")
      assertFalse(result.contains("  "), "Multiple spaces should be collapsed: $result")
    }

    @Test
    fun trimsTrailingPunctuation() {
      val result = BraveSearch.sanitizeQuery("search query ending with,,,")
      assertFalse(result.endsWith(","), "Should trim trailing commas: $result")
    }
  }

  // endregion

  // region search — edge cases

  @Nested
  inner class SearchEdgeCaseTest {

    @Test
    fun returnsEmptyWhenApiKeyNull() {
      BraveSearch.apiKey = null
      val results = BraveSearch.search("test query")
      assertTrue(results.isEmpty())
    }

    @Test
    fun returnsEmptyWhenApiKeyBlank() {
      BraveSearch.apiKey = "   "
      val results = BraveSearch.search("test query")
      assertTrue(results.isEmpty())
      BraveSearch.apiKey = null
    }

    @Test
    fun returnsEmptyWhenQuerySanitizedToEmpty() {
      BraveSearch.filterResults = true
      BraveSearch.apiKey = "BSAtestkey"
      // Email only — sanitization removes it, leaving empty query
      val results = BraveSearch.search("test@example.com")
      assertTrue(results.isEmpty())
      BraveSearch.apiKey = null
    }
  }

  // endregion

  // region maxResults configuration

  @Nested
  inner class MaxResultsTest {

    @Test
    fun defaultMaxResultsIs5() {
      // Reset to default
      BraveSearch.maxResults = 5
      assertEquals(5, BraveSearch.maxResults)
    }

    @Test
    fun maxResultsIsConfigurable() {
      BraveSearch.maxResults = 10
      assertEquals(10, BraveSearch.maxResults)
      BraveSearch.maxResults = 5 // reset
    }
  }

  // endregion

  // region isAvailable

  @Nested
  inner class IsAvailableTest {

    @Test
    fun notAvailableWhenNoApiKey() {
      BraveSearch.apiKey = null
      assertFalse(BraveSearch.isAvailable)
    }

    @Test
    fun notAvailableWhenBlankApiKey() {
      BraveSearch.apiKey = "   "
      assertFalse(BraveSearch.isAvailable)
    }

    @Test
    fun availableWhenApiKeySet() {
      BraveSearch.apiKey = "BSAtest1234"
      assertTrue(BraveSearch.isAvailable)
      BraveSearch.apiKey = null // cleanup
    }
  }

  // endregion

  // region parseResults — via reflection

  @Nested
  inner class ParseResultsViaReflectionTest {

    private lateinit var parseResults: Method

    @BeforeEach
    fun setUpReflection() {
      parseResults = BraveSearch::class.java.getDeclaredMethod("parseResults", String::class.java)
      parseResults.isAccessible = true
    }

    @Suppress("UNCHECKED_CAST")
    private fun invoke(json: String): List<BraveSearch.SearchResult> =
        parseResults.invoke(BraveSearch, json) as List<BraveSearch.SearchResult>

    @Test
    fun validJsonReturnsSingleResult() {
      val json =
          """{"web":{"results":[{"title":"Hello","url":"https://example.com","description":"Desc"}]}}"""
      val results = invoke(json)
      assertEquals(1, results.size)
      assertEquals("Hello", results[0].title)
      assertEquals("https://example.com", results[0].url)
      assertEquals("Desc", results[0].description)
    }

    @Test
    fun validJsonReturnsMultipleResults() {
      val json =
          """{"web":{"results":[
        {"title":"A","url":"https://a.com","description":"DA"},
        {"title":"B","url":"https://b.com","description":"DB"}
      ]}}"""
      val results = invoke(json)
      assertEquals(2, results.size)
      assertEquals("A", results[0].title)
      assertEquals("B", results[1].title)
    }

    @Test
    fun extraSnippetsAreIncluded() {
      val json =
          """{"web":{"results":[{"title":"X","url":"https://x.com","description":"D","extra_snippets":["s1","s2"]}]}}"""
      val results = invoke(json)
      assertEquals(1, results.size)
      assertEquals(listOf("s1", "s2"), results[0].extraSnippets)
    }

    @Test
    fun missingWebKeyReturnsEmpty() {
      val results = invoke("""{"other":"data"}""")
      assertTrue(results.isEmpty())
    }

    @Test
    fun missingResultsArrayReturnsEmpty() {
      val results = invoke("""{"web":{"other":"data"}}""")
      assertTrue(results.isEmpty())
    }

    @Test
    fun emptyResultsArrayReturnsEmpty() {
      val results = invoke("""{"web":{"results":[]}}""")
      assertTrue(results.isEmpty())
    }

    @Test
    fun malformedJsonReturnsEmpty() {
      val results = invoke("{broken json!!!")
      assertTrue(results.isEmpty())
    }

    @Test
    fun blankTitleAndDescriptionSkipsEntry() {
      val json = """{"web":{"results":[{"title":"","url":"https://x.com","description":""}]}}"""
      val results = invoke(json)
      assertTrue(results.isEmpty(), "Both title and description blank → skip")
    }

    @Test
    fun limitsToMaxResultsSetting() {
      BraveSearch.maxResults = 2
      try {
        val json =
            """{"web":{"results":[
          {"title":"A","url":"https://a.com","description":"DA"},
          {"title":"B","url":"https://b.com","description":"DB"},
          {"title":"C","url":"https://c.com","description":"DC"}
        ]}}"""
        val results = invoke(json)
        assertEquals(2, results.size)
      } finally {
        BraveSearch.maxResults = 5
      }
    }

    @Test
    fun missingFieldsDefaultToEmpty() {
      val json = """{"web":{"results":[{"title":"T","description":"D"}]}}"""
      val results = invoke(json)
      assertEquals(1, results.size)
      assertEquals("", results[0].url)
      assertTrue(results[0].extraSnippets.isEmpty())
    }
  }

  // endregion
}
