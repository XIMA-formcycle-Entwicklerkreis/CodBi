import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();
const files = [
    'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt',
    'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIWorkflowAssistant.kt'
];

for (const relPath of files) {
    const filePath = path.join(baseDir, relPath);
    console.log(`Processing: ${relPath}`);
    let content = fs.readFileSync(filePath, 'utf-8');
    const origLen = content.length;

    // ===== Change 1: System Prompt =====
    // Find: Set 'fileName' to the exact filename as stored in the form's file section (e.g. "xoxo.txt").\n" +
    //             "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; " +
    // Replace with: same text but with FC_ENCODE_BASE64 and FC_DECODE_BASE64 inserted before FC_SHOW_TEMPLATE

    const targetLine = `  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +`;
    const idx2 = content.indexOf(targetLine);
    if (idx2 < 0) {
        console.log(`  ERROR: '${targetLine}' not found`);
        continue;
    }

    const beforeTarget = content.substring(idx2 - 200, idx2);
    const afterTarget = content.substring(idx2 + targetLine.length, idx2 + targetLine.length + 100);
    console.log(`  Context before: ${beforeTarget.replace(/\n/g, '\\n').trim().slice(-100)}`);
    console.log(`  Context after: ${afterTarget.replace(/\n/g, '\\n').trim().slice(0, 80)}`);

    // The actual search needs to include the line before too
    const prevLineStart = content.lastIndexOf('\n', idx2 - 1) + 1;
    const prevLine = content.substring(prevLineStart, idx2);
    console.log(`  Previous line: ${prevLine.replace(/\n/g, '\\n').trim()}`);
    
    // Check if the prev line contains the pivot text
    if (prevLine.includes('Set ' + "'fileName'") || prevLine.includes('"xoxo.txt"')) {
        console.log('  Found the correct FC_SHOW_TEMPLATE in system prompt');
        
        // Build replacement by inserting before the FC_SHOW_TEMPLATE line
        const insertText = 
            '  - "FC_ENCODE_BASE64" - encodes a file or form upload to Base64; " +\n' +
            '            "nodeParams: {"file":"<filename from form resources, e.g. ' + "'xoxo.txt'" + '>"}\n" +\n' +
            '            "  - "FC_DECODE_BASE64" - decodes a Base64-encoded file back to its original format; " +\n' +
            '            "nodeParams: {"base64":"<base64 content>", "exportName":"<output filename, e.g. ' + "'xoxo.txt'" + '>"}\n" +\n' +
            '            "  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +';
        
        // But wait - the trailing '+ ' after FC_SHOW_TEMPLATE needs the wrap too
        // Actually the targetLine ends with ' +', so replacing from idx2:
        const newSection = insertText;
        const oldSectionLen = targetLine.length;
        
        content = content.substring(0, idx2) + newSection + content.substring(idx2 + oldSectionLen);
        console.log('  Change 1 applied successfully');
    } else {
        // This is a different FC_SHOW_TEMPLATE found first (JavaDoc comment)
        // Find the NEXT occurrence
        const idx3 = content.indexOf(targetLine, idx2 + 1);
        if (idx3 > 0) {
            const prevLine2 = content.substring(content.lastIndexOf('\n', idx3 - 1) + 1, idx3);
            console.log(`  Next occurrence prev line: ${prevLine2.replace(/\n/g, '\\n').trim()}`);
            if (prevLine2.includes("xoxo.txt") || prevLine2.includes("'fileName'")) {
                const insertText = 
                    '  - "FC_ENCODE_BASE64" - encodes a file or form upload to Base64; " +\n' +
                    '            "nodeParams: {"file":"<filename from form resources, e.g. ' + "'xoxo.txt'" + '>"}\n" +\n' +
                    '            "  - "FC_DECODE_BASE64" - decodes a Base64-encoded file back to its original format; " +\n' +
                    '            "nodeParams: {"base64":"<base64 content>", "exportName":"<output filename, e.g. ' + "'xoxo.txt'" + '>"}\n" +\n' +
                    '            "  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +';
                content = content.substring(0, idx3) + insertText + content.substring(idx3 + targetLine.length);
                console.log('  Change 1 applied on second occurrence');
            }
        } else {
            console.log('  No suitable FC_SHOW_TEMPLATE found for Change 1');
        }
    }

    // ===== Change 2: Already applied by previous script - verify =====
    const encodeCount = content.split('FC_ENCODE_BASE64').length - 1;
    const handlerCount = content.split('FC_ENCODE_BASE64" -> {').length - 1;
    const decodeHandlerCount = content.split('FC_DECODE_BASE64" -> {').length - 1;
    const promptCount = content.split('FC_ENCODE_BASE64" - encodes').length - 1;
    const decodePromptCount = content.split('FC_DECODE_BASE64" - decodes').length - 1;
    
    console.log(`  FC_ENCODE_BASE64 total: ${encodeCount}, handler: ${handlerCount}, prompt: ${promptCount}`);
    console.log(`  FC_DECODE_BASE64 handler: ${decodeHandlerCount}, prompt: ${decodePromptCount}`);

    if (content.length !== origLen) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  File saved (${content.length - origLen} bytes changed)`);
    } else {
        console.log('  No changes');
    }
    console.log('');
}
