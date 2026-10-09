---
id: server_utils_festivalDateFilter
title: "server/utils/festivalDateFilter.ts"
layer: service
domain: system
file: "server/utils/festivalDateFilter.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/festivalDateFilter.ts

> **Ubicación:** `server/utils/festivalDateFilter.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: parseFlexibleDate, datesOverlap, filterLeadsByActiveCampaign, formatFestivalDateRange.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/festivalDateFilter.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
