# CodBi — Release Notes & Update History

> **Low-Code Logic Engine for XIMA formcycle & Privacy-First Local AI**
>
> This document tracks all significant changes, new features, enhancements, and fixes across CodBi releases. For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md). For security policies, see [SECURITY.md](SECURITY.md).

> **Business Value & Impact**
>
> * **Digital Transformation Accelerator:** CodBi serves as a high-performance middleware that bridges the gap between complex backend logic and front-end usability. It allows business departments to deploy enterprise-grade forms with advanced validation and automation without custom coding.
> * **Operational Efficiency:** By providing a vast library of pre-built "Low-Code" elements (from LDAP integration to dynamic UI components), it significantly reduces development cycles and time-to-market for complex digital workflows.
> * **Data Sovereignty & Compliance:** Whether handling simple form data or complex AI inference, all processing remains 100% on-premises. This ensures full GDPR compliance and eliminates third-party dependencies or external data leaks.
> * **Scalable Architecture:** The modular "Element Placeholder" (EP), "Functionality" & "Standard Configuration" system ensures that the library grows with the organization's needs, allowing for easy integration of legacy systems (like BayVIS or LDAP) alongside modern AI capabilities.

---

## Version 1.0.0 — Pre-Release (In Development)

**Target Platform:** XIMA formcycle 8.3.x &nbsp;|&nbsp; **Runtime:** Java 11+ / Kotlin 1.9 &nbsp;|&nbsp; **Frontend:** TypeScript 5.7 / Yarn 4.6

---

### Phase 7 — Build Hardening & CI/CD

**Focus:** Production-grade build reliability, automated documentation, and dependency hygiene.

**Build & Infrastructure**
* **Race Condition Fix:** Eliminated a race condition in parallel workspace builds; centralized Java version management across all Maven modules.
* **Build-Generated Index:** Replaced runtime classloader directory listing with a build-time generated `index.json`, removing filesystem scanning from the hot path.
* **Dependency Cleanup:** Excluded transitive `jna` and `commons-io` from `tess4j`; marked `commons-compress` as `provided` scope to prevent JAR bloat.
* **Cross-Platform Angular Build:** Resolved `ng` binary path resolution for cross-platform compatibility.
* **CI Docs Workflow:** Added GitHub Actions workflow for automated TypeDoc, Dokka, and translated documentation deployment to `gh-pages`.

**Code Quality**
* **Biome Lint Compliance:** Fixed all `useBlockStatements` lint violations across the codebase.
* **Test Alignment:** Updated test assertions for LDAP properties; anchored `.gitignore` rules to repo root.
* **JDK 11 Compatibility:** Replaced JDK 17+ `OperatingSystemMXBean` API calls with JDK 11-compatible equivalents.

---

### Phase 6 — Whisper Visual Indicator & Repeatable Container Support

**Focus:** Whisper UX improvements and formcycle repeatable container compatibility.

**New Features**
* **Whisper Microphone Indicator:** Added a real-time visual volume gauge.
* **Repeatable Container Support:** Made all AI functionalities (`AI.Llama.Chat`, `AI.Llama.Standard.QA`, `AI.Llama.Standard.TxtQA`, `AI.OCR`) fully compatible with formcycle repeatable containers, handling dynamic DOM attachment/detachment gracefully.

**Fixes**
* **HTML.Input.Trans.RegEx:** Fixed inability to enter accented characters (e.g., `é`) in `<input>` elements tagged with the regex transformer.
* **checkAttributes() Optimization:** Optimized the core `checkAttributes()` invocation path for faster CodBi element initialization.
* **High-Latency DOM Detachment:** Resolved an issue where formcycle detached DOM elements inside repeatable containers on slow network connections, causing CodBi elements to lose their bindings.

---

### Phase 5 — AI Ecosystem Maturation

**Focus:** AI inference ecosystem completion — concurrent throttling, specialist models, internet search, deep thinking, and the external AI proxy.

**New Features**
* **Brave Search Integration:** AI chat and Q&A functionalities can now query the internet via the Brave Search API when enabled, with a foldable search-query section in response bubbles.
* **Deep Thinking Mode:** Implemented hybrid deep-thinking — either within a single model or by delegating to a dedicated reasoning model. UI icons indicate whether fast or deep thinking was used.
* **Specialist Models:** Introduced an unlimited number of specialist AI models configurable via plugin properties and selectable per-functionality via the `specialist` parameter. Enables mixing local and external AIs within the same workflow.
* **Concurrent Inference Throttling:** Added a semaphore-based concurrency limiter (default: 2) with a request queue. The UI displays the caller's queue position and estimated wait time.
* **AI Q&A Element Placeholder:** Added `AI.Llama.Std.QA` EP — returns AI answers as a `Promise`, supporting internet search, geolocation, and JSON parsing.
* **AI.Llama.Standard.TxtQA Sources Panel:** Added a sources panel when used with Brave Search, displaying referenced web pages.
* **External AI Proxy:** Implemented an authenticated HTTP proxy (`AIproxy`) exposing local AI endpoints to external applications via ChatML, with IP whitelist and HTTP Basic Auth.
* **Fixed Language Responses:** Introduced a `language` parameter (or plugin property) to enforce the model's response language across `Chat`, `QA`, and `TxtQA` functionalities.
* **AI Notification:** Added browser notifications when AI answers are ready.
* **AI Mail & URL Capabilities:** AI can now fetch and analyze data from URLs and send emails when requested through the chat interface.
* **Multi-Page PDF/Image Inference:** AI vision functionalities now process multi-page documents.
* **RAM & CPU Guards:** Implemented resource guards via plugin properties to prevent inference from exhausting system resources.
* **Health Monitoring:** Periodic health checks detect when an AI engine goes offline; the UI reacts immediately and retries on recovery.

