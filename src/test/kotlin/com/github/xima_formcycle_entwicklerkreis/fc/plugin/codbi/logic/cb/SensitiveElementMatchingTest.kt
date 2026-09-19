package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import java.util.Properties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests the sensitive-element mechanism for FORMCYCLE elements:
 * - [AiAssistantLog.usedSensitiveElements] must match a configured FORMCYCLE widget class name
 *   (`XTextField`) both when the AI CREATES the widget and when it only writes into an EXISTING
 *   one.
 * - [AiAssistantLog.usedSensitiveWorkflowElements] must match a configured workflow node type
 *   (`FC_EMAIL`), trigger type or node name in the workflow change description.
 * - [FormcycleElementFilter] must honor the `AI_FormAssistant_ForbiddenElements_*` lists for
 *   FORMCYCLE widgets / workflow nodes (they are not CodBi prompt records).
 */
class SensitiveElementMatchingTest {

  private fun formChanges(json: String) = JsonParser.parseString(json).asJsonObject

  /** A change description as produced by `AiAssistantLog.computeFormChanges`. */
  private val changes =
      formChanges(
          """
          {
            "widgetsCreated": [ { "name": "tfName", "className": "XTextField" } ],
            "widgetsRemoved": [ { "name": "tfOld", "className": "XUpload" } ],
            "classesSet": [
              { "widget": "tfEmail", "className": "XTextField", "classes": ["CodBi_People_Mail"] }
            ],
            "attributesSet": [
              {
                "widget": "tfNote",
                "className": "XTextArea",
                "attributes": [
                  { "name": "value", "value": "<img src=x onerror=alert(1)>", "kind": "attr", "codbi": false },
                  { "name": "data-cb-func", "value": "HTML.CSS", "kind": "func", "codbi": true }
                ]
              }
            ],
            "variablesSet": [ { "name": "HTML_PANEL_FOLDED", "value": "true" } ]
          }
          """
              .trimIndent())

  @Test
  fun `a created FORMCYCLE widget is sensitive`() {
    assertEquals(
        listOf("xtextfield"), AiAssistantLog.usedSensitiveElements(changes, setOf("xtextfield")))
  }

  @Test
  fun `a FORMCYCLE widget written into as an existing element is sensitive`() {
    // tfNote/tfEmail are NOT in widgetsCreated — they are only changed, which is the case that must
    // catch harmful HTML/code written into an existing XTextArea / XTextField.
    assertEquals(
        listOf("xtextarea"), AiAssistantLog.usedSensitiveElements(changes, setOf("xtextarea")))
  }

  @Test
  fun `a removed FORMCYCLE widget is sensitive`() {
    assertEquals(listOf("xupload"), AiAssistantLog.usedSensitiveElements(changes, setOf("xupload")))
  }

  @Test
  fun `the matching stays token based`() {
    // "XTextFieldAdvanced" must not match a configured "XTextField".
    assertTrue(AiAssistantLog.usedSensitiveElements(changes, setOf("xtextfieldadvanced")).isEmpty())
  }

  @Test
  fun `CodBi elements keep matching`() {
    assertEquals(
        listOf("html.css"), AiAssistantLog.usedSensitiveElements(changes, setOf("html.css")))
    assertEquals(
        listOf("codbi_people_mail"),
        AiAssistantLog.usedSensitiveElements(changes, setOf("codbi_people_mail")))
    assertEquals(
        listOf("html_panel_folded"),
        AiAssistantLog.usedSensitiveElements(changes, setOf("html_panel_folded")))
  }

  @Test
  fun `workflow nodes and triggers are sensitive`() {
    val workflow =
        JsonParser.parseString(
                """
                [
                  {
                    "name": "Benachrichtigung",
                    "trigger": "FC_FORM_SUBMIT_BUTTON",
                    "elements": [
                      {
                        "name": "E-Mail senden",
                        "nodeType": "FC_EMAIL",
                        "params": { "to": "kunde@example.com", "subject": "Danke" }
                      }
                    ]
                  }
                ]
                """
                    .trimIndent())
            .asJsonArray

    assertEquals(
        listOf("fc_email"),
        AiAssistantLog.usedSensitiveWorkflowElements(workflow, setOf("fc_email")))
    assertEquals(
        listOf("fc_form_submit_button"),
        AiAssistantLog.usedSensitiveWorkflowElements(workflow, setOf("fc_form_submit_button")))
    assertTrue(
        AiAssistantLog.usedSensitiveWorkflowElements(workflow, setOf("fc_sql_statement")).isEmpty())
    assertTrue(AiAssistantLog.usedSensitiveWorkflowElements(null, setOf("fc_email")).isEmpty())
  }

  @Test
  fun `forbidden FORMCYCLE widgets and workflow nodes are hidden from the AI`() {
    val props =
        Properties().apply {
          // A user NOT listed here receives the "NonSyncUsers" forbidden set.
          setProperty("APIDoc_UsersAllowedToSYNC", "syncuser")
          setProperty(
              "AI_FormAssistant_ForbiddenElements_NonSyncUsers",
              "XTextField,FC_EMAIL,FC_SQL_STATEMENT")
        }
    CodBiElementAccess.initialize(props)

    FormcycleElementFilter.runForRequest(null, null, null) {
      CodBiElementAccess.runForUser("tester") {
        assertFalse(FormcycleElementFilter.isWidgetAllowed("XTextField"))
        assertFalse(FormcycleElementFilter.isNodeAllowed("FC_EMAIL"))
        assertFalse(FormcycleElementFilter.isNodeAllowed("FC_SQL_STATEMENT"))
        // Unlisted elements stay available.
        assertTrue(FormcycleElementFilter.isWidgetAllowed("XSelect"))
        assertTrue(FormcycleElementFilter.isNodeAllowed("FC_REDIRECT"))

        val scrubbed =
            FormcycleElementFilter.scrubWidgetSections(
                "preamble\n## XTextField\nfield docs\n## XSelect\nselect docs")
        assertFalse(scrubbed.contains("XTextField"))
        assertTrue(scrubbed.contains("XSelect"))
        assertTrue(scrubbed.contains("preamble"))
      }
      // For a sync-allowed user nothing is forbidden.
      CodBiElementAccess.runForUser("syncuser") {
        assertTrue(FormcycleElementFilter.isWidgetAllowed("XTextField"))
        assertTrue(FormcycleElementFilter.isNodeAllowed("FC_EMAIL"))
      }
    }
  }
}
