package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc.CodbiLocalApidoc
import com.google.gson.Gson
import java.lang.reflect.Type
import org.slf4j.LoggerFactory

/**
 * Phase-2 persistent store for the **last materialized source revision** of each mirror (target
 * workflow version + source path). Reuses the plugin's generic key-value table `codbi_local_apidoc`
 * (entity [CodbiLocalApidoc]) so the lazy re-sync can decide *whether* the source changed without
 * touching the reflecting lane when it has not.
 *
 * Key format: `codbi.mirror.materialized.<targetVersionId>.<sourceFormKey>.<sourcePathId>` Value:
 * the source path content revision (an [Int]) as a string. When the value is absent the lane was
 * never materialized -> a re-sync is required.
 *
 * All reads/writes use their own EntityManager + transaction via
 * [CodbiEntities.entityManagerFactory] (Formcycle-managed schema), exactly like the Local API Doc /
 * AI log stores, so they never touch the workflow executor's session.
 *
 * @see com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.WorkflowLaneMaterializer
 * @since 1.1.0
 */
object MirrorMaterializedStore {

  private val logger = LoggerFactory.getLogger(MirrorMaterializedStore::class.java)

  private const val KEY_PREFIX = "codbi.mirror.materialized."
  private const val REBUILD_PREFIX = "codbi.mirror.rebuildpending."
  private const val REGISTRY_PREFIX = "codbi.mirror.registry."

  /**
   * One persisted record describing a **reflecting** Mirror lane that must be re-materialized from
   * the source path. Produced by the reflecting-side Mirror node, consumed by the source-side
   * Mirror node (Option A1 proactive push).
   */
  data class ReflectorDescriptor(
      /** Project id of the reflecting form. */
      val reflectingProjectId: Long? = null,
      /**
       * Project id of the SOURCE form this reflector mirrors. Used for reverse lookup: the backend
       * `MirrorPush` handler gets only a saved source `WorkflowVersion`, resolves its project id,
       * and scans this field to find the registry rows that must be re-pushed.
       */
      val sourceProjectId: Long? = null,
      /** Reflecting workflow version id the lane belongs to. */
      val targetWorkflowVersionId: Long,
      /** Reflecting `WorkflowTask` (path) id that hosts the lane. */
      val taskId: Long,
      /** Id of the `WorkflowNode` whose children form the lane (SEQUENCE or task container). */
      val laneParentNodeId: Long,
      /** Ids of the current reflecting action-node children, in execution order. */
      val childNodeIds: List<Long> = emptyList(),
      /**
       * Mirror node's "sync endpoint" option. `null` (absent, e.g. an older registry row or a node
       * saved before the option existed) means `true` — the source's endpoint is materialized too.
       * Only `false` preserves the reflecting lane's own endpoint.
       */
      val syncEndpoint: Boolean? = null,
  )

  /**
   * A reflector paired with the source `(sourceFormKey, sourcePathId)` its registry row belongs to.
   */
  data class RegisteredReflector(
      val sourceFormKey: String,
      val sourcePathId: Long,
      val descriptor: ReflectorDescriptor,
  )

  /** Registry key for the set of reflectors of `(sourceFormKey, sourcePathId)`. */
  internal fun registryKey(sourceFormKey: String, sourcePathId: Long): String =
      "$REGISTRY_PREFIX$sourceFormKey.$sourcePathId"

  /** Percentage-format-free, collision-safe composite key. */
  internal fun key(targetVersionId: Long, sourceFormKey: String, sourcePathId: Long): String =
      "$KEY_PREFIX$targetVersionId.$sourceFormKey.$sourcePathId"

  /** Key under which the "structural rebuild is pending (lands next trigger)" marker is stored. */
  internal fun rebuildKey(
      targetVersionId: Long,
      sourceFormKey: String,
      sourcePathId: Long
  ): String = "$REBUILD_PREFIX$targetVersionId.$sourceFormKey.$sourcePathId"

