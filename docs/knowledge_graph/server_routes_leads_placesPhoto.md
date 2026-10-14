---
id: server_routes_leads_placesPhoto
title: "server/routes/leads/placesPhoto.ts"
layer: route
domain: booking
file: "server/routes/leads/placesPhoto.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/placesPhoto.ts

> **Ubicación:** `server/routes/leads/placesPhoto.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
GET /api/places/photo: foto de Google Places sin exponer la API key (ver server/utils/placesPhoto.ts).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_utils_placesPhoto|server/utils/placesPhoto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*
- [[server_utils_placesPhoto|server/utils/placesPhoto.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
