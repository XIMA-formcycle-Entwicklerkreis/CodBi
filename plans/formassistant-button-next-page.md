# FORMCYCLE button "next page" navigation — findings & reminder

Status: **implemented — plugin-aware.** When the XNavigationBar plugin is installed the button gets
that plugin's logical custom action (rename-proof); otherwise it falls back to the neighbouring page
NAME. Real-designer verification of the plugin path is still advisable.
Created: 2026-10-04

## Problem

A generated `XButtonList` "Weiter" button did not advance to the next page; a page with only the
footer appeared. Manually selecting the action in the FORMCYCLE designer and saving fixed it.

## Findings (verified against the FORMCYCLE 8.5.3 jars)

- The server renders a navigation button with **`data-target-page = action.page` verbatim**
  (`XButtonList.renderAction` — `ldc "data-target-page"; XButtonActionDescriptor.getPage()`).
- The client binds nav buttons to `navButtonClick`, which calls
  `gotoPage(data-target-page, data-check-page)`, and `gotoPage(name)` shows
  `.XPage[data-name="<name>"]` — a lookup by **real page name** (fc-form-renderer
  `META-INF/resources/form/includes/040-clientscript-min.js`).
- `ESubmitButtonAction` (`fc-form-common-8.5.3`) has **no** `next`/`previous` page value. Its only
  `page` strings are: `""`, `submit`, `submitNoCheck`, `submitPreview`, `submitPreviewWindowed`,
  `submitSave`, `submitSaveNoCheck`.
- The designer's "Aktion" dropdown (`ButtonsEditor` in `form-designer.min.js`) likewise offers **no
  next/previous entry** — it builds option pairs **per page, by page name**
  (`data-page=<pageName>`, `value=<pageName>(+" + check")`).

**Conclusion:** FORMCYCLE has no built-in "logical next page" target; navigation is always by page
NAME, so a keyword like `"next"` matches nothing and hides every page (footer only).

## Current solution (shipped) — the REVERT POINT

Keep this if the logical-next attempt below fails.

- `AICodBiAssistant.resolveNavigationPageTargets()` (wired into `normalizeFinalFormStructure()`)
  rewrites a button's `action.page` `"next"`/`"previous"` to the **actual adjacent page NAME**,
  using the ordered `XPage` items and the page the `XButtonList` lives on, and rewrites
  `optionId`/`value` to `<name>` / `<name> + check`.
