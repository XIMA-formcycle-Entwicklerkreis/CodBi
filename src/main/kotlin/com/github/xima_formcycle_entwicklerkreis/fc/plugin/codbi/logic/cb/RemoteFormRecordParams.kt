package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.Gson
import java.util.UUID
import org.slf4j.LoggerFactory

/**
 * What the TARGET form of a cross-form record creation looks like, as far as the installed
 * `CreateRemoteFormRecordPlugin` needs it.
 *
 * @property usesNewWorkflow `Projekt.isUsesNewWorkflow()` of the target form — the plugin writes
 *   this into `useNewWf`; its "Ziel-Status" selector is HIDDEN for new workflows, so a requested
 *   status cannot be preset there.
 * @property statusUuid `de.xima.fc.entities.Status` (NOT a workflow state) the new record gets.
 * @property statusName Name of [statusUuid] — for logging.
 * @property requestedStatusFound `true` when the AI's requested status name exists in the target
 *   form; `false` when one of its other statuses had to be used.
 * @property availableStatuses All status names of the target form — logged so a mismatch is
 *   explainable from the server log.
 * @property inboxUuid `de.xima.fc.entities.Postfach` the new record is created in — the plugin's
 *   own "Postfach" property (`inboxRef`), so no separate FC_MOVE_FORM_RECORD_TO_INBOX node is
 *   needed.
 * @property inboxName Name of [inboxUuid] — for logging.
 * @property requestedInboxFound `true` when the AI's requested inbox name exists.
 * @property availableInboxes All inbox names of the client — logged so a mismatch is explainable.
 */
internal data class RemoteFormRecordTarget(
    val usesNewWorkflow: Boolean,
    val statusUuid: UUID?,
    val statusName: String?,
    val requestedStatusFound: Boolean,
    val availableStatuses: List<String>,
    val inboxUuid: UUID? = null,
    val inboxName: String? = null,
    val requestedInboxFound: Boolean = false,
    val availableInboxes: List<String> = emptyList()
)

/**
 * Builds the `customParameters` of a cross-form record node
 * (`de.xima.advanced.plugin.node.CreateRemoteFormRecordPlugin`) and resolves the entity references
 * it needs.
 *
 * The property names are read from the INSTALLED plugin bundle (`plugin-bundle-advanced`), not
 * guessed:
 * ```
 * public class CreateRemoteFormRecordProps extends BaseActionProps {
 *   private UuidEntityRef inboxRef;                 // "Postfach" (InboxChoiceProvider → Postfach)
 *   private boolean useNewWf;                       // mirrors Projekt.isUsesNewWorkflow()
 *   private UuidEntityRef projectRef;               // "Formular"  (@NotNull!)
 *   private UuidEntityRef statusRef;                // "Ziel-Status" (de.xima.fc.entities.Status)
 *   private boolean transferAttachments;            // "Dateianhänge übertragen?"
 *   private boolean copyAll;                        // "Gleichnamige Felder automatisch übertragen"
 *   private List<Setting<String>> elementsToCopy;   // "Formularwerte zuordnen"
 *   private MultiFile attachmentFilter;             // "Dateianhangs-Filter"
 * }
 * ```
 *
 * The previous implementation emitted `project`, `stateNewRecord`, `otherAttachments` and
 * `copyOtherAttachments` plus a `de.xima.fc.entities.WorkflowState` reference — NONE of those keys
 * exist on that class, which is exactly why the designer kept showing an EMPTY "Formular" property
 * after the node had been created.
 *
 * WHICH form is meant and which status the new record should get stays the AI's decision (it
 * receives the forms list together with their status names); this object only performs the
 * mechanical translation of those decisions into the reference objects the property class requires.
 */
internal object RemoteFormRecordParams {

  const val PROJEKT_ENTITY_CLASS = "de.xima.fc.entities.Projekt"
  const val STATUS_ENTITY_CLASS = "de.xima.fc.entities.Status"

  /**
   * The "Postfach" property is a `UuidEntityRef` validated by
   * `de.xima.fc.workflow.model.choices.InboxChoiceProvider`, which returns
   * `WorkflowProviderHelper.createSelectItems(<Postfach list>)` — i.e. the reference always carries
   * `de.xima.fc.entities.Postfach` as its entity class.
   */
  const val INBOX_ENTITY_CLASS = "de.xima.fc.entities.Postfach"

