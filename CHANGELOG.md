# Changelog

All notable changes to CodBi are documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- The AI assistant dialog now has a **Change log** button that opens a per-form treeview of all AI
  inferences recorded in the database (`codbi_ai_assistant_log`). Each inference is scoped to the
  form's technical name/key (`form_key`) so the dialog opened in the designer shows only the
  entries of the form that is currently being edited. Top-level nodes are the date/time of each
  inference; below them the applied **Form** and **Workflow** changes are listed — widgets
  created/removed, CSS classes set, attributes set (with distinct icons), special unfoldable
  `data-cb-func` / `data-cb-*` elements showing the CodBi parameters used by a functionality, and
  workflow nodes that unfold to reveal their defined parameters.

### Changed
- Minimum supported FormCycle version raised from **8.3.3** to **8.5.3**. FormCycle 8.5.x extracted plugin-type interfaces (servlet actions, form resources, form render callbacks, entities, etc.) from `fc-plugin-common` into a new `fc-plugin-types` artifact. The compile dependency has been updated accordingly.
- Kotlin upgraded from **1.9.22 → 2.2.0**; language and API version set to **2.1**. Obsolete `kotlin-stdlib-common`, `kotlin-stdlib-jdk7`, and `kotlin-stdlib-jdk8` dependency-management entries removed (merged into `kotlin-stdlib` in Kotlin 1.8+). `kotlinx-coroutines-core` pinned to **1.11.0** for Kotlin 2.x compatibility. `kotlin-reflect` scope left as compile (bundled); `jackson-module-kotlin` scope set to `provided` because FC 8.5.x already supplies it via `fc-security`.
- `fc-server-maven-plugin` updated from **8.3.0 → 8.5.3** to match the target FormCycle version; development server now provides a valid licence for FormCycle 8.5.x.
- `enforce` profile: added exclusions for `de.xima:json-schema-inferrer-gson` and `de.xima:json-schema-model` from `fc-ms-metro-gui:classes` provisions; these new transitive dependencies of FC 8.5.x are gated behind XIMA Artifactory authentication not available in CI.

---

## [1.0.1] — 2026-04-22

### Added
- `AI_LLAMA_STD_ExtraParams` plugin property: optional JSON object of additional parameters appended to every completion request body (e.g. `{"top_p":0.9,"seed":42}`). Keys `messages`, `stream`, `model`, `id_slot`, `logprobs` are silently ignored. Applies to both local and external AI requests.
- `CALL:search(...)` now accepts positional arguments without the `query=` keyword
- Location is now only appended to search queries where geography is relevant (weather, local services, events); general knowledge queries are no longer location-tagged
- `CALL:search`/`CALL:fetch` calls are stripped from assistant history before re-sending to the model to avoid prompt leakage

### Fixed
- External AI providers (Google Gemini, Groq) returned HTTP 400 due to unsupported `logprobs` parameter — now only sent to local llama-server
- `DisableFrequencyPenalty` plugin property removed — frequency, presence, and repetition penalties are now hardcoded per model type and no longer configurable
- Plain unformatted digit sequences (e.g. Kassenzeichen, reference numbers) no longer detected as phone numbers in chat output
- Well-known public figures (politicians, celebrities, scientists) are no longer stripped from web search queries as PII

### Changed
- `AI_LLAMA_STD_MmprojUrl` is now optional — omit it when using a text-only model (no vision encoder)
- When no custom model URL is set, the default VL model still auto-provides its matching mmproj
- Warning logged when running without mmproj: vision/image features unavailable
- Search capability confirmation message now explicitly instructs the model to always use `CALL:search` for factual queries rather than answering from memory

---

## [1.0.0] — 2026-04-18

### Phase 7 — Build Hardening & CI/CD

#### Fixed
- Race condition in parallel workspace builds; centralized Java version management
- Cross-platform Angular build: resolved `ng` binary path resolution
- JDK 11 compatibility: replaced JDK 17+ `OperatingSystemMXBean` API with JDK 11 equivalents
- All `useBlockStatements` Biome lint violations

#### Changed
- Replaced runtime classloader directory listing with build-time generated `index.json`
- Excluded transitive `jna`/`commons-io` from `tess4j`; marked `commons-compress` as `provided` scope
- Updated test assertions for LDAP properties; anchored `.gitignore` rules to repo root

#### Added
- GitHub Actions CI/CD workflow for automated TypeDoc, Dokka, and translated docs deployment to `gh-pages`

---

### Phase 6 — Whisper UX & Repeatable Containers

#### Added
- Real-time visual volume gauge for Whisper microphone input
- Full repeatable container support for `AI.Llama.Chat`, `AI.Llama.Standard.QA`, `AI.Llama.Standard.TxtQA`, `AI.OCR`

