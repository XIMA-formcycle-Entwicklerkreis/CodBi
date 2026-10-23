package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * "Secure the form with a password with special characters, upper and lower case" must produce an
 * FC_SET_FORM_RECORD_PASSWORD node in GENERATED mode with exactly those rules — the old reference
 * told the model to use MANUALLY_ENTERED_PASSWORD **without** a value, which CLEARS the password.
 */
class SetRecordPasswordNodeTest {

  private fun resource(path: String): String =
      SetRecordPasswordNodeTest::class
          .java
          .classLoader
          .getResourceAsStream(path)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $path not found on the classpath")

  private val detailed =
      resource("com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-workflow-nodes.md")
  private val compact =
      resource(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/formcycle-workflow-nodes-compact.md")
  private val taskInstruction =
      resource(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-workflow-task-instruction.md")
  private val clarification =
      resource("com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md")

  // region the params builder

  @Test
  fun `the requested character rules become a generated password`() {
    val json =
        SetRecordPasswordParams.propsJson(
            mapOf(
                "policyRuleSymbol" to true,
                "policyRuleUppercase" to true,
                "policyRuleLowercase" to true,
                "policyRuleDigit" to false))
    assertTrue(json.contains("\"targetType\":\"GENERATED_PASSWORD\""), json)
    assertTrue(json.contains("\"policyRuleSymbol\":true"), json)
    assertTrue(json.contains("\"policyRuleUppercase\":true"), json)
    assertTrue(json.contains("\"policyRuleLowercase\":true"), json)
    // Unasked rules are explicit false — never silently enabled.
    assertTrue(json.contains("\"policyRuleDigit\":false"), json)
    assertTrue(json.contains("\"policyRuleAlphabetical\":false"), json)
    assertTrue(json.contains("\"generatedLength\":12"), json)
  }

  @Test
  fun `a rules list and a length are honoured`() {
    val json =
        SetRecordPasswordParams.propsJson(
            mapOf("characterRules" to listOf("symbols", "upper"), "passwordLength" to 20))
    assertTrue(json.contains("\"generatedLength\":20"), json)
    assertTrue(json.contains("\"policyRuleSymbol\":true"), json)
    assertTrue(json.contains("\"policyRuleUppercase\":true"), json)
    assertTrue(json.contains("\"policyRuleLowercase\":false"), json)
  }

  @Test
  fun `a length shorter than the rule count is bumped`() {
    val json =
        SetRecordPasswordParams.propsJson(
            mapOf(
                "generatedLength" to 3,
                "policyRuleLowercase" to true,
                "policyRuleUppercase" to true,
                "policyRuleDigit" to true,
                "policyRuleSymbol" to true))
    assertTrue(json.contains("\"generatedLength\":4"), json)
  }

  @Test
  fun `no rules fall back to letters plus digits plus symbols`() {
    val json = SetRecordPasswordParams.propsJson(emptyMap())
    assertTrue(json.contains("\"targetType\":\"GENERATED_PASSWORD\""), json)
    assertTrue(json.contains("\"policyRuleAlphabetical\":true"), json)
    assertTrue(json.contains("\"policyRuleDigit\":true"), json)
    assertTrue(json.contains("\"policyRuleSymbol\":true"), json)
    assertTrue(json.contains("\"policyRuleLowercase\":false"), json)
  }

  @Test
  fun `manual mode without a value clears the password`() {
    val json = SetRecordPasswordParams.propsJson(mapOf("targetType" to "MANUALLY_ENTERED_PASSWORD"))
    assertTrue(json.contains("\"targetType\":\"MANUALLY_ENTERED_PASSWORD\""), json)
    assertFalse(json.contains("inputPassword"), json)
    assertFalse(json.contains("generatedLength"), json)
  }

  @Test
  fun `manual mode keeps an explicitly supplied value`() {
    val json =
        SetRecordPasswordParams.propsJson(
            mapOf("targetType" to "MANUALLY_ENTERED_PASSWORD", "inputPassword" to "abc"))
    assertTrue(json.contains("\"inputPassword\":\"abc\""), json)
  }

  // endregion the params builder

  @Test
  fun `the references describe the generated default and the status flag`() {
    for (doc in listOf(detailed, compact)) {
      assertTrue(doc.contains("### FC_SET_FORM_RECORD_PASSWORD"), "missing section")
      assertTrue(doc.contains("GENERATED_PASSWORD"), "must document the generated mode")
      assertTrue(doc.contains("policyRuleSymbol"), "must document the rule flags")
      assertTrue(doc.contains("allowFormPassword"), "must link the status flag")
      assertTrue(
          doc.contains("PASSWORD_LENGTH_TOO_SHORT") || doc.contains("length"),
          "must warn about the length/rule-count relation")
    }
  }

  @Test
  fun `the old clear-only guidance is gone`() {
    for (doc in listOf(detailed, compact)) {
      assertFalse(
          doc.contains("Use Mode 1 (MANUALLY_ENTERED_PASSWORD) WITHOUT any"),
          "the clear-only instruction must not survive")
    }
  }

  @Test
  fun `the build instruction routes the intent to the node`() {
    val line = taskInstruction.lines().first { it.contains("FC_SET_FORM_RECORD_PASSWORD") }
    assertTrue(line.contains("GENERATED_PASSWORD"), "must ask for the generated mode")
    assertTrue(line.contains("policyRuleSymbol"), "must map the character rules")
    assertTrue(line.contains("allowFormPassword"), "must enable the status flag")
    assertTrue(line.contains("Sonderzeichen"), "must recognise the German phrasing")
  }

  @Test
  fun `the clarification round never asks for a password value`() {
    val idx = clarification.indexOf("RECORD-LEVEL NODES WITH NOTHING TO CLARIFY")
    assertTrue(idx > 0, "the clarification prompt must carry the rule")
    val rule = clarification.substring(idx, minOf(clarification.length, idx + 1200)).lowercase()
    assertTrue(rule.contains("fc_set_form_record_password"), "must name the node")
    assertTrue(rule.contains("generated mode"), "must state the generated mode")
    assertTrue(rule.contains("never ask for a password value"), "must forbid the value question")
  }
}
