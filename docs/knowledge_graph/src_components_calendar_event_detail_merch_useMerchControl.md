---
id: src_components_calendar_event_detail_merch_useMerchControl
title: "src/components/calendar/event_detail/merch/useMerchControl.ts"
layer: frontend
domain: finances
file: "src/components/calendar/event_detail/merch/useMerchControl.ts"
tags: ["frontend", "finances", "auto"]
---

# 📌 src/components/calendar/event_detail/merch/useMerchControl.ts

> **Ubicación:** `src/components/calendar/event_detail/merch/useMerchControl.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/finances`

## 📖 Descripción
Control de merchandising del bolo seleccionado y sus totales derivados (stock, venta teórica, cuadre de caja).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_event_detail_EventDetailContext|src/components/calendar/event_detail/EventDetailContext.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_event_detail_merch_MerchCashPanel|src/components/calendar/event_detail/merch/MerchCashPanel.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_merch_MerchItemsTable|src/components/calendar/event_detail/merch/MerchItemsTable.tsx]] *(from #frontend)*
- [[src_components_calendar_event_detail_merch_MerchKpiGrid|src/components/calendar/event_detail/merch/MerchKpiGrid.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
