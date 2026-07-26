# Prompt Manager v3 — Compact Prompts Table, View Toggle, Auto-Width Tree

## Requirements

1. **Compact prompts in separate DB table** — the "short" prompts (`codbi-core-elements-compact.md` and `codbi-core-api-compact.md`) in a new `codbi_compact_prompt` table, categorized like detail prompts
2. **View toggle** — "Condensed" / "Detailed" button in the Prompt Manager popup to switch between managing compact or detail prompts
3. **Tree auto-width** — tree panel should width to the widest element content, not fixed at 280px
4. **Same editability** — compact prompts editable, restorable, import/export just like detail prompts

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Prompt Manager Popup                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Condensed] [Detailed]  ← view toggle               │  │
│  ├──────────────┬───────────────────────────────────────┤  │
│  │  Tree (auto) │  Card (same as before)                │  │
│  │  ─────────   │  [color indicator]                    │  │
│  │  CodBi       │  [display name] [key badge]           │  │
│  │   Elements   │  [pre-prompt]                         │  │
│  │    Items...  │  [prompt_text]                        │  │
│  │   Functs     │  [post-prompt]                        │  │
│  │    Items...  │  [Save] [Restore] [Export] [Import]   │  │
│  │  Formcycle   │                                       │  │
│  │   Widgets    │                                       │  │
│  │   Nodes      │                                       │  │
│  └──────────────┴───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

**New table: `codbi_compact_prompt`** — same schema as `codbi_ai_prompt`:

| Column | Type | Notes |
|--------|------|-------|
| `prompt_key` | VARCHAR(100) PK | e.g., `codbi.functionalities.ai_ocr` |
| `category` | VARCHAR(50) | e.g., `codbi`, `formcycle` |
| `prompt_text` | CLOB | The short compact description |
| `original_text` | CLOB | Backup for restore |
| `pre_prompt` | CLOB | User custom text |
| `post_prompt` | CLOB | User custom text |
| `is_active` | BOOLEAN | Default TRUE |
| `display_name` | VARCHAR(200) | Human-readable name |
| `prompt_version` | VARCHAR(50) | Seed version tracker |
| `updated_at` | TIMESTAMP | Auto-updated |

### Seed Sources

The two `.md` files get split by `##` sections (same `seedSplitFile()` logic):

| File | Section `##` header | Sub-items |
|------|---------------------|-----------|
| `codbi-core-elements-compact.md` | `## Functionalities` | 20+ functionality one-liners |
| | `## Element Placeholders (EPs)` | 30+ EP one-liners |
| | `## Standard Classes` | ~18 standard one-liners |
| `codbi-core-api-compact.md` | `## FORMCYCLE Form Elements` | Widget descriptions + params |
| | `## Functionalities` | Functionality descriptions + params |
| | `## Element Placeholders (EPs)` | EP descriptions (no params section) |
| | `## Standard Classes` | Standard descriptions + params |
| | `## FORMCYCLE Workflow Nodes` | Workflow node descriptions + params |

The parent keys would be:
- `codbi-core-elements-compact.md` → base key: `compact.elements`
- `codbi-core-api-compact.md` → base key: `compact.api`

So sub-items would be like:
- `compact.elements.functionalities` (the whole `## Functionalities` section as one item)
- Actually, looking at the file structure more carefully, the `##` sections contain *lists* of items (`- AI.OCR: ...`), not individual `##` sub-sections per item. So we can't split further than the `##` headers.

So the tree would be:
```
📁 Compact
  📁 Elements
    📄 Functionalities     (from ## Functionalities in codbi-core-elements-compact.md)
    📄 Element Placeholders (from ## Element Placeholders (EPs))
    📄 Standard Classes     (from ## Standard Classes)
  📁 API
    📄 Formcycle Elements   (from ## FORMCYCLE Form Elements in codbi-core-api-compact.md)
    📄 Functionalities      (from ## Functionalities)
    📄 Element Placeholders (from ## Element Placeholders (EPs))
    📄 Standard Classes     (from ## Standard Classes)
    📄 Workflow Nodes       (from ## FORMCYCLE Workflow Nodes)
```

---

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/main/resources/db/changelog/codbi-compact-prompt-changelog.xml` | Liquibase for `codbi_compact_prompt` table |
| 2 | `src/main/kotlin/.../logic/cb/CompactPromptLoader.kt` | Service for compact prompts (seeding, CRUD) |

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/main/kotlin/.../logic/CodbiEntities.kt` | Register new Liquibase changelog |
| 2 | `src/main/kotlin/.../logic/cb/AIPromptManagerServletAction.kt` | Add `X-View: condensed|detailed` header support to `ListAll/SaveOne/RestoreOriginal/ToggleActive/Export/Import` — routes to compact or detail table |
| 3 | `src/main/web/.../prompt-manager.ts` | Add `viewMode` state, conditional table selection, auto-width tree |
| 4 | `src/main/web/.../prompt-manager.html` | Add view toggle buttons, remove fixed tree width |
| 5 | `src/main/web/.../prompt-manager.scss` | Update tree panel to auto-width, add toggle styles |

---

## Step-by-Step

### Step 1: Liquibase `codbi-compact-prompt-changelog.xml`
- Same schema as `codbi_ai_prompt` but table name `codbi_compact_prompt`
- Register in `CodbiEntities.getLiquibaseScripts()`

### Step 2: CompactPromptLoader.kt
- Same structure as PromptLoader but:
  - Seeds from `codbi-core-elements-compact.md` and `codbi-core-api-compact.md`
  - Uses `seedSplitFile()` to extract `##` sections
  - Methods: `seedIfNeeded()`, `listAllPrompts()`, `savePrompt()`, `restoreOriginal()`, `toggleActive()`, `importPrompt()`

### Step 3: Update AIPromptManagerServletAction.kt
- Read `X-View` header (default: `"detailed"`)
- If `X-View: condensed` → use `CompactPromptLoader` instead of `PromptLoader`
- All actions: `ListAll`, `SaveOne`, `RestoreOriginal`, `ToggleActive`, `Export`, `Import`

### Step 4: Frontend changes
- Add `viewMode: "condensed" | "detailed"` state
- Add toggle buttons in the tree toolbar
- Send `X-View` header with all API requests
- Remove fixed tree width; use `width: auto; min-width: 200px; white-space: nowrap`