  /**
   * Returns the last materialized source revision for the mirror, or `null` when the mirror was
   * never materialized (or the DB is not ready).
   */
  fun lastMaterializedRevision(
      targetVersionId: Long,
      sourceFormKey: String,
      sourcePathId: Long,
  ): Int? {
    if (sourceFormKey.isBlank()) return null
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    return try {
      val results =
          em.createQuery(
                  "SELECT e.content FROM ${CodbiLocalApidoc::class.java.name} e " +
                      "WHERE e.dataKey = :key",
                  String::class.java)
              .setParameter("key", key(targetVersionId, sourceFormKey, sourcePathId))
              .resultList
      if (results.isEmpty()) {
        null
      } else {
        results[0]?.trim()?.toIntOrNull()
      }
    } catch (x: Exception) {
      logger.debug(
          "[MirrorMaterializedStore] load failed for {}: {}",
          key(targetVersionId, sourceFormKey, sourcePathId),
          x.message)
      null
    } finally {
      runCatching { em.close() }
    }
  }

  /**
   * Records that the mirror's lane was materialized from [revision]. Idempotent upsert keyed by
   * (target version, source form, source path).
   */
  fun storeMaterializedRevision(
      targetVersionId: Long,
      sourceFormKey: String,
      sourcePathId: Long,
      revision: Int,
  ) {
    if (sourceFormKey.isBlank()) return
    val emf = CodbiEntities.entityManagerFactory ?: return
    val em = emf.createEntityManager()
    try {
      em.transaction.begin()
      val results =
          em.createQuery(
                  "SELECT e FROM ${CodbiLocalApidoc::class.java.name} e WHERE e.dataKey = :key",
                  CodbiLocalApidoc::class.java)
              .setParameter("key", key(targetVersionId, sourceFormKey, sourcePathId))
              .resultList
      val content = revision.toString()
      if (results.isEmpty()) {
        em.persist(
            CodbiLocalApidoc(
                dataKey = key(targetVersionId, sourceFormKey, sourcePathId), content = content))
      } else {
        results[0].content = content
      }
      em.transaction.commit()
      logger.debug(
          "[MirrorMaterializedStore] stored revision {} for {}/{} (target version {})",
          revision,
          sourceFormKey,
          sourcePathId,
          targetVersionId)
    } catch (x: Exception) {
      if (em.transaction.isActive) {
        runCatching { em.transaction.rollback() }
      }
      logger.warn(
          "[MirrorMaterializedStore] store failed for {}/{} revision {}: {}",
          sourceFormKey,
          sourcePathId,
          revision,
          x.message)
    } finally {
      runCatching { em.close() }
    }
  }

  /**
   * A pending structural lane rebuild: the source [revision] that was rebuilt plus the wall-clock
   * time it was recorded.
   *
   * The timestamp is what makes the convergence guard self-healing: a marker whose recreated lane
   * never became visible (e.g. because the reflecting workflow designer saved its stale in-memory
   * model over the recreated nodes) is aged out instead of blocking every later submit forever.
   */
  data class PendingRebuild(val revision: Int, val recordedAtMillis: Long) {
    /** @return how long ago the rebuild was recorded. */
    fun ageMillis(now: Long = System.currentTimeMillis()): Long = now - recordedAtMillis
  }

  /**
   * Returns the pending structural rebuild of this mirror, or `null` when none is recorded.
   *
   * Stored value: `<revision>:<epochMillis>`. A legacy plain `<revision>` value is still accepted
   * (treated as "recorded now", i.e. it is never aged out on this run).
   */
  fun pendingRebuildEntry(
      targetVersionId: Long,
      sourceFormKey: String,
      sourcePathId: Long,
  ): PendingRebuild? {
    if (sourceFormKey.isBlank()) return null
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    return try {
      val results =
          em.createQuery(
                  "SELECT e.content FROM ${CodbiLocalApidoc::class.java.name} e " +
                      "WHERE e.dataKey = :key",
                  String::class.java)
              .setParameter("key", rebuildKey(targetVersionId, sourceFormKey, sourcePathId))
              .resultList
      val raw = results.firstOrNull()?.trim().orEmpty()
      if (raw.isEmpty()) {
        null
      } else {
        val separator = raw.indexOf(':')
        // A legacy value (plain `<revision>`, written before the timestamp was introduced) is
        // treated as STALE: it cannot prove that its rebuild is still converging, and treating it
        // as
        // fresh would block the re-sync forever (the exact bug this timestamp fixes).
        if (separator < 0) {
          raw.toIntOrNull()?.let { PendingRebuild(it, 0L) }
        } else {
          val revision = raw.substring(0, separator).trim().toIntOrNull()
          val recordedAt = raw.substring(separator + 1).trim().toLongOrNull()
          if (revision == null) null else PendingRebuild(revision, recordedAt ?: 0L)
        }
      }
    } catch (x: Exception) {
      logger.debug(
          "[MirrorMaterializedStore] pendingRebuild load failed for {}: {}",
          rebuildKey(targetVersionId, sourceFormKey, sourcePathId),
          x.message)
      null
    } finally {
      runCatching { em.close() }
    }
  }

