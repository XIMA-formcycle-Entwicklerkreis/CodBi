# CodBi — Operations & Deployment Guide

*Last Updated: April 12, 2026*

---

## 1. Installation

### 1.1 Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| **XIMA Formcycle** | 8.3.x | Server must be accessible |
| **Java** | 11+ | JDK 11 or newer on the server |
| **OS** | Windows x64, Linux x64 | macOS ARM64 supported for LLaMA only |
| **RAM** | 4 GB (no AI) / 8 GB (AI) | 16 GB+ recommended for concurrent AI inference |
| **Disk** | 500 MB (plugin) + 2–5 GB (AI models) | SSD recommended for model loading |
| **GPU (optional)** | CUDA 12 or Vulkan-capable | Auto-detected; CPU fallback always available |

### 1.2 Building from Source

```bash
# Full build with tests
./mvnw clean package

# Quick dev build (non-minified, skip tests)
./mvnw package -Pdev

# Build + hot-deploy to running Formcycle
./mvnw -Pdev -DskipTests=true \
  -DfcDeployUrl=http://localhost:8080/xima-formcycle \
  -DfcDeployToken=admin \
  fc-deploy:deploy

# Launch a local Formcycle development server
./mvnw fc-server:run-ms-war
```

> **Note:** `frontend-maven-plugin` automatically installs Node.js 22.14 and Yarn 4.6 — no manual setup required.

### 1.3 Plugin Installation

1. Build the JAR: `./mvnw clean package`
2. Open Formcycle Admin → **System** → **Plugins**
3. Upload `target/fc-plugin-codbi-1.0.0-SNAPSHOT.jar`
4. Choose scope: **Client** (single mandant) or **System** (all mandants)
5. Restart Formcycle if prompted

### 1.4 Plugin Removal

1. Disable all AI modules first (set `Active_AI` to empty)
2. Restart Formcycle to release JNI locks (Tesseract)
3. Uninstall plugin via Formcycle Admin
4. (Optional) Delete `<pluginFolder>/ai/` directory to remove downloaded models and binaries

---

## 2. Configuration Reference

### 2.1 AI Module Activation

Set the `Active_AI` plugin property to a comma-separated list of modules:

| Module Key | Engine | Description |
|------------|--------|-------------|
| `llama_engine` | LLaMA | Base engine — required for all LLaMA features |
| `llama_std` | LLaMA | Standard model (Chat, QA, TxtQA) |
| `whisper` | Whisper | Speech-to-text |
| `tesseract` | Tesseract | OCR |

**Example:** `Active_AI = llama_engine, llama_std, whisper, tesseract`

### 2.2 LLaMA Engine Properties (`AI_LLAMA_ENGINE_*`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_LLAMA_ENGINE_Port` | Int | `8392` | Local server port |
| `AI_LLAMA_ENGINE_Threads` | Int | auto | CPU threads for inference |
| `AI_LLAMA_ENGINE_CtxSize` | Int | `32768` | Context window (tokens) |
| `AI_LLAMA_ENGINE_GpuLayers` | Int | `-1` | GPU offload: `-1`=auto, `0`=CPU, `N`=specific layers |
| `AI_LLAMA_ENGINE_Release` | String | `b8175` | llama.cpp release tag |
| `AI_LLAMA_ENGINE_ServerArgs` | String | — | Extra CLI args for llama-server |
| `AI_LLAMA_ENGINE_MaxConcurrent` | Int | `2` | Global concurrent inference limit (semaphore) |

### 2.3 LLaMA Standard Model Properties (`AI_LLAMA_STD_*`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_LLAMA_STD_ModelUrl` | URL | Qwen3-VL-2B Q4_K_M | GGUF model download URL |
| `AI_LLAMA_STD_MmprojUrl` | URL | Qwen3-VL-2B mmproj F16 | Vision projector URL |
| `AI_LLAMA_STD_MaxPixels` | Long | `3211264` | Max pixel budget for image downscaling |
| `AI_LLAMA_STD_MaxUploadBytes` | Long | `52428800` | Max upload size (50 MB) |
| `AI_LLAMA_STD_MaxTokens` | Int | `2048` | Max tokens per response |
| `AI_LLAMA_STD_MaxRAMPercent` | Double | `101.0` | RAM gate threshold (%) — `101` disables |
| `AI_LLAMA_STD_MaxComputePercent` | Double | `101.0` | Compute gate threshold (%) |
| `AI_LLAMA_STD_Language` | String | — | Force response language (ISO 639-1, e.g. `de`) |
| `AI_LLAMA_STD_UpdateCheckHours` | Long | `24` | Hours between GitHub release checks |
| `AI_LLAMA_STD_NotifyEmail` | String | — | Email for update notifications |

