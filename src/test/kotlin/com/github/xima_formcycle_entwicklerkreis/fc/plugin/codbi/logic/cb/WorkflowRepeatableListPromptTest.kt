package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guard for the WORKFLOW handling of REPEATABLE (dynamic) containers: a request for the values of
 * all rows TOGETHER ("alle eingegebenen Vor- und Nachnamen als Auflistung") must be built as
 * FC_FOR_EACH_LOOP + FC_WRITE_FORM_RECORD_ATTRIBUTES accumulation + ONE FC_EMAIL referencing the
 * accumulated attribute — never as a single mail whose body holds a bare row placeholder.
 *
 * The reported run produced exactly that single mail with `[%tf3%] [%tf4%]` although the fields sat
 * inside a repeatable container. The guidance must be language-agnostic and reach every pass:
 *
 * 1. the always-sent build instruction (`codbi-workflow-task-instruction.md`, repeatable section),
 * 2. the pass-1 compact catalogue (`formcycle-workflow-nodes-compact.md`, FIRST line only),
 * 3. the pass-2 detailed reference (`formcycle-workflow-nodes.md`), and
 * 4. the repeatable-container context the workflow prompt receives (`buildRepeatableContainersContext`),
 *    which must resolve NESTED child fields and explicitly flag an unresolved container.
 */
class WorkflowRepeatableListPromptTest {

  private val resourceBase =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/"

  private fun read(resource: String): String =
      WorkflowRepeatableListPromptTest::class
          .java
          .classLoader
          .getResourceAsStream(resourceBase + resource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")

  private val instruction = read("prompts/codbi-workflow-task-instruction.md")
  private val compact = read("formcycle-workflow-nodes-compact.md")
  private val detailed = read("prompts/formcycle-workflow-nodes.md")

  /** The first (non-blank) line beneath a `### <heading>` section — the line pass-1 receives. */
  private fun firstLineAfterHeading(text: String, heading: String): String =
      text.lineSequence()
          .dropWhile { !it.startsWith("### $heading") }
          .drop(1)
          .firstOrNull { it.isNotBlank() }
          .orEmpty()

  private val assistant = AICodBiAssistant()

  /** Reflectively runs the private repeatable-container context builder. */
  private fun repeatableContext(persist: String): String? {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("buildRepeatableContainersContext", String::class.java)
            .apply { isAccessible = true }
    return method.invoke(assistant, persist) as String?
  }

  @Test
  fun `the always-sent instruction requires a loop plus attribute for a list of all rows`() {
    assertTrue(
        instruction.contains("LIST / ROSTER OF ALL ROWS"),
        "the workflow build instruction must carry the list/roster rule for repeated rows")
    assertTrue(
        instruction.contains("\"alle eingegebenen Vor- und Nachnamen als Auflistung\"") &&
            instruction.contains("all entered first and last names as a list"),
        "the rule must be meaning-based and show examples in more than one language")
    assertTrue(
        instruction.contains("renders only the FIRST row"),
        "the rule must state what a bare row placeholder in the body does")
    assertTrue(
        instruction.contains("FC_FOR_EACH_LOOP") && instruction.contains("FC_EMAIL"),
        "the rule must name the loop AND the single mail that references the accumulated value")
    assertTrue(
        instruction.contains("INSIDE the loop's \"_childNodes\""),
        "the rule must name the ONE-mail-per-row variant (mail inside the loop)")
    assertTrue(
        instruction.contains("EMPTY/INCOMPLETE"),
        "the rule must cover a container whose field list could not be resolved yet")
  }

  @Test
  fun `the pass-1 compact entries steer repeated rows to the loop on their FIRST line`() {
    val loopLine = firstLineAfterHeading(compact, "FC_FOR_EACH_LOOP")
    assertTrue(
        loopLine.contains("REPEATABLE", ignoreCase = true) &&
            loopLine.contains("mail", ignoreCase = true) &&
            loopLine.contains("list", ignoreCase = true),
        "pass 1 only sees the compact entry's FIRST line, so it must mention repeatable rows and the " +
            "mail/list use case: $loopLine")
    assertTrue(loopLine.length <= 200, "the compact first line must fit the 200-char cap: $loopLine")

    val mailLine = firstLineAfterHeading(compact, "FC_EMAIL")
    assertTrue(
        mailLine.contains("repeatable-row", ignoreCase = true) &&
            mailLine.contains("FIRST row", ignoreCase = true) &&
            mailLine.contains("FC_FOR_EACH_LOOP"),
        "the FC_EMAIL compact line must warn against a bare repeatable-row placeholder: $mailLine")
    assertTrue(mailLine.length <= 200, "the compact first line must fit the 200-char cap: $mailLine")
  }

  @Test
  fun `the detailed reference documents the collect-rows-to-mail-list pattern and the reported example`() {
    assertTrue(
        detailed.contains("COLLECT-ROWS-TO-MAIL-LIST"),
        "the detailed FC_FOR_EACH_LOOP section must document the mail-list accumulation pattern")
    assertTrue(
        detailed.contains("<li>[%tf3%] [%tf4%]</li>"),
        "the reported first/last-name list must appear as a worked example")
    assertTrue(
        detailed.contains("A mail PER ROW needs no attribute"),
        "the pattern must distinguish ONE mail with a list from one mail per row")
  }

  @Test
  fun `the repeatable-container context lists direct row fields`() {
    val persist =
        """{"items":[{"className":"XContainer","properties":{"name":"xi-rows","dynamic":"1","elements":["tf3","tf4"]}}]}"""
    val context = repeatableContext(persist).orEmpty()
    assertTrue(
        context.contains("Repeatable container 'xi-rows' contains: tf3, tf4"),
        "direct row fields must be listed with their technical ids, got: $context")
  }

  @Test
  fun `the repeatable-container context resolves NESTED child fields`() {
    val persist =
        """
        {"items":[
          {"className":"XContainer","properties":{"name":"xi-rows","dynamic":"1","elements":[
            {"className":"XContainer","properties":{"name":"xi-inner","elements":[
              {"className":"XTextField","properties":{"name":"tf3"}},
              {"className":"XTextField","properties":{"name":"tf4"}}
            ]}}
          ]}}
        ]}
        """
            .trimIndent()
    val context = repeatableContext(persist).orEmpty()
    assertTrue(
        context.contains("Repeatable container 'xi-rows' contains: tf3, tf4"),
        "fields nested in an inner container must still be attributed to the repeatable container, " +
            "got: $context")
  }

  @Test
  fun `the repeatable-container context flags an unresolved container explicitly`() {
    val persist = """{"items":[{"className":"XContainer","properties":{"name":"xi-rows","dynamic":"1","elements":[]}}]}"""
    val context = repeatableContext(persist).orEmpty()
    assertTrue(
        context.contains("xi-rows") && context.contains("<none resolved"),
        "an empty container must be flagged so the prompt can instruct the model to infer its rows, " +
            "got: $context")
  }
}
