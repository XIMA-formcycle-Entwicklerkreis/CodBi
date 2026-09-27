# Form Assistant — Input-Token Reduction Plan

> **STATUS 2026-09-27 — this file is the HISTORY of the work.** For what is *still* open, the
> measured baseline and the next step, see
> [`plans/formassistant-token-reduction-remaining.md`](formassistant-token-reduction-remaining.md)
> §3.2 (handover state). Several items listed as "still open" in §9 and §9.8 below are already closed.

Companion to [`plans/formassistant-output-token-optimization.md`](formassistant-output-token-optimization.md),
which already removed most of the wasted **output**. This plan targets the remaining **input**
tokens (the part that scales with every request and every retry).

---

## Status — IMPLEMENTED (first iteration)

Delivered:

- [`PromptSectionGate.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptSectionGate.kt) — marker extraction (`<!--SECTION:tag-->`), deterministic
  detectors, and the union/fail-open resolver (`resolveKeepTags`, `applySectionGates`).
- `ChatAnswer.sections` + envelope parsing in
  [`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20817), threaded into pass-1 assembly
  (`runFormModification` → `buildFormSystemPrompt` → `buildCodbiFormSystemPrompt`), which now gates
  the four decision cores before logging/returning.
- `sections` added to the classification envelope in
  [`codbi-chat-system-prompt.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md) and
  [`codbi-retry-chat.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-retry-chat.md) (no prompt text appended from Kotlin).
- **25 marked blocks** across the four pass-1 decision cores —
  [`codbi-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md) (16),
  [`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md) (4),
  [`formcycle-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-general.decision.md) (4),
  [`codbi-form-task-instruction.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-task-instruction.decision.md) (1).
- [`PromptSectionGateTest.kt`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptSectionGateTest.kt) — 12 tests; `mvnw.cmd -DskipTests compile` and the test run pass.

The seed version is a fresh timestamp per startup
([`CodbiEntities.kt:56`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/CodbiEntities.kt:56)), so the marked prompts re-seed automatically on the next
plugin restart — no version bump is required for the gating to take effect.

Deliberately NOT done in this iteration (documented follow-ups):

- **`AIFormAssistant` is not gated.** Its prompt is built from the FULL `codbi.*` files (e.g.
  `codbi-general.md` at 86.4 KB), which carry no markers yet, and it has no chat-classification
  signal — so gating there needs a separate, larger marking pass. It is a no-op there today.
- **`conditional` / `state_availability` blocks stay always-on.** They are core to a large share of
  requests and their detection is less reliable than the marked set; gating them is a higher-risk
  follow-up, not part of this iteration.

---

## TL;DR — answers to the three questions

