import fs from 'fs';

const filePath = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(filePath, 'utf-8');

// Fix: cols.join(", ") -> cols.joinToString(", ")
c = c.replace('cols.join(", ")', 'cols.joinToString(", ")');

fs.writeFileSync(filePath, c, 'utf-8');
console.log('Fixed join -> joinToString');
