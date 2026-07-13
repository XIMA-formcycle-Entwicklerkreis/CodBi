import fs from 'fs';

const fp = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(fp, 'utf-8');

// Fix line 3453-3454: insert the missing append( call
// Current: ...is automatically\n" + \n"TRIGGER TYPES...
// Should be: ...is automatically\n\n")\n    append(\n        "TRIGGER TYPES...

const old = 'is automatically\\n" +\n        "TRIGGER TYPES';
const fixed = 'is automatically\\n\\n")\n    append(\n        "TRIGGER TYPES';

if (c.includes(old)) {
    c = c.replace(old, fixed);
    fs.writeFileSync(fp, c, 'utf-8');
    console.log('Fixed append() call');
} else {
    console.log('Pattern not found, trying without escaped...');
    const old2 = 'is automatically\n" +\n        "TRIGGER TYPES';
    if (c.includes(old2)) {
        c = c.replace(old2, 'is automatically\n\n")\n    append(\n        "TRIGGER TYPES');
        fs.writeFileSync(fp, c, 'utf-8');
        console.log('Fixed append() call (unescaped)');
    } else {
        console.log('Still not found');
        const idx = c.indexOf('TRIGGER TYPES');
        if (idx >= 0) {
            const ctx = c.substring(Math.max(0, idx - 60), idx + 40);
            console.log('Context:', ctx.replace(/\n/g, '\\n'));
        }
    }
}
