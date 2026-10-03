# Form Assistant — What still has to be done to cut tokens WITHOUT losing information

Authoritative "remaining work" list for reducing the Form Assistant's token usage. It assumes the
two existing plans as the record of what is already closed:

- [`plans/formassistant-output-token-optimization.md`](formassistant-output-token-optimization.md)
- [`plans/formassistant-input-token-optimization.md`](formassistant-input-token-optimization.md)

Every open item below is justified in exactly one way: **the information is either still present
elsewhere, re-encoded losslessly, or available on demand** — none of them deletes a rule the model
needs to act on the current request. That constraint is the whole point of this document, so each
lever is classified by *which* lossless mechanism it uses (see §1).

---

## 1. The seven lossless reduction mechanisms (the "without losing info" contract)

| # | Mechanism | Why nothing is lost | Where it is used |
|---|---|---|---|
| A | **Lossless re-encoding** | Same characters, cheaper encoding — a JSON round-trip returns identical values | HTML-escaping off (§9.6), compact JSON |
| B | **De-duplication to a single home** | The rule still exists — exactly once — in a file that reaches the *same* prompt/pass | decision-core consolidation (§9.8 / pass-1 de-dup) |
| C | **Demand-loading** | The detail is not needed to *decide*; the model can request it (`need_codbi_details`) and gets it in the same run's pass-2 | `.decision` cores, targeted details, widget templates |
| D | **Conditional gating with fail-open** | A block is dropped only when **no** signal (AI `sections` ∪ detectors ∪ keywords) matched; an unmatched tag is **kept** | `<!--SECTION:-->` / `<!--CLARIFY:-->` gating |
| E | **Skipping a redundant inference** | The *same* content is already sent to the next pass that acts on it; only the duplicate call is removed | two-tier chat, clarify skip, classify merge |
| F | **Zero-inference re-apply** | The finished artifact is stored verbatim in the change log and re-applied deterministically | `applyLogEntry` |
| G | **Structural patch instead of full re-emission** | Omission means "unchanged" and the server restores the original value; removals use an explicit marker | property-level patch + `_removeProps` |

An open lever that cannot be mapped to one of A–G is **not** listed — it would be a rule loss.

---

## 2. Closed — do NOT re-open

