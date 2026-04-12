package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [UrlFetcher] — CALL:fetch pattern, FetchResult data class, formatResultForModel. */
class UrlFetcherTest {

  // region CALL_FETCH_PATTERN

  @Nested
  inner class CallFetchPatternTest {

    @Test
    fun matchesSingleQuotes() {
      val match = UrlFetcher.CALL_FETCH_PATTERN.find("CALL:fetch(url='https://example.com')")
      assertNotNull(match)
      assertEquals("https://example.com", match!!.groupValues[1])
    }

    @Test
    fun matchesDoubleQuotes() {
      val match = UrlFetcher.CALL_FETCH_PATTERN.find("CALL:fetch(url=\"https://test.org\")")
      assertNotNull(match)
      assertEquals("https://test.org", match!!.groupValues[1])
    }

    @Test
    fun matchesWithSpaces() {
      val match = UrlFetcher.CALL_FETCH_PATTERN.find("CALL:fetch( url = 'https://x.io' )")
      assertNotNull(match)
      assertEquals("https://x.io", match!!.groupValues[1])
    }

    @Test
    fun noMatchOnMalformed() {
      assertNull(UrlFetcher.CALL_FETCH_PATTERN.find("CALL:fetch(bad)"))
    }

    @Test
    fun extractsUrlWithPath() {
      val match =
          UrlFetcher.CALL_FETCH_PATTERN.find("CALL:fetch(url='https://example.com/page?q=test')")
      assertNotNull(match)
      assertEquals("https://example.com/page?q=test", match!!.groupValues[1])
    }

    @Test
    fun matchesEmbeddedInSurroundingText() {
      val text = "I will fetch the page: CALL:fetch(url='https://example.com/info') for you."
      val match = UrlFetcher.CALL_FETCH_PATTERN.find(text)
      assertNotNull(match)
      assertEquals("https://example.com/info", match!!.groupValues[1])
    }

    @Test
    fun noMatchOnEmptyUrl() {
      assertNull(UrlFetcher.CALL_FETCH_PATTERN.find("CALL:fetch(url='')"))
    }

    @Test
    fun matchesWithFragment() {
      val match = UrlFetcher.CALL_FETCH_PATTERN.find("CALL:fetch(url='https://x.com/page#section')")
      assertNotNull(match)
      assertEquals("https://x.com/page#section", match!!.groupValues[1])
    }
  }

  // endregion

  // region FetchResult Data Class

  @Nested
  inner class FetchResultTest {

    @Test
    fun successResult() {
      val result = UrlFetcher.FetchResult(url = "https://x.com", title = "X", text = "Content")
      assertEquals("https://x.com", result.url)
      assertEquals("X", result.title)
      assertEquals("Content", result.text)
      assertNull(result.error)
    }

    @Test
    fun errorResult() {
      val result = UrlFetcher.FetchResult(url = "https://bad.com", error = "HTTP 404")
      assertEquals("https://bad.com", result.url)
      assertNull(result.title)
      assertNull(result.text)
      assertEquals("HTTP 404", result.error)
    }

    @Test
    fun equality() {
      val a = UrlFetcher.FetchResult("u", "t", "txt")
      val b = UrlFetcher.FetchResult("u", "t", "txt")
      assertEquals(a, b)
    }

    @Test
    fun copy() {
      val original = UrlFetcher.FetchResult("u", "t", "txt")
      val modified = original.copy(error = "fail")
      assertNull(original.error)
      assertEquals("fail", modified.error)
    }
  }

  // endregion

  // region formatResultForModel