  private val logger = LoggerFactory.getLogger(RemoteFormRecordParams::class.java)
  private val gson = Gson()

  /** Alternative spellings for "transfer the attachments of this record". */
  private val TRANSFER_FLAGS =
      listOf("transferAttachments", "copyAttachments", "copyOtherAttachments", "transferFiles")

  /** Alternative spellings for the inbox the new record is created in. */
  private val INBOX_KEYS =
      listOf("inboxName", "inbox", "postfach", "postfachName", "targetInbox", "inboxRefName")

  /**
   * Returns the properties body of the node (WITHOUT `name`/`description`, which the callers
   * prepend — the AI-generated node label stays in charge).
   *
   * @param nodeParams The AI's `nodeParams` for this node (`elementsToCopy`, `copyAll`, `files`,
   *   …).
   * @param projectUuid UUID of the TARGET form, or `null` when it could not be bound.
   * @param target Resolved target-form information, or `null` when it could not be read.
   */
  fun propsJson(
      nodeParams: Map<String, Any?>,
      projectUuid: UUID?,
      target: RemoteFormRecordTarget?
  ): String {
    // `useNewWf` is NOT a decision: the plugin's own property dialog derives it from the target
    // form
    // (`checkUseNewWf()` → `Projekt.isUsesNewWorkflow()`), so it is mirrored here. For a new
    // workflow
    // the "Ziel-Status" selector is hidden and the target workflow processes the record instead.
    val usesNewWorkflow = target?.usesNewWorkflow ?: false
    val parts = mutableListOf<String>()
    parts.add("\"useNewWf\":$usesNewWorkflow")
    // `projectRef` IS the "Formular" property and is @NotNull (validation failure "NO_PROJECT"
    // otherwise), so it is emitted as soon as the target form is known.
    if (projectUuid != null) parts.add(projectRefJson(projectUuid))
    if (!usesNewWorkflow) target?.statusUuid?.let { parts.add(statusRefJson(it)) }
    // `inboxRef` is the plugin's own "Postfach" property — the record is created IN that inbox, so
    // no
    // separate FC_MOVE_FORM_RECORD_TO_INBOX node is needed (nor wanted) for a cross-form creation.
    target?.inboxUuid?.let { parts.add(inboxRefJson(it)) }
    parts.add("\"copyAll\":${nodeParams["copyAll"] as? Boolean ?: false}")
    settingsJson(nodeParams)?.let { parts.add("\"elementsToCopy\":[$it]") }
    transferJson(nodeParams)?.let { parts.add(it) }
    return parts.joinToString(",")
  }

  /** `"projectRef":{"uuid":"…","entityClass":"de.xima.fc.entities.Projekt"}` — the "Formular". */
  fun projectRefJson(projectUuid: UUID): String =
      "\"projectRef\":{\"uuid\":${gson.toJson(projectUuid.toString())}," +
          "\"entityClass\":\"$PROJEKT_ENTITY_CLASS\"}"

  /** `"statusRef":{"uuid":"…","entityClass":"de.xima.fc.entities.Status"}` — the "Ziel-Status". */
  fun statusRefJson(statusUuid: UUID): String =
      "\"statusRef\":{\"uuid\":${gson.toJson(statusUuid.toString())}," +
          "\"entityClass\":\"$STATUS_ENTITY_CLASS\"}"

  /** `"inboxRef":{"uuid":"…","entityClass":"de.xima.fc.entities.Postfach"}` — the "Postfach". */
  fun inboxRefJson(inboxUuid: UUID): String =
      "\"inboxRef\":{\"uuid\":${gson.toJson(inboxUuid.toString())}," +
          "\"entityClass\":\"$INBOX_ENTITY_CLASS\"}"

  /**
   * `elementsToCopy` as `de.xima.fc.workflow.Setting<String>` objects: `name` is the field of the
   * TARGET form, `value` the source expression (placeholders allowed — the field carries
   * `@Placeholder`). Returns `null` when the AI assigned no values.
   */
  private fun settingsJson(nodeParams: Map<String, Any?>): String? {
    @Suppress("UNCHECKED_CAST")
    val mappings =
        (nodeParams["elementsToCopy"] as? List<*>).orEmpty().filterIsInstance<Map<*, *>>()
    val settings =
        mappings.mapNotNull { m ->
          val name = (m["name"] as? String)?.trim().orEmpty()
          if (name.isEmpty()) return@mapNotNull null
          val value = m["value"] as? String ?: ""
          "{\"name\":${gson.toJson(name)},\"value\":${gson.toJson(value)}," +
              "\"deletable\":true,\"nameEditable\":true,\"valueEditable\":true,\"required\":false}"
        }
    return if (settings.isEmpty()) null else settings.joinToString(",")
  }

