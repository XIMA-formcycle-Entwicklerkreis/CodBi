const fs = require('fs');
const path = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '// 9c-2. FC_SWITCH handler: creates a multi-branch switch/case structure.';
const startIdx = content.indexOf(startMarker);

if (startIdx < 0) {
  console.error('Could not find start marker');
  process.exit(1);
}

// Find the matching closing brace by counting depth from `if (spec.nodeType == "FC_SWITCH") {`
const ifStart = content.indexOf('if (spec.nodeType == "FC_SWITCH")', startIdx);
const braceStart = content.indexOf('{', ifStart);
let depth = 0;
let endBrace = -1;
for (let i = braceStart; i < content.length; i++) {
  if (content[i] === '{') depth++;
  else if (content[i] === '}') {
    depth--;
    if (depth === 0) {
      endBrace = i + 1; // include the closing brace
      break;
    }
  }
}

console.log('Found markers at:', startIdx, ifStart, braceStart, 'endBrace:', endBrace);

if (endBrace < 0) {
  console.error('Could not find matching closing brace');
  process.exit(1);
}

const replacementPath = 'scripts/fc-switch-replacement.txt';
let newCode = fs.readFileSync(replacementPath, 'utf8');

content = content.substring(0, startIdx) + newCode + content.substring(endBrace);
fs.writeFileSync(path, content);
console.log('SUCCESS: FC_SWITCH handler replaced');
