---
id: src_utils_calendarViewPreferences
title: "src/utils/calendarViewPreferences.ts"
layer: service
domain: system
file: "src/utils/calendarViewPreferences.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/calendarViewPreferences.ts

> **Ubicación:** `src/utils/calendarViewPreferences.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: CALENDAR_DEFAULT_MONTHS_KEY, CALENDAR_DEVICE_KEY_PREFIX, DeviceType, CalendarMonthsView, detectDeviceType, getCalendarDefaultMonths, setCalendarDefaultMonths, syncCalendarPreferencesFromUser.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(from #frontend)*
- [[src_utils_userPreferences|src/utils/userPreferences.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/calendarViewPreferences.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