  /**
   * `transferAttachments` + `attachmentFilter` (`de.xima.fc.workflow.model.nodes.MultiFile`): the
   * files of the named upload fields are passed to the new record. Returns `null` when neither an
   * upload field nor an explicit transfer flag was requested.
   */
  private fun transferJson(nodeParams: Map<String, Any?>): String? {
    // The model names the upload fields either as plain ids in "files" (the documented shape) or as
    // the REAL MultiFile items in "attachments" (`[{"type":"UPLOAD","identifier":"upload1"}]`,
    // which
    // a live run emitted) — both are accepted, otherwise the files silently stayed behind.
    val sources = LinkedHashSet<Pair<String, String>>()
    @Suppress("UNCHECKED_CAST")
    (nodeParams["files"] as? List<*>).orEmpty().filterIsInstance<String>().forEach { raw ->
      val id = raw.trim()
      if (id.isNotEmpty()) sources.add("UPLOAD" to id)
    }
    @Suppress("UNCHECKED_CAST")
    (nodeParams["attachments"] as? List<*>).orEmpty().filterIsInstance<Map<*, *>>().forEach { m ->
      val identifier = ((m["identifier"] as? String) ?: (m["name"] as? String))?.trim().orEmpty()
      val type = (m["type"] as? String)?.trim()?.uppercase()?.ifEmpty { "UPLOAD" } ?: "UPLOAD"
      // A SEARCH item selects attachments by FILE NAME and has no upload field to reference.
      if (identifier.isNotEmpty() && type != "SEARCH") sources.add(type to identifier)
    }
    val explicit =
        TRANSFER_FLAGS.any { key ->
          when (val v = nodeParams[key]) {
            is Boolean -> v
            is String -> v.equals("true", ignoreCase = true)
            else -> false
          }
        }
    if (sources.isEmpty() && !explicit) return null
    val parts = mutableListOf<String>("\"transferAttachments\":true")
    if (sources.isNotEmpty()) {
      val resources =
          sources.joinToString(",") { (type, identifier) ->
            "{\"type\":${gson.toJson(type)},\"identifier\":${gson.toJson(identifier)}}"
          }
      parts.add("\"attachmentFilter\":{\"resources\":[$resources],\"attachmentFilter\":[]}")
    }
    return parts.joinToString(",")
  }

  /**
   * Resolves the TARGET form the AI put into the node's `projectName` to its UUID.
   *
   * The AI receives the AVAILABLE FORMS list (titles incl. their status names) and decides which
   * form is meant; this method only translates that title into a UUID by comparing it EXACTLY
   * (case-insensitive, trimmed) against the stored TITLE (`getTitel()`, the value the designer
   * shows) and the technical `NAME` — no fuzzy scoring, no similarity thresholds, no guessing.
   *
   * @return The UUID of the form with that exact title/name, or `null` when no form carries it.
   */
  fun resolveProjectUuid(userContext: Any?, wantedTitle: String): UUID? {
    val key = wantedTitle.trim()
    if (userContext == null || key.isEmpty()) return null
    return try {
      withEntityManager(userContext) { em ->
        loadEntities(em, "SELECT p FROM de.xima.fc.entities.Projekt p")
            .firstOrNull { project ->
              titleOf(project).equals(key, ignoreCase = true) ||
                  nameOf(project).equals(key, ignoreCase = true)
            }
            ?.let { uuidOf(it) }
      }
    } catch (e: Exception) {
      logFailure("resolve the target form '$key'", e)
      null
    }
  }