1. **Do the prompts contain HTML / JS / SVG / CSS generation instructions?**
   **Yes.** They live in three places and (in part) already reach pass-1 unconditionally:
   - the detailed `XSpan` template (styled HTML + in-`rtevalue` `<style>`/`@keyframes` + inline
     `<svg>`) in [`formcycle-widgets.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-widgets.md:203)
     — already gated for **pass-2** by [`DesignedTextDetector.withXSpan()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/DesignedTextDetector.kt:81);
   - the **custom-JavaScript** rules ("JS belongs to the element, `<button type='button'>`, no
     external `fetch`") in
     [`codbi-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md:19)
     — this is a **pass-1 decision core and ships on EVERY request**;
   - the **RICH / DESIGNED / INTERACTIVE TEXT + inline-SVG illustration** rule in
     [`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md:31)
     — also a **pass-1 decision core**.
   So the *detailed build* instructions are already demand-loaded, but the *decision-level* JS/CSS/SVG
   prose is not.

2. **A "pass before the first pass" that selects applicable components?**
   **The concept is right; a new LLM call is the wrong implementation.** An extra inference pass pays
   its own input **and** output tokens, adds latency, and adds a new failure mode — for a run that may
   only produce a small diff. The codebase **already runs** a cheap classification on every request
   whose output is parsed anyway:
   - [`produceChatAnswer()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20830) (tier-1, two-tier since the output-token work) already returns a
     language-agnostic `topics` array — see
     [`codbi-chat-system-prompt.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md:11);
   - [`tryClarification()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20062) already **gates whole blocks** from `topics` + a keyword fallback using
     `<!--CLARIFY:tag-->` markers in
     [`codbi-clarification.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md:45).
   The cheapest correct fix is to **generalise that exact mechanism** to the pass-1 decision cores —
   reuse the signal you already pay for, add deterministic detectors for the strong cases, and gate
   `<!--SECTION:tag-->` blocks. No new call.

3. **Workflow nodes — are they transmitted to the form assistant?**
   **No — they are already absent from the form path.** [`buildCodbiFormSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:19410)
   pulls only `formcycle.general_decision` and never `formcycle.workflow_nodes`. That matters,
   because [`formcycle-workflow-nodes.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-workflow-nodes.md:1)
   is the **single largest prompt file at 109,724 chars** — and none of it is spent on a form edit.
   Workflow knowledge is loaded only by [`AIWorkflowAssistant.buildSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIWorkflowAssistant.kt:417),
   and there it is already two-tiered:
   [`buildWorkflowNodesCondensed()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptLoader.kt:1336) (names) in pass-1 and
   [`buildWorkflowNodeDetails()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptLoader.kt:1365) (requested nodes only) in pass-2.
   → There are **no workflow tokens to save** in the form assistant. The only small inefficiency is
   that `loadCategory(em, "formcycle")` materialises the whole category (including the 109 KB row)
   into a map; that is a DB/memory cost, not a token cost. (See lever 6.)

---

## 1. Where the input tokens actually go (measured)

Pass-1 composition, from [`buildCodbiFormSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:19410)
and file sizes on disk:

| Component | Chars | Notes |
|---|---:|---|
| `codbi.general.decision` (decision core) | 18,340 | pass-1, every request |
| `formcycle.general_decision` | 13,149 | pass-1, every request |
| `codbi.form_structure_rules_decision` | 12,059 | pass-1, every request |
| `codbi.form_task_instruction_decision` | 11,853 | pass-1, every request |
| **Decision cores subtotal** | **~55,401** | **~65% of pass-1** |
| Condensed widgets catalog (`buildWidgetsSectionCondensed`) | ~3,800–4,800 | see [`CodbiCapabilities.kt:255`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiCapabilities.kt:255) |
| Condensed elements catalog (`buildSectionCondensed`) | ~9,600 + | incl. local API-doc condensed (~11k), [`CodbiCapabilities.kt:251`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiCapabilities.kt:251) |
| `codbi.canonical_output_rules` | 2,799 | pass-1 |
| **Pass-1 total (logged)** | **~84,435** | matches the output-token plan |

Facts worth stating plainly:

- **Pass-2 is already demand-loaded.** [`loadCodbiApplyPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:19556) injects only
  `buildFullSectionFor(requestedIds)` / the requested widget templates, and the forced-final retry
  reuses the rerun's own lists (already fixed in the output-token plan). So "only send what's needed"
  is **done for the build pass**.
- **Pass-1 is the remaining sink**, and inside pass-1 the **decision cores** dominate. Those cores
  bundle rules that only apply to *some* requests (whole-form translation, panels/accordions,
  Fotocropper, BayVIS/EP wiring, OpenPLZ, `Sys.Log.Console`, illustrations, custom JS, money rounding,
  appointment finder, …).
- **No full-catalog regression risk from placeholders.** The pass-1 decision cores contain **no**
  `{{CODBI_FULL_SECTION}}` / `{{CODBI_ELEMENTS_SECTION}}` / `{{FORMCYCLE_WIDGETS_SECTION}}`
  placeholder (the only literal `{{CODBI_FULL_SECTION}}` is in
  [`codbi-functionalities.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-functionalities.md:452), a pass-2/full-path file), so
  [`resolvePlaceholders()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptLoader.kt:477) cannot silently re-inject the full catalogs into pass-1.

---

## 2. Recommended design — capability gating on the classification signal

### 2.1 Marker syntax (mirror the proven clarification mechanism)

Annotate scenario blocks in the pass-1 `.md` files with paired markers:

```
<!--SECTION:designed_text-->
… RICH / DESIGNED / INTERACTIVE TEXT + inline-SVG illustration rules …
<!--/SECTION:designed_text-->

<!--SECTION:custom_js-->
… custom-JavaScript rules …
<!--/SECTION:custom_js-->

<!--SECTION:ep_wiring-->
… HTML.Text.Injector / Mapper / EP-chaining rules …
<!--/SECTION:ep_wiring-->

<!--SECTION:translation-->
… whole-form translation rules …
<!--/SECTION:translation-->
```

Suggested initial tag set (each maps to one clearly bounded block already present in the cores):

`translation`, `panels`, `photocropper`, `ep_wiring`, `openplz`, `logging`, `designed_text`,
`custom_js`, `svg`, `css`, `money`, `appointment`, `datasource`, `navbar`, `repeatable`.

### 2.2 Reuse the signal that is already paid for

Extend the **existing** chat-classification envelope (and optionally `codbi.classify_intent`) with a
`sections` array — exactly like `topics` today:

```jsonc
{ "hasQuestion": …, "hasInstructions": …, "answer": "…",
  "topics": [],
  "sections": ["designed_text","custom_js"] }
```

- Documented in the `.md` prompts (never appended from Kotlin — see the rule in the output-token
  plan), with a one-line, language-agnostic, "by MEANING" spec per tag.
- Parsed with the same tolerant helpers as `topics`.

### 2.3 Deterministic detectors first (zero inference)

The strongest signals need **no** model output at all — generalise the existing
[`DesignedTextDetector`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/DesignedTextDetector.kt:3) pattern into a small registry of
`Detector(request) -> Set<SectionTag>`:

- `designed_text` / `svg` / `css` — design / interactive / animat* / SVG / hover (de/en/it/nl/fr);
- `custom_js` — "JavaScript", "Rechner/calculator", "Berechnung", "client-side", "validation";
- `translation` — "übersetze/translate/traduire/vertalen" + language names;
- `photocropper`, `openplz`, `logging` ("Konsole/console/log"), `money`, `appointment`, `panels`, …

Deterministic detection is cheap, unit-testable, and removes the failure mode "the model forgot to
list a section it clearly needs".

### 2.4 Assembly change

A single helper, e.g. `applySectionGates(text, tags, detected)`, applied at pass-1 assembly in
[`buildCodbiFormSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:19410) (and the equivalent in
[`AIFormAssistant`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIFormAssistant.kt:2106)):

1. resolve tags = `sections` (AI) ∪ `detected` (deterministic detectors) ∪ `keywordMatches`
   (deterministic fallback over the request + clarification answers);
2. keep a block when its tag is in the set; **fail-open** (keep) for unknown/untagged tags and for a
   tag present in neither signal;
3. strip the markers from kept blocks.

Log the resulting `gatedLen` and the kept/dropped tag list next to the existing pass-1
composition log so savings and regressions are observable from the log alone.

### 2.5 Why this is safe (two-layer reliability)

The dangerous direction is **dropping a rule that was needed**. Mitigations, identical in spirit to
the clarification gating:

- **Primary** = the AI's `sections` decision, language- and phrasing-independent;
- **Supplement** = keyword lists across de/en/it/nl/fr (only **adds** recall);
- **Fail-open** = a tag that matched neither signal is **kept**, not dropped;
- gating applies **only to the pass-1 decision cores**; the pass-2 build path is untouched.

### 2.6 Who actually decides — the AI is the primary signal, not the sole authority

The AI chooses `sections` by MEANING (language-agnostic), exactly like `topics` today. But the final
keep/drop is the **UNION** of three signals, and an unmatched tag **fails open**:

```
keep(tag) = detector(tag) OR aiSections(tag) OR keyword(tag)
            OR (no signal matched at all)          # fail-open
drop(tag) = NOT detector(tag) AND NOT aiSections(tag) AND NOT keyword(tag)
```

Consequences:

| Who | Can it cause a block to be **kept**? | Can it cause a block to be **dropped**? |
|---|---|---|
| AI `sections` (primary, by meaning) | Yes — flags tags the heuristics miss (novel phrasing) | Only combined with the others (its omission alone never drops) |
| Deterministic detectors + keyword lists | Yes — **override** an AI omission (recall safety) | No — they only add |
| Fail-open default | Yes — unknown/unmatched tags stay | No |

So: **the AI decides what it believes is needed, and that is the primary signal** — but a section is
physically dropped only when the AI omitted it **and** no detector/keyword matched it. The AI alone
cannot remove a section the deterministic layers consider relevant. This deliberately biases the
design against the dangerous error (dropping a needed rule) at the cost of a somewhat smaller saving
than a fully AI-authoritative gate would give.

