package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests the documentation-comment extraction that lets the form-run AI learn a local element's
 * parameter details (e.g. `data-cb-layout` "normal"|"scientific") directly from the element's code.
 *
 * The regression scenario: applying the local calculator (`Lokaler.Rechner`) set `data-cb-func` but
 * not `data-cb-layout="scientific"`, because the `Parameters:`/`Wiring:`/`Example:` block lives
 * only in the leading comment of the element's code — which was never transmitted to the AI.
 */
class LocalApiDocPromptsTest {

  @Test
  fun `extracts the leading TSDoc comment with Parameters Wiring and Example`() {
    val code =
        """
        /*
         * Lokaler.Rechner
         * Parameters:
         * - data-cb-layout (enum): "normal" or "scientific"
         * - data-cb-extravalue (string): the value to process (default empty)
         * Wiring: add data-cb-func="Lokaler.Rechner" and data-cb-layout="scientific" ("scientific")
         * Example: <input type="text" data-cb-func="Lokaler.Rechner" data-cb-layout="scientific" data-cb-extravalue="π" />
         */
        window.codbi.registerFunctionality('Lokaler.Rechner', (toLoad, toProcess) => {
          toProcess.appendChild(wrapper);
        });
        """
            .trimIndent()

    val doc = LocalApiDocPrompts.extractDocumentationComment(code)!!

    assertTrue(doc.contains("data-cb-layout"), "comment should expose the layout parameter")
    assertTrue(doc.contains("scientific"), "comment should list the enum value scientific")
    assertTrue(doc.contains("data-cb-extravalue"), "comment should expose the extravalue parameter")
    assertTrue(doc.contains("Wiring:"), "comment should include the wiring section")
    assertFalse(
        doc.contains("registerFunctionality"),
        "the executable JavaScript must NOT be transmitted to the AI")
    assertFalse(
        doc.contains("appendChild"),
        "the executable JavaScript body must NOT be part of the comment")
  }

  @Test
  fun `ignores line comments in the middle of the script`() {
    val code =
        """
        // only this leading line is documentation
        window.codbi.foo();
        // a later comment is NOT documentation
        window.codbi.bar();
        """
            .trimIndent()

    val doc = LocalApiDocPrompts.extractDocumentationComment(code)!!

    assertTrue(doc.contains("only this leading line"))
    assertFalse(doc.contains("a later comment"))
    assertFalse(doc.contains("foo"))
    assertFalse(doc.contains("bar"))
  }

  @Test
  fun `ignores block comments in the middle of the script`() {
    val code =
        """
        /* leading docs */
        window.codbi.foo();
        /* trailing comment must be ignored */
        window.codbi.bar();
        """
            .trimIndent()

    val doc = LocalApiDocPrompts.extractDocumentationComment(code)!!

    assertTrue(doc.contains("leading docs"))
    assertFalse(doc.contains("trailing comment"))
    assertFalse(doc.contains("foo"))
    assertFalse(doc.contains("bar"))
  }

  @Test
  fun `returns null when the code has no leading comment`() {
    assertEqualsCode(null, "window.codbi.foo();\nwindow.codbi.bar();")
    assertEqualsCode(null, "  window.codbi.foo();")
  }

  @Test
  fun `returns null for blank code`() {
    assertNull(LocalApiDocPrompts.extractDocumentationComment(""))
    assertNull(LocalApiDocPrompts.extractDocumentationComment("   \n  "))
    assertNull(LocalApiDocPrompts.extractDocumentationComment(null))
  }

  /** Asserts that extraction of [code] yields [expected], both normalised to its trimmed form. */
  private fun assertEqualsCode(expected: String?, code: String) {
    val doc = LocalApiDocPrompts.extractDocumentationComment(code)
    if (expected == null) {
      assertNull(doc)
    } else {
      assertTrue(
          doc != null && doc.trim() == expected.trim(), "expected '$expected' but got '$doc'")
    }
  }
}
