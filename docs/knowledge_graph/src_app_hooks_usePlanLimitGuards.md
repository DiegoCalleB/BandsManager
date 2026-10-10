---
id: src_app_hooks_usePlanLimitGuards
title: "src/app/hooks/usePlanLimitGuards.ts"
layer: service
domain: system
file: "src/app/hooks/usePlanLimitGuards.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/app/hooks/usePlanLimitGuards.ts

> **Ubicación:** `src/app/hooks/usePlanLimitGuards.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Altas de leads y fans con control de límites del plan.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