  /** Convenience: the source revision of the pending rebuild, or `null`. */
  fun pendingRebuild(
      targetVersionId: Long,
      sourceFormKey: String,
      sourcePathId: Long,
  ): Int? = pendingRebuildEntry(targetVersionId, sourceFormKey, sourcePathId)?.revision

  /**
   * Records that a structural rebuild is pending for [revision].
   *
   * Call this ONLY after a rebuild actually created nodes — a failed rebuild must stay retryable.
   */
  fun storeRebuildPending(
      targetVersionId: Long,
      sourceFormKey: String,
      sourcePathId: Long,
      revision: Int,
  ) {
    if (sourceFormKey.isBlank()) return
    val emf = CodbiEntities.entityManagerFactory ?: return
    val em = emf.createEntityManager()
    try {
      em.transaction.begin()
      val results =
          em.createQuery(
                  "SELECT e FROM ${CodbiLocalApidoc::class.java.name} e WHERE e.dataKey = :key",
                  CodbiLocalApidoc::class.java)
              .setParameter("key", rebuildKey(targetVersionId, sourceFormKey, sourcePathId))
              .resultList
      val content = "$revision:${System.currentTimeMillis()}"
      if (results.isEmpty()) {
        em.persist(
            CodbiLocalApidoc(
                dataKey = rebuildKey(targetVersionId, sourceFormKey, sourcePathId),
                content = content))
      } else {
        results[0].content = content
      }
      em.transaction.commit()
      logger.debug(
          "[MirrorMaterializedStore] rebuild pending stored for {}/{} (target version {})",
          sourceFormKey,
          sourcePathId,
          targetVersionId)
    } catch (x: Exception) {
      if (em.transaction.isActive) {
        runCatching { em.transaction.rollback() }
      }
      logger.warn(
          "[MirrorMaterializedStore] storeRebuildPending failed for {}/{} revision {}: {}",
          sourceFormKey,
          sourcePathId,
          revision,
          x.message)
    } finally {
      runCatching { em.close() }
    }
  }

  /** Clears the pending-rebuild marker for this mirror. */
  fun clearRebuildPending(
      targetVersionId: Long,
      sourceFormKey: String,
      sourcePathId: Long,
  ) {
    if (sourceFormKey.isBlank()) return
    val emf = CodbiEntities.entityManagerFactory ?: return
    val em = emf.createEntityManager()
    try {
      em.transaction.begin()
      val results =
          em.createQuery(
                  "SELECT e FROM ${CodbiLocalApidoc::class.java.name} e WHERE e.dataKey = :key",
                  CodbiLocalApidoc::class.java)
              .setParameter("key", rebuildKey(targetVersionId, sourceFormKey, sourcePathId))
              .resultList
      if (results.isNotEmpty()) {
        em.remove(results[0])
      }
      em.transaction.commit()
    } catch (x: Exception) {
      if (em.transaction.isActive) {
        runCatching { em.transaction.rollback() }
      }
      logger.debug(
          "[MirrorMaterializedStore] clearRebuildPending failed for {}: {}",
          rebuildKey(targetVersionId, sourceFormKey, sourcePathId),
          x.message)
    } finally {
      runCatching { em.close() }
    }
  }

  /** Lazily-initialised Gson used only for the registry (de)serialisation. */
  private val gson by lazy { Gson() }

  /** Gson `Type` for a `List<ReflectorDescriptor>`. */
  private val reflectorListType: Type by lazy {
    object : com.google.gson.reflect.TypeToken<List<ReflectorDescriptor>>() {}.type
  }

