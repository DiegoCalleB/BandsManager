---
id: service_pitch_engine
title: "Pitch Engine & Multi-Model Routing"
layer: service
domain: booking
file: "server/services/pitchEngine.ts"
tags: ["service", "ai", "multi-model"]
---

# 📌 Pitch Engine & Multi-Model Routing

> **Ubicación:** `server/services/pitchEngine.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Motor de IA generativa con fallback automático Gemini ➔ DeepSeek ➔ OpenAI.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(from #security)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
