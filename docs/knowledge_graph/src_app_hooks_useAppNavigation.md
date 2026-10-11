---
id: src_app_hooks_useAppNavigation
title: "src/app/hooks/useAppNavigation.ts"
layer: service
domain: system
file: "src/app/hooks/useAppNavigation.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/app/hooks/useAppNavigation.ts

> **Ubicación:** `src/app/hooks/useAppNavigation.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Vista actual, navegación, notificaciones y sección del CRM.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_appViews|src/app/appViews.ts]] *(Layer: #service, Domain: #system)*
- [[src_config_navGroups|src/config/navGroups.tsx]] *(Layer: #service, Domain: #system)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_hooks_useBrowserPushNotifications|src/hooks/useBrowserPushNotifications.ts]] *(Layer: #hook, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_moduloGlobal|src/utils/moduloGlobal.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
