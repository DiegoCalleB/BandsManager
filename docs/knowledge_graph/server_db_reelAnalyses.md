---
id: server_db_reelAnalyses
title: "server/db/reelAnalyses.ts"
layer: db
domain: social
file: "server/db/reelAnalyses.ts"
tags: ["db", "social", "auto"]
---

# 📌 server/db/reelAnalyses.ts

> **Ubicación:** `server/db/reelAnalyses.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/social`

## 📖 Descripción
Exporta: ReelAnalysisRecord, dbGetReelAnalysis, dbUpsertReelAnalysis, dbUpdateReelAnalysisHighlight.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_reel_analyses|tabla reel_analyses]] *(Layer: #schema, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
