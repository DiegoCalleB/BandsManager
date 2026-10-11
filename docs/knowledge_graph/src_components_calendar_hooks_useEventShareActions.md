---
id: src_components_calendar_hooks_useEventShareActions
title: "src/components/calendar/hooks/useEventShareActions.ts"
layer: frontend
domain: system
file: "src/components/calendar/hooks/useEventShareActions.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/calendar/hooks/useEventShareActions.ts

> **Ubicación:** `src/components/calendar/hooks/useEventShareActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Hoja de ruta, texto para compartir, copia de la ficha, aviso a la banda y borrado del evento.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_calendar_calendarTypes|src/components/calendar/calendarTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_calendar_useCalendarRoadbook|src/components/calendar/useCalendarRoadbook.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_weatherService|src/services/weatherService.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_webPush|src/utils/webPush.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
