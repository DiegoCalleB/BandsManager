---
id: server_services_pitchJudge
title: "server/services/pitchJudge.ts"
layer: service
domain: booking
file: "server/services/pitchJudge.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/pitchJudge.ts

> **Ubicación:** `server/services/pitchJudge.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
PITCH JUDGE — EVALUADOR LLM-AS-A-JUDGE Y AUTO-REFINAMIENTO QUIRÚRGICO

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