The AI must know the tag vocabulary to answer, so a one-line, enumerated `sections` spec is added to
[`codbi-chat-system-prompt.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md:11)
(next to the existing `topics` bullet). That is a **small, fixed** addition to the classify call's
input (~a few hundred chars) — far smaller than the variable pass-1 blocks it removes.

---

## 3. Runtime data flow — what is determined first, and what is sent

Per form-editing run in [`AICodBiAssistant`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt):

1. **Always-run classification — this IS the "pass before the first pass".** It already exists:
   [`produceChatAnswer()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20860), called at
   [`AICodBiAssistant.kt:732`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:732).
   Tier-1 **input** = chat system prompt + condensed **FORM STRUCTURE** + chat history + clarification
   context — deliberately **without** the ~60 KB full form JSON (the two-tier optimisation). Its
   **output** envelope (`{hasQuestion, hasInstructions, answer, topics}`) gains **`sections`** with
   this change.
   It determines, in order:
   - `hasInstructions` → whether a build pass is needed **at all**. For a pure answer/ack turn the
     run returns immediately at
     [`AICodBiAssistant.kt:761`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:761) — **pass-1 is never sent** (already implemented);
   - `hasQuestion` / `answer` → the chat bubble;
   - `topics` → already threaded into the clarification round at
     [`AICodBiAssistant.kt:946`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:946), where
     [`applyClarificationSections()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20259) drops untriggered
     `<!--CLARIFY:tag-->` blocks;
   - `sections` (**new**) → the capability tags for pass-1 assembly.
2. **Clarification loop** ([`AICodBiAssistant.kt:922`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:922)) — may ask the user;
   re-runs carry `clarificationContext` (which the keyword fallback also scans).
3. **Pass-1 assembly** ([`buildCodbiFormSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:19410)):
   now compute `tags = sections ∪ detectors(request) ∪ keywordMatches(request + clarificationAnswers)`
   and run `applySectionGates(...)` over the four decision cores before concatenation.
4. **Pass-1 inference** → returns the diff (`items` + `_unchangedItems`) and/or a
   `need_codbi_details` request.
5. **Pass-2** ([`loadCodbiApplyPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:19556)) — unchanged; injects only
   the requested IDs / widget templates.

### What is transmitted (input) at each stage

| Stage | Sent | Deliberately not sent |
|---|---|---|
| Classify (tier-1) | chat prompt + condensed FORM STRUCTURE + chat history + clarification context | full form JSON, catalogs, decision cores |
| Pass-1 (build instruction) | always-on core + **only the gated `<!--SECTION-->` blocks** + condensed catalogs + canonical rules + the form/user content | untriggered scenario blocks, the full catalogs, pass-2 detail specs |
| Pass-2 | decision-core base + requested details / widget templates + the form | the full API reference (except a blind reconsideration) |
| Answer-only / ack | (nothing beyond the classify call) | pass-1, pass-2 |

Key point: the new `sections` value is **output** of the classification and is consumed **server-side**
to assemble the prompt — it is **never appended as extra prompt text**, so it adds **no** input tokens.
The only token change is the *removal* of untriggered blocks from the pass-1 system prompt.

Fallbacks: when `chatAnswerResult` is `null` (the classify call failed) or the installed prompt
predates `sections` (key absent), `sections` is empty → the deterministic detectors + the de/en/it/nl/fr
keyword lists decide, and any tag matched by neither signal **fails open** (block kept).

## 4. Where the workflow question lands (and the one small fix)

- Form assistant: **no workflow-node tokens** (verified above). Document this as intended, and add a
  regression assertion/test so a future refactor cannot accidentally splice
  `formcycle.workflow_nodes` into the form prompt.
- DB load: replace the whole-category load `loadCategory(em, "formcycle")` in
  [`buildCodbiFormSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:19417)
  with targeted key loads (`loadPrompt(em, "formcycle.general_decision")`, and `formcycle.widgets`
  only where actually used). This avoids reading the 109 KB workflow-nodes CLOB into memory on every
  form request. No token effect, but it removes waste and a false impression of coupling.

---

## 5. Secondary levers (cheap, do if the primary lands well)

1. **Gate the condensed Elements catalog groups.** The `## Element Placeholders` and
   `## Standard Configurations` groups are internal building blocks / config names. `## Element
   Placeholders` is needed only when the `ep_wiring`/`openplz` sections are in play; gate it by the
   same tag set.
2. **Gate the local API-doc condensed block (~11 KB)** in `elementsSectionCondensed` — it is
   pass-1-only context and can follow the `ep_wiring` tag.
3. **Keep a stable cacheable prefix.** Put the always-on decision core first and **append the gated
   annex after it**, with the per-request form JSON last. If the model provider supports prompt-prefix
   caching, an unchanged prefix still gets a cache hit while the annex shrinks. Corollary: do **not**
   reorder the *prefix* aggressively per request, or you trade raw tokens for lost cache hits.
4. **Skip pass-1 entirely for answer-only / ack turns.** The chat classifier already returns
   `hasInstructions=false`; make sure no form-editing pass runs for those (verify, and short-circuit
   if it does).

### 5.1 Implemented: cache-friendly assembly mode (`AI_Assistant_PromptCaching`)

Lever 3 is implemented as an opt-in plugin property — default **off**, i.e. today's behaviour is
unchanged when it is absent:

- **Flag:** `AI_Assistant_PromptCaching` — `false`/`off` (default), `true`/`on`/`1`/`yes`/`enabled`/
  `always` (always cache-friendly), or **`auto`**: cache-friendly only when a **cached-input rate is
  configured for the model** (`..._PricePerMCachedInput_...`), because that is the only signal that the
  provider really bills a cache hit cheaper. The flag is read in `AICodBiAssistant.initialize()`, so a
  change takes effect on the next plugin re-initialization; the per-run decision is made once in
  `runFormModification` (a thread-local, since the assistant instance is shared).
- **Cerebras specifically:** its docs state that "input tokens, whether served from the cache or
  processed fresh, are billed at the standard input token rate for the respective model" (GPT-OSS-120B:
  $0.35 / 1M in, $0.75 / 1M out, no separate cached rate). Prompt caching there is a **latency**
  feature, not a cost one — so do **not** set `PricePerMCachedInput` for it and keep `auto` off; the
  cache-friendly layout would only add its ~6-10k extra input tokens. In the change log the trips still
  report `cachedIn` (Cerebras reports the counter), and because no cached rate is configured the cost
  stays correctly at full price.
