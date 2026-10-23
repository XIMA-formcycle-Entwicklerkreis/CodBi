package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.Gson

/**
 * Builds the `nodeParams` of an FC_SET_FORM_RECORD_PASSWORD node.
 *
 * From `FcSetFormRecordPasswordProps` (formcycle 8.5.3): `targetType` = `GENERATED_PASSWORD |
 * MANUALLY_ENTERED_PASSWORD`, `generatedLength` (1…255), `inputPassword` and the five `policyRule*`
 * flags. The executor hashes the value and stores it on the record; `GENERATED_PASSWORD` uses
 * passay with one [CharacterRule] per enabled flag, and fails with PASSWORD_LENGTH_TOO_SHORT when
 * more rules are enabled than the requested length. With NO rule enabled it falls back to letters +
 * digits + symbols.
 *
 * "Secure the form with a password" therefore means GENERATED mode with the requested rules —
 * MANUALLY_ENTERED_PASSWORD without a value CLEARS the password instead.
 */
internal object SetRecordPasswordParams {

  private val gson = Gson()

  /** Accepts the model's alternative spellings for each policy rule. */
  private val RULE_ALIASES: Map<String, List<String>> =
      mapOf(
          "policyRuleAlphabetical" to listOf("policyRuleAlphabetical", "alphabetical", "letters"),
          "policyRuleLowercase" to listOf("policyRuleLowercase", "lowercase", "lower"),
          "policyRuleUppercase" to listOf("policyRuleUppercase", "uppercase", "upper"),
          "policyRuleDigit" to listOf("policyRuleDigit", "digits", "digit", "numbers"),
          "policyRuleSymbol" to
              listOf("policyRuleSymbol", "symbols", "symbol", "specialChars", "specialCharacters"))

  private val MANUAL_TYPES =
      setOf("MANUALLY_ENTERED_PASSWORD", "MANUALLYENTEREDPASSWORD", "MANUAL", "MANUALPASSWORD")

  private fun booleanOf(value: Any?): Boolean? =
      when (value) {
        is Boolean -> value
        is String ->
            when (value.trim().lowercase()) {
              "true",
              "yes",
              "ja",
              "1" -> true
              "false",
              "no",
              "nein",
              "0" -> false
              else -> null
            }
        is Number -> value.toInt() != 0
        else -> null
      }

  /**
   * Returns the complete `nodeParams` JSON object body (no name/description) for the given model
   * `nodeParams`, always choosing a mode that can actually run.
   */
  fun propsJson(nodeParams: Map<String, Any?>): String {
    val rawType = (nodeParams["targetType"] as? String)?.trim().orEmpty()
    val manual =
        rawType.uppercase().replace(" ", "_") in MANUAL_TYPES ||
            booleanOf(nodeParams["clearPassword"]) == true
    val inputPassword =
        listOf("inputPassword", "passwordValue", "password")
            .firstNotNullOfOrNull { key ->
              (nodeParams[key] as? String)?.trim()?.takeIf { it.isNotEmpty() }
            }
            .orEmpty()

    if (manual) {
      // A value is only ever passed through when the model supplied one explicitly; an absent value
      // CLEARS the record password (the documented clearing mode).
      val passwordJson =
          if (inputPassword.isNotEmpty()) ""","inputPassword":${gson.toJson(inputPassword)}"""
          else ""
      return """"targetType":"MANUALLY_ENTERED_PASSWORD"$passwordJson"""
    }

    // Which rules did the model ask for? Explicit flags win; a rules list is accepted as fallback.
    val requested = mutableMapOf<String, Boolean>()
    var sawExplicitFlag = false
    for ((canonical, aliases) in RULE_ALIASES) {
      for (alias in aliases) {
        val parsed = booleanOf(nodeParams[alias]) ?: continue
        sawExplicitFlag = true
        requested[canonical] = (requested[canonical] ?: false) || parsed
      }
    }
    val rulesList =
        (nodeParams["characterRules"] as? List<*>)
            ?: (nodeParams["rules"] as? List<*>)
            ?: (nodeParams["policyRules"] as? List<*>)
    rulesList?.forEach { entry ->
      val name = (entry as? String)?.trim()?.lowercase() ?: return@forEach
      val canonical =
          RULE_ALIASES.entries
              .firstOrNull { (canonical, aliases) ->
                canonical.lowercase() == name || aliases.any { it.lowercase() == name }
              }
              ?.key ?: return@forEach
      sawExplicitFlag = true
      requested[canonical] = true
    }
    val flags =
        if (sawExplicitFlag) {
          RULE_ALIASES.keys.associateWith { requested[it] ?: false }
        } else {
          // Executor fallback (letters + digits + symbols) made explicit, so the result is stable.
          RULE_ALIASES.keys.associateWith {
            it != "policyRuleLowercase" && it != "policyRuleUppercase"
          }
        }
    val activeRules = flags.count { it.value }

    val requestedLength =
        listOf("generatedLength", "passwordLength", "length").firstNotNullOfOrNull { key ->
          when (val raw = nodeParams[key]) {
            is Number -> raw.toInt()
            is String -> raw.trim().toIntOrNull()
            else -> null
          }
        } ?: 12
    // passay needs at least one character per rule — bump instead of failing at runtime.
    val length = maxOf(requestedLength, activeRules, 1).coerceAtMost(255)

    val flagsJson =
        RULE_ALIASES.keys.joinToString(",") { key -> """"$key":${flags[key] == true}""" }
    return """"targetType":"GENERATED_PASSWORD","generatedLength":$length,$flagsJson"""
  }
}
