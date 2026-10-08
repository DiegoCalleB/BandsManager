---
name: omniroute
description: Open-source AI gateway integration, multi-model fallback, quota-aware routing, and unified AI provider orchestration for coding agents and LLM services.
---

# 🔀 OmniRoute Skill

AI Model Gateway, Quota Management, and Multi-Provider Routing Patterns for AI Agents.

---

## 🎯 Purpose & Scope

OmniRoute standardizes how AI agents and backend services route LLM requests across multiple AI providers (Gemini, OpenAI, DeepSeek, Anthropic, OpenRouter) with automatic quota awareness, tier calculation, and fail-safe fallback.

---

## 🏗️ Architectural Patterns for Multi-Model Fallback

In BandManager.io, AI services (pitch generation, reply drafting, sentiment analysis, audio composition) operate on resilient multi-model routing:

```
                      [User / Agent Action]
                                │
                                ▼
                   [Primary Model: Gemini 2.5 / 3.0]
                                │
                      (Rate limit / Quota error?)
                                │
                   ┌────────────┴────────────┐
                   ▼                         ▼
        [Fallback 1: DeepSeek]     [Fallback 2: OpenAI]
                   │                         │
                   └────────────┬────────────┘
                                ▼
                 [Safe Degradation / Cached Pitch]
```

---

## 🛡️ Implementation Rules for BandManager.io

1. **Quota & Rate-Limiting Protection:** All external AI requests must pass through `server/middleware/rateLimiter.ts` (`iaRateLimiter`).
2. **Server-Side Proxy Only:** Never expose raw API keys or direct LLM endpoints to the frontend. All calls route through Express endpoints (`/api/*`).
3. **Structured Fallback Handling:** Always catch API quota errors (`429`, `503`, token exhaustion) and cleanly degrade to secondary models or offline templates without crashing the request.
4. **Band Quota Isolation:** AI credit consumption must be validated against the band's plan (`server/routes/billing.ts`) before initiating LLM requests.

---

## ✅ OmniRoute Pre-Flight Checklist

- [ ] Is there an automated fallback in place if the primary LLM provider fails?
- [ ] Are all API keys secured on the backend via environment variables?
- [ ] Is `iaRateLimiter` applied to the endpoint?
- [ ] Does the response gracefully handle provider timeouts?
