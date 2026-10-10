---
id: src_app_hooks_useNavState
title: "src/app/hooks/useNavState.ts"
layer: service
domain: system
file: "src/app/hooks/useNavState.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/app/hooks/useNavState.ts

> **Ubicación:** `src/app/hooks/useNavState.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Insignias, grupos abiertos y eventos de la banda activa para la navegación.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_config_navGroups|src/config/navGroups.tsx]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
