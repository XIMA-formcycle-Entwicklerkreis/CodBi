import fs from 'fs';

const filePath = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(filePath, 'utf-8');

// Find and replace the resolveProjectFileUuid function body
// The old function starts with the tableNames line and ends with the null on the line before the finally block

const oldFnBody = `        val tableNames = listOf("RESOURCE_PROJECT", "FILE_RESOURCE_PROJECT", "FILE_PROJECT")
        for (tableName in tableNames) {
          try {
            val sql = "SELECT uuid FROM $tableName WHERE project_id = ?1 AND name = ?2"
            val query = em.createNativeQuery(sql)
            query.setParameter(1, projectId)
            query.setParameter(2, fileName)
            val results = query.resultList
            if (results.isNotEmpty()) {
              val uuidStr = results[0]?.toString() ?: continue
              return try {
                UUID.fromString(uuidStr)
              } catch (_: Exception) {
                null
              }
            }
          } catch (_: Exception) {
            continue
          }
        }
        // Fallback: try querying with 'filename' column instead of 'name'
        for (tableName in tableNames) {
          try {
            val sql = "SELECT uuid FROM $tableName WHERE project_id = ?1 AND filename = ?2"
            val query = em.createNativeQuery(sql)
            query.setParameter(1, projectId)
            query.setParameter(2, fileName)
            val results = query.resultList
            if (results.isNotEmpty()) {
              val uuidStr = results[0]?.toString() ?: continue
              return try {
                UUID.fromString(uuidStr)
              } catch (_: Exception) {
                null
              }
            }
          } catch (_: Exception) {
            continue
          }
        }
        null`;

const newFnBody = `        // Try schema discovery first: find tables with project_id + name columns
        var foundUuid: UUID? = null
        val schemaTables = mutableListOf<String>()
        try {
          val schemaQuery = em.createNativeQuery(
            "SELECT LOWER(table_name), LOWER(column_name) FROM information_schema.columns " +
            "WHERE LOWER(table_name) LIKE '%resource%' OR LOWER(table_name) LIKE '%file%' " +
            "ORDER BY table_name, ordinal_position")
          val schemaRows = schemaQuery.resultList
          val tableCols = mutableMapOf<String, MutableList<String>>()
          for (row in schemaRows) {
            if (row is Array<*>) {
              val t = row[0]?.toString() ?: continue
              val col = row[1]?.toString() ?: continue
              tableCols.getOrPut(t) { mutableListOf() }.add(col)
            }
          }
          for ((tbl, cols) in tableCols) {
            val hasProjId = cols.any { it == "project_id" || it == "projekt_id" || it == "fk_projekt" }
            val hasName = cols.any { it == "name" || it == "filename" || it == "bezeichnung" || it == "dateiname" }
            val idCol = when { "uuid" in cols -> "uuid"; "id" in cols -> "id"; else -> null }
            val nameCol = when { "name" in cols -> "name"; "filename" in cols -> "filename"; "bezeichnung" in cols -> "bezeichnung"; "dateiname" in cols -> "dateiname"; else -> null }
            val projCol = when { "project_id" in cols -> "project_id"; "projekt_id" in cols -> "projekt_id"; "fk_projekt" in cols -> "fk_projekt"; else -> null }
            if (hasProjId && nameCol != null && idCol != null && projCol != null) {
              schemaTables.add(tbl)
              try {
                val sql = "SELECT $idCol FROM $tbl WHERE $projCol = ?1 AND $nameCol = ?2"
                val q = em.createNativeQuery(sql)
                q.setParameter(1, projectId)
                q.setParameter(2, fileName)
                val results = q.resultList
                if (results.isNotEmpty()) {
                  val idStr = results[0]?.toString() ?: continue
                  foundUuid = try { UUID.fromString(idStr) } catch (_: Exception) { if (idCol == "id") UUID.nameUUIDFromBytes(idStr.toByteArray()) else null }
                  if (foundUuid != null) break
                }
              } catch (_: Exception) { continue }
            }
          }
        } catch (_: Exception) { }
        if (foundUuid != null) return foundUuid
        // Fallback: table registry + query combinations
        val nameCols = listOf("name", "filename", "bezeichnung", "dateiname")
        val projCols = listOf("project_id", "projekt_id", "fk_projekt")
        val tableNames = if (schemaTables.isNotEmpty()) schemaTables else listOf(
          "RESOURCE_PROJECT", "FILE_RESOURCE_PROJECT", "FILE_PROJECT",
          "PROJEKTRESSOURCE", "PROJEKT_RESSOURCE", "PROJECT_RESOURCE",
          "RESSOURCE_PROJEKT", "RESOURCE_PROJECT", "PROJEKT_DATEI")
        for (tableName in tableNames) {
          for (nameCol in nameCols) {
            for (projCol in projCols) {
              for (idCol in listOf("uuid", "id")) {
                try {
                  val sql = "SELECT $idCol FROM $tableName WHERE $projCol = ?1 AND $nameCol = ?2"
                  val q = em.createNativeQuery(sql)
                  q.setParameter(1, projectId)
                  q.setParameter(2, fileName)
                  val results = q.resultList
                  if (results.isNotEmpty()) {
                    val idStr = results[0]?.toString() ?: continue
                    return try { UUID.fromString(idStr) } catch (_: Exception) { if (idCol == "id") UUID.nameUUIDFromBytes(idStr.toByteArray()) else null }
                  }
                } catch (_: Exception) { continue }
              }
            }
          }
        }
        null`;

if (c.includes(oldFnBody)) {
    c = c.replace(oldFnBody, newFnBody);
    fs.writeFileSync(filePath, c, 'utf-8');
    console.log('resolveProjectFileUuid updated successfully');
} else {
    console.log('ERROR: Could not find old function body');
    // Find the approximate location
    const idx = c.indexOf('RESOURCE_PROJECT');
    if (idx >= 0) {
        const snippet = c.substring(idx, idx + 200);
        console.log('Found RESOURCE_PROJECT at', idx);
        console.log('Snippet:', JSON.stringify(snippet.substring(0, 100)));
    }
}