- **Why the order of events matters:** the caching mode's extra tokens come FIRST, the discount comes
  SECOND. Every call pays the re-sent (un-gated) blocks at the full rate; the discount only ever
  applies to the share the provider served from its cache, and only from the second call that shares
  the prefix. Without a configured cached-input rate `on`/`true` is therefore **strictly more
  expensive** — the extra ~6-10k input tokens per pass-1 (~$0.0035 at $0.35/1M) are never recovered —
  and the only gains are latency (time-to-first-token) plus the fact that the model sees every rule
  block. That is exactly why the default is off and why `auto` requires the cached-input rate.
- **What changes when it is on:**
  1. The `<!--SECTION:-->` gates are **not applied** in pass-1 and pass-2 — every section is kept and
     only the raw marker comments are stripped (`PromptSectionGate.KNOWN_TAGS` is passed as the keep
     set). Request-dependent gating was exactly what changed the middle of the prompt on every call.
  2. Both prompts are composed **static-first**: pass-1 = task instruction + structure rules +
     formcycle rules + canonical output rules, *then* the condensed catalogs and the Bürger-Services
     naming; pass-2 = structure rules + formcycle rules + the CodBi decision core + canonical output
     rules, *then* the requested CodBi details, the Bürger-Services naming and the requested widget
     templates. The server log prints this as `static block`/`static prefix=<n> chars` next to
     `cache-friendly=true`.
  3. The requested CodBi/widget ids are **sorted and de-duplicated** before the details are built, so
     the same *set* of ids always renders the same bytes.
- **Cost of the mode:** the blocks the gates used to drop are transmitted again — roughly **+6 k to
  +10 k input tokens per pass-1**. It only pays off when the provider (a) caches prefixes
  automatically and (b) bills the hits at a discount.
- **How to verify it:** every change-log trip now carries `cachedIn` whenever the provider reported a
  cache counter (`usage.prompt_tokens_details.cached_tokens`, or the flat Anthropic
  `cache_read_input_tokens` / DeepSeek `prompt_cache_hit_tokens`). The change log shows it per trip as
  `cached in <n>` and sums it into the "Inference trips" label.
- **How to read the result:** a hit can only appear on the **second and later** call of a run (pass-2
  after pass-1, or the forced final pass) — a first call never hits.
- **Pricing the discount:** the cost model has a dedicated, optional rate per model —
  `AI_LLAMA_STD_PricePerMCachedInput`, `AI_LLAMA_STD_ThinkingPricePerMCachedInput`,
  `AI_LLAMA_STD_SPECIALIST_PricePerMCachedInput_<name>`,
  `AI_LLAMA_STD_EXT_SPECIALIST_PricePerMCachedInput_<name>` — and the per-trip as well as the run cost
  bill each cache hit at that rate (falling back to the full input rate when it is unset). Without the
  property configured, the reported cost stays an upper bound.
- **Not automatic:** the backend does **not** choose between "cache-friendly" and "token reduction"
  on its own; `auto` only uses the *provider* (external vs. local) as the signal. A provider-specific
  hit-rate measurement (the `cachedIn` counter) is what would justify a smarter rule later.
- **Follow-up (only after this measurement):** if the hit rates are high, re-evaluate the mid-prompt
  gating — e.g. gate only the volatile tail, or make the mode unconditional for a caching provider.

---

## 6. Estimated effect

- Removing scenario blocks from the ~55.4 KB decision cores: for a plain field edit (no translation,
  panels, cropper, EP wiring, OpenPLZ, logging, illustration, JS, money, appointment), a realistic
  target is **−25 % to −40 % of the decision cores ≈ −14 KB to −22 KB per pass-1 request**
  (≈ **−3.5 k to −5.5 k input tokens**), and proportionally more on retries that re-send pass-1.
- The elements/local-API-doc gating in lever 4 adds up to roughly **−10 KB to −20 KB** on requests
  that do not need EP wiring.
- Workflow knowledge: **already 0** on the form path (confirm + lock with a test).
- All figures should be re-measured from the existing pass-1 composition log
  (`[AICodBiAssistant] Pass-1 system prompt: {} chars …`) before/after.

---

## 7. Implementation checklist

- [ ] Add `<!--SECTION:tag--> … <!--/SECTION:tag-->` markers to the scenario blocks of the four
      pass-1 decision cores:
      [`codbi-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md),
      [`formcycle-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-general.decision.md),
      [`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md),
      [`codbi-form-task-instruction.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-task-instruction.decision.md).
- [ ] Add `sections` to the classification envelope in
      [`codbi-chat-system-prompt.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md:13) and
      [`codbi-retry-chat.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-retry-chat.md) (no Kotlin-appended prompt text).
