package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the `CODE` transport of the local API-doc (see
 * [`StructuredDataStoreAction.codeResponseJson()`][StructuredDataStoreAction]).
 *
 * The stored value is a whole JavaScript FILE, so its **line breaks are structure**. They used to
 * be stripped when the code was read back (`replace("\n", "")`), which turned every script into ONE
 * line — and because a `//` comment then comments out everything after it, the runtime's ES-module
 * import failed with a `SyntaxError`. The functionality was therefore never registered and the form
 * element stayed empty although the stored code was complete.
 *
 * The payloads are decoded exactly like the clients do it: JSON-parsed, then `<|>` restored to `"`.
 */
class LocalApiDocCodeTransportTest {

  /** Decodes a payload like `LocalDocInterface` / `importRemoteModule()` do. */
  private fun decode(payload: String): String =
      JsonParser.parseString(payload).asJsonObject.get("result").asString.replace("<|>", "\"")

  @Test
  fun `line breaks survive the transport`() {
    val code =
        """
        window.codbi.registerFunctionality('Mein.Rechner', (toLoad, toProcess) => {
          // Basic digit buttons
          const digits = ['7', '8', '9'];
          digits.forEach((d) => toProcess.appendChild(document.createElement('button')));
        });
        """
            .trimIndent()

    assertEquals(code, decode(StructuredDataStoreAction.codeResponseJson(code)))
  }

  @Test
  fun `a line comment never swallows the following statements`() {
    val code = "const a = 1;\n// comment\ntoProcess.appendChild(document.createElement('div'));"
    val decoded = decode(StructuredDataStoreAction.codeResponseJson(code))

    assertTrue(decoded.contains("\ntoProcess.appendChild"), decoded)
    assertEquals(3, decoded.lines().size, decoded)
  }

  @Test
  fun `quotes, backslashes and tabs are restored unchanged`() {
    val code = "toProcess.setAttribute('data-x', \"a\\\\b\");\n\ttoProcess.id = 'rechner';"

    assertEquals(code, decode(StructuredDataStoreAction.codeResponseJson(code)))
  }

  @Test
  fun `the NONE marker stays a single valid value`() {
    assertEquals("NONE", decode(StructuredDataStoreAction.codeResponseJson("NONE")))
  }
}
