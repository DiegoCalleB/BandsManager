---
id: server_utils_setlistAIAnalyzer
title: "server/utils/setlistAIAnalyzer.ts"
layer: service
domain: repertoire
file: "server/utils/setlistAIAnalyzer.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/setlistAIAnalyzer.ts

> **Ubicación:** `server/utils/setlistAIAnalyzer.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: AISetlistSuggestion, AdvancedSetlistAnalysis, analyzeSetlistWithAI.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandStyleContext|server/utils/bandStyleContext.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
