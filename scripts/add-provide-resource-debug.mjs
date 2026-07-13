import fs from 'fs';

const filePath = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(filePath, 'utf-8');

// Find the section where it queries "All nodes" and insert our new query before it
const marker = '// Also query ALL nodes (any type) for the most recent 5 to see their data';

const insert = `            // DEBUG: Query FC_DECODE_BASE64 and FC_PROVIDE_RESOURCE nodes for CUSTOM_PARAMS
            try {
              val sampleQuery = emDebug.createNativeQuery(
                "SELECT id, ITEM_TYPE, ITEM_NAME, CAST(\$customParamsCol AS VARCHAR(2000)) FROM workflow_node " +
                "WHERE ITEM_TYPE IN ('FC_DECODE_BASE64', 'FC_PROVIDE_RESOURCE') AND \$customParamsCol IS NOT NULL " +
                "ORDER BY id DESC")
              sampleQuery.maxResults = 5
              val sampleResults = sampleQuery.resultList
              if (sampleResults.isNotEmpty()) {
                logger.warn("[AICodBiAssistant] DEBUG: FC_DECODE_BASE64 / FC_PROVIDE_RESOURCE nodes:")
                for (row in sampleResults) {
                  when (row) {
                    is Array<*> ->
                        logger.warn(
                            "[AICodBiAssistant] DEBUG:   node id={}, type='{}', name='{}', params={}",
                            row[0], row[1], row[2],
                            if ((row[3] as? String)?.length ?: 0 > 1500) (row[3] as? String)?.take(1500)
                            else row[3])
                  }
                }
              } else {
                logger.warn("[AICodBiAssistant] DEBUG: No FC_DECODE_BASE64 or FC_PROVIDE_RESOURCE nodes found")
              }
            } catch (e: Exception) {
              logger.warn("[AICodBiAssistant] DEBUG FC_DECODE_BASE64/FC_PROVIDE_RESOURCE query failed: \${e.message}")
            }
            // Also query ALL nodes (any type) for the most recent 5 to see their data`;

if (c.includes(marker)) {
    c = c.replace(marker, insert);
    fs.writeFileSync(filePath, c, 'utf-8');
    console.log('Debug logging added for FC_DECODE_BASE64/FC_PROVIDE_RESOURCE');
} else {
    console.log('ERROR: Marker not found');
}
