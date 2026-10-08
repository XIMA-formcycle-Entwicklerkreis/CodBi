package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.hp.gagawa.java.elements.Div
import de.xima.fc.form.common.items.XItem
import de.xima.fc.form.common.models.IXFormRenderConfig
import de.xima.fc.form.common.models.IXFormRenderContext
import de.xima.fc.form.common.models.XForm
import org.slf4j.LoggerFactory

/**
 * Shared access layer for reading the **content of another form** (a “foreign” form) so that a form
 * element stored there can be referenced (mirrored) from the currently edited form.
 *
 * This is the single backend entry point for cross-form element access and is intentionally
 * reusable by:
 * - the [XMirror] widget (renders the referenced element in the designer preview and the live
 *   form),
 * - the form assistant (the `need_form_elements` request command loads a form's elements here), and
 * - the designer servlet action that populates the Mirror widget's dependent dropdowns.
 *
 * Formcycle's plugin API is used through reflection (see [de.xima.fc.api.APIProvider]) so the
 * plugin keeps working across patch releases, exactly like [InstalledFormcycleElements] already
 * does. Only the form *model* types ([XForm], [XItem]) are used directly — they are part of the
 * stable form-renderer contract that every widget plugin already compiles against.
 *
 * @since 1.0.0
 */
object MirrorFormAccess {

  private val logger = LoggerFactory.getLogger(MirrorFormAccess::class.java)

  /** A form (Formcycle project) that can be referenced. */
  data class MirrorForm(val id: Long, val key: String, val name: String)

  /** One form element of a foreign form, as needed for the dropdown / the assistant digest. */
  data class MirrorElement(
      val id: String,
      val name: String,
      val label: String,
      val className: String,
      val parentName: String?,
      val parentId: String?,
      val depth: Int
  ) {
    /** The stable identifier stored on the Mirror widget. */
    val reference: String
      get() = id.ifBlank { name }
  }

  /** Technical form-key prefix used across the plugin (mirrors the assistant's `project-<id>`). */
  private const val PROJECT_KEY_PREFIX = "project-"

  /** Builds the technical key used to reference a form by its project id. */
  fun formKey(projectId: Long): String = PROJECT_KEY_PREFIX + projectId

  /** Extracts the project id from a technical form key, or `null` when it is malformed. */
  fun projectIdOf(formKey: String?): Long? =
      formKey?.trim()?.removePrefix(PROJECT_KEY_PREFIX)?.toLongOrNull()

  // region UserContext

  /**
   * A `UserContext` usable outside a backend request (the widget renders during form rendering
   * where no authenticated backend user exists). Falls back to `null` when the class cannot be
   * reached.
   */
  fun systemContext(): Any? {
    val factory =
        runCatching { Class.forName("de.xima.fc.user.UserContextFactory") }.getOrNull()
            ?: return null
    // Prefer the SYSTEM field, fall back to the forSystem() factory method.
    runCatching { factory.getField("SYSTEM").get(null) }
        .getOrNull()
        ?.let {
          return it
        }
    val system = runCatching { factory.getMethod("forSystem").invoke(null) }.getOrNull()
    if (system == null) {
      logger.warn(
          "[MirrorFormAccess] Could not obtain a SYSTEM UserContext (field SYSTEM / forSystem)")
    }
    return system
  }

  /**
   * Builds a request-scoped `UserContext` for the given backend user (as provided by a servlet).
   */
  fun userContextFor(benutzer: Any?): Any? {
    if (benutzer == null) return systemContext()
    return runCatching {
          val factory = Class.forName("de.xima.fc.user.UserContextFactory")
          val method =
              factory.methods.firstOrNull {
                it.name == "forBenutzer" &&
                    it.parameterCount == 1 &&
                    it.parameterTypes[0].isAssignableFrom(benutzer.javaClass)
              } ?: return systemContext()
          method.invoke(null, benutzer) ?: systemContext()
        }
        .getOrElse {
          logger.warn("[MirrorFormAccess] forBenutzer failed: {}", it.message)
          systemContext()
        }
  }