**Enhancements**
* **QWEN3-VL 2B Upgrade:** Upgraded default LLM from QWEN2 2B to QWEN3-VL 2B for improved intelligence and vision capabilities.
* **LLaMA.cpp Performance:** Migrated to llama.cpp from in-process ONNX, providing a significant inference performance boost.
* **AI Attribution Labels:** `AI.Llama.Standard.QA` and `AI.Llama.Standard.TxtQA` display an `✨ AI-Generated` hint satisfying EU AI Act transparency requirements.

---

### Phase 4 — Local API-Documentation Manager & CodBi Elements Template

**Focus:** Enabling the community to create, share, and manage custom CodBi elements without modifying the plugin source.

**New Features**
* **Local API-Documentation Manager:** An integrated Angular component in the form designer for creating, documenting, and managing custom CodBi elements (Functionalities, EPs, Standard Configurations) directly in the browser.
  * Visual point-and-click/autocomplete selection of elements instead of manual typing.
  * Full CRUD operations with parameter definitions, global variables, CSS classes, and executable code.
  * JSON import/export for sharing validated form logic across formcycle instances.
  * Automatic duplicate renaming on import with clean postfixing.
  * Synchronization with the formcycle backend (controlled via `APIDoc_UsersAllowedToSYNC`).
  * Local code deletion capability.
* **CodBi Elements Template:** Published a TypeScript project template (`codbi-elements-template/`) with esbuild bundling and TSDoc-to-JSON generation. Custom elements authored in TypeScript are automatically compiled into `.json` files directly importable via the Manager including docs, parameter and css class definitions.

---

### Phase 3 — AI Foundation (Tesseract, Vision Models, Whisper)

**Focus:** Building the complete on-premises AI inference stack — OCR, vision-language models, and speech-to-text.

**AI Engines Implemented**
* **Whisper Speech-to-Text:** Live speech recognition for `<input type="text">` and `<textarea>` elements via whisper.cpp (GGML), fully on-premises, DSGVO/GDPR-compliant. Supports interim partial results, auto-language detection, and configurable hotkey (`Alt+A`).
* **Real-Time LLaMA Chat:** Multi-turn chat with document upload (with security validation), chat history awareness, and response stopping.
* **AI.Llama.Standard.QA:** Image/PDF Q&A — auto-triggers on upload, extracts answers from documents, supports verification mode.
* **AI.Llama.Standard.TxtQA:** Text-based Q&A — auto-triggers on field change with debounced inference.
* **Tesseract OCR:** Three modes (Print, Extract Fields, Verify) with regex-based structured extraction, automatic orientation detection (OSD), and image preprocessing (grayscale, binarization, denoising).
* **QWEN Vision Layer:** Successfully implemented QWEN 2B vision-language model with multimodal projection for document understanding.

**Infrastructure**
* **Crash Isolation Architecture:** AI engines run as separate OS processes (LLaMA, Whisper) or in-process via JNI (Tesseract), communicating over `localhost`. If a model exhausts RAM, only the child process is killed — the Tomcat JVM remains unaffected.
* **Zero-Config Deployment:** Automatic downloading and configuration of all binaries and models on first use with resume support.
* **Hardware Acceleration:** Native Vulkan (default on Windows) and CUDA 12 support, with automatic CPU fallback.
* **PDF Awareness:** Upload fields tagged with CodBi AI classes can process both image-based and text-based PDFs. Scanned PDFs are rendered to images; text PDFs have their text extracted client-side.

**Performance Milestones**
* Achieved ~6s document translation (40 words) on Intel i5 laptop using OpenVINO with 8-bit quantized vision encoder.
* 500% inference speedup by migrating from PyTorch to ONNX (later superseded by llama.cpp for even greater gains).

---

### Phase 2 — Designer Interface & Frontend Ecosystem

**Focus:** Intelligent form designer integration, frontend functionalities, and the EP/Functionality ecosystem.

**Designer Interface**
* **Functionality Attribute Interface:** Implemented intelligent attribute editor with autocompletion for all CodBi elements — select via point-and-click instead of manual typing.
* **EP Interface:** Full EP browsing and selection UI with parameter documentation.
* **CSS Class & Global Variable Interfaces:** Visual interfaces for managing CSS classes and global variables associated with CodBi elements.
* **Standard Configuration Selection:** Persisted selection of standard configurations in form properties with full designer integration.

