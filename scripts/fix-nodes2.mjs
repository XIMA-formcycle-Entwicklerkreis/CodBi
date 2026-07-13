import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();
const files = [
    'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt',
    'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIWorkflowAssistant.kt'
];

for (const relPath of files) {
    const filePath = path.join(baseDir, relPath);
    console.log(`Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalLen = content.length;
    
    // ===== Change 1: System Prompt =====
    // Find the system prompt section with FC_RETURN_FILE docs and insert before FC_SHOW_TEMPLATE
    // Pattern: in the NODE TYPES section, "FC_RETURN_FILE" followed by "FC_SHOW_TEMPLATE"
    
    // More precise: search for the unique text around the system prompt area
    // The system prompt has: "  - \"FC_RETURN_FILE\" — returns a file to the user's browser for download; "
    // Followed by: "  - \"FC_SHOW_TEMPLATE\" — renders an HTML template to the user; "
    
    const searchRet = '  - "FC_RETURN_FILE" - returns a file to the user\'s browser for download; ';
    const searchShow = '  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; ';
    
    const idxRet = content.indexOf(searchRet);
    const idxShow = content.indexOf(searchShow);
    
    console.log(`  FC_RETURN_FILE found at: ${idxRet}`);
    console.log(`  FC_SHOW_TEMPLATE found at: ${idxShow}`);
    
    if (idxShow >= 0) {
        // Find the exact line to replace
        const lineStart = content.lastIndexOf('\n', idxShow) + 1;
        const lineEnd = content.indexOf('\n', idxShow);
        const line = content.substring(lineStart, lineEnd);
        console.log(`  Line to replace: ${line.trim()}`);
        
        // Check if the line has the em dash or hyphen
        const emDash = line.includes('\u2014');
        const hyphen = line.includes(' - ');
        console.log(`  Uses em dash: ${emDash}, hyphen: ${hyphen}`);
        
        // The text we need to find is:
        // Set 'fileName' to the exact filename as stored in the form's file section (e.g. "xoxo.txt").\n" +
        //             "  - \"FC_SHOW_TEMPLATE\" - renders an HTML template to the user; " +
        
        const searchPattern = 'Set \'fileName\' to the exact filename as stored in the form\'s file section (e.g. "xoxo.txt").';
        const idxPivot = content.indexOf(searchPattern);
        
        if (idxPivot >= 0) {
            console.log(`  Pivot found at ${idxPivot}`);
            
            // Find where the FC_SHOW_TEMPLATE line starts after the pivot
            const afterPivot = content.substring(idxPivot);
            const showIdx = afterPivot.indexOf('  - "FC_SHOW_TEMPLATE"');
            
            if (showIdx >= 0) {
                const absoluteShowIdx = idxPivot + showIdx;
                const prefixText = afterPivot.substring(0, showIdx);
                
                console.log(`  Text between pivot and FC_SHOW_TEMPLATE: ${prefixText.replace(/\n/g, '\\n').trim()}`);
                
                // Determine if there's a \n" +\n pattern between them
                const insertText = '  - "FC_ENCODE_BASE64" - encodes a file or form upload to Base64; " +\n            "nodeParams: {\\"file\\":\\"<filename from form resources, e.g. \'xoxo.txt\'>\\"}" +\n            "  - "FC_DECODE_BASE64" - decodes a Base64-encoded file back to its original format; " +\n            "nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. \'xoxo.txt\'>\\"}" +\n            "  - "FC_SHOW_TEMPLATE"';
                
                // Find the exact FC_SHOW_TEMPLATE line and replace it
                const showLineStart = content.lastIndexOf('\n', absoluteShowIdx) + 1;
                const showLineEnd = content.indexOf('\n', absoluteShowIdx);
                // But the actual text spans multiple logical lines in the Kotlin
                // The line after the pivot ends with \n" +
                // Then the next line starts with             "  - \"FC_SHOW_TEMPLATE\"...
                
                // Find what comes right after pivot: should be \n" +
                const afterPivotText = afterPivot.substring(0, 100);
                console.log(`  After pivot (first 100 chars): ${afterPivotText.replace(/\n/g, '\\n')}`);
                
                // The pattern is:
                // ...e.g. "xoxo.txt").\n" +
                //             "  - \"FC_SHOW_TEMPLATE\"...
                
                // We want to replace: \n" + \n            "  - \"FC_SHOW_TEMPLATE\"...
                // With: \n" + \n            "  - \"FC_ENCODE_BASE64\"... \n            "  - \"FC_DECODE_BASE64\"... \n            "  - \"FC_SHOW_TEMPLATE\"...
                
                // Find the exact newline after the pivot text
                const pivotEnd = idxPivot + searchPattern.length;
                const afterPivotSlice = content.substring(pivotEnd);
                
                // The pivot text ends with a newline pattern
                if (afterPivotSlice.startsWith('.\n" +\n            "  - "FC_SHOW_TEMPLATE"') || 
                    afterPivotSlice.startsWith(').\n" +\n            "  - "FC_SHOW_TEMPLATE"')) {
                    
                    const old = afterPivotSlice.substring(0, 80); // some safe length
                    const newStr = '.\n" +\n            "  - "FC_ENCODE_BASE64" - encodes a file or form upload to Base64; " +\n            "nodeParams: {\\"file\\":\\"<filename from form resources, e.g. \'xoxo.txt\'>\\"}" +\n            "  - "FC_DECODE_BASE64" - decodes a Base64-encoded file back to its original format; " +\n            "nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. \'xoxo.txt\'>\\"}" +\n            "  - "FC_SHOW_TEMPLATE"';
                    
                    // We need to be more careful about the replacement
                    // Let's just do a simple string replace
                    const target = 'Set \'fileName\' to the exact filename as stored in the form\'s file section (e.g. "xoxo.txt").\n" +\n            "  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +';
                    const replacement = 'Set \'fileName\' to the exact filename as stored in the form\'s file section (e.g. "xoxo.txt").\n" +\n            "  - "FC_ENCODE_BASE64" - encodes a file or form upload to Base64; " +\n            "nodeParams: {\\"file\\":\\"<filename from form resources, e.g. \'xoxo.txt\'>\\"}" +\n            "  - "FC_DECODE_BASE64" - decodes a Base64-encoded file back to its original format; " +\n            "nodeParams: {\\"base64\\":\\"<base64 content>\\", \\"exportName\\":\\"<output filename, e.g. \'xoxo.txt\'>\\"}" +\n            "  - "FC_SHOW_TEMPLATE" - renders an HTML template to the user; " +';
                    
                    if (content.includes(target)) {
                        content = content.replace(target, replacement);
                        console.log('  Change 1 (System Prompt) applied via direct replace');
                    } else {
                        // Try with different character encoding
                        const target2 = target.replace(/\u2014/g, '-'); // em dash to hyphen
                        if (content.includes(target2)) {
                            content = content.replace(target2, replacement.replace(/\u2014/g, '-'));
                            console.log('  Change 1 (System Prompt) applied (hyphen version)');
                        } else {
                            console.log('  ERROR: Direct replacement failed, content around pivot:');
                            console.log(`  ${afterPivotSlice.substring(0, 200).replace(/\n/g, '\\n')}`);
                        }
                    }
                } else {
                    console.log(`  After pivot starts with: ${afterPivotSlice.substring(0, 50).replace(/\n/g, '\\n')}`);
                }
            }
        } else {
            console.log('  ERROR: Could not find pivot text for Change 1');
        }
    }
    
    if (content.length !== originalLen) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  File saved (${content.length - originalLen} bytes changed)`);
    } else {
        console.log('  No changes made');
    }
}
