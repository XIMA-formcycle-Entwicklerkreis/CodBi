# Form Assistant — Output-Token Optimization

## Problem

A trivial request ("add a field to the bottom of the page") generated ~20,000 output
tokens. The trigger run showed a clear degeneration in the second pass:

```
AI omitted _codbiApplicability entirely — triggering blind CodBi evaluation pass
Blind rethink pass — sending 15 item(s) with compact CodBi reference (system-only)
Pass-2 returned non-JSON prose (42390 chars) — forcing final complete-form pass
Pass-2 response looks like a repetition loop (non-JSON, 42390 chars > 20000) — degeneration signature
Final forced pass raw result: {"items":[<one tfBetrag item>],"_unchangedItems":[...]}
```

## The pass pipeline (per form-editing run)

`AICodBiAssistant` (see [`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt)) runs several AI calls:

1. `codbi.classify_intent` — intent classification.
2. `tryClarification` — clarification check (large system prompt, tiny output).
3. **Pass-1** — `buildCodbiFormSystemPrompt` + the user's form; the model returns the form JSON.
4. **Pass-2** (only if pass-1 asked for CodBi details, or to reconsider CodBi) —
   `rerunWithCodbiDetails(...)`, with two branches:
   - targeted rerun (`requested`/`widgets` non-empty), or
   - **blind reconsideration** (`requested`/`widgets` empty) — the branch hit in the log.
5. **Final forced pass** — runs when pass-2 returns prose/no form.
6. Mail / ending-page multilingualization passes.

## Root causes of the wasted output tokens

### 1. The blind reconsideration pass degenerated (FIXED)

`rerunWithCodbiDetails` is entered whenever pass-1 omits `_codbiApplicability`
(common with the fast `ext-specialist:cerebras` model). Its blind branch:

- sent **every full item body** (`gson.toJson(mapOf("items" to allItems))`), and
- asked only "Modify the form below" **without the token-saving diff protocol**.

The model therefore tried to re-emit the whole form and looped, producing **42,390
chars of non-JSON** (~10k output tokens) that were then thrown away by a forced final
pass. This was the single largest output-token sink.

**Fix applied** (commit in this changeset): the blind branch now mirrors the proven
final-pass protocol —
[`sliceFormForPass2(formBase, allItems, JsonArray())`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2339)
for the payload and the explicit **"return ONLY the diff"** (`_unchangedItems`) /
"emit compact JSON" / "no prose" instruction for the output. `splicePass2IntoPass1`
already consumes that diff, so no downstream change was needed.

### 2. A `codbiVerdict:"none"` emitted outside the JSON re-triggered the blind pass (FIXED)

The blind pass fires whenever the extracted form JSON has no `_codbiApplicability`.
When the model **appended** the applicability report as a separate block (instead of
embedding it as a top-level key), the extraction dropped it and
`jsonDeclaresNothingApplies(cleaned)` saw nothing.

**Fix applied**:
[`rawDeclaresCodbiVerdictNone(rawResponse)`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3175)
now also recognises a structured `"codbiVerdict": "none"` anywhere in the think-stripped
raw response. It is only consulted in the branch where the AI already reported **no
applied and no considered** CodBi items, so treating a raw `none` as authoritative is
safe — and it skips the whole second pass.

**IMPORTANT — the skip is gated on the form actually existing.** A follow-up report
showed `AI returned invalid JSON`: pass-1 returned **non-JSON prose** (24,476 chars) that
happened to contain `"codbiVerdict": "none"`, the skip fired, and the blind pass — which is
also the **recovery pass that rebuilds the form** when pass-1 fails — never ran. The skip
(and the pre-existing `rawClaimsNothingApplies` check) is therefore now AND-ed with
`hasTopLevelItems(cleaned)`: the shortcut applies only when pass-1 produced a real form
(top-level `items`); otherwise the recovery pass still runs. See
[`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2852).

## Pass-1 diff protocol (IMPLEMENTED)

**Pass-1 re-emitted the COMPLETE form on every edit** — the dominant remaining sink after
fix 1+2 (~9k output tokens for a one-field edit). This is now fixed: The pass-1 prompts
(`codbi-form-task-instruction.decision.md`, `codbi-form-task-instruction.md`,
`formcycle-general*.md`) instruct *"return the COMPLETE modified form JSON"*, so pass-1's
output ≈ the size of the whole form (~15k+ tokens on a 63 KB form) for a one-field edit.
Pass-2 and the final pass already avoid this with the `_unchangedItems` diff protocol;
pass-1 does not.

### What was implemented

1. **Pass-1 user content** now carries `REMINDER 3 (TOKEN SAVING)`: return only the diff (`items`
   = added/modified/re-shaped only + a top-level `_unchangedItems` list), emitting compact JSON.
   It explicitly states that the prompts' "return the COMPLETE form" wording means the *resulting*
   form stays complete — not that every item must be re-emitted.
2. **Prompt alignment** in the decision cores that reach pass-1 so they no longer contradict the
   diff: [`codbi-form-task-instruction.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-task-instruction.decision.md),
   [`codbi-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md),
   [`codbi-general-rethink.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general-rethink.md).
3. **Idempotent materialization** in `runFormEditing`, right after the clarification check: when
   `cleaned` is a form carrying `_unchangedItems`, it is merged onto the original form via
   `splicePass2IntoPass1(persistJson, cleaned)`, and the diff's own top-level fields/markers
   (`title`, `variables`, `_codbiApplicability`, `_workflowMailLanguages`, `_removedItems`, ...) are
   copied back. When the model ignores the hint and emits the whole form, nothing runs.

### Hazards considered (and why this is safe)

- **Whole-form translation** legitimately re-emits the complete form (with per-language
  `i18n`) and is detected from pass-1's output (`_workflowMailLanguages`). A blind switch
  to a diff would break translation.
- The `_codbiApplicability` / `_workflowMailLanguages` / `variables` **top-level markers**
  must survive materialization.

### Proposed safe design

1. Add a conditional TOKEN-SAVING rule to the pass-1 user content: return only the diff
   (`items` = added/modified/re-shaped only + top-level `_unchangedItems`), **except** a
   whole-form translation, which still returns the complete form. Soften the
   "COMPLETE form" wording in the pass-1 prompt files accordingly (keep the translation
   exception intact).
2. Materialize the pass-1 diff right after the clarification check in `runFormEditing`:
   `cleaned = splicePass2IntoPass1(persistJson, cleaned)` **only when** `cleaned` carries
   `_unchangedItems` **and** does not carry `_workflowMailLanguages`. Re-apply the diff's
   own top-level fields (minus `items`/`_unchangedItems`) onto the spliced result so the
   model's `title`/`variables`/markers win.
3. This is **idempotent**: if the model ignores the hint and re-emits the full form, the
   splice is an equivalent merge (every item matched by id/name is replaced). It is also
   strictly safer than today, where an item the model omits without listing is silently
   **dropped** from the form.

### Expected effect

| Scenario | Before | After (fixes in this changeset) |
|---|---|---|
| Trivial "add a field", verdict omitted | pass-1 full form + 42k-char degenerate pass + final pass | pass-1 full form + small diff |
| Trivial "add a field", verdict-only-in-prose | + blind pass | pass-1 full form only |
| After the pass-1 diff follow-up | pass-1 diff only | ~1–2k tokens |

## Pass-1 must NOT create new widgets (IMPLEMENTED)

After the pass-1 diff fix the run was ~2.5k tokens, but the log showed the new field being built **twice**:

```
Pass-1 created new formcycle widget(s) without details request — including templates in pass-2: XTextField
AI declared nothing applies but created Formcycle widget(s) XTextField - rebuilding via pass-2 with templates
```

Pass-1 built the `XTextField`, then the server's safeguard forced a second pass to rebuild it against the
real widget template. Fix (keeps correctness): pass-1 is now told to **request** a new widget's
template instead of building it, so the widget is built exactly once in pass-2:

- `REMINDER 4 (NO DIRECT WIDGET CREATION ...)` in the pass-1 user content
  ([`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2191)).
