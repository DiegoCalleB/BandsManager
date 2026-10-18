---
id: src_app_ActiveViewRouter
title: "src/app/ActiveViewRouter.tsx"
layer: service
domain: system
file: "src/app/ActiveViewRouter.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/app/ActiveViewRouter.tsx

> **Ubicación:** `src/app/ActiveViewRouter.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Vista activa de la aplicación interna (resumen, CRM, calendario, repertorio…).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_AppContext|src/app/AppContext.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ErrorBoundary|src/components/ErrorBoundary.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_Skeleton|src/components/ui/Skeleton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_AppMainContent|src/app/AppMainContent.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