  @Nested
  inner class FormatResultForModelTest {

    @Test
    fun successFormatContainsUrl() {
      val result =
          UrlFetcher.FetchResult(
              url = "https://example.com", title = "Example", text = "Page content here")
      val output = UrlFetcher.formatResultForModel(result)
      assertTrue(output.contains("PAGE CONTENT FROM: https://example.com"))
      assertTrue(output.contains("TITLE: Example"))
      assertTrue(output.contains("Page content here"))
      assertTrue(output.contains("INSTRUCTIONS:"))
    }

    @Test
    fun successFormatWithoutTitle() {
      val result = UrlFetcher.FetchResult(url = "https://example.com", text = "Content")
      val output = UrlFetcher.formatResultForModel(result)
      assertTrue(output.contains("PAGE CONTENT FROM:"))
      assertFalse(output.contains("TITLE:"))
    }

    @Test
    fun errorFormat() {
      val result = UrlFetcher.FetchResult(url = "https://fail.com", error = "HTTP 500")
      val output = UrlFetcher.formatResultForModel(result)
      assertTrue(output.contains("PAGE FETCH FAILED"))
      assertTrue(output.contains("https://fail.com"))
      assertTrue(output.contains("HTTP 500"))
    }
  }

  // endregion

  // region fetch — SSRF protection

  @Nested
  inner class FetchSsrfProtectionTest {

    @Test
    fun blocksLocalhostUrl() {
      val result = UrlFetcher.fetch("http://localhost/secret")
      assertNotNull(result.error)
      assertTrue(result.error!!.contains("not allowed"))
    }

    @Test
    fun blocks127001() {
      val result = UrlFetcher.fetch("http://127.0.0.1/admin")
      assertNotNull(result.error)
    }

    @Test
    fun blocks10PrivateRange() {
      val result = UrlFetcher.fetch("http://10.0.0.1/internal")
      assertNotNull(result.error)
    }

    @Test
    fun blocks172PrivateRange() {
      val result = UrlFetcher.fetch("http://172.16.0.1/internal")
      assertNotNull(result.error)
    }

    @Test
    fun blocks192168PrivateRange() {
      val result = UrlFetcher.fetch("http://192.168.1.1/router")
      assertNotNull(result.error)
    }

    @Test
    fun blocksZeroAddress() {
      val result = UrlFetcher.fetch("http://0.0.0.0/")
      assertNotNull(result.error)
    }

    @Test
    fun blocksLinkLocal() {
      val result = UrlFetcher.fetch("http://169.254.169.254/metadata")
      assertNotNull(result.error)
    }

    @Test
    fun blocksFileScheme() {
      val result = UrlFetcher.fetch("file:///etc/passwd")
      assertNotNull(result.error)
    }

    @Test
    fun blocksFtpScheme() {
      val result = UrlFetcher.fetch("ftp://files.example.com/data")
      assertNotNull(result.error)
    }

    @Test
    fun blocksDataScheme() {
      val result = UrlFetcher.fetch("data:text/html,<h1>test</h1>")
      assertNotNull(result.error)
    }

    @Test
    fun blocksMalformedUrl() {
      val result = UrlFetcher.fetch("not-a-url")
      assertNotNull(result.error)
    }

    @Test
    fun blocksIpv6Loopback() {
      val result = UrlFetcher.fetch("http://[::1]/")
      assertNotNull(result.error)
    }

    @Test
    fun blocks127VariantAddresses() {
      val result = UrlFetcher.fetch("http://127.0.0.2/admin")
      assertNotNull(result.error)
    }

    @Test
    fun blocks10VariantAddresses() {
      val result = UrlFetcher.fetch("http://10.255.255.255/internal")
      assertNotNull(result.error)
    }

    @Test
    fun blocks172UpperBound() {
      val result = UrlFetcher.fetch("http://172.31.255.255/internal")
      assertNotNull(result.error)
    }

    @Test
    fun allowsNonPrivate172() {
      // 172.32.x.x is NOT private range (only 172.16-31 are)
      val result = UrlFetcher.fetch("http://172.32.0.1/page")
      // Should either succeed or fail with network error, but NOT SSRF block
      assertTrue(
          result.error == null || !result.error!!.contains("not allowed"),
          "172.32.x.x should be allowed: ${result.error}")
    }

    @Test
    fun blocksLocalhostCaseInsensitive() {
      val result = UrlFetcher.fetch("http://LOCALHOST/admin")
      assertNotNull(result.error)
      assertTrue(result.error!!.contains("not allowed"))
    }

    @Test
    fun blocksEmptyHost() {
      val result = UrlFetcher.fetch("http:///path")
      assertNotNull(result.error)
    }

    @Test
    fun blocksJavascriptScheme() {
      val result = UrlFetcher.fetch("javascript:alert(1)")
      assertNotNull(result.error)
    }
  }

