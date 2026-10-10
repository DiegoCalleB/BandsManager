---
id: src_components_booking_crm_crmTypes
title: "src/components/booking/crm/crmTypes.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/crmTypes.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/crmTypes.ts

> **Ubicación:** `src/components/booking/crm/crmTypes.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tipos de respuestas de la API usadas por el CRM de booking.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useLeadEditing|src/components/booking/crm/hooks/useLeadEditing.ts]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useLeadFormsAndEnrichment|src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useLeadScraping|src/components/booking/crm/hooks/useLeadScraping.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
