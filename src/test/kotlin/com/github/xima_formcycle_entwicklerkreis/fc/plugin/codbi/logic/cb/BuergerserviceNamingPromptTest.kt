package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Lever #2.2 of the input-token optimisation: the Bürger-Services naming block
 * (`codbi-buergerservice-naming.md`, previously ~11.8 KB) is condensed to the authoritative
 * canonical-ID catalog plus the mandatory hard rules, dropping the verbose
 * explanation/worked-example prose. The block is shipped on BOTH pass-1 and pass-2 whenever
 * `useBuergerserviceNaming` is set, so every byte cut here is paid twice per run.
 *
 * These tests run against the REAL bundled prompt file (not a fixture), so a future edit that trims
 * a canonical name, drops a hard rule or bloats the block back up fails the build instead of
 * silently shipping either a wrong name or dead weight into every Bürger-Services run.
 */
class BuergerserviceNamingPromptTest {

  private val resource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-buergerservice-naming.md"

  private fun namingPrompt(): String =
      BuergerserviceNamingPromptTest::class
          .java
          .classLoader
          .getResourceAsStream(resource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")

  @Test
  fun `canonical technical ids of all four groups are preserved`() {
    val p = namingPrompt()
    // Person / Antragsteller.
    assertTrue(p.contains("`tfAntragstellerVorname`"), "missing person Vorname id")
    assertTrue(p.contains("`tfAntragstellerName`"), "missing person Name id")
    assertTrue(p.contains("`tfAntragstellerPLZ`"), "missing person PLZ id")
    assertTrue(p.contains("`selAntragstellerGeschlecht`"), "missing person Geschlecht id")
    // Organisation / ELSTER.
    assertTrue(p.contains("`tfOrgName`"), "missing org Name id")
    assertTrue(p.contains("`tfOrgRechtsformText`"), "missing org Rechtsform id")
    assertTrue(p.contains("`tfOrgRegisterNummer`"), "missing org Registernummer id")
    // ELSTER / authentication / system fields.
    assertTrue(p.contains("`selOrgPersTyp`"), "missing mandatory selOrgPersTyp")
    assertTrue(p.contains("`BPK2`"), "missing mandatory BPK2")
    assertTrue(p.contains("`TrustLevel`"), "missing mandatory TrustLevel")
    assertTrue(p.contains("`tfDatenkranzTyp`"), "missing DatenkranzTyp")
    // Common convention fields.
    assertTrue(p.contains("`tfStrasse`"), "missing tfStrasse")
    assertTrue(p.contains("`tfHausnummer`"), "missing tfHausnummer")
    assertTrue(p.contains("`tfIBAN`"), "missing tfIBAN")
    assertTrue(p.contains("`tfBetrag`"), "missing tfBetrag")
  }

  @Test
  fun `the fieldset names and the exact-name hard rule are preserved`() {
    val p = namingPrompt()
    assertTrue(p.contains("`fsBKDaten`"), "missing fsBKDaten fieldset")
    assertTrue(p.contains("`fsBKOrgDaten`"), "missing fsBKOrgDaten fieldset")
    assertTrue(p.contains("`fsBKAllDaten`"), "missing fsBKAllDaten fieldset")
    assertTrue(
        p.contains("`tfAntragstellerVorname` — ONE \"s\" in \"Antragsteller\""),
        "the exact-spelling rule must survive")
    assertTrue(p.contains("noRibbon"), "missing the noRibbon rule")
  }

  @Test
  fun `the mandatory auth fields of an ELSTER organisation fieldset are enforced`() {
    val p = namingPrompt()
    assertTrue(
        p.contains("`selOrgPersTyp`, `BPK2`, `TrustLevel` — NEVER omit them"),
        "the mandatory fsBKOrgDaten auth fields must be stated")
  }

  @Test
  fun `the field-creation imperative is preserved so input fields are generated`() {
    // Regression guard for the "input fields are not generated anymore" bug that arose when the
    // condensation dropped the "include that method's mandatory fields" instruction. Without this
    // imperative the model creates the fieldset but leaves its `elements` empty (no input fields).
    val p = namingPrompt()
    assertTrue(
        p.contains("must NEVER be left empty"), "a Bürger-Services fieldset must never be empty")
    assertTrue(
        p.contains("include that method's mandatory fields"),
        "the per-login-method mandatory-fields instruction must survive")
    assertTrue(
        p.contains("Always mandatory (every method)"),
        "the always-mandatory auth field list must be present")
    assertTrue(
        p.contains(
            "`tfAntragstellerVorname`, `tfAntragstellerName`, `tfAntragstellerGeburtsdatum`"),
        "the person-identity fields the fsBKDaten fieldset must contain are missing")
  }

  @Test
  fun `any created container must be populated not just the fsBK fieldsets`() {
    // Strengthened guard: the AI can create a generic container (e.g. `fdPersonData`) instead of
    // the
    // literal `fsBKDaten`/`fsBK*` fieldsets. The imperative must apply to ANY fieldset/container
    // the
    // model creates for Bürger-Services data, not only the recognised `fsBK…` names.
    val p = namingPrompt()
    assertTrue(
        p.contains("FIELDSETS / CONTAINERS"),
        "the headings must cover both fieldsets and generic containers")
    assertTrue(
        p.contains("EMPTY `elements` array"), "the empty-container prohibition must be explicit")
    assertTrue(
        p.contains("must NEVER be left empty"), "any container (not just fsBK*) must be populated")
    assertTrue(
        p.contains("fdPersonData"),
        "a generic person-data container (e.g. fdPersonData) must be explicitly covered")
    assertTrue(
        p.contains("Person data container"),
        "the person-identity fields must be tied to any person-data container, not only fsBKDaten")
  }

  @Test
  fun `the antisocial autofill rules are preserved and cannot silently disappear`() {
    val p = namingPrompt()
    // No data-cb-func on the auth-filled fields.
    assertTrue(p.contains("Do NOT add `data-cb-func`"), "missing the no-data-cb-func rule")
    assertTrue(p.contains("tfAntragsteller"), "must name the affected field prefix")
    // No LDAP autocomplete for a citizen.
    assertTrue(p.contains("LDAP"), "the LDAP prohibition must be present")
    assertTrue(p.contains("citizen"), "the citizen-not-in-AD rationale must be present")
    // Address-autocomplete special case.
    assertTrue(p.contains("`tfStrasse`"), "address autocomplete uses tfStrasse")
    assertTrue(
        p.contains("CodBi_OpenPLZ_AC_SET_Street"), "street autocomplete class must be present")
  }

  @Test
  fun `the verbose explanation prose is gone`() {
    val p = namingPrompt()
    // Removed survey/filler sections.
    assertFalse(
        p.contains("FILL & VERIFICATION SEMANTICS"),
        "the verbose fill/verification essay must be gone")
    assertFalse(
        p.contains("AUTH METHOD → FIELD REQUIREMENTS"),
        "the verbose auth-method essay must be gone")
    assertFalse(
        p.contains("Column values mean:"), "the catalog-semantics teaching paragraph must be gone")
    assertFalse(
        p.contains("condensed from the catalog"),
        "the 'condensed from the catalog' heading must be gone")
  }

  @Test
  fun `the block is a small fraction of the original eleven-kilobyte reference`() {
    val p = namingPrompt()
    // Original file measured at ~11800 chars. The condensed authoritative catalog must stay well
    // under that (target: shave the ~2-3k token cost of the prose, paid twice per run). The
    // field-creation strengthening is legitimate, but any real regression back toward the ~11.8k
    // original must still fail.
    assertTrue(p.length < 8500, "naming block grew back to ${p.length} chars")
  }
}
