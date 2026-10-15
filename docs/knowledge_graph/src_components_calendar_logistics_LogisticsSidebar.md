---
id: src_components_calendar_logistics_LogisticsSidebar
title: "src/components/calendar/logistics/LogisticsSidebar.tsx"
layer: frontend
domain: system
file: "src/components/calendar/logistics/LogisticsSidebar.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/logistics/LogisticsSidebar.tsx

> **Ubicación:** `src/components/calendar/logistics/LogisticsSidebar.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Barra lateral de logística del calendario: día libre con agenda o detalle del evento con sus pestañas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_CalendarContext|src/components/calendar/CalendarContext.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_logistics_EventDetailPanel|src/components/calendar/logistics/EventDetailPanel.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_logistics_FreeDayCampaigns|src/components/calendar/logistics/FreeDayCampaigns.tsx]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_views_CalendarOverlays|src/components/calendar/views/CalendarOverlays.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/calendar/logistics/__tests__/logisticsSidebarContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