**Thinking Mode:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_LLAMA_STD_ThinkingModelUrl` | URL | — | Dedicated thinking model GGUF |
| `AI_LLAMA_STD_ThinkingMmprojUrl` | URL | — | Thinking model vision projector |

**External AI (hybrid mode):**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_LLAMA_STD_ExternalUrl` | URL | — | External OpenAI-compatible API base URL |
| `AI_LLAMA_STD_ExternalApiKey` | String | — | API key for external AI |
| `AI_LLAMA_STD_ExternalModel` | String | — | Model name for external API |
| `AI_LLAMA_STD_ExternalNoPrompt` | Boolean | `false` | Skip built-in system prompt |

**Specialist Models** (replace `XXX` with specialist name):

| Property | Type | Description |
|----------|------|-------------|
| `AI_LLAMA_STD_SPECIALIST_XXX` | URL | Local specialist GGUF URL |
| `AI_LLAMA_STD_SPECIALIST_MMProj_XXX` | URL | Specialist vision projector |
| `AI_LLAMA_STD_EXT_SPECIALIST_XXX` | URL | External specialist API URL |
| `AI_LLAMA_STD_EXT_SPECIALIST_Key_XXX` | String | External specialist API key |
| `AI_LLAMA_STD_EXT_SPECIALIST_Model_XXX` | String | External specialist model name |

**Prompt Overrides:**

| Property | Description |
|----------|-------------|
| `AI_LLAMA_STD_PromptIdentity` | Override identity prompt section |
| `AI_LLAMA_STD_PromptLocation` | Override location prompt |
| `AI_LLAMA_STD_PromptSearch` | Override CALL:search instruction |
| `AI_LLAMA_STD_PromptThinking` | Override thinking-mode instruction |
| `AI_LLAMA_STD_PromptNoInternet` | Override no-internet warning |
| `AI_LLAMA_STD_PromptRules` | Override general rules |

### 2.4 Whisper Properties (`AI_Whisper_*`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_Whisper_Port` | Int | `8393` | Local whisper-server port |
| `AI_Whisper_ModelUrl` | URL | ggml-small.bin | GGML model URL |
| `AI_Whisper_Release` | String | `v1.7.6` | whisper.cpp release tag |
| `AI_Whisper_NoGpu` | Boolean | `false` | Force CPU-only mode |
| `AI_Whisper_Threads` | Int | auto | CPU threads |
| `AI_Whisper_MaxRAMPercent` | Double | `101.0` | RAM gate threshold |
| `AI_Whisper_MaxComputePercent` | Double | `101.0` | Compute gate threshold |
| `AI_Whisper_AutoDetectLanguage` | Boolean | `false` | Auto-detect vs browser Accept-Language |
| `AI_Whisper_ExternalUrl` | URL | — | External API URL (skips local server) |
| `AI_Whisper_ExternalApiKey` | String | — | External API key |
| `AI_Whisper_ExternalModel` | String | `whisper-1` | External API model name |

### 2.5 Tesseract Properties (`AI_Tesseract_*`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_Tesseract_Languages` | String | `deu` | `+` separated language codes |
| `AI_Tesseract_PoolSize` | Int | auto | Concurrent Tesseract instances |
| `AI_Tesseract_MaxCPUPercent` | Double | `101.0` | CPU gate threshold |
| `AI_Tesseract_MaxRAMPercent` | Double | `101.0` | RAM gate threshold |
| `AI_Tesseract_MavenRepository` | URL | Maven Central | Custom repo for native libs |

### 2.6 AI Proxy Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_Proxy_AllowedIPs` | String | — | Comma-separated IPs/CIDRs (e.g. `192.168.1.0/24,10.0.0.5`) |
| `AI_Proxy_Users` | String | — | Comma-separated `user:pass` pairs |

### 2.7 Brave Search Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_BraveSearch_ApiKey` | String | — | Enables web search when set |
| `AI_BraveSearch_MaxResults` | Int | `5` | Results per query (1–20) |