  /**
   * Upserts [descriptor] into the registry of the source `(sourceFormKey, sourcePathId)` so the
   * source-side Mirror node knows which reflecting lanes to push into. Reflectors are de-duplicated
   * by [ReflectorDescriptor.targetWorkflowVersionId] (a single reflecting lane per version).
   */
  fun registerReflector(
      sourceFormKey: String,
      sourcePathId: Long,
      descriptor: ReflectorDescriptor
  ) {
    if (sourceFormKey.isBlank()) return
    val emf = CodbiEntities.entityManagerFactory ?: return
    val em = emf.createEntityManager()
    try {
      em.transaction.begin()
      val key = registryKey(sourceFormKey, sourcePathId)
      val results =
          em.createQuery(
                  "SELECT e FROM ${CodbiLocalApidoc::class.java.name} e WHERE e.dataKey = :key",
                  CodbiLocalApidoc::class.java)
              .setParameter("key", key)
              .resultList
      val current = parseReflectors(if (results.isEmpty()) null else results[0].content)
      val updated =
          current
              .filterNot { it.targetWorkflowVersionId == descriptor.targetWorkflowVersionId }
              .toMutableList()
      updated.add(descriptor)
      val content = gson.toJson(updated)
      if (results.isEmpty()) {
        em.persist(CodbiLocalApidoc(dataKey = key, content = content))
      } else {
        results[0].content = content
      }
      em.transaction.commit()
      logger.debug(
          "[MirrorMaterializedStore] reflector registered for {}/{} (target version {})",
          sourceFormKey,
          sourcePathId,
          descriptor.targetWorkflowVersionId)
    } catch (x: Exception) {
      if (em.transaction.isActive) {
        runCatching { em.transaction.rollback() }
      }
      logger.warn(
          "[MirrorMaterializedStore] registerReflector failed for {}/{}: {}",
          sourceFormKey,
          sourcePathId,
          x.message)
    } finally {
      runCatching { em.close() }
    }
  }

  /**
   * Returns the reflecting lanes currently registered for the source `(sourceFormKey,
   * sourcePathId)`.
   */
  fun reflectorsOfSource(sourceFormKey: String, sourcePathId: Long): List<ReflectorDescriptor> {
    if (sourceFormKey.isBlank()) return emptyList()
    val emf = CodbiEntities.entityManagerFactory ?: return emptyList()
    val em = emf.createEntityManager()
    try {
      val results =
          em.createQuery(
                  "SELECT e FROM ${CodbiLocalApidoc::class.java.name} e WHERE e.dataKey = :key",
                  CodbiLocalApidoc::class.java)
              .setParameter("key", registryKey(sourceFormKey, sourcePathId))
              .resultList
      return parseReflectors(if (results.isEmpty()) null else results[0].content)
    } catch (x: Exception) {
      logger.warn(
          "[MirrorMaterializedStore] reflectorsOfSource failed for {}/{}: {}",
          sourceFormKey,
          sourcePathId,
          x.message)
      return emptyList()
    } finally {
      runCatching { em.close() }
    }
  }

  /**
   * Reverse lookup used by the backend `MirrorPush` handler: given only the project id of a just-
   * saved source `WorkflowVersion`, scans every registry row and returns the reflectors whose
   * [ReflectorDescriptor.sourceProjectId] matches. Registry row keys are
   * `codbi.mirror.registry.<key>.<pathId>`, so `(sourceFormKey, sourcePathId)` are recovered from
   * the key itself and returned alongside each descriptor.
   */
  fun reflectorsOfSourceProject(sourceProjectId: Long): List<RegisteredReflector> {
    if (sourceProjectId <= 0L) return emptyList()
    val emf = CodbiEntities.entityManagerFactory ?: return emptyList()
    val em = emf.createEntityManager()
    try {
      val results =
          em.createQuery(
                  "SELECT e FROM ${CodbiLocalApidoc::class.java.name} e WHERE e.dataKey LIKE :prefix",
                  CodbiLocalApidoc::class.java)
              .setParameter("prefix", "$REGISTRY_PREFIX%")
              .resultList
      val out = ArrayList<RegisteredReflector>()
      for (row in results) {
        val keySuffix = row.dataKey.removePrefix(REGISTRY_PREFIX)
        val (formKey, pathId) = splitRegistryKey(keySuffix) ?: continue
        for (descriptor in parseReflectors(row.content)) {
          if (descriptor.sourceProjectId != null && descriptor.sourceProjectId == sourceProjectId) {
            out.add(RegisteredReflector(formKey, pathId, descriptor))
          }
        }
      }
      return out
    } catch (x: Exception) {
      logger.warn(
          "[MirrorMaterializedStore] reflectorsOfSourceProject failed for project {}: {}",
          sourceProjectId,
          x.message)
      return emptyList()
    } finally {
      runCatching { em.close() }
    }
  }

