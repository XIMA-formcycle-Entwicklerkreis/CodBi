package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser

/**
 * Locates the numeric id of the error-handler SEQUENCE of an FC_EXPERIMENT that wraps an HTTP
 * request node, based on the existing-workflow-nodes JSON produced by
 * `AICodBiAssistant.fetchExistingWorkflowNodes` (entries `{"id","type","name","parentId"}`).
 *
 * Formcycle's FC_EXPERIMENT is a try-catch wrapper: it has two SEQUENCE children — the *body* path
 * (the normal action, e.g. the FC_POST_REQUEST) and the *handler* path (the error handling, e.g. an
 * error Abschlussseite). When the AI requests error handling (e.g. an error email "wenn der
 * HTTP-Aufruf fehlschlägt") for an HTTP node that is ALREADY inside such an experiment, the error
 * nodes must be inserted into the experiment's handler SEQUENCE instead of spawning a second lane.
 *
 * @param existingWorkflowNodesJson the JSON array of existing workflow nodes, or null.
 * @return the numeric id of the handler SEQUENCE, or `null` when no such experiment/handler exists.
 */
internal fun findExperimentHandlerSequenceId(existingWorkflowNodesJson: String?): Long? {
  if (existingWorkflowNodesJson.isNullOrBlank()) return null
  val array =
      try {
        JsonParser.parseString(existingWorkflowNodesJson)
      } catch (_: Exception) {
        return null
      }
  if (!array.isJsonArray) return null
  data class N(val id: String, val type: String, val name: String, val parentId: String)
  val nodes = mutableListOf<N>()
  for (el in array.asJsonArray) {
    if (!el.isJsonObject) continue
    val o = el.asJsonObject
    val id = o.get("id")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
    nodes.add(
        N(
            id,
            o.get("type")?.takeIf { it.isJsonPrimitive }?.asString ?: "",
            o.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: "",
            o.get("parentId")?.takeIf { it.isJsonPrimitive }?.asString ?: ""))
  }
  val byId = nodes.associateBy { it.id }
  fun childrenOf(parentId: String): List<N> = nodes.filter { it.parentId == parentId }
  fun subtreeTypes(rootId: String): Set<String> {
    val result = mutableSetOf<String>()
    fun walk(id: String) {
      val n = byId[id] ?: return
      result.add(n.type)
      childrenOf(id).forEach { walk(it.id) }
    }
    walk(rootId)
    return result
  }
  val httpTypes = setOf("FC_POST_REQUEST", "FC_HTTP_REQUEST")
  for (exp in nodes.filter { it.type == "FC_EXPERIMENT" }) {
    // Only relevant when the experiment actually wraps an HTTP request.
    if (subtreeTypes(exp.id).none { it in httpTypes }) continue
    val seqChildren = childrenOf(exp.id).filter { it.type == "SEQUENCE" }
    if (seqChildren.isEmpty()) continue
    // The error-handler branch is the SEQUENCE child whose subtree does NOT contain the HTTP
    // request (the other child is the BODY path that runs the request). This is robust even when
    // both branches carry the same generic name (e.g. "FcSequenceHandler"). Prefer a branch whose
    // name additionally marks it as the error handler (e.g. "...HandlerHandler", "...Errors"),
    // then fall back to the branch without the HTTP request.
    val nonHttpBranches = seqChildren.filter { subtreeTypes(it.id).none { t -> t in httpTypes } }
    val handler =
        nonHttpBranches.firstOrNull {
          (it.name.contains("handler", ignoreCase = true) ||
              it.name.contains("error", ignoreCase = true) ||
              it.name.contains("exception", ignoreCase = true) ||
              it.name.contains("catch", ignoreCase = true)) &&
              !it.name.contains("body", ignoreCase = true)
        } ?: nonHttpBranches.firstOrNull()
    if (handler != null) return handler.id.toLongOrNull()
  }
  return null
}
