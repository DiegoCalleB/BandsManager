---
id: src_app_AppGate
title: "src/app/AppGate.tsx"
layer: service
domain: system
file: "src/app/AppGate.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/app/AppGate.tsx

> **Ubicación:** `src/app/AppGate.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Puerta de entrada de la aplicación: rutas públicas (fans, EPK, ofertas, landings), login y,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_AppContext|src/app/AppContext.ts]] *(Layer: #service, Domain: #system)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
