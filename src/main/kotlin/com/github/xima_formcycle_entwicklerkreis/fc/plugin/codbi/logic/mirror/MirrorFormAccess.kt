package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.hp.gagawa.java.FertileNode
import com.hp.gagawa.java.Node
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

  /** Class names of the FORMCYCLE widgets that submit a value (mirrors the designer's own list). */
  private val VALUE_ABLE_CLASSES =
      setOf("XTextField", "XTextArea", "XCheckbox", "XSelect", "XUpload", "XAppointment")

  /**
   * One value-able sub-field of a mirrored source element, as needed to materialize it as a real
   * child item in the target form.
   */
  data class MirrorField(
      val id: String,
      val name: String,
      val label: String,
      val className: String,
      /**
       * The source field's persisted `properties` (label, options, placeholder, required, …). The
       * child item is created from these so it looks and behaves like the source field — only the
       * `name` is kept native and the `id`/`parentid`/`rowid` are (re)assigned by the designer.
       */
      val properties: JSONObject
  )

  /**
   * Collects the value-able descendants of the element referenced by [elementRef] in the foreign
   * form (the element itself when it is value-able). These are exactly the fields a Mirror of that
   * element contributes to the target form: each is materialized as a real child item carrying its
   * NATIVE [MirrorField.name], so it renders, submits under that name and — being a normal item —
   * appears in the placeholder dialog automatically.
   *
   * @return the value-able fields in document order (depth-first), or an empty list when the form /
   *   element cannot be resolved.
   */
  fun valueAbleFields(userContext: Any?, formKey: String?, elementRef: String?): List<MirrorField> {
    val json = loadFormJson(userContext, formKey) ?: return emptyList()
    val root = itemJsonByRef(json, elementRef) ?: return emptyList()
    val index = childrenIndex(json)
    val out = ArrayList<MirrorField>()
    val seen = HashSet<String>()
    val queue = ArrayDeque<JSONObject>()
    queue.add(root)
    while (queue.isNotEmpty()) {
      val item = queue.removeFirst()
      val props = item.getJSONObject("properties") ?: continue
      val id = props.getString("id").orEmpty()
      val name = props.getString("name").orEmpty()
      val ref = id.ifBlank { name }
      if (ref.isNotEmpty() && !seen.add(ref)) continue
      val className = item.getString("className").orEmpty()
      if (className in VALUE_ABLE_CLASSES) {
        val label =
            props.getString("label").orEmpty().ifBlank {
              props.getString("header").orEmpty().ifBlank { name }
            }
        out.add(
            MirrorField(
                id = ref, name = name, label = label, className = className, properties = props))
      }
      // Enqueue the (already indexed) children so nested value-able fields are found as well.
      for (key in listOf(id, name)) {
        if (key.isNotEmpty()) queue.addAll(index[key].orEmpty())
      }
    }
    return out
  }

  /** One node of a mirrored subtree, ready to be materialized as a real item. */
  data class MirrorNode(
      /** Stable reference of the source item (its id, or its name when it has no id). */
      val ref: String,
      /**
       * The [ref] of this node's parent WITHIN the subtree, or `null` for a direct child of the
       * mirrored element (those attach to the Mirror container itself).
       */
      val parentRef: String?,
      val name: String,
      val className: String,
      /** The source item's raw `properties` (label, options, layout, …). */
      val properties: JSONObject
  )

  /** A source element's full subtree plus the source form version/revision it was read from. */
  data class MirrorSubtree(val version: Long, val revision: Int, val nodes: List<MirrorNode>)

  /**
   * A cheap content hash of the form's items. Used to detect that the SOURCE changed: a normal
   * FORMCYCLE "save" often keeps the same version id, so the version id alone cannot be compared.
   */
  fun formRevision(userContext: Any?, formKey: String?): Int {
    val json = loadFormJson(userContext, formKey) ?: return 0
    val items = json.getJSONArray("items")
    return (items?.toJSONString() ?: json.toJSONString()).hashCode()
  }

  /** The latest (highest-id) form version id of the referenced form, or `0` when unknown. */
  fun latestVersionId(userContext: Any?, formKey: String?): Long {
    val projectId = projectIdOf(formKey) ?: return 0L
    return try {
      val projekt = apiCall("PROJEKT", "getInitializedById", userContext, projectId) ?: return 0L
      val versions = apiCall("FORMVERSION", "getByProjekt", userContext, projekt) as? List<*>
      val latest =
          versions.orEmpty().filterNotNull().maxByOrNull { (invoke(it, "getId") as? Long) ?: 0L }
      (latest?.let { invoke(it, "getId") as? Long }) ?: 0L
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] latestVersionId failed for '{}': {}", formKey, x.message)
      0L
    }
  }

  /**
   * The FULL subtree (containers, fieldsets, value-able fields, texts, …) of the element referenced
   * by [elementRef], in document order (parents before children), together with the source form
   * version. Each node carries its raw `properties`, so a real item can be created with the
   * source's label/options/layout and the structure (`parentid`) preserved.
   *
   * The referenced element itself is NOT included — it is represented by the Mirror container; its
   * direct children become root-level nodes of the subtree.
   */
  fun mirrorSubtree(userContext: Any?, formKey: String?, elementRef: String?): MirrorSubtree? {
    val json = loadFormJson(userContext, formKey) ?: return null
    val root = itemJsonByRef(json, elementRef) ?: return null
    val index = childrenIndex(json)
    val rootProps = root.getJSONObject("properties") ?: return null
    val nodes = ArrayList<MirrorNode>()
    val seen = HashSet<String>()
    val queue = ArrayDeque<Pair<JSONObject, String?>>()
    // Include the referenced element ITSELF (its own title/legend, layout and attributes), then its
    // whole subtree — the Mirror must reproduce the element, not merely its children.
    queue.add(root to null)
    while (queue.isNotEmpty()) {
      val (item, parentRef) = queue.removeFirst()
      val props = item.getJSONObject("properties") ?: continue
      val id = props.getString("id").orEmpty()
      val name = props.getString("name").orEmpty()
      val ref = id.ifBlank { name }
      if (ref.isEmpty() || !seen.add(ref)) continue
      nodes.add(
          MirrorNode(
              ref = ref,
              parentRef = parentRef,
              name = name,
              className = item.getString("className").orEmpty(),
              properties = props))
      for (child in childrenOf(index, props)) queue.add(child to ref)
    }
    return MirrorSubtree(
        latestVersionId(userContext, formKey), formRevision(userContext, formKey), nodes)
  }

  /** Direct children of [props] within [index] (the index is keyed by both id and name). */
  private fun childrenOf(
      index: Map<String, List<JSONObject>>,
      props: JSONObject
  ): List<JSONObject> {
    val out = LinkedHashSet<JSONObject>()
    for (key in listOf(props.getString("id").orEmpty(), props.getString("name").orEmpty())) {
      if (key.isNotEmpty()) out.addAll(index[key].orEmpty())
    }
    return out.toList()
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
      // IMPORTANT: NEVER use IXForm.isUseModernTheme()/XForm.isUseModernTheme() — that method is a
      // legacy stub whose body is literally `return false` (both the interface default and XForm's
      // override), so it can never report a modern form. Relying on it silently dropped the
      // `modern`
      // class from the wrapper, which is why the modern theme AND the CodBi standard CSS (both
      // scoped under `.xm-form.modern` / `body.modern.xm-body`) never matched in the preview. The
      // real flag lives on the parsed form properties (`isModernTheme()`), the exact same source
      // `isResponsive()` already reads (`pageResponsive`).
      val modern = form.formProperties?.isModernTheme == true
      buildString {
        append("xm-form")
        if (modern) append(" modern")
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
   * via the child's `parentid` or via the container's `properties.elements` list.
   *
   * The `elements` list is resolved by BOTH id and name (FORMCYCLE stores ids in some versions and
   * names in others), and every child is registered under BOTH the parent's id and name, so a
   * lookup by either key always finds it. Missing the id case was why nested fields inside a
   * container were dropped (only the container's direct, `parentid`-based children were found).
   */
  private fun childrenIndex(json: JSONObject): Map<String, List<JSONObject>> {
    val items = json.getJSONArray("items") ?: return emptyMap()
    val byRef = HashMap<String, JSONObject>()
    for (i in 0 until items.size) {
      val item = items.getJSONObject(i) ?: continue
      val props = item.getJSONObject("properties") ?: continue
      val id = props.getString("id").orEmpty()
      val name = props.getString("name").orEmpty()
      if (id.isNotEmpty()) byRef[id] = item
      if (name.isNotEmpty()) byRef.putIfAbsent(name, item)
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
        val selfId = props.getString("id").orEmpty()
        val selfName = props.getString("name").orEmpty()
        for (j in 0 until elements.size) {
          val childRef = elements.getString(j) ?: continue
          byRef[childRef]?.let { child ->
            add(selfId, child)
            add(selfName, child)
          }
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
   * Renders the direct children of [parentJson] into the container's CONTENT element and recurses,
   * so a mirrored container includes its child elements exactly once (guarding against cycles and
   * depth blow-ups).
   *
   * Rendering a single item via [XItem.render] produces the item's OWN markup, whose outer wrapper
   * already contains the item (e.g. `<div class="xm-item-div"><div class="XFieldSetWrapper">`
   * `<fieldset>…</fieldset></div>…</div>`). Appending children to the OUTER wrapper put them BESIDE
   * the fieldset instead of inside it (the frontend rendered them as siblings). The correct insert
   * point is the element FORMCYCLE marks with `data-xm-appendable="<ref>"` (the `<fieldset>` / the
   * container's `.XItem` div) — the same marker the designer uses.
   */
  private fun appendDescendants(
      index: Map<String, List<JSONObject>>,
      itemsByRef: Map<String, XItem>,
      parentJson: JSONObject,
      parentNode: FertileNode,
      renderConfig: IXFormRenderConfig,
      renderContext: IXFormRenderContext,
      depth: Int,
      seen: MutableSet<String>
  ) {
    if (depth > 64) return
    val props = parentJson.getJSONObject("properties") ?: return
    val parentId = props.getString("id").orEmpty()
    val parentName = props.getString("name").orEmpty()
    val parentRef = parentId.ifBlank { parentName }
    val target = findAppendTarget(parentNode, parentRef) ?: parentNode
    val children = LinkedHashSet<JSONObject>()
    for (key in listOf(parentId, parentName)) {
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
      target.children.add(childNode)
      childNode.setParent(target)
      appendDescendants(
          index, itemsByRef, childJson, childNode, renderConfig, renderContext, depth + 1, seen)
    }
  }

  /**
   * Finds, within a rendered item's markup, the element its children must be appended to: the node
   * carrying `data-xm-appendable="<ref>"`. Returns `null` when the item has no such marker (a
   * leaf).
   */
  private fun findAppendTarget(node: Node, ref: String): FertileNode? {
    if (ref.isEmpty()) return null
    if (node is FertileNode) {
      if (node.getAttribute("data-xm-appendable") == ref) return node
      for (child in node.children) {
        findAppendTarget(child, ref)?.let {
          return it
        }
      }
    }
    return null
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
