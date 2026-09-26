package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [CodbiCapabilities.buildNameIndexSection], the NAME-ONLY element/EP/standard list the
 * pass-2 apply prompt now sends instead of the ~20KB condensed catalog prose (the full text is
 * still sent for every id the AI actually requested).
 *
 * Without a DB the object falls back to the bundled `codbi-core-elements-compact.md`, so these
 * tests exercise the real production resource.
 */
class CodbiCapabilitiesNameIndexTest {

  @Test
  fun `name index lists the authoritative ids of all three groups`() {
    val idx = CodbiCapabilities.buildNameIndexSection()
    assertTrue(idx.startsWith("## CODBI NAME INDEX"), "unexpected header: ${idx.take(120)}")
    // Functionalities.
    assertTrue(idx.contains("\n- HTML.Panel\n"), "missing HTML.Panel")
    assertTrue(idx.contains("\n- Date.Frame\n"), "missing Date.Frame")
    assertTrue(idx.contains("\n- OpenPLZ.Autocomplete\n"), "missing OpenPLZ.Autocomplete")
    // Element placeholders — the single-letter ids must survive the extraction.
    assertTrue(idx.contains("\n- JSON.Path\n"), "missing JSON.Path")
    assertTrue(idx.contains("\n- V\n"), "missing the single-letter id V")
    assertTrue(idx.contains("\n- F\n"), "missing the single-letter id F")
    // Standard configurations.
    assertTrue(idx.contains("\n- Holistic.CSS.Standard\n"), "missing Holistic.CSS.Standard")
    assertTrue(idx.contains("\n- People\n"), "missing People")
  }

  @Test
  fun `name index carries ids only, never the entry prose`() {
    val idx = CodbiCapabilities.buildNameIndexSection()
    val bullets = idx.lines().filter { it.startsWith("- ") }
    assertTrue(bullets.size > 80, "expected the full id list, got ${bullets.size} entries")
    // Every bullet is exactly one entry id. Spaces are ALLOWED (a locally documented element may be
    // named "Matomo Tracking"), so only the shape is asserted: non-empty, single-line, no marker.
    assertTrue(
        bullets.all { line ->
          val id = line.removePrefix("- ")
          id.isNotBlank() && !id.contains('\t') && !id.contains('\n') && !id.startsWith("- ")
        },
        "a bullet is not a plain id: ${bullets.firstOrNull { !it.removePrefix("- ").isNotBlank() }}")
    // The prose of well-known entries is gone.
    assertFalse(
        idx.contains("Applicable on any element to wrap it in a collapsible accordion"),
        "entry prose leaked into the name index")
    assertFalse(idx.contains("MANDATORY"), "entry prose leaked into the name index")
  }

  @Test
  fun `entry ids keep local element names that contain spaces`() {
    // A local API-Doc element (or a DB display name) may contain spaces — e.g. "Matomo Tracking".
    // Such a name MUST survive the extraction: those are exactly the locally configured elements
    // that
    // have AI fields and uploaded code, and pass-1 advertises them via buildSectionCondensed. A
    // "space-free" filter would silently hide them from the pass-2 name index.
    val markdown =
        "# Title\n\n## Functionalities\n\n### AI.LLAMA.CHAT\nbody\n\n### Matomo Tracking\nbody\n\n" +
            "## Element Placeholders\n\n### F\nbody\n"
    assertEquals(
        listOf("AI.LLAMA.CHAT", "Matomo Tracking", "F"), CodbiCapabilities.entryIdsOf(markdown))
  }

  @Test
  fun `name index is a fraction of the condensed catalog it replaces`() {
    // The condensed catalog (elements section) is ~20KB and almost all of it is prose; the name
    // index
    // must stay small so the pass-2 saving is real.
    val idx = CodbiCapabilities.buildNameIndexSection()
    assertTrue(idx.length in 1..6000, "name index was ${idx.length} chars")
  }
}
