---
id: server_db_categoryTemplates
title: "server/db/categoryTemplates.ts"
layer: db
domain: system
file: "server/db/categoryTemplates.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/categoryTemplates.ts

> **Ubicación:** `server/db/categoryTemplates.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: dbGetCategoryTemplates, dbUpsertCategoryTemplate.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_category_pitch_templates|tabla category_pitch_templates]] *(Layer: #schema, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*
- [[server_utils_templateOptimizer|server/utils/templateOptimizer.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