- The same rule in [`codbi-form-task-instruction.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-task-instruction.decision.md).

When pass-1 has no `items` (a pure details request), `formBase` falls back to the original form and
pass-2 builds the widget once with its template — the previous `createdWidgets` safeguard is now only a
fallback for the (non-compliant) case where the model still creates a widget directly. Modifying an
existing element the model can already see needs no details request and stays a single-pass diff.

## Clarification prompt: sectioning + build-syntax collapse (IMPLEMENTED)

The clarification round sends a ~46k-char system prompt on every request (logged as
`clarification prompt assembly: ... templateLen=45948, finalLen=50421`) whose output is only
`NO_CLARIFICATION`. Two changes cut it without changing the clarification behaviour:

1. **Collapsed the build-only EP/HTML wiring.** The giant "HARD RULE — never ask for data an EP
   provides" paragraph carried the full wiring syntax (`data-cb-func`, `HTML.Text.Injector`,
   `HTML.Text.Mapper`, `JSON.SET`, `[[INJECTOR_REPLACEMENT]]`) — which the prompt itself says belongs
   to the build pass. It is now a short rule (don't ask for EP-supplied inputs; use sensible example
   params) that points at the build instructions.

2. **Sectioned the scenario-specific blocks.** In
   [`codbi-clarification.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md)
   the payment/ePayBL, live-data/weather, HTTP-POST and approval/link-to-form rules are now wrapped in
   `<!--CLARIFY:tag--> … <!--/CLARIFY:tag-->` markers. [`applyClarificationSections()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20062)
   decides each block from TWO signals: (1) **PRIMARY — the AI's own decision.** The already-running
   chat-classification call (`produceChatAnswer`) also returns a `"topics": [...]` array
   (`payment`/`livedata`/`http`/`approval`) judged by MEANING, language-agnostically — so no extra
   inference is made. The `topics` key is part of the canonical chat-answer envelope defined in the
   `.md` prompts [`codbi-chat-system-prompt.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md)
   and [`codbi-retry-chat.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-retry-chat.md)
   (NOT prompt text appended from Kotlin). (2) **FALLBACK / extra recall — keyword lists** (de/en/it/nl/fr) over the corpus
   (the request PLUS the earlier clarification answers), so a block is never dropped just because the
   phrasing missed a keyword. Unknown tags are fail-open (kept); kept blocks have their markers
   stripped and untriggered blocks are removed. The assembly log prints `gatedLen`.
   Reliability: the AI decision is language- and phrasing-independent, and the keyword layer only ADDS
   recall — so the dangerous direction (a relevant block wrongly dropped) is covered twice.

**Measured effect** (common case — a plain field edit, no tag triggered): the template drops from
**44,013 → 33,320 chars** (5 blocks, **−10,693 chars ≈ −2.7k input tokens**). When a block IS relevant
(e.g. a payment form) it is kept in full, so no rule is lost for the scenarios that need it.

## Output-token regression after the `topics` change (FIXED)

The first `topics` implementation appended a mandatory-extra-field paragraph to the chat-classification
system prompt **from Kotlin**. That (a) contradicted the canonical envelope in
`codbi-chat-system-prompt.md` ("Respond ONLY with valid JSON: {hasQuestion, hasInstructions, answer}")
and (b) violated the file-header rule "no prompt text in `.kt` files". The contradiction invites format
drift, which makes the chat call fall through to the **strict envelope retry** — i.e. the large-input
classification call runs **twice**, doubling its completion (output) tokens while the clarification
gating only lowered *input*.

**Fix applied** — `topics` is now a first-class member of the envelope in the `.md` prompts:

- [`codbi-chat-system-prompt.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md):
  the envelope is `{"hasQuestion", "hasInstructions", "answer", "topics": []}` with a one-bullet spec for
  `topics`; the "CRITICAL" line now requires all four keys.
