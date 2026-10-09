---
id: sec_prompt_safety
title: "Prompt Injection Sanitizer"
layer: security
domain: system
file: "server/utils/promptSafety.ts"
tags: ["security", "owasp-llm", "prompt-safety"]
---

# 📌 Prompt Injection Sanitizer

> **Ubicación:** `server/utils/promptSafety.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/system`

## 📖 Descripción
Sanitiza datos externos de salas y correos entrantes antes de inyectarlos en prompts de IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_lector|Lector Agent (Listener)]] *(Layer: #agent, Domain: #booking)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_services_pitchJudge|server/services/pitchJudge.ts]] *(from #service)*
- [[server_services_sentimentAnalysis|server/services/sentimentAnalysis.ts]] *(from #service)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(from #service)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/pitchJudgeAndVectorStore.test.ts`
- `server/utils/__tests__/promptSafety.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
