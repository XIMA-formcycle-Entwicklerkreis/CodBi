# Prompt Manager v2 — Granular Items, Restructured Tree, UX Fixes

## Problem Summary

1. **Tree too shallow** — only shows category-level prompts (e.g., `codbi.functionalities`). Needs to show individual items: each functionality, EP, standard config, widget, and workflow node as a separate card.
2. **Category cards editable** — top-level categories like "formcycle" and "codbi" have editable inputs but shouldn't be modifiable (they're containers).
3. **Dialog too tall** — the PrimeNG dialog is taller than its content.

---

## Solution

### 1. Seed individual items from `.md` sections

The existing `.md` files already have `##` section headers for each item (e.g., `## AI.OCR`, `## FC_EMAIL`). During seed, split each `.md` file by `##` headers:

- **Content before any `##`** → becomes the **category parent prompt** (e.g., `codbi.functionalities`) — general rules shared by all items in that category
- **Each `## Section` block** → becomes an **individual item prompt** (e.g., `codbi.functionalities.ai_ocr`)

The same approach applies to:
| Current .md file | Parent key | Item key pattern | Example items |
|---|---|---|---|
| `codbi-functionalities.md` | `codbi.functionalities` | `codbi.functionalities.ai_ocr` | 40+ functionalities |
| `codbi-element-placeholders.md` | `codbi.element_placeholders` | `codbi.element_placeholders.ep_chaining` | 31+ EPs |
| `codbi-standard-configurations.md` | `codbi.standard_configurations` | `codbi.standard_configurations.ai` | 18+ standards |
| `formcycle-widgets.md` | `formcycle.widgets` | `formcycle.widgets.xtextfield` | All widget types |
| `formcycle-workflow-nodes.md` | `formcycle.workflow_nodes` | `formcycle.workflow_nodes.fc_email` | All node types |
| `formcycle-general.md` | `formcycle.general` | — | No sub-items |
| `codbi-general.md` | `codbi.general` | — | No sub-items |
| `codbi-classify-intent.md` | `codbi.classify_intent` | — | No sub-items |

### 2. New `seedIfNeeded` logic in PromptLoader

**File:** [`PromptLoader.kt`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptLoader.kt)

Add a `seedItemsFromFile(em, file, baseKey, version)` method that:
1. Loads the `.md` file
2. Splits on `\n## ` (newline + `## `)
3. First chunk (before first `##`) → upsert as `baseKey` (parent)
4. Each subsequent chunk → extract section name from the `##` header line, generate item key as `baseKey.section_name`, upsert as individual item
5. Sets `original_text` for each
6. Sets `is_active = TRUE` for each

### 3. Restructured tree view

The tree in [`prompt-manager.ts`](src/main/web/.../prompt-manager/prompt-manager.ts) becomes 3 levels:

```
Level 1: category (e.g., "CodBi", "Formcycle")  → just a label, not selectable
Level 2: subcategory (e.g., "functionalities", "widgets") → shows display-only info
Level 3: item (e.g., "AI.OCR", "XTextField") → shows editable card
```

Items without sub-items (like `formcycle.general`, `codbi.classify_intent`) stay at level 2 as editable leaf nodes.

The `buildTree()` method needs to:
- Group prompts by category prefix
- For items whose key has 3 parts (e.g., `codbi.functionalities.ai_ocr`), nest under subcategory
- For items with 2-part keys (e.g., `formcycle.general`), show as direct leaf under category

### 4. Category cards not editable

When a subcategory node is selected (e.g., `codbi.functionalities`):
- Show the card content but **disable editing** (read-only display)
- Only leaf item nodes show editable pre/post/prompt fields

Add a computed property `isEditable` in the component:
```typescript
get isEditable(): boolean {
  // Count dots in the key — 3+ parts = item, 2 parts = category/subcategory
  return (this.selectedKey?.split('.').length ?? 0) >= 3 ||
         ['formcycle.general', 'codbi.general', 'codbi.classify_intent'].includes(this.selectedKey ?? '');
}
```

### 5. Fix dialog height

In [`prompt-manager.html`](src/main/web/.../prompt-manager/prompt-manager.html):
- Remove the fixed `height: '80vh'` from the dialog style
- Instead, let the dialog auto-size to content with `[style]="{ width: '85vw', maxWidth: '1200px' }"` (no height constraint)
- The tree panel and card panel already have `overflow-y: auto` so content scrolling works naturally

### 6. Items excluded from AI when inactive

Already handled — [`loadPrompt()`](src/main/kotlin/.../cb/PromptLoader.kt) and [`queryCategory()`](src/main/kotlin/.../cb/PromptLoader.kt) filter by `is_active = TRUE`. When a user deactivates an individual item like `codbi.functionalities.ai_ocr`, the AI simply won't receive that item's instructions.

---

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | [`PromptLoader.kt`](src/main/kotlin/.../logic/cb/PromptLoader.kt) | Add `seedItemsFromFile()`, modify `seedIfNeeded()` to call it for each `.md` with `##` sections |
| 2 | [`prompt-manager.ts`](src/main/web/.../prompt-manager.ts) | Restructure tree to 3 levels, add `isEditable`, fix dialog height |
| 3 | [`prompt-manager.html`](src/main/web/.../prompt-manager.html) | Remove height constraint, disable inputs for non-editable cards |
| 4 | [`prompt-manager.scss`](src/main/web/.../prompt-manager.scss) | Add styles for read-only mode |

## Files Unchanged

- Backend servlet, all `##` section .md files, `index.json`, AI assistant prompt builders, `CodbiEntities` — these remain as-is.
