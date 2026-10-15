---
id: src_components_booking_crm_CrmModalsHost
title: "src/components/booking/crm/CrmModalsHost.tsx"
layer: frontend
domain: booking
file: "src/components/booking/crm/CrmModalsHost.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/CrmModalsHost.tsx

> **Ubicación:** `src/components/booking/crm/CrmModalsHost.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Modales del CRM: simulación, alta, explorador de lugares, importación, enriquecimiento, autonomía, exportación, duplicados, roadbook, cola, progreso masivo y tutorial.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_AddLeadModal|src/components/booking/AddLeadModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_AgentQueueMonitorModal|src/components/booking/AgentQueueMonitorModal.tsx]] *(Layer: #agent, Domain: #booking)*
- [[src_components_booking_BulkProgressModal|src/components/booking/BulkProgressModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_CRMContactEnricherModal|src/components/booking/CRMContactEnricherModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_ExcelImportModal|src/components/booking/ExcelImportModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_ExportLeadsModal|src/components/booking/ExportLeadsModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_GooglePlacesExplorerModal|src/components/booking/GooglePlacesExplorerModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_LeadDuplicatesModal|src/components/booking/LeadDuplicatesModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_NegotiationSimulationModal|src/components/booking/NegotiationSimulationModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_RoadbookContractModal|src/components/booking/RoadbookContractModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_BookingCrmContext|src/components/booking/crm/BookingCrmContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_crmTheme|src/components/booking/crm/crmTheme.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_ModuleTutorialModal|src/components/common/ModuleTutorialModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(Layer: #agent, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_BookingCrmLayout|src/components/booking/crm/BookingCrmLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
