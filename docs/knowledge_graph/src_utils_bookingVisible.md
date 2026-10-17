---
id: src_utils_bookingVisible
title: "src/utils/bookingVisible.ts"
layer: service
domain: booking
file: "src/utils/bookingVisible.ts"
tags: ["service", "booking", "auto"]
---

# 📌 src/utils/bookingVisible.ts

> **Ubicación:** `src/utils/bookingVisible.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
El booking (salas, medios, management y grupos aliados: todo lo que sale de los leads) es

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_DesktopSidebar|src/app/DesktopSidebar.tsx]] *(from #service)*
- [[src_app_hooks_useAppNavigation|src/app/hooks/useAppNavigation.ts]] *(from #service)*
- [[src_app_MobileDrawer|src/app/MobileDrawer.tsx]] *(from #service)*
- [[src_app_MobileGroupSheet|src/app/MobileGroupSheet.tsx]] *(from #service)*
- [[src_components_common_NavGroupSection|src/components/common/NavGroupSection.tsx]] *(from #frontend)*
- [[src_components_dashboard_AddWidgetModal|src/components/dashboard/AddWidgetModal.tsx]] *(from #frontend)*
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/bookingVisible.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