  /**
   * Reads the target form's workflow flavour, its statuses and the client's inboxes and matches the
   * AI's requested status/inbox names against them.
   *
   * The statuses are the `de.xima.fc.entities.Status` rows of that PROJECT — the plugin's
   * "Ziel-Status" selector is filled by `IStatusDao.getAllByProjekt`; a `WorkflowState` UUID is NOT
   * what the node reads. The rows are filtered in Kotlin instead of via a JPQL/native join so no
   * column name is assumed (a hand-written `WHERE LOWER(ws.NAME) = …` join already failed with
   * `Column "WS.NAME" not found` and silently left the record without a status).
   *
   * The inboxes are the `de.xima.fc.entities.Postfach` rows of the CLIENT (`InboxChoiceProvider` →
   * `WorkflowProviderHelper.computeAllInboxes(ctx, mandant)`), which is what the plugin's own
   * "Postfach" property offers.
   *
   * @param wantedStatus The status name the AI requested (`stateName`). Matched exactly
   *   (case-insensitive) against the form's status `name`/`bezeichner`.
   * @param wantedInbox The inbox name the AI requested (`inboxName`). Matched exactly
   *   (case-insensitive) against the client's inbox names.
   * @return The resolved target information, or `null` when the target form cannot be read.
   */
  fun resolveTarget(
      userContext: Any?,
      projectUuid: UUID?,
      wantedStatus: String,
      wantedInbox: String = ""
  ): RemoteFormRecordTarget? {
    if (userContext == null || projectUuid == null) return null
    return try {
      withEntityManager(userContext) { em ->
        val project =
            loadEntities(em, "SELECT p FROM de.xima.fc.entities.Projekt p").firstOrNull {
              uuidOf(it) == projectUuid
            }
        val usesNewWorkflow =
            project?.let { p ->
              runCatching { p.javaClass.getMethod("isUsesNewWorkflow").invoke(p) as? Boolean }
                  .getOrNull()
            } ?: false
        val statuses =
            loadEntities(em, "SELECT s FROM de.xima.fc.entities.Status s")
                .filter { status ->
                  val owner =
                      runCatching { status.javaClass.getMethod("getProjekt").invoke(status) }
                          .getOrNull()
                  uuidOf(owner) == projectUuid
                }
                .sortedBy { status ->
                  runCatching { status.javaClass.getMethod("getIdxNum").invoke(status) as? Number }
                      .getOrNull()
                      ?.toInt() ?: Int.MAX_VALUE
                }
        val wanted = wantedStatus.trim()
        val match =
            if (wanted.isEmpty()) null
            else
                statuses.firstOrNull { status ->
                  nameOf(status).equals(wanted, ignoreCase = true) ||
                      runCatching {
                            status.javaClass.getMethod("getBezeichner").invoke(status) as? String
                          }
                          .getOrNull()
                          .orEmpty()
                          .equals(wanted, ignoreCase = true)
                }
        // Fallback only for an EXPLICIT status request: the new record then still gets a status of
        // its own form instead of none at all. Without a request the plugin keeps its default.
        val chosen = match ?: if (wanted.isEmpty()) null else statuses.firstOrNull()
        // The inbox is CLIENT-wide, not per form: the plugin's own selector lists every Postfach of
        // the mandant the target form belongs to.
        val mandant =
            project?.let {
              runCatching { it.javaClass.getMethod("getMandant").invoke(it) }.getOrNull()
            }
        val inboxes =
            loadEntities(em, "SELECT p FROM de.xima.fc.entities.Postfach p")
                .filter { inbox -> mandant == null || sameMandant(inbox, mandant) }
                .sortedBy { nameOf(it) }
        val wantedInboxName = wantedInbox.trim()
        val inboxMatch =
            if (wantedInboxName.isEmpty()) null
            else
                inboxes.firstOrNull { nameOf(it).equals(wantedInboxName, ignoreCase = true) }
                    ?: inboxes.firstOrNull {
                      normalizeInboxKey(nameOf(it)) == normalizeInboxKey(wantedInboxName)
                    }
        RemoteFormRecordTarget(
            usesNewWorkflow = usesNewWorkflow,
            statusUuid = chosen?.let { uuidOf(it) },
            statusName = chosen?.let { nameOf(it) },
            requestedStatusFound = match != null,
            availableStatuses = statuses.map { nameOf(it) }.filter { it.isNotBlank() },
            inboxUuid = inboxMatch?.let { uuidOf(it) },
            inboxName = inboxMatch?.let { nameOf(it) },
            requestedInboxFound = inboxMatch != null,
            availableInboxes = inboxes.map { nameOf(it) }.filter { it.isNotBlank() })
      }
    } catch (e: Exception) {
      logFailure("read the statuses of the target form $projectUuid", e)
      null
    }
  }

