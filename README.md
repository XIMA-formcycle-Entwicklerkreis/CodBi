[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![formcycle](https://img.shields.io/badge/platform-formcycle-blue.svg)](https://www.xima.de/formcycle/)
[![Java 11+](https://img.shields.io/badge/java-11%2B-orange.svg)](https://adoptopenjdk.net/)
[![Kotlin](https://img.shields.io/badge/kotlin-%3E%3D1.8.0-7f52ff.svg)](https://kotlinlang.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D4.9.0-3178c6.svg)](https://www.typescriptlang.org/)
[![VS Code](https://img.shields.io/badge/optimized%20for-VS%20Code-007acc.svg)](https://code.visualstudio.com/)
[![IntelliJ](https://img.shields.io/badge/optimized%20for-IntelliJ-fe315d.svg)](https://www.jetbrains.com/idea/)

# Code Library (CodBi)

**Low-Code Logic Engine for formcycle & Privacy-First Local AI**

A [XIMA formcycle](https://www.xima.de/formcycle/) plugin that provides a comprehensive TypeScript library of Functionalities, Element Placeholders (EPs), and Standard Configurations for web forms.

CodBi seamlessly integrates AI-powered features (document validation, data extraction, OCR, Speech-To-Text, and AI-Chat). All AI engines are automatically downloaded and configured on first use, with the LLM chat engine supporting any GGUF-compatible model. Additionally, the built-in Local API-Documentation Manager allows users to define, manage, and share custom CodBi elements across all forms on a server, treating them exactly like built-in features.

> **Architectural Vision:** CodBi is a framework that empowers form designers to define complex logic without coding — by composing ready-made CodBi elements — and enables developers to create, share, and reuse those building blocks across the community, growing the library with every contribution. At the same time, it eliminates the trade-off between AI capability and DSGVO/GDPR compliance by running high-class models like Qwen, Mistral, LLaMA 3, Phi-3, and Gemma locally on the server via llama.cpp, alongside Whisper for speech-to-text and Tesseract for OCR — so sensitive citizen data never leaves your infrastructure.


## 📑 Table of Contents

- [🚀 Key Highlights](#-key-highlights)
- [🔍 Implementation Highlights](#-implementation-highlights)
- [📥 Installation](#-installation)
  - [📖 Interactive Onboarding Guide](#-interactive-onboarding-guide)
- [🛠 Features](#-features)
  - [⚡ Functionalities](#-functionalities)
  - [🔗 Element Placeholders (EPs)](#-element-placeholders-eps)
  - [📋 Standard Configurations](#-standard-configurations)
  - [📚 Local API-Documentation Manager](#-local-api-documentation-manager)
  - [📐 CodBi Elements Template](#-codbi-elements-template)
  - [🧠 AI](#-ai)
    - [🏗 System Architecture](#-system-architecture)
    - [⚙️ Automatic Setup](#-automatic-setup)
    - [📄 Extraction](#-extraction)
    - [✅ Validation](#-validation)
    - [🔒 Privacy & DSGVO/GDPR Compliance](#-privacy--dsgvogdpr-compliance)
    - [⚙️ Configuration](#-configuration)
    - [🌐 Network Requirements](#-network-requirements)
    - [🔌 Air-Gapped / Offline Deployment](#-air-gapped--offline-deployment)
  - [🤖 Form Assistant](#-form-assistant)
    - [💡 What it does](#-what-it-does)
    - [🚀 Advantages](#-advantages)
    - [⚙️ Inference flow & token usage](#-inference-flow--token-usage)
- [🌍 Localization](#-localization)
- [➕ Adding New Configuration Templates](#-adding-new-configuration-templates)
- [💻 Development](#-development)
  - [🔨 Build](#-build)
  - [🧪 Test](#-test)
  - [🖥 IDE](#-ide)
  - [🐛 Debugging](#-debugging)
  - [🎨 Code Style / Formatting](#-code-style--formatting)
  - [📁 Project Structure](#-project-structure)
- [📄 API Documentation](#-api-documentation)
  - [🌐 Automated Documentation Translation / BYOK](#-automated-documentation-translation--byok)
- [🤝 Contributing](#-contributing)
- [📜 License & Authorship](#-license--authorship)

### 🚀 Key Highlights

- **Modular by Design** — Functionalities and EPs are composable building blocks: mix and combine them freely to build a wide range of applications — from simple input masks to AI-powered document processing pipelines — without writing custom code.
- **Empowering Collaboration** — Export and import complete CodBi elements as JSON — including executable code, description, parameter definitions, global variables and targeted CSS classes. This fosters knowledge sharing across departments and formcycle instances, allowing teams to benefit from pre-validated solutions.
- **Intelligent Designer Integration** — The built-in Manager provides a seamless UI where users select elements — both built-in and custom — via point-and-click or autocomplete instead of manual typing, drastically reducing errors and lowering the entry barrier for creating smart forms.
- **Local API-Documentation Manager** — Define, document and manage custom CodBi elements directly in the form designer — complete with code, parameters, global variables and CSS classes. Elements can be authored in JavaScript or TypeScript; for TypeScript, the [`codbi-elements-template`](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Elements-Template) project automatically generates the importable JSON. Custom elements behave identically to built-in ones and are available across all forms and in the intelligent designer interface.
- **Flexible AI Integration** — CodBi can expose its AI engines via ChatML (AIproxy) for external access, attach to external AI endpoints, and—using the specialist parameter—mix and orchestrate both local and external AI models within the same workflow.
- **On-Premises AI Stack** — Through llama.cpp's GGUF support, high-class models like Qwen, Mistral, LLaMA 3, Phi-3, and Gemma become available for local inference. Combined with local speech-to-text via whisper.cpp (GGML) and local OCR via Tesseract (JNI), the entire AI stack runs on-premises — no unwanted external cloud dependencies.
- **Accurate Date Reasoning** — CodBi's system prompt injects real-time calendar context (current date, weekday, days in month) and guides even small local models to calculate dates correctly through structured chain-of-thought reasoning — no cloud API required.
- **Hardware Optimized** — Native support for Vulkan and CUDA 12, with automatic CPU fallback.
- **Zero-Config Deployment** — Automatic downloading and configuration of binaries and models on first use.
- **Efficient Loading** — The code that constitutes a CodBi-Element is only loaded into a form when actually used, keeping page weight minimal.

### 🔍 Implementation Highlights

- **Local LLM orchestration** with crash isolation, queue management, and multi-model specialist routing — [`Standard.kt`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ai/llama/Standard.kt)
- **Runtime config engine** with dynamic attribute binding, lazy element loading, and dependency resolution — [`global-scope.ts`](src/main/web/packages/form/src/js/global-scope.ts)
- **962 unit tests** across Kotlin (JUnit) and TypeScript (Jest)

## 📥 Installation

Install the plugin via the plugin menu in the formcycle backend as system-scoped plugin.

This adds several settings to the form designer within the `form` tab (the properties panel on the right-hand side), including the ability to enable CodBi, select the configuration template `default` (`xtensible` is for future use), and manage Standard Configurations.

📄 **[Operations & Deployment Guide](OPERATIONS.md)**

### 📖 Interactive Onboarding Guide

An interactive onboarding form is available at **[CodBi OnBoarding](https://forms.ansbach.de/frontend-server/form/alias/1/CodBi_OnBoarding/)** — it walks you through configuration, AI setup, and DSGVO/GDPR compliance step by step.

## 🛠 Features

### ⚡ Functionalities

Functionalities are applied to HTML elements via `data-cb-func` attributes. They transform, validate, or enhance form elements at runtime.

| Category | Element | Description |
|---|---|---|
| **AI / ML** | `AI.Llama.Chat` | Multi-turn chat with local LLaMA — image/PDF attachments, Brave Search, geolocation, voice input (Whisper), chain-of-thought reasoning |
| | `AI.Llama.Standard.QA` | Image/PDF Q&A — auto-triggers on upload, extracts answers from scanned documents, supports verification mode. <br>**Parameters:** Enable Brave Search (internet), use `specialist` to select any configured AI (local or external), and mix local/external AIs in one workflow. |
| | `AI.Llama.Standard.TxtQA` | Text-based Q&A — auto-triggers on field change, debounced inference with optional web search. <br>**Parameters:** Enable Brave Search (internet), use `specialist` to select any configured AI (local or external), and mix local/external AIs in one workflow. |
| | `AI.OCR` | Tesseract OCR — print, verify, and extract-fields modes with regex-based structured extraction and auto-orientation detection |
| **Date / Time** | `Date.Frame` | Connects two date inputs (min/max validation) |
| | `Date.Min` | Forces minimum date validation |
| | `Date.NoWeekends` | Prevents weekend selection in date inputs |
| | `Time.Frame` | Connects two time inputs for min/max validation |
| **Input Transformations** | `HTML.Input.Transformer` | Base transformer for input value modifications |
| | `HTML.Input.Trans.Capital` | Capitalizes input text |
| | `HTML.Input.Trans.NTW` | Converts numbers to words with dashes |
| | `HTML.Input.Trans.Regex` | Applies regex-based transformations |
| | `HTML.Input.Cleave` | Advanced input masking (Cleave.js) |
| | `HTML.Input.Regex` | Validates input against regex patterns |
| | `HTML.Input.Blacklist` | Prevents blacklisted values |
| | `HTML.Input.NoAutocomplete` | Disables autocomplete on inputs |
| **HTML / DOM** | `HTML.CSS` | Injects CSS with placeholder replacements |
| | `HTML.Panel` | Creates panel structures with advanced layout |
| | `HTML.Panel.Accordion` | Groups panels into accordion sets |
| | `HTML.Select.Favorites` | Rearranges select options with favorites on top |
| | `HTML.Select.Injection` | Dynamically populates select dropdowns |
| | `HTML.SetAttribute` | Sets HTML attributes dynamically |
| | `HTML.Text.Injector` | Injects text with placeholder replacement |
| | `HTML.Text.Mapper` | Maps object properties to text placeholders |
| **Media** | `Media.Image.Cropper` | Image cropping |
| | `Media.Input.Speech` | Browser Web Speech API (Chrome/Edge) — cloud-based, requires DSGVO consent |
| | `Media.Input.Speech.Whisper` | Local speech-to-text via whisper.cpp — fully on-premises, DSGVO-compliant, auto-download of models |
| | `Media.MultipleUpload` | Multiple file upload support |
| **Integrations** | `LDAP.Autocomplete` | LDAP-based autocomplete for inputs |
| | `LDAP.Autocomplete.Set` | Multi-field LDAP autofill coordination |
| | `OpenPLZ.Autocomplete` | German postal code autocomplete |
| | `Matomo.Tracking` | Web analytics integration |
| **Utility** | `JSON.Set` | Sets properties in JSON objects |
| | `Form.Navigator` | Form navigation buttons and synchronization |
| | `OnChange.Conditional` | Conditional functionality execution |
| | `Print.Remove` | Controls print-related content removal |
| | `Sys.Log.Console` | Console logging (for testing purposes)|

### 🔗 Element Placeholders (EPs)

EPs (Element Placeholders) can be used in any functionality parameter to dynamically retrieve values—whether for Functionalities, Standard Configurations, or custom logic. This enables powerful, reusable code patterns: parameters can reference EPs to fetch data from the DOM, global variables, external services, or computed values, all without hardcoding. You can also define EPs locally, making parameterization flexible and context-aware—so the same functionality can adapt to different forms or user inputs simply by changing the EP reference, not the code itself.

| Category | Element | Description |
|---|---|---|
| **Core** | `F` | Find objects in arrays by property/value |
| | `I` | Get element at specific array index |
| | `V` | Access global variables |
| | `Unique` | Remove duplicates from arrays |
| | `Sorted` | Sort arrays alphabetically |
| **Data** | `Data.CSV` | Convert CSV strings to arrays |
| | `Data.Join` | Merge multiple objects into one |
| | `JSON.Path` | Retrieve objects at specific JSON paths |
| | `DOM.Query` | Query DOM elements by CSS selector |
| | `Net.URL` | Fetch content from URLs |
| **Date / Time** | `Date.Today` | Current date with arithmetic (+/-d/m/y) |
| | `Date.FromString` | Convert strings to Date objects |
| | `Date.Arithmetic` | Apply date arithmetic operations |
| | `Date.Holidays` | German holidays by state (API-Feiertage.de) |
| | `Date.Weekends` | Generate weekend date ranges |
| **External Services** | `AI.Llama.Std.QA` | AI Q&A EP — returns AI answer as a Promise, supports internet/geolocation/JSON parsing |
| | `OpenPLZ` | German postal code / administrative data |
| | `OpenPLZ.Localities` | OpenPLZ localities |
| | `OpenPLZ.OrganizationalUnits` | OpenPLZ organizations |
| | `OpenPLZ.Streets` | OpenPLZ street data |
| | `OpenPLZ.TextSearch` | OpenPLZ text search |
| | `LDAP.Find` | LDAP directory queries |
| **BayVIS** | `BayVIS.Ansprechpartner` | Authority (**BayernPortal**) directory contacts |
| | `BayVIS.Ansprechpartner.ID` | Contact by ID |
| | `BayVIS.Behoerden` | Authorities/agencies |
| | `BayVIS.Behoerden.ID` | Authority by ID |
| | `BayVIS.Behoerden.Details` | Authority details |
| | `BayVIS.Behoerden.Details.Gebaeude` | Building details |
| | `BayVIS.Behoerden.Gebaeude.ID` | Building by ID |


### 📋 Standard Configurations

Pre-built configurations that wire together Functionalities and EPs for common use cases. These can also be defined and managed locally via the **Local API-Documentation Manager** in the form designer. Holistic standard configurations apply to the entire form thus just requiring the single activation click.

| Category         | Configuration Name         | Description |
|------------------|---------------------------|-------------|
| **AI**           | AI                        | Bundles AI-powered features (chat, Q&A, extraction, validation) for easy integration. |
| **Appointments** | Appointments              | Handles appointment booking, validation, and related workflows. |
| **BayVIS**       | BayVIS                    | Integrates Bavarian authority directory data and lookups. |
| **Financial**    | Financial                 | Provides financial data entry, validation, and calculations. |
| **People**       | People                    | Manages person-related data, validation, and lookups. |
| **OpenPLZ**      | OpenPLZ Autocomplete Sets | German postal code and address autocomplete and lookup. |
| **LDAP**         | LDAP Autofill             | Autofills form fields using LDAP directory data. |
| **UI**           | UI Panels                 | Predefined UI panel layouts and grouping for forms. |
| **Utility**      | Print Removal             | Removes or hides elements for print-friendly output. |
| **CSS**          | Holistic CSS Standards    | Applies consistent, organization-wide CSS styling. |
| **Input Masking**| Holistic Cleave input masks        | Input masks for dates, phone numbers, postal codes, and times. |
| **Fieldsets**    | Holistic Fieldsets-to-Panel        | Converts fieldsets into advanced panel layouts. |
| **Analytics**    | Holistic Matomo Tracking           | Integrates Matomo analytics for form usage tracking. |
| **Speech**       | Holistic Speech Input              | Adds Speech-To-Text input (standard and Whisper-based). |

### 📚 Local API-Documentation Manager

The heart of CodBi's code sharing mechanism. An integrated Angular component in the form designer that lets you create and manage your own CodBi elements (Functionalities, EPs, Standard Configurations) locally — without touching the plugin source code. Custom elements registered through the Manager behave identically to the built-in ones: they appear in the same UI, support the same `data-cb-func` attributes, and are executed by the same runtime.

- **Visual Selection** — Browse and search all available elements; select them via point-and-click instead of typing technical names, eliminating typo-related errors
- **Define Custom Logic** — Create and document your own elements with parameters and executable code directly in the browser
- **Logic Portability** — Export validated form logic as JSON and import it on other formcycle instances or share it with the community, avoiding redundant development
- **Synchronization** — Keep local definitions in sync with the formcycle backend (use `APIDoc_UsersAllowedToSYNC` to define who may sync)

### 📐 CodBi Elements Template

A ready-to-use TypeScript project template ([`codbi-elements-template`](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Elements-Template)) for building custom CodBi elements in TypeScript. Includes esbuild bundling, TSDoc-to-JSON generation, and example elements.

### 🧠 AI

CodBi ships a full local AI inference stack that runs entirely on the formcycle server — no cloud services, no data transfer, simplified DSGVO/GDPR scope.

📄 **[AI Proxy API Reference](AI-PROXY-API-REFERENCE.md)**

#### 🏗 System Architecture

```mermaid
flowchart LR
  classDef roundRect rx:12,ry:12;
  subgraph USER["👤 User Interaction"]
    direction TB
    UI["🖱️ Form Designer UI"]:::roundRect
    Click["✅ Point-and-Click<br/>Selection"]:::roundRect
    Export["📦 JSON<br/>Export / Import"]:::roundRect
    UI --> Click --> Export
  end

  subgraph JVM["☕ formcycle Server · JVM"]
    direction TB
    FC["⚙️ formcycle Core"]:::roundRect
    CodBi["🔌 CodBi Plugin<br/>Kotlin"]:::roundRect
    Manager["📚 API-Doc<br/>Manager"]:::roundRect
    Proxy["🔒 AI Proxy<br/>Auth + Whitelist"]:::roundRect
    JNI["🔤 Tesseract<br/>JNI"]:::roundRect
    FC --> CodBi
    CodBi --> Manager
    CodBi --> Proxy
    CodBi --> JNI
  end

  subgraph AI["🧠 Isolated AI Processes"]
    direction TB
    LLaMA["🦙 llama.cpp<br/>GGUF Models"]:::roundRect
    Whisper["🎙️ whisper.cpp<br/>Speech-to-Text"]:::roundRect
  end

  Export -. "Share Logic" .-> UI
  Click --> Manager
  Proxy -- "localhost:8392" --> LLaMA
  Proxy -- "localhost:8393" --> Whisper

  style USER fill:#e8f4fd,stroke:#4a90d9,stroke-width:2px,color:#1a3a5c
  style JVM fill:#fff3e0,stroke:#e67e22,stroke-width:2px,color:#5a3e1b
  style AI fill:#e8f5e9,stroke:#43a047,stroke-width:2px,color:#1b5e20

  style UI fill:#bbdefb,stroke:#1976d2,stroke-width:1px,color:#0d47a1
  style Click fill:#bbdefb,stroke:#1976d2,stroke-width:1px,color:#0d47a1
  style Export fill:#ffcc80,stroke:#ef6c00,stroke-width:2px,color:#bf360c

  style FC fill:#ffe0b2,stroke:#e67e22,stroke-width:1px,color:#5a3e1b
  style CodBi fill:#c5cae9,stroke:#3f51b5,stroke-width:2px,color:#1a237e
  style Manager fill:#ffcc80,stroke:#ef6c00,stroke-width:2px,color:#bf360c
  style Proxy fill:#f8bbd0,stroke:#c2185b,stroke-width:2px,color:#880e4f
  style JNI fill:#c8e6c9,stroke:#388e3c,stroke-width:1px,color:#1b5e20

  style LLaMA fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px,color:#1b5e20
  style Whisper fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px,color:#1b5e20
```

All AI engines run as **separate OS processes** (LLaMA, Whisper) or **in-process via JNI** (Tesseract), communicating over `localhost`. This design provides:

- **Crash isolation** — if a model runs out of RAM, the OS kills the child process while the Tomcat JVM stays unaffected.
- **Zero-config deployment** — on first use, CodBi downloads the required binaries and model files automatically (with resume support). No manual installation required beyond enabling the plugin. <br>**Note:** The necessary domains must be whitelisted for the setup process to succeed. The ktdoc documentation in the Kotlin source files lists all required domains to whitelist. <br>**Caution:** Virus scanners that monitor the plugin directory or download locations may interfere with the setup, as executable files (such as .dll and other binaries) are downloaded and extracted automatically.
- **Hardware acceleration** — native support for **Vulkan** (cross-platform, default on Windows) and **CUDA 12** (NVIDIA GPUs), with automatic CPU fallback.
- **Resource gating** — a semaphore limits concurrent inferences (default: 2). Excess requests enter a queue; setting a certain parameter, the UI displays the caller's queue position and estimated wait time. 
- **Health monitoring** — periodic health-checks detect when an engine goes offline; the UI reacts immediately and retries automatically on recovery.

#### ⚙️ Automatic Setup

| Component | Downloaded From | Default Asset |
|---|---|---|
| **llama.cpp** | GitHub Releases (`ggml-org/llama.cpp`) | Release `b8175`, Vulkan backend |
| **Whisper (whisper.cpp)** | GitHub Releases (`ggerganov/whisper.cpp`) | Release `v1.7.6`, `ggml-small` model (~466 MB) |
| **QWEN3-VL 2B** (LLM) | Bundled / HuggingFace | `Qwen3VL-2B-Instruct-Q4_K_M.gguf` + multimodal projection |
| **Tesseract** | Maven (tess4j) | In-process JNI, thread-pooled handles |

The default LLM is configured as a convenience, but **any GGUF-compatible model can be used** for the chat / Q&A engine configuring the proper URLs. Through llama.cpp's GGUF ecosystem, high-class models like Qwen, Mistral, LLaMA 3, Phi-3, and Gemma become available for local use, letting you choose larger, domain-specific, or multilingual models depending on your hardware and use case. Whisper uses GGML-format models, and Tesseract uses its own traineddata files — both are downloaded automatically.

#### 📄 Extraction

- **OCR (Tesseract)** — three modes:
  - **Print**: Extract all text from uploaded images or scanned PDFs.
  - **Extract Fields**: Use named regex groups (`Pattern_FieldName`) to extract structured data (e.g., name, date, amount) into separate form fields.
  - **Verify**: Check if the extracted text matches a regex pattern; show an error if it doesn't.
  - Automatic orientation detection (Tesseract OSD), optional image preprocessing (grayscale, binarization, denoising), and DPI-aware recognition.
- **Image / PDF Q&A (LLaMA)** — upload an image or PDF and ask free-form questions. The vision-language model (QWEN3-VL) reads the document and returns answers. Scanned PDFs are rendered to images; text-based PDFs have their text extracted client-side (for Tesseract) or are turned into an image for LLMs.
- **Speech-to-Text (Whisper)** — rather than relying on the experimental and privacy-questionable Web Speech API built into browsers, the CodBi library offers its own robust inference pipeline via Whisper. Record audio in the browser and receive a transcription. Supports interim (partial) results while speaking, auto-language detection, and a configurable hotkey (Default:`Alt+A`).

#### ✅ Validation

- **OCR Verify mode** — validates that an uploaded file matches expected content (e.g., "Does this contain an IBAN?" by applying proper regular expressions). Displays a configurable error message on mismatch and optionally shows a manual-verification checkbox.
- **LLaMA Standard QA Verify mode** — sends the uploaded image to the AI with a verification question. If the answer does not pass, the upload is rejected with a configurable error text.
- **AI attribution label** — `AI.Llama.Standard.QA` and `AI.Llama.Standard.TxtQA` display an `✨ AI-Generated` hint (configurable via `AIHint`) on AI-produced answers, satisfying EU AI Act transparency requirements.

#### 🔒 Privacy & DSGVO/GDPR Compliance

| Feature | Processing Location | DSGVO-Compliant | External Calls |
|---|---|---|---|
| `AI.Llama.Chat` | Local server | ✅ Yes | Brave Search (opt-in) |
| `AI.Llama.Standard.QA` | Local server | ✅ Yes | Brave Search (opt-in) |
| `AI.Llama.Standard.TxtQA` | Local server | ✅ Yes | Brave Search (opt-in) |
| `AI.OCR` | Local server (JNI) | ✅ Yes | None |
| `Media.Input.Speech.Whisper` | Local server | ✅ Yes | None |
| `Media.Input.Speech` | Cloud (Google/MS) | ⚠️ Needs consent | Google / Microsoft |

> **Note on virtualized environments (Media.Input.Speech only):** When using in-browser audio APIs under virtualization layers such as WSLg, browsers do not behave identically. Google Chrome supports hardware passthrough natively and reliably. Microsoft Edge (due to differing sandbox policies) and Firefox (due to package containers and strict privacy restrictions on the Web Speech API) may require manual configuration or fallbacks. This does not affect `Media.Input.Speech.Whisper`, which uses the standard `getUserMedia()` API for raw audio capture and processes speech on the local server.

Key compliance properties:

- **No data leaves the server** for LLaMA, Whisper, and Tesseract — all inference is `localhost`-only (unless an external AI to use is specified or BraveAPI-Search is enabled).
- **AI Proxy** with IP whitelist and HTTP Basic Auth gates external access to the AI endpoints. All requests are logged to a database table with anonymised credentials (SHA-256) and truncated IPs.
- **No separate server infrastructure** — the entire AI stack runs on the same machine as formcycle.
- **Image caching** uses server-side temporary storage with automatic expiration (default: 600 s) and a janitor thread. Caching is only used on images that're uploaded along with a cache-id. Otherwise the images are kept in RAM only.

#### ⚙️ Configuration

AI features are activated via formcycle plugin properties:

| Property | Default | Description |
|---|---|---|
| `Active_AI` | — | Space-separated list of engines to enable (e.g., `llama_engine`) |
| `AI_LLAMA_ENGINE_Port` | `8392` | Local port for the LLaMA server |
| `AI_LLAMA_ENGINE_Threads` | Physical cores | CPU threads for inference |
| `AI_LLAMA_ENGINE_CtxSize` | `32768` | Context window size (tokens) |
| `AI_LLAMA_ENGINE_GpuLayers` | `-1` (auto) | Number of layers offloaded to GPU (`-1` = all, `0` = CPU only) |
| `AI_LLAMA_ENGINE_MaxConcurrent` | `2` | Maximum parallel inferences |
| `AI_Proxy_AllowedIPs` | — | CIDR/IP whitelist for the AI proxy |
| `AI_Proxy_Users` | — | HTTP Basic Auth credentials for external proxy access |

#### 🌐 Network Requirements

If the server has outbound internet access, CodBi downloads models and binaries automatically. Whitelist these domains:

- `github.com`, `objects.githubusercontent.com` — llama.cpp and whisper.cpp releases
- `huggingface.co` — Whisper GGML models
- `api.search.brave.com` — Brave Search API (only if internet search is enabled)

#### 🔌 Air-Gapped / Offline Deployment

For environments without outbound internet access, you can pre-place all required files manually. The plugin checks for existing files before attempting any download.

**Directory structure** (relative to the plugin's data directory):

| Component | Files to place | Directory |
|-----------|---------------|-----------|
| **LLaMA binaries** | Archive (ZIP/tar.gz) + `release-tag.txt` + `gpu-backend.txt` | `ai/llama_engine/bin/` |
| **LLaMA model** | `.gguf` model + multimodal projection (if applicable) | `ai/llama_engine/models/` |
| **Whisper binaries** | Archive (ZIP/tar.gz) | `ai/whisper/bin/` |
| **Whisper model** | `.ggml` model file | `ai/whisper/models/` |
| **Tesseract models** | `.traineddata` files | `Resources/AI/Tesseract/Models/` |
| **Tesseract native libs** | Platform DLLs/SOs | `Resources/AI/Tesseract/Runtime/{platform}/` |

**Marker files:** For LLaMA and Whisper, the plugin requires a `.complete` marker file (can be empty) next to each archive and model file. Without the marker, the plugin assumes the file is incomplete and attempts to re-download. Example:

```
ai/llama_engine/models/Qwen3VL-2B-Instruct-Q4_K_M.gguf
ai/llama_engine/models/Qwen3VL-2B-Instruct-Q4_K_M.gguf.complete   ← marker
ai/llama_engine/bin/release-tag.txt                                 ← e.g. "b8175"
ai/llama_engine/bin/gpu-backend.txt                                 ← e.g. "VULKAN", "CUDA", or "NONE"
```

**Tesseract** does not require marker files — just place the `.traineddata` and native library files directly.

> **Tip:** The KDoc comments in the Kotlin source files document the exact download URLs and expected file names for each component.

### 🤖 Form Assistant

The **Form Assistant** is the AI co-pilot inside the formcycle form designer. A designer describes what they want in plain language — "add an address block", "make this a two-page form", "translate the whole form into English" — and the assistant plans the change, generates a valid form document, asks focused follow-up questions when a decision is genuinely needed, and explains its work in the chat. It is served by [`AICodBiAssistant`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt), works with **any** configured AI (local GGUF models via llama.cpp or external endpoints / BYOK), and is built so the model only ever receives the information a given step actually needs.

#### 💡 What it does

- **Generate & iterate on forms** — create new form structures (fields, containers, pages, buttons, uploads, …) and modify existing ones *in place*, preserving everything the request does not target. Elements are always wired to the installed widget set and the CodBi standard configurations.
- **Form chat** — answer questions about the current form ("which fields are required?", "where is the e-mail field used?") and discuss changes before they are applied.
- **Targeted clarification** — asks the user only for decisions that cannot be derived (e.g. missing select options, a missing appointment plan), instead of guessing.
- **On-demand reference material** — when a step needs the exact JSON of a widget or CodBi element, it requests just that reference rather than shipping the entire catalog up front.
- **Change log & re-apply** — every run records what changed, and a recorded change can be re-applied deterministically without any new inference.
- **Prompt manager** — the assistant's prompt blocks are versioned and seeded into the database by `PromptLoader`, so behaviour can be inspected, tuned and updated per server without changing code.
- **Workflow generation** — can create workflow nodes and triggers, bind submit triggers to buttons, and keep the workflow consistent with the form.
- **Translations** — whole-form translation (one language per step), incremental *delta* translation for edits, and multilingual consumer mails / end pages.
- **Correct buttons & navigation** — sets button actions (submit commands, page navigation) and, when the navigation plugin is installed, uses its logical action so buttons keep working even if a page is renamed.
- **Server-side guard rails** — the finished document is normalised and repaired (deduplicated elements, valid SVG names, page ordering, restored stripped fields, repaired orphaned elements) before it is returned.

#### 🚀 Advantages

- **Drastically faster form development** — a working draft of a form (or a change to one) is produced in a single conversation turn instead of being assembled field by field in the designer.
- **Fewer errors** — the assistant emits validated, canonical JSON: correct class names, correct property casing, wired containers, required options and standard configurations are applied consistently, and the server-side guard rails fix common structural mistakes automatically.
- **Extremely lower business costs** — the multi-pass, demand-driven design keeps the (input-heavy) LLM bill small: irrelevant prompt blocks are gated away, large references are loaded only when requested, changes are expressed as diffs instead of whole-form re-emissions, redundant inferences are skipped, and recorded changes can be re-applied with zero inference.
- **Flexible deployment, no extra data-protection burden** — the assistant runs with **either** a local model **or** an external provider (BYOK), so a local stack can keep the whole pipeline on the formcycle server while external endpoints remain an option. What the model receives is the form *definition* (fields, labels, layout, widget metadata) — not submitted citizen data — so the inference call itself does not introduce a DSGVO/GDPR-relevant data category, whichever provider is configured.
- **Governance & traceability** — every run is logged with tokens/cost and the changes it made; the change log can be audited and re-applied.
- **No vendor lock-in** — the same assistant works with local models or external providers, and models can be mixed per role.
- **Low page weight** — generated forms only pull in the elements they actually use.

#### ⚙️ Inference flow & token usage

Each generation step is a full LLM completion, so the cost is dominated by **input tokens**. The pipeline therefore spends most of its effort making sure every step receives *only* what it needs — without dropping anything the model must act on.

The flow is multi-pass and demand-driven:

1. **Classify intent** — a cheap prompt decides `form` / `workflow` / `both`.
2. **Chat (two-tier)** — a tier-1 call sees only a condensed structure (never the full form JSON); the full form is attached to a tier-2 call **only** when a question is actually asked. Turns that are pure answers/acknowledgements end here.
3. **Clarify (optional)** — normally skipped entirely; when it does run, scenario blocks are gated and the form list is fetched on demand.
4. **Form PASS 1** — emits a *diff* (only changed/new items) using gated decision cores and condensed catalogs.
5. **Form PASS 2** — runs only when pass-1 asks for details (`need_codbi_details`), sending just the requested widget/CodBi templates; a forced final pass fixes non-JSON output while reusing the pass-2 context.
6. **Translation** — one language per pass (whole form) or a delta view with bounded batches (edits).
7. **Server-side merge** — changed items are grafted by name; omissions mean "unchanged" and the server restores the original values.
8. **Apply-from-log** — replaying a stored artifact needs **zero** inference.

```mermaid
flowchart LR
    RUN(["POST /Run<br/>prompt + persist + histories"]) --> CLS

    CLS["Path 0 · Classify intent<br/>classify intent<br/>(form / workflow / both)<br/><br/>Reduction:<br/>• no second inference<br/>• auxiliary model per role<br/>• reasoning budget:<br/>&nbsp;&nbsp;UI > specialist > global<br/>• ≈ 2.1 k in"]

    CLS --> T1

    T1["Path 1 · Chat tier-1<br/>condensed structure,<br/>full form JSON WITHHELD<br/><br/>Reduction:<br/>• withhold ~60 KB form<br/>• answer/ack ends the run<br/>&nbsp;&nbsp;before any build pass<br/>• tier-1 ≈ 11 k in<br/>&nbsp;&nbsp;vs 116 k chars form"]

    T1 -->|"hasInstructions = false"| ANS(["Answer / ack only<br/>NO build pass"])
    T1 -->|"hasInstructions = true"| T2

    T2["Path 1 · Chat tier-2<br/>full form JSON included<br/><br/>Reduction:<br/>• sent only when<br/>&nbsp;&nbsp;hasQuestion = true"]

    T2 --> CLR
    T1 --> CLR

    CLR["Path 2 · Clarify check (optional)<br/>runs only when tier-1<br/>needsClarification<br/>or a reference veto<br/><br/>Reduction:<br/>• whole round skipped<br/>&nbsp;&nbsp;by default<br/>• <!--CLARIFY:--> gating<br/>&nbsp;&nbsp;(fail-open: no tag = kept)<br/>• form list only on<br/>&nbsp;&nbsp;need_form_list<br/>• was 8.7 k in → often 0"]

    CLR -->|"NO_CLARIFICATION"| P1
    CLR -->|"questions"| ASK(["Clarification popup<br/>user answers → re-run"])

    P1["Path 3 · Form PASS 1<br/>gated decision cores +<br/>condensed catalogs<br/><br/>Reduction:<br/>• cores de-duplicated<br/>&nbsp;&nbsp;(single home per rule)<br/>• <!--SECTION:--> gating:<br/>&nbsp;&nbsp;field_creation, removal,<br/>&nbsp;&nbsp;designed_text, svg,<br/>&nbsp;&nbsp;custom_js, translation,<br/>&nbsp;&nbsp;repeatable, panels<br/>• NAME-ONLY CodBi index<br/>• condensed widget catalog<br/>• diff protocol:<br/>&nbsp;&nbsp;changed/new items only<br/>• 27 blocks ≈ 17 k chars<br/>&nbsp;&nbsp;dropped per build run"]

    P1 -->|"no details needed"| MRG
    P1 -->|"need_codbi_details"| P2
    P1 -->|"intent = workflow / both"| W1

    P2["Path 4 · Form PASS 2<br/>only the requested<br/>widget / CodBi details<br/>+ targeted templates<br/><br/>Reduction:<br/>• targeted templates only<br/>• avoids the full widget<br/>&nbsp;&nbsp;reference (~20–25 k)<br/>• sliceFormForPass2<br/>• slimPersistJson:<br/>&nbsp;&nbsp;relevant slice only"]

    P2 --> MRG
    P2 -->|"non-JSON / prose"| FIN

    FIN["Path 4b · Forced final pass<br/>same context as PASS 2<br/><br/>Reduction:<br/>• only on non-JSON<br/>• reuses the pass-2 context,<br/>&nbsp;&nbsp;no re-assembly"]

    FIN --> MRG

    W1["Path 6 · Workflow PASS 1<br/>condensed node / trigger<br/>catalog<br/><br/>Reduction:<br/>• condensed catalog<br/>• schemas deferred to PASS 2"]

    W1 -->|"need_workflow_node_details"| W2

    W2["Path 6 · Workflow PASS 2<br/>only the requested<br/>node / trigger schemas<br/><br/>Reduction:<br/>• schemas on demand"]

    W2 --> APL
    W1 --> APL

    MRG["Path 7 · Merge / splice<br/>splicePass2IntoPass1<br/>(property-level graft)<br/><br/>Reduction:<br/>• _diff / _removeProps<br/>• omit = unchanged<br/>• server restores the value<br/>• lossless, no full<br/>&nbsp;&nbsp;re-emission"]

    MRG -->|"adds / edits a language"| TR
    MRG --> APL

    TR["Path 5 · Translation<br/>whole-form: ONE language<br/>per pass<br/>edit: DELTA view +<br/>bounded batches<br/><br/>Reduction:<br/>• only the delta,<br/>&nbsp;&nbsp;not the whole form<br/>• batching: group small<br/>&nbsp;&nbsp;languages together"]

    TR --> APL

    APL["Path 7 · Apply to Formcycle<br/>nodes / items persisted<br/><br/>Reduction:<br/>• none — the write itself<br/>&nbsp;&nbsp;costs no tokens"]

    APL --> PUB
    LOG["Path 8 · Apply-from-log<br/>replay a stored artifact<br/>deterministically<br/><br/>Reduction:<br/>• zero inference<br/>• 0 tokens"] -->|"re-apply"| PUB

    PUB(["Publish + log tokens & cost"]) --> OUT(["Form JSON to UI"])

    CACHE["Cross-cutting ·<br/>opt-in prompt caching<br/>cache-friendly prefix<br/>(AI_Assistant_PromptCaching)"] -.-> P1
    CACHE -.-> P2
    ESC["Cross-cutting ·<br/>compact + unescaped payloads:<br/>• HTML-escaping off<br/>• compact JSON<br/>• in every AI payload<br/>&nbsp;&nbsp;and change-log row"] -.-> RUN
    AUX["Cross-cutting ·<br/>auxiliary model per role<br/>AI_Assistant_AuxModel<br/>• _classify · _clarify<br/>• _repair · _translate"] -.-> CLS
    AUX -.-> CLR
```

**How the token usage is reduced — per step**

- **Skip whole inferences**
  - Answer/acknowledgement chat turns end before any build pass.
  - The clarify round is skipped by default (a tier-1 verdict + deterministic detectors decide).
  - A form/workflow build sends the same content to the pass that acts on it — no duplicate classification call.
- **Send big references only on demand**
  - Pass-1 gets a NAME-ONLY CodBi index and condensed widget catalog; full templates arrive in pass-2 only when requested (`need_codbi_details`).
  - Workflow node/trigger schemas are fetched in a second pass only when needed.
  - The clarify form list is fetched only on `need_form_list`.
  - Only the *requested* widget/CodBi templates are sent — never the full widget reference (~20–25 k tokens).
- **Gate the prompt blocks**
  - Decision cores carry `<!--SECTION:…-->` tags; a pass keeps only the relevant ones (e.g. a build run keeps `field_creation` and drops `translation`/`removal`/…, ≈ 17 k characters per run).
  - Clarification scenario blocks use `<!--CLARIFY:…-->`.
  - The gate is **fail-open**: an unmatched tag is *kept*, so no rule the model needs is ever dropped.
- **Shrink the payload**
  - Compact JSON everywhere and HTML-escaping disabled (`slimPersistJson`, `sliceFormForPass2`) — pass-2 receives a relevant slice, not the whole form.
  - Exactly one home per rule (decision cores de-duplicated), so rules are never sent twice.
- **Shrink the output**
  - A diff protocol (`_diff`, `_removeProps`) means "omit = unchanged"; the server restores omitted values, so it is lossless.
  - Translations use a delta view and bounded batching, so output scales with the change, not the form size.
- **Re-use instead of re-generating**
  - The change-log "apply" path replays a stored artifact with **zero** inference.
- **Cross-cutting configuration**
  - Optional cache-friendly prompt assembly (`AI_Assistant_PromptCaching`).
  - Optional per-role auxiliary models (`AI_Assistant_AuxModel`, `AI_Assistant_AuxModel_classify|_clarify|_repair|_translate`) so cheap work can run on a cheaper model.
  - Reasoning budget resolves from the UI → specialist → global → provider default.

Measured reference run (a plain edit): `form-pass-2` ≈ 48 %, `form-pass-1` ≈ 34 %, `clarify-check` ≈ 15 %, `classify-intent` ≈ 3.5 % — input tokens are ≈ 92 % of the bill, which is why the measures above target input.

> Prompt blocks are seeded into the database by `PromptLoader`; edits to the bundled `.md` prompts (or the section tags) take effect after a plugin rebuild/redeploy and a fresh seed.

## 🌍 Localization

The plugin ships with German and English. You can customize localized messages via I18N variables in the backend (`Files & templates` → `I18N variables`).

| I18N Key | Description |
|---|---|
| `plugin.form_designer_resource.name` | Designer resource display name |
| `plugin.form_designer_resource.desc` | Designer resource description |
| `plugin.form_properties_extension.name` | Form properties extension name |
| `plugin.form_properties_extension.desc` | Form properties extension description |
| `plugin.form_render_callback.name` | Form render callback name |
| `plugin.form_render_callback.desc` | Form render callback description |
| `plugin.form_resources.name` | Frontend resources name |
| `plugin.form_resources.desc` | Frontend resources description |
| `designer.category.codbi_panel` | CodBi designer category label |
| `designer.property.enable_codbi` | Enable CodBi toggle label |
| `designer.property.standards` | Standard Configurations property label |
| `designer.property.config_template` | Config template selector label |
| `designer.property.config_template.option.default` | Default template option label |
| `designer.property.config_template.option.xtensible` | XTensible template option label |

## ➕ Adding New Configuration Templates

To add a new configuration template for the code library that the user can select in the form designer:

* Open `src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-config-template.properties`
  and add a new line with the technical name of the template.
* Open each `src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/i18n_*.properties` and
  add a localized string for the new template for each language. (The key should be called
  `designer.property.config_template.option.NAME`).
* Add a TypeScript file with the contents of the template in
  `src/main/web/packages/form/src/index-config-template-NAME.ts`

Note: The __technical name must contain only letters, numbers, and dashes__ (0-9, a-z, A-Z, -).

## 💻 Development

This is a [Maven](https://maven.apache.org/) project that requires Maven to build. It also uses
[yarn](https://yarnpkg.com/) for the frontend resources. You do not need to install yarn or node.js, the
[frontend-maven-plugin](https://github.com/eirslett/frontend-maven-plugin) automatically downloads and installs the
required tools locally.

> The following assumes you are using Linux or macOS. For Windows, substitute `./mvnw` with `mvnw.cmd`.
> 

### 🔨 Build

See also the IDE section below. To build the plugin via the command line:

```shell
./mvnw clean package
```

For quick builds with non-minified resources and no tests, use:

```shell
./mvnw package -P dev
```

To start a formcycle server (on port 8080 if free) with the plugin, use:

```shell
./mvnw fc-server:run-ms-war
```

Then open [http://localhost:8080/xima-formcycle](http://localhost:8080/xima-formcycle) in your browser. The default
username and password are `sadmin / admin`.

To build and upload the plugin to the locally running formcycle server:

```shell
./mvnw -P dev fc-deploy:deploy 
```

(If port 8080 was not free, the server will have started on another free port such as 8081. In this case,
you need to add `-DfcDeployUrl=http://localhost:PORT/xima-formcycle` to the command.)

### 🧪 Test

Tests are run automatically during the build. To run the tests explicitly:

```shell
./mvnw test
```

To run the frontend tests explicitly via Jest for a particular package:

```shell
cd src/main/web/packages/form
yarn test
```

### 🖥 IDE

For common IDEs, there are some configurations in the `ide` folder. These are pre-configured settings for VSCode,
IntelliJ, and Eclipse.

* __Eclipse__ Several launch configurations, e.g. for starting a formcycle server with the plugin installed, and to
  upload the plugin to a running server.
  * You may need to install the [Enhanced Kotlin for Eclipse](https://github.com/bvfalcon/kotlin-eclipse-2024).
  * Eclipse does not support [Maven Wrapper](https://maven.apache.org/wrapper/). You may need to `-Denforcer.skip` when
    you see the build fail due to the wrong Maven version getting used.
* __IntelliJ__ Several run configurations, e.g. for starting a formcycle server with the plugin installed, and to upload
  the plugin to a running server.
  * Make sure you also set the default encoding for Java properties files to UTF-8, see `Editor` -> `File Encodings`
    -> `Default encoding for properties files`. 
  * To regenerate auto generated resources, open the Maven window and click on the regenerate button in the toolbar at
    the top.
* __Visual Studio Code__ A workspace file with all workspaces configured. Just go to `File` ->
  `Open Workspace from File` and select file in the `ide/vscode` folder.
  * The workspace also contains a few extension recommendations that you should install.
  * When you first open a TypeScript file, the IDE will ask for permission, click on `Allow` to enable TypeScript
    support.

We recommend IntelliJ for the backend Kotlin code and Visual Studio Code for the frontend CSS + TypeScript code.

Note: There are some auto-generated files, such as
`target/generated-sources/com/github/xima/xima_formcycle_entwicklerkreis/fc/plugin/codbi/EMessageKey.kt`.
If you are using IntelliJ, you may need to press the `Generate Sources` button at the top of the Maven window.

### 🐛 Debugging

For the server-side Kotlin code: You can attach to the JVM process via any remote debugging tool of your choice. When
you start the formcycle server  via the IDE in debugging mode, you should be able to simply set a breakpoint anywhere in
the JVM code.

For the client-side TypeScript code: You can use the browser's developer tools to debug the code. If you built the
plugin with the `dev` profile, the transpiled JavaScript file will contain an inline source map that lets your browser
show you the original TypeScript code in the debugger.

### 🎨 Code Style / Formatting

We use [spotless](https://github.com/diffplug/spotless/blob/main/plugin-maven/README.md) to format all code. There's
also a git hook that's installed automatically and formats code upon commit. If you want to format the code manually,
you can run:

```shell
./mvnw spotless:apply
```

This will format all code in the project.

Note: For Kotlin, this uses [ktfmt](https://facebook.github.io/ktfmt/). They have a plugin for IntelliJ. If you use it,
just leave the code style to the default value `Meta`.  For CSS and TypeScript, this uses [biome](https://biomejs.dev/).
They have an extension for Visual Studio Code.

### 📁 Project Structure

**Code generation**

The folder `src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/`
contains several properties files:

* `constants.properties` - Constant strings that are used in the Kotlin and TypeScript code. For example, contains
  the technical names of the additional properties available in the form designer. 
* `i18n_*.properties` - Localized strings for the Kotlin and TypeScript code.
* `codbi-config-template.properties` - List of available configuration templates for the code library. The key is an
  arbitrary identifier, the value is used to identify the template. Usually key is equal to the value.

These are needed by both the Kotlin and TypeScript code. To ensure consistency, the Maven build generates Kotlin files
and TypeScript files from these properties files. To generate these files manually, run the `generate-sources` Maven
goal.

```shell
./mvnw generate-sources
```

Your IDE of choice may do this automatically, or may  have a button to do this.

**Backend (Kotlin)**

The backend code uses Kotlin, with Maven as a package manager. All code resides in the package
`com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi`.

**Frontend (CSS + TypeScript)**

The frontend CSS and TypeScript resources are in the `src/main/web` folder. It uses [Yarn Berry](https://yarnpkg.com/)
as the package manager, with [PnP](https://yarnpkg.com/features/pnp) enabled. The project consist of the root package
and 3 sub packages in the `packages` folder. Each package is also a separate Yarn workspace:

* `packages/common` - Common code needed by the other 2 packages.
* `packages/designer` - Code for the form designer, e.g. to add new properties to the form designer.
* `packages/form` - Code for the web form, i.e. the actual code library, such as additional validator functions etc.

We use TypeScript to ensure the code is consistent and conforms to the formcycle API. Formcycle provides packages that
contain the types for the form designer API (`@de-xima/fc-form-designer`) and the web form API
(`@de-xima/fc-form-renderer`).

For simplicity, we use plain CSS (no preprocessor such as SASS), but allow recent CSS features such as
[nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting). The CSS gets processed by
[postcss](https://postcss.org/) during the build to be compatible with older browsers.

Unit tests use [Jest](https://jestjs.io/).

## 📄 [API Documentation](https://xima-formcycle-entwicklerkreis.github.io/CodBi/)

### 🌐 Automated Documentation Translation / BYOK

The `scripts/generate-docs.ps1` pipeline automatically translates TSDoc/KDoc comments into other languages (German, Italian, etc.) using `scripts/translate-docs.mjs`. Translation also runs automatically on GitHub CI (via `.github/workflows/docs.yml`) on every push to `main` that touches source files, using the `GOOGLE_TRANSLATE_API_KEY` repository secret. By default, the local script uses Google Translate's free (unofficial) GTX endpoint for demonstration purposes, which requires no API key but has no uptime or availability guarantee.

To use the **official Google Cloud Translation API v2** instead, provide an API key via one of these methods (checked in order):

1. **Environment variable:**
   ```shell
   export GOOGLE_TRANSLATE_API_KEY=AIzaSy...
   ```
2. **`.env` file** in the repository root (already gitignored):
   ```
   GOOGLE_TRANSLATE_API_KEY=AIzaSy...
   ```

To obtain an API key, enable the [Cloud Translation API](https://console.cloud.google.com/apis/library/translate.googleapis.com) in a Google Cloud project and create an API key in the [Credentials](https://console.cloud.google.com/apis/credentials) page. The free tier includes as for now 500,000 characters/month.

If no API key is found, the script silently falls back to the free GTX endpoint — no configuration needed.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, code style, and pull request workflow.

## 📜 License & Authorship

- **Initial Author & Lead Architect:** Salvatore Callari ([@CallariS](https://github.com/CallariS))
- **Joint Cooperation:** Bavarian formcycle developer community

Special thanks to:
* **Bernd, Zipser** and **Ingmar, Ott** for their support in allowing this project to be developed alongside my regular responsibilities.
* **[Andre Wachsmuth](https://github.com/awa-xima)** for providing the initial build and architecture foundation, as well as his invaluable guidance throughout the project.
* **[Jennifer Schindler](https://github.com/er-js)** for her valuable code contributions, overall management, and for advocating and promoting CodBi within the developer community.
* **[Benedikt Plangger](https://github.com/N64Freak1986)** & **[Florian, Christ](https://github.com/FlorianChristCo)** for their valuable code contributions.
* **[Matthias Wagner](https://github.com/ER-WagnerMatth)** for his administrative work.

Licensed under the [MIT License](LICENSE).

⚠️ Disclaimer

**Legal & Compliance**: While CodBi is designed with a "Privacy-First" approach to aid in GDPR-compliant AI integration, the use of this software does not automatically guaranteed legal compliance. The end-user is solely responsible for ensuring that the local deployment, the models used (GGUF/GGML), and the data processing workflows meet all local and international data protection regulations.

**AI Accuracy**: This software utilizes Artificial Intelligence and Optical Character Recognition (OCR). AI models are probabilistic and may produce inaccurate, biased, or hallucinated results. Decisions based on AI-generated content should always be verified by a human, especially in administrative or legal contexts.

**No Liability**: As per the MIT License, this software is provided "as is". The authors are not liable for any data loss, system instability, or legal repercussions arising from the use of the plugin or the automatically downloaded third-party binaries (llama.cpp, whisper.cpp, etc.).