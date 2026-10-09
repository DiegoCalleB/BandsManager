---
id: server_utils_perfectSetlistPlanner
title: "server/utils/perfectSetlistPlanner.ts"
layer: service
domain: repertoire
file: "server/utils/perfectSetlistPlanner.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/perfectSetlistPlanner.ts

> **Ubicación:** `server/utils/perfectSetlistPlanner.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: PerfectSetlistActionType, BLOCK_TYPES, PerfectSetlistAction, PerfectSetlistPlan, extractJsonFromAiText, parseRawPerfectSetlistPlanAIResponse, generateRuleBasedFallbackPlan, generatePerfectSetlistPlan.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandStyleContext|server/utils/bandStyleContext.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_utils_setlistImport|server/utils/setlistImport.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