  // endregion UserContext

  // region Forms

  /**
   * Lists every form (Formcycle project) the given client has access to, in the shape used by the
   * assistant (`{"id","key","name"}`). Returns an empty list when the API is unavailable.
   */
  fun listForms(userContext: Any?): List<MirrorForm> {
    if (userContext == null) return emptyList()
    // Uses the SAME JPQL access path as the assistant's form list (EntityContextFactory + a query
    // on
    // the Projekt entity); the Hibernate mandant filter scopes the result to the current client.
    return try {
      val factoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          factoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      try {
        val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
        val query =
            em.javaClass
                .getMethod("createQuery", String::class.java)
                .invoke(em, "SELECT p FROM de.xima.fc.entities.Projekt p ORDER BY p.id")
        @Suppress("UNCHECKED_CAST")
        val rows =
            query.javaClass.getMethod("getResultList").invoke(query) as? List<*> ?: emptyList<Any>()
        rows.mapNotNull { projekt ->
          if (projekt == null) return@mapNotNull null
          val id = (invoke(projekt, "getId") as? Number)?.toLong() ?: return@mapNotNull null
          MirrorForm(id, formKey(id), projectTitle(projekt) ?: "Form $id")
        }
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] listForms failed: {}", x.message)
      emptyList()
    }
  }

  /**
   * Best-effort human-readable project title (`getTitel`/`getName`), or `null` when unavailable.
   */
  private fun projectTitle(project: Any): String? {
    for (getter in listOf("getTitel", "getName")) {
      val value =
          runCatching { project.javaClass.getMethod(getter).invoke(project) as? String }.getOrNull()
      if (!value.isNullOrBlank()) return value
    }
    return null
  }

  // endregion Forms

  // region Elements

  /**
   * Lists the elements of the foreign form referenced by [formKey], depth-first, including a
   * human-readable label and the owning container's name so a dropdown can be grouped.
   */
  fun listElements(userContext: Any?, formKey: String?): List<MirrorElement> {
    val json = loadFormJson(userContext, formKey) ?: return emptyList()
    val items = json.getJSONArray("items") ?: return emptyList()
    val byId = LinkedHashMap<String, JSONObject>()
    for (i in 0 until items.size) {
      val item = items.getJSONObject(i) ?: continue
      val props = item.getJSONObject("properties") ?: continue
      val id = props.getString("id").orEmpty()
      val name = props.getString("name").orEmpty()
      byId[id.ifBlank { name }] = item
    }
    // Resolve parent links (only to existing elements) so the client can rebuild the hierarchy.
    val parentOf = HashMap<String, String>()
    for ((key, item) in byId) {
      val parentId = item.getJSONObject("properties")?.getString("parentid").orEmpty()
      if (parentId.isNotBlank() && byId.containsKey(parentId)) parentOf[key] = parentId
    }
    val depthCache = HashMap<String, Int>()
    val visiting = HashSet<String>()
    fun depthOf(key: String): Int {
      depthCache[key]?.let {
        return it
      }
      if (!visiting.add(key)) return 0 // cycle guard
      val parent = parentOf[key]
      val depth = if (parent == null) 0 else (depthOf(parent) + 1).coerceAtMost(64)
      visiting.remove(key)
      depthCache[key] = depth
      return depth
    }

    val result = ArrayList<MirrorElement>(byId.size)
    for ((key, item) in byId) {
      val props = item.getJSONObject("properties") ?: continue
      val name = props.getString("name").orEmpty()
      val label =
          props.getString("label").orEmpty().ifBlank {
            props.getString("header").orEmpty().ifBlank { props.getString("legend").orEmpty() }
          }
      val className = item.getString("className").orEmpty()
      val parentId = parentOf[key]
      val parentName = parentId?.let { byId[it]?.getJSONObject("properties")?.getString("name") }
      result.add(
          MirrorElement(
              id = key,
              name = name,
              label = label.ifBlank { name },
              className = className,
              parentName = parentName,
              parentId = parentId,
              depth = depthOf(key)))
    }
    return result
  }

