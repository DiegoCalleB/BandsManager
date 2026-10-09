---
id: server_promptsManager
title: "server/promptsManager.ts"
layer: service
domain: system
file: "server/promptsManager.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/promptsManager.ts

> **Ubicación:** `server/promptsManager.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: getGlobalPitchFeedbackSummary, formatGlobalPitchFeedbackForPrompt, TemplateFeedbackLog, mapLeadTipoToTemplateCategory, DEFAULT_CATEGORY_TEMPLATES, ensureCategoryTemplatesInState.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_promptGuidelines|server/utils/promptGuidelines.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(from #db)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(from #route)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(from #service)*
- [[server_utils_templateOptimizer|server/utils/templateOptimizer.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
