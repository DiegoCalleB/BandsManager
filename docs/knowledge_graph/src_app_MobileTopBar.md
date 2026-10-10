---
id: src_app_MobileTopBar
title: "src/app/MobileTopBar.tsx"
layer: service
domain: system
file: "src/app/MobileTopBar.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/app/MobileTopBar.tsx

> **Ubicación:** `src/app/MobileTopBar.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Cabecera móvil con marca y menú.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_AppContext|src/app/AppContext.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_notifications_NotificationCenterBell|src/components/notifications/NotificationCenterBell.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_AppShell|src/app/AppShell.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
