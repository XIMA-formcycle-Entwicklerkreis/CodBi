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
      val depth: Int,
      /** The element's configured help text (FORMCYCLE `helptext`), rendered as HTML. */
      val helpText: String = ""
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
   *
   * [formName] is the cached display title of the form; it is used as a fallback when [formKey] no
   * longer resolves (see [resolveProject]).
   */
  fun listElements(
      userContext: Any?,
      formKey: String?,
      formName: String? = null
  ): List<MirrorElement> {
    val json = loadFormJson(userContext, formKey, formName) ?: return emptyList()
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
      val helpText = props.getString("helptext").orEmpty()
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
              depth = depthOf(key),
              helpText = helpText))
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
  fun valueAbleFields(
      userContext: Any?,
      formKey: String?,
      elementRef: String?,
      formName: String? = null,
      elementKey: String? = null
  ): List<MirrorField> {
    val json = loadFormJson(userContext, formKey, formName) ?: return emptyList()
    val ref = resolveElementRef(json, elementRef, elementKey) ?: return emptyList()
    val root = itemJsonByRef(json, ref) ?: return emptyList()
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
  fun formRevision(userContext: Any?, formKey: String?, formName: String? = null): Int {
    val json = loadFormJson(userContext, formKey, formName) ?: return 0
    val items = json.getJSONArray("items")
    return (items?.toJSONString() ?: json.toJSONString()).hashCode()
  }

  /** The latest (highest-id) form version id of the referenced form, or `0` when unknown. */
  fun latestVersionId(userContext: Any?, formKey: String?, formName: String? = null): Long {
    return try {
      val resolved = resolveForm(userContext, formKey, formName) ?: return 0L
      val versions =
          apiCall("FORMVERSION", "getByProjekt", userContext, resolved.project) as? List<*>
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
  fun mirrorSubtree(
      userContext: Any?,
      formKey: String?,
      elementRef: String?,
      formName: String? = null,
      elementKey: String? = null
  ): MirrorSubtree? {
    val json = loadFormJson(userContext, formKey, formName) ?: return null
    val ref = resolveElementRef(json, elementRef, elementKey) ?: return null
    val root = itemJsonByRef(json, ref) ?: return null
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
        latestVersionId(userContext, formKey, formName),
        formRevision(userContext, formKey, formName),
        nodes)
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

  /**
   * Normalizes a form title for name-based matching (trim, collapse whitespace, case-insensitive).
   */
  private fun normalizeFormName(value: String?): String =
      value.orEmpty().trim().replace(Regex("\\s+"), " ").lowercase()

  /** A resolved source form plus whether the stored key/title have to be rewritten. */
  private data class ResolvedForm(
      val project: Any,
      val id: Long,
      val key: String,
      val name: String,
      val keyChanged: Boolean,
      val nameChanged: Boolean
  )

  /**
   * Finds a form by its (normalized) title, ignoring the project [excludeId]. When several forms
   * share the title, the newest one (highest id — the row a re-import creates) wins.
   */
  private fun findFormByName(
      userContext: Any?,
      name: String?,
      excludeId: Long? = null
  ): MirrorForm? {
    val wanted = normalizeFormName(name)
    if (wanted.isEmpty()) return null
    val candidates =
        listForms(userContext).filter { it.id != excludeId && normalizeFormName(it.name) == wanted }
    if (candidates.isEmpty()) return null
    if (candidates.size > 1) {
      logger.warn(
          "[MirrorFormAccess] {} forms are named '{}' — using the newest ({})",
          candidates.size,
          name,
          candidates.maxByOrNull { it.id }?.key)
    }
    return candidates.maxByOrNull { it.id }
  }

  /**
   * Resolves the stored source form:
   * 1. the stored `project-<id>` exists and (when a title is cached) its title matches → use it;
   * 2. otherwise, a form carrying the STORED TITLE is used and its id replaces the stale stored id;
   * 3. if no such form exists either, the reference is invalid (`null`).
   *
   * There is NO element-based re-binding. A form that does not carry the stored title is never
   * silently accepted.
   */
  private fun resolveForm(userContext: Any?, formKey: String?, formName: String?): ResolvedForm? {
    if (userContext == null) return null
    val storedKey = formKey?.trim().orEmpty()
    val storedName = formName?.trim().orEmpty()
    return try {
      val storedId = projectIdOf(storedKey)
      if (storedId != null) {
        val project = apiCall("PROJEKT", "getInitializedById", userContext, storedId)
        if (project != null) {
          val actualName = projectTitle(project) ?: "Form $storedId"
          if (storedName.isEmpty() ||
              normalizeFormName(actualName) == normalizeFormName(storedName)) {
            return ResolvedForm(
                project = project,
                id = storedId,
                key = formKey(storedId),
                name = actualName,
                keyChanged = false,
                nameChanged = storedName.isEmpty())
          }
          // The id resolves, but its title changed. Use another form carrying the STORED title.
          val byName = findFormByName(userContext, storedName, storedId) ?: return null
          val byNameProject =
              apiCall("PROJEKT", "getInitializedById", userContext, byName.id) ?: return null
          logger.info(
              "[MirrorFormAccess] stored key '{}' resolves to '{}' but the cached title '{}' " +
                  "belongs to '{}' — re-bound to '{}'",
              storedKey,
              actualName,
              storedName,
              byName.name,
              byName.key)
          return ResolvedForm(
              project = byNameProject,
              id = byName.id,
              key = byName.key,
              name = byName.name,
              keyChanged = byName.key != storedKey,
              nameChanged = false)
        }
      }
      // The stored id is gone: accept ONLY a form with the stored title (e.g. the re-imported one).
      val byName = findFormByName(userContext, storedName, null) ?: return null
      val byNameProject =
          apiCall("PROJEKT", "getInitializedById", userContext, byName.id) ?: return null
      logger.info(
          "[MirrorFormAccess] re-bound source form '{}' (stale key '{}') to '{}'",
          storedName,
          formKey,
          byName.key)
      ResolvedForm(
          project = byNameProject,
          id = byName.id,
          key = byName.key,
          name = byName.name,
          keyChanged = byName.key != storedKey,
          nameChanged = false)
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] resolveForm failed for '{}': {}", formKey, x.message)
      null
    }
  }

  /** Why a stored Mirror reference is (in)valid. Used by the designer hint. */
  data class MirrorReferenceStatus(
      val formKey: String,
      val storedFormName: String,
      val elementRef: String,
      val elementKey: String,
      val valid: Boolean,
      val formMissing: Boolean,
      val titleMismatch: Boolean,
      val elementMissing: Boolean,
      val actualFormName: String?
  )

  /**
   * Validates the stored reference for the designer: the form must resolve (id + cached title, with
   * the same-title re-import fallback), and the linked element must exist either by its stored id
   * or by its cached TECHNICAL name. The frontend renders nothing for an invalid reference; the
   * designer shows a hint with the stored form id, form title, element id and element name.
   */
  fun referenceStatus(
      userContext: Any?,
      formKey: String?,
      formName: String?,
      elementRef: String?,
      elementKey: String?
  ): MirrorReferenceStatus {
    val key = formKey?.trim().orEmpty()
    val storedName = formName?.trim().orEmpty()
    val element = elementRef?.trim().orEmpty()
    val storedElementKey = elementKey?.trim().orEmpty()
    // A form carrying the stored title (e.g. the re-imported one) makes the FORM valid even when
    // the
    // stored project id is stale. The element is validated separately below.
    resolveForm(userContext, key, storedName)?.let { resolved ->
      val json = loadFormJsonForProject(userContext, resolved.project)
      val resolvedElement =
          if (json != null) resolveElementRef(json, element, storedElementKey) else null
      return MirrorReferenceStatus(
          formKey = key,
          storedFormName = storedName,
          elementRef = element,
          elementKey = storedElementKey,
          valid = resolvedElement != null,
          formMissing = false,
          titleMismatch = false,
          elementMissing = resolvedElement == null,
          actualFormName = resolved.name)
    }
    val id = projectIdOf(key)
    if (userContext == null || id == null) {
      return MirrorReferenceStatus(
          key, storedName, element, storedElementKey, false, true, false, false, null)
    }
    val project =
        try {
          apiCall("PROJEKT", "getInitializedById", userContext, id)
        } catch (x: Exception) {
          logger.warn("[MirrorFormAccess] referenceStatus failed for '{}': {}", key, x.message)
          null
        }
    if (project == null) {
      return MirrorReferenceStatus(
          key, storedName, element, storedElementKey, false, true, false, false, null)
    }
    val actualName = projectTitle(project) ?: "Form $id"
    val mismatch =
        storedName.isNotEmpty() && normalizeFormName(actualName) != normalizeFormName(storedName)
    return MirrorReferenceStatus(
        formKey = key,
        storedFormName = storedName,
        elementRef = element,
        elementKey = storedElementKey,
        valid = false,
        formMissing = false,
        titleMismatch = mismatch,
        elementMissing = false,
        actualFormName = actualName)
  }

  /** Loads the latest form JSON for an already-resolved project entity. */
  private fun loadFormJsonForProject(userContext: Any?, project: Any): JSONObject? {
    return try {
      val versions = apiCall("FORMVERSION", "getByProjekt", userContext, project) as? List<*>
      val latest =
          versions.orEmpty().filterNotNull().maxByOrNull { (invoke(it, "getId") as? Long) ?: 0L }
              ?: return null
      apiCall("FORMVERSION", "getFormAsJSON", userContext, latest) as? JSONObject
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] loadFormJsonForProject failed: {}", x.message)
      null
    }
  }

  /** Source form ENTITY for [formKey] — see [resolveForm] for the strict rules. */
  private fun resolveProject(userContext: Any?, formKey: String?, formName: String?): Any? =
      resolveForm(userContext, formKey, formName)?.project

  /** Resolves the project id of the referenced form, or `null` when invalid. */
  fun resolveProjectId(userContext: Any?, formKey: String?, formName: String? = null): Long? =
      resolveForm(userContext, formKey, formName)?.id

  /**
   * Loads the persisted JSON of the *latest* version of the form referenced by [formKey]. When the
   * key is stale, [formName] is used to re-find the form after an export/import cycle.
   */
  fun loadFormJson(userContext: Any?, formKey: String?, formName: String? = null): JSONObject? {
    val resolved = resolveForm(userContext, formKey, formName) ?: return null
    return loadFormJsonForProject(userContext, resolved.project)
  }

  /** Finds the raw persist JSON of a single element (by id or name) inside the foreign form. */
  fun findElementJson(
      userContext: Any?,
      formKey: String?,
      elementRef: String?,
      formName: String? = null,
      elementKey: String? = null
  ): JSONObject? {
    val json = loadFormJson(userContext, formKey, formName) ?: return null
    val ref = resolveElementRef(json, elementRef, elementKey) ?: return null
    return itemJsonByRef(json, ref)
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
  fun formRootClasses(userContext: Any?, formKey: String?, formName: String? = null): String {
    val json = loadFormJson(userContext, formKey, formName) ?: return ""
    return try {
      rootClassesOf(XForm(json))
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] formRootClasses failed: {}", x.message)
      ""
    }
  }

  /**
   * The CSS classes FORMCYCLE puts on the form's root `<form>` element (`xm-form modern
   * responsive`) for an already-parsed [form]. Shared by the Mirror widget's element preview and
   * the per-element whole-form preview.
   *
   * IMPORTANT: NEVER use IXForm.isUseModernTheme()/XForm.isUseModernTheme() — that method is a
   * legacy stub whose body is literally `return false` (both the interface default and XForm's
   * override), so it can never report a modern form. The real flag lives on the parsed form
   * properties (`isModernTheme()`), the exact same source `isResponsive()` already reads
   * (`pageResponsive`).
   */
  fun rootClassesOf(form: XForm): String {
    val modern = form.formProperties?.isModernTheme == true
    return buildString {
      append("xm-form")
      if (modern) append(" modern")
      if (form.isResponsive()) append(" responsive")
    }
  }

  /** Whether [form] uses the modern theme (see [rootClassesOf] for why this cannot use IXForm). */
  fun isModernTheme(form: XForm): Boolean = form.formProperties?.isModernTheme == true

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
      renderContext: IXFormRenderContext?,
      formName: String? = null,
      elementKey: String? = null
  ): Div? {
    if (renderConfig == null || renderContext == null) return null
    val json = loadFormJson(userContext, formKey, formName) ?: return null
    val ref = resolveElementRef(json, elementRef, elementKey) ?: return null
    return try {
      val form = XForm(json)
      val item = findItem(form, formKey, ref) ?: return null
      val node =
          item.render(
              renderConfig, HashMap(), emptyMap(), false, renderContext, JSONObject(), false, false)
              ?: return null
      // Rendering a single item only produces that item's own tag. FORMCYCLE's form renderer is
      // what
      // nests child items into their container, and we bypass it here — so append the element's
      // descendants ourselves, otherwise containers are previewed/rendered empty.
      itemJsonByRef(json, ref)?.let { elementJson ->
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
      renderContext: IXFormRenderContext?,
      formName: String? = null,
      elementKey: String? = null
  ): String? =
      renderElementNode(
              userContext, formKey, elementRef, renderConfig, renderContext, formName, elementKey)
          ?.write()

  /**
   * Renders a single element (and its children) of the CURRENT form from an already-parsed form
   * JSON — used by the per-element preview so the element renders exactly like the frontend (the
   * same server-side designer-preview path the Mirror's hover preview uses), without requiring the
   * form to be persisted under a project key first.
   *
   * @return the rendered node, or `null` when the element cannot be resolved/rendered.
   */
  fun renderElementFromJson(
      json: JSONObject?,
      elementRef: String?,
      renderConfig: IXFormRenderConfig?,
      renderContext: IXFormRenderContext?
  ): Div? {
    if (json == null || renderConfig == null || renderContext == null) return null
    return try {
      val form = XForm(json)
      val item = findItem(form, null, elementRef) ?: return null
      val node =
          item.render(
              renderConfig, HashMap(), emptyMap(), false, renderContext, JSONObject(), false, false)
              ?: return null
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
      logger.warn("[MirrorFormAccess] renderElementFromJson failed: {}", x.message)
      null
    }
  }

  /** Convenience wrapper around [renderElementFromJson] that returns the rendered HTML string. */
  fun renderElementFromJsonHtml(
      json: JSONObject?,
      elementRef: String?,
      renderConfig: IXFormRenderConfig?,
      renderContext: IXFormRenderContext?
  ): String? = renderElementFromJson(json, elementRef, renderConfig, renderContext)?.write()

  /**
   * Renders the **entire** current form — every ROOT element plus all its descendants — from an
   * already-parsed form JSON, returning the concatenated inner `<form>` markup.
   *
   * This is the backend half of the per-element **whole-form preview**: the DOM is built here
   * exactly like the Mirror's element preview (item.render + [appendDescendants]), then loaded into
   * a hidden, same-origin iframe where the FORMCYCLE + CodBi runtime scripts initialize every
   * element/functionality like on a published form — giving full form-level fidelity (navigator,
   * conditional visibility, per-element functionalities) instead of patching a single element.
   *
   * We deliberately do NOT use `XFormRenderer.getRenderedForm`: that platform entry point requires
   * the server's provider stack (render-callback / meta-data / v-rules / replacer / language / item
   * providers) which a plugin servlet cannot supply.
   *
   * @return the inner form markup, or `null` when the form cannot be rendered.
   */
  fun renderWholeFormBody(
      json: JSONObject?,
      renderConfig: IXFormRenderConfig?,
      renderContext: IXFormRenderContext?
  ): String? {
    if (json == null || renderConfig == null || renderContext == null) return null
    return try {
      val form = XForm(json)
      val itemsByRef = xItemsByRef(form)
      val index = childrenIndex(json)
      // Every element that is referenced as somebody's child is NOT a root element.
      val childRefs = HashSet<String>()
      for (children in index.values) {
        for (child in children) {
          val props = child.getJSONObject("properties") ?: continue
          props.getString("id")?.takeIf { it.isNotBlank() }?.let { childRefs.add(it) }
          props.getString("name")?.takeIf { it.isNotBlank() }?.let { childRefs.add(it) }
        }
      }
      val container = Div()
      val seen = HashSet<String>()
      val items = json.getJSONArray("items") ?: return ""
      for (i in 0 until items.size) {
        val itemJson = items.getJSONObject(i) ?: continue
        val props = itemJson.getJSONObject("properties") ?: continue
        val id = props.getString("id").orEmpty()
        val name = props.getString("name").orEmpty()
        val ref = id.ifBlank { name }
        if (ref.isEmpty() || childRefs.contains(id) || childRefs.contains(name)) continue
        val item = itemsByRef[ref] ?: itemsByRef[name] ?: continue
        if (!seen.add(ref)) continue
        val node =
            item.render(
                renderConfig,
                HashMap(),
                emptyMap(),
                false,
                renderContext,
                JSONObject(),
                false,
                false) ?: continue
        container.children.add(node)
        node.setParent(container)
        appendDescendants(index, itemsByRef, itemJson, node, renderConfig, renderContext, 0, seen)
      }
      container.write()
    } catch (x: Exception) {
      logger.warn("[MirrorFormAccess] renderWholeFormBody failed: {}", x.message)
      null
    }
  }

  /** Extracts the form's own user CSS (`form.getUserCSS()`), or `""`. */
  fun userCssOf(form: XForm): String =
      try {
        form.getUserCSS().orEmpty()
      } catch (x: Exception) {
        logger.warn("[MirrorFormAccess] userCssOf failed: {}", x.message)
        ""
      }

  /** Locates an [XItem] inside the parsed foreign [XForm] by id or name. */
  fun findItem(form: XForm, formKey: String?, elementRef: String?): XItem? {
    val wanted = elementRef?.trim().orEmpty()
    if (wanted.isEmpty()) return null
    val items = form.getXItems() ?: return null
    return items.values.firstOrNull { it.getId() == wanted || it.getName() == wanted }
  }

  /**
   * Resolves the element reference to use inside [json]:
   * 1. the stored [elementRef] (id, or name as a legacy fallback) still exists → use its id;
   * 2. otherwise, an element whose TECHNICAL NAME equals [elementKey] (e.g. `txt6`) → use its id;
   * 3. otherwise `null` (the linked element is gone).
   *
   * This is what lets a Mirror recover when the source element was deleted and recreated under the
   * same designer name: the internal id changed, the technical name did not.
   */
  private fun resolveElementRef(
      json: JSONObject,
      elementRef: String?,
      elementKey: String?
  ): String? {
    val wantedName = elementKey?.trim().orEmpty()
    val byRef = itemJsonByRef(json, elementRef)
    if (byRef != null) {
      val props = byRef.getJSONObject("properties") ?: return null
      val id = props.getString("id").orEmpty()
      val actualName = props.getString("name").orEmpty()
      val ref = id.ifBlank { actualName }
      if (wantedName.isEmpty() || actualName == wantedName) {
        return ref
      }
      // The stored id still exists but now carries a DIFFERENT technical name. Prefer an element
      // that still has the stored name (the original was deleted and another element reused its
      // id).
      val items = json.getJSONArray("items") ?: return ref
      for (i in 0 until items.size) {
        val otherProps = items.getJSONObject(i)?.getJSONObject("properties") ?: continue
        val otherId = otherProps.getString("id").orEmpty()
        val otherName = otherProps.getString("name").orEmpty()
        if (otherName == wantedName && otherId.isNotBlank() && otherId != id) {
          return otherId
        }
      }
      // No element carries the stored name any more — the existing id is the renamed original.
      return ref
    }
    if (wantedName.isEmpty()) return null
    val items = json.getJSONArray("items") ?: return null
    for (i in 0 until items.size) {
      val props = items.getJSONObject(i)?.getJSONObject("properties") ?: continue
      if (props.getString("name").orEmpty() == wantedName) {
        return props.getString("id").orEmpty().ifBlank { wantedName }
      }
    }
    return null
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
            put("helptext", e.helpText)
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
