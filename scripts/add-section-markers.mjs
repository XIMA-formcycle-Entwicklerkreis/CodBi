// One-shot helper: wrap existing rule LINE RANGES of the pass-1 decision cores in
// `<!--SECTION:tag--> … <!--/SECTION:tag-->` markers, so PromptSectionGate can drop them for a
// request that does not need them. The rule text itself is never modified — only marker lines are
// inserted around it.
//
// Idempotent: a range that is already wrapped by the same tag is skipped.
// Ops for the same file are applied in DESCENDING order so the line numbers stay valid.
import { readFileSync, writeFileSync } from 'node:fs'

const DIR = 'src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/'

const ops = [
  // --- codbi-form-structure-rules.decision.md -----------------------------------------------
  // ROW GROUPING RULES (heading + bullets + the golden rule)
  { file: 'codbi-form-structure-rules.decision.md', from: 24, to: 30, tag: 'field_creation' },
  // GROUP RELATED FIELDS INTO CONTAINERS (incl. the ADDRESS bullet)
  { file: 'codbi-form-structure-rules.decision.md', from: 32, to: 36, tag: 'field_creation' },
  // COMPLETE FORM RULES
  { file: 'codbi-form-structure-rules.decision.md', from: 38, to: 38, tag: 'field_creation' },
  // BUTTON ACTIONS (XButtonList)
  { file: 'codbi-form-structure-rules.decision.md', from: 72, to: 72, tag: 'field_creation' },
  // REMOVALS
  { file: 'codbi-form-structure-rules.decision.md', from: 60, to: 60, tag: 'removal' },
  // PARTIAL HTML EDITS — already covered by the designed_text / svg / custom_js signals
  {
    file: 'codbi-form-structure-rules.decision.md',
    from: 68,
    to: 68,
    tag: 'designed_text,svg,custom_js',
  },
  // --- codbi-general.decision.md ------------------------------------------------------------
  // Bürger-Services / BundID: tfAntragsteller* fields
  { file: 'codbi-general.decision.md', from: 61, to: 61, tag: 'bundid' },
  // REMOVING A FUNCTIONALITY FROM AN EXISTING ELEMENT
  { file: 'codbi-general.decision.md', from: 91, to: 91, tag: 'removal' },
]

const byFile = new Map()
for (const op of ops) {
  if (!byFile.has(op.file)) byFile.set(op.file, [])
  byFile.get(op.file).push(op)
}

for (const [file, fileOps] of byFile) {
  const path = DIR + file
  const raw = readFileSync(path, 'utf8')
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  const lines = raw.split(eol)

  for (const op of [...fileOps].sort((a, b) => b.from - a.from)) {
    const openMarker = `<!--SECTION:${op.tag}-->`
    const closeMarker = `<!--/SECTION:${op.tag}-->`
    const alreadyOpen = lines[op.from - 2]?.trim() === openMarker
    const alreadyClosed = lines[op.to]?.trim() === closeMarker
    if (alreadyOpen && alreadyClosed) {
      console.log(`skip   ${file} ${op.from}-${op.to} ${op.tag} (already marked)`)
      continue
    }
    lines.splice(op.to, 0, closeMarker)
    lines.splice(op.from - 1, 0, openMarker)
    console.log(`marked ${file} ${op.from}-${op.to} ${op.tag}`)
  }

  writeFileSync(path, lines.join(eol))
}
