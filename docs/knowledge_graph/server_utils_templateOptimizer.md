---
id: server_utils_templateOptimizer
title: "server/utils/templateOptimizer.ts"
layer: service
domain: system
file: "server/utils/templateOptimizer.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/templateOptimizer.ts

> **Ubicación:** `server/utils/templateOptimizer.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: CATEGORY_LABELS, AUTO_OPTIMIZE_FEEDBACK_THRESHOLD, countUnoptimizedFeedback, resolveBandNameAndBio, buildTemplateOptimizationPrompt, OptimizedTemplateResult, generateOptimizedCategoryTemplate, CampaignContextData.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(Layer: #db, Domain: #system)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*
- [[server_routes_leads_feedback|server/routes/leads/feedback.ts]] *(Layer: #route, Domain: #booking)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
