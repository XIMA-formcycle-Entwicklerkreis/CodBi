import fs from 'fs';

const filePath = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(filePath, 'utf-8');

// Insert debug logging after tableCols population, before the schemaTables loop
const marker = `          }
          for ((tbl, cols) in tableCols) {`;

const debugInsert = `          }
          // DEBUG: Log all discovered table schemas for file resource debugging
          for ((tbl, cols) in tableCols) {
            logger.warn("[AICodBiAssistant] DEBUG resolveProjectFileUuid: table='{}' columns={}", tbl, cols.join(", "))
          }
          // Fallback: log ALL tables matching resource/file patterns even without expected columns
          logger.warn("[AICodBiAssistant] DEBUG resolveProjectFileUuid: discovered {} resource/file tables", tableCols.size)
          for ((tbl, cols) in tableCols) {`;

if (c.includes(marker)) {
    c = c.replace(marker, debugInsert);
    fs.writeFileSync(filePath, c, 'utf-8');
    console.log('Debug logging added successfully');
} else {
    console.log('ERROR: Marker not found');
    const idx = c.indexOf('tableCols.getOrPut');
    if (idx >= 0) {
        const snippet = c.substring(idx, idx + 400);
        console.log('Context:', snippet);
    }
}