  /**
   * Splits a registry key suffix `"<formKey>.<pathId>"` into its parts (pathId is the last token).
   */
  private fun splitRegistryKey(suffix: String): Pair<String, Long>? {
    val dot = suffix.lastIndexOf('.')
    if (dot <= 0 || dot == suffix.length - 1) return null
    val pathId = suffix.substring(dot + 1).toLongOrNull() ?: return null
    val formKey = suffix.substring(0, dot)
    if (formKey.isBlank()) return null
    return formKey to pathId
  }

  /** Removes a reflector from the registry of `(sourceFormKey, sourcePathId)` if present. */
  fun unregisterReflector(
      sourceFormKey: String,
      sourcePathId: Long,
      targetWorkflowVersionId: Long
  ) {
    if (sourceFormKey.isBlank()) return
    val emf = CodbiEntities.entityManagerFactory ?: return
    val em = emf.createEntityManager()
    try {
      em.transaction.begin()
      val key = registryKey(sourceFormKey, sourcePathId)
      val results =
          em.createQuery(
                  "SELECT e FROM ${CodbiLocalApidoc::class.java.name} e WHERE e.dataKey = :key",
                  CodbiLocalApidoc::class.java)
              .setParameter("key", key)
              .resultList
      if (results.isNotEmpty()) {
        val current = parseReflectors(results[0].content)
        val updated = current.filterNot { it.targetWorkflowVersionId == targetWorkflowVersionId }
        if (updated.isEmpty()) {
          em.remove(results[0])
        } else {
          results[0].content = gson.toJson(updated)
        }
      }
      em.transaction.commit()
    } catch (x: Exception) {
      if (em.transaction.isActive) {
        runCatching { em.transaction.rollback() }
      }
      logger.debug(
          "[MirrorMaterializedStore] unregisterReflector failed for {}/{}: {}",
          sourceFormKey,
          sourcePathId,
          x.message)
    } finally {
      runCatching { em.close() }
    }
  }

  /**
   * Tolerant JSON-array parse of a registry row. Returns an empty list on empty/malformed input.
   */
  private fun parseReflectors(content: String?): List<ReflectorDescriptor> {
    val text = content?.trim()
    if (text.isNullOrEmpty()) return emptyList()
    return try {
      val parsed =
          com.google.gson.JsonParser.parseString(text).takeIf { it.isJsonArray }
              ?: return emptyList()
      parsed.asJsonArray.mapNotNull { el ->
        if (!el.isJsonObject) return@mapNotNull null
        val obj = el.asJsonObject
        ReflectorDescriptor(
            reflectingProjectId =
                obj.get("reflectingProjectId")?.takeIf { it.isJsonPrimitive }?.asLong,
            sourceProjectId = obj.get("sourceProjectId")?.takeIf { it.isJsonPrimitive }?.asLong,
            targetWorkflowVersionId = obj.get("targetWorkflowVersionId")?.asLong ?: 0L,
            taskId = obj.get("taskId")?.asLong ?: 0L,
            laneParentNodeId = obj.get("laneParentNodeId")?.asLong ?: 0L,
            childNodeIds =
                obj.get("childNodeIds")
                    ?.takeIf { it.isJsonArray }
                    ?.asJsonArray
                    ?.mapNotNull { child -> child.takeIf { it.isJsonPrimitive }?.asLong }
                    ?: emptyList(),
        )
      }
    } catch (x: Exception) {
      logger.warn("[MirrorMaterializedStore] parseReflectors failed: {}", x.message)
      emptyList()
    }
  }
}
