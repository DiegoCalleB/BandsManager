---
id: server_routes_leads
title: "server/routes/leads.ts"
layer: route
domain: booking
file: "server/routes/leads.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads.ts

> **Ubicación:** `server/routes/leads.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Agregador del dominio leads: monta los sub-routers de `./leads/` y reexporta

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_emailValidation|server/routes/leads/emailValidation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_feedback|server/routes/leads/feedback.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_import|server/routes/leads/import.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
