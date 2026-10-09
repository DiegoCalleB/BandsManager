---
id: server_routes_leads_helpers
title: "server/routes/leads/helpers.ts"
layer: route
domain: booking
file: "server/routes/leads/helpers.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/helpers.ts

> **Ubicación:** `server/routes/leads/helpers.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Helper to check if URL is a generic directory or social profile instead of official venue site

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
