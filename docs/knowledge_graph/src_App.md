---
id: src_App
title: "src/App.tsx"
layer: frontend
domain: system
file: "src/App.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/App.tsx

> **Ubicación:** `src/App.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Aplicación raíz: orquesta controlador, contexto, puerta de entrada y armazón interno.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_AppGate|src/app/AppGate.tsx]] *(Layer: #service, Domain: #system)*
- [[src_app_AppProvider|src/app/AppProvider.tsx]] *(Layer: #service, Domain: #system)*
- [[src_app_AppShell|src/app/AppShell.tsx]] *(Layer: #service, Domain: #system)*
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_main|src/main.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
