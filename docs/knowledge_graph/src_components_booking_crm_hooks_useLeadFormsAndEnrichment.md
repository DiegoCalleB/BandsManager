---
id: src_components_booking_crm_hooks_useLeadFormsAndEnrichment
title: "src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts

> **Ubicación:** `src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Formulario de nuevo lead, logo, estado del rastreo, email manual, simulación y enriquecimiento de direcciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[src_components_booking_crm_crmTypes|src/components/booking/crm/crmTypes.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_hooks_useNegotiationSimulation|src/hooks/useNegotiationSimulation.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