  // endregion

  // region fetch — network errors

  @Nested
  inner class FetchNetworkTest {

    @Test
    fun fetchUnreachableHostReturnsError() {
      val result = UrlFetcher.fetch("https://this-domain-does-not-exist-xyz123.invalid/page")
      assertNotNull(result.error)
      assertTrue(result.error!!.contains("Fetch failed") || result.error!!.contains("not allowed"))
    }

    @Test
    fun fetchResultUrlIsPreserved() {
      val url = "https://nonexistent-domain-xyz.invalid/"
      val result = UrlFetcher.fetch(url)
      assertEquals(url, result.url)
    }

    @Test
    fun errorResultContainsDescriptiveMessage() {
      val result = UrlFetcher.fetch("not-a-valid-url-at-all")
      assertNotNull(result.error)
      assertTrue(result.error!!.isNotBlank())
    }
  }

  // endregion

  // region formatResultForModel — deeper coverage

  @Nested
  inner class FormatResultDeepTest {

    @Test
    fun successFormatContainsInstructions() {
      val result = UrlFetcher.FetchResult(url = "https://a.com", text = "Content")
      val output = UrlFetcher.formatResultForModel(result)
      assertTrue(output.contains("INSTRUCTIONS:"))
      assertTrue(output.contains("Markdown link"))
    }

    @Test
    fun errorFormatContainsInstructions() {
      val result = UrlFetcher.FetchResult(url = "https://a.com", error = "Timeout")
      val output = UrlFetcher.formatResultForModel(result)
      assertTrue(output.contains("INSTRUCTIONS:"))
      assertTrue(output.contains("could not read"))
    }

    @Test
    fun successWithBlankTitle() {
      val result = UrlFetcher.FetchResult(url = "https://a.com", title = "   ", text = "Content")
      val output = UrlFetcher.formatResultForModel(result)
      assertFalse(output.contains("TITLE:"), "Blank title should be excluded")
    }

    @Test
    fun successWithNullText() {
      val result = UrlFetcher.FetchResult(url = "https://a.com", title = "Title")
      val output = UrlFetcher.formatResultForModel(result)
      assertTrue(output.contains("PAGE CONTENT FROM:"))
    }
  }

  // endregion

  // region extractTextFromHtml (via reflection)

