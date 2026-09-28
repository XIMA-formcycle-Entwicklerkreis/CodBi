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
| 2 | **Trim the Bürger-Services naming block** (was 11,801 chars ≈ 2.8–3.8 k tokens; now ~8,246 chars ≈ 30 % smaller) — condensed to the canonical-ID catalog + the ELSTER fields + the hard rules, verbose prose/worked examples dropped. Sent on BOTH pass-1 and pass-2, so each byte saved is paid twice. **Implemented 2026-09-28** (Approach A: prompt-only `.md` rewrite, invariant #2 kept). **REGRESSION + FIX 2026-09-28**: the first cut dropped the "AUTH METHOD → FIELD REQUIREMENTS" imperative, so the model created the `fsBKDaten` fieldset but left its `elements` empty ("input fields are not generated anymore"); a condensed field-creation imperative block was restored **and then STRENGTHENED 2026-09-28** to cover ANY container the AI creates (not just the literal `fsBK*` — the failing run created a generic `fdPersonData` XContainer with empty `elements`), raising the size cap from 8,000 → 8,500 for the legitimate generalization (9 `BuergerserviceNamingPromptTest` cases incl. the field-creation and any-container guards). **CRITICAL — stale DB seed**: the user's failing run was served a STALE DB block (`buergerservice=7617`), NOT the fixed source — the fix never reached the model until the prompts are re-seeded. **Verify from the log**: `Pass-2 system prompt composition: … buergerservice=<n>` should drop accordingly after a re-seed restart | ~2–3 k tokens per build run | `Pass-2 system prompt composition: … buergerservice=<n>` | done — next is lever 2.3 |
| 3 | **Merge `classify-intent` into `chat-classify`** | ~2.1 k tokens | first check whether it still runs at all — it is **absent from the 636/643 `trips`**, so either it is skipped or unreported (a measurement gap worth closing) | open |
| 4 | Shrink the clarify prompt (only non-skipped rounds); give the workflow branch the same decision-core split | share of ~14 k / large for workflow runs | `clarification prompt assembly: … gatedLen=` | open |
| 5 | `_codbiApplicability` derived from the diff instead of generated; monitor the output the identity rule now adds (`completionChars`) | small per run | `re-emission stats`, `completionChars` | open |
| 6 | One conversation for pass-1 + pass-2 | only with a **prefix-cache-discounting** provider; a stateless API re-sends the core, and this provider bills hits at full rate | `cachedIn` vs `cost` | open, provider-dependent |

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
| 2 | **Never send `{{CODBI_FULL_SECTION}}` on a blind pass** — send the name index (~2 k) and demand-load | up to −35 k if hit | same mechanism; the pure-blind branch is a recovery path |
| 3 | Trim Bürger-Services naming to canonical names + ELSTER fields | ~3 k | prompt-only, low risk |
| 4 | Merge `classify-intent` into `chat-classify` | ~2.2 k | code, low-medium risk |
| 5 | Shrink the clarify prompt (matters only for non-skipped rounds) | share of ~14 k | language-agnostic, behaviour-preserving |

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

### Lever 3 — Merge `classify-intent` into `chat-classify` *(mechanism E)*

- Both calls run on the same request with overlapping context; one combined envelope removes a whole
  call. ~2.2 k in (≈ 4 %).
- **Why nothing is lost:** the two outputs are merged, not dropped; the resulting single envelope
  carries every field both consumers read.
- **Risk:** low-medium (format drift → strict retry; keep `sections`/`topics` first-class in the `.md`
  prompt, never appended from Kotlin).

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

### Lever 6 — Output-side leftovers *(mechanism A/G)*

- `_codbiApplicability` (~200–400 output tokens/run) could be **derived from the diff** instead of
  generated — the server already knows which items changed.
- The forced-final and retry passes re-emit what the previous attempt already produced; measure the
  `re-emission stats` log line before changing anything.
- **Risk:** small per run; measure first.

### Lever 7 — DB/memory hygiene (no token effect, but it is real waste)

- `PromptLoader.loadCategory(em, "formcycle")` materialises the **whole** category — including the
  109 KB `formcycle.workflow_nodes` CLOB — into a map on every form request
  ([`buildCodbiFormSystemPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:20862),
  [`loadCodbiApplyPrompt()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:21100)).
- Replace with targeted key loads (`loadPrompt(em, "formcycle.general_decision")`, `formcycle.widgets`
  only where used). This also makes the "workflow nodes are not in the form path" invariant explicit
  rather than accidental.
- **Guard:** add a regression test asserting `formcycle.workflow_nodes` never appears in a
  form-assistant pass-1 prompt.

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
      - [ ] **Primary (language-agnostic, low risk):** shrink the clarify prompt — condense
            `latestFormElements` / `formStructureContext` / the completion pages / the form variables
            / the workflow-mail summary. No behaviour change.
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
- [ ] **Lever 2.3 (B):** de-duplicate `formcycle-general-apply` vs.
      `codbi-form-structure-rules.decision` (one authoritative home per rule).
- [ ] **Lever 2.4 (C):** evaluate NAME-ONLY pass-1 catalogs on the corpus.
- [ ] **Lever 3 (E):** merge `classify-intent` into `chat-classify`.
- [ ] **Lever 4 (C/E):** single-pass multi-language translation.
- [ ] **Lever 5 (C):** workflow prompt decision-core split.
- [ ] **Lever 6 (A/G):** derive `_codbiApplicability` from the diff.
- [ ] **Lever 7:** targeted `formcycle` key loads + regression test that
      `formcycle.workflow_nodes` never enters a form-assistant prompt.
- [ ] Re-measure per §5 after each landed lever and update the two existing plans' status tables.

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
