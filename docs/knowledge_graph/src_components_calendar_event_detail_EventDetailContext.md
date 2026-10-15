---
id: src_components_calendar_event_detail_EventDetailContext
title: "src/components/calendar/event_detail/EventDetailContext.ts"
layer: frontend
domain: system
file: "src/components/calendar/event_detail/EventDetailContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/event_detail/EventDetailContext.ts

> **Ubicación:** `src/components/calendar/event_detail/EventDetailContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto de la ficha de evento del calendario: reparte props y estado local a las pestañas y bloques.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_CalendarEventDetailModal|src/components/calendar/CalendarEventDetailModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_event_detail_hooks_useEventDetailController|src/components/calendar/event_detail/hooks/useEventDetailController.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_event_detail_ClosingChecklistTab|src/components/calendar/event_detail/ClosingChecklistTab.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_DeleteConfirmPanel|src/components/calendar/event_detail/DeleteConfirmPanel.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_EventDetailLayout|src/components/calendar/event_detail/EventDetailLayout.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_EventDetailProvider|src/components/calendar/event_detail/EventDetailProvider.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_EventHeaderSection|src/components/calendar/event_detail/EventHeaderSection.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_EventTabsNav|src/components/calendar/event_detail/EventTabsNav.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_EventTopBar|src/components/calendar/event_detail/EventTopBar.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_EventWeatherSection|src/components/calendar/event_detail/EventWeatherSection.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_HolidayWarningSection|src/components/calendar/event_detail/HolidayWarningSection.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_KeyContactsTab|src/components/calendar/event_detail/KeyContactsTab.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_merch_MerchAddForm|src/components/calendar/event_detail/merch/MerchAddForm.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_merch_MerchCashPanel|src/components/calendar/event_detail/merch/MerchCashPanel.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_merch_MerchHeader|src/components/calendar/event_detail/merch/MerchHeader.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_merch_MerchItemsTable|src/components/calendar/event_detail/merch/MerchItemsTable.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_merch_MerchKpiGrid|src/components/calendar/event_detail/merch/MerchKpiGrid.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_merch_useMerchControl|src/components/calendar/event_detail/merch/useMerchControl.ts]] *(from #frontend)*
- [[src_components_calendar_event_detail_MerchandisingTab|src/components/calendar/event_detail/MerchandisingTab.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_OverviewTab|src/components/calendar/event_detail/OverviewTab.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_PostShowTab|src/components/calendar/event_detail/PostShowTab.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_TechnicalLogisticsTab|src/components/calendar/event_detail/TechnicalLogisticsTab.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/calendar/event_detail/__tests__/eventDetailContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