- [ ] Add a `SectionDetector` (generalising [`DesignedTextDetector`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/DesignedTextDetector.kt:3)) with unit tests.
- [ ] Add `applySectionGates(...)` and wire it into pass-1 assembly
      ([`buildCodbiFormSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:19410) and
      [`AIFormAssistant`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIFormAssistant.kt:2106)); log `gatedLen` + kept/dropped tags.
- [ ] Replace the whole-category `loadCategory(em, "formcycle")` with targeted key loads.
- [ ] Add a regression test asserting `formcycle.workflow_nodes` never appears in a form-assistant
      pass-1 prompt.
- [ ] Extend `PromptLoader.resolvePlaceholders` tests to prove no `{{*_SECTION}}` placeholder in the
      decision cores can re-inject a full catalog.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| A needed rule is dropped → behaviour regression | Fail-open (keep unless a section is explicitly excluded); deterministic detectors + AI `sections` + keyword fallback; gate only pass-1 |
| Format drift in the classification envelope → strict retry doubles output | Add `sections` as a first-class envelope key in the `.md` prompts (never appended from Kotlin), as already done for `topics` |
| Gating the prompt prefix defeats provider prompt caching | Keep the always-on core as a stable prefix; append the gated annex **after** it; per-request form JSON last |
| Marker rot (unbalanced/misspelled tags) | Fail-open on unknown tags; unit test that every marker has a matching close and a known tag |
| Measured saving smaller than expected | Instrument `gatedLen` per tag and re-measure from the existing pass-1 log before/after |

---

## 9. Remaining levers (ranked, state of 2026-09-26)

Measured per-trip breakdown of the reference run after the pass-2 decision-core swap, the name
index and the details-vocabulary rule (`tokensIn` from the change log's `trips`):

| Trip | tokensIn | Share |
|---|---:|---:|
| `classify-intent` | 2,110 | 3.5 % |
| `clarify-check#1` | 8,707 | 14.6 % |
| `form-pass-1` | 20,167 | 33.8 % |
| `form-pass-2` | 28,751 | 48.1 % |
| **Σ (run total)** | **59,735** | 100 % |

(Was 98,824 in / €0.0433 before: pass-2 alone went 67,840 → 28,751 by sending the `.decision`
structure rules and a NAME-ONLY CodBi index instead of the full reference.)

| # | Lever | Expected | Risk |
|---|---|---:|---|
| 1 | ~~**Trim pass-2's static core (gate `formcycle.general_apply`).**~~ **REJECTED by decision (2026-09-26)** — the file carries no `<!--SECTION:-->` markers, so it would have to be split by hand, and §9.1 shows the droppable part is only its two reference annexes (EConditionType table 1,578 + server-variable catalog 3,211 = 4,789 chars ≈ 1.2-1.4 k tokens) while every behavioural rule in the remaining 13.3 k chars has a **silent** failure mode (wrong condition code, missing `dynamic:"1"`, hidden instead of read-only, emptied area). Not worth the risk for ~1.3 k tokens. §9.1 stays as the record of *why*. | 0 (rejected) | — |
| 2 | **Widget-template fallback.** When the AI requests no widget id in pass-1, pass-2 sends the WHOLE `formcycle.widgets` reference (36,056 chars ≈ 12 k tokens). Either require ids, or gate the widget sub-sections with the same tag mechanism (plus the already-identified split of the XSpan "simple text" vs "illustration" template). | up to ~12 k on the blind branch | low-medium |
| 3 | **Skip the redundant clarification inference.** `clarify-check#1` costs 8.7 k on top of the same content pass-1 then receives. If the tier-1/tier-2 classification is unambiguous (`hasInstructions=true`, no ambiguity flags), the dedicated clarify call can be skipped for the first round. | ~8.7 k (15 %) | medium (quality) |
| 4 | **Fold `classify-intent` into `chat-classify`.** Both run on the same request with overlapping context; one combined envelope would remove a whole call. | ~2 k (3.5 %) | low-medium |
| 5 | **Bürger-Services naming** (11,384 chars ≈ 3.8 k tokens) — send the canonical ID list + the ELSTER fields only instead of the full naming section. | ~2-3 k | low |
| 6 | **Pass-1 always-on core** (~55.4 k chars ≈ 18 k tokens, 65 % of pass-1) — move the worked build examples into a gated tag; gate the condensed catalogs with the same tags. | ~3-6 k | low-medium |
| 7 | **Output side** — strip default-valued properties from the pass-2 `_diff` dump (a smaller diff also shrinks the NEXT pass's input) and lower/disable the reasoning budget for the mechanical passes. | output + next input | low |

### 9.1 What "rule loss" means for lever 1 (block-level, from `formcycle-general-apply.md`)

Every block below is a rule that would become droppable if it were tagged. `PromptSectionGate` fails
OPEN (unknown tags and tags in `keepTags` keep their block), so a loss requires a **false negative of
both** the AI's `sections` answer and the deterministic detectors for that theme — but when it happens
the defect is silent. Measured block sizes, and what actually breaks:

| Block (lines) | Chars | Plausible tag | Failure mode when wrongly dropped |
|---|---:|---|---|
| EP parameters & `V` (5) | ~1.2 k | `ep_wiring` | EP parameter quoted (`> "Name"`), a person name used as a variable, `{ V > … }` for details |
| Flat items / property-level refs (7) | ~1.1 k | always-on | `name` at top level instead of `properties.name`, children referenced by id, emptied `elements` |
| Name prefixes + unique `xi-` id + never invent className (9) | ~0.4 k | always-on | off-convention names, duplicate ids, invented classNames |
| Relative placement / intro at position 0 (11, 13) | ~1.9 k | always-on (`placement`) | "unter dem Container X" becomes a CHILD of X → wrong nesting |
| Removals / remove-all (15) | ~0.7 k | `removal` | dangling reference to the removed field; on "remove all" the page/header/footer get deleted |
| Forbidden fields (17) | ~0.3 k | always-on | `css`/`script`/`image`/`metadata` emitted into the form JSON |
| Custom JavaScript (19) | ~1.2 k | `custom_js` | form-level `script`, `DOMContentLoaded`, a bare `<button>` that submits, asking for an API key |
| Partial HTML edits (21) | ~0.5 k | `designed_text`, `svg`, `custom_js` | the whole XSpan is rewritten → the other parts of its HTML are destroyed |
| Reuse instead of duplicating (23) | ~0.5 k | always-on | duplicates on re-runs → the form grows |
| Button actions (25) | ~0.6 k | `navbar`, conditions | "Weiter" without `check=true` → the page is skipped without validation |
| Conditional triple (27) | ~1.7 k | `conditions` | incomplete `hiddenif*` triple → a field that never shows |
| **EConditionType codes (29-40)** | **1,578** | `conditions` | a wrong code → the condition fires inverted or never (silent) |
| State-based availability (42) | ~1.6 k | `approval` | "aktiv im Status X" → `statusdependent` → the element is HIDDEN instead of read-only; invented state UUIDs |
| Condition on a container / fsBKAllDaten (44) | ~0.4 k | `address`, `bundid` | an invented container just to host a condition |
| Repeatable containers (46) | ~1.2 k | `repeatable` | no `dynamic:"1"` (not repeatable); nested dynamic containers (Formcycle rejects) |
| Collapsible in place (48) | ~0.4 k | `panels` | the area is emptied → an EMPTY form area is rendered |
| technicalId vs displayText (50) | ~0.3 k | always-on | invented `buttonName`/technicalId |
| Whole-form translation (52) | ~1.9 k | `translation` | the base language is overwritten instead of adding `properties.i18n`; technical ids translated |
| **Server variables (54-120)** | **3,211** | `sv_variables` (new) | invented `[%$…%]` placeholder names; asking the user for a URL/source |

Even the two reference annexes were **rejected** (2026-09-26): the honest saving is ~1.3 k tokens, and
the behavioural rules must stay always-on because their loss produces *silent* form defects. §9.1 is
kept as the record of why.

### 9.2 Measured instead: `re-emission stats` (the AI re-generating unchanged properties)

The diff protocol keeps untouched **items** out of the answer, but every item the AI *does* re-emit must
be COMPLETE ("re-authored IN FULL", pass-1 REMINDER 3) — so touching ONE property of an element makes the
model regenerate all of that element's other properties as well. The change log cannot show this (it is a
before/after diff of the *applied* result), so the backend now logs it per pass:

```
[AICodBiAssistant] form-pass-N re-emission stats: items re-emitted=… (existing=…, new=…),
properties unchanged=…, changed=…, new=…
```

`properties unchanged` is pure re-transmission (output cost, and the drift surface — a property that
travels through the model can come back subtly altered); `changed`/`new` are the real work. Read it next
to `completionChars` of the same trip: a large `unchanged` count on a small request is the price of the
"complete item" rule.

### 9.3a Implemented: property-level patches (lever 8) + `AI_Assistant_ReasoningEffort`

**Property-level patches.** The merge engine now *applies* a partial item instead of demanding a
complete copy:

- `graft()` inside [`splicePass2IntoPass1()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3840)
  merges an AI item onto the baseline item it modifies (patch keys win, omitted properties keep the
  baseline value). Because the splice runs with the form the AI was actually SHOWN — `persistJson`
  for pass-1's own `_diff`, the materialized pass-1 result for pass-2 — a partial pass-2 patch no
  longer loses pass-1's earlier change to the same element.
- `"_removeProps": ["<property key>", …]` (per item) names the properties the AI REMOVED; it is
  honoured AFTER the merge, since omission means "unchanged" and would be restored
  ([`removePropsOf()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:275),
  also applied in `restoreStrippedFields`).
- Prompt side: the TOKEN SAVING rule in
  [`codbi-form-task-instruction.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-task-instruction.decision.md:35),
  the in-place-modification and functionality-removal rules in
  [`codbi-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md:105)
  and pass-1's REMINDER 3 now ask for "ONLY the properties you change", with three explicit
  exceptions: a structurally changed container resends its `elements` array, a changed HTML property
  is sent complete, and an `attributes`-array removal still resends that array.
- Unchanged: the deterministic guards (People/OpenPLZ classes, denest, rowid, standards) all run on
  the finished, merged form, and the `isLeafStubItem` guard still protects a container the AI echoed
  in reduced form.

**Reasoning budget.** `AI_Assistant_ReasoningEffort` (`low`/`medium`/`high`/`off`) is forwarded to
external providers as `reasoning_effort`
([`reasoningEffortJson()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ai/llama/commons/ChatCompletionService.kt:183)).

**Provider constraint (learned from a real 400):** `low`, `medium` and `high` are the only values a
GPT-OSS-style API accepts — Cerebras answers everything else with
`HTTP 400 … Unsupported reasoning effort: <value>`, which aborts the whole run (selecting `none` in the
dropdown did exactly that). The "off" family and every other unsupported value are therefore coerced to
`low`, the lowest supported level, with a WARN log line, so no configuration can break a request. A true
"no reasoning at all" switch has to be configured through the provider's own extra-parameters property
(e.g. `…_ExtraParams_<name>={"disable_reasoning":true}`). The dropdown labels the option
`Off (minimum)` to say what it really does.
The value is resolved per call with the following precedence (highest first):

1. **per-request UI selection** — the assistant dialog's reasoning-effort dropdown (Default / Low /
   Medium / High / Off), placed directly BEFORE the CodBi switch in the footer and sent as the
   `reasoningEffort` run parameter. `AICodBiAssistant.handleRun()` stores it once per run in a
   thread-local via
   [`Standard.setRequestReasoningEffort()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ai/llama/Standard.kt:1203)
   (`null` included), so a pooled thread can never leak the previous run's value. `Default`/blank
   means "no per-request override".
2. **per-specialist property** `AI_Assistant_ReasoningEffort_<specialist>` — parsed into a
   case-insensitive map keyed by the model id after stripping the `specialist:` / `ext-specialist:`
   prefix, mirroring `AI_FormAssistant_MaxFormReruns_<name>`.
3. **global property** `AI_Assistant_ReasoningEffort`.
4. **provider default** — nothing is sent.

The resolution lives in
[`Standard.resolveReasoningEffort(modelId)`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ai/llama/Standard.kt:1243)
and is threaded into
[`callFormAssistModel()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ai/llama/Standard.kt:1298)
as the new per-call `reasoningEffort` parameter of `chatCompletion()`. The Models payload also carries
the option list + the effective configured default per model, so the dialog does not hard-code either.

The effect is already readable from the trips: reasoning tokens are billed as completion tokens but
are absent from the returned text, so the ratio `tokensOut` ÷ `completionChars` of one trip shows how
much of the output was thinking.

### 9.4 Measured on two real runs (same prompt, `low` vs `medium` reasoning)

| Trip | run 207 `low` (tokens in / out) | run 206 `medium` (tokens in / out) |
|---|---|---|
| `chat-classify` | 2,206 / 179 | 2,110 / 278 |
| `clarify-check#1` | 8,803 / 182 | 8,707 / 342 |
| `form-pass-1` | 21,253 / 108 | 20,825 / 1,060 (`cachedIn` 19,584) |
| `form-pass-2` | 26,577 / 2,027 | 26,947 / 3,596 |
| **Σ** | **58,839 / 2,496 → 0.02247** | **58,589 / 5,276 → 0.02446** |

- **Input is ~92 % of the bill** (58.8 k × $0.35/1M ≈ $0.0206 vs 2.5 k × $0.75/1M ≈ $0.0019), so
  halving the output is worth only ~8 % — the reasoning budget is a LATENCY lever on Cerebras, not a
  cost lever. That is exactly why the two runs "cost the same" despite 2,496 vs 5,276 output tokens.
- The hidden reasoning is visible in the chars/token ratio: pass-1 with `medium` returned 256 chars for
  1,060 tokens (~0.24 chars/token); with `low` 90 chars for 108 tokens.
- pass-2 (48 %) + pass-1 (33 %) are 81 % of the run; `clarify-check` alone is 15 %.
- pass-2's 26.6 k input tokens are ≈ 93.5 k chars of system prompt: `widgetTemplates` 36,056 +
  `formcycleGeneral` 17,912 + `codbiDecisionCore` 13,830 + `buergerservice` 11,384 + `structureRules`
  9,518 + `canonical` 2,790 + `details+nameIndex` 1,991.
- `cachedIn` 19,584 in the medium run vs none in the low run: the provider's prefix cache is
  best-effort (data-centre routing) — and on Cerebras a hit costs the same as a fresh token anyway.

### 9.5 Remaining levers, ranked by those measured sizes (none of them drops a rule)

| # | Lever | Size | ≈ % of run | Risk |
|---|---|---:|---:|---|
| A | ~~One conversation for pass-1 + pass-2~~ — **CORRECTED, not a token saving.** A chat-completion call is STATELESS: a second turn must carry the whole message array, so it re-sends the same ~94 k-char system core **plus** turn 1's messages — i.e. it *adds* input tokens. It only pays off on a provider that **discounts cached prefixes** (Anthropic/OpenAI/DeepSeek-style); Cerebras bills cached tokens exactly like fresh ones, so there it buys latency (TTFT) and continuity (the model keeps its own pass-1 decisions in context), not cost. | 0 on Cerebras | — |
| B | **Gate the WIDGET sub-sections with the same `sectionKeepTags`**: the XSpan template carries BOTH the designed-text and the SVG-illustration halves; the request needs only the half its tags select (the AI can still ask for the other via `need_codbi_details`) | ~8.5 k in | ~32 % | low (superseded by A) |
| C | **De-duplicate `formcycle-general-apply` against `codbi-form-structure-rules.decision`** — conditional properties, repeatable containers, panels and placement are stated in both; move each rule to ONE place | ~4.5 k in | ~17 % | low-medium |
| D | **Trim the Bürger-Services naming block** to the canonical name list + the ELSTER fields (drop the prose/worked examples) | ~3 k in | ~12 % | low |
| E | **Skip the dedicated clarify-check when the classification is unambiguous** (the same content is re-sent to pass-1 anyway) | ~8.8 k in | ~14 % | medium (quality) |
| F | **NAME-ONLY catalogs in pass-1** (the AI only needs the names to request details; the condensed "first sentence" is the next size after the decision cores) | ~2-3 k in | ~10 % | low-medium |
| G | **Merge `classify-intent` into `chat-classify`** | ~2.2 k in | ~4 % | low-medium |

A and B overlap (with A, pass-2 no longer re-sends the widget templates at all), so A+B are not
additive — A is the structural version of B. C, D and F are pure information de-duplication/reduction
with no rule removed; E and G change the pass structure and need the prompt corpus as a guard.

### 9.6 Implemented: HTML escaping disabled in every AI payload (lossless)

Gson escapes `<`, `>`, `=`, `'` and `&` into `\u003c`/`\u003e`/`\u003d`/`\u0027`/`\u0026` **by
default**, which JSON does not require — and every AI payload, prompt text and change-log row in this
plugin was serialized with a plain `GsonBuilder().create()`. Consequences:

- each of those characters cost 5 extra characters (≈2-3 tokens instead of 1) in the form dumps, the
  HTML/`rtevalue` content, the EP expressions (`{ Data.Join > … }`) and the rule texts;
- the model **mimics** the escaping it was shown — a real answer contained
  `"rtevalue":"\u003cstyle\u003e@keyframes …\u003d\u0027…"` — so the same inflation was paid again in
  the answer (output tokens) and in the next pass's input.

`GsonBuilder().disableHtmlEscaping()` is now used by [`AICodBiAssistant`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:69)
(payloads, prompts, API responses), [`AiAssistantLog`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AiAssistantLog.kt:34)
(change-log rows, which are also fed back as change history) and both assistant variants
([`AIFormAssistant`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIFormAssistant.kt:54),
[`AIWorkflowAssistant`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AIWorkflowAssistant.kt:48)).

**Lossless** — the characters survive the JSON round-trip unchanged, and every consumer parses JSON
(the designer uses `JSON.parse`, the backend Gson). Verification is visible in the log: the
`Form data sent to AI …` / `Pass-2 form elements sent to AI …` lines now show raw `<p>`, `<style>`,
`{ Data.Join > … }` instead of the `\u003c…` forms, and `promptChars`/`completionChars` of the trips
drop for HTML-heavy requests.

### 9.8 Status after the 2026-09-27 changes — what is closed, what is still open

Closed since §9.5 was written:

| Item | Outcome |
|---|---|
| §9.5 B "strip the designer defaults / dump diet" | **already implemented** (`slimPersistJson` + `sliceFormForPass2`) — see §9.7; the default-equality variant is rejected |
| HTML escaping in every AI payload | **done** (§9.6) |
| §9.5 C "de-duplicate the four rule files" | **done**: single authoritative home per topic; pass-1 ≈ −5.9 k chars, pass-2 ≈ −5.9 k chars (≈ 3 k tokens/run). Watch: rules relocated into the section-gated structure-rules file are now gated in pass-2 as well |
| Reading convention ("empty ⇒ omitted") | **taught** in `codbi-form-structure-rules.decision.md` (both passes) |
| Change-log per-entry "apply again" | **done** (frontend) |
| §9.8 lever 1 "gate the WIDGET sub-sections" | **done (2026-09-27)**: the `XSpan` widget section is split into `<!--SECTION:designed_text-->` (the designed/interactive-text rules), `<!--SECTION:designed_text,svg,custom_js-->` (the in-`rtevalue`-`<style>` / animation / custom-JS mechanism) and `<!--SECTION:svg-->` (the illustration rules incl. BOTH worked examples and the forbidden-composition list, ~20 k chars), and [`buildWidgetDetailsSection()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20442) gates every requested widget's content with the run's `sectionKeepTags`. [`DesignedTextDetector`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/DesignedTextDetector.kt:81) adds `designed_text`+`svg` to that set when it force-adds `XSpan`, so the force-in can never deliver a gated-away section. The rethink prompts and the legacy assistant keep every block and only strip the markers (fail-safe). **Requires a prompt re-seed** — the DB rows (`formcycle.widgets.xspan`, `formcycle.widgets`) still hold the unmarked text, so the split is inert until re-seeded; guard: [`WidgetSectionGatingTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/WidgetSectionGatingTest.kt:1) (7 tests against the real bundled file) |

Still open, best value/effort first:

| # | Lever | Size | Notes / risk |
|---|---|---:|---|
| 1 | **Skip the dedicated clarify-check when the classification is unambiguous** (its content is re-sent to pass-1 anyway) | ~8.8 k in (15 % of a run) | behavioural: may ask one round later |
| 2 | **Shorten what pass-2 must be told** — the only real way to cut pass-2's input. A one-conversation design does NOT help a stateless API (it re-sends the same system core plus the first turn; see the correction in §9.5 A), so the honest options are: send fewer rule blocks to the pass that builds, and/or move to a provider that discounts cached prefixes (then the existing `AI_Assistant_PromptCaching` + `…PricePerMCachedInput…` support it). | up to ~5 k in today; ~22 k only with a discounting provider | rules are needed *when the build happens* — trim only what that pass provably cannot act on |
| 3 | **Multi-language translation in ONE pass** — `runSequentialWholeFormTranslation` currently costs one full-form inference per language | N−1 inferences per multi-language request | unexplored; would matter a lot for "translate into 5 languages" |
| 4 | **Merge `classify-intent` into `chat-classify`** | ~2.2 k in | both run on the same request |
| 5 | **Trim the Bürger-Services naming block** to the canonical names + ELSTER fields (drop prose/examples) | ~3 k in | low risk, prompt only |
| 6 | **NAME-ONLY catalogs in pass-1** (names are enough to request details) | ~2-3 k in | medium: the first sentence helps the AI *choose* the right element |
| 7 | **Workflow prompt split** — the workflow branch (`workflow-pass-1/2/2-retry`, mail/endpage i18n) has never had the decision-core/full-reference split that the form path got | unexplored, likely large for workflow runs | needs the same inventory/consolidation method |
| 8 | **Output-side leftovers** — `_codbiApplicability` report (~200-400 output tokens/run) could be derived from the diff instead of generated; the forced-final and retry passes | small per run | measure first |

**Closed 2026-09-27 (was lever 1)** — gate the widget sub-sections with the same `sectionKeepTags`: see the "closed" table above. Measured effect: the `svg` half is >15 k chars, so a request that needs only a designed text no longer pays for the illustration rules and vice versa; the guard test asserts the >15 k split.

### 9.7 Correction: the "emptiness" dump diet was ALREADY implemented — and the convention is now taught

Reading the code before implementing the "strip empty arrays/objects from the form dump" idea showed it
is **already done**:

- [`slimPersistJson()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:6273) removes every property whose value is an empty primitive (`""`), an
  empty array or an empty object — plus `properties.i18n` (kept server-side and merged) and the root's
  `STRIPPED_FIELDS` (`css`, `script`, `base`, `formI18n`, `metadata`, …);
- [`sliceFormForPass2()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:6341) builds the pass-2 dump **from** `slimPersistJson(formBase)`, so pass-2
  inherits exactly the same diet.

The empty arrays that looked like a leak in the `Pass-2 form elements sent to AI …` log line are the
RAW target items printed for diagnosis; the payload itself is the slimmed dump (`Pass-2 payload sizes:
… form dump=1,821 chars, 3/3 items in full` in the same run).

So the only variant left was stripping **non-empty values that equal the class default** (`maxwidth`
850px, `print_hide` `"0"`, `showrequiredhint` `false`, …) — **rejected**, because the AI never receives
the defaults table (`base` is in `STRIPPED_FIELDS`) and the defaults are only documented sporadically
in prose, so "absent" would become ambiguous exactly where it matters. That is also why the reading
convention is now stated explicitly in
[`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md:5)
(which both passes receive): *properties with an empty value are omitted — an absent property is empty/none,
never missing, never to be re-created; `properties.i18n` is omitted and merged server-side; `base`/`css`/
`script`/`metadata` are never in the dump*. It costs ~4 lines and removes a whole ambiguity class from
the existing (already slimmed) dump.

**The structural fix (lever 8) — and why it is cheaper than it looks.** The merge engine ALREADY
implements the semantics a property-level patch needs: [`restoreStrippedFields()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:6604)
runs, for every **existing** item the AI re-emitted:

```kotlin
for (entry in origProps.entrySet()) {
  if (!resultProps.has(entry.key)) resultProps.add(entry.key, entry.value)   // omitted = keep original
}
```

So an omitted property is not lost — it is restored from the pre-AI form. The "re-emit the element IN
FULL" rule therefore exists for exactly one reason: **a REMOVAL cannot be expressed by omission** (it
would be restored right back). Hence the prompt's warning "never omit the `attributes` key — the server
restores it, so the removed functionality silently comes back".

What lever 8 therefore really needs:

1. **Prompt**: for a *modification*, emit only the properties that change; keep "in full" ONLY for a
   removal (or introduce an explicit marker).
2. **A removal marker**, e.g. per item `"_removeProps": ["hiddenif","hiddenifcomp","hiddenifvalue"]`,
   honoured AFTER the restore loop (otherwise the restore re-adds them). This replaces the
   "re-emit the entire attributes array without them" convention.
3. **Thread the right baseline**: pass-2 is a fresh conversation whose merge baseline must be the
   **pass-1 result**, not the pre-AI form — otherwise a pass-2 item emitted as a partial patch would
   lose pass-1's changes to that same item. This is the only real architectural work (audit
   [`splicePass2IntoPass1()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3633)
   and every other consumer of the AI's items: `dropDuplicateTextSpans`, `applyRemovedItems`,
   `repairOrphanedFormElements`, the `wasNew`/`aiKeptContainers` logic).
4. **Safety nets are unaffected**: the deterministic guards (People/OpenPLZ classes, denest, rowid
   normalisation, standards, nets) all run on the FINISHED, merged form — they never see a partial item.

Savings and risk: the win is the `~chars re-transmitted` figure the new log line prints (output is the
expensive direction, ~$0.75/1M on Cerebras), plus the removal of the drift surface for untouched
properties. The risk is that "omitted" becomes ambiguous for a small model — a forgotten property now
silently keeps its OLD value (a missed change) instead of destroying a value, which is the safer
failure mode, but it needs the prompt corpus in
[`plans/form-assistant-test-prompts.md`](form-assistant-test-prompts.md) as a regression guard. It does
NOT help `rtevalue` part-edits, which inherently must resend the whole HTML string.

**Next step: measure before coding.** The per-trip table above makes the branch question answerable
from the log alone — run three representative prompts (plain field edit, Bürger-Services request,
illustration/XSpan request) and read which pass-2 branch fires (details request vs. blind vs. full
widget fallback) together with the `Pass-2 system prompt composition` line. Levers 1, 2 and 5 are then
safe, additive trims; levers 3 and 4 change the pass structure and should be validated against the
prompt corpus in [`plans/form-assistant-test-prompts.md`](form-assistant-test-prompts.md).
