# Changelog

All notable changes to CodBi are documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.0] — Unreleased

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
- CodBi Elements Template (`codbi-elements-template/`): TypeScript project template with esbuild and auto-generated `.json` doc files

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
