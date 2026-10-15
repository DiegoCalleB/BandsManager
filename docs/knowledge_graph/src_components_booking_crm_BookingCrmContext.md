---
id: src_components_booking_crm_BookingCrmContext
title: "src/components/booking/crm/BookingCrmContext.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/BookingCrmContext.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/BookingCrmContext.ts

> **Ubicación:** `src/components/booking/crm/BookingCrmContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Contexto del CRM de booking: reparte estado y acciones del controlador a las vistas de la pantalla.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(Layer: #frontend, Domain: #booking)*
- [[ui_booking_crm|Booking CRM Component]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_ActiveFiltersBar|src/components/booking/crm/ActiveFiltersBar.tsx]] *(from #frontend)*
- [[src_components_booking_crm_BookingCrmProvider|src/components/booking/crm/BookingCrmProvider.tsx]] *(from #frontend)*
- [[src_components_booking_crm_BulkActionsSection|src/components/booking/crm/BulkActionsSection.tsx]] *(from #frontend)*
- [[src_components_booking_crm_CrmModalsHost|src/components/booking/crm/CrmModalsHost.tsx]] *(from #frontend)*
- [[src_components_booking_crm_EnrichBanner|src/components/booking/crm/EnrichBanner.tsx]] *(from #frontend)*
- [[src_components_booking_crm_FiltersPanelSection|src/components/booking/crm/FiltersPanelSection.tsx]] *(from #frontend)*
- [[src_components_booking_crm_HeaderTitleAndActions|src/components/booking/crm/HeaderTitleAndActions.tsx]] *(from #frontend)*
- [[src_components_booking_crm_ListOrMapArea|src/components/booking/crm/ListOrMapArea.tsx]] *(from #frontend)*
- [[src_components_booking_crm_MobileCreateFab|src/components/booking/crm/MobileCreateFab.tsx]] *(from #frontend)*
- [[src_components_booking_crm_MobileToolsPanel|src/components/booking/crm/MobileToolsPanel.tsx]] *(from #frontend)*
- [[src_components_booking_crm_MorningBriefingSection|src/components/booking/crm/MorningBriefingSection.tsx]] *(from #frontend)*
- [[src_components_booking_crm_RouteAnchorBanner|src/components/booking/crm/RouteAnchorBanner.tsx]] *(from #frontend)*
- [[src_components_booking_crm_SearchAndViewRow|src/components/booking/crm/SearchAndViewRow.tsx]] *(from #frontend)*
- [[src_components_booking_crm_StatusTabsBar|src/components/booking/crm/StatusTabsBar.tsx]] *(from #frontend)*
- [[src_components_booking_crm_TemplatesConfigCard|src/components/booking/crm/TemplatesConfigCard.tsx]] *(from #frontend)*
- [[src_components_booking_crm_VenueWorkspaceHost|src/components/booking/crm/VenueWorkspaceHost.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/crm/__tests__/bookingCrmContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