#### Fixed
- `HTML.Input.Trans.RegEx`: accented characters (e.g., `é`) blocked in regex-tagged inputs
- `checkAttributes()` performance regression during element initialization
- High-latency DOM detachment in repeatable containers causing lost element bindings

---

### Phase 5 — AI Ecosystem Maturation

#### Added
- Brave Search integration with foldable search-query section in chat/QA responses
- Deep thinking mode: hybrid single-model or dedicated reasoning model, with UI status icons
- Specialist models: unlimited configurable models selectable per-functionality via `specialist` parameter
- Concurrent inference throttling: semaphore-based limiter (default: 2) with queue position and ETA display
- `AI.Llama.Std.QA` Element Placeholder: returns AI answers as `Promise` with search/geolocation/JSON support
- Sources panel for `AI.Llama.Standard.TxtQA` with Brave Search citations
- External AI Proxy (`AIproxy`): authenticated HTTP gateway with ChatML, IP whitelist, and Basic Auth
- Fixed language responses via `language` parameter/plugin property
- Browser notifications when AI answers are ready
- AI URL fetch/analysis and email sending via chat interface
- Multi-page PDF/image inference for vision functionalities
- RAM & CPU resource guards via plugin properties
- Periodic health monitoring with UI status indication and auto-retry on recovery

#### Changed
- Upgraded default LLM from QWEN2 2B to QWEN3-VL 2B (improved intelligence + vision)
- Migrated from in-process ONNX to llama.cpp for inference performance boost
- `AI.Llama.Standard.QA`/`TxtQA` display `✨ AI-Generated` label (EU AI Act transparency)

---

### Phase 4 — API-Documentation Manager & Elements Template

#### Added
- Local API-Documentation Manager: Angular component for CRUD operations on CodBi elements, with point-and-click selection, parameter definitions, import/export, duplicate renaming, and backend sync
- CodBi Elements Template ([`CodBi-Elements-Template`](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Elements-Template)): TypeScript project template with esbuild and auto-generated `.json` doc files

---

### Phase 3 — AI Foundation

#### Added
- Whisper Speech-to-Text via whisper.cpp (GGML): live recognition, partial results, auto-language, `Alt+A` hotkey
- Real-time LLaMA Chat: multi-turn, document upload with security validation, chat history, response stopping
- `AI.Llama.Standard.QA`: image/PDF Q&A with auto-trigger, verification mode
- `AI.Llama.Standard.TxtQA`: text-based Q&A with debounced auto-trigger
- Tesseract OCR: Print, Extract Fields, Verify modes with regex extraction, OSD, image preprocessing
- QWEN 2B vision-language model with multimodal projection
- Crash isolation architecture: AI engines run as separate OS processes (LLaMA, Whisper) or JNI (Tesseract)
- Zero-config deployment: automatic binary/model downloading with resume support
- Vulkan (Windows default) and CUDA 12 hardware acceleration with CPU fallback
- PDF-aware uploads: scanned PDFs rendered to images, text PDFs extracted client-side

---

### Phase 2 — Designer Interface & Frontend Ecosystem

#### Added
- Functionality Attribute Interface with autocompletion for all CodBi elements
- EP Interface: browsing and selection UI with parameter documentation
- CSS Class & Global Variable management interfaces
- Standard Configuration selection with form property persistence
- 30+ frontend functionalities: `HTML.Panel`, `HTML.Select.*`, `HTML.Input.*`, `Date.*`, `LDAP.*`, `Media.*`, `JSON.*`, `Print.*`, `Form.Navigator`, `Matomo.Tracking`, and more
- 20+ Element Placeholders: `F`, `I`, `V`, `Data.CSV`, `JSON.Path`, `DOM.Query`, `Date.*`, `OpenPLZ.*`, `LDAP.Find`, `BayVIS.*`, and more
- XDBC (Design by Contract) decorators for runtime parameter contract enforcement

---

### Phase 1 — Platform Foundation

#### Added
- Maven-based Kotlin/TypeScript plugin skeleton for formcycle 8.3.x
- Yarn Berry monorepo with `common`, `designer`, `form` workspace packages
- Form render pipeline: `FormRenderCallback` → `FormRenderProcessor` → `loadConfigs()` → `checkAttributes()`
- Git hooks: automatic code formatting via spotless (ktfmt + Biome)
- Maven Wrapper for reproducible builds
- IDE configurations for VS Code, IntelliJ, and Eclipse
- Build profiles: `dev` (fast, no minification) and default (full with tests)
- `fc-deploy:deploy` hot deployment and `fc-server:run-ms-war` local server launch