- [`codbi-retry-chat.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-retry-chat.md):
  the strict envelope also carries `topics`.
- [`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20858):
  the appended Kotlin paragraph is **removed** (no prompt text in `.kt`), removing the contradiction and
  the extra input.

Effect: the chat call keeps its single-pass output; when the DB copy of the prompt is older and returns
no `topics`, the keyword layer still keeps every matching block (fail-open), so behaviour degrades
safely.

## Input-token optimization: two-tier chat classification (IMPLEMENTED)

After the output was down to ~2.2k tokens, the run's **input** was ~122k tokens. The two dominant
items (from the log):

| Call | Input | Notes |
|---|---|---|
| **Pass-1 system prompt** | **122,973 chars** | 4 decision cores (~67k) + widget catalog (21.7k) + CodBi elements catalog (20.1k) + canonical (2.8k) + local API-doc (~11k) |
| **Chat classification** | **~70k chars** | chat prompt (4.6k) + the **full persist form JSON (63,791 chars)** + workflow + condensed structure |
| Clarification check | ~48.5k chars | gated (37,793) + injected context |

The bug: `produceChatAnswer` injected the **complete** form JSON (`persist`, ~60k chars) into the
system prompt of the ALWAYS-RUN classification call — even for a plain instruction ("add a field"),
where it is only needed to *answer* questions.

**Fix applied** ([`produceChatAnswer`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20830)) —
the call is now two-tier:

1. **Tier 1 — CLASSIFY (cheap):** `renderChatContext(...)` is called with `completeFormJson` /
   `completeWorkflowJson` = `null`; only the condensed **FORM STRUCTURE** (+ chat history /
   clarification) is sent. It decides `hasQuestion` / `hasInstructions` / `topics`.
2. **Tier 2 — ANSWER (full):** runs **only when `hasQuestion == true`**, with the complete form /
   workflow, so the answer can cite exact classes / attributes / datatype / options.

`runTier(withFullContext)` keeps the `need_matomo_stats` two-round handling inside the tier, and the
last-resort heuristic is unchanged. Log lines `Chat two-tier: ...` show the tier-1 vs tier-2 system
sizes and whether the full-answer tier was skipped.

**Effect:** every instruction / ack run saves the ~60k-char complete form (the majority of the chat
call); only genuine questions pay for the extra full-answer call (which was already paid before).

## Input-token optimization: slim the pass-1 system prompt (IMPLEMENTED)

