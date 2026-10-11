---
id: server_routes_leads_tiposScout
title: "server/routes/leads/tiposScout.ts"
layer: route
domain: booking
file: "server/routes/leads/tiposScout.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/tiposScout.ts

> **Ubicación:** `server/routes/leads/tiposScout.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tipos de las respuestas externas que manejan el Scout y el enriquecimiento de leads

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
