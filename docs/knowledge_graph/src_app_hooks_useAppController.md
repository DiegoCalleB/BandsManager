---
id: src_app_hooks_useAppController
title: "src/app/hooks/useAppController.ts"
layer: service
domain: system
file: "src/app/hooks/useAppController.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/app/hooks/useAppController.ts

> **Ubicación:** `src/app/hooks/useAppController.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Controlador de la aplicación: sesión, datos, banda activa, navegación, tema y estado del armazón.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[hook_app_data|useAppData Hook]] *(Layer: #hook, Domain: #system)*
- [[src_app_hooks_useActiveBand|src/app/hooks/useActiveBand.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_hooks_useAppNavigation|src/app/hooks/useAppNavigation.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_hooks_useAppTheme|src/app/hooks/useAppTheme.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_hooks_useGlobalStudio|src/app/hooks/useGlobalStudio.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_app_hooks_useHashRoute|src/app/hooks/useHashRoute.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_hooks_useNavState|src/app/hooks/useNavState.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_hooks_usePlanLimitGuards|src/app/hooks/usePlanLimitGuards.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_hooks_useShellState|src/app/hooks/useShellState.ts]] *(Layer: #service, Domain: #system)*
- [[src_config_navGroups|src/config/navGroups.tsx]] *(Layer: #service, Domain: #system)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_app_AppContext|src/app/AppContext.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
