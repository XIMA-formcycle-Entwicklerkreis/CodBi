# CodBi – KI-Komponenten: ReadMe & Compliance-Guide

> **Zielgruppe:** Administratoren, Datenschutzbeauftragte, Sicherheitsverantwortliche und Entwickler,  
> die CodBi in XIMA formcycle betreiben oder evaluieren.

---

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [KI-Architektur](#2-ki-architektur)
3. [Komponenten im Detail](#3-komponenten-im-detail)
   - 3.1 [LLaMA (Sprachmodell)](#31-llama-sprachmodell)
   - 3.2 [Whisper (Spracherkennung)](#32-whisper-spracherkennung)
   - 3.3 [Tesseract (OCR)](#33-tesseract-ocr)
   - 3.4 [AI-Proxy](#34-ai-proxy)
   - 3.5 [Brave Search (Websuche)](#35-brave-search-websuche)
   - 3.6 [MailBridge (KI-E-Mail)](#36-mailbridge-ki-e-mail)
   - 3.7 [Geolokalisierung](#37-geolokalisierung)
4. [Modelle und Download-Quellen](#4-modelle-und-download-quellen)
5. [Konfigurationsreferenz](#5-konfigurationsreferenz)
6. [Netzwerkfreigaben](#6-netzwerkfreigaben)
7. [Datenschutz (DSGVO)](#7-datenschutz-dsgvo)
8. [EU-KI-Verordnung (AI Act)](#8-eu-ki-verordnung-ai-act)
9. [Sicherheitsarchitektur](#9-sicherheitsarchitektur)
10. [Externe KI-Dienste und Risikobewertung](#10-externe-ki-dienste-und-risikobewertung)
11. [Betrieb und Monitoring](#11-betrieb-und-monitoring)
12. [Checkliste für den produktiven Betrieb](#12-checkliste-für-den-produktiven-betrieb)

---

## 1. Überblick

**CodBi** ist ein XIMA-formcycle-Plugin (Kotlin + TypeScript), das einen vollständig **lokal betriebenen KI-Stack** direkt auf dem formcycle-Applikationsserver bereitstellt. Es gibt keine obligatorischen Cloud-Abhängigkeiten — alle KI-Inferenz-Prozesse kommunizieren ausschließlich über `127.0.0.1`.

Das Plugin bündelt vier KI-Funktionsbereiche:

| Bereich | Technologie | Zweck |
|---|---|---|
| **Textgenerierung / Chat** | llama.cpp (LLaMA-Server) | Formular-Assistent, Frage-Antwort, Dokumentenanalyse |
| **Spracherkennung** | whisper.cpp (Whisper-Server) | Audioeingabe / Diktat in Formularen |
| **Texterkennung (OCR)** | Tesseract JNI (tess4j) | Scan- und Bilddaten aus Formular-Uploads |
| **KI-Proxy-API** | AiProxy (Reverse-Proxy) | Authentifizierter Zugang zu allen KI-Diensten für externe Clients |

Alle vier Komponenten sind unabhängig aktivierbar (Property `Active_AI`).

---

## 2. KI-Architektur

```
formcycle-Server (JVM / Apache Tomcat)
  └── CodBi-Plugin (Kotlin)
        ├── AI.kt                    — Semaphore (FIFO), Queue, Bild-Cache
        ├── AiProxy.kt               — Authentifizierter HTTP-Reverse-Proxy
        ├── BraveSearch.kt           — Optionale Websuche (Opt-In)
        ├── MailBridge.kt            — KI-gesteuerter E-Mail-Versand (Opt-In)
        ├── UrlFetcher.kt            — SSRF-gesicherter HTML-Fetcher
        └── ai/
              ├── LLAMA.kt           — Abstrakte LLaMA-Basisklasse
              ├── llama/Standard.kt  — Qwen3-VL + Thinking + Specialists
              ├── Whisper.kt         — whisper.cpp Wrapper
              ├── Tesseract.kt       — OCR via tess4j JNI
              └── commons/           — Gemeinsame Infrastruktur
```

**Externe KI-Prozesse** (laufen als Kind-Prozesse der JVM):

| Prozess | Standardport | Funktion |
|---|---|---|
| `llama-server` (Haupt) | `localhost:8392` | Texte, Bilder, Chat |
| `llama-server` (Thinking) | `localhost:8492` | Erweitertes Reasoning (+100 zum Hauptport) |
| `llama-server` (Specialist N) | `localhost:8592+` | Optionale Fachmodelle |
| `whisper-server` | `localhost:8393` | Spracherkennung |
| Tesseract JNI | *(kein HTTP-Port)* | In-Process OCR |

> **Crashisolation:** LLaMA- und Whisper-Server laufen als separate OS-Prozesse. Ein Speicherüberlauf (OOM) im Modell beendet nur den Kind-Prozess — die formcycle-JVM und das Plugin bleiben stabil. CodBi erkennt den Ausfall und startet den Prozess automatisch neu.

---

## 3. Komponenten im Detail

### 3.1 LLaMA (Sprachmodell)

**Technologie:** [llama.cpp](https://github.com/ggml-org/llama.cpp) — open-source C++-Inferenz-Engine für GGUF-Modelle

**Standardmodell:** Qwen3-VL 2B Instruct (Q4\_K\_M) — multimodales Modell (Text + Bild)

**Modi:**

| Modus | Beschreibung |
|---|---|
| **Standard-Chat** | Konversation, Dokumentenanalyse, Formularunterstützung |
| **Thinking-Modus** | Erweitertes Reasoning auf separatem Server (Timeout: 600 s) |
| **Specialist-Modus** | Aufruf eines benannten Fachmodells via `specialist=<Name>` |
| **Externer Modus** | Weiterleitung an eine OpenAI-kompatible API (z. B. GPT-4o, Groq, Gemini) |
| **Vision** | Bild-/PDF-Analyse über eingebettete Base64-Bilder |

**Hardware-Beschleunigung** (automatische Erkennung in absteigender Priorität):

1. NVIDIA CUDA 12
2. Vulkan (AMD, Intel, alle Vulkan-fähigen GPUs)
3. CPU (universelle Fallback-Option)

**Kontextfenster:** 32 768 Tokens (konfigurierbar)

---

### 3.2 Whisper (Spracherkennung)

**Technologie:** [whisper.cpp](https://github.com/ggerganov/whisper.cpp) — C++-Port des OpenAI Whisper-Modells

**Standardmodell:** `ggml-small.bin` (~466 MB)

**Features:**
- Kompatibel mit der OpenAI `/v1/audio/transcriptions`-API
- Automatische Sprachendetektion (opt-in via `AI_Whisper_AutoDetectLanguage`)
- GPU-Unterstützung (abschaltbar mit `AI_Whisper_NoGpu`)
- Optionale Nutzung einer externen STT-API

> **Hinweis zur Browser-Web-Speech-API:** Die formcycle-Formulareingabe über `Media.Input.Speech` nutzt ggf. die **Browser-eigene Web Speech API** (Google/Microsoft Cloud). Dies ist **unabhängig** von CodBi Whisper und erfordert eine separate DSGVO-Einwilligung der Nutzenden.

---

### 3.3 Tesseract (OCR)

**Technologie:** [tess4j](https://github.com/nguyenq/tess4j) 5.16.0 — Java-Binding für Tesseract OCR

**Besonderheit:** Tesseract läuft vollständig **in-process** (kein separater OS-Prozess, kein HTTP-Port). Die nativen JNI-Bibliotheken werden plattformspezifisch geladen.

**Modi:**

| Modus | Beschreibung |
|---|---|
| `print` | Gedruckten Text aus Bildern/PDFs extrahieren |
| `extract` | Strukturierte Felderkennung per Regex |
| `verify` | Prüfung auf erkannte Zeichenfolgen |

**Sprachen:** Konfigurierbar via `AI_Tesseract_Languages` (Standard: `deu`); Multiple Sprachen mit `+` verbinden (z. B. `deu+eng`).

**PDF-Verarbeitung:** PDFs werden via Apache PDFBox in Bilder gerastert, bevor Tesseract OCR angewendet wird.

---

### 3.4 AI-Proxy

Der **AiProxy** ist ein authentifizierter HTTP-Reverse-Proxy, der externen Clients (z. B. anderen Applikationen, Benutzeroberflächen) einen gesicherten Zugang zu den lokalen KI-Diensten ermöglicht.

**Base-URL:**
```
POST <formcycle-base>/plugin?name=CodBi_AI_Proxy&endpoint=<path>
```

**Verfügbare Endpunkte:**

| Endpunkt | Engine | Beschreibung |
|---|---|---|
| `/v1/chat/completions` | LLaMA | OpenAI-kompatibles Chat (inkl. Vision, Streaming) |
| `/completion` | LLaMA | Raw Completion (llama.cpp Low-Level-API) |
| `/v1/audio/transcriptions` | Whisper | Speech-to-Text (OpenAI-kompatibel) |
| `/v1/ocr` | Tesseract | Texterkennung aus Bildern |

**Authentifizierung (zweistufig):**

1. **IP-Whitelist** (`AI_Proxy_AllowedIPs`): CIDR-Bereiche und Einzel-IPs; eine leere Liste blockiert alle Anfragen
2. **HTTP Basic Auth** (`AI_Proxy_Users`): Format `benutzer:passwort,benutzer2:passwort2`

**Sonderfunktionen:**

| HTTP-Header | Beschreibung |
|---|---|
| `X-Thinking: true` | Aktiviert den Thinking-Modus (Timeout: 600 s, Port +100) |

**Audit-Logging:** Jede Proxy-Anfrage wird in der Tabelle `codbi_ai_proxy` erfasst (siehe [Abschnitt 7](#7-datenschutz-dsgvo)).

---

### 3.5 Brave Search (Websuche)

**Aktivierung:** Opt-In durch Setzen von `AI_BraveSearch_ApiKey`

Das Sprachmodell kann eigenständig Websuchen auslösen, indem es das Muster `CALL:search(<Suchanfrage>)` in seiner Antwort produziert. Der `WebSearchHandler` fängt dieses Muster ab, ruft die Brave Search API auf und integriert die Ergebnisse in den Kontext.

**Konfiguration:**

| Property | Standard | Beschreibung |
|---|---|---|
| `AI_BraveSearch_ApiKey` | *(leer)* | API-Schlüssel — aktiviert die Websuche |
| `AI_BraveSearch_MaxResults` | `5` | Ergebnisse pro Suche (1–20) |
| `AI_BraveSearch_FilterResults` | `false` | Sichere Suche / Ergebnisfilterung |

> **Datenschutz:** Bei aktivierter Websuche werden Suchanfragen an die Brave Search API übermittelt. Kein Nutzername und keine IP-Adresse werden weitergegeben. Eine Auftragsverarbeitungsvereinbarung (AVV) mit Brave ist zu prüfen.

---

### 3.6 MailBridge (KI-E-Mail)

**Aktivierung:** Opt-In durch `AI_Mail_Enabled = true`

Ermöglicht dem Sprachmodell, E-Mails im Namen des Systems zu versenden. Enthält mehrere Sicherheitsstufen:

- **Empfänger-Whitelist** per Regex (`AI_Mail_AllowedRecipients`)
- **Globales Stundenlimit** (`AI_Mail_MaxPerHour`, Standard: `10`)
- **Sitzungslimit** (`AI_Mail_MaxPerSession`, Standard: `3`)
- **Pflicht-Disclaimer** im E-Mail-Footer (Standard: `AI-Generated`, konfigurierbar)

> **Rechtliche Hinweise:** KI-generierte E-Mails können Impressumspflichten und Kennzeichnungspflichten nach dem EU AI Act Art. 50 auslösen. Der Standard-Disclaimer ist zu prüfen und ggf. anzupassen.

---

### 3.7 Geolokalisierung

Das Sprachmodell kann den Standort des Servers für geografisch relevante Anfragen nutzen. Es werden zwei externe Dienste angesprochen (beide optional konfigurierbar):

| Dienst | Property | Zweck |
|---|---|---|
| `ipwho.is` | `AI_LLAMA_STD_IpGeolocationDomain` | IP-basierte Grobstandortbestimmung |
| `nominatim.openstreetmap.org` | `AI_LLAMA_STD_NominatimDomain` | Reverse-Geocoding (Koordinaten → Ortsname) |

Ein Fallback-Standort kann ohne externe Dienste konfiguriert werden (`AI_LLAMA_STD_FallbackLocation`).

---

## 4. Modelle und Download-Quellen

Alle Modelle werden beim **ersten Start** automatisch heruntergeladen. Der Download unterstützt **Resume** (Fortsetzung unterbrochener Downloads). Für Air-Gapped-Umgebungen können eigene URLs oder lokale Spiegel konfiguriert werden.

| Komponente | Standardmodell | Quelle | Größe |
|---|---|---|---|
| LLaMA (Haupt) | `Qwen3VL-2B-Instruct-Q4_K_M.gguf` | huggingface.co/Qwen | ~1,1 GB |
| LLaMA (Vision-Projektor) | `mmproj-Qwen3VL-2B-Instruct-F16.gguf` | huggingface.co/Qwen | ~819 MB |
| LLaMA-Server-Binary | Release `b8175` (Win/Linux/macOS) | github.com/ggml-org/llama.cpp | variiert |
| Whisper | `ggml-small.bin` | huggingface.co/ggerganov | ~466 MB |
| Tesseract traineddata | z. B. `deu.traineddata` | github.com/tesseract-ocr/tessdata_best | ~30 MB/Sprache |

**Unterstützte GGUF-Modelle (Auswahl):** Qwen3, Mistral, LLaMA 3, Phi-3, Gemma — jedes im GGUF-Format verwendbare Modell ist via `AI_LLAMA_STD_ModelUrl` einbindbar.

---

## 5. Konfigurationsreferenz

Die Konfiguration erfolgt ausschließlich über XIMA-formcycle-Plugin-Properties.

### 5.1 Aktivierung

| Property | Beschreibung |
|---|---|
| `Active_AI` | Leerzeichen-getrennte Liste der aktiven Komponenten: `llama_engine`, `llama_std`, `whisper`, `tesseract` |

### 5.2 LLaMA Engine

| Property | Standard | Beschreibung |
|---|---|---|
| `AI_LLAMA_ENGINE_Port` | `8392` | Lokaler Port des LLaMA-Servers |
| `AI_LLAMA_ENGINE_Threads` | Physische Kerne | CPU-Threads für Inferenz |
| `AI_LLAMA_ENGINE_CtxSize` | `32768` | Kontextfenstergröße in Tokens |
| `AI_LLAMA_ENGINE_GpuLayers` | `-1` (auto) | GPU-Offload: `-1`=auto, `0`=CPU, `N`=N Layer |
| `AI_LLAMA_ENGINE_Release` | `b8175` | llama.cpp Release-Tag für Download |
| `AI_LLAMA_ENGINE_MaxConcurrent` | `2` | Maximale parallele Inferenzen (Semaphore) |

### 5.3 LLaMA Standard-Modell

| Property | Standard | Beschreibung |
|---|---|---|
| `AI_LLAMA_STD_ModelUrl` | Qwen3-VL-2B Q4\_K\_M (HuggingFace) | URL des GGUF-Hauptmodells |
| `AI_LLAMA_STD_MmprojUrl` | Qwen3-VL-2B mmproj F16 | URL des Vision-Projektors (optional) |
| `AI_LLAMA_STD_MaxPixels` | `3211264` | Pixelbudget für Bildskalierung |
| `AI_LLAMA_STD_MaxUploadBytes` | `52428800` (50 MB) | Maximale Upload-Größe |
| `AI_LLAMA_STD_MaxTokens` | `2048` | Maximale generierte Tokens pro Anfrage |
| `AI_LLAMA_STD_MaxRAMPercent` | `101.0` | RAM-Auslastungsschwelle (Anfragen ablehnen) |
| `AI_LLAMA_STD_MaxComputePercent` | `101.0` | CPU/GPU-Auslastungsschwelle |
| `AI_LLAMA_STD_Language` | *(auto)* | Erzwungene Antwortsprache (ISO 639-1, z. B. `de`) |
| `AI_LLAMA_STD_PromptIdentity` | built-in | Eigener Identitätsprompt (`{date}`, `{time}` verfügbar) |
| `AI_LLAMA_STD_ExtraParams` | *(leer)* | Zusätzliche JSON-Parameter für Completion-Anfragen |

### 5.4 Externe KI (OpenAI-kompatibel)

| Property | Standard | Beschreibung |
|---|---|---|
| `AI_LLAMA_STD_ExternalUrl` | *(leer)* | API-URL (z. B. `https://api.openai.com/v1`) |
| `AI_LLAMA_STD_ExternalApiKey` | *(leer)* | Bearer-API-Schlüssel |
| `AI_LLAMA_STD_ExternalModel` | *(leer)* | Modellname (z. B. `gpt-4o`) |
| `AI_LLAMA_STD_ExternalNoPrompt` | `false` | System-Prompt überspringen |

### 5.5 Thinking- und Specialist-Modelle

| Property | Beschreibung |
|---|---|
| `AI_LLAMA_STD_ThinkingModelUrl` | GGUF-URL für dediziertes Thinking-Modell |
| `AI_LLAMA_STD_SPECIALIST_<Name>` | URL eines lokalen Specialist-Modells |
| `AI_LLAMA_STD_EXT_SPECIALIST_<Name>` | URL einer externen Specialist-API |

**Offline- / Air-Gapped-Betrieb:**

| Property | Standard | Beschreibung |
|---|---|---|
| `AI_LLAMA_STD_LlamaRelease` | *(wie `AI_LLAMA_ENGINE_Release`)* | Überschreibt den llama.cpp Release-Tag für dieses Modul |
| `AI_LLAMA_STD_ServerUrl_windows_x86_64` | *(automatisch aus Release-Tag)* | Binary-Download-URL für Windows x86-64 – kann auf internen Mirror zeigen |
| `AI_LLAMA_STD_ServerUrl_windows_x86_64_SHA256` | *(leer)* | SHA-256-Prüfsumme (Hex, Kleinbuchstaben) für das Windows-x86-64-Archiv |
| `AI_LLAMA_STD_ServerUrl_linux_x86_64` | *(automatisch aus Release-Tag)* | Binary-Download-URL für Linux x86-64 |
| `AI_LLAMA_STD_ServerUrl_linux_x86_64_SHA256` | *(leer)* | SHA-256-Prüfsumme für das Linux-x86-64-Archiv |
| `AI_LLAMA_STD_ServerUrl_macos_x86_64` | *(automatisch aus Release-Tag)* | Binary-Download-URL für macOS x86-64 |
| `AI_LLAMA_STD_ServerUrl_macos_x86_64_SHA256` | *(leer)* | SHA-256-Prüfsumme für das macOS-x86-64-Archiv |
| `AI_LLAMA_STD_ServerUrl_macos_aarch64` | *(automatisch aus Release-Tag)* | Binary-Download-URL für macOS ARM64 |
| `AI_LLAMA_STD_ServerUrl_macos_aarch64_SHA256` | *(leer)* | SHA-256-Prüfsumme für das macOS-ARM64-Archiv |
| `AI_LLAMA_STD_CudaDllUrl_windows_x86_64` | *(automatisch aus Release-Tag)* | Download-URL für die CUDA-Runtime-DLL (`cudart`) unter Windows x86-64 (nur bei CUDA-GPU) |
| `AI_LLAMA_STD_CudaDllUrl_windows_x86_64_SHA256` | *(leer)* | SHA-256-Prüfsumme für das CUDA-Runtime-DLL-Archiv |
| `AI_LLAMA_STD_EXT_SPECIALIST_Key_<Name>` | API-Schlüssel für externen Specialist |

### 5.6 Whisper

| Property | Standard | Beschreibung |
|---|---|---|
| `AI_Whisper_Port` | `8393` | Lokaler Port des Whisper-Servers |
| `AI_Whisper_ModelUrl` | ggml-small (~466 MB) | GGML-Modell-URL |
| `AI_Whisper_ModelUrl_SHA256` | *(leer)* | SHA-256-Prüfsumme (Hex, Kleinbuchstaben) zur Verifikation der Modelldatei nach dem Download |
| `AI_Whisper_Release` | `v1.7.6` | whisper.cpp Release-Tag |
| `AI_Whisper_ReleaseBaseUrl` | GitHub Releases | Basis-URL für whisper.cpp-Binary-Downloads (Release-Tag wird automatisch angehängt). Kann auf internen Mirror umgestellt werden |
| `AI_Whisper_NoGpu` | `false` | GPU deaktivieren (CPU-only) |
| `AI_Whisper_AutoDetectLanguage` | `false` | Automatische Sprachendetektion |
| `AI_Whisper_ExternalUrl` | *(leer)* | Externe STT-API-URL |
| `AI_Whisper_ExternalApiKey` | *(leer)* | API-Schlüssel für externe STT |
| `AI_Whisper_UpdateCheckHours` | `24` | Stunden zwischen GitHub-Release-Checks für whisper.cpp (0 = deaktiviert) |
| `AI_Whisper_NotifyEmail` | *(leer)* | E-Mail für Update-Benachrichtigungen |

### 5.7 Tesseract

| Property | Standard | Beschreibung |
|---|---|---|
| `AI_Tesseract_Languages` | `deu` | Sprachen für OCR (`+`-getrennt) |
| `AI_Tesseract_PoolSize` | auto | Anzahl paralleler Tesseract-Instanzen |
| `AI_Tesseract_MavenRepository` | Maven Central | Alternativer Repository-Mirror für JNI-Bibliotheken |

### 5.8 AI-Proxy

| Property | Beschreibung |
|---|---|
| `AI_Proxy_AllowedIPs` | Komma-getrennte IPs/CIDRs (leer = alle blockiert) |
| `AI_Proxy_Users` | Komma-getrennte `benutzer:passwort`-Paare |

### 5.9 Allgemein

| Property | Standard | Beschreibung |
|---|---|---|
| `AI_CachedImageExpiration` | `600000` ms | TTL des Bild-Caches (Standard: 10 Minuten) |
| `AI_QueueBadge` | `false` | Warteschlangen-Position in der UI anzeigen |
| `AI_LLAMA_STD_FallbackLocation` | *(leer)* | Fallback-Standort bei Geolokalisierungsfehlern |
| `AI_LLAMA_STD_NominatimDomain` | `nominatim.openstreetmap.org` | Domain für Reverse-Geocoding |
| `AI_LLAMA_STD_IpGeolocationDomain` | `ipwho.is` | Domain für IP-Geolokalisierung |

---

## 6. Netzwerkfreigaben

Die folgenden Domains sind für den **Erststart** (einmaliger Download) erforderlich. Nach dem Download laufen alle KI-Dienste vollständig lokal.

| Domain | Zweck | Optional |
|---|---|---|
| `github.com` | llama.cpp- und whisper.cpp-Releases | Nein\* |
| `objects.githubusercontent.com` | GitHub Release-Asset-CDN | Nein\* |
| `api.github.com` | Update-Check (Release-Check) | Ja |
| `huggingface.co` | GGUF-Modell-Downloads | Nein\* |
| `repo1.maven.org` | Tesseract JNI-Bibliotheken (tess4j) | Ja (Spiegel möglich) |
| `raw.githubusercontent.com` | Tesseract traineddata | Ja |

\* *Entfällt bei vollständig konfiguriertem Offline-Deployment mit eigenen Modell-URLs.*

**Laufzeit (nur bei aktivierten Opt-In-Diensten):**

| Domain | Dienst | Opt-In-Property |
|---|---|---|
| `api.search.brave.com` | Brave Websuche | `AI_BraveSearch_ApiKey` |
| `nominatim.openstreetmap.org` | Reverse-Geocoding | aktiver Standortdienst |
| `ipwho.is` | IP-Geolokalisierung | aktiver Standortdienst |
| *(konfigurierbar)* | Externe KI-API | `AI_LLAMA_STD_ExternalUrl` |
| *(konfigurierbar)* | Externe Whisper-API | `AI_Whisper_ExternalUrl` |

---

## 7. Datenschutz (DSGVO)

### 7.1 Datenverarbeitung im Standardbetrieb (lokal)

Im Standardbetrieb mit lokalen Modellen verlassen **keine Nutzerdaten** den formcycle-Server.

| Verarbeitungsschritt | Speicherort | Persistenz |
|---|---|---|
| Chat-Nachrichten / Dokumenteninhalte | RAM (Prozesskontext) | Nicht persistent |
| Bilder / PDFs | RAM + temporärer Dateicache | TTL: 600 s (konfigurierbar), danach automatisch gelöscht |
| Audio (Whisper) | RAM (Prozesskontext) | Nicht persistent |
| OCR-Ergebnisse (Tesseract) | RAM | Nicht persistent |
| Proxy-Audit-Log (`codbi_ai_proxy`) | Datenbank (JPA) | Persistent (nur Metadaten, s. u.) |

### 7.2 Audit-Tabelle `codbi_ai_proxy`

Die Audit-Tabelle protokolliert **ausschließlich technische Metadaten** — kein personenbezogener Inhalt wird gespeichert:

| Spalte | Inhalt | Datenschutzrelevanz |
|---|---|---|
| `request_id` | UUID (zufällig generiert) | Keine Rückverfolgung auf Person |
| `timestamp` | Zeitstempel der Anfrage | Gering (keine Nutzerzuordnung) |
| `endpoint` | Aufgerufener API-Endpunkt | Keine personenbezogenen Daten |
| `status` | HTTP-Statuscode | Keine personenbezogenen Daten |
| `elapsed_ms` | Antwortzeit in Millisekunden | Keine personenbezogenen Daten |

> Klarnamen, IP-Adressen und Anfrageinhalte werden bewusst **nicht** protokolliert. Benutzernamen werden im internen Logging nur als SHA-256-Hash geführt.

### 7.3 Verantwortlichkeit und Rechtsgrundlagen

| Szenario | Empfehlung |
|---|---|
| **Lokaler Betrieb** (Standard) | Verarbeitung auf dem eigenen Server; Datenschutz-Folgenabschätzung (DSFA) prüfen, ob Nutzendendaten (z. B. Formulareingaben) sensibel sind |
| **Externe KI-API** (`AI_LLAMA_STD_ExternalUrl`) | Daten verlassen den Server → **AVV mit Anbieter** zwingend erforderlich; Drittlandtransfer prüfen (Art. 44 ff. DSGVO) |
| **Brave Search** | Suchanfragen verlassen den Server → AVV mit Brave prüfen; Datenschutzhinweis an Nutzende |
| **Externe Whisper-API** | Audiodaten verlassen den Server → **AVV** erforderlich |
| **Browser Web Speech API** | Cloud-Dienst des Browsers (Google/Microsoft) → **Einwilligung der Nutzenden** erforderlich |

### 7.4 Betroffenenrechte

Im Standardbetrieb (lokale Modelle, kein persistenter Inhalt) sind typische Betroffenenrechte (Auskunft, Löschung, Berichtigung) technisch im Wesentlichen gegenstandslos, da keine inhaltlichen personenbezogenen Daten dauerhaft gespeichert werden. Bei aktivierten Opt-In-Diensten oder externer Verarbeitung gelten die üblichen DSGVO-Anforderungen.

---

## 8. EU-KI-Verordnung (AI Act)

CodBi enthält Maßnahmen zur Erfüllung der **Transparenzpflichten nach Art. 50 EU AI Act**.

### 8.1 Kennzeichnungspflicht (Art. 50 Abs. 1)

KI-generierte Inhalte werden in der formcycle-Benutzeroberfläche automatisch mit dem Label **`✨ KI-generiert`** gekennzeichnet. Dies gilt für alle Ausgaben der Komponenten `AI.Llama.Standard.QA` und `AI.Llama.Standard.TxtQA`.

### 8.2 Transparenz im System-Prompt

Der Standard-System-Prompt injiziert automatisch:
- Aktuelles Datum, Uhrzeit und Wochentag (Präzision ohne Cloud)
- Einen **EU-AI-Act-Transparenzhinweis** als Kontextinformation für das Modell

### 8.3 Risikoklassifizierung

Gemäß EU AI Act sind folgende Aspekte zu prüfen:

| Aspekt | Einschätzung | Handlungsbedarf |
|---|---|---|
| **Risikostufe** | Abhängig vom Einsatzszenario (Formulare, Verwaltungsakte) | Betreiber muss Risikoklasse für den konkreten Anwendungsfall prüfen |
| **Transparenz gegenüber Nutzenden** | `✨ KI-generiert`-Label implementiert | Ausreichend für niedrige Risikostufe |
| **Menschliche Kontrolle** | Nutzer kann KI-Vorschläge ablehnen | Prozess dokumentieren |
| **Protokollierung** | Audit-Log in `codbi_ai_proxy` vorhanden | Ggf. erweitern für hochriskante Anwendungen |
| **Dokumentation** | Modellherkunft und -eigenschaften dokumentieren | Systemdokumentation für regulierte Bereiche |

### 8.4 MailBridge und Transparenz

E-Mails, die über die MailBridge versendet werden, erhalten einen konfigurierbaren **Pflicht-Disclaimer** (Standard: `AI-Generated`). Dies erfüllt die Kennzeichnungspflicht für KI-generierte Kommunikation.

---

## 9. Sicherheitsarchitektur

### 9.1 Netzwerksicherheit

- **Ausschließlich localhost-Kommunikation:** LLaMA- und Whisper-Server binden nur an `127.0.0.1` — sie sind von außen nicht erreichbar
- **AI-Proxy als einziger Zugangspunkt:** Externer Zugriff auf KI-Dienste erfolgt ausschließlich über den authentifizierten Proxy-Endpunkt
- **IP-Whitelist (CIDR + Exact):** Zugriff auf den Proxy auf IP-Ebene einschränkbar
- **HTTP Basic Auth:** Zusätzliche Authentifizierungsschicht

### 9.2 SSRF-Schutz (UrlFetcher)

Der `UrlFetcher`-Dienst, über den das Sprachmodell URLs analysieren kann, enthält expliziten Schutz gegen Server-Side Request Forgery:

- Private IP-Bereiche werden blockiert (`10.x.x.x`, `192.168.x.x`, `172.16–31.x.x`)
- `localhost` und `127.0.0.1` sind nicht abrufbar
- Nur externe, öffentliche URLs werden zugelassen

### 9.3 Download-Sicherheit (Zip-Slip-Schutz)

Der `DownloadManager` enthält expliziten Schutz gegen **Zip-Slip-Angriffe** bei der Extraktion von ZIP- und tar.gz-Archiven (llama.cpp- und whisper.cpp-Releases).

### 9.4 Ressourcenschutz

- **Semaphore (FIFO):** Maximale Anzahl paralleler KI-Anfragen begrenzt (`AI_LLAMA_ENGINE_MaxConcurrent`)
- **RAM/CPU-Guards:** Anfragen werden abgelehnt, wenn die Systemauslastung konfigurierte Schwellwerte überschreitet
- **Streaming-Session-TTL:** Sessions laufen nach 5 Minuten (Standard) bzw. 10 Minuten (Thinking) automatisch ab

### 9.5 MailBridge-Sicherheit

- Empfänger werden gegen eine **Regex-Whitelist** geprüft — unkonfiguriert ist kein Versand möglich
- Rate-Limiting auf globaler und Sitzungsebene verhindert Missbrauch

---

## 10. Externe KI-Dienste und Risikobewertung

| Dienst | Aktivierung | Weitergeleitete Daten | DSGVO | Maßnahme |
|---|---|---|---|---|
| **Lokales LLaMA** | Standard | Keine (lokal) | unkritisch | — |
| **Lokaler Whisper** | Standard | Keine (lokal) | unkritisch | — |
| **Tesseract** | Standard | Keine (lokal, in-process) | unkritisch | — |
| **Brave Search API** | `AI_BraveSearch_ApiKey` setzen | Suchanfragen | Prüfen | AVV mit Brave; Datenschutzhinweis |
| **Nominatim (OSM)** | Geolokalisierung aktiv | Koordinaten | Gering | Datenschutzhinweis auf OSM-Nutzungsbedingungen |
| **ipwho.is** | Geolokalisierung aktiv | Server-IP | Gering | Datenschutzhinweis; eigene Domain konfigurierbar |
| **Externe KI-API** (z. B. GPT-4o, Groq, Gemini) | `AI_LLAMA_STD_ExternalUrl` | **Gesamter Chat-Inhalt inkl. ggf. Bürgerdaten** | **Kritisch** | AVV zwingend; Drittlandtransfer prüfen; ggf. Einwilligung |
| **Externe Whisper-API** | `AI_Whisper_ExternalUrl` | **Audiodaten** | **Kritisch** | AVV zwingend; Drittlandtransfer prüfen |
| **HuggingFace** | Erster Start (Modell-Download) | Keine Nutzerdaten | unkritisch | Einmalig; Offline-Deployment möglich |
| **GitHub API** | Erster Start + Update-Check | Keine Nutzerdaten | unkritisch | Deaktivierbar |
| **Browser Web Speech API** | Browser-native Formulareingabe | **Audiodaten an Google/Microsoft** | **Kritisch** | Einwilligung der Nutzenden; unabhängig von CodBi |

---

## 11. Betrieb und Monitoring

### 11.1 Health-Monitoring

CodBi überwacht die gestarteten KI-Prozesse kontinuierlich:

- **Health-Check-Polling** auf `/health`-Endpunkt der lokalen Server
- **ResourceMonitor** (Daemon-Thread): CPU- und RAM-Auslastung alle 3 Sekunden; GPU-Auslastung via `nvidia-smi` (CUDA)
- **Automatischer Neustart** bei Prozessabsturz

### 11.2 Logging

| Ebene | Inhalt | Hinweis |
|---|---|---|
| Plugin-Log (formcycle) | Start/Stop-Ereignisse, Fehler, Health-Status | Standard-formcycle-Logging |
| Audit-Tabelle `codbi_ai_proxy` | Anfrage-Metadaten (UUID, Endpunkt, Status, Zeit) | Datenschutzkonform (keine Inhaltsdaten) |
| Benutzername-Hashing | SHA-256 im internen Log | Kein Klartext-Benutzername |

### 11.3 Ressourcenplanung

Empfehlungen für den produktiven Betrieb:

| Ressource | Minimum | Empfohlen (GPU) |
|---|---|---|
| RAM | 8 GB | 16 GB+ |
| CPU | 4 Kerne | 8+ Kerne |
| GPU (optional) | VRAM 4 GB | VRAM 8 GB+ (CUDA/Vulkan) |
| Festplatte | 5 GB (Modelle) | 10 GB+ (mehrere Modelle) |
| Netzwerk (Erststart) | Einmaliger Download ~2,4 GB | Schnelle Internetverbindung empfohlen |

### 11.4 Wartung

- **Modell-Updates:** Neue GGUF-Modelle können jederzeit durch Anpassen der `*_ModelUrl`-Properties eingespielt werden (formcycle-Neustart erforderlich)
- **Binary-Updates:** `AI_LLAMA_ENGINE_Release` und `AI_Whisper_Release` auf neue Release-Tags setzen
- **Offline-Deployment:** Alle URLs können auf interne Spiegel oder Dateipfade umgeleitet werden

---

## 12. Checkliste für den produktiven Betrieb

### Vor der Erstinstallation

- [ ] Systemanforderungen (RAM, CPU/GPU) geprüft
- [ ] Netzwerkfreigaben für Erstdownload beantragt (github.com, huggingface.co)
- [ ] Datenschutz-Folgenabschätzung (DSFA) für den geplanten Anwendungsfall durchgeführt
- [ ] Zuständigen Datenschutzbeauftragten informiert

### Konfiguration

- [ ] `Active_AI` auf benötigte Komponenten gesetzt
- [ ] `AI_Proxy_AllowedIPs` konfiguriert (Whitelist nicht leer lassen)
- [ ] `AI_Proxy_Users` mit sicheren Passwörtern gesetzt
- [ ] `AI_LLAMA_ENGINE_MaxConcurrent` auf Serverlast abgestimmt
- [ ] Ggf. `AI_LLAMA_STD_Language` für einsprachigen Betrieb gesetzt
- [ ] `AI_Tesseract_Languages` auf benötigte Sprachen gesetzt

### Externe Dienste (nur bei Aktivierung)

- [ ] **Externe KI-API:** AVV mit Anbieter abgeschlossen; Datenschutzhinweis für Nutzende
- [ ] **Brave Search:** API-Schlüssel sicher gespeichert; AVV geprüft
- [ ] **MailBridge:** `AI_Mail_AllowedRecipients` konfiguriert; Disclaimer angepasst
- [ ] **Browser Web Speech API:** DSGVO-Einwilligung der Nutzenden sichergestellt

### Compliance

- [ ] EU AI Act Risikoklasse für den Anwendungsfall bestimmt
- [ ] `✨ KI-generiert`-Kennzeichnung in der UI überprüft
- [ ] Audit-Log (`codbi_ai_proxy`) in Datenschutzdokumentation aufgenommen
- [ ] Lösch-/Aufbewahrungskonzept für `codbi_ai_proxy`-Tabelle definiert
- [ ] Verfahrensverzeichnis (Art. 30 DSGVO) aktualisiert

### Betrieb

- [ ] Health-Monitoring eingerichtet
- [ ] Ressourcenmonitoring (CPU/RAM) konfiguriert
- [ ] Backup-Strategie für Modell-Downloads (offline-fähig)
- [ ] Update-Prozess für Modelle und Binaries definiert

---

*Dieses Dokument bezieht sich auf CodBi ab Version 1.0.1 (Stand: April 2026).*  
*Für Fragen wenden Sie sich an die Projektverantwortlichen unter [CONTRIBUTING.md](CONTRIBUTING.md).*