  /** Opens a Formcycle entity context for [userContext] and closes it again. */
  private fun <T> withEntityManager(userContext: Any, block: (Any) -> T): T {
    val factoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val entityContext =
        factoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
    return try {
      val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
      block(em)
    } finally {
      runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
    }
  }

  private fun loadEntities(em: Any, jpql: String): List<Any> {
    val query = em.javaClass.getMethod("createQuery", String::class.java).invoke(em, jpql)
    @Suppress("UNCHECKED_CAST")
    return (query.javaClass.getMethod("getResultList").invoke(query) as? List<*>)?.filterNotNull()
        ?: emptyList()
  }

  private fun logFailure(label: String, e: Exception) {
    val cause =
        if (e is java.lang.reflect.InvocationTargetException && e.cause != null) e.cause!! else e
    logger.warn("Could not {}: {}", label, "${cause::class.simpleName}: ${cause.message ?: "null"}")
  }

  /**
   * The inbox name the AI put into the node params. Several spellings are accepted because the
   * model sometimes names the key after the property ("inboxRef") or after the German label
   * ("Postfach").
   */
  fun requestedInboxName(nodeParams: Map<String, Any?>): String =
      INBOX_KEYS.firstNotNullOfOrNull { key ->
            (nodeParams[key] as? String)?.trim()?.takeIf { it.isNotEmpty() }
          }
          .orEmpty()

  /** `true` when the inbox belongs to the same `Mandant` as the target form (id, then UUID). */
  private fun sameMandant(inbox: Any, mandant: Any): Boolean {
    val inboxMandant =
        runCatching { inbox.javaClass.getMethod("getMandant").invoke(inbox) }.getOrNull()
            ?: return false
    if (inboxMandant === mandant) return true
    val expectedId =
        runCatching { mandant.javaClass.getMethod("getId").invoke(mandant) as? Number }
            .getOrNull()
            ?.toLong()
    val actualId =
        runCatching { inboxMandant.javaClass.getMethod("getId").invoke(inboxMandant) as? Number }
            .getOrNull()
            ?.toLong()
    if (expectedId != null && actualId != null) return expectedId == actualId
    val expectedUuid = uuidOf(mandant)
    return expectedUuid != null && expectedUuid == uuidOf(inboxMandant)
  }

  /**
   * Mechanical comparison key for an inbox NAME: lower case, without spaces/punctuation and without
   * leading zeros in numeric groups — so the user's "FOR 308" matches the stored "FOR 0308".
   *
   * This translates a NAME, it does not interpret a request: WHICH inbox is meant is still decided
   * by the user/AI (the list of real inbox names is part of the prompt).
   */
  fun normalizeInboxKey(name: String): String {
    val compact = name.lowercase().filter { it.isLetterOrDigit() }
    val out = StringBuilder(compact.length)
    var i = 0
    while (i < compact.length) {
      if (compact[i].isDigit()) {
        var end = i
        while (end < compact.length && compact[end].isDigit()) end++
        out.append(compact.substring(i, end).trimStart('0').ifEmpty { "0" })
        i = end
      } else {
        out.append(compact[i])
        i++
      }
    }
    return out.toString()
  }

  private fun nameOf(entity: Any): String =
      runCatching { entity.javaClass.getMethod("getName").invoke(entity) as? String }
          .getOrNull()
          .orEmpty()

  /** The form TITLE the designer shows (`getTitel()`), falling back to the technical name. */
  private fun titleOf(project: Any): String {
    val titel =
        runCatching { project.javaClass.getMethod("getTitel").invoke(project) as? String }
            .getOrNull()
    return if (titel.isNullOrBlank()) nameOf(project) else titel
  }

  /** `getUUIDObject()` first, `getUUID()` (String) as fallback — the entity classes differ. */
  private fun uuidOf(entity: Any?): UUID? {
    if (entity == null) return null
    val direct =
        runCatching { entity.javaClass.getMethod("getUUIDObject").invoke(entity) }.getOrNull()
    if (direct is UUID) return direct
    val text =
        runCatching { entity.javaClass.getMethod("getUUID").invoke(entity) as? String }.getOrNull()
    val trimmed = text?.trim()
    if (trimmed.isNullOrEmpty()) return null
    return runCatching { UUID.fromString(trimmed) }.getOrNull()
  }
}