| Mechanism | Item | State |
|---|---|---|
| A | HTML escaping off in every AI payload / change-log row | done ([`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:69)) |
| B | Pass-1 decision cores de-duplicated, single authoritative home per topic | done |
| C | `.decision` cores instead of full build files (pass-1 **and** pass-2) | done |
| C | Condensed catalogs in pass-1; NAME-ONLY CodBi index + targeted details/templates in pass-2 | done |
| C/D | `<!--SECTION:-->` gating of the 4 pass-1 cores and the pass-2 `XSpan` widget split | done ([`PromptSectionGate.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptSectionGate.kt:312)) |
| D | `<!--CLARIFY:-->` gating of the clarification scenario blocks | done |
| E | Two-tier chat classification (tier-1 withholds the ~60 KB full form) | done ([`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:22627)) |
| E | Answer-only / ack turns skip pass-1 entirely | done |
| G | Property-level patches (`graft()`) + `_removeProps`; `slimPersistJson` / `sliceFormForPass2` | done |
| F | Change-log re-apply without inference (form **and** workflow, whole entry and per element/node) | done ([`plans/formassistant-apply-from-log.md`](formassistant-apply-from-log.md)) |
| — | Reasoning budget: UI dropdown > `…_<specialist>` > global > provider default | done |
| — | Opt-in cache-friendly assembly (`AI_Assistant_PromptCaching`) | done (opt-in, only pays off with a real cached-input discount) |
| — | Rejected on purpose: gating `formcycle.general_apply`; stripping class-default values from the dump | rejected — silent-defect risk for ~1.3 k tokens |

---

## 3. Open levers, ranked by measured value

Measured reference run (post pass-2 decision-core swap), from the change log `trips`:

| Trip | tokensIn | Share |
|---|---:|---:|
| `classify-intent` | 2,110 | 3.5 % |
| `clarify-check#1` | 8,707 | 14.6 % |
| `form-pass-1` | 20,167 | 33.8 % |
| `form-pass-2` | 28,751 | 48.1 % |
| **Σ** | **59,735** | 100 % |

Input is ~92 % of the bill on the reference provider, so the ranking below is by **input** tokens.

### 3.0 Baseline AFTER lever 1 (measured 2026-09-27): ~46 k in / ~2.25 k out

Lever 1 (the clarify skip) removed the `clarify-check#1` inference (~8.7 k). What is left is ~46 k in
and ~2.25 k out — i.e. **pass-1 + pass-2 ≈ 95 % of the bill**, so the ranking is unchanged in *shape*
but strongly shifted in *weight*: `form-pass-2` is now the dominant sink by a wide margin.

Bundled prompt sizes (the DB copies are seed-identical):

| Block | Bundle file(s) | Bytes | ≈ tokens | Sent to |
|---|---|---:|---:|---|
| **Full widget reference** | `formcycle-widgets.md` | **72,799** | **~20–25 k** | pass-2 **blind fallback** (`widgetIds` empty) |
| Full CodBi reference (`{{CODBI_FULL_SECTION}}`) | `codbi-functionalities.md` 72,134 + `codbi-element-placeholders.md` 34,744 + `codbi-standard-configurations.md` 26,964 | **~133,800** | **~35–40 k** | pass-2 **pure-blind** branch (both lists empty) |
| Form-structure decision core (gated) | `codbi-form-structure-rules.decision.md` | 22,560 | ~7 k | pass-1 + pass-2 |
| CodBi decision core (gated) | `codbi-general.decision.md` | 19,093 | ~6 k | pass-1 + pass-2 |
| Task-instruction decision core | `codbi-form-task-instruction.decision.md` | 12,536 | ~4 k | pass-1 |
| Bürger-Services naming | `codbi-buergerservice-naming.md` | 11,801 | ~4 k | pass-1 + pass-2 (only when enabled) |
| Clarification template | `codbi-clarification.md` | 44,328 | ~14 k | clarify round (now often skipped) |
| Canonical output rules | `codbi-canonical-output-rules.md` | 2,799 | ~1 k | pass-1 + pass-2 |

**Arithmetic, not an estimate:** pass-1 is ~55 k chars ≈ 18–20 k tokens and the two classify calls are
~4 k, so ~23 k of the 46 k is pass-1 + classify; the remaining ~23 k matches **the full widget
reference (72.8 k chars ≈ 20–25 k tokens) almost exactly**. Read
`Pass-2 system prompt composition: … widgetTemplates=<n> …` in the server log to confirm — if
`widgetTemplates` is ~70 k, that single block is the next target. The remaining levers below are
therefore ranked around the **blind pass-2 fallback**, not around more decision-core trimming.

### 3.1 Update 2026-09-27 — the blind fallback is closed; the always-on cores are now the target

Both pass-2 savings landed (item 1, and the clarify skip before it). A plain-edit run now shows only
`classify-intent` + `chat-classify` + `form-pass-1`; the measured pass-1 line is:

```
Pass-1 system prompt: 72605 chars (cache-friendly: false, static block: 38838 chars, sections kept: <none>)
[PromptSectionGate] section gating: 87029 -> 72605 chars (22 block(s) dropped, ~14424 chars; keep=[])
```

**Marking coverage, measured:** the three pass-1 decision cores carry only **22 tagged blocks**
(`codbi-general.decision.md` 13, `codbi-form-structure-rules.decision.md` 8,
`codbi-form-task-instruction.decision.md` 1), and those cover just **14,424 of the 87,029 chars
(16.6 %)**. The files themselves are 19,093 + 22,560 + 12,536 = **54,189 chars**, so roughly
**~40,000 chars of decision-core rules are untagged and therefore paid on EVERY request**
(≈ 11–12 k tokens) — even for a request as narrow as "rename one label".

**Implemented 2026-09-27 — with a correction to the estimate above.** Inspecting the untagged bulk
per rule showed that most of it is *legitimately* always-on cross-cutting material (the
details-request protocol, the applicability report, preserve / in-place-modification, required
fields, the reading convention …) which must not be gated away. What *was* gatherable are the
**build-scope** rules — they only matter when the request actually builds or removes form structure —
so two tags were added to the vocabulary in
[`PromptSectionGate.KNOWN_TAGS`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptSectionGate.kt:44):
`field_creation` (creates/adds or groups fields, containers, buttons) and `removal` (deletes elements
or functionalities). Both are advertised in the chat + retry envelopes and backed by deterministic
detector keywords (recall only).

Marked blocks:

- `codbi-form-structure-rules.decision.md`: ROW GROUPING (24–30), CONTAINER GROUPING (32–36),
  COMPLETE FORM RULES (38) and BUTTON ACTIONS (72) as `field_creation`; REMOVALS (60) as `removal`;
  PARTIAL HTML EDITS (68) as `designed_text,svg,custom_js`.
- `codbi-general.decision.md`: the Bürger-Services/BundID note (61) as `bundid`; REMOVING A
  FUNCTIONALITY FROM AN EXISTING ELEMENT (91) as `removal`.

**Measured:** gating the structure core with an empty keep set now gives
`section gating: 22759 -> 10608 chars (14 block(s) dropped, ~12151 chars; keep=[])` — i.e.
**≈ 12.2 k chars ≈ 3.5 k tokens**, plus ~1 k chars in the general core: about
**−13 k chars ≈ −3.8 k tokens per pass-1** for a request like "rename one label". The earlier
"~6–9 k tokens" figure was too optimistic; this is the honest number. The always-on core of both
files is untouched, asserted by the new
[`PromptSectionGateTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptSectionGateTest.kt)
case *"a plain edit drops the build-scope rules of the structure core and keeps the core rules"*.
Markers were inserted by an idempotent helper
([`scripts/add-section-markers.mjs`](../scripts/add-section-markers.mjs)) so the next marking pass is
a table edit, not hand-surgery on multi-KB rule lines.

### 3.2 State at end of day 2026-09-27 — the handover point

**Do these three things first on the new machine (≈5 minutes):**

1. `.\mvnw.cmd -DskipTests compile` must pass; the suite this session used is
   `-Dtest=PromptSectionGateTest,FormItemIdentityTest,CodbiBlindPassPolicyTest,ClarifySkipPolicyTest,ApplyLogEntryTest,ApplyLogEntryWorkflowTest`
   (80 tests, all green).
2. **Start the plugin once.** Every `.md` change below is INERT until the prompts are re-seeded —
   watch for `[PromptLoader] Seed complete for version '<timestamp>'` in the log. A change that
   "does nothing" is almost always an un-re-seeded prompt (or a stale plugin build).
3. Re-run the reference prompts (plain label edit, the Bürger-Services build prompt) and read the
   instruments listed at the end of this section.

**Implemented and verified in this session:**

| Work | What it does | Key files |
|---|---|---|
| Clarify-round skip | Skips the ~8.7 k-token clarify inference when the tier-1 answer says no question and no tool context are needed (fail-open) | [`ClarifySkipPolicy.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ClarifySkipPolicy.kt), loop guard in [`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:1996) |
| Blind pass-2 skip | Suppresses the blind CodBi reconsideration (which re-sends the 72.8 k widget reference) unless a CodBi-capable section, a created widget or `data-cb-` wiring says otherwise | [`CodbiBlindPassPolicy.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiBlindPassPolicy.kt) |
| Patch identity | A diff item without `name`/`id` is no longer dropped silently: identity is recovered from `properties.id`, the case is warned about, and pass-1 is re-run ONCE with an explicit repair instruction | [`FormItemIdentity.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/FormItemIdentity.kt), repair round in [`AICodBiAssistant.kt:3415`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3415) |
| Build-scope marking | New tags `field_creation` / `removal` gate the construction rules a plain edit does not need (−12.2 k chars measured on the structure core) | [`PromptSectionGate.kt:44`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptSectionGate.kt:44), markers in [`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md) + [`codbi-general.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.decision.md), helper [`scripts/add-section-markers.mjs`](../scripts/add-section-markers.mjs) |
| Build-scope carve-out | The two build-scope tags are EXCLUDED from "when UNSURE, INCLUDE it" in both envelopes — a needless `field_creation` keeps ~12 k chars | [`codbi-chat-system-prompt.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md:12), [`codbi-retry-chat.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-retry-chat.md:1) |
| Verb-only detectors | `field_creation` matches a creation VERB, never the bare noun ("Feld"/"field") — the noun fired on a plain label edit and defeated the saving | [`PromptSectionGate.kt:283`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptSectionGate.kt:283) |
| `DETECTOR_REQUIRED_TAGS` | `svg` and `custom_js` are honoured only when the deterministic detector ALSO matched — an AI-only "unsure" inclusion used to keep the ~15–20 k illustration half of the XSpan template | [`PromptSectionGate.kt:295`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptSectionGate.kt:295) |
| svg force-include removed | `runFormModification` used to do `sectionKeepTags = gatedKeepTags + setOf("designed_text", "svg")`, so ANY design/interactive/animated request (matching the BROADER `DesignedTextDetector.wantsDesignedTextOrIllustration`) pulled the large `svg` illustration half back in even when the request never asked for a drawing. NOW it force-includes **only** `designed_text`; `svg` stays gated by its deterministic detector / AI (held to it by `DETECTOR_REQUIRED_TAGS`). Regression test: `WidgetSectionGatingTest` "a designed animated text WITHOUT an illustration …" | [`AICodBiAssistant.kt:3236`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3236), [`WidgetSectionGatingTest.kt`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/WidgetSectionGatingTest.kt) |
| Widget-template name-index fallback | When pass-2's `widgetIds` is empty the FULL `formcycle.widgets` reference (36,056 chars ≈ 12 k tokens) is no longer shipped; `buildWidgetDetailsSection` now returns a condensed **FORMCYCLE WIDGET NAME INDEX** (all allowed widget classNames verbatim + a `need_codbi_details` demand-load instruction) via [`FormcycleElementFilter.renderWidgetNameIndex`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/FormcycleElementFilter.kt). Names come from the real `## <Name>` headings, de-duplicated and filtered with `isWidgetAllowed` so a forbidden widget is never advertised (fail-open on the keep set is preserved). Regression tests: `WidgetSectionGatingTest` "the name-index fallback is a small fraction …", "…lists every widget name…", "…carries no per-widget build prose", "…omits a widget forbidden…", "…never leaks a forbidden widget…" | [`AICodBiAssistant.kt:21370`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:21370), [`FormcycleElementFilter.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/FormcycleElementFilter.kt), [`WidgetSectionGatingTest.kt`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/WidgetSectionGatingTest.kt) |
| Bürger-Services naming trimmed | The naming block (was 11,801 chars / 11,384 chars body ≈ 2.8–3.8 k tokens) is condensed to ~7,993 chars (~32 % smaller, ~3.4 k chars saved **per pass**, paid on BOTH pass-1 and pass-2 whenever `useBuergerserviceNaming=true`). All four canonical-ID tables (Person / Organisation / ELSTER system fields / further common fields), the `fsBK*` fieldsets, the exact-name + one-per-name hard rules, the NO-`data-cb-func`/no-LDAP autofill rules and the mandatory `selOrgPersTyp`/`BPK2`/`TrustLevel` fields are preserved **verbatim**; the verbose "FILL & VERIFICATION SEMANTICS" / "AUTH METHOD → FIELD REQUIREMENTS" prose and worked examples were dropped BUT their operative imperative (create input fields inside the fieldset, include the login method's mandatory fields; `verifiziert`→autofill) was restored in condensed form after the first cut caused the "input fields are not generated anymore" regression (2026-09-28). Prompt-only rewrite (invariant #2 — no `.md`→`.kt` text move), so both injections auto-shrink with no Kotlin change. Regression tests: `BuergerserviceNamingPromptTest` (7 cases: all four groups' canonical ids, fieldset + exact-name + noRibbon, mandatory auth fields, **field-creation imperative** (added 2026-09-28), antisocial autofill rules, verbose prose absent, size cap) | [`codbi-buergerservice-naming.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-buergerservice-naming.md), [`BuergerserviceNamingPromptTest.kt`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/BuergerserviceNamingPromptTest.kt) |

**Measured baseline — same build prompt, two consecutive runs (change-log `trips`):**

| Trip | run 636 | run 643 |
|---|---:|---:|
| `chat-classify` in | 2,265 | 2,387 |
| `form-pass-1` in | 19,461 | 19,371 |
| `form-pass-2` in | 24,509 | 24,384 |
| **Σ in / out** | **46,235 / 2,255** | **46,142 / 2,655** |
| cost | €0.0178735 | €0.0181410 |

Conclusions to carry forward: **pass-2 is 53 % of a build run**; the two runs differ only by ~200
tokens of new prompt text plus model variance in the output; the build-scope marking cannot help a
*build* request (it correctly keeps the rules it needs) — its saving is a *small-edit* effect. Also
note `cachedIn` 4,096 / 6,400 in run 643: the provider's prefix cache is active but **billed at the
full rate** on this provider, so it is a latency feature, not a cost one.

**Open levers, in the order to attempt them:**

| # | Lever | Expected | Verify with | State |
|---|---|---|---|---|
| 1 | **Split the multi-tag block** — [`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md) line 43 was tagged `designed_text,svg`, so a CSS-only design request kept the illustration rules through the `designed_text` half. **Implemented 2026-09-28**: split into a separate `designed_text` block and an `svg` block; the `designed_text,svg,custom_js` PARTIAL-HTML-EDITS block stays multi-tag (it genuinely applies to all three). Guarded by a new `PromptSectionGateTest` case. **Follow-up**: the assistant's keep-set construction force-included BOTH `designed_text` **and** `svg` on any design/interactive/animated request, which re-kept the illustration half even without a drawing request — that force-include now adds only `designed_text` (see "Implemented and verified" above). | several k tokens on CSS-only design requests | `Pass-2 … illustration checklist included:` must flip to `false` on a CSS-only request; `widgetTemplates=<n>` drops | done — next is lever 2 |
| 2 | **Condense the pass-1 user-turn prose** -- **applied then REVERTED twice (2026-10-02/03)**: the clarificationInstruction pass-1 user-turn block was condensed (~5.4 k -> ~1.7 k chars, every imperative kept, mechanism B), but each measurement showed the usage rise, so the change is removed and the block is back verbatim. NOTE: the edit strictly REDUCES prompt bytes (~ -3.5 k chars, nothing added), so the rise is almost certainly a restart/re-seed artefact rather than this edit. | B | 0 (reverted) | -- | code reverted; pass-1 user turn unchanged | **reverted (2026-10-02/03)** |
| 3 | **Gate the always-on clarify injected blocks** -- **applied then REVERTED (2026-10-03)**: `ClarifyInjectionGate` gated completionPages/formVariables/workflowMails/availableDatasources (fail-open), but the measurement showed usage rose, so it was removed (new files deleted, AICodBiAssistant.kt reverted to HEAD). | D | 0 (reverted) | -- | code reverted | **reverted (2026-10-03)** |
| 4 | **Trim the fixed `sections` vocabulary line** -- **applied then REVERTED (2026-10-03)**: the `sections` line was trimmed 1,853 -> 1,588 chars, but the measurement showed usage rose, so codbi-chat-system-prompt.md is back at HEAD (guard test deleted). | A | 0 (reverted) | -- | code reverted | **reverted (2026-10-03)** |
| 5 | **Skip/merge phase-1 classify-intent on chat turns** | **Not applicable / already satisfied (2026-10-03)** -- verified in the frontend: chat turns already bypass phase-1 (`runChatTurn()` in ai-assistant.ts:3483 calls `runPhase2(..., "both", ..., {chatMode:true})` directly, with NO phase-1 request). Phase-1 `classifyIntent` (AICodBiAssistant.kt:2881) runs only on the build ("Run") path, and its returned `intent` is LOAD-BEARING: it decides WHICH context the frontend collects and sends (form persist vs workflow) at ai-assistant.ts:3894 and :3952. Removing it there would force sending BOTH contexts on every build (approx the full form + workflow) -- a net input-token INCREASE, not a saving. | E | 0 (nothing to remove) | -- | chat turns already have no phase-1 trip | **n/a (already satisfied) (2026-10-03)** |
| 6 | One conversation for pass-1 + pass-2 | only with a **prefix-cache-discounting** provider; a stateless API re-sends the core, and this provider bills hits at full rate | `cachedIn` vs `cost` | **NOT TO APPLY** (closed 2026-10-02): the current provider bills cache/prefix hits at the FULL input rate (measured `cachedIn` 4,096/6,400 in run 643 — a latency feature, not a cost one), so merging saves ~nothing; it also entangles the deliberate decision/apply split and enlarges pass-2's window. The `AI_Assistant_PromptCaching` mode already captures any prefix-cache saving that a discounting provider would offer; if one is later adopted, re-evaluate only when cached tokens are near-free AND the merged pass-2 stays lean — not by default |

**Instruments — the exact log lines to read (all already emitted):**

- `[PromptSectionGate] section gating: A -> B chars (N block(s) dropped, ~X chars; keep=[…])` — the
  `keep=` list is the single best diagnostic: a tag there that the request does not need is pure cost.
- `Pass-1 system prompt: <n> chars (… sections kept: …, static block: …)`.
- `Pass-2 system prompt composition: … structureRules=…, formcycleGeneral=…, codbiDecisionCore=…, codbiDetails+nameIndex=…, widgetTemplates=…, buergerservice=…, canonical=…`.
- `Pass-2 widget details: requested=[…] sent=[…] (… chars, designed-text rules included: …, illustration checklist included: …)`.
- `form-pass-N re-emission stats: items re-emitted=… (existing=…, new=…)` — `new=1` on a modification
  is the fingerprint of a patch without identity (see [`FormItemIdentity`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/FormItemIdentity.kt)).
- `Clarify-check SKIPPED — …` / `Blind CodBi reconsideration SKIPPED — …` / `Pass-1 diff has N item(s) WITHOUT identity …`.
- The change-log `trips` array (`tokensIn`, `tokensOut`, `cachedIn`, `promptChars`, `completionChars`, `cost`).

**Three mistakes from this session that must not be repeated:**

1. **A cost-bearing tag must not inherit "when UNSURE, INCLUDE it."** That guidance is correct for a
   cheap capability tag and wrong for one that gates a large block — it silently disabled the whole
   build-scope saving. Any new tag must state *which* kind it is.
2. **A detector must match a VERB, not a bare noun.** `feld`/`field`/`row`/`container` matched a
   plain label edit and kept the blocks the AI had correctly omitted. A detector miss is fail-open
   (safe); a false positive is expensive.
3. **A "verbose essay" is not always dead weight — it can carry the operative imperative.** The
   Bürger-Services condensation dropped the "AUTH METHOD → FIELD REQUIREMENTS" prose, which read
   "When the user names a login method … include that method's mandatory fields" and listed the
   always-mandatory + person-identity fields. Removing it made the model create the `fsBKDaten`
   fieldset but leave its `elements` empty — the "input fields are not generated anymore" regression.
   A condensation must first separate a block's **data/tables** from its **imperatives**, keep every
   imperative (even in terse form), and only then cut prose. A regression test must assert the
   imperative survives, not just that the tables and the size cap hold.

**Files touched this session** (for review/diff on the other machine): `PromptSectionGate.kt`,
`ClarifySkipPolicy.kt` (new), `CodbiBlindPassPolicy.kt` (new), `FormItemIdentity.kt` (new),
`AICodBiAssistant.kt`, `codbi-chat-system-prompt.md`, `codbi-retry-chat.md`,
`codbi-canonical-output-rules.md`, `codbi-form-structure-rules.decision.md`,
`codbi-general.decision.md`, `scripts/add-section-markers.mjs` (new), plus the test classes
`PromptSectionGateTest`, `FormItemIdentityTest` (new), `CodbiBlindPassPolicyTest` (new),
`ClarifySkipPolicyTest` (new).

| # | Lever (all mechanism C — demand-loading, nothing removed) | Size | Notes |
|---|---|---:|---|
| 0 | ✅ **Make pass-1 emit `_codbiApplicability` reliably and stop the blind pass-2 branch from firing** — *implemented 2026-09-27* | a whole pass-2 (~23 k) | the branch fired on an omission/recovery, not on a need; the safeguard stays as a fallback |
| 1 | **Replace the blind widget fallback** with the condensed catalog + name index (`buildWidgetsSectionCondensed()` ~3.8 k + `buildNameIndexSection()` ~2 k) and let the model request templates via `need_codbi_details` (bounded by `AI_FormAssistant_MaxFormReruns`) | −15 k to −20 k on that branch | worst case one extra targeted pass; the information stays requestable in the same run |
| 2 | **Condense the pass-1 user-turn prose** -- **applied then REVERTED twice (2026-10-02/03)**: the clarificationInstruction pass-1 user-turn block was condensed (~5.4 k -> ~1.7 k chars, every imperative kept, mechanism B), but each measurement showed the usage rise, so the change is removed and the block is back verbatim. NOTE: the edit strictly REDUCES prompt bytes (~ -3.5 k chars, nothing added), so the rise is almost certainly a restart/re-seed artefact rather than this edit. | B | 0 (reverted) | -- | code reverted; pass-1 user turn unchanged | **reverted (2026-10-02/03)** |
| 3 | **Gate the always-on clarify injected blocks** -- **applied then REVERTED (2026-10-03)**: `ClarifyInjectionGate` gated completionPages/formVariables/workflowMails/availableDatasources (fail-open), but the measurement showed usage rose, so it was removed (new files deleted, AICodBiAssistant.kt reverted to HEAD). | D | 0 (reverted) | -- | code reverted | **reverted (2026-10-03)** |
| 4 | **Trim the fixed `sections` vocabulary line** -- **applied then REVERTED (2026-10-03)**: the `sections` line was trimmed 1,853 -> 1,588 chars, but the measurement showed usage rose, so codbi-chat-system-prompt.md is back at HEAD (guard test deleted). | A | 0 (reverted) | -- | code reverted | **reverted (2026-10-03)** |
| 5 | **Skip/merge phase-1 classify-intent on chat turns** | **Not applicable / already satisfied (2026-10-03)** -- verified in the frontend: chat turns already bypass phase-1 (`runChatTurn()` in ai-assistant.ts:3483 calls `runPhase2(..., "both", ..., {chatMode:true})` directly, with NO phase-1 request). Phase-1 `classifyIntent` (AICodBiAssistant.kt:2881) runs only on the build ("Run") path, and its returned `intent` is LOAD-BEARING: it decides WHICH context the frontend collects and sends (form persist vs workflow) at ai-assistant.ts:3894 and :3952. Removing it there would force sending BOTH contexts on every build (approx the full form + workflow) -- a net input-token INCREASE, not a saving. | E | 0 (nothing to remove) | -- | chat turns already have no phase-1 trip | **n/a (already satisfied) (2026-10-03)** |

**Item 1 implemented (2026-09-27):**

- [`CodbiBlindPassPolicy.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiBlindPassPolicy.kt)
  — [`maySkipBlindPass()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiBlindPassPolicy.kt:60)
  skips the blind reconsideration only when **all** hold: pass-1 produced a usable form, created no new
  widget, emitted no `data-cb-` wiring, and the run's keep set
  ([`gatedKeepTags`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3222),
  the same AI `sections` ∪ detectors set that gates the pass-1 cores) carries no CodBi-capable area.
  Every unknown fails open, so the prose-recovery pass and every genuine CodBi decision are preserved.
- Wired at [`AICodBiAssistant.kt:4107`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:4107)
  as a new first branch (`blindPassRedundant`) ahead of the existing "declared nothing applies" check,
  with a log line naming the sections that were considered.
- Prompt side: a mandatory `_codbiApplicability` rule (§0) was added to
  [`codbi-canonical-output-rules.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-canonical-output-rules.md:7)
  — sent to pass-1 — so the omission itself becomes rarer and the `considered`/`applied` lists stay
  alive, which keeps the cheaper *targeted* rerun path in play.
- Tests: [`CodbiBlindPassPolicyTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiBlindPassPolicyTest.kt)
  (8 tests, green); `ClarifySkipPolicyTest` (10) and `PromptSectionGateTest` (22, incl. the new
  multi-tag `designed_text`/`svg` split case) still green.
- **Prompt re-seed required** for the canonical-output-rules change (same restart mechanism).
- **Expected:** the plain-edit case no longer sends the 72.8 k-char widget reference at all — the
  whole blind pass disappears, which is where most of the remaining ~23 k sits. Verify from the log:
  `Blind CodBi reconsideration SKIPPED — …` on a plain field edit, and
  `Pass-2 system prompt composition: … widgetTemplates=…` staying small.

### Lever 1 — The clarify round is NOT a no-op; skip only its *question* role *(mechanism E, hard precondition)*

**Correction (verified in the code, 2026-09-27):** the earlier wording — "skip the clarify-check
when the classification is unambiguous" — is **wrong as stated**. [`tryClarification()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:22338)
is not just a question round; it is the **only** place in a run that services the AI's two context
requests, and the context it loads is consumed by later passes:

| Clarify-round job | Handled at | Where the result is consumed |
|---|---|---|
| ask the user (`need_clarification`) | loop [`:2096`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2096), parse [`:22406`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:22406) | the user's answers → `clarificationContext` → pass-1, the workflow pass, the mail/endpage i18n passes |
| **`need_form_list`** → load the server's form list, then **re-run** the round | [`:2031`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2031) | `formListContext` → the re-run: the AI picks the form the user named by title and then asks for its history |
| **`need_chat_history`** (current **or another** form via `formKey`) → load the change log, then **re-run** | [`:2051`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2051) | `changeHistoryContext` → **pass-1** ([`:3103`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3103), injected at [`:3253`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3253) / [`:3453`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:3453)), the **workflow** pass ([`:2567`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2567)) and the **mail/endpage** i18n passes ([`:2470`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2470), [`:2494`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2494)) |

Concrete failure of a naive skip: *"do the same as on form 'X'"* or *"apply the same functionalities
as a week ago"* yields `hasInstructions=true` from tier-1 → a naive rule skips the clarify call → the
change log is **never loaded** → pass-1 and the workflow pass build without the history they were
designed to receive. That is a silent feature loss — exactly what §1 forbids.

The round is also the only point where a missing/misspelled **datasource** or an unmatched **form**
becomes a user question. The `availableDatasources` block reaches pass-1 too, but "ask instead of
inventing" is a clarify-phase rule; skipping removes the only chance to obtain that input.

**Safe design — keep the tool rounds, skip only the questions:**

1. Add two first-class fields to the tier-1 chat envelope (in the `.md` prompts, never Kotlin):
   `needsClarification` (must the user be asked?) and `needsToolContext`
   (`"form_list"` / `"chat_history"` — must the round fetch context first?).
2. **The skip is authorised by the AI signal ONLY — it must be language-agnostic.** Skip **only** when
   all three hold: `needsClarification == false` **and** `needsToolContext` is empty **and** both keys
   were actually present in the tier-1 envelope. The classifier judges "does this request refer to
   earlier work / another form / a resource I do not have?" **by MEANING**, exactly like
   `topics`/`sections` today — so it works in ANY language, including ones the keyword lists do not
   cover.
3. **Deterministic layers may only VETO a skip, never authorise one.** A hit forces the round; a miss
   changes nothing. That inversion is what keeps a language-limited keyword list harmless: an
   uncovered language simply contributes no veto, and the AI stays the deciding signal. (This mirrors
   the existing, correct pattern in [`applyClarificationSections()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:21881):
   keyword lists only ADD recall; the AI `topics` decides.) **Never** put "the detector found nothing"
   into the skip condition — that turns a missing language into a silent false negative. The first
   draft of this section had exactly that flaw.
4. **A language-independent veto that needs no vocabulary (DEFERRED):** match the request against the
   **actual form titles and keys** on the server ([`loadFormListContext()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2034)
   already loads them). Any *other* form's title/key in the request would force the round in every
   language, because it matches server data rather than a translated word. It is **not** implemented
   yet: it needs a server round-trip on the SKIP path — the exact cost this lever removes — and the
   case it targets is already covered by the AI's `needsToolContext`, by meaning. Add it only if the
   measured skip rate shows the AI misses those cases.

**Recommended order: shrink FIRST, skip SECOND.**

- **Primary — shrink the clarify prompt** (same call, mechanisms C/D; 100 % language-agnostic,
  behaviour-preserving). The gated clarify prompt is still ~33 k chars; `latestFormElements`,
  `formStructureContext`, the completion pages, the form variables and the workflow-mail summary are
  its bulk and can be condensed exactly like pass-1's catalogs were. This captures a large share of
  the 8.7 k with **zero** behavioural change and no language dependence.
- **Secondary — the skip**, only behind the AI-only authorisation in (2) with veto-only deterministic
  layers (3)+(4).

**Implemented 2026-09-27 (the secondary/skip part):**

- [`ClarifySkipPolicy.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ClarifySkipPolicy.kt)
  — [`ClarifySkipPolicy.skipReason()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ClarifySkipPolicy.kt:36)
  (the AI signal authorises; missing keys fail open; a re-run carrying answers is never skipped) plus
  [`ClarificationReferenceDetector`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ClarifySkipPolicy.kt:74)
  (veto-only, de/en/it/nl/fr/es/pl/tr needles, matched literally).
- [`codbi-chat-system-prompt.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-chat-system-prompt.md)
  and [`codbi-retry-chat.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-retry-chat.md)
  — `needsClarification` + `needsToolContext` are first-class envelope keys, chosen BY MEANING in any
  language; no prompt text is appended from Kotlin.
- [`AICodBiAssistant.kt`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:1996)
  — the loop is guarded with `0 until (if (skip) 0 else 5)` and logs
  `Clarify-check SKIPPED — <reason>`; [`ChatAnswer`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:22444)
  carries both keys as `null`-able (absent = fail open) and
  [`parseChatAnswerRaw()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:22705)
  reads them with an explicit PRESENCE check.
- Tests: [`ClarifySkipPolicyTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ClarifySkipPolicyTest.kt)
  (10 tests, green); `PromptSectionGateTest` (17), `ApplyLogEntryTest` (24) and
  `ApplyLogEntryWorkflowTest` (8) still green; `mvnw.cmd -DskipTests compile` passes.
- **Prompt re-seed required:** the two `.md` files are seeded into the DB, and the seed version is a
  fresh timestamp per startup — a plugin restart installs the new envelope. Until then the keys are
  absent and the round runs exactly as before.
- **Still to validate on the reference corpus:** (a) a plain field edit — expect the
  `Clarify-check SKIPPED …` log line and no `clarify-check#1` trip; (b) "do the same as on form X" —
  expect the round to RUN (keyword veto and/or the AI signal); (c) a request in a language the
  detector does not cover — expect the AI signal alone to decide correctly.

- **Expected:** ~8.8 k in (≈ 15 % of a run) for the full skip; a large share of it from the shrink
  variant alone, at much lower risk.
- **Risk:** the skip is medium-high and **must be validated in a non-covered language** (e.g. a
  Spanish or Polish request that references another form) plus a "references another form / earlier
  work" prompt. The shrink variant is low risk.

### Lever 2 — Pass-2 is the largest single input; trim only what that pass cannot act on *(mechanism C)*

pass-2 is 48 % of the run (~28.7 k in ≈ 93.5 k chars of system prompt). Sub-items, best value first:

1. **Widget-template fallback.** When pass-1 requests **no** widget id, pass-2 used to send the WHOLE
   `formcycle.widgets` reference (36,056 chars ≈ 12 k tokens) at
   [`buildWidgetDetailsSection()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:21370)
   (`if (widgetIds.isEmpty())`). **Done**: the empty-`widgetIds` branch is gated with the run's
   `sectionKeepTags` (fail-open) **and** now returns a condensed FORMCYCLE WIDGET NAME INDEX
   ([`FormcycleElementFilter.renderWidgetNameIndex`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/FormcycleElementFilter.kt))
   listing the allowed widget classNames verbatim with a `need_codbi_details` demand-load instruction,
   instead of the full per-widget build prose (~36 KB).
   - **Expected/measured:** up to ~12 k in on the blind branch (name index is a small fraction of the
     full reference; guarded by tests).
2. **Bürger-Services naming block** (was 11,384 chars ≈ 3.8 k). **Done**: condensed to the canonical
   ID list + the ELSTER fields instead of the prose/worked examples (11,801 → 7,291 chars, ~38 %,
   paid on both passes) via a prompt-only `.md` rewrite — all canonical-ID tables and hard rules kept,
   verbose prose removed (2026-09-28). **Regression + fix (2026-09-28):** the first cut also dropped
   the "AUTH METHOD → FIELD REQUIREMENTS" imperative, so the model left `fsBKDaten.elements` empty
   ("input fields are not generated anymore"); a condensed field-creation imperative was restored,
   then **STRENGTHENED** so the imperative applies to ANY container the AI creates (not only the
   literal `fsBK*` — the failing run produced a generic `fdPersonData` XContainer with empty
   `elements`). File now ~8,246 chars; the 8,000 size cap was raised to 8,500 to admit this legitimate
   generalization (still ~3.5 k under the 11,801 original). Regression tests: `BuergerserviceNamingPromptTest`
   (9 cases, incl. the `any created container must be populated…` guard, green).
   - **CRITICAL — stale DB seed:** the user's failing run was served `buergerservice=7617` (an old DB
     copy that predates even the first fix), NOT the current ~8,246-char source — the fix never reached
     the model. The `.md` change is INERT until the prompts are re-seeded (plugin restart / version bump
     or `-Dcodbi.prompt.reseed=true`). See "Prompt re-seed" below.
   - **Expected/measured:** ~2–3 k in. Low risk. Verified by the reduced `buergerservice=` log component.
3. **De-duplicate `formcycle-general-apply` against `codbi-form-structure-rules.decision`.** Conditional
   properties, repeatable containers, panels and placement are stated in both. Each rule moves to ONE
   place (mechanism B — still present in the pass that needs it).
   - **Expected:** ~4.5 k in. Low-medium risk.
4. **NAME-ONLY catalogs in pass-1.** Names are enough to *request* details; the "first sentence" is
   the next size after the decision cores.
   - **Expected:** ~2–3 k in. Medium (the first sentence helps *choose* the right element) — measure
     before changing.
   - **DONE (2026-09-30):** [`buildSectionCondensed`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiCapabilities.kt)
     / [`buildWidgetsSectionCondensed`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiCapabilities.kt)
     now use the NAME-ONLY `condenseEntryNames`: every heading + the section PREAMBLE kept verbatim
     (the decision-critical GENERAL RULES, e.g. the widget "LABELS — never use generic placeholders"
     rule), per-entry prose DROPPED entirely. Pass-1 only DECIDES + requests details; names are enough
     to build the `need_codbi_details` request. The FULL catalogs remain in use elsewhere (pass-2,
     other paths). Regression: `CodbiCapabilitiesPass1NameOnlyTest` (5 cases — headings kept, prose
     dropped, preamble/LABELS preserved, clarification-only widget paragraphs still stripped, name-only
     catalogs are a fraction of the full ones), plus existing `CodbiCapabilitiesNameIndexTest` (4) and
     `WidgetSectionGatingTest` (13) — all green.

### Lever 3 — Merge `classify-intent` into `chat-classify` *(mechanism E)*

- Both calls run on the same request with overlapping context; one combined envelope removes a whole
  call. ~2.2 k in (≈ 4 %).
- **Why nothing is lost:** the two outputs are merged, not dropped; the resulting single envelope
  carries every field both consumers read.
- **Risk:** low-medium (format drift → strict retry; keep `sections`/`topics` first-class in the `.md`
  prompt, never appended from Kotlin).

**Measurement gap closed (2026-09-29):** `classify-intent` is **not** skipped and **not** a silent
loss — it runs as a **separate phase-1 HTTP request** (frontend [`ai-assistant.ts`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/ai-assistant/ai-assistant.ts:3781)
calls the backend `phase=1` handler, which runs `classifyIntent` and returns `need_data` + `intent`,
then calls `runPhase2` with that `intent`). The run-636/643 `trips` arrays are the **phase-2 build
request** only, so `classify-intent`'s absence there is expected, not a skip.

**Phase-1 CANNOT be eliminated:** the phase-2 request payload structurally depends on the phase-1
`intent` — [`runPhase2`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/ai-assistant/ai-assistant.ts:3853)
uses `intent` to decide WHICH context to collect and send (form intent sends
`persist`/`formElements`/`currentStandards`/`aiSetStandards`; workflow/both sends
`workflowVersionId`/`formElements`/`persist`). Removing phase-1 would need a risky frontend
re-architecture that would defeat the per-intent context optimisation.

**The real duplicate removed — the chatMode reclassify (implemented 2026-09-29):** the frontend
always sends `intent:"both"` for chat turns, and the backend previously re-ran a full
`classifyIntent` inference (`handleRun` chatMode block) just to narrow it. Since `produceChatAnswer`
("chat-classify") `intent` already runs on every phase-2, that duplicate ~2.1 k inference is now gone:

- `codbi-chat-system-prompt.md` — `intent` added to the envelope
  (`"intent": "form"|"workflow"|"both"|"none"`, `"none"` when `hasInstructions` is false) and to the
  always-include CRITICAL keys.
- [`ChatAnswer`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:22611)
  — new `val intent: String? = null`.
- [`parseChatAnswerRaw`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:22893)
  — parses `intent`, validated to `form`/`workflow`/`both`/`none`, else `null` (fail open).
- [`handleRun`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:1882)
  — the chatMode reclassify now reads `chatAnswerResult?.intent` (with
  `upgradeWorkflowIntentToBothIfAddingFormElement` preserved). When `intent` is missing (older
  installed prompt, strict retry, classification failure) it **fails open** and keeps the frontend
  intent (for chat turns that is `"both"`, matching the old catch-fallback).
- **Prompt re-seed required** for the `codbi-chat-system-prompt.md` change (same restart mechanism).
- Tests: full `mvn test` green (exit 0).
- **To verify at runtime:** in the change log a chat turn that commands an edit should no longer show a
  `classify-intent` trip inside the phase-2 row; the intent comes from `chat-classify`.

### Lever 4 — Multi-language translation in ONE pass *(mechanism C/E)*

- `runSequentialWholeFormTranslation` currently costs **one full-form inference per language**, i.e.
  N−1 extra inferences for "translate into N languages".
- **Design target:** one pass that emits every target language's `properties.i18n` in a single diff.
- **Risk:** unexplored; matters a lot for multi-language requests. Validate against the whole-form
  translation plans ([`plans/form-translation-workflow-multilingual-endpages.md`](form-translation-workflow-multilingual-endpages.md)).

### Lever 5 — Workflow prompt split *(mechanism C)*

- The workflow branch (`workflow-pass-1/2/2-retry`, mail/endpage i18n) has **never** had the
  decision-core / full-reference split the form path got. Same inventory + consolidation method
  applies; likely large for workflow runs.
- **Why nothing is lost:** identical method (B/C/D) already proven on the form path.

### Lever 6 — Output-side leftovers *(mechanism A/G)* — DONE (2026-10-01)

`_codbiApplicability` (~200–400 output tokens/run) derived from the diff instead of generated — the
server already knows which items changed.

**HYBRID design (resolved 2026-10-01):**
- **Drop footprint-bearing applied from model output.** The model no longer lists bulky
  `{"id", "targets"}` entries for footprint-bearing CodBi functions (HTML.Panel, Sys.Log.Console,
  Time.Frame, HTML.Input.REGEX, …) that leave a `data-cb-func` trace in the form JSON.
- **Keep footprint-less `Holistic.*` standards in the model's `applied`** — Holistic.CSS.Standard,
  Holistic.Matomo.Tracking, Holistic.Media.Input.Speech(.Whisper) leave no form trace, so they must
  still be reported explicitly with empty `targets`.
- **Server derives the rest from the diff.** Compare `data-cb-func` values indexed by element
  `properties.name` between original (`persistJson`) and final form (`peopleForm`); functions added
  to elements that didn't carry them before are re-emitted into `applied`.

**Implementation:**
- [`deriveAppliedFunctionsFromDiff(originalJson, modifiedJson)`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:5257)
  — indexes `data-cb-func` per element name before/after, emits `{"id", "targets": [names]}` for the added ones.
- [`indexDataCbFuncByElementName`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:5293)
  — now uses the new [`splitFuncIds`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:5340)
  helper to split **comma-separated** multi-function `data-cb-func` values (previously the whole
  comma string was treated as one unknown id — a latent bug caught by the new tests).
- [`mergeDerivedAppliedIntoReport(reportJson, derivedApplied)`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:5354)
  — keeps only `Holistic.*` from the model's `applied`, appends the derived entries, preserves
  `considered` / `codbiVerdict` / element counts; synthesizes the report if it was omitted.
- Called in [`runFormModification`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:4933)
  at lines 4933-4934 immediately after extraction.

**Prompt edits:** footprint-bearing panel + Sys.Log.Console sections moved from `applied` to
`considered` across [`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md:107),
[`codbi-general-rethink.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general-rethink.md:95),
[`codbi-general.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-general.md:442);
`codbi-canonical-output-rules.md` / `codbi-general.decision.md` / `codbi-standard-configurations.md`
were already consistent with the Hybrid rule.

**Regression:** new [`DeriveAppliedFunctionsTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/DeriveAppliedFunctionsTest.kt)
— 11 cases covering derivation (new/existing elements, unchanged, object-map vs. array attribute
shapes, blank input), the comma-split, and merge (replaces footprint-bearing, keeps Holistic,
synthesizes report, preserves considered/verdict). Full suite green (exit 0).

- The forced-final and retry passes re-emit what the previous attempt already produced; measure the
  `re-emission stats` log line before changing anything.
- **Risk:** small per run; the reported `applied` set is now derived from the form diff, so a
  function the server cannot see as a diff (e.g. a pure server config like Holistic.Matomo without a
  `Matomo_SiteID`) must stay footprint-less and be reported by the model explicitly.

### Lever 7 — DB/memory hygiene (no token effect, but it is real waste) — DONE (2026-09-30)

- `PromptLoader.loadCategory(em, "formcycle")` materialises the **whole** category — including the
  109 KB `formcycle.workflow_nodes` CLOB — into a map on every form request
  ([`buildCodbiFormSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20862),
  [`loadCodbiApplyPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:21100)).
- **Implemented (2026-09-30):** replaced the whole-category load with targeted single-key loads in
  every form-assistant path:
  - `buildCodbiFormSystemPrompt` → `loadPrompt(em, "formcycle.general_decision")` (was the whole map).
  - `loadCodbiApplyPrompt` → `loadPrompt(em, "formcycle.general_apply") ?: loadPrompt(em, "formcycle.general_decision")`.
  - `buildWidgetNameIndex` → `loadPrompt(em, "formcycle.widgets")`.
  - `loadCodbiRethinkPrompt` → `loadPrompt(em, "formcycle.widgets")`.
- This makes the "workflow nodes are not in the form path" invariant explicit rather than accidental.
- **Guard:** new `WorkflowNodesGuardTest` (4 cases) asserts the three form keys
  (`formcycle-general.decision` / `formcycle-general-apply` / `formcycle-widgets`) never carry the
  workflow-only output markers (`triggerParams` / `endpointType` / `chainedNodes` / `FC_DOI_INIT` /
  the `Formcycle Workflow Nodes` heading), the workflow-nodes reference stays a separate live file,
  and each form key stays lean (≪ the 109 KB CLOB).
- **Deferred (out of form scope):** `buildWorkflowSystemPrompt` still loads the whole category
  (`formcycle.general_workflow` / `formcycle.general` only) — same CLOB waste on the workflow path,
  but changing it is a workflow-behaviour edit outside Lever 7. Candidate for a later follow-up.

---

## 4. Invariants that must stay true while cutting tokens

1. **Fail-open gating.** A `<!--SECTION:tag-->` block is dropped only when tag ∉ (AI `sections` ∪
   detectors ∪ keywordMatches). A tag matched by neither signal is **kept**. This is the single most
   important guarantee against silent rule loss.
2. **No prompt text in `.kt`.** `sections`, `topics`, `needsClarification` and every other envelope
   key are defined in the `.md` prompts. Kotlin-appended prompt text is what caused the earlier
   "output regression after the `topics` change" (contradiction → format drift → strict retry →
   double output).
3. **Demand-loading has a request path.** Anything withheld from pass-1 must be reachable via
   `need_codbi_details` in the same run. If it is not requestable, it must not be withheld.
4. **Omission = unchanged.** Property patches rely on `restoreStrippedFields()` restoring every
   omitted property; removals must use `_removeProps`, never omission.
5. **Prompt re-seed.** Marker-based gating is inert until the DB rows carry the markers. The seed
   version is a fresh timestamp per startup, so a restart re-seeds; the widget split additionally
   requires the `formcycle.widgets(.xspan)` rows to be refreshed — verify with the prompt-tester
   before claiming a saving.
6. **Measure from the log, not from intuition.** `Pass-1 system prompt: … chars`,
   `Pass-2 system prompt composition: …`, `re-emission stats` and the change-log `trips`
   (`tokensIn`/`tokensOut`/`cachedIn`/`cost`) are the only accepted evidence for a saving.

---

## 5. Measurement protocol (run before and after each lever)

1. Run three representative prompts — plain field edit, Bürger-Services request, illustration/XSpan
   request (corpus: [`plans/form-assistant-test-prompts.md`](form-assistant-test-prompts.md),
   [`plans/form-assistant-whole-form-test-prompts.md`](form-assistant-whole-form-test-prompts.md)).
2. Record per-trip `tokensIn` / `tokensOut` / `cachedIn` / `cost` from the change log, plus the
   `Pass-1/Pass-2 system prompt` composition lines and the `re-emission stats`.
3. Read which pass-2 branch fired (targeted details vs. blind vs. full widget fallback) before
   choosing between lever 2.1 and lever 2.2.
4. A lever is accepted only if it is **–X tokens with no new defect** in the corpus. Any defect that
   is silent (a wrong condition code, a hidden instead of read-only field, a missing `dynamic:"1"`)
   rejects the lever outright.

---

## 6. Implementation checklist

- [x] **Lever 1 (E, corrected):** the clarify round is the **only** consumer of `need_form_list` /
      `need_chat_history`, and its `changeHistoryContext` reaches pass-1, the workflow pass and the
      mail/endpage i18n passes (the skip part implemented 2026-09-27). The multi-tag `designed_text,svg`
      split of the structure core (the "immediate next step") was implemented 2026-09-28.
      `need_chat_history`, and its `changeHistoryContext` reaches pass-1, the workflow pass and the
      mail/endpage i18n passes.
      - [x] **Primary (language-agnostic, low risk):** shrink the clarify prompt — condense
            `latestFormElements` / `formStructureContext` / the completion pages / the form variables
            / the workflow-mail summary. No behaviour change.
            - **FORM ELEMENTS condensation — DONE (2026-10-01):** the clarify round is the only
              consumer that gets a condensed `formElements` (`condenseFormElementsForClarify` in
              `AICodBiAssistant.kt` around `extractFormElementsFromJson`, wired at the clarify
              call site only — chat & pass-1 keep the full block, mirroring the already-condensed
              `clarifyFormStructureContext`). Dropped per element: `required`, `placeholder`,
              `actionPage` (build/validate config the clarify round never reads — it only resolves
              references and asks). Kept: `technicalId`, `type`, `displayText` and — critically —
              the XSelect `options` ({text,value}) so option-value mapping ("which value maps to
              'Ja'") still resolves and is never re-asked. Fail-open: non-JSON-array or blank input
              passes through untouched. Regression test
              [`ClarifyFormElementsCondenseTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ClarifyFormElementsCondenseTest.kt))
              — names/labels/types/options survive, config flags dropped, strictly smaller, fail-open.
              Full `mvnw -q -o test` green. (2026-10-01) **WORKFLOW decision-core split — DONE:**
              the workflow/both clarify round now receives its own condensed core via
              `buildWorkflowStructureContext(wid, ctx, condensed = true)` (wired at the clarify load
              site in `handleRun`, gated to `intent == "workflow" || "both"`, fail-open null/blank ⇒
              nothing). It serializes task `name` + trigger `type` and each existing node's `name` +
              `type` in its parent/child tree, dropping `id`/`description`/`customParameters` — the
              heavy parameters the clarify round never reads (it only RESOLVES references, e.g.
              "add an approval step after the 'Freigabe' node"). The core reaches the final prompt
              as the `workflowStructureBlock` ("CURRENT WORKFLOW STRUCTURE … target that EXACT node;
              do NOT ask which node it means"), mirrored after the condensed form-structure core and
              logged via `workflowStructBlockLen=` in the `clarification prompt assembly:` line.
              Regression test
              [`ClarifyWorkflowStructureCoreTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ClarifyWorkflowStructureCoreTest.kt))
              — non-blank workflow structure injects the block with the EXACT-node imperative and
              its node/task names reach the final prompt; null/blank injects nothing (fail-open).
              Targeted `mvnw -q -o test -Dtest=ClarifyWorkflowStructureCoreTest,…` green.
              **COMPLETION PAGES / WORKFLOW-MAIL condensation — DONE (2026-10-02):** the remaining
              clarify sub-blocks are now shrunk too.
              - **completion pages** — new `condenseCompletionPagesForClarify` (in
                `AICodBiAssistant.kt` next to `condenseFormElementsForClarify`, wired at the clarify
                load site in `handleRun` for `intent == "workflow" || "both"`): `fetchCompletionPages`
                returns a rich `[{"name":…,"uuid":…},…]` array, but the clarify round only offers these
                as multiple-choice options BY NAME ("PICK ONE BY NAME") and never persists a page, so
                the per-page `uuid` is dead weight and is dropped — the digest becomes a comma-separated
                name list. Fail-open: non-array/blank input passes through unchanged.
              - **workflow-mail summary** — `fetchWorkflowMailNodesSummary` now emits only
                `{name, subject, sender, recipient}` (drops `id`/`type`); the clarify block only needs
                the `name` to identify which mail plus the recipient/sender/subject values being REUSED.
              - **form variables** — already emitted a lean comma-separated name list; no change.
              Regression test
              [`ClarifyCompletionPagesCondenseTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ClarifyCompletionPagesCondenseTest.kt))
              — name-list condensation drops the uuid and is strictly smaller, fail-open on
              malformed/blank/null; the condensed name list, lean workflow-mail block and form-variable
              block all assemble their blocks with the needed values reaching the final prompt.
              Targeted `mvnw -q -o test -Dtest=ClarifyCompletionPagesCondenseTest,…` + broad
              regression green.
      - [x] **Secondary (implemented 2026-09-27):** the tier-1 envelope carries
            `needsClarification` + `needsToolContext`, and `tryClarification` is skipped **only** on
            `needsClarification == false && needsToolContext empty && both keys present` (the AI
            signal authorises; **the skip never depends on a keyword detector's absence**). The
            deterministic detector only **vetoes** (forces the round). Remaining: the corpus
            validation (a/b/c above) and the optional server-title veto — deferred, see item (4).
- [x] **Lever 2.1 (C):** gate `buildWidgetDetailsSection`'s empty-`widgetIds` fallback with
      `sectionKeepTags` (fail-open) **and** replace the full `formcycle.widgets` reference with a
      condensed widget NAME INDEX (`need_codbi_details` demand-load). Implemented + regression tests
      (2026-09-28).
- [x] **Lever 2.2 (B):** trim the Bürger-Services naming block to canonical names + ELSTER fields.
      Implemented 2026-09-28 — prompt-only `.md` shrink, canonical-ID tables + ELSTER fields + hard
      rules kept verbatim, verbose prose dropped. **REGRESSION + FIX 2026-09-28**: removing the
      "AUTH METHOD → FIELD REQUIREMENTS" essay also removed the "include that method's mandatory
      fields" imperative → the model created the `fsBKDaten` fieldset but left it empty ("input
      fields are not generated anymore"). Fix: restored a condensed field-creation imperative (3
      bullets: never leave a fieldset empty + the always-mandatory auth fields + the person-identity
      field list) and added the `the field-creation imperative is preserved…` regression case.
      **STRENGTHENED 2026-09-28**: the imperative now covers ANY container/fieldset the AI creates
      (not just `fsBK*`) — the failing run created a generic `fdPersonData` XContainer with empty
      `elements`. New `any created container must be populated…` guard; file at ~8,246 chars, size
      cap raised 8,000 → 8,500 (still ~3.5 k under the 11,801 original). Now 9 cases, all green.
      **CRITICAL — stale DB seed:** the failing run was served `buergerservice=7617` (an old DB copy
      predating even the first fix), so the fix never reached the model. Re-seed required — a plugin
      restart/redeploy with a bumped version (or `-Dcodbi.prompt.reseed=true`) installs the current
      source before the saving is measurable.
- [x] **Lever 2.3 (B):** de-duplicate `formcycle-general-apply` vs.
      `codbi-form-structure-rules.decision` (one authoritative home per rule). Verified —
      `FormcycleGeneralApplyDedupTest` 6/6.
- [x] **Lever 2.4 (C):** NAME-ONLY pass-1 catalogs — every heading + preamble kept verbatim, per-entry
      prose dropped (`buildSectionCondensed` / `buildWidgetsSectionCondensed` →
      `condenseEntryNames`). Regression `CodbiCapabilitiesPass1NameOnlyTest` 5/5 (self-contained,
      no corpus required). See the Lever 2 §2.4 note.
- [x] **Lever 3 (E):** merge `classify-intent` into `chat-classify` — the chatMode reclassify duplicate
  is folded into `chat-classify` (phase-1 classify kept; see Lever 3 section).
- [x] **Lever 4 (C/E):** single-pass multi-language translation — **implemented 2026-10-01** as the
  translation-delta protocol with **adaptive batch-or-split output budgeting** (see §6B): per-language
  bounded deltas spliced into the untouched original, batched greedily so each completion's cumulative
  output estimate stays ≤ `TRANSLATION_BATCH_OUTPUT_BUDGET` (800); any truncated/unparsable batch's
  missing languages are re-issued solo (fail-open — no language lost). Regression:
  `TranslationDeltaProtocolTest` 7 new batching tests + full suite green.
- [x] **Lever 5 (C):** workflow prompt decision-core split — incl. the `formcycle-general-workflow`
      de-dup; `WorkflowGeneralDedupTest` + `FormcycleGeneralApplyDedupTest` 6/6 each.
- [x] **Lever 6 (A/G):** derive `_codbiApplicability` from the diff — **implemented 2026-10-01** as the
      HYBRID design (drop footprint-bearing `applied` from the model, keep footprint-less
      `Holistic.*`, derive the rest from the form diff; see Lever 6 section). Implementation +
      comma-split `splitFuncIds` fix + prompt edits + `DeriveAppliedFunctionsTest` 11/11; full suite green.
- [x] **Lever 7:** targeted `formcycle` key loads + regression test (WorkflowNodesGuardTest) that
      `formcycle.workflow_nodes` never enters a form-assistant prompt.
- [x] **Lever 6 (open-levers row 6) — decision: NOT TO APPLY (closed 2026-10-02).** One-conversation for
      pass-1 + pass-2 was assessed against the measured billing: the provider bills prefix-cache hits at
      the full input rate, so merging saves no cost and instead entangles the decision/apply split and
      grows the effective pass-2 context. The existing `AI_Assistant_PromptCaching` mode already realises
      any prefix-cache saving a discounting provider could offer; re-open only if a provider charges
      near-free cached tokens AND the merged pass-2 is kept lean (not by default).
- [ ] Re-measure per §5 after each landed lever and update the two existing plans' status tables.

---

## 6B. Translation-workflow optimisation — Lever 4 (implemented)

Status: **IMPLEMENTED** (2026-10-01) — the translation-delta protocol with adaptive batch-or-split
output budgeting, superseding the original single-pass Lever 4 (which the user rejected because a
one-completion multi-language output on a big form is too large and truncates). Implemented in
`runTranslationDelta` (`AICodBiAssistant.kt:3409`) + helpers `estimateTranslationOutputTokens`
(3546), `groupTranslationBatches` (3570), `parseBatchDelta` (3604); multi-language output contract in
[`codbi-translation-delta-instruction.md`](../src/main/resources/.../prompts/codbi-translation-delta-instruction.md).
Requires a prompt re-seed at runtime to pick up the `.md` addition.

**Context enrichment of the base view (2026-10-01).** `buildTranslationDeltaView` (`AICodBiAssistant.kt:3207`)
now enriches each element entry with READ-ONLY CONTEXT so the model can disambiguate short/ambiguous
labels without re-sending any form structure:
- **(1) `parent`** — the heading path (`page › fieldset › container`) each element lives under
  (`"Name"` under `Fahrzeug` = vehicle, under `Kontakt` = person). Built by a depth-first `walk` over the
  real nested container `elements` arrays.
- **(3) `type`** — the human-readable widget kind (`TextInput`, `Select`, `StaticText`, …) via
  `elementType(className)`, so the model picks the right register (an input label vs. a heading vs. an
  alt text).
- **(4) form-level metadata** — beyond `title`, also `description` and `submit_button_label`
  (`FORM_LEVEL_PROPS`) are emitted under the `form` object.

These context keys are excluded from the output-token estimate (`estimateTranslationOutputTokens` skips
`TRANSLATION_CONTEXT_KEYS = {type, parent}`) so batch sizing stays accurate, and `writeElementDeltaI18n`
guards them out of spliced `i18n` — even a model echoing `type`/`parent` back can never corrupt
`properties.i18n` (invariant: omission = unchanged). The `.md` instruction prompt documents that `type`
and `parent` are CONTEXT ONLY and must NOT be echoed into the output delta. Regression coverage in
`TranslationDeltaProtocolTest` (`contextFormJson` + `nestedItemByName` helpers).

**Rich HTML handling (2026-10-01, real-bug fix).** A rich XSpan `rtevalue` (heading + paragraphs +
inline `<style>`/`<script>` + `.cbBenefitCard` cards) was being translated into a flat, concatenated
string with ALL markup stripped and every fragment jammed together — because `cleanStr`'s
`stripHtml = Regex("<[^>]*>")` + whitespace collapse flattened distinct blocks into one unbroken run
before the model saw them, and the splice then wrote that flat blob back as the whole `rtevalue`.
Fix in `addProp` (`AICodBiAssistant.kt:3262`): if a content value LITERALLY contains an HTML tag
(`Regex("<\\s*[a-zA-Z/]")`), it is emitted in the base view **verbatim** so the model returns COMPLETE
translated HTML; plain strings keep the slim stripped/flattened form. `rtevalue` is sent/returned as
full HTML — matching the established `runFormModification` precedent ("an HTML property you change is
sent COMPLETE, with its unchanged markup") — while `label`/`placeholder`/etc. stay slim. This
sacrifices token savings for the rich-HTML minority to guarantee correct structure; the `.md` gained a
dedicated "Rich HTML" rule (copy every tag/attribute/class/entity/CSS byte-for-byte, translate ONLY the
visible text, never strip markup or collapse blocks). Regression coverage in `TranslationDeltaProtocolTest`
(`richHtmlFormJson` + 3 rich-HTML tests: verbatim retain, plain still stripped, splice-back intact).
Requires a prompt re-seed at runtime to pick up the `.md` addition.

### Why both the current flow AND the original Lever 4 are wasteful

`runSequentialWholeFormTranslation` (`AICodBiAssistant.kt:3110`) does one full `runFormModification`
pass **per new language**. Each pass:

1. **Input:** re-sends the whole `persistJson` (full form) N times.
2. **Output:** re-emits the **entire modified form JSON** N times, even though a translation only ever
   touches `properties.i18n[<lang>]` (+ form-level `i18n`, per-option / per-button / per-nested-object
   `i18n`). Everything else is byte-identical to the original.

So a "translate into en, fr, it" costs ≈ `N × (full input + full output)`. The original single-pass
Lever 4 cut the *input* waste but made the **output** `N × full form` in ONE completion — which
truncates on big forms (the exact failure the per-language design was built to avoid).

### The core insight

A whole-form translation is **structurally different** from a general form modification. It never
edits structure — it only *adds a language* to the existing per-language `i18n` maps. So the model
should **not** re-emit the form at all; it should emit **only the translated strings**, and the plugin
splices them into the untouched original. The existing `overlayElementI18n` / `overlayNestedI18n` /
`copyLangI18n` merge helpers (already proven in this flow) give us the splice machinery for free.

### Proposed design — form-translation delta protocol

Replace the N× full-form echo with **one slim input + N small bounded deltas**:

1. **Shared input, sent once.** Build a **base-language-only view** of the form: reuse the existing
   pass-1 `NAME-ONLY` catalogs (Lever 2.4: `buildSectionCondensed` / `buildWidgetsSectionCondensed`)
   so the input has the element names + base-language strings but **no** structural noise and **no**
   already-present i18n. This is a single description of *what needs translating*.

2. **Per-language delta completion (bounded output).** For each new language, one small completion
   returns **only that language's delta**, keyed by element/option/button identity, e.g.:

   ```json
   {
     "lang": "en",
     "form": { "title": "Registration" },
     "elements": {
       "tfVorname":        { "label": "First name", "placeholder": "Enter first name" },
       "selAnrede/opt1":   { "value": "Mr" }
     }
   }
   ```

   The instruction is explicit: **never** emit structure, **never** emit base-language text, **never**
   touch any other language — only this keyed map of translations.

3. **Server-side splice.** Walk the ORIGINAL `persistJson`, resolve each key via the existing
   id/name index, and write `properties.i18n["en"][...]` for every field. `overlayElementI18n` already
   does the positional/`id`/`name` matching for nested options/buttons; the same resolver handles the
   delta keys. Structural fields are never replaced — the same guarantee the merge already enforces.

### Resulting token profile (N new languages)

| Variant | Input | Output | Truncation risk |
|---|---|---|---|
| Current sequential | `N × full form` | `N × full form` | none (bounded per pass) |
| Original Lever 4 (one completion) | `1 × full form` | `N × full form` in one | high on big forms |
| **Delta protocol (implemented)** | `1 × slim base view` | `M × strings (≤ budget each)` | none (bounded per batch) |

Output collapses from `N × full form` to per-batch `strings only` — typically **5–20× smaller** — which
both solves the user's big-form truncation concern and removes the N× input re-send.

### Adaptive batch-or-split (per-language output budgeting)

Because the amount to translate is known up front (`buildTranslationDeltaView`), each language's
output is estimated as `chars/4` (`estimateTranslationOutputTokens`) and languages are greedily
grouped into batches so a batch's cumulative estimate ≤ `TRANSLATION_BATCH_OUTPUT_BUDGET = 800`
(≈39 % of the default 2048 `max_tokens` cap). A single language whose estimate alone exceeds the
budget runs solo. Each completion returns the envelope
`{"translations":{"<lang>":{<per-language delta>},...}}` (`parseBatchDelta`) and every returned
language is spliced via `spliceTranslationDelta`. Any missing/truncated/unparsable language in a
batch is re-issued **alone** (fail-open — no language is ever lost), which is the same invariant as
the sequential design's per-pass bound.

### Why it satisfies the invariants (§4)

- **(2) omission = unchanged:** the plugin, not the model, owns structure; only `i18n[<lang>]` is
  written, so any element the model omits is simply untranslated (falls back to base) — never altered.
- **(3) demand-loading:** the slim base view reuses the already-requestable `NAME-ONLY` catalogs; no
  prompt-text storage change.
- **(6) measure, don't intuit:** land behind the existing `planWholeFormTranslation` gate, compare the
  `logReEmissionStats` / usage log line for the same corpus before/after.

### Rollout (keeps risk low)

1. **DONE** — `runTranslationDelta` is the delta-only pass path engaged when the plan produced
   `plannedNewLangs.size >= 1`, replacing the N× full-form echo.
2. **DONE** — because output is now small, per-language steps are batched (M languages per completion)
   by `groupTranslationBatches` under the 800-token output budget — recapturing the original Lever 4
   *only* now that output is bounded.
3. Remaining validation: live run on the big multilingual form from
   [`plans/whole-form-translation-sequential-languages.md`](whole-form-translation-sequential-languages.md)
   (the one that truncated at ~15.6 k chars), asserting the `Translation delta merged N language(s) in
   M pass(es)` log line and NO "unparseable response" / missing-language warnings. Requires a prompt
   re-seed/restart for the `.md` contract change.

---

## 8. Remaining tasks — the queue (all ordered levers, no longer "open" but still worth doing)

> **Context.** The seven formal levers above are all done or closed. What remains is a set of smaller,
> individually-verifiable follow-ups that were deliberately left out of the big-lever scope, plus one
> piece of output-side hygiene and one free-to-try configuration. They are listed in "verifiable one
> after another" order; each has its own expected-value, verify-with, and regression coverage, and none
> of them changes the information the model genuinely needs (the §4 invariants still apply).

| # | Follow-up | What | Expected | Verify with | State |
|---|---|---|---|---|---|
| A | **Workflow-path category-load hygiene** | `buildWorkflowSystemPrompt` materialised the **whole** `formcycle` category (incl. the ~109 KB `formcycle.workflow_nodes` CLOB) into a map just to read `formcycle.general_workflow` (fallback `formcycle.general`). Lever 7 fixed the form paths to targeted `PromptLoader.loadPrompt(em, key)` calls but explicitly deferred the workflow path. **Applied then REVERTED 2026-10-02**: the targeted `loadPrompt` swap was measured as **using more tokens than before**, so it was reverted to the original `loadCategory(em, "formcycle")` + `fc[...]` access. Root cause not fully confirmed; the whole-category load stays (its 109 KB materialisation is memory-only — only the `general_workflow`/`general` entries reach `{{GENERAL}}`). | *(reverted)* | workflow prompt renders `{{GENERAL}}` from `general_workflow` → `general` | **reverted (2026-10-02)** |
| B | **Gate the compact server-variables catalog on placeholder references** | The compact workflow reference's `AVAILABLE SERVER VARIABLES` catalog (lines 24–79, ~55 lines ≈ 1.5–2 k tokens) is the `[%$...%]` placeholder dictionary — always sent in full on the pass-1 build, though it is dead weight when the request references no placeholder. **Applied then REVERTED 2026-10-02** (originally implemented 2026-10-02): wrapped the catalog in `<!--SECTION:server_vars-->` markers (compact `.md`), added a `server_vars` deterministic detector, and threaded the request corpus through `buildWorkflowSystemPrompt` → `buildWorkflowNodesCondensed` so the pass-1 reference was gated. The runtime measurement showed the gate used **more tokens than before**, so the markers, the `server_vars` detector patterns, the `requestCorpus` threading and the `WorkflowGeneralDedupTest` gate cases were all removed; the compact reference ships its server-variable catalog unconditionally again (pass-2's detailed reference was always ungated, so nothing is lost). | *(reverted)* | n/a — the catalog is always sent again | **reverted (2026-10-02)** |
| C | **Gate the `conditional` / `state_availability` always-on blocks** | [`plans/formassistant-input-token-optimization.md`](formassistant-input-token-optimization.md) left the `conditional` and `state_availability` blocks always-on as a **higher-risk** follow-up, estimated at ~40,000 chars ≈ 11–12 k tokens. **REJECTED 2026-10-02 after re-measuring the prompt:** the actual always-on conditional/state content is only ≈ 8 k chars total (≈ 2.2 k tokens) — STATE-DEPENDENT AVAILABILITY ~2.5 k + CONDITIONAL PROPERTIES ~2.1 k + CONTAINER FOR CONDITIONALLY SHOWN FIELDS ~0.3 k in [`codbi-form-structure-rules.decision.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-form-structure-rules.decision.md), plus the pass-2 EConditionType annex ~3 k in [`formcycle-general-apply.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-general-apply.md) — i.e. ≈ 1.3 k tokens on pass-1, roughly **9× below** the plan's figure. The §9.1 rejection stands unchanged: these blocks gate **silent** failure modes (a wrong `*ifcomp` code, `statusdependent` hiding instead of read-only, an emptied area), so the risk/benefit is unfavourable for ~1.3 k tokens. | 0 (rejected) | — | **rejected (2026-10-02)** |
| D | **Second clarify-template always-on residual trim** | The clarify template was estimated at ~44 k chars gated to ~33 k, with a ~11 k always-on residual to trim. **REJECTED 2026-10-02 after re-measuring the prompt:** the template is **30,862 chars** and its always-on slice (after the `<!--CLARIFY:-->` payment/livedata/http/approval gating) is ≈ **24.7 k chars of distinct anti-ask decision rules** — not per-entry prose the clarify round never reads — so a ~11 k trim would delete ~45 % of those rules and invite the exact "re-asked" regression the follow-up warns about. The injected blocks are already condensed (the XSpan digest strips `<style>`/HTML and caps at 4,096 chars in [`buildTextSpanContentContext()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:10225); Lever 4 did completion pages / workflow mails / form variables / form structure / workflow structure). The only provably lossless reduction is ≈ 2 k chars of exact duplication (mechanism B), ≈ 0.5 k tokens — not worth a prompt rewrite + re-seed. | 0 (rejected) | — | **rejected (2026-10-02)** |
| E | **Output-side re-emission / forced-final waste + duplicate `_codbiApplicability` report** | **DONE (2026-10-02).** (1) The forced-final pass already uses the `_diff`/`_unchangedItems` + `sliceFormForPass2` protocol, so it does not re-emit untouched items — the missing piece was *observability*, now fixed by logging `form-forced-final re-emission stats` exactly like pass-1/pass-2. (2) [`mergeDerivedAppliedIntoReport()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:5414) now emits **each `applied` id exactly once** — a diff-derived entry wins over a kept model `Holistic.*` entry with the same id (the only overlap path); `considered`/`skipped`/`codbiVerdict`/counts stay verbatim. | exact-once `applied` set; forced-final re-emission now measurable | `DeriveAppliedFunctionsTest` new case *"emits each applied id exactly once …"* + the existing 11 cases; the `form-forced-final re-emission stats` log line | **done (2026-10-02)** |
| F | **Provider prompt-caching config flip (free to try)** | The `AI_Assistant_PromptCaching` mode re-sends gated-dropped blocks relying on a provider prefix-cache *discount*. On the current provider cache hits are billed at FULL rate (latency feature, not cost) — so flipping it on is free-to-try and may help models with aggressive low-level caching, but is expected to be cost-neutral until a discounting provider is adopted. Just a config flip + re-measure via the `cachedIn` / `cost` trip counters. | no change expected on-cost now; clears the path for a discounting provider later | `cachedIn` vs `cost` across a run before/after; no token/cost regression | open — config only, no code |

**Tracking checklist (work one at a time):**

- [-] **Follow-up A:** workflow-path `loadCategory` → targeted `loadPrompt` — **applied then REVERTED
      2026-10-02**: runtime measurement showed it used **more tokens than before**, so
      `buildWorkflowSystemPrompt` (`AICodBiAssistant.kt`) is back to the original `loadCategory(em,
      "formcycle")` + `fc[...]` access. The `WorkflowNodesGuardTest` lean-size guard was kept (the
      `general_workflow`/`general` entries must stay lean) with its docs updated to the reverted design.
- [-] **Follow-up B:** gate the compact **server-variables catalog** on whether the request references a
      placeholder, fail-open — **applied then REVERTED 2026-10-02**: the runtime measurement showed the
      gate used **more tokens than before**, so the `<!--SECTION:server_vars-->` markers, the
      `server_vars` detector patterns, the `requestCorpus` threading and the `WorkflowGeneralDedupTest`
      gate cases were removed. The compact reference ships its server-variable catalog unconditionally
      again; pass-2's detailed reference was always ungated.
- [-] **Follow-up C:** gate `conditional` / `state_availability` always-on blocks with verb-matching
      detectors — **REJECTED 2026-10-02**: re-measuring the prompt showed the target content is only
      ≈ 8 k chars (≈ 2.2 k tokens, ~1.3 k on pass-1), ~9× below the plan's 11–12 k estimate, and the
      blocks gate *silent* defects (a wrong `*ifcomp` code, `statusdependent` hiding instead of
      read-only). See the §9.1 rejection. Not worth the risk.
- [-] **Follow-up D:** second clarify-template always-on residual trim — **REJECTED 2026-10-02**: the
      template (30,862 chars) gates to ~24.7 k always-on, which is a tight set of anti-ask decision
      rules, not dead prose; a ~11 k trim would remove ~45 % of them and risk *re-asking*. The
      injected blocks are already condensed (XSpan digest strips HTML and caps at 4,096 chars).
      Only ≈ 2 k chars of exact duplication is safely removable (~0.5 k tokens) — not worth a
      prompt rewrite + re-seed.
- [x] **Follow-up E:** output-side — `mergeDerivedAppliedIntoReport` now emits each `applied` id
      exactly once (a diff-derived entry wins over a duplicate kept `Holistic.*`); the forced-final
      pass already uses the diff/slice protocol, so it gained the missing `form-forced-final
      re-emission stats` observability line. `DeriveAppliedFunctionsTest` (12 cases) green.
- [ ] **Follow-up F:** try `AI_Assistant_PromptCaching`, re-measure `cachedIn` vs `cost`.
- [ ] Re-measure per §5 and update the two existing plans' status tables after each landed follow-up.

---

## 8B. New candidate levers (post-lever ideas — measured-first, ordered)

> **Context.** The seven formal levers (§1–§7) are closed and the §8 follow-ups are resolved (A/B
> reverted, C/D rejected, E done, F config-only). The ideas below come from a fresh read of the code;
> none of them deletes a rule (the §4 invariants still apply). They are ordered so we go through them
> **ONE AT A TIME**, each measured before/after per §5.

| # | Lever | Mechanism | Expected | Risk | Verify with | State |
|---|---|---|---|---|---|---|
| 1 | **Pass-1 payload instrumentation (lossless first step)** — log `Pass-1 payload sizes: system/user chars, form-dump chars, root item count`, mirroring the existing `Pass-2 payload sizes` line. Pass-1's user turn is `slimPersistJson(persistJson)` — the WHOLE slim form, **no slicing** — so its true cost was invisible. | — (measurement) | 0 (no payload change) | none | `Pass-1 payload sizes:` line per pass-1 | **applied then REVERTED (2026-10-02)** — the instrumentation was token-neutral by construction (the model payload stayed byte-identical — `$pass1FormDump` == `slimPersistJson(persistJson)`), so the reported doubling almost certainly had an unrelated cause (e.g. a prompt re-seed on the plugin restart); removed on request. |
| 1b | **Slice pass-1's form dump (gated on 1's measurement)** — pass-2/forced-final already send [`sliceFormForPass2()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:6341) stubs; pass-1 sends the full slim dump. **No-context-loss requirement:** pass-1 must DECIDE and must see the exact JSON of any element it MODIFIES (notably `rtevalue` HTML part-edits), so a plain stub is **not** lossless here. A lossless design needs either (a) an **intent-based slice** that keeps full bodies for request-referenced items + all containers/pages and **fails open to the full dump** when the target is ambiguous, or (b) a new **form-item demand-load path** (`need_form_item_details`) mirroring `need_codbi_details`. Decide only after reading 1's numbers. | G/C | several k chars on large forms (unknown until measured) | medium-high | `Pass-1 payload sizes:` form-dump chars drop; `re-emission stats` unchanged; no wrong-target/"element not found" regression on the corpus | open (blocked on 1) |
| 2 | **Condense the pass-1 user-turn prose** -- **applied then REVERTED twice (2026-10-02/03)**: the clarificationInstruction pass-1 user-turn block was condensed (~5.4 k -> ~1.7 k chars, every imperative kept, mechanism B), but each measurement showed the usage rise, so the change is removed and the block is back verbatim. NOTE: the edit strictly REDUCES prompt bytes (~ -3.5 k chars, nothing added), so the rise is almost certainly a restart/re-seed artefact rather than this edit. | B | 0 (reverted) | -- | code reverted; pass-1 user turn unchanged | **reverted (2026-10-02/03)** |
| 3 | **Gate the always-on clarify injected blocks** -- **applied then REVERTED (2026-10-03)**: `ClarifyInjectionGate` gated completionPages/formVariables/workflowMails/availableDatasources (fail-open), but the measurement showed usage rose, so it was removed (new files deleted, AICodBiAssistant.kt reverted to HEAD). | D | 0 (reverted) | -- | code reverted | **reverted (2026-10-03)** |
| 4 | **Trim the fixed `sections` vocabulary line** -- **applied then REVERTED (2026-10-03)**: the `sections` line was trimmed 1,853 -> 1,588 chars, but the measurement showed usage rose, so codbi-chat-system-prompt.md is back at HEAD (guard test deleted). | A | 0 (reverted) | -- | code reverted | **reverted (2026-10-03)** |
| 5 | **Skip/merge phase-1 classify-intent on chat turns** | **Not applicable / already satisfied (2026-10-03)** -- verified in the frontend: chat turns already bypass phase-1 (`runChatTurn()` in ai-assistant.ts:3483 calls `runPhase2(..., "both", ..., {chatMode:true})` directly, with NO phase-1 request). Phase-1 `classifyIntent` (AICodBiAssistant.kt:2881) runs only on the build ("Run") path, and its returned `intent` is LOAD-BEARING: it decides WHICH context the frontend collects and sends (form persist vs workflow) at ai-assistant.ts:3894 and :3952. Removing it there would force sending BOTH contexts on every build (approx the full form + workflow) -- a net input-token INCREASE, not a saving. | E | 0 (nothing to remove) | -- | chat turns already have no phase-1 trip | **n/a (already satisfied) (2026-10-03)** |
| 6 | **Hard `max_tokens` cap per pass** — bound the wasted completion on a degenerate loop (the historical 42 k-char non-JSON) instead of paying for it and recovering via the forced-final. | E | bounded worst-case output | low | `tokensOut`/`completionChars` of a degenerate run | **declined (2026-10-03)** — the cap must exceed the largest legitimate full-form re-emission, so it is only a low-value safety net. |
| 7 | **`rtevalue` part-edit re-emission** — a modified HTML property must be sent COMPLETE (the plan's acknowledged remaining output sink). A structural HTML-part patch is possible but high-risk; measure `re-emission stats` first. | G | unknown (output side) | high | `re-emission stats` unchanged-props chars | open (measure first) |
| 8 | **Constrained / JSON-schema decoding** — if the provider supports guided decoding, malformed-JSON retries and the forced-final pass disappear (inference-level saving). | E | a whole pass on retries | provider-dependent | absence of "forcing final complete-form pass" | **declined (2026-10-03)** — a fully strict schema cannot express free-form form/workflow content, and the current model rejects `response_format` + `tools`. |
| 9 | **Per-pass model selection** — **RE-IMPLEMENTED (2026-10-03), fail-open hardened** | The opt-in aux-model routing (`AI_Assistant_AuxModel` + per-role `AI_Assistant_AuxModel_<role>` for classify/clarify/repair/translate) now routes ONLY through the pure identity functions `routeAuxModel()` / `auxModelFor()`, and the property map is resolved by the pure `parseAuxModels()` — both applied LAST in `initialize()` so they can never perturb the other config reads. A per-run `Model routing: selected=…, classify=…, clarify=…, repair=…, translate=…` log line makes the inert state verifiable. Rationale for the rework: the earlier attempt was reverted after a run produced an empty form, but that run's log shows pass-1 on the SELECTED model (`ext-specialist:cerebras`) with an UNCHANGED prompt — the aux routing did not divert the build pass, so causation was doubtful. Every non-identity path is now removed (no `getProperty(key, default)`, no blank-string entries). New guard test: [`AuxModelRoutingTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AuxModelRoutingTest.kt). | -- (cost, not tokens) | large COST saving | medium | `Model routing:` log shows all five ids equal when unset; `AuxModelRoutingTest` green | **re-implemented (2026-10-03)** |

**Tracking checklist (one at a time):**
- [-] **1** pass-1 payload instrumentation (lossless) — **applied then REVERTED 2026-10-02** (removed on
      request after a reported doubling of usage; the change only logged pass-1's payload size and left
      the model bytes unchanged).
- [ ] **1b** pass-1 form-dump slicing — blocked on 1's measurement; needs a no-context-loss design (intent slice + fail-open, or a form-item demand-load path).
- [-] **2** condense the pass-1 user-turn prose -- **applied then REVERTED twice (2026-10-02/03)**: the clarificationInstruction block is condensed only by REMOVING duplicated bytes (~ -3.5 k chars, nothing added), yet each measurement showed usage rose, so it is back verbatim. The cause is almost certainly the restart/re-seed, not this edit -- verify with the per-trip promptChars of form-pass-1.
- [-] **3** gate the always-on clarify injected blocks -- **applied then REVERTED 2026-10-03** (usage rose).
- [-] **4** trim the sections vocabulary line -- **applied then REVERTED 2026-10-03** (usage rose).
- [-] **5** skip/merge phase-1 classify-intent on chat turns -- **N/A (2026-10-03)**: chat turns already bypass phase-1 (`runChatTurn` calls `runPhase2(...,"both",...)`); removing it on the build path would force sending both contexts -> net input increase.
- [-] **6** hard per-pass `max_tokens` cap -- **DECLINED 2026-10-03**: the cap must exceed the largest legitimate full-form re-emission, so it is only a low-value safety net.
- [ ] **7** `rtevalue` part-edit re-emission (measure first) -- **deferred** (high risk, not pursued).
- [-] **8** constrained / JSON-schema decoding -- **DECLINED 2026-10-03** (provider-dependent; strict schema cannot express free-form content; current model rejects `response_format`+`tools`).
- [-] **9** per-pass model selection -- **RE-IMPLEMENTED 2026-10-03 (fail-open hardened)**: routing is a pure identity when `AI_Assistant_AuxModel*` is unset (unit-tested in [`AuxModelRoutingTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AuxModelRoutingTest.kt)), applied LAST in `initialize()`, with a per-run `Model routing:` diagnostic log. The earlier revert followed a run whose log shows pass-1 on the selected model with an unchanged prompt, so the aux routing was not the cause.

## 8C. Closure decision (2026-10-03)

**The token-reduction programme is CLOSED.** All formal levers (§1–§7) are closed and every §8 / §8B
candidate is now resolved:

| Item | Final state |
|---|---|
| A, B | reverted |
| C, D | rejected (silent-defect / re-ask risk) |
| E | done (commit `9ba5cae3`) |
| F | config-only (`AI_Assistant_PromptCaching`) |
| 6 | **declined (2026-10-03)** — a cap must exceed the largest legitimate full-form re-emission, so it is only a low-value safety net; not applied |
| 8 | **declined (2026-10-03)** — provider-dependent; a fully strict schema cannot express free-form form/workflow content, and the current model (Cerebras gpt-oss-120b) rejects `response_format` + `tools` |
| 9 | **implemented (commit `ee7feb5e`)** — a **cost** lever, not a token-count lever |
| 1b, 7 | deferred — high risk with no measured upside |

**What worked** was inference-side, never prompt-byte-side: Follow-up E (output hygiene / merge
de-duplication) and Lever 9 (optional per-path auxiliary models). **What did not work** — every
prompt-byte reduction (2, 3, 4) *raised* total usage, because a smaller or less-constraining prompt
changes model behaviour: it can lengthen the answer, make the classifier less certain (keeping MORE
gated blocks), or drop data the model then re-asks for (an extra inference). The acceptance metric is
therefore Σ(tokensIn+tokensOut) + trip count, never prompt size.

**Why closing is justified.** The only untried levers (1b, 7) are both high-risk and
measurement-blocked: 1b needs a no-context-loss design (pass-1 must see the exact JSON of anything it
modifies) and 7 is rated high-risk by the plan itself. Given the empirical backfire of prompt-side
edits, further work has small expected value and a real regression surface, so it is stopped.
Re-opening should require a NEW measured signal from the change log (a per-trip `promptChars` /
`tokensOut` anomaly), not another speculative edit.

---

## 7. Direct answer, in one paragraph

What still has to be done is **not** to find more rules to cut — the safe cuts are largely done — but
to remove the remaining **duplicated inferences** and **blind fallbacks**: (1) cut the clarify
round's cost — first by shrinking its prompt, then, only if needed, by skipping its *question* role
behind a strictly **language-agnostic** guard in which the AI signal authorises and deterministic
keyword/title checks can only veto (~15 % of a run — a keyword-gated skip would silently fail in any
language the list does not cover and is therefore **not** a saving), (2) stop pass-2 from shipping the whole widget
reference / the full Bürger-Services prose when it can be gated or trimmed (~30 % of pass-2), (3)
merge `classify-intent` into `chat-classify`, (4) collapse multi-language translation to one pass,
and (5) give the workflow branch the same decision-core split the form branch already has. Each of
these removes a *transmission*, **never** a rule: the information either lives in exactly one place
that still reaches the pass that needs it (B), is requestable on demand in the same run (C), or is
replaced by a signal the run has already paid for (E). The gating that already ships keeps its
fail-open guarantee — a block whose tag was matched by no signal is **kept** — which is what makes
"reduce tokens without losing necessary information" a property of the design rather than a hope.
