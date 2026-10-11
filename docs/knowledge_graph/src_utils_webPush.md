---
id: src_utils_webPush
title: "src/utils/webPush.ts"
layer: service
domain: system
file: "src/utils/webPush.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/webPush.ts

> **Ubicación:** `src/utils/webPush.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: triggerNativeMobileNotification.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_hooks_useEventReminder|src/components/calendar/hooks/useEventReminder.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useEventShareActions|src/components/calendar/hooks/useEventShareActions.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
