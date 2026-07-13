import fs from 'fs';

const fp = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(fp, 'utf-8');

const idx = c.indexOf('CHAINED NODES');
if (idx < 0) { console.log('Not found'); process.exit(1); }

// Find the end of this line (next occurrence of \n" +)
const lineEnd = c.indexOf('\n', idx);
const nextLineStart = lineEnd + 1;
const nextLineEnd = c.indexOf('\n', nextLineStart);
const nextLine = c.substring(nextLineStart, nextLineEnd);

// The bad line starts at idx and ends at nextLineEnd (includes the line continuation \n" +)
// Find the end of the string continuation: look for \n" + or \n\n")
let searchPos = idx;
let endPos = idx;
let foundEnd = false;
while (!foundEnd && endPos < c.length) {
    const nlPos = c.indexOf('\n', endPos + 1);
    if (nlPos < 0) break;
    const afterNl = c.substring(nlPos + 1, nlPos + 20);
    // Look for the append( after the block
    if (afterNl.trimStart().startsWith('append(')) {
        // Go back to find the end of this section
        endPos = nlPos;
        foundEnd = true;
        break;
    }
    endPos = nlPos;
}

// The problematic section starts after line 3451 end and goes until the append(
// Let's find where line 3451 ends:
const line3451 = c.lastIndexOf('FC_DOI_INIT', idx);
const line3451End = c.indexOf('\n', line3451);
const afterLine3451 = c.indexOf('"', line3451End);

// Actually, let's just find the string that starts after line 3451
const chainSectionStart = c.indexOf('CHAINED NODES', idx);
// Find where the section ends (the next append( call)
const nextAppend = c.indexOf('append(', chainSectionStart);

console.log('Chain section from', chainSectionStart, 'to', nextAppend);

// The bad content from chainSectionStart to nextAppend
const badSection = c.substring(chainSectionStart, nextAppend);
console.log('Bad section length:', badSection.length);
console.log('Bad section starts:', badSection.substring(0, 100));

// Replace with properly escaped Kotlin string
const fixedSection = 
`  CHAINED NODES (\"chainedNodes\" field) — For sequential actions where the second action processes the first action's output ` +
`(e.g. decode Base64 then download the result), add a \"chainedNodes\" array inside a single task spec. ` +
`Each entry has \"nodeType\" and \"nodeParams\". Use \"%prev%\" to reference the preceding node's UUID.\\n\" +\n` +
`            \"  CRITICAL — Do NOT use an array for setting a form record status. The status transition (\"endpointState\") is automatically\\n\" +\n`;

c = c.substring(0, chainSectionStart) + fixedSection + c.substring(nextAppend);
fs.writeFileSync(fp, c, 'utf-8');
console.log('Fixed');