  // endregion Elements

  // region Form JSON

  /** Loads the persisted JSON of the *latest* version of the form referenced by [formKey]. */
  fun loadFormJson(userContext: Any?, formKey: String?): JSONObject? {
    if (userContext == null) return null
    val projectId = projectIdOf(formKey) ?: return null
    return try {
      val projekt = apiCall("PROJEKT", "getInitializedById", userContext, projectId) ?: return null
      val versions = apiCall("FORMVERSION", "getByProjekt", userContext, projekt) as? List<*>
      val latest =
          versions.orEmpty().filterNotNull().maxByOrNull { (invoke(it, "getId") as? Long) ?: 0L }
              ?: return null
      apiCall("FORMVERSION", "getFormAsJSON", userContext, latest) as? JSONObject
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] loadFormJson failed for '{}': {}", formKey, x.message)
      null
    }
  }

  /** Finds the raw persist JSON of a single element (by id or name) inside the foreign form. */
  fun findElementJson(userContext: Any?, formKey: String?, elementRef: String?): JSONObject? {
    val json = loadFormJson(userContext, formKey) ?: return null
    val items = json.getJSONArray("items") ?: return null
    val wanted = elementRef?.trim().orEmpty()
    if (wanted.isEmpty()) return null
    for (i in 0 until items.size) {
      val item = items.getJSONObject(i) ?: continue
      val props = item.getJSONObject("properties") ?: continue
      val id = props.getString("id").orEmpty()
      val name = props.getString("name").orEmpty()
      if (wanted == id || wanted == name) return item
    }
    return null
  }

  /**
   * The CSS classes FORMCYCLE puts on the foreign form's root element (`<form class="xm-form …">`).
   * The frontend theme CSS scopes its element styling under these classes (e.g. `.xm-form.modern
   * input.XItem.XTextField`), so the designer preview must reuse them for the *source* form —
   * otherwise the form's own (user defined) CSS and the modern-theme rules do not apply and the
   * mirrored element looks bare.
   *
   * @return e.g. `"xm-form modern responsive"`, or `""` when the form cannot be loaded.
   */
  fun formRootClasses(userContext: Any?, formKey: String?): String {
    val json = loadFormJson(userContext, formKey) ?: return ""
    return try {
      val form = XForm(json)
      buildString {
        append("xm-form")
        if (form.isUseModernTheme()) append(" modern")
        if (form.isResponsive()) append(" responsive")
      }
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] formRootClasses failed: {}", x.message)
      ""
    }
  }

  // endregion Form JSON

  // region Rendering

  /**
   * Renders the referenced element (and its children) of the foreign form to a gagawa node, using
   * the **current** render configuration/context so the mirrored markup behaves like it does in the
   * form it lives in. The returned node can be appended to the current form's DOM tree directly.
   *
   * @return the rendered node, or `null` when the form/element cannot be resolved.
   */
  fun renderElementNode(
      userContext: Any?,
      formKey: String?,
      elementRef: String?,
      renderConfig: IXFormRenderConfig?,
      renderContext: IXFormRenderContext?
  ): Div? {
    if (renderConfig == null || renderContext == null) return null
    val json = loadFormJson(userContext, formKey) ?: return null
    return try {
      val form = XForm(json)
      val item = findItem(form, formKey, elementRef) ?: return null
      val node =
          item.render(
              renderConfig, HashMap(), emptyMap(), false, renderContext, JSONObject(), false, false)
              ?: return null
      // Rendering a single item only produces that item's own tag. FORMCYCLE's form renderer is
      // what
      // nests child items into their container, and we bypass it here — so append the element's
      // descendants ourselves, otherwise containers are previewed/rendered empty.
      itemJsonByRef(json, elementRef)?.let { elementJson ->
        appendDescendants(
            childrenIndex(json),
            xItemsByRef(form),
            elementJson,
            node,
            renderConfig,
            renderContext,
            0,
            HashSet())
      }
      node
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] renderElementNode failed: {}", x.message)
      null
    }
  }

  /** Convenience wrapper around [renderElementNode] that returns the rendered HTML string. */
  fun renderElementHtml(
      userContext: Any?,
      formKey: String?,
      elementRef: String?,
      renderConfig: IXFormRenderConfig?,
      renderContext: IXFormRenderContext?
  ): String? =
      renderElementNode(userContext, formKey, elementRef, renderConfig, renderContext)?.write()

  /** Locates an [XItem] inside the parsed foreign [XForm] by id or name. */
  fun findItem(form: XForm, formKey: String?, elementRef: String?): XItem? {
    val wanted = elementRef?.trim().orEmpty()
    if (wanted.isEmpty()) return null
    val items = form.getXItems() ?: return null
    return items.values.firstOrNull { it.getId() == wanted || it.getName() == wanted }
  }

  /**
   * Finds the raw persist JSON of an element (by id or name) inside an already-parsed form JSON.
   */
  private fun itemJsonByRef(json: JSONObject, ref: String?): JSONObject? {
    val items = json.getJSONArray("items") ?: return null
    val wanted = ref?.trim().orEmpty()
    if (wanted.isEmpty()) return null
    for (i in 0 until items.size) {
      val item = items.getJSONObject(i) ?: continue
      val props = item.getJSONObject("properties") ?: continue
      if (wanted == props.getString("id") || wanted == props.getString("name")) return item
    }
    return null
  }

  /**
   * Maps a parent key (element id or name) to its child element JSONs. Children are declared either
   * via the child's `parentid` or via the container's `properties.elements` name list.
   */
  private fun childrenIndex(json: JSONObject): Map<String, List<JSONObject>> {
    val items = json.getJSONArray("items") ?: return emptyMap()
    val byName = HashMap<String, JSONObject>()
    for (i in 0 until items.size) {
      val item = items.getJSONObject(i) ?: continue
      val name = item.getJSONObject("properties")?.getString("name").orEmpty()
      if (name.isNotEmpty()) byName[name] = item
    }
    val out = HashMap<String, MutableList<JSONObject>>()
    fun add(parent: String, child: JSONObject) {
      if (parent.isEmpty()) return
      out.getOrPut(parent) { ArrayList() }.add(child)
    }
    for (i in 0 until items.size) {
      val item = items.getJSONObject(i) ?: continue
      val props = item.getJSONObject("properties") ?: continue
      val parentId = props.getString("parentid").orEmpty()
      if (parentId.isNotEmpty()) add(parentId, item)
      val elements = props.getJSONArray("elements")
      if (elements != null) {
        val parentName = props.getString("name").orEmpty()
        for (j in 0 until elements.size) {
          val childName = elements.getString(j) ?: continue
          byName[childName]?.let { child -> add(parentName, child) }
        }
      }
    }
    return out
  }

  /** Indexes the parsed form's [XItem]s by both id and name. */
  private fun xItemsByRef(form: XForm): Map<String, XItem> {
    val all = form.getXItems() ?: return emptyMap()
    val map = HashMap<String, XItem>()
    for (item in all.values) {
      val id = item.getId()
      if (!id.isNullOrBlank()) map[id] = item
      val name = item.getName()
      if (!name.isNullOrBlank()) map.putIfAbsent(name, item)
    }
    return map
  }

  /**
   * Renders the direct children of [parentJson] into [parentNode] and recurses, so a mirrored
   * container includes its child elements exactly once (guarding against cycles and depth
   * blow-ups).
   */
  private fun appendDescendants(
      index: Map<String, List<JSONObject>>,
      itemsByRef: Map<String, XItem>,
      parentJson: JSONObject,
      parentNode: Div,
      renderConfig: IXFormRenderConfig,
      renderContext: IXFormRenderContext,
      depth: Int,
      seen: MutableSet<String>
  ) {
    if (depth > 64) return
    val props = parentJson.getJSONObject("properties") ?: return
    val children = LinkedHashSet<JSONObject>()
    for (key in listOf(props.getString("id").orEmpty(), props.getString("name").orEmpty())) {
      if (key.isNotEmpty()) children.addAll(index[key].orEmpty())
    }
    for (childJson in children) {
      val childProps = childJson.getJSONObject("properties") ?: continue
      val childName = childProps.getString("name").orEmpty()
      val childId = childProps.getString("id").orEmpty()
      val childRef = childId.ifBlank { childName }
      if (childRef.isEmpty() || !seen.add(childRef)) continue
      val childItem = itemsByRef[childRef] ?: itemsByRef[childName] ?: continue
      val childNode =
          childItem.render(
              renderConfig, HashMap(), emptyMap(), false, renderContext, JSONObject(), false, false)
              ?: continue
      parentNode.appendChild(childNode)
      appendDescendants(
          index, itemsByRef, childJson, childNode, renderConfig, renderContext, depth + 1, seen)
    }
  }

  // endregion Rendering

  // region Reflection helpers

  /** Returns the static API object of [de.xima.fc.api.APIProvider] by its field name. */
  private fun api(field: String): Any? =
      runCatching { Class.forName("de.xima.fc.api.APIProvider").getField(field).get(null) }
          .getOrNull()

  /** Invokes a method on an API object obtained via [api], tolerating overload ambiguity. */
  private fun apiCall(field: String, method: String, vararg args: Any?): Any? {
    val target = api(field) ?: throw IllegalStateException("APIProvider.$field unavailable")
    return invoke(target, method, *args)
  }

  /**
   * Invokes [method] on [target], selecting the overload whose parameter types are assignable from
   * the given arguments (so `Long`/`Integer` overloads and nulls do not break the call).
   */
  private fun invoke(target: Any?, method: String, vararg args: Any?): Any? {
    if (target == null) return null
    val candidates =
        target.javaClass.methods.filter { it.name == method && it.parameterCount == args.size }
    val match =
        candidates.firstOrNull { m ->
          args.allOfIndex { index, arg ->
            val param = m.parameterTypes[index]
            arg == null || boxed(param).isAssignableFrom(boxed(arg.javaClass))
          }
        } ?: candidates.firstOrNull()
    return match?.invoke(target, *args)
  }

  private fun boxed(type: Class<*>): Class<*> =
      when (type) {
        java.lang.Boolean.TYPE -> java.lang.Boolean::class.java
        java.lang.Byte.TYPE -> java.lang.Byte::class.java
        java.lang.Character.TYPE -> java.lang.Character::class.java
        java.lang.Short.TYPE -> java.lang.Short::class.java
        java.lang.Integer.TYPE -> java.lang.Integer::class.java
        java.lang.Long.TYPE -> java.lang.Long::class.java
        java.lang.Float.TYPE -> java.lang.Float::class.java
        java.lang.Double.TYPE -> java.lang.Double::class.java
        else -> type
      }

  private inline fun <T> Array<out T>.allOfIndex(predicate: (Int, T) -> Boolean): Boolean {
    for (i in indices) if (!predicate(i, this[i])) return false
    return true
  }

  /**
   * Serializes the element list for the designer's element dropdown, including the tree information
   * (`parentid`, `depth`) so the client can render it as a hierarchy that mirrors the source form.
   */
  fun elementsTreeAsJson(elements: List<MirrorElement>): String {
    val array = JSONArray()
    for (e in elements) {
      array.add(
          JSONObject().apply {
            put("id", e.id)
            put("name", e.name)
            put("label", e.label)
            put("className", e.className)
            e.parentName?.let { put("parent", it) }
            e.parentId?.let { put("parentid", it) }
            put("depth", e.depth)
          })
    }
    return array.toJSONString()
  }

  /** Serializes the element list to the JSON digest ingested into the assistant prompt. */
  fun elementsAsJson(elements: List<MirrorElement>): String {
    val array = JSONArray()
    for (e in elements) {
      array.add(
          JSONObject().apply {
            put("id", e.id)
            put("name", e.name)
            put("label", e.label)
            put("className", e.className)
            e.parentName?.let { put("parent", it) }
          })
    }
    return array.toJSONString()
  }

  // endregion Reflection helpers
}
