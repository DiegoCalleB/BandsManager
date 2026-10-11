---
id: src_app_DesktopSidebar
title: "src/app/DesktopSidebar.tsx"
layer: service
domain: system
file: "src/app/DesktopSidebar.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/app/DesktopSidebar.tsx

> **Ubicación:** `src/app/DesktopSidebar.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Barra lateral de escritorio con navegación, campañas y perfil.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_AppContext|src/app/AppContext.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_appViews|src/app/appViews.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_common_NavGroupSection|src/components/common/NavGroupSection.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_NavItemButton|src/components/common/NavItemButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ThemeToggle|src/components/common/ThemeToggle.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_AiUsageSupportWidget|src/components/dashboard/AiUsageSupportWidget.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_notifications_NotificationCenterBell|src/components/notifications/NotificationCenterBell.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_config_navGroups|src/config/navGroups.tsx]] *(Layer: #service, Domain: #system)*
- [[src_utils_contrastText|src/utils/contrastText.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_AppShell|src/app/AppShell.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
