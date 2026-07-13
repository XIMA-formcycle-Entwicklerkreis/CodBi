import fs from 'fs';

const fp = 'src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt';
let c = fs.readFileSync(fp, 'utf-8');

// Find and fix ALL instances of unescaped double quotes in Kotlin strings
// The issue is that in the system prompt section, we have:
//   "CHAINED NODES ("chainedNodes" field) ..."
// which Kotlin interprets as: string "CHAINED NODES (" then expression chainedNodes then " field) ..."
// We need: "CHAINED NODES (\"chainedNodes\" field) ..."

const idx = c.indexOf('CHAINED NODES');
if (idx < 0) { console.log('Not found'); process.exit(1); }

// Find the section to replace
const sectionStart = idx;
// Find the end - look for the "TRIGGER TYPES" line after
const triggerPos = c.indexOf('TRIGGER TYPES', sectionStart);
// Go back to find the start of the append( line
const lineBeforeTrigger = c.lastIndexOf('\n', triggerPos - 5) + 1;
const triggerLine = c.substring(lineBeforeTrigger, triggerPos + 30);
console.log('Before trigger:', triggerLine.substring(0, 60));

// The section from CHAINED NODES to just before append("TRIGGER TYPES
const section = c.substring(sectionStart, lineBeforeTrigger);
console.log('Section to replace:', section.substring(0, 80));

// Build the fixed version using regular string concatenation (not template literals)
// The Kotlin string needs escaped quotes: \"chainedNodes\" and \"endpointState\"
const fixed = 
  '"  CHAINED NODES (\\"chainedNodes\\" field) — For sequential actions where the second action ' +
  'processes the first action\'s output (e.g. decode Base64 then download the result), ' +
  'add a \\"chainedNodes\\" array inside a single task spec. ' +
  'Each entry has \\"nodeType\\" and \\"nodeParams\\". Use \\"%prev%\\" to reference the preceding node\'s UUID.\\n" +\n' +
  '            "  CRITICAL — Do NOT use an array for setting a form record status. ' +
  'The status transition (\\"endpointState\\") is automatically\\n" +\n';

c = c.substring(0, sectionStart) + fixed + c.substring(lineBeforeTrigger);
fs.writeFileSync(fp, c, 'utf-8');
console.log('Fixed');