  @Nested
  inner class ExtractTextFromHtmlTest {

    private fun extractText(html: String): String {
      val method =
          UrlFetcher::class.java.getDeclaredMethod("extractTextFromHtml", String::class.java)
      method.isAccessible = true
      return method.invoke(UrlFetcher, html) as String
    }

    @Test
    fun stripsScriptTags() {
      val html = "<p>Hello</p><script>alert(1)</script><p>World</p>"
      val text = extractText(html)
      assertFalse(text.contains("alert"))
      assertTrue(text.contains("Hello"))
      assertTrue(text.contains("World"))
    }

    @Test
    fun stripsStyleTags() {
      val html = "<style>.foo{color:red}</style><p>Content</p>"
      val text = extractText(html)
      assertFalse(text.contains("color"))
      assertTrue(text.contains("Content"))
    }

    @Test
    fun stripsNavTags() {
      val html = "<nav><a href='/'>Home</a></nav><p>Main content</p>"
      val text = extractText(html)
      assertFalse(text.contains("Home"))
      assertTrue(text.contains("Main content"))
    }

    @Test
    fun stripsFooterTags() {
      val html = "<p>Body</p><footer>Copyright 2024</footer>"
      val text = extractText(html)
      assertFalse(text.contains("Copyright"))
      assertTrue(text.contains("Body"))
    }

    @Test
    fun stripsHeaderTags() {
      val html = "<header><h1>Logo</h1></header><p>Content here</p>"
      val text = extractText(html)
      assertFalse(text.contains("Logo"))
      assertTrue(text.contains("Content here"))
    }

    @Test
    fun stripsHtmlComments() {
      val html = "<p>Visible</p><!-- This is hidden --><p>Also visible</p>"
      val text = extractText(html)
      assertFalse(text.contains("hidden"))
      assertTrue(text.contains("Visible"))
    }

    @Test
    fun replacesBlockTagsWithNewlines() {
      val html = "<p>Para 1</p><p>Para 2</p><div>Div content</div>"
      val text = extractText(html)
      assertTrue(text.contains("Para 1"))
      assertTrue(text.contains("Para 2"))
      assertTrue(text.contains("Div content"))
    }

    @Test
    fun decodesHtmlEntities() {
      val html = "<p>5 &lt; 10 &amp; 10 &gt; 5 &quot;test&quot; &#39;quote&#39;</p>"
      val text = extractText(html)
      assertTrue(text.contains("5 < 10 & 10 > 5"))
      assertTrue(text.contains("\"test\""))
      assertTrue(text.contains("'quote'"))
    }

    @Test
    fun decodesNbsp() {
      val html = "<p>word1&nbsp;word2</p>"
      val text = extractText(html)
      assertTrue(text.contains("word1 word2"))
    }

    @Test
    fun decodesNumericEntities() {
      val html = "<p>&#65;&#66;&#67;</p>" // ABC
      val text = extractText(html)
      assertTrue(text.contains("ABC"))
    }

    @Test
    fun normalizesWhitespace() {
      val html = "<p>  lots   of    spaces  </p>"
      val text = extractText(html)
      assertFalse(text.contains("  "), "Should collapse multiple spaces: '$text'")
    }

    @Test
    fun normalizesNewlines() {
      val html = "<p>Line1</p>\n\n\n\n\n<p>Line2</p>"
      val text = extractText(html)
      assertFalse(text.contains("\n\n\n"), "Should collapse excessive newlines")
    }

    @Test
    fun handlesEmptyHtml() {
      val text = extractText("")
      assertEquals("", text)
    }

    @Test
    fun handlesPlainTextInput() {
      val text = extractText("Just plain text, no HTML tags")
      assertEquals("Just plain text, no HTML tags", text)
    }

    @Test
    fun stripsNestedScripts() {
      val html =
          "<script type='text/javascript'>var x = '<script>nested</script>';</script><p>OK</p>"
      val text = extractText(html)
      assertTrue(text.contains("OK"))
    }

    @Test
    fun handlesHeadingTags() {
      val html = "<h1>Title</h1><h2>Subtitle</h2><p>Content</p>"
      val text = extractText(html)
      assertTrue(text.contains("Title"))
      assertTrue(text.contains("Subtitle"))
      assertTrue(text.contains("Content"))
    }

    @Test
    fun handlesListItems() {
      val html = "<ul><li>Item 1</li><li>Item 2</li></ul>"
      val text = extractText(html)
      assertTrue(text.contains("Item 1"))
      assertTrue(text.contains("Item 2"))
    }

    @Test
    fun handlesTableRows() {
      val html = "<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>"
      val text = extractText(html)
      assertTrue(text.contains("Cell 1"))
      assertTrue(text.contains("Cell 2"))
    }
  }

  // endregion

  // region extractTitle (via reflection)

