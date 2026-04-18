# CodBi — AI Proxy API Reference

*Last Updated: April 12, 2026*

---

## Overview

The CodBi AI Proxy exposes local AI inference capabilities (LLaMA, Whisper, Tesseract) to external applications through a secure HTTP gateway. All requests route through the formcycle plugin servlet.

**Base URL:**

```
POST <formcycle-base>/plugin?name=CodBi_AI_Proxy&endpoint=<path>
```

**Security:** Every request must pass both IP whitelist and Basic Auth checks.

---

## Authentication

### IP Whitelist

Requests are checked against `AI_Proxy_AllowedIPs` (plugin property). Supports individual IPs and CIDR ranges.

```
AI_Proxy_AllowedIPs = 192.168.1.0/24,10.0.0.5,172.16.0.0/16
```

If the property is empty, **all IPs are blocked**.

### Basic Authentication

Credentials are sent via the standard `Authorization: Basic` header. Valid users are defined in the `AI_Proxy_Users` plugin property.

```
AI_Proxy_Users = alice:secretpass,bob:otherpass
```

### Audit Logging

All proxy requests are audited to the `codbi_ai_proxy` database table with **GDPR-safe** fields:
- Username: SHA-256 hash
- IP: first two octets only (e.g., `192.168.x.x`)
- Timestamp and endpoint

---

## Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request — missing or invalid parameters |
| `401` | Authentication failed — bad or missing credentials |
| `403` | Forbidden — IP not in whitelist |
| `502` | Backend AI engine error (process crash, timeout) |
| `503` | Service unavailable — engine not started or not enabled |

Error responses return JSON:

```json
{
  "error": {
    "message": "Descriptive error message",
    "type": "invalid_request_error",
    "code": 400
  }
}
```

---

## Endpoints

### 1. Chat Completions

**OpenAI-compatible** chat endpoint for LLaMA.

```
POST /plugin?name=CodBi_AI_Proxy&endpoint=/v1/chat/completions
```

#### Request

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Basic <base64(user:pass)>` |
| `Content-Type` | Yes | `application/json` |
| `X-Thinking` | No | `true` to enable extended reasoning (uses thinking model) |

**Body:**

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Explain quantum computing." }
  ],
  "max_tokens": 2048,
  "temperature": 0.7,
  "stream": false
}
```

**With images (vision-capable models):**

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "What is in this image?" },
        { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
      ]
    }
  ]
}
```

#### Response

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1713000000,
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing uses qubits..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

#### Routing

- `X-Thinking: true` → routes to **thinking server** (port + 100, 600s timeout, 2× context)
- Default → routes to **main server** (port, 300s timeout)

---

### 2. Raw Completion

Low-level llama.cpp completion endpoint.

```
POST /plugin?name=CodBi_AI_Proxy&endpoint=/completion
```

#### Request

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Basic <base64(user:pass)>` |
| `Content-Type` | Yes | `application/json` |

**Body:**

```json
{
  "prompt": "The capital of France is",
  "n_predict": 128,
  "temperature": 0.7,
  "stop": ["\n"]
}
```

#### Response

```json
{
  "content": " Paris, which is known for...",
  "stop": true,
  "tokens_predicted": 42,
  "tokens_evaluated": 8,
  "timings": {
    "prompt_n": 8,
    "predicted_n": 42,
    "predicted_per_second": 28.5
  }
}
```

---

### 3. Audio Transcription

**OpenAI-compatible** Whisper endpoint for speech-to-text.

```
POST /plugin?name=CodBi_AI_Proxy&endpoint=/v1/audio/transcriptions
```

#### Request

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Basic <base64(user:pass)>` |
| `Content-Type` | Yes | `multipart/form-data` |

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | Binary | Yes | Audio file (wav, mp3, mp4, m4a, webm, ogg) |
| `language` | String | No | ISO 639-1 language code (e.g. `de`, `en`). Auto-detected if omitted and `AutoDetectLanguage` is enabled. |

#### Response

```json
{
  "text": "Transcribed text content here."
}
```

---

### 4. OCR

Tesseract-based optical character recognition.

```
POST /plugin?name=CodBi_AI_Proxy&endpoint=/v1/ocr
```

#### Request

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Basic <base64(user:pass)>` |
| `Content-Type` | Yes | `multipart/form-data` |

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | Binary | Yes | Image file (PNG, JPEG, TIFF, BMP) |
| `language` | String | No | Override `AI_Tesseract_Languages` for this request (e.g. `eng+deu`) |

#### Response

```json
{
  "text": "Extracted text from the image."
}
```

---

## Specialist Models

Specialist models can be configured via plugin properties. Each specialist receives its own server instance (port offset +200) and can be invoked via the Chat Completions endpoint by specifying the specialist in the system message or through internal routing.

See [OPERATIONS.md](OPERATIONS.md) §2.3 for specialist configuration properties.

---

## Timeouts

| Mode | Timeout | Notes |
|------|---------|-------|
| Normal inference | 300s | Standard chat/completion |
| Thinking mode | 600s | Extended reasoning with `X-Thinking: true` |
| Whisper | 300s | Audio transcription |
| Tesseract | 60s | OCR processing |

---

## Rate Limiting & Concurrency

- Global concurrency limit: configurable via `AI_LLAMA_ENGINE_MaxConcurrent` (default: 2)
- Fair FIFO queue: requests are granted permits in arrival order
- Queue position is trackable — clients polling the main form UI see a badge with their position
- Resource gating: requests may be deferred when CPU/RAM/GPU exceed configured thresholds

---

## Integration Example

### cURL

```bash
# Chat completion
curl -X POST "https://formcycle.example.com/plugin?name=CodBi_AI_Proxy&endpoint=/v1/chat/completions" \
  -H "Authorization: Basic $(echo -n 'alice:secretpass' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 256
  }'

# Audio transcription
curl -X POST "https://formcycle.example.com/plugin?name=CodBi_AI_Proxy&endpoint=/v1/audio/transcriptions" \
  -H "Authorization: Basic $(echo -n 'alice:secretpass' | base64)" \
  -F "file=@recording.wav" \
  -F "language=de"

# OCR
curl -X POST "https://formcycle.example.com/plugin?name=CodBi_AI_Proxy&endpoint=/v1/ocr" \
  -H "Authorization: Basic $(echo -n 'alice:secretpass' | base64)" \
  -F "file=@document.png"
```

### Python

```python
import requests

response = requests.post(
    "https://formcycle.example.com/plugin",
    params={"name": "CodBi_AI_Proxy", "endpoint": "/v1/chat/completions"},
    auth=("alice", "secretpass"),
    json={
        "messages": [{"role": "user", "content": "Summarize this document."}],
        "max_tokens": 1024
    }
)
print(response.json()["choices"][0]["message"]["content"])
```
