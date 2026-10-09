---
id: server_utils_spanishFestivalsDB
title: "server/utils/spanishFestivalsDB.ts"
layer: service
domain: system
file: "server/utils/spanishFestivalsDB.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/spanishFestivalsDB.ts

> **Ubicación:** `server/utils/spanishFestivalsDB.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Base de datos local de festivales españoles con fechas históricas

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
