package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import org.slf4j.LoggerFactory

/**
 * Repairs the **index columns** of FORMCYCLE's indexed collections.
 *
 * `WorkflowProcess.tasks` and `WorkflowNode.children` are Hibernate `@OrderColumn` lists. A row
 * with a `NULL` index column makes Hibernate fail while loading the collection:
 * ```
 * org.hibernate.HibernateException: null index column for collection: de.xima.fc.entities.WorkflowProcess.tasks
 * ```
 *
 * …which kills the whole designer (both the form and the workflow tab) for that project. Anything
 * that inserts such rows outside FORMCYCLE's own ordering code (like [MirrorTriggerPaths] creating
 * a reflecting workflow path) must therefore renumber the collection, and the background watcher
 * heals installations that were already damaged.
 *
 * All access uses native SQL through an `EntityContext` (own transaction), exactly like the other
 * Mirror helpers.
 *
 * @since 1.1.0
 */
internal object MirrorDataRepair {

  private val logger = LoggerFactory.getLogger(MirrorDataRepair::class.java)

  /**
   * Renumbers the tasks of [processId] contiguously (`0…n-1`), preserving the current order and
   * appending rows with a `NULL` index at the end. Returns the number of updated rows.
   */
  fun renumberProcessTasks(userContext: Any?, processId: Long?): Int {
    if (userContext == null || processId == null || processId <= 0L) return 0
    return withEntityManager(userContext) { em ->
      renumber(
          em,
          selectSql =
              "SELECT id FROM workflow_task WHERE process_id = $processId " +
                  "ORDER BY COALESCE(proc_order_idx, 1000000), id",
          updateSqlPrefix = "UPDATE workflow_task SET proc_order_idx = ")
    }
  }

  /**
   * Heals every `WorkflowProcess.tasks` / `WorkflowNode.children` collection that contains a row
   * with a `NULL` index column. Cheap read-only pass when the installation is healthy; returns the
   * number of repaired collections.
   */
  fun repairAll(userContext: Any?): Int {
    if (userContext == null) return 0
    return withEntityManager(userContext) { em ->
      var repaired = 0
      val processes =
          distinctIds(
              em, "SELECT DISTINCT process_id FROM workflow_task WHERE proc_order_idx IS NULL")
      for (processId in processes) {
        renumber(
            em,
            selectSql =
                "SELECT id FROM workflow_task WHERE process_id = $processId " +
                    "ORDER BY COALESCE(proc_order_idx, 1000000), id",
            updateSqlPrefix = "UPDATE workflow_task SET proc_order_idx = ")
        repaired++
        logger.warn(
            "[CodBi][Mirror] repaired NULL proc_order_idx rows of WorkflowProcess {} (the designer " +
                "would otherwise fail with 'null index column')",
            processId)
      }
      val parents =
          distinctIds(
              em,
              "SELECT DISTINCT parent_id FROM workflow_node " +
                  "WHERE parent_id IS NOT NULL AND parent_order_idx IS NULL")
      for (parentId in parents) {
        renumber(
            em,
            selectSql =
                "SELECT id FROM workflow_node WHERE parent_id = $parentId " +
                    "ORDER BY COALESCE(parent_order_idx, 1000000), id",
            updateSqlPrefix = "UPDATE workflow_node SET parent_order_idx = ")
        repaired++
        logger.warn(
            "[CodBi][Mirror] repaired NULL parent_order_idx rows of WorkflowNode {}", parentId)
      }
      repaired
    }
  }

  // region Internals

  /** Runs [block] inside its own `EntityContext` transaction; returns 0 when unavailable. */
  private fun withEntityManager(userContext: Any, block: (Any) -> Int): Int {
    return try {
      val factoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          factoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      try {
        val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
        val tx = em.javaClass.getMethod("getTransaction").invoke(em)
        tx.javaClass.getMethod("begin").invoke(tx)
        try {
          val result = block(em)
          tx.javaClass.getMethod("commit").invoke(tx)
          result
        } catch (x: Exception) {
          runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
          throw x
        }
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (x: Exception) {
      logger.warn("[CodBi][Mirror] order-index repair failed: {}", x.message)
      0
    }
  }

  /** Rewrites the index column of the rows returned by [selectSql] to `0…n-1`. */
  private fun renumber(em: Any, selectSql: String, updateSqlPrefix: String): Int {
    val rows =
        runCatching {
              val query =
                  em.javaClass
                      .getMethod("createNativeQuery", String::class.java)
                      .invoke(em, selectSql)
              @Suppress("UNCHECKED_CAST")
              (query.javaClass.getMethod("getResultList").invoke(query) as? List<*>)
                  ?: emptyList<Any>()
            }
            .getOrDefault(emptyList())
    var index = 0
    var changed = 0
    for (row in rows) {
      val id = (row as? Number)?.toLong() ?: continue
      val update = updateSqlPrefix + index + " WHERE id = " + id
      runCatching {
        val query =
            em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, update)
        query.javaClass.getMethod("executeUpdate").invoke(query)
        changed++
      }
      index++
    }
    return changed
  }

  /** Distinct numeric ids of the first column of [sql] (empty on any error). */
  private fun distinctIds(em: Any, sql: String): List<Long> =
      runCatching {
            val query =
                em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, sql)
            @Suppress("UNCHECKED_CAST")
            ((query.javaClass.getMethod("getResultList").invoke(query) as? List<*>)
                    ?: emptyList<Any>())
                .mapNotNull { (it as? Number)?.toLong() }
          }
          .getOrDefault(emptyList())

  // endregion Internals
}