Pass-1 was the largest single input (logged as `Pass-1 system prompt: 122973 chars`). Two complementary
changes cut it to **~83.7 KB chars (≈ −32%)** without removing any decision-critical rule.

### 1. De-duplicated the decision cores (−11.5 KB chars)

The four pass-1 cores are concatenated into the same prompt, and the same rule appeared 2–3 times:

| Rule | Was in | Now kept only in |
|---|---|---|
| MANDATORY PEOPLE CLASSES | general, structure, task-instruction | `codbi-general.decision.md` |
| REUSE EXISTING ELEMENT | structure, task-instruction | `codbi-form-structure-rules.decision.md` |
| CODBI DETAILS REQUEST protocol + MANDATORY IDs (AI.LLAMA.CHAT, JSON.SET, Date.Time.Join, TinyMCE, HTML.CSS, Fotocropper) | general, task-instruction | `codbi-general.decision.md` |
| NAVBAR / LANGUAGE SWITCH single placement | general, task-instruction | `codbi-general.decision.md` |
| DEFAULT PLACEMENT = FIRST PAGE | structure, task-instruction | `codbi-form-structure-rules.decision.md` |
| EXACT className CASING | general, task-instruction | `codbi-general.decision.md` |
| RICH / DESIGNED / INTERACTIVE TEXT | structure, task-instruction | `codbi-form-structure-rules.decision.md` |
| PANEL FOLDING + CONVERT-IN-PLACE | general, structure | `codbi-general.decision.md` |
| PRESERVE EXISTING ELEMENTS | general, structure | `codbi-general.decision.md` |
| MOVING ELEMENTS | general, structure | `codbi-general.decision.md` |
| PARTIAL HTML EDITS | general, structure | `codbi-general.decision.md` |
| RELATIVE POSITION | general, structure | `codbi-form-structure-rules.decision.md` (more complete) |

Files: [`codbi-form-task-instruction.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-task-instruction.decision.md)
(18,971 → 11,853), [`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md)
(16,030 → 12,059), [`codbi-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md)
(18,743 → 18,340). Every removed block still exists verbatim in another core that is in the SAME
pass-1 prompt, so no rule is lost.

### 2. Condensed catalogs for pass-1 (−26.5 KB chars)

Pass-1 only DECIDES and requests details (the "NO DIRECT WIDGET CREATION" rule) — the exact JSON specs
arrive in pass-2. So pass-1 does not need the per-entry build-syntax prose of the two catalogs; it
needs the element NAMES (headings) + a one-line "what it is". New pass-1-only builders in
[`CodbiCapabilities`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiCapabilities.kt:238):

- [`buildWidgetsSectionCondensed()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiCapabilities.kt:250):
  `21,546 → 4,838 chars`
- [`buildSectionCondensed()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiCapabilities.kt:247):
  `20,059 → 9,610 chars`

`condenseEntryBodies()` keeps every `#`/`##`/`###` heading AND the section **preamble** verbatim, and
truncates only the BODY of each catalog entry (the prose after an entry heading — `## <WidgetName>` in
the widget catalog, `### <name>` in the elements catalog) to its first sentence (≤220 chars,
word-boundary safe). The FULL catalogs remain in use everywhere
else (pass-2 `buildFullSectionFor`, the rethink variant, the other assistant path), so build correctness
is unaffected — pass-1 can still name every widget/functionality, and the detailed rules reach the model
in pass-2 exactly as before. `buildCodbiFormSystemPrompt` uses the condensed sections instead of the
`{{FORMCYCLE_WIDGETS_SECTION}}` / `{{CODBI_ELEMENTS_SECTION}}` placeholders.

**Effect:** pass-1 ≈ **122,973 → ~84,435 chars (−31%)**; together with the two-tier chat change this
moves the run's input materially lower.

**Regression fixed (LABEL).** A first version truncated the catalog PREAMBLE too. The widget catalog's
preamble carries the rule *"Every interactive element MUST carry a meaningful 'label' … NEVER use
generic placeholders such as 'Label', 'Example', 'Text' or 'Field'"*; truncating it silently dropped
that rule, so newly created fields had **no `label`** and Formcycle showed the default **"Label"**.
`condenseEntryBodies()` now keeps the preamble verbatim — only the per-entry build-syntax prose is
condensed. (The pass-1 composition log's `designed-text rules` / `detail-request protocol` flags were
also updated to match the strings that now live in the de-duplicated cores.)

## Verification

- `./mvnw.cmd -DskipTests -o compile` passes.
- Add/adjust tests around `rerunWithCodbiDetails`' blind branch if a harness is available
  (payload slicing + `_unchangedItems` handling), and a unit test for
  `rawDeclaresCodbiVerdictNone` (`codbiVerdict`/`_codbiVerdict`, with/without think tags).
