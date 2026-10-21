---
id: src_utils_permisosDireccion
title: "src/utils/permisosDireccion.ts"
layer: service
domain: system
file: "src/utils/permisosDireccion.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/permisosDireccion.ts

> **Ubicación:** `src/utils/permisosDireccion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Conciertos y giras son cosa de la dirección (líder o admin), igual que en el servidor (`requireLeader`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_views_CalendarTitleBar|src/components/calendar/views/CalendarTitleBar.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourManagerHeader|src/components/tour_manager/TourManagerHeader.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/permisosDireccion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