**Frontend Functionalities Implemented**
* `HTML.Panel` — Advanced panel structures with fold/unfold, accordion groups, auto-generated headers, required-field validation, scroll-on-unfold, and comprehensive CSS customization.
* `HTML.Select.Favorites` / `HTML.Select.Injection` — Dynamic dropdown management.
* `HTML.SetAttribute` / `HTML.Text.Injector` / `HTML.Text.Mapper` — DOM manipulation primitives.
* `HTML.Input.Transformer` / `HTML.Input.Trans.Capital` / `HTML.Input.Trans.NTW` / `HTML.Input.Trans.Regex` — Input value transformation pipeline.
* `HTML.Input.Cleave` — Advanced input masking (Cleave.js integration).
* `HTML.Input.Regex` / `HTML.Input.Blacklist` / `HTML.Input.NoAutocomplete` — Input validation and security.
* `HTML.CSS` — Dynamic CSS injection with placeholder replacements and dark mode support.
* `Date.Frame` / `Date.Min` / `Date.NoWeekends` / `Time.Frame` — Date/time validation framework.
* `OnChange.Conditional` — Conditional functionality execution based on date comparisons.
* `JSON.Set` / `Print.Remove` / `Form.Navigator` / `Matomo.Tracking` — Utility functionalities.
* `OpenPLZ.Autocomplete` / `LDAP.Autocomplete` / `LDAP.Autocomplete.Set` — Integration functionalities.
* `Media.Image.Cropper` / `Media.Input.Speech` / `Media.MultipleUpload` — Media functionalities.

**Element Placeholders Implemented**
* `F` / `I` / `V` / `Unique` / `Sorted` — Core data EPs.
* `Data.CSV` / `Data.Join` / `JSON.Path` / `DOM.Query` / `Net.URL` — Data access EPs.
* `Date.Today` / `Date.FromString` / `Date.Arithmetic` / `Date.Holidays` / `Date.Weekends` — Date/time EPs.
* `OpenPLZ.*` / `LDAP.Find` / `BayVIS.*` — External service EPs.

**Hardening**
* Frontend hardened with XDBC (Design by Contract) decorators enforcing parameter contracts at runtime.
* Resolved all Biome linter violations.

---

### Phase 1 — Platform Foundation

**_Initial architectural foundation and core platform scaffolding developed by @awa-xima._**

**Focus:** Core architecture, build system, and initial formcycle integration.

**Architecture**
* **Plugin Skeleton:** Maven-based Kotlin/TypeScript plugin for formcycle 8.3.x with frontend-maven-plugin for zero-install Node.js/Yarn builds.
* **Yarn Berry Monorepo:** Frontend organized as a Yarn 4.x workspace with packages: `common`, `designer`, `form`.
* **Form Render Pipeline:** `FormRenderCallback` → `FormRenderProcessor` → injected `<script type="module">` tags → `window.codbi.loadConfigs()` → `checkAttributes()` execution chain.

**Infrastructure**
* **Git Hooks:** Automatic code formatting on commit via spotless (ktfmt for Kotlin, Biome for TypeScript/CSS).

**Build System**
* Maven Wrapper (`mvnw` / `mvnw.cmd`) for reproducible builds.
* IDE configurations for VS Code, IntelliJ, and Eclipse in `ide/` directory.
* Profiles: `dev` (fast builds, no minification, no tests) and default (full build with tests).
* `fc-deploy:deploy` for hot-deploying to a running formcycle instance.
* `fc-server:run-ms-war` for launching a local formcycle server.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend** | Kotlin (JVM) | 1.9.22 |
| **Frontend** | TypeScript | 5.7.3 |
| **Build** | Maven + Yarn Berry | 3.9.9 / 4.6.0 |
| **Bundler** | esbuild | — |
| **Testing** | Jest + ts-jest (Frontend), JUnit 5 (Backend) | 29.7 / 5.11 |
| **Formatting** | Spotless (ktfmt + Biome) | — |
| **AI Inference** | llama.cpp (GGUF), whisper.cpp (GGML), Tesseract (JNI) | — |
| **Platform** | XIMA formcycle | 8.3.3 |
| **Runtime** | Java | 11+ |
| **Node.js** | (build-time only) | 22.14.0 |

---

## Links

| Resource | URL |
|---|---|
| **Repository** | [github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Dev](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Dev) |
| **Interactive Onboarding** | [CodBi OnBoarding](https://forms.ansbach.de/frontend-server/form/alias/1/CodBi_OnBoarding/) |
| **QA Testing Live Overview** | [CodBi Testing — System Overview](https://forms.ansbach.de/frontend-server/form/alias/1/CodBi_Testing_Systemuebersicht) |
| **Issue Tracker** | [GitHub Issues](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Dev/issues) |
| **License** | [MIT](LICENSE) |