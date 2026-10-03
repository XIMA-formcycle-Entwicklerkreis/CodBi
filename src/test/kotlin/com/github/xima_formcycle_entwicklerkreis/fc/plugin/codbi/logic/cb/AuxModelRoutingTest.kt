package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import java.util.Properties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Lever 9 — per-role auxiliary model routing (`AI_Assistant_AuxModel` /
 * `AI_Assistant_AuxModel_<role>`).
 *
 * The CRITICAL invariant is FAIL-OPEN / IDENTITY: with no aux-model property configured, the
 * routing MUST return the run's selected model verbatim for every role, so the feature is a strict
 * no-op until it is deliberately enabled. This is the guarantee that an unconfigured assistant
 * behaves byte-for-byte as before the feature existed — the exact condition under which the earlier
 * attempt was (wrongly) suspected of changing behaviour.
 */
class AuxModelRoutingTest {

  @Test
  fun `routeAuxModel returns the selected model when no override is set`() {
    assertEquals(
        "ext-specialist:cerebras", AICodBiAssistant.routeAuxModel("ext-specialist:cerebras", null))
  }

  @Test
  fun `routeAuxModel ignores a blank override`() {
    assertEquals("standard", AICodBiAssistant.routeAuxModel("standard", ""))
    assertEquals("standard", AICodBiAssistant.routeAuxModel("standard", "   "))
  }

  @Test
  fun `routeAuxModel returns the override when it is present`() {
    assertEquals("specialist:mini", AICodBiAssistant.routeAuxModel("standard", "specialist:mini"))
  }

  @Test
  fun `parseAuxModels yields an empty map when nothing is configured`() {
    assertTrue(AICodBiAssistant.parseAuxModels(Properties()).isEmpty())
  }

  @Test
  fun `an empty map is inert for every role`() {
    val map = AICodBiAssistant.parseAuxModels(Properties())
    for (role in AICodBiAssistant.AuxRole.values()) {
      assertEquals(
          "ext-specialist:cerebras",
          AICodBiAssistant.routeAuxModel("ext-specialist:cerebras", map[role]))
    }
  }

  @Test
  fun `parseAuxModels applies the global value to every role`() {
    val props = Properties().apply { setProperty("AI_Assistant_AuxModel", "specialist:mini") }
    val map = AICodBiAssistant.parseAuxModels(props)
    for (role in AICodBiAssistant.AuxRole.values()) {
      assertEquals("specialist:mini", map[role])
    }
  }

  @Test
  fun `parseAuxModels lets a per-role value win over the global`() {
    val props =
        Properties().apply {
          setProperty("AI_Assistant_AuxModel", "specialist:mini")
          setProperty("AI_Assistant_AuxModel_translate", "thinking")
        }
    val map = AICodBiAssistant.parseAuxModels(props)
    assertEquals("specialist:mini", map[AICodBiAssistant.AuxRole.CLASSIFY])
    assertEquals("specialist:mini", map[AICodBiAssistant.AuxRole.CLARIFY])
    assertEquals("specialist:mini", map[AICodBiAssistant.AuxRole.REPAIR])
    assertEquals("thinking", map[AICodBiAssistant.AuxRole.TRANSLATE])
  }

  @Test
  fun `parseAuxModels ignores blank global and per-role values`() {
    val props =
        Properties().apply {
          setProperty("AI_Assistant_AuxModel", "   ")
          setProperty("AI_Assistant_AuxModel_repair", "")
        }
    assertTrue(AICodBiAssistant.parseAuxModels(props).isEmpty())
  }

  @Test
  fun `a partially configured set leaves the unset roles on the selected model`() {
    // The exact request: set ONLY `_translate`; every other role must keep the assistant's
    // selected model. The map then contains ONLY TRANSLATE, so routeAuxModel is the identity for
    // the three absent roles.
    val props = Properties().apply { setProperty("AI_Assistant_AuxModel_translate", "thinking") }
    val map = AICodBiAssistant.parseAuxModels(props)
    val selected = "ext-specialist:cerebras"
    assertEquals(
        "thinking",
        AICodBiAssistant.routeAuxModel(selected, map[AICodBiAssistant.AuxRole.TRANSLATE]))
    assertEquals(
        selected, AICodBiAssistant.routeAuxModel(selected, map[AICodBiAssistant.AuxRole.CLASSIFY]))
    assertEquals(
        selected, AICodBiAssistant.routeAuxModel(selected, map[AICodBiAssistant.AuxRole.CLARIFY]))
    assertEquals(
        selected, AICodBiAssistant.routeAuxModel(selected, map[AICodBiAssistant.AuxRole.REPAIR]))
  }

  @Test
  fun `a global value plus a few per-role overrides mixes correctly`() {
    // Global wins for the roles WITHOUT their own property; per-role wins where present.
    val props =
        Properties().apply {
          setProperty("AI_Assistant_AuxModel", "specialist:mini")
          setProperty("AI_Assistant_AuxModel_classify", "specialist:tiny")
        }
    val map = AICodBiAssistant.parseAuxModels(props)
    assertEquals("specialist:tiny", map[AICodBiAssistant.AuxRole.CLASSIFY])
    assertEquals("specialist:mini", map[AICodBiAssistant.AuxRole.CLARIFY])
    assertEquals("specialist:mini", map[AICodBiAssistant.AuxRole.REPAIR])
    assertEquals("specialist:mini", map[AICodBiAssistant.AuxRole.TRANSLATE])
  }
}
