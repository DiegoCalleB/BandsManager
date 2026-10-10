---
id: src_app_AppContext
title: "src/app/AppContext.ts"
layer: service
domain: system
file: "src/app/AppContext.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/app/AppContext.ts

> **Ubicación:** `src/app/AppContext.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto de la aplicación: reparte el estado del controlador a la puerta de entrada y al armazón.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_ActiveViewRouter|src/app/ActiveViewRouter.tsx]] *(from #service)*
- [[src_app_AppGate|src/app/AppGate.tsx]] *(from #service)*
- [[src_app_AppMainContent|src/app/AppMainContent.tsx]] *(from #service)*
- [[src_app_AppModalsHost|src/app/AppModalsHost.tsx]] *(from #service)*
- [[src_app_AppProvider|src/app/AppProvider.tsx]] *(from #service)*
- [[src_app_AppShell|src/app/AppShell.tsx]] *(from #service)*
- [[src_app_DesktopSidebar|src/app/DesktopSidebar.tsx]] *(from #service)*
- [[src_app_MobileBottomTabBar|src/app/MobileBottomTabBar.tsx]] *(from #service)*
- [[src_app_MobileDrawer|src/app/MobileDrawer.tsx]] *(from #service)*
- [[src_app_MobileGroupSheet|src/app/MobileGroupSheet.tsx]] *(from #service)*
- [[src_app_MobileTopBar|src/app/MobileTopBar.tsx]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/app/__tests__/appContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
