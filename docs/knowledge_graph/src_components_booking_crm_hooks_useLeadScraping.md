---
id: src_components_booking_crm_hooks_useLeadScraping
title: "src/components/booking/crm/hooks/useLeadScraping.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/hooks/useLeadScraping.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/hooks/useLeadScraping.ts

> **Ubicación:** `src/components/booking/crm/hooks/useLeadScraping.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Rastreo web de salas (modal y lead seleccionado), aplicación de datos rastreados y alta de nuevos leads.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[src_components_booking_crm_crmTypes|src/components/booking/crm/crmTypes.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
