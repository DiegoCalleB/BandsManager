---
id: src_app_AppModalsHost
title: "src/app/AppModalsHost.tsx"
layer: service
domain: system
file: "src/app/AppModalsHost.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/app/AppModalsHost.tsx

> **Ubicación:** `src/app/AppModalsHost.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Modales globales cargados bajo demanda, chat flotante, estudio y avisos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_AppContext|src/app/AppContext.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_SaveErrorBanner|src/components/SaveErrorBanner.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_booking_DealSupportPrompt|src/components/booking/DealSupportPrompt.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_AppShell|src/app/AppShell.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