### 2.8 Mail Bridge Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_Mail_Enabled` | Boolean | `false` | Enable AI email sending |
| `AI_Mail_AllowedRecipients` | Regex | — | Recipient whitelist pattern |
| `AI_Mail_MaxPerHour` | Int | `10` | Global hourly rate limit |
| `AI_Mail_MaxPerSession` | Int | `3` | Per-session rate limit |
| `AI_Mail_Disclaimer` | String | `AI-Generated` | Email disclaimer text |

### 2.9 Other Properties

| Property | Description |
|----------|-------------|
| `AI_CachedImageExpiration` | Image cache TTL in ms (default: `600000` = 10 min) |
| `AI_QueueBadge` | Enable queue-position badge in UI (`true`/`false`) |
| `LDAP_URL` | LDAP server URL for form features |
| `LDAP_URL_BACKEND` | LDAP backend URL |
| `Matomo_SiteID` / `Matomo_URL` | Matomo analytics tracking |
| `APIDoc_UsersAllowedToSYNC` | Users allowed to sync the API-Documentation Manager |

---

## 3. AI Engine Lifecycle

### 3.1 Startup Sequence

When Formcycle starts and CodBi initializes:

1. Plugin `initialize()` reads `Active_AI` property
2. For each enabled module:
   - **Binary check:** Verifies correct release/GPU marker files; re-downloads if changed
   - **Model check:** Verifies model file exists; downloads with resume support if missing
   - **Process launch:** Starts the server process via `ProcessBuilder`
   - **Health poll:** Polls `GET http://127.0.0.1:{port}/health` every 1s, expects `{"status":"ok"}`
   - **Timeout:** 120s — process is killed if health check doesn't pass
3. Ports are probed: if the preferred port is occupied, up to 20 consecutive ports are tried, then OS-assigned ephemeral as fallback

### 3.2 Port Assignments

| Engine | Default Port | Specialist Offset | Thinking Offset |
|--------|-------------|-------------------|-----------------|
| LLaMA (main) | `8392` | +200 | +100 |
| Whisper | `8393` | — | — |

All engines bind to `127.0.0.1` (localhost only).

### 3.3 GPU Detection

Auto-detection priority: **CUDA 12** → **Vulkan** → **CPU fallback**

- CUDA: requires `nvidia-smi` in PATH; CUDA DLLs downloaded automatically on Windows
- Vulkan: default on Windows when CUDA unavailable
- CPU: always available as fallback
- Override via `AI_LLAMA_ENGINE_GpuLayers=0` to force CPU

### 3.4 Shutdown

On plugin `shutdown()`:

1. Graceful `process.destroy()` sent to each AI process
2. 10-second timeout for graceful exit
3. `process.destroyForcibly()` if process doesn't terminate
4. Port released

### 3.5 Model Downloads

- All models auto-download on first activation with **resume support**
- Downloaded to `<pluginFolder>/ai/{engine}/models/`
- Binaries extracted to `<pluginFolder>/ai/{engine}/bin/extracted/`
- Hash verification for integrity on supported downloads
- Progress tracked by `DownloadManager`

> **Tesseract note:** Once activated, JNI native libraries are locked in memory. To fully remove Tesseract files, disable → restart Formcycle → then delete.

---

## 4. Monitoring & Health

### 4.1 Resource Monitor

`ResourceMonitor` runs a daemon thread polling system resources every **3 seconds**:

| Metric | Source | Notes |
|--------|--------|-------|
| CPU | `OperatingSystemMXBean.systemCpuLoad` | JDK 11 compatible |
| RAM | `(total - free) / total × 100` | Physical memory |
| GPU | `nvidia-smi --query-gpu=utilization.gpu` | CUDA only; skipped if unavailable |

**Resource gating:** When `ramPercent > maxRAMPercent` or `computePercent > maxComputePercent`, new inference requests are queued until resources fall below thresholds. Setting thresholds to `101.0` (default) disables gating.

### 4.2 Concurrency Control

- **Semaphore:** `AI.inferenceSemaphore` with `maxConcurrent` permits (default: 2, fair queuing)
- **Queue tracking:** Each request gets a ticket in `AI.queueTickets` (ConcurrentHashMap)
- **Wait estimation:** Based on rolling average of last 20 inference durations per model type
- **Stale cleanup:** Abandoned tickets auto-expire after 30s