  @Nested
  inner class ExtractTitleTest {

    private fun extractTitle(body: String, contentType: String): String? {
      val method =
          UrlFetcher::class
              .java
              .getDeclaredMethod("extractTitle", String::class.java, String::class.java)
      method.isAccessible = true
      return method.invoke(UrlFetcher, body, contentType) as String?
    }

    @Test
    fun extractsTitleFromHtml() {
      val html = "<html><head><title>My Page</title></head><body></body></html>"
      assertEquals("My Page", extractTitle(html, "text/html"))
    }

    @Test
    fun returnsNullForNonHtmlContent() {
      assertNull(extractTitle("<title>Not HTML</title>", "text/plain"))
    }

    @Test
    fun returnsNullWhenNoTitleTag() {
      assertNull(extractTitle("<html><body>No title</body></html>", "text/html"))
    }

    @Test
    fun stripsTagsFromTitle() {
      val html = "<html><head><title><b>Bold</b> Title</title></head></html>"
      val title = extractTitle(html, "text/html; charset=utf-8")
      assertNotNull(title)
      assertTrue(title!!.contains("Bold"))
      assertTrue(title.contains("Title"))
      assertFalse(title.contains("<b>"))
    }

    @Test
    fun truncatesLongTitle() {
      val longTitle = "A".repeat(300)
      val html = "<html><head><title>$longTitle</title></head></html>"
      val title = extractTitle(html, "text/html")
      assertNotNull(title)
      assertTrue(title!!.length <= 200)
    }

    @Test
    fun handlesTitleWithWhitespace() {
      val html = "<html><head><title>  Trimmed Title  </title></head></html>"
      val title = extractTitle(html, "text/html")
      assertEquals("Trimmed Title", title)
    }

    @Test
    fun handlesApplicationXhtml() {
      val html = "<html><head><title>XHTML Page</title></head></html>"
      assertEquals("XHTML Page", extractTitle(html, "application/xhtml+xml"))
    }
  }

  // endregion

  // region isSafeUrl (via reflection)

  @Nested
  inner class IsSafeUrlTest {

    private fun isSafeUrl(url: String): Boolean {
      val method = UrlFetcher::class.java.getDeclaredMethod("isSafeUrl", String::class.java)
      method.isAccessible = true
      return method.invoke(UrlFetcher, url) as Boolean
    }

    @Test
    fun allowsPublicHttps() {
      assertTrue(isSafeUrl("https://example.com/page"))
    }

    @Test
    fun allowsPublicHttp() {
      assertTrue(isSafeUrl("http://example.com/page"))
    }

    @Test
    fun blocksLocalhost() {
      assertFalse(isSafeUrl("http://localhost/secret"))
    }

    @Test
    fun blocks127Range() {
      assertFalse(isSafeUrl("http://127.0.0.1/admin"))
      assertFalse(isSafeUrl("http://127.255.255.255/test"))
    }

    @Test
    fun blocksPrivate10() {
      assertFalse(isSafeUrl("http://10.0.0.1/internal"))
    }

    @Test
    fun blocksPrivate172() {
      assertFalse(isSafeUrl("http://172.16.0.1/"))
      assertFalse(isSafeUrl("http://172.31.255.255/"))
    }

    @Test
    fun allows172Outside() {
      assertTrue(isSafeUrl("http://172.32.0.1/page"))
      assertTrue(isSafeUrl("http://172.15.0.1/page"))
    }

    @Test
    fun blocksLinkLocal() {
      assertFalse(isSafeUrl("http://169.254.1.1/metadata"))
    }

    @Test
    fun blocksFtp() {
      assertFalse(isSafeUrl("ftp://example.com/file"))
    }

    @Test
    fun blocksNoScheme() {
      assertFalse(isSafeUrl("example.com/page"))
    }

    @Test
    fun blocksEmptyHost() {
      assertFalse(isSafeUrl("http:///path"))
    }
  }

  // endregion
}
