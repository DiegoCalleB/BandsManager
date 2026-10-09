---
id: server_utils_bandDna
title: "server/utils/bandDna.ts"
layer: service
domain: system
file: "server/utils/bandDna.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/bandDna.ts

> **Ubicación:** `server/utils/bandDna.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: BandDnaProfile, isCampaignActive, resolveMinCacheByType, getBandDnaProfile, buildEnhancedPitchSystemPrompt, buildReplySystemPrompt, formatReplyFewShotForPrompt, generateSmartDnaPitchFallback.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_leadLanguage|server/utils/leadLanguage.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_promptGuidelines|server/utils/promptGuidelines.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/bandDna.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