### 4.3 Logging

All CodBi modules log with the prefix pattern:

```
[[ CodBi / {module} ] {message} ]
```

| Module Prefix | Component |
|---------------|-----------|
| `CodBi / AI / LLAMA` | LLaMA engine lifecycle |
| `CodBi / AI / Whisper` | Whisper engine lifecycle |
| `CodBi / AI / Tesseract` | OCR processing |
| `CodBi / AI / Proxy` | AI Proxy requests |
| `CodBi / AI / MailBridge` | AI email sending |
| `CodBi / AI / UrlFetcher` | AI URL fetch/analysis |

**Key log events to watch:**

| Event | Log Level | Message Pattern |
|-------|-----------|-----------------|
| Engine started | INFO | `Server is listening on port {port}` |
| Health check pass | INFO | `Health check passed` |
| Health check timeout | ERROR | `Health check timed out after 120s` |
| Process died | ERROR | `Process exited with code {N}` |
| GPU detected | INFO | `Detected GPU: {CUDA/Vulkan}` |
| Resource gate hit | WARN | `Resources exceeded: {reason}` |
| Download started | INFO | `Downloading {url}` |
| Proxy auth fail | WARN | `Authentication failed for user {sha256}` |
| IP blocked | WARN | `IP {first.two.x.x} not in whitelist` |

### 4.4 Audit Trail

AI Proxy requests are logged to the database table `codbi_ai_proxy`:

| Column | Content |
|--------|---------|
| Username | SHA-256 hash (anonymized) |
| IP | First two octets only (e.g. `192.168.x.x`) |
| Timestamp | Request timestamp |
| Endpoint | Requested AI endpoint path |

This provides GDPR-compliant audit logging without storing personally identifiable information.

---

## 5. Troubleshooting

### 5.1 AI Engine Won't Start

| Symptom | Cause | Solution |
|---------|-------|----------|
| Health check timeout (120s) | Port conflict | Change `AI_LLAMA_ENGINE_Port` or kill the process using the port |
| Process exits immediately | Missing GPU driver | Set `AI_LLAMA_ENGINE_GpuLayers=0` to force CPU mode |
| Download fails | Network/firewall | Manually download the binary and place in `<pluginFolder>/ai/llama_engine/bin/` |
| "Binary not found" | Corrupted extraction | Delete `<pluginFolder>/ai/llama_engine/bin/extracted/` and restart |
| Model too large for RAM | Insufficient memory | Use a smaller quantized model (Q4_K_M instead of Q8_0) |

### 5.2 Tesseract Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| "JNI library locked" | Tesseract DLL in use | Disable Tesseract → restart Formcycle → then delete files |
| Low OCR accuracy | Wrong language | Set `AI_Tesseract_Languages` to match document language(s) |
| "Maven download failed" | Firewall blocking Maven Central | Set `AI_Tesseract_MavenRepository` to internal mirror |

### 5.3 Whisper Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| No microphone access | Browser permissions | Ensure HTTPS; check browser microphone permissions |
| FFmpeg missing | Windows-only dependency | Should auto-download; check firewall/proxy settings |
| Slow transcription | Large model on CPU | Use `ggml-tiny.bin` or `ggml-base.bin` for faster CPU inference |

### 5.4 AI Proxy Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| 401 Unauthorized | Wrong credentials | Verify `AI_Proxy_Users` format: `user:pass,user2:pass2` |
| 403 Forbidden | IP not whitelisted | Add client IP/CIDR to `AI_Proxy_AllowedIPs` |
| 502 Bad Gateway | Backend engine down | Check engine health; review logs for crash information |
| 503 Service Unavailable | Engine not started | Verify `Active_AI` includes the required module |

### 5.5 General

| Symptom | Cause | Solution |
|---------|-------|----------|
| CodBi elements not rendering | Plugin not enabled on form | Set `Enable CodBi` form property to `true` in designer |
| Functionalities not loading | Missing standard config | Ensure at least one Standard Configuration is selected |
| Windows MAX_PATH errors | Deep Kotlin package names | Use `robocopy` for file operations; enable long paths in Windows |
| Build failure | Node/Yarn version mismatch | Delete `node_modules` and let `frontend-maven-plugin` reinstall |
