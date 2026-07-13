import fs from 'fs';

// Helper: read file content
function fixFile(filePath) {
    let c = fs.readFileSync(filePath, 'utf-8');
    console.log(`Processing: ${filePath}`);
    
    // The target text at index 278738 (for AICodBiAssistant.kt):
    // "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; " +
    
    // Build search and replace using array.join to avoid escaping issues
    const searchParts = [
        '"  - \\"FC_SHOW_TEMPLATE\\"',
        ' \u2014 renders an HTML template to the user; " +'
    ];
    const target = searchParts.join('');
    
    const idx = c.indexOf(target);
    if (idx < 0) {
        console.log('  ERROR: target not found');
        return;
    }
    
    console.log(`  Found at index ${idx}`);
    
    const insert = 
        '"  - \\"FC_ENCODE_BASE64\\"' +
        ' \u2014 encodes a file or form upload to Base64; " +\n' +
        '            "nodeParams: {\\"file\\":\\"<filename from form resources, e.g. ' +
        "'" +
        'xoxo.txt' +
        "'" +
        '>\\"}\\n" +\n' +
        '            "  - \\"FC_DECODE_BASE64\\"' +
        ' \u2014 decodes a Base64-encoded file back to its original format; " +\n' +
        '            "nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. ' +
        "'" +
        'xoxo.txt' +
        "'" +
        '>\\"}\\n" +\n' +
        '            "  - \\"FC_SHOW_TEMPLATE\\"' +
        ' \u2014 renders an HTML template to the user; " +';
    
    c = c.substring(0, idx) + insert + c.substring(idx + target.length);
    fs.writeFileSync(filePath, c, 'utf-8');
    console.log('  Change applied successfully');
    console.log(`  New length: ${c.length}`);
}

const files = [
    'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt',
    'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIWorkflowAssistant.kt'
];

for (const f of files) {
    fixFile(f);
}
