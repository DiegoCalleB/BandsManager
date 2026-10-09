---
id: server_utils_setlistImport
title: "server/utils/setlistImport.ts"
layer: service
domain: repertoire
file: "server/utils/setlistImport.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/setlistImport.ts

> **Ubicación:** `server/utils/setlistImport.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: ParsedSetlistItemType, ParsedSetlistItem, ParsedSetlistResult, extractJsonFromAiText, parseRawSetlistAIResponse, parseSetlistFromFile.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_perfectSetlistPlanner|server/utils/perfectSetlistPlanner.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/setlistImport.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