- `AICodBiAssistant.normalizeButtonActionOptionIds()` keeps `optionId`/`value` consistent with
  `page`+`check` (mirrors the designer's `St(page, check)`).
- Prompts updated to say `action.page` = the target page's NAME (never `"next"`/`"previous"`):
  `formcycle-widgets.md`, `formcycle-general.md`, `codbi-form-structure-rules.decision.md`,
  `formcycle-widgets-compact.md`, `codbi-clarification.md`.
- Designer labels: `src/main/web/packages/designer/src/js/register-custom-translations.ts` registers
  `ButtonsEditor.next`/`previous` (cosmetic only).
- Tests: `ButtonNavigationTargetTest.kt`, `ButtonActionOptionIdTest.kt`.

**Known limitation:** because the target is stored as a page NAME, renaming that page later breaks
the button (the same is true for a manual designer selection).

## Why the designer shows "weiter + prüfen" in the Actions dropdown

The dropdown is core options (per page NAME + the submit commands) **plus plugin-registered custom
action buttons**. The **XNavigationBar ("Progress Bar") plugin** —
`xfc-server/config/plugins/system/41da57cd-8b3b-413e-ba28-f618f38506f5/de/xima/plugin/xnavbar/designer.js`
— registers four via `registerCustomActionButton`:

| label (de) | name = action | classNames |
|---|---|---|
| weiter | `xnavbar_next` | `xnavbar-button xnavbar-button--next` |
| weiter + prüfen | `xnavbar_next_check` | `xnavbar-button xnavbar-button--next xnavbar-button--check` |
| zurück | `xnavbar_prev` | `xnavbar-button xnavbar-button--prev` |
| zurück + prüfen | `xnavbar_prev_check` | `xnavbar-button xnavbar-button--prev xnavbar-button--check` |

(English labels come from the same plugin i18n: "next page", "next page + check", ….) Selecting one
stores `{page:<name>, check:false, customAction:<name>, customClassNames:<classes>,
displayName:<localized label>, optionId:St(<name>,false)=<name>, value:<name>}`. The server renders
`class="… <customClassNames>"` and `data-custom-action="<customAction>"` (`XButtonList.renderAction`,
verified: `getCustomClassNames()` → class, `getCustomAction()` → `data-custom-action`), and the
plugin's client JS performs the navigation **logically** (next/previous page by position) — so this
option IS rename-proof and is exactly what the assistant should emit for a "Weiter"/"Zurück" button.

### Implemented (plugin-aware)

`AICodBiAssistant.navigationPluginAvailable(params)` detects the plugin from
`InstalledFormcycleElements.snapshotFor(params).widgets` (a widget id containing "navigationbar" /
"xnavbar"). `resolveNavigationPageTargets(root, useNavigationPlugin)` then rewrites a logical
"next"/"previous" either to the plugin action above or to the neighbouring page NAME. The AI keeps
emitting the logical keyword (prompts say `action.page="next"`/`"previous"`; the server resolves it).

### Exact action object the guard emits (rename-proof)

```json
{"name":"btnNext","value":"Weiter","action":{"page":"xnavbar_next_check","check":false,
 "customAction":"xnavbar_next_check",
 "customClassNames":"xnavbar-button xnavbar-button--next xnavbar-button--check",
 "displayName":"weiter + prüfen","optionId":"xnavbar_next_check","value":"xnavbar_next_check"}}
```

Caveat: requires the XNavigationBar plugin to be installed (it is on the test server). If it may be
absent, keep a fallback (Option B below, or the shipped name-based target).

## TODO — rename-proof "logical next" (try this next)

**Option A (preferred, smallest change):** for navigation buttons emit the XNavigationBar custom
action above (patch the prompt guidance + `formcycle-widgets.md` templates; drop/limit
`resolveNavigationPageTargets` and the name-based prompt wording). Verify the button keeps working
after a page rename.

**Option B (plugin-independent):** the plugin already implements `IFormRenderPluginCallback`,
which also exposes `onBeforeRenderForm` / `onBeforeRenderItem`.

The plugin already owns a form-render callback: `FormRenderCallback` /
`CodbiFormRenderCallbackPlugin` (`IFormRenderPluginCallback`). That interface exposes, besides
`onAfterRenderForm`, also:

- `onBeforeRenderForm(IPluginFormRenderCallbackOnBeforeRenderFormParams)`
- `onBeforeRenderItem(IPluginFormRenderCallbackOnBeforeRenderItemParams)`

Idea: store the **logical** target (`action.page = "next"` / `"previous"`) and resolve it to the
current adjacent page NAME **at render time** (in `onBeforeRenderForm` / `onBeforeRenderItem`),
where the live form model (`params.xForm`, incl. page order and each button's page) is available.
That survives page renames, because the resolution happens on every render.

Steps to attempt:
1. Inspect `IPluginFormRenderCallbackOnBeforeRenderFormParams` / `...OnBeforeRenderItemParams` and
   the ret-val types in `fc-plugin-types-8.5.3.jar` (and `fc-handler-interface-8.5.3.jar`) to learn
   how to read/mutate the button's `properties.buttons[i].action.page` before rendering.
2. Implement the resolution in `FormRenderCallback` (mirror the logic in
   `resolveNavigationPageTargets`, but driven by the render model).
3. Revert the generation-time rewrite + prompt wording back to the logical `"next"`/`"previous"`
   (i.e. drop `resolveNavigationPageTargets` from `normalizeFinalFormStructure`, restore the prompt
   text and the templates/`optionId` guidance).
4. If it works: update tests and remove this reminder. If not: keep the current name-based solution
   and document the limitation here.
