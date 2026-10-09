---
id: server_utils_planLimits
title: "server/utils/planLimits.ts"
layer: service
domain: system
file: "server/utils/planLimits.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/planLimits.ts

> **Ubicación:** `server/utils/planLimits.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Límites de plan por tipo de registro, en espejo de src/utils/planPermissions.ts. Hasta ahora

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
